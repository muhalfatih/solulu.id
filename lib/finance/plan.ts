import { honorForSession } from "./honor"
import { holdReasons } from "./hold"
import { nextPayrollPeriod, payrollPeriodFor, type PayrollPeriod } from "./period"

/**
 * Menetapkan baris honor per sesi dan penempatannya ke Periode Payroll.
 * Pure: pembacaan dan penulisan database ada di `honor-repository.ts`.
 *
 * Aturan pembekuan: bagian honor (pokok / overtime) yang sudah ditempatkan di
 * periode TERTUTUP tidak pernah diubah (nilai, persentase, maupun periodenya).
 * Bagian yang sudah di periode terbuka boleh dihitung ulang tetapi tidak
 * berpindah periode. Bagian tertahan baru ditempatkan saat syaratnya terpenuhi.
 */

/** Status booking yang menghasilkan honor (ADR-0008): sesi selesai atau No-Show. */
export const HONOR_ELIGIBLE_STATUSES = ["completed", "no_show"] as const

export interface HonorSessionFacts {
  bookingId: string
  bookingCode: string
  counselorId: string
  serviceId: string
  serviceName: string
  status: string
  /** Tanggal sesi (WIB, YYYY-MM-DD). */
  sessionDate: string
  basePriceSnapshot: string | number
  basePayoutPercent: number
  overtimePayoutPercent: number
  extensionFee: string | number
  extensionPaymentStatus: string
  hasReport: boolean
}

export interface PlannedHonorRow {
  bookingId: string
  counselorId: string
  serviceId: string
  sessionDate: string
  baseAmount: number
  overtimeAmount: number
  basePayoutPercent: number
  overtimePayoutPercent: number
  /** null = tertahan (belum ditempatkan ke periode mana pun). */
  basePeriodStart: string | null
  overtimePeriodStart: string | null
}

export type ExistingHonorRow = Pick<
  PlannedHonorRow,
  | "bookingId"
  | "baseAmount"
  | "overtimeAmount"
  | "basePayoutPercent"
  | "overtimePayoutPercent"
  | "basePeriodStart"
  | "overtimePeriodStart"
>

/**
 * Periode terbuka tempat honor sebuah sesi ditempatkan: periode sesinya bila
 * masih terbuka, jika sudah ditutup maka periode terbuka pertama sejak saat dilepas.
 */
export function assignToOpenPeriod(input: {
  sessionDate: Date | string
  now: Date
  closedPeriodStarts: ReadonlySet<string>
}): PayrollPeriod {
  const natural = payrollPeriodFor(input.sessionDate)
  if (!input.closedPeriodStarts.has(natural.startDate)) return natural

  const current = payrollPeriodFor(input.now)
  let candidate = current.startDate > natural.startDate ? current : nextPayrollPeriod(natural)
  while (input.closedPeriodStarts.has(candidate.startDate)) {
    candidate = nextPayrollPeriod(candidate)
  }
  return candidate
}

export function planHonorRows(input: {
  sessions: readonly HonorSessionFacts[]
  existing: readonly ExistingHonorRow[]
  closedPeriodStarts: ReadonlySet<string>
  now: Date
}): PlannedHonorRow[] {
  const existingByBooking = new Map(input.existing.map((row) => [row.bookingId, row]))
  const eligible: readonly string[] = HONOR_ELIGIBLE_STATUSES
  const rows: PlannedHonorRow[] = []

  for (const s of input.sessions) {
    if (!eligible.includes(s.status)) continue

    const prior = existingByBooking.get(s.bookingId)
    const honor = honorForSession({
      basePriceSnapshot: s.basePriceSnapshot,
      basePayoutPercent: s.basePayoutPercent,
      overtimeAmount: s.extensionFee,
      overtimePayoutPercent: s.overtimePayoutPercent,
    })
    const hold = holdReasons({
      hasReport: s.hasReport,
      overtimeAmount: s.extensionFee,
      extensionPaymentStatus: s.extensionPaymentStatus,
    })
    const placement = () =>
      assignToOpenPeriod({ sessionDate: s.sessionDate, now: input.now, closedPeriodStarts: input.closedPeriodStarts })
        .startDate

    // Bagian pokok
    let base = {
      amount: honor.baseHonor,
      percent: s.basePayoutPercent,
      periodStart: prior?.basePeriodStart ?? null,
    }
    if (prior?.basePeriodStart && input.closedPeriodStarts.has(prior.basePeriodStart)) {
      base = { amount: prior.baseAmount, percent: prior.basePayoutPercent, periodStart: prior.basePeriodStart }
    } else if (!base.periodStart && !hold.baseHeld) {
      base.periodStart = placement()
    }

    // Bagian overtime
    let overtime = {
      amount: honor.overtimeHonor,
      percent: s.overtimePayoutPercent,
      periodStart: prior?.overtimePeriodStart ?? null,
    }
    if (prior?.overtimePeriodStart && input.closedPeriodStarts.has(prior.overtimePeriodStart)) {
      overtime = {
        amount: prior.overtimeAmount,
        percent: prior.overtimePayoutPercent,
        periodStart: prior.overtimePeriodStart,
      }
    } else if (!overtime.periodStart && !hold.overtimeHeld && honor.overtimeHonor > 0) {
      overtime.periodStart = placement()
    }

    rows.push({
      bookingId: s.bookingId,
      counselorId: s.counselorId,
      serviceId: s.serviceId,
      sessionDate: s.sessionDate,
      baseAmount: base.amount,
      overtimeAmount: overtime.amount,
      basePayoutPercent: base.percent,
      overtimePayoutPercent: overtime.percent,
      basePeriodStart: base.periodStart,
      overtimePeriodStart: overtime.periodStart,
    })
  }

  return rows
}
