import {
  deltaPercent,
  wibDateOf,
  type DateRange,
  type HonorSessionFacts,
  type PlannedHonorRow,
  type ProfitLossReport,
} from "@/lib/finance"
import { addDays, eachDay } from "./range"

/**
 * Pembangun data Dashboard Admin: murni (tanpa `@/db`), menerima fakta hasil
 * pembacaan store lalu menyusun deret/seri yang ditampilkan.
 * Data kosong menghasilkan array kosong atau null, tidak pernah nilai karangan.
 */

export interface PaidPaymentFact {
  status: string
  paidAt: Date | string | null
  netAmount: number | string
  paymentProvider: string
}

/** Kapasitas slot per (tanggal, slot): dibuka konselor vs sudah terisi. */
export interface SlotCapacityRow {
  date: string
  slotIndex: number
  opened: number
  booked: number
}

export type SessionFact = Pick<HonorSessionFacts, "status" | "sessionDate" | "serviceId" | "serviceName">
type HonorAmounts = Pick<PlannedHonorRow, "sessionDate" | "baseAmount" | "overtimeAmount">

const inRange = (date: string, r: DateRange) => date >= r.from && date <= r.to
const paidDate = (p: PaidPaymentFact) => wibDateOf(p.paidAt instanceof Date ? p.paidAt : new Date(p.paidAt as string))

// ---------------------------------------------------------------- Omzet vs HPP
export interface DailyPoint {
  day: string
  omzet: number
  hpp: number
}

/** Omzet per tanggal lunas, HPP per tanggal sesi; sengaja tanpa laba harian. */
export function buildDailySeries(
  range: DateRange,
  payments: readonly PaidPaymentFact[],
  honors: readonly HonorAmounts[]
): DailyPoint[] {
  const byDay = new Map<string, DailyPoint>(eachDay(range).map((day) => [day, { day, omzet: 0, hpp: 0 }]))
  for (const p of payments) {
    if (p.status !== "PAID" || !p.paidAt) continue
    const point = byDay.get(paidDate(p))
    if (point) point.omzet += Number(p.netAmount)
  }
  for (const h of honors) {
    const point = byDay.get(h.sessionDate)
    if (point) point.hpp += h.baseAmount + h.overtimeAmount
  }
  return [...byDay.values()]
}

// ----------------------------------------------------------------- Sesi
export interface SessionCounts {
  selesai: number
  noShow: number
}

export function countSessions(facts: readonly SessionFact[], range: DateRange): SessionCounts {
  const counts: SessionCounts = { selesai: 0, noShow: 0 }
  for (const f of facts) {
    if (!inRange(f.sessionDate, range)) continue
    if (f.status === "completed") counts.selesai++
    else if (f.status === "no_show") counts.noShow++
  }
  return counts
}

export interface ServiceSessions extends SessionCounts {
  serviceId: string
  layanan: string
}

export function sessionsByService(facts: readonly SessionFact[], range: DateRange): ServiceSessions[] {
  const byService = new Map<string, ServiceSessions>()
  for (const f of facts) {
    if (!inRange(f.sessionDate, range)) continue
    if (f.status !== "completed" && f.status !== "no_show") continue
    const row = byService.get(f.serviceId) ?? { serviceId: f.serviceId, layanan: f.serviceName, selesai: 0, noShow: 0 }
    if (f.status === "completed") row.selesai++
    else row.noShow++
    byService.set(f.serviceId, row)
  }
  return [...byService.values()].sort(
    (a, b) => b.selesai + b.noShow - (a.selesai + a.noShow) || a.layanan.localeCompare(b.layanan, "id-ID")
  )
}

// ------------------------------------------------------------ Metode bayar
export type PaymentMethodKey = "xendit" | "transfer" | "bypass" | "other"

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodKey, string> = {
  xendit: "Xendit",
  transfer: "Transfer Manual",
  bypass: "Booking Rp 0",
  other: "Lainnya",
}

export function paymentMethodKey(provider: string): PaymentMethodKey {
  if (provider === "xendit") return "xendit"
  if (provider === "manual" || provider === "manual_bank_transfer") return "transfer"
  if (provider === "admin_bypass") return "bypass"
  return "other"
}

export interface PaymentMixSlice {
  key: PaymentMethodKey
  label: string
  count: number
  amount: number
}

export function buildPaymentMix(payments: readonly PaidPaymentFact[], range: DateRange): PaymentMixSlice[] {
  const slices = new Map<PaymentMethodKey, PaymentMixSlice>()
  for (const p of payments) {
    if (p.status !== "PAID" || !p.paidAt) continue
    if (!inRange(paidDate(p), range)) continue
    const key = paymentMethodKey(p.paymentProvider)
    const slice = slices.get(key) ?? { key, label: PAYMENT_METHOD_LABELS[key], count: 0, amount: 0 }
    slice.count++
    slice.amount += Number(p.netAmount)
    slices.set(key, slice)
  }
  return [...slices.values()].sort((a, b) => b.count - a.count)
}

