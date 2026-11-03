import { wibDateOf } from "./period"
import type { PlannedHonorRow } from "./plan"

/**
 * Omzet, HPP & Laba Bersih (CONTEXT): pure.
 * - Omzet diakui pada tanggal lunas (WIB); HPP = honor pokok + overtime menurut tanggal sesi.
 * - Laba Bersih hanya bermakna per rentang, sengaja tidak ada rincian per hari.
 */

export interface DateRange {
  /** YYYY-MM-DD (WIB), inklusif. */
  from: string
  to: string
}

export interface PaymentFact {
  status: string
  paidAt: Date | string | null
  netAmount: number | string
}

const DAY_MS = 24 * 60 * 60 * 1000

function dayNumber(date: string): number {
  const [y, m, d] = wibDateOf(date).split("-").map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

function fromDayNumber(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10)
}

export function assertRange(range: DateRange): void {
  if (dayNumber(range.to) < dayNumber(range.from)) throw new Error("Rentang tanggal terbalik")
}

/** Rentang berjumlah hari sama tepat sebelum `range`. */
export function comparisonRange(range: DateRange): DateRange {
  assertRange(range)
  const start = dayNumber(range.from)
  const days = dayNumber(range.to) - start + 1
  return { from: fromDayNumber(start - days), to: fromDayNumber(start - 1) }
}

function inRange(date: string, range: DateRange): boolean {
  return date >= range.from && date <= range.to
}

export function omzetByPaidDate(payments: readonly PaymentFact[], range: DateRange): number {
  assertRange(range)
  let total = 0
  for (const p of payments) {
    if (p.status !== "PAID" || !p.paidAt) continue
    if (!inRange(wibDateOf(p.paidAt instanceof Date ? p.paidAt : new Date(p.paidAt)), range)) continue
    total += Number(p.netAmount)
  }
  return total
}

export function hppBySessionDate(
  honors: readonly Pick<PlannedHonorRow, "sessionDate" | "baseAmount" | "overtimeAmount">[],
  range: DateRange
): number {
  assertRange(range)
  let total = 0
  for (const h of honors) {
    if (inRange(h.sessionDate, range)) total += h.baseAmount + h.overtimeAmount
  }
  return total
}

export interface ProfitLossFigures {
  omzet: number
  hpp: number
  labaBersih: number
}

export interface ProfitLossReport extends ProfitLossFigures {
  range: DateRange
  comparison: ProfitLossFigures & { range: DateRange }
}

function figures(
  payments: readonly PaymentFact[],
  honors: readonly Pick<PlannedHonorRow, "sessionDate" | "baseAmount" | "overtimeAmount">[],
  range: DateRange
): ProfitLossFigures {
  const omzet = omzetByPaidDate(payments, range)
  const hpp = hppBySessionDate(honors, range)
  return { omzet, hpp, labaBersih: omzet - hpp }
}

export function buildProfitLoss(input: {
  range: DateRange
  payments: readonly PaymentFact[]
  honors: readonly Pick<PlannedHonorRow, "sessionDate" | "baseAmount" | "overtimeAmount">[]
}): ProfitLossReport {
  const prev = comparisonRange(input.range)
  return {
    range: input.range,
    ...figures(input.payments, input.honors, input.range),
    comparison: { range: prev, ...figures(input.payments, input.honors, prev) },
  }
}

/** Selisih persen terhadap pembanding; null bila pembanding nol. */
export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}
