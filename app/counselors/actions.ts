"use server"

import { eq, and, gte, lte, inArray, desc } from "drizzle-orm"
import { db } from "@/db"
import { counselors, schedules, platformPricing } from "@/db/schema"
import {
  formatTimeRange,
  filterSlotsByConcurrencyGuard,
  type SlotInterval,
} from "@/lib/schedules/concurrency"
import {
  catalogFilterSchema,
  type CatalogFilterInput,
} from "@/lib/validations/schedules"

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
  counselorType: "peer" | "psychologist"
  counselorTypeDisplay: string
  bio: string
  specializations: string[]
  avatarR2Url: string | null
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
      return { success: true, data: [] }
    }

    const counselorIds = counselorRows.map((c) => c.id)

    // 2. Fetch platform pricing
    let pricingRows: any[] = []
    if (options?.getPricing) {
      pricingRows = await options.getPricing()
    } else {
      pricingRows = await db.select().from(platformPricing)
    }

    const pricingMap: Record<string, CatalogPricing> = {}
    // Defaults if platformPricing table is empty
    pricingMap["peer"] = {
      basePrice: 50000,
      promoPrice: null,
      isSaleActive: false,
      allowVoucher: true,
      displayPrice: 50000,
      displayPriceFormatted: formatRupiah(50000),
    }
    pricingMap["psychologist"] = {
      basePrice: 150000,
      promoPrice: null,
      isSaleActive: false,
      allowVoucher: true,
      displayPrice: 150000,
      displayPriceFormatted: formatRupiah(150000),
    }

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

    // 3. Fetch candidate available slots
    let slotRows: any[] = []
    if (options?.getSlots) {
      slotRows = await options.getSlots(counselorIds, dateFilter)
    } else {
      const conditions = [
        inArray(schedules.counselorId, counselorIds),
        eq(schedules.status, "available"),
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

    // 5. Apply Concurrency Guard to candidate slots
    const visibleSlotsByCounselor: Record<string, CatalogSlot[]> = {}
    for (const counselorId of counselorIds) {
      visibleSlotsByCounselor[counselorId] = []
    }

    for (const slot of slotRows) {
      const activeOnDate = activeSessionsByDate[slot.date] || []
      const [filtered] = filterSlotsByConcurrencyGuard([slot], activeOnDate)

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

      return {
        id: c.id,
        fullName: c.fullName,
        title: c.title,
        counselorType: c.counselorType,
        counselorTypeDisplay:
          c.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
        bio: c.bio,
        specializations: c.specializations || [],
        avatarR2Url: c.avatarR2Url || null,
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
    return {
      success: false,
      error: err.message || "Gagal memuat katalog konselor",
    }
  }
}
