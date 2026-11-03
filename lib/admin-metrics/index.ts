import {
  buildProfitLoss,
  comparisonRange,
  payrollPeriodFor,
  syncHonors,
  wibDateOf,
  type DateRange,
  type HonorStore,
  type ProfitLossReport,
} from "@/lib/finance"
import type { MetricsStore } from "./store"

/**
 * Modul metrik admin: satu-satunya sumber angka keuangan untuk Laporan Keuangan
 * dan Dashboard Admin. Hanya memuat data; seluruh hitungan (Omzet, HPP, Laba
 * Bersih, rentang pembanding) didelegasikan ke Modul Keuangan (`@/lib/finance`).
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** Rentang default = Periode Payroll berjalan. */
export function defaultRange(now: Date): DateRange {
  const period = payrollPeriodFor(now)
  return { from: period.startDate, to: period.endDate }
}

/** Rentang dari parameter URL; kosong/tidak valid jatuh ke rentang default. */
export function resolveRange(input: { from?: string | null; to?: string | null }, now: Date): DateRange {
  const { from, to } = input
  if (from && to && DATE_ONLY.test(from) && DATE_ONLY.test(to)) {
    try {
      const range = { from: wibDateOf(from), to: wibDateOf(to) }
      comparisonRange(range) // memvalidasi urutan
      return range
    } catch {
      // jatuh ke default
    }
  }
  return defaultRange(now)
}

export async function loadProfitLoss(input: {
  range: DateRange
  now: Date
  honorStore: HonorStore
  metricsStore: MetricsStore
}): Promise<ProfitLossReport> {
  const { range, now, honorStore, metricsStore } = input
  const prev = comparisonRange(range)
  const [{ rows }, payments] = await Promise.all([
    syncHonors({ now, store: honorStore }),
    metricsStore.loadPaidPayments({ from: prev.from, to: range.to }),
  ])
  return buildProfitLoss({ range, payments, honors: rows })
}
