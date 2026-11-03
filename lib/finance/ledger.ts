import { holdReasons, type HoldReason } from "./hold"
import { payrollPeriodFor } from "./period"
import type { HonorSessionFacts, PlannedHonorRow } from "./plan"

/**
 * Honor Saya (CONTEXT: tampilan Honor Konselor milik konselor sendiri per
 * Periode Payroll, termasuk honor tertahan dan alasannya). Pure view-builder.
 */

export type HonorLedgerEntry = PlannedHonorRow & {
  bookingCode: string
  serviceName: string
  sessionStatus: string
  hasReport: boolean
  extensionFee: string | number
  extensionPaymentStatus: string
}

export type PeriodStatus = "open" | "closed"

export interface HonorLine {
  bookingId: string
  bookingCode: string
  serviceName: string
  sessionDate: string
  sessionStatus: string
  part: "base" | "overtime"
  amount: number
  /** Alasan penahanan; kosong untuk honor yang sudah masuk periode. */
  reasons: HoldReason[]
}

export interface HonorPeriodView {
  startDate: string
  endDate: string
  label: string
  status: PeriodStatus
  baseTotal: number
  overtimeTotal: number
  total: number
  sessionCount: number
  lines: HonorLine[]
}

export interface HonorSayaView {
  /** Terbaru dulu. */
  periods: HonorPeriodView[]
  held: { total: number; lines: HonorLine[] }
}

export function toLedgerEntries(
  rows: readonly PlannedHonorRow[],
  facts: readonly HonorSessionFacts[]
): HonorLedgerEntry[] {
  const byBooking = new Map(facts.map((f) => [f.bookingId, f]))
  const entries: HonorLedgerEntry[] = []
  for (const row of rows) {
    const f = byBooking.get(row.bookingId)
    if (!f) continue
    entries.push({
      ...row,
      bookingCode: f.bookingCode,
      serviceName: f.serviceName,
      sessionStatus: f.status,
      hasReport: f.hasReport,
      extensionFee: f.extensionFee,
      extensionPaymentStatus: f.extensionPaymentStatus,
    })
  }
  return entries
}

export function buildHonorSaya(
  entries: readonly HonorLedgerEntry[],
  periodStatuses: ReadonlyMap<string, PeriodStatus> = new Map()
): HonorSayaView {
  const periodMap = new Map<string, HonorPeriodView>()
  const heldLines: HonorLine[] = []

  const place = (line: HonorLine, periodStart: string | null) => {
    if (periodStart === null) {
      heldLines.push(line)
      return
    }
    let view = periodMap.get(periodStart)
    if (!view) {
      const period = payrollPeriodFor(periodStart)
      view = {
        startDate: period.startDate,
        endDate: period.endDate,
        label: period.label,
        status: periodStatuses.get(periodStart) ?? "open",
        baseTotal: 0,
        overtimeTotal: 0,
        total: 0,
        sessionCount: 0,
        lines: [],
      }
      periodMap.set(periodStart, view)
    }
    view.lines.push(line)
    if (line.part === "base") view.baseTotal += line.amount
    else view.overtimeTotal += line.amount
    view.total += line.amount
  }

  for (const e of entries) {
    const hold = holdReasons({
      hasReport: e.hasReport,
      overtimeAmount: e.extensionFee,
      extensionPaymentStatus: e.extensionPaymentStatus,
    })
    const common = {
      bookingId: e.bookingId,
      bookingCode: e.bookingCode,
      serviceName: e.serviceName,
      sessionDate: e.sessionDate,
      sessionStatus: e.sessionStatus,
    }
    if (e.baseAmount > 0) {
      const reasons: HoldReason[] = e.basePeriodStart === null && hold.baseHeld ? ["report_missing"] : []
      place({ ...common, part: "base", amount: e.baseAmount, reasons }, e.basePeriodStart)
    }
    if (e.overtimeAmount > 0) {
      const reasons: HoldReason[] = e.overtimePeriodStart === null ? hold.reasons : []
      place({ ...common, part: "overtime", amount: e.overtimeAmount, reasons }, e.overtimePeriodStart)
    }
  }

  for (const view of periodMap.values()) {
    view.sessionCount = new Set(view.lines.map((l) => l.bookingId)).size
    view.lines.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate) || a.bookingCode.localeCompare(b.bookingCode))
  }
  heldLines.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate) || a.bookingCode.localeCompare(b.bookingCode))

  return {
    periods: [...periodMap.values()].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    held: { total: heldLines.reduce((sum, l) => sum + l.amount, 0), lines: heldLines },
  }
}
