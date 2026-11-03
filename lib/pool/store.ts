import { and, count, eq, inArray, isNull, isNotNull, sql } from "drizzle-orm"
import { db } from "@/db"
import {
  bookings,
  counselorServiceExclusions,
  counselors,
  schedules,
  services,
} from "@/db/schema"
import { isPoolOfferable } from "@/lib/booking-cycle"
import { FIXED_SLOTS, getSlotByIndex } from "@/lib/schedules/slots"
import type { CounselorSlotContext, PoolBooking, PoolStore } from "./claim"

type Database = typeof db

/** Baris jadwal kosong dari konselor yang memenuhi syarat melayani Layanan di slot ini. */
function eligibleFreeScheduleWhere(date: string, slotIndex: number, serviceId: string) {
  return and(
    eq(schedules.date, date),
    eq(schedules.slotIndex, slotIndex),
    eq(schedules.status, "available"),
    eq(schedules.isLeave, false),
    eq(counselors.isActive, true),
    sql`${counselors.counselorType} = ANY (${services.allowedCounselorTypes})`,
    eq(services.id, serviceId),
    sql`NOT EXISTS (
      SELECT 1 FROM ${counselorServiceExclusions} x
      WHERE x.counselor_id = ${counselors.id} AND x.service_id = ${services.id}
    )`
  )
}

/** Apakah opsi Konselor Bebas boleh ditawarkan untuk slot + Layanan ini (ADR-0011). */
export async function getPoolOffer(
  input: { date: string; slotIndex: number; serviceId: string },
  database: Database = db
): Promise<{ offerable: boolean; poolBookings: number; eligibleCounselors: number }> {
  const [eligible] = await database
    .select({ n: count() })
    .from(schedules)
    .innerJoin(counselors, eq(schedules.counselorId, counselors.id))
    .innerJoin(services, eq(services.id, input.serviceId))
    .where(eligibleFreeScheduleWhere(input.date, input.slotIndex, input.serviceId))

  const [pool] = await database
    .select({ n: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.poolDate, input.date),
        eq(bookings.poolSlotIndex, input.slotIndex),
        isNull(bookings.counselorId),
        inArray(bookings.status, ["pending_payment", "confirmed"])
      )
    )

  const eligibleCounselors = eligible?.n ?? 0
  const poolBookings = pool?.n ?? 0
  return { offerable: isPoolOfferable({ poolBookings, eligibleCounselors }), poolBookings, eligibleCounselors }
}

export interface PoolQueueItem {
  bookingId: string
  bookingCode: string
  serviceName: string
  poolDate: string
  slotIndex: number
  startTime: string
  endTime: string
  status: string
}

/** Antrean booking pool terkonfirmasi yang belum diklaim, urut dari yang paling dekat. */
export async function listPoolQueue(
  filter: { counselorId?: string } = {},
  database: Database = db
): Promise<PoolQueueItem[]> {
  const rows = await database
    .select({
      bookingId: bookings.id,
      bookingCode: bookings.bookingCode,
      serviceName: services.name,
      serviceId: services.id,
      allowed: services.allowedCounselorTypes,
      poolDate: bookings.poolDate,
      slotIndex: bookings.poolSlotIndex,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        isNull(bookings.counselorId),
        isNotNull(bookings.poolDate),
        isNotNull(bookings.poolSlotIndex)
      )
    )
    .orderBy(bookings.poolDate, bookings.poolSlotIndex)

  let counselorType: string | null = null
  let excluded: string[] = []
  if (filter.counselorId) {
    const [c] = await database
      .select({ t: counselors.counselorType })
      .from(counselors)
      .where(eq(counselors.id, filter.counselorId))
      .limit(1)
    counselorType = c?.t ?? null
    excluded = await loadExcludedServiceIds(filter.counselorId, database)
  }

  const items: PoolQueueItem[] = []
  for (const r of rows) {
    const slot = getSlotByIndex(r.slotIndex ?? 0)
    if (!slot || !r.poolDate) continue
    if (filter.counselorId) {
      if (!counselorType || !r.allowed.includes(counselorType as "peer" | "psychologist")) continue
      if (excluded.includes(r.serviceId)) continue
      const ctx = await getCounselorContext(filter.counselorId, r.poolDate, r.slotIndex!, database)
      if (ctx.onLeave || !ctx.freeScheduleId) continue
    }
    items.push({
      bookingId: r.bookingId,
      bookingCode: r.bookingCode,
      serviceName: r.serviceName,
      poolDate: r.poolDate,
      slotIndex: slot.slotIndex,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: r.status,
    })
  }
  return items
}

/** Layanan yang Admin matikan untuk konselor ini (US18): booking pool-nya tidak boleh diklaim. */
async function loadExcludedServiceIds(counselorId: string, database: Database): Promise<string[]> {
  const rows = await database
    .select({ serviceId: counselorServiceExclusions.serviceId })
    .from(counselorServiceExclusions)
    .where(eq(counselorServiceExclusions.counselorId, counselorId))
  return rows.map((r) => r.serviceId)
}

