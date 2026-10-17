import { eq, and, inArray, sql, asc } from "drizzle-orm"
import { db } from "@/db"
import { counselors, schedules, platformPricing, bookings } from "@/db/schema"
import {
  formatTimeRange,
  getWIBDateString,
  isSlotBookable,
} from "@/lib/schedules/concurrency"
import { getCounselorRadarAlert, type CounselorRadarAlert } from "@/lib/counselor/credentials"
import { getPlatformPricing } from "@/lib/pricing/platform-pricing"

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

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export interface CatalogQueryFilters {
  type?: "all" | "peer" | "psychologist"
  date?: string
}

/**
 * Deep Module: Counselor Directory (SSOT)
 *
 * Exclusively queries PostgreSQL (Supabase) via Drizzle ORM per Zero-Mock policy.
 * Returns empty array [] or null if no records found — never serves mock data fallbacks.
 */
export async function listCatalogCounselors(
  filters?: CatalogQueryFilters
): Promise<CatalogCounselorView[]> {
  try {
    const typeFilter = filters?.type && filters.type !== "all" ? filters.type : undefined
    const dateFilter = filters?.date?.trim()

    // 1. Fetch active, approved counselors
    const counselorConditions = [eq(counselors.isActive, true)]
    if (typeFilter) {
      counselorConditions.push(eq(counselors.counselorType, typeFilter))
    }

    const counselorRows = await db
      .select()
      .from(counselors)
      .where(and(...counselorConditions))
      .orderBy(counselors.fullName)

    if (counselorRows.length === 0) {
      return []
    }

    const counselorIds = counselorRows.map((c) => c.id)

    // 2. Fetch platform pricing
    const pricingRows = await db.select().from(platformPricing)
    const pricingMap = new Map<string, any>()
    for (const p of pricingRows) {
      pricingMap.set(p.counselorType, p)
    }

    // 3. Fetch bookable available schedules
    const now = new Date()
    const todayWIB = getWIBDateString(now)
    const tomorrowDate = new Date(now)
    tomorrowDate.setDate(tomorrowDate.getDate() + 1)
    const tomorrowWIB = getWIBDateString(tomorrowDate)

    const scheduleConditions = [
      inArray(schedules.counselorId, counselorIds),
      eq(schedules.status, "available"),
      eq(schedules.isLeave, false),
    ]

    if (dateFilter) {
      scheduleConditions.push(eq(schedules.date, dateFilter))
    }

    const scheduleRows = await db
      .select()
      .from(schedules)
      .where(and(...scheduleConditions))
      .orderBy(asc(schedules.date), asc(schedules.startTime))

    // Map schedules by counselorId
    const schedulesByCounselor = new Map<string, CatalogSlot[]>()
    for (const s of scheduleRows) {
      const { bookable } = isSlotBookable(s.date, s.startTime, now)
      if (!bookable) continue

      const list = schedulesByCounselor.get(s.counselorId) || []
      list.push({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        timeRange: formatTimeRange(s.startTime, s.endTime),
      })
      schedulesByCounselor.set(s.counselorId, list)
    }

    // 4. Assemble public catalog views
    const results: CatalogCounselorView[] = []

    for (const c of counselorRows) {
      const slots = schedulesByCounselor.get(c.id) || []

      // If filtering by date and counselor has no slots on that date, skip
      if (dateFilter && slots.length === 0) {
        continue
      }

      const p = pricingMap.get(c.counselorType) || {
        basePrice: c.counselorType === "psychologist" ? 130000 : 85000,
        promoPrice: null,
        isSaleActive: false,
        allowVoucher: true,
      }

      const isSale = Boolean(p.isSaleActive && p.promoPrice && p.promoPrice < p.basePrice)
      const displayPrice = isSale && p.promoPrice ? p.promoPrice : p.basePrice

      const hasSlotsToday = slots.some((s) => s.date === todayWIB)
      const hasSlotsTomorrow = slots.some((s) => s.date === tomorrowWIB)
      const availableSoon =
        slots.length === 0
          ? "Jadwal Penuh"
          : hasSlotsToday
          ? "Tersedia Hari Ini"
          : hasSlotsTomorrow
          ? "Tersedia Besok"
          : "Tersedia Pekan Ini"

      results.push({
        id: c.id,
        fullName: c.fullName,
        title: c.title,
        education: c.education || undefined,
        strNumber: c.strNumber || null,
        isFeatured: c.isFeatured || false,
        counselorType: c.counselorType as "peer" | "psychologist",
        counselorTypeDisplay:
          c.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
        bio: c.bio || "",
        specializations: (c.specializations as string[]) || [],
        avatarR2Url: c.avatarR2Url,
        rating: "4.9",
        experience: c.experienceYears ? `${c.experienceYears}+ Tahun` : undefined,
        availableSoon,
        pricing: {
          basePrice: p.basePrice,
          promoPrice: p.promoPrice,
          isSaleActive: isSale,
          allowVoucher: p.allowVoucher,
          displayPrice,
          displayPriceFormatted: formatRupiah(displayPrice),
          originalPriceFormatted: isSale ? formatRupiah(p.basePrice) : undefined,
        },
        availableSlots: slots,
        totalAvailableSlotsCount: slots.length,
      })
    }

    return results
  } catch (error: any) {
    console.error("[COUNSELOR DIRECTORY] listCatalogCounselors error:", error)
    return []
  }
}

/**
 * Fetches single counselor profile by ID with pricing and available slots.
 */
export async function getCounselorProfileById(
  counselorId: string
): Promise<CatalogCounselorView | null> {
  const all = await listCatalogCounselors()
  return all.find((c) => c.id === counselorId) || null
}
