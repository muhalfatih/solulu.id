/**
 * Honor Konselor (ADR-0007): pure logic.
 * Honor = tarif pokok sebelum voucher (snapshot booking) x Bagi Hasil pokok
 *       + overtime x Bagi Hasil overtime.
 * Status No-Show dan nominal yang dibayar klien (voucher / Booking Manual Rp 0)
 * sengaja bukan input: keduanya tidak boleh mengubah honor.
 */

type NumericLike = string | number

export interface HonorInput {
  /** Snapshot tarif pokok aktif Layanan sebelum voucher (bookings.base_price_snapshot). */
  basePriceSnapshot: NumericLike
  basePayoutPercent: number
  /** Nilai overtime yang ditagihkan ke klien (bookings.extension_fee). */
  overtimeAmount: NumericLike
  overtimePayoutPercent: number
}

export interface HonorAmounts {
  baseHonor: number
  overtimeHonor: number
  totalHonor: number
}

function toAmount(value: NumericLike, field: string): number {
  const n = typeof value === "number" ? value : parseFloat(value)
  if (!Number.isFinite(n) || n < 0) throw new Error(`${field} tidak valid: ${value}`)
  return n
}

function assertPercent(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${field} harus di antara 0 dan 100: ${value}`)
  }
}

export function honorForSession(input: HonorInput): HonorAmounts {
  assertPercent(input.basePayoutPercent, "Bagi Hasil pokok")
  assertPercent(input.overtimePayoutPercent, "Bagi Hasil overtime")
  const base = toAmount(input.basePriceSnapshot, "Tarif pokok")
  const overtime = toAmount(input.overtimeAmount, "Overtime")
  const baseHonor = Math.round((base * input.basePayoutPercent) / 100)
  const overtimeHonor = Math.round((overtime * input.overtimePayoutPercent) / 100)
  return { baseHonor, overtimeHonor, totalHonor: baseHonor + overtimeHonor }
}
