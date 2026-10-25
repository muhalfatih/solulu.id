"use server"

import { revalidatePath } from "next/cache"
import { eq, and, desc, sql, or } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, transactions, sessionReports } from "@/db/schema"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/app/admin/counselors/actions"
import { getAppBaseUrl } from "@/lib/url"

function safeRevalidatePaths(...paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p)
    }
  } catch {
    // Safe fallback in test environments
  }
}

export interface ClinicalReportPreview {
  id: string
  mainIssue: string
  summary: string
  actionPlan: string | null
  followUpRecommendation: string | null
  actualDurationMinutes: number | null
  createdAt: string
}

export interface AdminBookingItem {
  id: string
  bookingCode: string
  accessToken: string
  patientName: string
  patientPhone: string
  patientEmail: string
  gender: string | null
  age: number | null
  domicile: string | null
  initialNotes: string | null
  counselorId: string
  counselorName: string
  counselorTitle: string
  counselorType: string
  scheduleDate: string
  slotIndex: number
  startTime: string
  endTime: string
  timeRange: string
  zoomMeetingId: string | null
  zoomJoinUrl: string | null
  zoomStartUrl: string | null
  zoomHostKey: string | null
  status: "pending_payment" | "confirmed" | "completed" | "cancelled"
  paymentMethod: string
  manualPaymentStatus: string
  isExtended: boolean
  extensionFee: number
  isNoShow: boolean
  noShowMarkedAt: string | null
  isFollowedUp: boolean
  followedUpAt: string | null
  hasSessionReport: boolean
  sessionReportId: string | null
  reportDetails?: ClinicalReportPreview | null
  createdAt: string
}

export interface BookingCounselorOption {
  id: string
  fullName: string
  counselorType: string
}

export interface GetBookingsFilters {
  slotIndex?: number | null
  status?: string | null
  counselorId?: string | null
  search?: string | null
  reportStatus?: "all" | "filled" | "pending" | null
}

/**
 * Generates pre-filled WhatsApp link pointing to the client's session report.
 */
export async function generateWhatsAppReportUrl(booking: {
  patientName: string
  patientPhone: string
  accessToken: string
}): Promise<string> {
  const digitsOnly = booking.patientPhone.replace(/\D/g, "")
  const cleanPhone = digitsOnly.startsWith("0") ? `62${digitsOnly.slice(1)}` : digitsOnly
  const baseUrl = getAppBaseUrl()
  const reportUrl = `${baseUrl}/session/${booking.accessToken}`

  const message = `Halo Kak ${booking.patientName}, laporan sesi konseling Solulu Anda telah tersedia dan dapat diakses melalui tautan berikut: ${reportUrl}. Terima kasih telah mempercayakan kesehatan mental Anda bersama Solulu.`

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Fetches all bookings with filters for slot index, status, counselor, and search keyword.
 * Strictly adheres to Database-First & Zero-Mock Policy.
 */
export async function getBookingsAdminAction(
  filters?: GetBookingsFilters,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchFn?: () => Promise<{ bookings: AdminBookingItem[]; counselors: BookingCounselorOption[] }>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
      bookings: [] as AdminBookingItem[],
      counselors: [] as BookingCounselorOption[],
    }
  }

  if (options?.fetchFn) {
    try {
      const res = await options.fetchFn()
      return { success: true, ...res }
    } catch (err: any) {
      return { success: false, error: err.message, bookings: [], counselors: [] }
    }
  }

  try {
    const conditions = []

    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(bookings.status, filters.status as any))
    }

    if (filters?.counselorId && filters.counselorId !== "all") {
      conditions.push(eq(bookings.counselorId, filters.counselorId))
    }

    if (filters?.slotIndex && filters.slotIndex > 0) {
      conditions.push(eq(schedules.slotIndex, filters.slotIndex))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, counselorRows] = await Promise.all([
      db
        .select({
          booking: bookings,
          counselor: counselors,
          schedule: schedules,
          report: sessionReports,
        })
        .from(bookings)
        .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
        .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
        .where(whereClause)
        .orderBy(desc(bookings.createdAt)),
      db
        .select({
          id: counselors.id,
          fullName: counselors.fullName,
          counselorType: counselors.counselorType,
        })
        .from(counselors)
        .orderBy(counselors.fullName),
    ])

    let mapped: AdminBookingItem[] = rows.map((r) => {
      const b = r.booking
      const c = r.counselor
      const s = r.schedule
      const rep = r.report

      const counselorTypeLabel =
        c?.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"
      const dateStr = s?.date ? String(s.date) : ""
      const timeRange = s
        ? `${s.startTime?.slice(0, 5)} - ${s.endTime?.slice(0, 5)}`
        : "09:00 - 10:30"

      return {
        id: b.id,
        bookingCode: b.bookingCode,
        accessToken: b.accessToken,
        patientName: b.patientName,
        patientPhone: b.patientPhone,
        patientEmail: b.patientEmail,
        gender: b.gender,
        age: b.age,
        domicile: b.domicile,
        initialNotes: b.initialNotes,
        counselorId: c?.id || "",
        counselorName: c?.fullName || "Belum Ditugaskan",
        counselorTitle: c?.title || "",
        counselorType: counselorTypeLabel,
        scheduleDate: dateStr,
        slotIndex: s?.slotIndex || 1,
        startTime: s?.startTime ? s.startTime.slice(0, 5) : "08:00",
        endTime: s?.endTime ? s.endTime.slice(0, 5) : "10:00",
        timeRange,
        zoomMeetingId: b.zoomMeetingId,
        zoomJoinUrl: b.zoomJoinUrl,
        zoomStartUrl: b.zoomStartUrl,
        zoomHostKey: b.zoomHostKey,
        status: b.status as any,
        paymentMethod: b.paymentMethod,
        manualPaymentStatus: b.manualPaymentStatus || "NONE",
        isExtended: b.isExtended,
        extensionFee: Number(b.extensionFee) || 0,
        isNoShow: b.isNoShow,
        noShowMarkedAt: b.noShowMarkedAt ? b.noShowMarkedAt.toISOString() : null,
        isFollowedUp: b.isFollowedUp,
        followedUpAt: b.followedUpAt ? b.followedUpAt.toISOString() : null,
        hasSessionReport: Boolean(rep?.id),
        sessionReportId: rep?.id || null,
        reportDetails: rep?.id
          ? {
              id: rep.id,
              mainIssue: rep.mainIssue || "Konsultasi Emosional & Stres",
              summary: rep.summary || "",
              actionPlan: rep.actionPlan || null,
              followUpRecommendation: rep.followUpRecommendation || null,
              actualDurationMinutes: rep.actualDurationMinutes || null,
              createdAt: rep.createdAt ? rep.createdAt.toISOString() : b.createdAt.toISOString(),
            }
          : null,
        createdAt: b.createdAt.toISOString(),
      }
    })

    // Apply reportStatus filter if specified
    if (filters?.reportStatus === "filled") {
      mapped = mapped.filter((b) => b.hasSessionReport)
    } else if (filters?.reportStatus === "pending") {
      mapped = mapped.filter((b) => !b.hasSessionReport && b.status === "completed")
    }

    // Apply search filter in-memory if query provided
    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim()
      mapped = mapped.filter(
        (b) =>
          b.patientName.toLowerCase().includes(q) ||
          b.bookingCode.toLowerCase().includes(q) ||
          b.patientPhone.includes(q) ||
          b.patientEmail.toLowerCase().includes(q)
      )
    }

    const counselorOptions: BookingCounselorOption[] = counselorRows.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      counselorType: c.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
    }))

    return {
      success: true,
      bookings: mapped,
      counselors: counselorOptions,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memuat daftar pemesanan sesi.",
      bookings: [],
      counselors: [],
    }
  }
}

