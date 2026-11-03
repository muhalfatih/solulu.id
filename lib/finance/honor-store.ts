import { and, eq, inArray, isNotNull, sql } from "drizzle-orm"
import { db } from "@/db"
import {
  bookings,
  counselorHonors,
  payrollPeriods,
  schedules,
  services,
  sessionReports,
} from "@/db/schema"
import type { HonorStore } from "./honor-sync"
import { HONOR_ELIGIBLE_STATUSES, type HonorSessionFacts, type PlannedHonorRow } from "./plan"
import { payrollPeriodFor } from "./period"

const CHUNK = 200

/**
 * Untuk ON CONFLICT DO UPDATE: pertahankan nilai kolom lama bila periode lama ATAU periode
 * baru dari bagian itu sudah berstatus closed, selain itu pakai nilai baru (excluded).
 */
function keepIfClosed(periodColumn: string, column: string) {
  const period = sql.raw(periodColumn)
  const col = sql.raw(column)
  return sql`CASE WHEN EXISTS (
    SELECT 1 FROM payroll_periods pp
    WHERE pp.status = 'closed'
      AND (pp.id = counselor_honors.${period} OR pp.id = excluded.${period})
  ) THEN counselor_honors.${col} ELSE excluded.${col} END`
}

function periodStartMaps(rows: { id: string; startDate: string }[]) {
  return {
    idToStart: new Map(rows.map((r) => [r.id, r.startDate])),
    startToId: new Map(rows.map((r) => [r.startDate, r.id])),
  }
}

