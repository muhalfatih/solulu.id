import { formatRupiah } from "@/lib/utils"

/**
 * Pure Layanan (ADR-0010) pricing and eligibility rules.
 * No I/O here: callers pass rows read from the `services` table.
 * Durasi Layanan selalu 90 menit dan tidak dikonfigurasi.
 */

export type CounselorTypeKey = "peer" | "psychologist"

type NumericLike = string | number

export interface ServiceLike {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: NumericLike
  promoPrice: NumericLike | null
  allowVoucher: boolean
  overtimeRatePer30Min: NumericLike
  basePayoutPercent: number
  overtimePayoutPercent: number
  allowedCounselorTypes: CounselorTypeKey[]
  isActive: boolean
  sortOrder: number
}

export interface ServicePricingView {
  serviceId: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  promoPrice: number | null
  isPromoActive: boolean
  allowVoucher: boolean
  /** Tarif pokok aktif sebelum voucher: promo bila aktif, selain itu tarif dasar. */
  activePrice: number
  activePriceFormatted: string
  originalPriceFormatted?: string
  overtimeRatePer30Min: number
}

export interface CounselorRef {
  id: string
  counselorType: CounselorTypeKey
}

function toNumber(value: NumericLike): number {
  const n = typeof value === "number" ? value : parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function isPromoApplicable(service: Pick<ServiceLike, "basePrice" | "promoPrice">): boolean {
  if (service.promoPrice === null || service.promoPrice === undefined) return false
  const promo = toNumber(service.promoPrice)
  return promo >= 0 && promo < toNumber(service.basePrice)
}

/** Tagihan Perpanjangan Sesi ke Klien: blok overtime x tarif overtime Layanan. */
export function overtimeCharge(blocks: number, ratePer30Min: NumericLike): number {
  return Math.max(0, blocks) * toNumber(ratePer30Min)
}

/** Honor overtime Konselor: tagihan perpanjangan x Bagi Hasil overtime Layanan (%). */
export function overtimeHonor(
  blocks: number,
  ratePer30Min: NumericLike,
  overtimePayoutPercent: number
): number {
  return Math.round((overtimeCharge(blocks, ratePer30Min) * overtimePayoutPercent) / 100)
}

/** Tarif pokok aktif Layanan sebelum voucher. */
export function activePrice(service: Pick<ServiceLike, "basePrice" | "promoPrice">): number {
  return isPromoApplicable(service) ? toNumber(service.promoPrice as NumericLike) : toNumber(service.basePrice)
}

export function toServicePricingView(service: ServiceLike): ServicePricingView {
  const promoActive = isPromoApplicable(service)
  const price = activePrice(service)
  return {
    serviceId: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    basePrice: toNumber(service.basePrice),
    promoPrice:
      service.promoPrice === null || service.promoPrice === undefined
        ? null
        : toNumber(service.promoPrice),
    isPromoActive: promoActive,
    allowVoucher: service.allowVoucher,
    activePrice: price,
    activePriceFormatted: formatRupiah(price),
    originalPriceFormatted: promoActive ? formatRupiah(toNumber(service.basePrice)) : undefined,
    overtimeRatePer30Min: toNumber(service.overtimeRatePer30Min),
  }
}

/**
 * A Layanan is offered by a counselor when it is active, its allowed Tipe Konselor
 * matches, and the Admin has not switched it off for that specific counselor.
 */
export function isServiceOfferedBy(
  service: Pick<ServiceLike, "id" | "isActive" | "allowedCounselorTypes">,
  counselor: CounselorRef,
  excludedServiceIds: readonly string[]
): boolean {
  if (!service.isActive) return false
  if (!service.allowedCounselorTypes.includes(counselor.counselorType)) return false
  return !excludedServiceIds.includes(service.id)
}

export function listOfferedServices<T extends ServiceLike>(
  all: readonly T[],
  counselor: CounselorRef,
  excludedServiceIds: readonly string[]
): T[] {
  return all
    .filter((s) => isServiceOfferedBy(s, counselor, excludedServiceIds))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

/** "Mulai dari" view: cheapest active price, or null when nothing is on offer. */
export function startingFromView(views: readonly ServicePricingView[]): ServicePricingView | null {
  let best: ServicePricingView | null = null
  for (const v of views) {
    if (best === null || v.activePrice < best.activePrice) best = v
  }
  return best
}

/**
 * "Mulai dari" per Tipe Konselor over all active Layanan, for pages that are not
 * tied to one counselor (landing, pricing, screening). null = nothing on offer.
 */
export function startingPricesByCounselorType(
  all: readonly ServiceLike[]
): Record<CounselorTypeKey, ServicePricingView | null> {
  const forType = (type: CounselorTypeKey) =>
    startingFromView(
      all
        .filter((s) => s.isActive && s.allowedCounselorTypes.includes(type))
        .map(toServicePricingView)
    )
  return { peer: forType("peer"), psychologist: forType("psychologist") }
}

/**
 * Picks the Layanan for checkout. An explicit request must be one of the offered ones;
 * without a request, it is auto-selected only when exactly one is offered.
 */
export function resolveServiceSelection(
  offered: readonly ServicePricingView[],
  requestedServiceId: string | null | undefined
): ServicePricingView | null {
  if (requestedServiceId) {
    return offered.find((v) => v.serviceId === requestedServiceId) ?? null
  }
  return offered.length === 1 ? offered[0] : null
}
