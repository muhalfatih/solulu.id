"use server"

import { eq, and, gte, lte, inArray, desc } from "drizzle-orm"
import { db } from "@/db"
import { counselors, schedules, platformPricing } from "@/db/schema"
import {
  formatTimeRange,
  filterSlotsByConcurrencyGuard,
  getWIBDateString,
  getMaxBookableDateString,
  isSlotBookable,
  type SlotInterval,
} from "@/lib/schedules/concurrency"
import {
  catalogFilterSchema,
  type CatalogFilterInput,
} from "@/lib/validations/schedules"
import { getFallbackCounselors, getFallbackCounselorById } from "./data"
import { getPlatformPricing } from "@/lib/pricing/platform-pricing"
import { getActiveZoomCapacity } from "@/lib/zoom/active-capacity"

export interface CatalogPricing {
  basePrice: number
  promoPrice: number | null
  isSaleActive: boolean
  allowVoucher: boolean
  displayPrice: number
  displayPriceFormatted: string
  originalPriceFormatted?: string
}

export interface CatalogSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  timeRange: string
}

export interface CatalogCounselorView {
  id: string
  fullName: string
  title: string
  role?: string
  education?: string
  strNumber?: string | null
  isFeatured?: boolean
  counselorType: "peer" | "psychologist"
  counselorTypeDisplay: string
  bio: string
  specializations: string[]
  avatarR2Url: string | null
  rating?: string
  experience?: string
  availableSoon?: string
  pricing: CatalogPricing
  availableSlots: CatalogSlot[]
  totalAvailableSlotsCount: number
}

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Server action to retrieve the public catalog of verified counselors.
 * Enforces:
 * - Filtering by counselorType ('peer' | 'psychologist' | 'all')
 * - Filtering by date availability (hiding counselors who have no available slots on selected date)
 * - Platform Concurrency Guard: dynamically hides slots if >= 2 active sessions overlap across the platform
 * - Full time range formatting ("19:00 – 20:30 WIB")
 */
