import { and, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { counselors, payrollPeriods } from "@/db/schema"
import type { PayrollCloseStore, PayrollCounselorInfo } from "./payroll"

/** Implementasi Drizzle dari PayrollCloseStore: tutup periode + audit dalam satu transaksi. */
export const drizzlePayrollCloseStore: PayrollCloseStore = {
  async closePeriod({ startDate, endDate, closedBy, closedAt, audit }) {
    return db.transaction(async (tx) => {
      await tx
        .insert(payrollPeriods)
        .values({ startDate, endDate })
        .onConflictDoNothing({ target: payrollPeriods.startDate })

      // Hanya satu penutup yang menang; sync yang sedang menulis (FOR SHARE) ditunggu.
      const updated = await tx
        .update(payrollPeriods)
        .set({ status: "closed", closedAt, closedBy })
        .where(and(eq(payrollPeriods.startDate, startDate), eq(payrollPeriods.status, "open")))
        .returning({ id: payrollPeriods.id })
      if (updated.length === 0) return false

      await audit(tx)
      return true
    })
  },
}

export async function loadPayrollCounselorInfo(ids: readonly string[]): Promise<Map<string, PayrollCounselorInfo>> {
  if (ids.length === 0) return new Map()
  const rows = await db
    .select({
      id: counselors.id,
      name: counselors.fullName,
      bankName: counselors.bankName,
      accountNumber: counselors.bankAccountNumber,
      accountHolder: counselors.bankAccountHolder,
    })
    .from(counselors)
    .where(inArray(counselors.id, [...ids]))
  return new Map(
    rows.map((r) => [
      r.id,
      { name: r.name, bankName: r.bankName, accountNumber: r.accountNumber, accountHolder: r.accountHolder },
    ])
  )
}
