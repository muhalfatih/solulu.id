"use server"

import { eq, and, gte, lte, inArray, desc } from "drizzle-orm"
import { db } from "@/db"
import { counselors, schedules } from "@/db/schema"
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
import {
  listOfferedServices,
  startingFromView,
  toServicePricingView,
  type ServiceLike,
  type ServicePricingView,
} from "@/lib/services/pricing"
import { listAllServices, getExclusionsByCounselor } from "@/lib/services/repository"
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
  /** "Mulai dari": tarif aktif termurah di antara Layanan yang ditawarkan konselor ini. */
  pricing: CatalogPricing
  /** Layanan aktif yang ditawarkan konselor ini (tipe cocok, tidak dikecualikan Admin). */
  services: ServicePricingView[]
  availableSlots: CatalogSlot[]
  totalAvailableSlotsCount: number
}

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
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
    getServices?: () => Promise<ServiceLike[]>
    getExclusions?: (counselorIds: string[]) => Promise<Record<string, string[]>>
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

  const { type: typeFilter, date: dateFilter, serviceId: serviceFilter } = parsed.data

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
      return { success: true, data: [] }
    }

    const counselorIds = counselorRows.map((c) => c.id)

    // 2. Fetch Layanan (ADR-0010) and per-counselor exclusions. No fallback prices:
    // a counselor without an offered Layanan simply is not listed.
    const allServices = options?.getServices ? await options.getServices() : await listAllServices()
    let exclusionsByCounselor: Record<string, string[]> = {}
    if (options?.getExclusions) {
      exclusionsByCounselor = await options.getExclusions(counselorIds)
    } else {
      const map = await getExclusionsByCounselor(counselorIds)
      exclusionsByCounselor = Object.fromEntries(map)
    }

    const servicesByCounselor: Record<string, ServicePricingView[]> = {}
    for (const c of counselorRows) {
      servicesByCounselor[c.id] = listOfferedServices(
        allServices,
        { id: c.id, counselorType: c.counselorType },
        exclusionsByCounselor[c.id] ?? []
      ).map(toServicePricingView)
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

    let maxPlatformConcurrency = 10
    if (options?.getZoomCapacity) {
      maxPlatformConcurrency = await options.getZoomCapacity()
    } else {
      const cap = await getActiveZoomCapacity()
      if (cap >= 4) {
        maxPlatformConcurrency = 10
      } else if (cap > 0) {
        maxPlatformConcurrency = cap
      }
    }

    const now = new Date()
    for (const slot of slotRows) {
      // Exclude active slot hold (payment in-flight)
      if (slot.reservedUntil && new Date(slot.reservedUntil) > now) {
        continue
      }
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
    const toCatalogPricing = (v: ServicePricingView): CatalogPricing => ({
      basePrice: v.basePrice,
      promoPrice: v.promoPrice,
      isSaleActive: v.isPromoActive,
      allowVoucher: v.allowVoucher,
      displayPrice: v.activePrice,
      displayPriceFormatted: v.activePriceFormatted,
      originalPriceFormatted: v.originalPriceFormatted,
    })

    const listedCounselors = counselorRows
      .map((c) => {
        const offered = servicesByCounselor[c.id] ?? []
        const relevant = serviceFilter ? offered.filter((v) => v.serviceId === serviceFilter) : offered
        return { c, offered, start: startingFromView(relevant) }
      })
      .filter((entry) => entry.start !== null)

    let catalog: CatalogCounselorView[] = listedCounselors.map(({ c, offered, start }) => {
      const slots = visibleSlotsByCounselor[c.id] || []
      const pricing = toCatalogPricing(start as ServicePricingView)

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
        services: offered,
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
    return {
      success: false,
      error: err.message || "Gagal memuat katalog konselor dari database.",
      data: [],
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
    return {
      success: false,
      error: "Mitra konselor tidak ditemukan.",
      data: null,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil data konselor.",
      data: null,
    }
  }
}

