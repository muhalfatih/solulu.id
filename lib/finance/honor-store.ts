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
        reportId: sessionReports.id,
      })
      .from(bookings)
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
      .where(and(...conditions, isNotNull(bookings.counselorId)))

    return rows.map(
      ({ reportId, counselorId, ...rest }): HonorSessionFacts => ({
        ...rest,
        counselorId: counselorId as string,
        hasReport: reportId !== null,
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

    if (starts.size > 0) {
      await db
        .insert(payrollPeriods)
        .values(
          [...starts].map((start) => {
            const period = payrollPeriodFor(start)
            return { startDate: period.startDate, endDate: period.endDate }
          })
        )
        .onConflictDoNothing({ target: payrollPeriods.startDate })
    }

    const periods = await db
      .select({ id: payrollPeriods.id, startDate: payrollPeriods.startDate })
      .from(payrollPeriods)
    const { startToId } = periodStartMaps(periods)

    for (let i = 0; i < rows.length; i += CHUNK) {
      const values = rows.slice(i, i + CHUNK).map((r) => ({
        bookingId: r.bookingId,
        counselorId: r.counselorId,
        serviceId: r.serviceId,
        sessionDate: r.sessionDate,
        baseAmount: String(r.baseAmount),
        overtimeAmount: String(r.overtimeAmount),
        basePayoutPercent: r.basePayoutPercent,
        overtimePayoutPercent: r.overtimePayoutPercent,
        basePeriodId: r.basePeriodStart ? (startToId.get(r.basePeriodStart) ?? null) : null,
        overtimePeriodId: r.overtimePeriodStart ? (startToId.get(r.overtimePeriodStart) ?? null) : null,
      }))
      await db
        .insert(counselorHonors)
        .values(values)
        .onConflictDoUpdate({
          target: counselorHonors.bookingId,
          set: {
            serviceId: sql`excluded.service_id`,
            sessionDate: sql`excluded.session_date`,
            baseAmount: sql`excluded.base_amount`,
            overtimeAmount: sql`excluded.overtime_amount`,
            basePayoutPercent: sql`excluded.base_payout_percent`,
            overtimePayoutPercent: sql`excluded.overtime_payout_percent`,
            basePeriodId: sql`excluded.base_period_id`,
            overtimePeriodId: sql`excluded.overtime_period_id`,
            updatedAt: sql`now()`,
          },
        })
    }
  },
}