// ------------------------------------------------------- Keterisian Slot
export interface Occupancy {
  opened: number
  booked: number
  /** 0..1; null bila tidak ada slot yang dibuka (bukan 0%). */
  rate: number | null
}

export function buildOccupancy(rows: readonly SlotCapacityRow[], range: DateRange): Occupancy {
  let opened = 0
  let booked = 0
  for (const r of rows) {
    if (!inRange(r.date, range)) continue
    opened += r.opened
    booked += r.booked
  }
  return { opened, booked, rate: opened > 0 ? booked / opened : null }
}

/** Selisih poin persentase (saat ini dikurangi pembanding); null bila salah satu tidak ada. */
export function occupancyDeltaPoints(current: Occupancy, previous: Occupancy): number | null {
  if (current.rate === null || previous.rate === null) return null
  return Math.round((current.rate - previous.rate) * 1000) / 10
}

export const HEATMAP_SLOT_COUNT = 7
export const HEATMAP_DAY_COUNT = 7

/** 7 hari yang berakhir di tanggal lebih awal antara akhir rentang dan hari ini + 6. */
export function heatmapWindow(range: DateRange, today: string): DateRange {
  const latest = addDays(today, HEATMAP_DAY_COUNT - 1)
  const to = range.to < latest ? range.to : latest
  return { from: addDays(to, -(HEATMAP_DAY_COUNT - 1)), to }
}

export interface HeatmapCell {
  day: string
  opened: number
  booked: number
  /** 0 = kosong, 1..5 = tangga ramp --heat-N; null = tidak ada slot dibuka. */
  level: number | null
}

export interface HeatmapRow {
  slotIndex: number
  cells: HeatmapCell[]
}

export interface Heatmap {
  days: string[]
  rows: HeatmapRow[]
}

export function heatLevel(booked: number, opened: number): number | null {
  if (opened <= 0) return null
  if (booked <= 0) return 0
  return Math.min(5, Math.max(1, Math.ceil((booked / opened) * 5)))
}

export function buildHeatmap(rows: readonly SlotCapacityRow[], window: DateRange): Heatmap {
  const days = eachDay(window)
  const index = new Map(rows.map((r) => [`${r.date}|${r.slotIndex}`, r]))
  return {
    days,
    rows: Array.from({ length: HEATMAP_SLOT_COUNT }, (_, i) => {
      const slotIndex = i + 1
      return {
        slotIndex,
        cells: days.map((day): HeatmapCell => {
          const hit = index.get(`${day}|${slotIndex}`)
          const opened = hit?.opened ?? 0
          const booked = hit?.booked ?? 0
          return { day, opened, booked, level: heatLevel(booked, opened) }
        }),
      }
    }),
  }
}

// -------------------------------------------------------------- KPI & data
export interface KpiFigure<T = number> {
  value: T
  previous: T
  /** Persen vs pembanding (null bila pembanding nol). */
  deltaPercent: number | null
}

export interface DashboardKpis {
  omzet: KpiFigure
  labaBersih: KpiFigure
  hpp: KpiFigure
  sesiSelesai: KpiFigure & { noShow: number }
  keterisian: KpiFigure<number | null> & { booked: number; opened: number; deltaPoints: number | null }
}

export interface DashboardData {
  range: DateRange
  comparisonRange: DateRange
  kpis: DashboardKpis
  daily: DailyPoint[]
  sessionsByService: ServiceSessions[]
  heatmap: Heatmap
  paymentMix: PaymentMixSlice[]
}

export function buildDashboardData(input: {
  report: ProfitLossReport
  honors: readonly HonorAmounts[]
  facts: readonly SessionFact[]
  payments: readonly PaidPaymentFact[]
  capacity: readonly SlotCapacityRow[]
  today: string
}): DashboardData {
  const { report, honors, facts, payments, capacity, today } = input
  const range = report.range
  const prev = report.comparison.range
  const sesi = countSessions(facts, range)
  const sesiPrev = countSessions(facts, prev)
  const occ = buildOccupancy(capacity, range)
  const occPrev = buildOccupancy(capacity, prev)
  const fig = (value: number, previous: number): KpiFigure => ({
    value,
    previous,
    deltaPercent: deltaPercent(value, previous),
  })

  return {
    range,
    comparisonRange: prev,
    kpis: {
      omzet: fig(report.omzet, report.comparison.omzet),
      labaBersih: fig(report.labaBersih, report.comparison.labaBersih),
      hpp: fig(report.hpp, report.comparison.hpp),
      sesiSelesai: { ...fig(sesi.selesai, sesiPrev.selesai), noShow: sesi.noShow },
      keterisian: {
        value: occ.rate,
        previous: occPrev.rate,
        deltaPercent: null,
        deltaPoints: occupancyDeltaPoints(occ, occPrev),
        booked: occ.booked,
        opened: occ.opened,
      },
    },
    daily: buildDailySeries(range, payments, honors),
    sessionsByService: sessionsByService(facts, range),
    heatmap: buildHeatmap(capacity, heatmapWindow(range, today)),
    paymentMix: buildPaymentMix(payments, range),
  }
}
