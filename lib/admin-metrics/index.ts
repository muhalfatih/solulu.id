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
import { buildAttentionItems, type AttentionItem } from "./attention-items"
import { buildDashboardData, heatmapWindow, type DashboardData } from "./dashboard"
import type { DashboardMetricsStore, MetricsStore } from "./store"

export * from "./range"
export * from "./dashboard"
export * from "./attention-items"

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
  metricsStore: Pick<MetricsStore, "loadPaidPayments">
}): Promise<ProfitLossReport> {
  const { range, now, honorStore, metricsStore } = input
  const prev = comparisonRange(range)
  const [{ rows }, payments] = await Promise.all([
    syncHonors({ now, store: honorStore }),
    metricsStore.loadPaidPayments({ from: prev.from, to: range.to }),
  ])
  return buildProfitLoss({ range, payments, honors: rows })
}

export interface AdminDashboard extends DashboardData {
  attention: AttentionItem[]
}

/**
 * Seluruh data Dashboard Admin untuk satu rentang. Honor disinkronkan sekali dan
 * dipakai untuk HPP, hitungan sesi, serta sesi per Layanan.
 */
export async function loadAdminDashboard(input: {
  range: DateRange
  now: Date
  honorStore: HonorStore
  metricsStore: DashboardMetricsStore
}): Promise<AdminDashboard> {
  const { range, now, honorStore, metricsStore } = input
  const prev = comparisonRange(range)
  const today = wibDateOf(now)
  const heat = heatmapWindow(range, today)
  const capacityRange: DateRange = { from: heat.from < prev.from ? heat.from : prev.from, to: range.to }

  const [{ rows, facts }, payments, capacity, attention] = await Promise.all([
    syncHonors({ now, store: honorStore }),
    metricsStore.loadPaidPayments({ from: prev.from, to: range.to }),
    metricsStore.loadSlotCapacity(capacityRange),
    metricsStore.loadAttention(now).catch((err) => {
      console.error("[admin-metrics] gagal memuat Perlu Tindakan", err)
      return {}
    }),
  ])

  const report = buildProfitLoss({ range, payments, honors: rows })
  const data = buildDashboardData({ report, honors: rows, facts, payments, capacity, today })
  return { ...data, attention: buildAttentionItems(attention) }
}
