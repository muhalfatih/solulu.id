import { and, asc, eq, gte } from "drizzle-orm"
import { db } from "@/db"
import {
  bookingReschedules,
  bookings,
  counselorServiceExclusions,
  counselors,
  schedules,
  services,
  sessionReports,
  zoomAccounts,
} from "@/db/schema"
import { isServiceOfferedBy } from "@/lib/services/pricing"
import { deleteZoomMeeting, getZoomAccessToken } from "@/lib/zoom/client"
import { fulfillSession } from "@/lib/fulfillment/fulfill"
import { getPlatformSettings } from "@/lib/settings/platform"
import { sessionStartAt } from "@/lib/booking-cycle"
import { MAX_BOOKING_HORIZON_DAYS, formatTimeRange } from "@/lib/schedules/concurrency"
import type { RescheduleDeps, RescheduleTx } from "./reschedule"

/** Production wiring of the reschedule ports: Drizzle transaction, Platform Settings, Dispatcher. */
export function createRescheduleDeps(): RescheduleDeps {
  return {
    transaction: (fn) =>
      db.transaction(async (trx) => {
        const tx: RescheduleTx = {
          loadBooking: async (ref) => {
            const where = ref.bookingId
              ? eq(bookings.id, ref.bookingId)
              : eq(bookings.accessToken, ref.accessToken ?? "")
            const [row] = await trx
              .select({
                id: bookings.id,
                accessToken: bookings.accessToken,
                status: bookings.status,
                counselorId: bookings.counselorId,
                scheduleId: bookings.scheduleId,
                rescheduleCount: bookings.rescheduleCount,
                adminRescheduleCount: bookings.adminRescheduleCount,
                scheduleDate: schedules.date,
                startTime: schedules.startTime,
                timerStartedAt: sessionReports.timerStartedAt,
                zoomMeetingId: bookings.zoomMeetingId,
                zoomAccountId: bookings.zoomAccountId,
              })
              .from(bookings)
              .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
              .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
              .where(where)
              .limit(1)
              .for("update", { of: bookings })
            return row ? { ...row, scheduleDate: row.scheduleDate === null ? null : String(row.scheduleDate) } : null
          },
          loadSlot: async (id) => {
            const [row] = await trx.select().from(schedules).where(eq(schedules.id, id)).limit(1)
            if (!row) return null
            return {
              id: row.id,
              counselorId: row.counselorId,
              date: String(row.date),
              startTime: row.startTime,
              status: row.status,
              isLeave: row.isLeave,
              reservedUntil: row.reservedUntil,
            }
          },
          counselorOffersBookingService: async (bookingId, counselorId) => {
            const [svc] = await trx
              .select({ id: services.id, isActive: services.isActive, allowedCounselorTypes: services.allowedCounselorTypes })
              .from(bookings)
              .innerJoin(services, eq(bookings.serviceId, services.id))
              .where(eq(bookings.id, bookingId))
              .limit(1)
            const [c] = await trx
              .select({ id: counselors.id, counselorType: counselors.counselorType })
              .from(counselors)
              .where(eq(counselors.id, counselorId))
              .limit(1)
            if (!svc || !c) return false
            const excluded = await trx
              .select({ serviceId: counselorServiceExclusions.serviceId })
              .from(counselorServiceExclusions)
              .where(eq(counselorServiceExclusions.counselorId, counselorId))
            // Booking lama sebelum Layanan ada: aturan tipe tetap berlaku, Layanan nonaktif tidak memblokir reschedule.
            return isServiceOfferedBy({ ...svc, isActive: true }, c, excluded.map((e) => e.serviceId))
          },
          claimSlot: async (id) => {
            const claimed = await trx
              .update(schedules)
              .set({ status: "booked", reservedUntil: null })
              .where(and(eq(schedules.id, id), eq(schedules.status, "available"), eq(schedules.isLeave, false)))
              .returning({ id: schedules.id })
            return claimed.length === 1
          },
          releaseSlot: async (id) => {
            await trx.update(schedules).set({ status: "available" }).where(eq(schedules.id, id))
          },
          updateBooking: async (id, values) => {
            await trx.update(bookings).set(values).where(eq(bookings.id, id))
          },
          insertHistory: async (row) => {
            await trx.insert(bookingReschedules).values(row)
          },
          audit: trx,
        }
        return fn(tx)
      }),
    getCutoffHours: async () => (await getPlatformSettings()).rescheduleCutoffHours,
    cancelZoomMeeting: async ({ meetingId, zoomAccountId }) => {
      if (!zoomAccountId) return
      const [account] = await db
        .select()
        .from(zoomAccounts)
        .where(eq(zoomAccounts.id, zoomAccountId))
        .limit(1)
      if (!account) return
      const accessToken = await getZoomAccessToken(account)
      await deleteZoomMeeting(accessToken, meetingId)
    },
    fulfill: (bookingId) => fulfillSession(bookingId),
  }
}

export interface RescheduleSlotOption {
  id: string
  counselorId: string
  date: string
  startTime: string
  endTime: string
  timeRange: string
}

/** Slot Available milik satu konselor yang masih di masa depan (jendela yang sama dengan booking publik). */
export async function listRescheduleSlots(counselorId: string, now: Date = new Date()): Promise<RescheduleSlotOption[]> {
  const today = new Date(now.getTime() + 7 * 3600_000).toISOString().slice(0, 10)
  const rows = await db
    .select()
    .from(schedules)
    .where(
      and(
        eq(schedules.counselorId, counselorId),
        eq(schedules.status, "available"),
        eq(schedules.isLeave, false),
        gte(schedules.date, today)
      )
    )
    .orderBy(asc(schedules.date), asc(schedules.startTime))
  const horizon = now.getTime() + MAX_BOOKING_HORIZON_DAYS * 86_400_000
  return rows
    .filter((r) => {
      const start = sessionStartAt(String(r.date), r.startTime).getTime()
      return start > now.getTime() && start <= horizon
    })
    .map((r) => ({
      id: r.id,
      counselorId: r.counselorId,
      date: String(r.date),
      startTime: r.startTime.slice(0, 5),
      endTime: r.endTime.slice(0, 5),
      timeRange: formatTimeRange(r.startTime, r.endTime),
    }))
}
