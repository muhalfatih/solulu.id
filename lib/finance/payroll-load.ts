import { drizzleHonorStore } from "./honor-store"
import { syncHonors, type HonorStore } from "./honor-sync"
import { toLedgerEntries } from "./ledger"
import { buildPayrollOverview, buildPayrollPeriodDetail, type PayrollCounselorInfo } from "./payroll"
import { loadPayrollCounselorInfo } from "./payroll-store"

/** Honor disinkronkan lebih dulu (periode tertutup tidak tersentuh), lalu dibentuk jadi tampilan admin. */
export async function loadPayrollOverview(input: { now: Date; store?: HonorStore }) {
  const { rows, facts, closedPeriodStarts } = await syncHonors({ now: input.now, store: input.store ?? drizzleHonorStore })
  return buildPayrollOverview(toLedgerEntries(rows, facts), closedPeriodStarts)
}

export async function loadPayrollPeriodDetail(input: {
  startDate: string
  now: Date
  store?: HonorStore
  loadCounselors?: (ids: readonly string[]) => Promise<Map<string, PayrollCounselorInfo>>
}) {
  const { rows, facts, closedPeriodStarts } = await syncHonors({ now: input.now, store: input.store ?? drizzleHonorStore })
  const entries = toLedgerEntries(rows, facts)
  const ids = [...new Set(entries.map((e) => e.counselorId))]
  const counselors = await (input.loadCounselors ?? loadPayrollCounselorInfo)(ids)
  return buildPayrollPeriodDetail(entries, input.startDate, counselors, closedPeriodStarts)
}
