import { and, asc, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, zoomAccounts } from "@/db/schema"
import { queryDispatchQueue } from "@/lib/whatsapp/queue"
import type { OperatorDashboardStore } from "./dashboard"

const ACTIVE_STATUSES = ["confirmed", "completed", "pending_payment"] as const

/**
 * Hanya kolom operasional yang dipilih: tidak ada join ke `transactions`,
 * tidak ada kolom harga/honor, dan kredensial Zoom tidak ikut terbaca.
 */
export const drizzleOperatorDashboardStore: OperatorDashboardStore = {
  async slotCounts(date) {
    return db
      .select({ slotIndex: schedules.slotIndex, sessionCount: sql<number>`count(*)::int` })
      .from(bookings)
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .where(and(eq(schedules.date, date), inArray(bookings.status, [...ACTIVE_STATUSES])))
      .groupBy(schedules.slotIndex)
  },

  async zoomAccounts(date) {
    const accounts = await db
      .select({
        accountNumber: zoomAccounts.accountNumber,
        name: zoomAccounts.name,
        isActive: zoomAccounts.isActive,
      })
      .from(zoomAccounts)
      .orderBy(asc(zoomAccounts.accountNumber))
    const usage = await db
      .select({ accountNumber: bookings.zoomAccountNumber, n: sql<number>`count(*)::int` })
      .from(bookings)
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .where(and(eq(schedules.date, date), inArray(bookings.status, [...ACTIVE_STATUSES])))
      .groupBy(bookings.zoomAccountNumber)
    return accounts.map((a) => ({
      ...a,
      sessionsToday: usage.find((u) => u.accountNumber === a.accountNumber)?.n ?? 0,
    }))
  },

  async pendingDispatch({ limit, today }) {
    const page = await queryDispatchQueue({ filter: { sent: "pending" }, limit, offset: 0, today })
    return {
      total: page.total,
      rows: page.rows.map((r) => ({
        bookingId: r.bookingId,
        bookingCode: r.bookingCode,
        patientName: r.patientName,
        counselorName: r.counselorName,
        scheduleDate: r.scheduleDate,
        timeRange: r.timeRange,
        kind: r.kind,
      })),
    }
  },
}
