export interface PricingTierConfig {
  counselorType: "peer" | "psychologist"
  basePrice: string | number
  promoPrice?: string | number | null
  isSaleActive: boolean
  allowVoucher: boolean
}

export interface VoucherConfig {
  id?: string
  code: string
  discountType: "fixed" | "percentage"
  discountValue: string | number
  quota: number
  usedCount: number
  expiresAt?: string | Date | null
  isActive: boolean
}

export interface VoucherValidationResult {
  valid: boolean
  finalPrice?: number
  discountAmount?: number
  reason?: string
}

/**
 * Validates voucher applicability based on pricing tier restrictions:
 * Checks isSaleActive, allowVoucher, quota, and expiration.
 */
export function validateVoucherEligibility(
  pricing: PricingTierConfig,
  voucher: VoucherConfig,
  now: Date = new Date()
): VoucherValidationResult {
  const currentPrice =
    pricing.isSaleActive && pricing.promoPrice
      ? Number(pricing.promoPrice)
      : Number(pricing.basePrice)

  // 1. Role / Pricing tier allowVoucher restriction check
  if (!pricing.allowVoucher) {
    return {
      valid: false,
      reason: `Layanan konseling (${pricing.counselorType}) diatur sebagai promo nett dan tidak dapat ditumpuk dengan voucher diskon.`,
    }
  }

  // 2. Active status
  if (!voucher.isActive) {
    return {
      valid: false,
      reason: `Voucher "${voucher.code}" sedang tidak aktif.`,
    }
  }

  // 3. Quota check
  if (voucher.quota > 0 && voucher.usedCount >= voucher.quota) {
    return {
      valid: false,
      reason: `Kuota penggunaan voucher "${voucher.code}" telah habis.`,
    }
  }

  // 4. Expiration check
  if (voucher.expiresAt) {
    const expiryTime = new Date(voucher.expiresAt).getTime()
    if (now.getTime() > expiryTime) {
      return {
        valid: false,
        reason: `Voucher "${voucher.code}" telah kedaluwarsa.`,
      }
    }
  }

  // Calculate discount
  let discountAmount = 0
  if (voucher.discountType === "fixed") {
    discountAmount = Math.min(Number(voucher.discountValue), currentPrice)
  } else {
    // percentage
    const percent = Math.min(100, Math.max(0, Number(voucher.discountValue)))
    discountAmount = Math.round((currentPrice * percent) / 100)
  }

  const finalPrice = Math.max(0, currentPrice - discountAmount)

  return {
    valid: true,
    finalPrice,
    discountAmount,
  }
}
