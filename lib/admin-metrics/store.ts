import { and, eq, gte, lt } from "drizzle-orm"
import { db } from "@/db"
import { transactions } from "@/db/schema"
import type { DateRange, PaymentFact } from "@/lib/finance"

const WIB = "+07:00"
const DAY_MS = 24 * 60 * 60 * 1000

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

export const drizzleMetricsStore: MetricsStore = {
  async loadPaidPayments(range) {
    const { start, endExclusive } = wibRangeBounds(range)
    return db
      .select({ status: transactions.status, paidAt: transactions.paidAt, netAmount: transactions.netAmount })
      .from(transactions)
      .where(and(eq(transactions.status, "PAID"), gte(transactions.paidAt, start), lt(transactions.paidAt, endExclusive)))
  },
}
