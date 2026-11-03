/**
 * Ringkasan Honor Saya untuk dashboard Konselor (#34): Periode Payroll yang
 * sedang berjalan plus total honor tertahan. Pure; data sumbernya
 * `HonorSayaView` dari modul Keuangan (#26).
 */
import { payrollPeriodFor, type HonorSayaView } from "@/lib/finance"

export interface HonorDashboardSummary {
  periodLabel: string
  periodStart: string
  periodEnd: string
  status: "open" | "closed"
  total: number
  baseTotal: number
  overtimeTotal: number
  sessionCount: number
  heldTotal: number
  heldCount: number
}

export function summarizeCurrentHonor(view: HonorSayaView, now: Date): HonorDashboardSummary {
  const period = payrollPeriodFor(now)
  const current = view.periods.find((p) => p.startDate === period.startDate)
  return {
    periodLabel: period.label,
    periodStart: period.startDate,
    periodEnd: period.endDate,
    status: current?.status ?? "open",
    total: current?.total ?? 0,
    baseTotal: current?.baseTotal ?? 0,
    overtimeTotal: current?.overtimeTotal ?? 0,
    sessionCount: current?.sessionCount ?? 0,
    heldTotal: view.held.total,
    heldCount: new Set(view.held.lines.map((l) => l.bookingId)).size,
  }
}
