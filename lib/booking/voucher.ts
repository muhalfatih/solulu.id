/**
 * Voucher Calculation & Policy Evaluation for Solulu
 *
 * Rules:
 * 1. platformPricing.allowVoucher must be true for the counselor type.
 * 2. voucher.isActive must be true.
 * 3. voucher.expiresAt (if set) must be in the future.
 * 4. voucher.usedCount must be strictly less than voucher.quota.
 * 5. discountType 'fixed' subtracts fixed amount (capped at grossAmount).
 * 6. discountType 'percentage' calculates % of grossAmount (capped at grossAmount).
 * 7. netAmount cannot be negative.
 */

export interface VoucherRecord {
  id: string
  code: string
  discountType: "fixed" | "percentage" | string
  discountValue: string | number
  quota: number
  usedCount: number
  expiresAt: Date | string | null
  isActive: boolean
}

export interface VoucherEvaluationResult {
  eligible: boolean
  reason?: string
  discountAmount: number
  netAmount: number
  voucher?: VoucherRecord
}

export function calculateDiscount(
  grossAmount: number,
  discountType: string,
  discountValue: number | string
): { discountAmount: number; netAmount: number } {
  const numericValue = typeof discountValue === "number" ? discountValue : parseFloat(discountValue)

  if (isNaN(numericValue) || numericValue <= 0 || grossAmount <= 0) {
    return {
      discountAmount: 0,
      netAmount: Math.max(0, grossAmount),
    }
  }

  let discount = 0
  if (discountType === "fixed") {
    discount = Math.min(numericValue, grossAmount)
  } else if (discountType === "percentage") {
    discount = Math.round((grossAmount * numericValue) / 100)
    discount = Math.min(discount, grossAmount)
  }

  const net = Math.max(0, grossAmount - discount)
  return {
    discountAmount: discount,
    netAmount: net,
  }
}

export function evaluateVoucherEligibility({
  voucher,
  allowVoucher,
  grossAmount,
  now = new Date(),
}: {
  voucher: VoucherRecord | null | undefined
  allowVoucher: boolean
  grossAmount: number
  now?: Date
}): VoucherEvaluationResult {
  if (!voucher) {
    return {
      eligible: false,
      reason: "Kode voucher tidak ditemukan",
      discountAmount: 0,
      netAmount: grossAmount,
    }
  }

  // 1. Check counselor type voucher policy
  if (!allowVoucher) {
    return {
      eligible: false,
      reason: "Voucher potongan harga tidak berlaku untuk tipe konselor ini",
      discountAmount: 0,
      netAmount: grossAmount,
      voucher,
    }
  }

  // 2. Check active status
  if (!voucher.isActive) {
    return {
      eligible: false,
      reason: "Kode voucher tidak aktif",
      discountAmount: 0,
      netAmount: grossAmount,
      voucher,
    }
  }

  // 3. Check expiration
  if (voucher.expiresAt) {
    const expiry = new Date(voucher.expiresAt)
    if (now.getTime() > expiry.getTime()) {
      return {
        eligible: false,
        reason: "Kode voucher telah kedaluwarsa",
        discountAmount: 0,
        netAmount: grossAmount,
        voucher,
      }
    }
  }

  // 4. Check quota
  if (voucher.usedCount >= voucher.quota) {
    return {
      eligible: false,
      reason: "Kuota penggunaan voucher ini telah habis",
      discountAmount: 0,
      netAmount: grossAmount,
      voucher,
    }
  }

  // 5. Calculate discount
  const { discountAmount, netAmount } = calculateDiscount(
    grossAmount,
    voucher.discountType,
    voucher.discountValue
  )

  return {
    eligible: true,
    discountAmount,
    netAmount,
    voucher,
  }
}
