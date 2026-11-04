/**
 * Payroll Hold (ADR-0007): pure logic.
 * - Laporan sesi belum masuk menahan SELURUH honor sesi itu.
 * - Tagihan perpanjangan klien belum lunas menahan bagian overtime saja.
 */

export type HoldReason = "report_missing" | "extension_unpaid"

export const HOLD_REASON_LABELS: Record<HoldReason, string> = {
  report_missing: "Laporan sesi belum diserahkan",
  extension_unpaid: "Tagihan perpanjangan klien belum lunas",
}

export interface HoldInput {
  hasReport: boolean
  /** Nilai overtime yang ditagihkan (bookings.extension_fee). */
  overtimeAmount: string | number
  /** bookings.extension_payment_status: 'NONE' | 'PENDING' | 'PAID' | 'REJECTED'. */
  extensionPaymentStatus: string
}

export interface HoldResult {
  reasons: HoldReason[]
  baseHeld: boolean
  overtimeHeld: boolean
}

export function holdReasons(input: HoldInput): HoldResult {
  const overtime = typeof input.overtimeAmount === "number" ? input.overtimeAmount : parseFloat(input.overtimeAmount)
  const hasOvertime = Number.isFinite(overtime) && overtime > 0

  const reasons: HoldReason[] = []
  if (!input.hasReport) reasons.push("report_missing")
  if (hasOvertime && input.extensionPaymentStatus !== "PAID") reasons.push("extension_unpaid")

  return {
    reasons,
    baseHeld: !input.hasReport,
    overtimeHeld: reasons.length > 0,
  }
}