/**
 * Action "Tandai No-Show":
 * Flags sessions where clients fail to arrive within 30 minutes of slot start time.
 * Mutates `is_no_show: true`, `status: 'completed'`, and records timestamp.
 */
export async function markBookingNoShowAction(
  input: { bookingId: string },
  options?: {
    currentUser?: AdminAuthContext | null
    updateFn?: (bookingId: string, values: any) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  const { bookingId } = input
  if (!bookingId) {
    return { success: false, error: "ID Pemesanan wajib disertakan." }
  }

  try {
    const updateData = {
      isNoShow: true,
      noShowMarkedAt: new Date(),
      status: "completed" as const,
    }

    if (options?.updateFn) {
      await options.updateFn(bookingId, updateData)
    } else {
      await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, bookingId))
    }

    safeRevalidatePaths("/admin/bookings", "/admin/sessions", "/admin")

    return {
      success: true,
      message: "Sesi berhasil ditandai sebagai No-Show (Klien tidak hadir setelah 30 menit).",
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menandai sesi sebagai No-Show.",
    }
  }
}

/**
 * Action "Kirim WA Laporan":
 * Records follow-up completion in the database (`is_followed_up: true`, `followed_up_at: NOW()`).
 */
export async function markBookingFollowedUpAction(
  input: { bookingId: string },
  options?: {
    currentUser?: AdminAuthContext | null
    updateFn?: (bookingId: string, values: any) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  const { bookingId } = input
  if (!bookingId) {
    return { success: false, error: "ID Pemesanan wajib disertakan." }
  }

  try {
    const updateData = {
      isFollowedUp: true,
      followedUpAt: new Date(),
    }

    if (options?.updateFn) {
      await options.updateFn(bookingId, updateData)
    } else {
      await db
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.id, bookingId))
    }

    safeRevalidatePaths("/admin/bookings", "/admin/sessions")

    return {
      success: true,
      message: "Status pengiriman WA laporan berhasil dicatat.",
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mencatat status pengiriman laporan WA.",
    }
  }
}