/** Implementasi Drizzle dari HonorStore (Postgres via Supabase). */
export const drizzleHonorStore: HonorStore = {
  async loadSessionFacts(counselorId) {
    const conditions = [inArray(bookings.status, [...HONOR_ELIGIBLE_STATUSES])]
    if (counselorId) conditions.push(eq(bookings.counselorId, counselorId))

    const rows = await db
      .select({
        bookingId: bookings.id,
        bookingCode: bookings.bookingCode,
        counselorId: bookings.counselorId,
        serviceId: bookings.serviceId,
        serviceName: services.name,
        status: bookings.status,
        sessionDate: schedules.date,
        basePriceSnapshot: bookings.basePriceSnapshot,
        basePayoutPercent: services.basePayoutPercent,
        overtimePayoutPercent: services.overtimePayoutPercent,
        extensionFee: bookings.extensionFee,
        extensionPaymentStatus: bookings.extensionPaymentStatus,
        reportSubmittedAt: sessionReports.submittedAt,
      })
      .from(bookings)
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
      .where(and(...conditions, isNotNull(bookings.counselorId)))

    return rows.map(
      ({ reportSubmittedAt, counselorId, ...rest }): HonorSessionFacts => ({
        ...rest,
        counselorId: counselorId as string,
        hasReport: reportSubmittedAt !== null,
      })
    )
  },

  async loadExistingRows(counselorId) {
    const periods = await db
      .select({ id: payrollPeriods.id, startDate: payrollPeriods.startDate })
      .from(payrollPeriods)
    const { idToStart } = periodStartMaps(periods)

    const rows = await db
      .select()
      .from(counselorHonors)
      .where(counselorId ? eq(counselorHonors.counselorId, counselorId) : undefined)

    return rows.map(
      (r): PlannedHonorRow => ({
        bookingId: r.bookingId,
        counselorId: r.counselorId,
        serviceId: r.serviceId,
        sessionDate: r.sessionDate,
        baseAmount: Number(r.baseAmount),
        overtimeAmount: Number(r.overtimeAmount),
        basePayoutPercent: r.basePayoutPercent,
        overtimePayoutPercent: r.overtimePayoutPercent,
        basePeriodStart: r.basePeriodId ? (idToStart.get(r.basePeriodId) ?? null) : null,
        overtimePeriodStart: r.overtimePeriodId ? (idToStart.get(r.overtimePeriodId) ?? null) : null,
      })
    )
  },

  async loadClosedPeriodStarts() {
    const rows = await db
      .select({ startDate: payrollPeriods.startDate })
      .from(payrollPeriods)
      .where(eq(payrollPeriods.status, "closed"))
    return new Set(rows.map((r) => r.startDate))
  },

  async saveRows(rows) {
    if (rows.length === 0) return

    const starts = new Set<string>()
    for (const r of rows) {
      if (r.basePeriodStart) starts.add(r.basePeriodStart)
      if (r.overtimePeriodStart) starts.add(r.overtimePeriodStart)
    }

    // Satu transaksi: kunci baris periode (FOR SHARE) supaya Tutup Periode yang sedang
    // berjalan menunggu, dan status closed dibaca ulang sebelum menulis (close-vs-sync).
    await db.transaction(async (tx) => {
      if (starts.size > 0) {
        await tx
          .insert(payrollPeriods)
          .values(
            [...starts].map((start) => {
              const period = payrollPeriodFor(start)
              return { startDate: period.startDate, endDate: period.endDate }
            })
          )
          .onConflictDoNothing({ target: payrollPeriods.startDate })
      }

      const periods = await tx
        .select({ id: payrollPeriods.id, startDate: payrollPeriods.startDate, status: payrollPeriods.status })
        .from(payrollPeriods)
        .for("share")
      const { startToId } = periodStartMaps(periods)
      const closedIds = new Set(periods.filter((p) => p.status === "closed").map((p) => p.id))

      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK)
        const current = await tx
          .select({
            bookingId: counselorHonors.bookingId,
            basePeriodId: counselorHonors.basePeriodId,
            overtimePeriodId: counselorHonors.overtimePeriodId,
          })
          .from(counselorHonors)
          .where(inArray(counselorHonors.bookingId, chunk.map((r) => r.bookingId)))
        const currentByBooking = new Map(current.map((c) => [c.bookingId, c]))

        // Penempatan BARU ke periode yang ternyata sudah tertutup dibatalkan (tetap tertahan);
        // sync berikutnya menempatkannya di periode terbuka.
        const place = (start: string | null, existingId: string | null | undefined) => {
          const id = start ? (startToId.get(start) ?? null) : null
          return id && closedIds.has(id) && id !== existingId ? null : id
        }

        const values = chunk.map((r) => {
          const prior = currentByBooking.get(r.bookingId)
          return {
            bookingId: r.bookingId,
            counselorId: r.counselorId,
            serviceId: r.serviceId,
            sessionDate: r.sessionDate,
            baseAmount: String(r.baseAmount),
            overtimeAmount: String(r.overtimeAmount),
            basePayoutPercent: r.basePayoutPercent,
            overtimePayoutPercent: r.overtimePayoutPercent,
            basePeriodId: place(r.basePeriodStart, prior?.basePeriodId),
            overtimePeriodId: place(r.overtimePeriodStart, prior?.overtimePeriodId),
          }
        })
        await tx
          .insert(counselorHonors)
          .values(values)
          .onConflictDoUpdate({
            target: counselorHonors.bookingId,
            // Penjaga lapis kedua: bagian yang periodenya (lama atau baru) tertutup tidak ditimpa.
            set: {
              serviceId: sql`excluded.service_id`,
              sessionDate: sql`excluded.session_date`,
              baseAmount: keepIfClosed("base_period_id", "base_amount"),
              basePayoutPercent: keepIfClosed("base_period_id", "base_payout_percent"),
              basePeriodId: keepIfClosed("base_period_id", "base_period_id"),
              overtimeAmount: keepIfClosed("overtime_period_id", "overtime_amount"),
              overtimePayoutPercent: keepIfClosed("overtime_period_id", "overtime_payout_percent"),
              overtimePeriodId: keepIfClosed("overtime_period_id", "overtime_period_id"),
              updatedAt: sql`now()`,
            },
          })
      }
    })
  },
}