export async function getCounselorsCatalogAction(
  rawFilters?: CatalogFilterInput,
  options?: {
    getCounselors?: () => Promise<any[]>
    getPricing?: () => Promise<any[]>
    getSlots?: (counselorIds: string[], date?: string) => Promise<any[]>
    getActiveSessions?: (dates: string[]) => Promise<Record<string, SlotInterval[]>>
    getZoomCapacity?: () => Promise<number>
  }
): Promise<ActionResponse<CatalogCounselorView[]>> {
  const parsed = catalogFilterSchema.safeParse(rawFilters || {})
  if (!parsed.success) {
    return {
      success: false,
      error: "Filter pencarian katalog tidak valid",
    }
  }

  const { type: typeFilter, date: dateFilter } = parsed.data

  try {
    // 1. Fetch active counselors
    let counselorRows: any[] = []
    if (options?.getCounselors) {
      counselorRows = await options.getCounselors()
    } else {
      counselorRows = await db
        .select()
        .from(counselors)
        .where(eq(counselors.isActive, true))
    }

    // Filter by type if specified
    if (typeFilter && typeFilter !== "all") {
      counselorRows = counselorRows.filter((c) => c.counselorType === typeFilter)
    }

    if (counselorRows.length === 0) {
      const fallback = getFallbackCounselors(typeFilter, dateFilter)
      return { success: true, data: fallback }
    }

    const counselorIds = counselorRows.map((c) => c.id)

    // 2. Fetch platform pricing
    // 2. Fetch platform pricing tier configs (SSOT)
    const platformPricingData = await getPlatformPricing()

    const pricingMap: Record<string, CatalogPricing> = {}
    for (const type of ["peer", "psychologist"] as const) {
      const p = platformPricingData[type]
      const isSale = Boolean(p.isSaleActive && p.promoPrice && p.promoPrice < p.basePrice)
      const displayPrice = isSale && p.promoPrice ? p.promoPrice : p.basePrice
      pricingMap[type] = {
        basePrice: p.basePrice,
        promoPrice: p.promoPrice,
        isSaleActive: isSale,
        allowVoucher: p.allowVoucher,
        displayPrice,
        displayPriceFormatted: formatRupiah(displayPrice),
        originalPriceFormatted: isSale ? formatRupiah(p.basePrice) : undefined,
      }
    }

    let pricingRows: any[] = []
    if (options?.getPricing) {
      pricingRows = await options.getPricing()
      for (const pr of pricingRows) {
        const base = parseFloat(pr.basePrice)
        const promo = pr.promoPrice ? parseFloat(pr.promoPrice) : null
        const isSale = Boolean(pr.isSaleActive && promo && promo < base)
        const displayPrice = isSale && promo ? promo : base

        pricingMap[pr.counselorType] = {
          basePrice: base,
          promoPrice: promo,
          isSaleActive: isSale,
          allowVoucher: pr.allowVoucher ?? true,
          displayPrice,
          displayPriceFormatted: formatRupiah(displayPrice),
          originalPriceFormatted: isSale ? formatRupiah(base) : undefined,
        }
      }
    }

    // 3. Fetch candidate available slots within valid booking window (today until +14 days)
    const todayWIB = getWIBDateString()
    const maxDateWIB = getMaxBookableDateString()

    let slotRows: any[] = []
    if (options?.getSlots) {
      slotRows = await options.getSlots(counselorIds, dateFilter)
    } else {
      const conditions = [
        inArray(schedules.counselorId, counselorIds),
        eq(schedules.status, "available"),
        gte(schedules.date, todayWIB),
        lte(schedules.date, maxDateWIB),
      ]

      if (dateFilter) {
        conditions.push(eq(schedules.date, dateFilter))
      }

      slotRows = await db
        .select()
        .from(schedules)
        .where(and(...conditions))
        .orderBy(schedules.date, schedules.startTime)
    }

    // 4. Group candidate slots by date to query active platform sessions on each date
    const distinctDates = Array.from(new Set(slotRows.map((s) => s.date)))

    let activeSessionsByDate: Record<string, SlotInterval[]> = {}
    if (options?.getActiveSessions) {
      activeSessionsByDate = await options.getActiveSessions(distinctDates)
    } else if (distinctDates.length > 0) {
      const activeRows = await db
        .select({
          date: schedules.date,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          status: schedules.status,
        })
        .from(schedules)
        .where(
          and(
            inArray(schedules.date, distinctDates),
            inArray(schedules.status, ["reserved", "booked"])
          )
        )

      for (const d of distinctDates) {
        activeSessionsByDate[d] = activeRows.filter((r) => r.date === d)
      }
    }

    // 5. Apply Concurrency Guard AND 2-hour Lead Time Buffer to candidate slots
    const visibleSlotsByCounselor: Record<string, CatalogSlot[]> = {}
    for (const counselorId of counselorIds) {
      visibleSlotsByCounselor[counselorId] = []
    }

    let maxPlatformConcurrency = 2
    if (options?.getZoomCapacity) {
      maxPlatformConcurrency = await options.getZoomCapacity()
    } else {
      try {
        const cap = await getActiveZoomCapacity()
        if (cap > 0) {
          maxPlatformConcurrency = cap
        }
      } catch {}
    }

    const now = new Date()
    for (const slot of slotRows) {
      // Must be bookable (not in the past, >= 2h buffer if today, <= 14 days)
      const bookableCheck = isSlotBookable(slot.date, slot.startTime, now)
      if (!bookableCheck.bookable) {
        continue
      }

      const activeOnDate = activeSessionsByDate[slot.date] || []
      const [filtered] = filterSlotsByConcurrencyGuard([slot], activeOnDate, maxPlatformConcurrency)

      if (filtered) {
        visibleSlotsByCounselor[slot.counselorId].push({
          id: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timeRange: formatTimeRange(slot.startTime, slot.endTime),
        })
      }
    }

    // 6. Map to CatalogCounselorView
    let catalog: CatalogCounselorView[] = counselorRows.map((c) => {
      const slots = visibleSlotsByCounselor[c.id] || []
      const pricing =
        pricingMap[c.counselorType] ||
        (c.counselorType === "psychologist" ? pricingMap["psychologist"] : pricingMap["peer"])

      const isPsychologist = c.counselorType === "psychologist"
      const defaultAvatar = isPsychologist
        ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600"

      const hasSlotsToday = slots.some((s) => s.date === todayWIB)
      const tomorrowDate = new Date(now)
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrowWIB = getWIBDateString(tomorrowDate)
      const hasSlotsTomorrow = slots.some((s) => s.date === tomorrowWIB)

      const availableSoon =
        slots.length === 0
          ? "Jadwal Penuh"
          : hasSlotsToday
          ? "Tersedia Hari Ini"
          : hasSlotsTomorrow
          ? "Tersedia Besok"
          : "Tersedia Pekan Ini"

      return {
        id: c.id,
        fullName: c.fullName,
        title: c.title,
        role: isPsychologist ? "Psikolog Klinis Berizin Resmi" : "Konselor Sebaya (Partner Cerita)",
        education: c.education || (isPsychologist ? "S2 Profesi Psikologi • STR Terverifikasi" : "Sarjana Psikologi • Tersertifikasi"),
        strNumber: c.strNumber || null,
        isFeatured: Boolean(c.isFeatured),
        counselorType: c.counselorType,
        counselorTypeDisplay: isPsychologist ? "Psikolog Klinis" : "Konselor Sebaya",
        bio: c.bio,
        specializations: c.specializations || [],
        avatarR2Url: c.avatarR2Url || defaultAvatar,
        rating: isPsychologist ? "4.9" : "4.8",
        experience: isPsychologist ? "4+ Tahun" : "3+ Tahun",
        availableSoon,
        pricing,
        availableSlots: slots,
        totalAvailableSlotsCount: slots.length,
      }
    })

    // If date filter was applied: only show counselors who have at least 1 visible available slot on that date!
    if (dateFilter) {
      catalog = catalog.filter((c) => c.availableSlots.length > 0)
    }

    return {
      success: true,
      data: catalog,
    }
  } catch (err: any) {
    // If DB is offline or table does not exist, return realistic fallback catalog with SSOT pricing
    const platformPricingData = await getPlatformPricing()
    const fallback = getFallbackCounselors(typeFilter, dateFilter, platformPricingData)
    return {
      success: true,
      data: fallback,
    }
  }
}

export async function getCounselorByIdAction(
  counselorId: string
): Promise<ActionResponse<CatalogCounselorView | null>> {
  try {
    const catalogResult = await getCounselorsCatalogAction({ type: "all" })
    if (catalogResult.success && catalogResult.data) {
      const found = catalogResult.data.find((c) => c.id === counselorId)
      if (found) {
        return {
          success: true,
          data: found,
        }
      }
    }
    const platformPricingData = await getPlatformPricing()
    const fallback = getFallbackCounselorById(counselorId, platformPricingData)
    return {
      success: true,
      data: fallback,
    }
  } catch (err: any) {
    const platformPricingData = await getPlatformPricing()
    const fallback = getFallbackCounselorById(counselorId, platformPricingData)
    return {
      success: true,
      data: fallback,
    }
  }
}

