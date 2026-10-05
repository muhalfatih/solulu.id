import type { CatalogCounselorView, CatalogPricing } from "./actions"
import {
  DEFAULT_PLATFORM_PRICING,
  type PlatformPricingData,
} from "@/lib/pricing/platform-pricing"
import { formatRupiah } from "@/lib/booking/checkout"
import {
  getActiveStoreCounselors,
  getStoreCounselorById,
} from "@/lib/counselor/registry"

export function makeCatalogPricing(
  type: "peer" | "psychologist",
  pricingData: PlatformPricingData = DEFAULT_PLATFORM_PRICING
): CatalogPricing {
  const p = pricingData[type]
  const isSale = Boolean(p.isSaleActive && p.promoPrice && p.promoPrice < p.basePrice)
  const displayPrice = isSale && p.promoPrice ? p.promoPrice : p.basePrice
  return {
    basePrice: p.basePrice,
    promoPrice: p.promoPrice,
    isSaleActive: isSale,
    allowVoucher: p.allowVoucher,
    displayPrice,
    displayPriceFormatted: formatRupiah(displayPrice),
    originalPriceFormatted: isSale ? formatRupiah(p.basePrice) : undefined,
  }
}

export function getFallbackCounselors(
  typeFilter?: "all" | "peer" | "psychologist",
  dateFilter?: string,
  pricingData: PlatformPricingData = DEFAULT_PLATFORM_PRICING
): CatalogCounselorView[] {
  const storeCounselors = getActiveStoreCounselors(typeFilter)

  let all: CatalogCounselorView[] = storeCounselors.map((c) => {
    const slots = (c.slots || []).map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      timeRange: s.timeRange,
    }))

    const defaultAvatar =
      c.counselorType === "psychologist"
        ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600"

    return {
      id: c.id,
      fullName: c.fullName,
      title: c.title,
      role: c.role,
      education: c.education,
      counselorType: c.counselorType,
      counselorTypeDisplay: c.counselorTypeDisplay,
      bio: c.bio,
      specializations: c.specializations,
      avatarR2Url: c.avatarR2Url || defaultAvatar,
      rating: c.rating,
      experience: c.experience,
      availableSoon: slots.length > 0 ? "Tersedia Besok" : "Jadwal Penuh",
      pricing: makeCatalogPricing(c.counselorType, pricingData),
      availableSlots: slots,
      totalAvailableSlotsCount: slots.length,
    }
  })

  if (dateFilter) {
    all = all.filter((c) => c.availableSlots.some((s) => s.date === dateFilter))
  }

  return all
}

export function getFallbackCounselorById(
  id: string,
  pricingData: PlatformPricingData = DEFAULT_PLATFORM_PRICING
): CatalogCounselorView | null {
  const all = getFallbackCounselors("all", undefined, pricingData)
  const found =
    all.find((c) => c.id === id) ||
    all.find((c) => c.id.toLowerCase() === id.toLowerCase())
  if (found) return found

  const storeItem = getStoreCounselorById(id)
  if (storeItem) {
    const slots = (storeItem.slots || []).map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      timeRange: s.timeRange,
    }))

    const defaultAvatar =
      storeItem.counselorType === "psychologist"
        ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600"

    return {
      id: storeItem.id,
      fullName: storeItem.fullName,
      title: storeItem.title,
      role: storeItem.role,
      education: storeItem.education,
      counselorType: storeItem.counselorType,
      counselorTypeDisplay: storeItem.counselorTypeDisplay,
      bio: storeItem.bio,
      specializations: storeItem.specializations,
      avatarR2Url: storeItem.avatarR2Url || defaultAvatar,
      rating: storeItem.rating,
      experience: storeItem.experience,
      availableSoon: slots.length > 0 ? "Tersedia Besok" : "Jadwal Penuh",
      pricing: makeCatalogPricing(storeItem.counselorType, pricingData),
      availableSlots: slots,
      totalAvailableSlotsCount: slots.length,
    }
  }

  return all[0] || null
}