async function getCounselorContext(
  counselorId: string,
  poolDate: string,
  slotIndex: number,
  database: Database
): Promise<CounselorSlotContext> {
  const [row] = await database
    .select({ schedule: schedules, type: counselors.counselorType })
    .from(schedules)
    .innerJoin(counselors, eq(schedules.counselorId, counselors.id))
    .where(
      and(eq(schedules.counselorId, counselorId), eq(schedules.date, poolDate), eq(schedules.slotIndex, slotIndex))
    )
    .limit(1)
  if (!row) return { typeAllowed: true, onLeave: false, freeScheduleId: null }
  return {
    typeAllowed: true,
    onLeave: row.schedule.isLeave,
    freeScheduleId: row.schedule.status === "available" && !row.schedule.isLeave ? row.schedule.id : null,
  }
}

class LostRace extends Error {}

export function createPoolStore(database: Database = db): PoolStore {
  return {
    async getBooking(bookingId): Promise<PoolBooking | null> {
      const [b] = await database.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
      if (!b || !b.poolDate || !b.poolSlotIndex) return null
      const slot = FIXED_SLOTS.find((s) => s.slotIndex === b.poolSlotIndex)
      if (!slot) return null
      return {
        id: b.id,
        status: b.status,
        counselorId: b.counselorId,
        poolDate: b.poolDate,
        startTime: slot.startTime,
      }
    },

    async getCounselorContext(counselorId, booking): Promise<CounselorSlotContext> {
      const [b] = await database
        .select({
          slot: bookings.poolSlotIndex,
          allowed: services.allowedCounselorTypes,
          serviceId: services.id,
        })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(bookings.id, booking.id))
        .limit(1)
      const [c] = await database
        .select({ type: counselors.counselorType, active: counselors.isActive })
        .from(counselors)
        .where(eq(counselors.id, counselorId))
        .limit(1)
      if (!b || !c || !c.active) return { typeAllowed: false, onLeave: false, freeScheduleId: null }
      const ctx = await getCounselorContext(counselorId, booking.poolDate, b.slot ?? 0, database)
      const excluded = await loadExcludedServiceIds(counselorId, database)
      return { ...ctx, typeAllowed: b.allowed.includes(c.type) && !excluded.includes(b.serviceId) }
    },

    async tryAssign(bookingId, counselorId, scheduleId, inTransaction): Promise<boolean> {
      try {
        await database.transaction(async (tx) => {
          // Pemenang ditentukan satu UPDATE bersyarat; yang kalah mendapat 0 baris.
          const claimed = await tx
            .update(bookings)
            .set({ counselorId, scheduleId })
            .where(
              and(eq(bookings.id, bookingId), isNull(bookings.counselorId), eq(bookings.status, "confirmed"))
            )
            .returning({ id: bookings.id })
          if (claimed.length === 0) throw new LostRace()

          const taken = await tx
            .update(schedules)
            .set({ status: "booked", reservedUntil: null })
            .where(
              and(
                eq(schedules.id, scheduleId),
                eq(schedules.counselorId, counselorId),
                eq(schedules.status, "available"),
                eq(schedules.isLeave, false)
              )
            )
            .returning({ id: schedules.id })
          if (taken.length === 0) throw new LostRace()
          if (inTransaction) await inTransaction(tx)
        })
        return true
      } catch (err) {
        if (err instanceof LostRace) return false
        throw err
      }
    },
  }
}

/**
 * Jumlah booking pool belum diklaim yang sesinya dimulai dalam `withinHours` jam, termasuk yang sudah
 * lewat cutoff dan yang jam sesinya sudah lewat (tanpa batas bawah): booking pool tanpa konselor tidak
 * pernah diarsipkan otomatis (lihat cron/cleanup), jadi tetap tampil di Perlu Tindakan sampai Admin
 * menugaskan atau membatalkan/refund secara manual.
 */
export async function countUnclaimedNearCutoff(
  withinHours: number,
  database: Database = db
): Promise<number> {
  const [row] = await database
    .select({ n: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        isNull(bookings.counselorId),
        isNotNull(bookings.poolDate),
        isNotNull(bookings.poolSlotIndex),
        sql`((${bookings.poolDate}::timestamp + make_interval(hours => 6 + 2 * ${bookings.poolSlotIndex})) AT TIME ZONE 'Asia/Jakarta') <= now() + make_interval(hours => ${withinHours})`
      )
    )
  return row?.n ?? 0
}

/** Konselor yang memenuhi syarat untuk ditugaskan Admin ke booking pool ini. */
export async function listAssignableCounselors(
  bookingId: string,
  database: Database = db
): Promise<{ id: string; fullName: string }[]> {
  const [b] = await database.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1)
  if (!b?.poolDate || !b.poolSlotIndex) return []
  const rows = await database
    .select({ id: counselors.id, fullName: counselors.fullName })
    .from(schedules)
    .innerJoin(counselors, eq(schedules.counselorId, counselors.id))
    .innerJoin(services, eq(services.id, b.serviceId))
    .where(eligibleFreeScheduleWhere(b.poolDate, b.poolSlotIndex, b.serviceId))
  return rows
}
