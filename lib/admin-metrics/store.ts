import { and, count, eq, gte, isNull, lt, sql } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, sessionReports, transactions } from "@/db/schema"
import type { DateRange, PaymentFact } from "@/lib/finance"
import { getAttentionCounts } from "@/lib/shell/attention"
import type { AttentionKey, DashboardAttentionCounts } from "./attention-items"
import type { PaidPaymentFact, SlotCapacityRow } from "./dashboard"

const WIB = "+07:00"
const DAY_MS = 24 * 60 * 60 * 1000
const REPORT_DEADLINE_MS = 24 * 60 * 60 * 1000

/** Batas waktu absolut [awal hari `from` WIB, awal hari setelah `to` WIB). */
export function wibRangeBounds(range: DateRange): { start: Date; endExclusive: Date } {
  const start = new Date(`${range.from}T00:00:00${WIB}`)
  const endExclusive = new Date(new Date(`${range.to}T00:00:00${WIB}`).getTime() + DAY_MS)
  return { start, endExclusive }
}

export interface MetricsStore {
  /** Transaksi lunas yang tanggal lunasnya (WIB) jatuh di dalam `range`. */
  loadPaidPayments(range: DateRange): Promise<PaymentFact[]>
}

/** Pembacaan tambahan Dashboard Admin; semuanya read-only. */
export interface DashboardMetricsStore extends MetricsStore {
  loadPaidPayments(range: DateRange): Promise<PaidPaymentFact[]>
  /** Slot dibuka vs terisi per (tanggal, slot) di dalam `range` (tanggal sesi WIB). */
  loadSlotCapacity(range: DateRange): Promise<SlotCapacityRow[]>
  /** Hitungan Perlu Tindakan; kunci yang gagal dimuat bernilai null. */
  loadAttention(now: Date): Promise<DashboardAttentionCounts>
}

async function countOverdueReports(now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - REPORT_DEADLINE_MS).toISOString()
  const [row] = await db
    .select({ n: count() })
    .from(bookings)
    .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
    .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.status, "completed"),
        isNull(sessionReports.submittedAt),
        sql`((${schedules.date}::timestamp + ${schedules.endTime}) AT TIME ZONE 'Asia/Jakarta') < ${cutoff}::timestamptz`
      )
    )
  return row?.n ?? 0
}

export const drizzleMetricsStore: DashboardMetricsStore = {
  async loadPaidPayments(range) {
    const { start, endExclusive } = wibRangeBounds(range)
    return db
      .select({
        status: transactions.status,
        paidAt: transactions.paidAt,
        netAmount: transactions.netAmount,
        paymentProvider: transactions.paymentProvider,
      })
      .from(transactions)
      .where(and(eq(transactions.status, "PAID"), gte(transactions.paidAt, start), lt(transactions.paidAt, endExclusive)))
  },

  async loadSlotCapacity(range) {
    const rows = await db
      .select({
        date: schedules.date,
        slotIndex: schedules.slotIndex,
        opened: sql<number>`(count(*) filter (where ${schedules.status} <> 'cancelled' and not ${schedules.isLeave}))::int`,
        booked: sql<number>`(count(*) filter (where ${schedules.status} = 'booked'))::int`,
      })
      .from(schedules)
      .where(and(gte(schedules.date, range.from), sql`${schedules.date} <= ${range.to}`))
      .groupBy(schedules.date, schedules.slotIndex)
    return rows
  },

  async loadAttention(now) {
    const [base, reports] = await Promise.all([
      getAttentionCounts("admin"),
      countOverdueReports(now).catch((err) => {
        console.error("[admin-metrics] gagal menghitung laporan lewat 24 jam", err)
        return null
      }),
    ])
    const pick = (key: AttentionKey): number | null => {
      const v = (base as Record<string, number | null | undefined>)[key]
      return typeof v === "number" ? v : null
    }
    return {
      pool: pick("pool"),
      reports,
      transfer: pick("transfer"),
      credentials: pick("credentials"),
      applications: pick("applications"),
    }
  },
}
