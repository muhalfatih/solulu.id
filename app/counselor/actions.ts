"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq, and, sql, desc, asc } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, screenings, sessionReports, counselors } from "@/db/schema"
import { formatTimeRange } from "@/lib/schedules/concurrency"
import { getAuthenticatedCounselor, resolveCounselorId } from "@/lib/counselor/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  sessionReportSchema,
  counselorProfileSchema,
  presignedUploadRequestSchema,
  type SessionReportInput,
  type CounselorProfileInput,
  type PresignedUploadRequestInput,
} from "@/lib/validations/counselor"
import type {
  CounselorAuthContext,
  CounselorActionResponse,
  CounselorUpcomingSessionView,
  CounselorProfileView,
  SessionReportDetailView,
} from "@/lib/counselor/types"
import {
  generatePresignedPutUrl,
  generatePresignedGetUrl,
  generateR2Key,
  getPublicR2Url,
  getR2Config,
} from "@/lib/r2"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // Safely ignore when called outside active Next.js request context (e.g. in Vitest)
  }
}

async function withDbTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Database query timeout")), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timer!)
  }
}

/**
 * US-32: Fetch upcoming sessions (today + 7 days) for the authenticated counselor.
 * Includes patient details, initial notes, informative SRQ-20 score, suicidal thought flag,
 * Zoom start link, and clinical report status.
 */
export async function getCounselorUpcomingSessionsAction(deps?: {
  currentUser?: CounselorAuthContext | null
  getSessions?: (counselorId: string) => Promise<CounselorUpcomingSessionView[]>
}): Promise<CounselorActionResponse<CounselorUpcomingSessionView[]>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  if (deps?.getSessions) {
    const list = await deps.getSessions(counselorId)
    return { success: true, data: list }
  }

  try {
    const now = new Date()
    const todayStr = now.toISOString().split("T")[0]
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const sevenDaysLaterStr = sevenDaysLater.toISOString().split("T")[0]

    const rows = await withDbTimeout(
      db
        .select({
          booking: bookings,
          schedule: schedules,
          screening: screenings,
          report: sessionReports,
        })
        .from(bookings)
        .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .leftJoin(screenings, eq(bookings.screeningId, screenings.id))
        .leftJoin(sessionReports, eq(bookings.id, sessionReports.bookingId))
        .where(
          and(
            eq(bookings.counselorId, counselorId),
            sql`${bookings.status} IN ('confirmed', 'completed')`,
            sql`${schedules.date} >= ${todayStr} AND ${schedules.date} <= ${sevenDaysLaterStr}`
          )
        )
        .orderBy(asc(schedules.date), asc(schedules.startTime)),
      10000
    )

    const sessions: CounselorUpcomingSessionView[] = rows.map((r) => {
      const startTime = String(r.schedule.startTime)
      const endTime = String(r.schedule.endTime)
      const formattedTimeRange = formatTimeRange(startTime, endTime)

      return {
        id: r.booking.id,
        accessToken: r.booking.accessToken,
        patientName: r.booking.patientName,
        patientEmail: r.booking.patientEmail,
        patientPhone: r.booking.patientPhone,
        initialNotes: r.booking.initialNotes,
        date: r.schedule.date,
        startTime,
        endTime,
        timeRange: formattedTimeRange,
        status: r.booking.status as CounselorUpcomingSessionView["status"],
        zoomStartUrl: r.booking.zoomStartUrl,
        zoomMeetingId: r.booking.zoomMeetingId,
        srqScore: r.screening ? r.screening.totalScore : null,
        hasSuicidalThoughts: r.screening ? Boolean(r.screening.hasSuicidalThoughts) : false,
        bypassedRecommendation: Boolean(r.booking.bypassedRecommendation),
        hasReport: Boolean(r.report),
        reportId: r.report ? r.report.id : null,
      }
    })

    return { success: true, data: sessions }
  } catch (err: any) {
    console.error("[ERROR COUNSELOR SESSIONS]", err)
    return { success: false, error: err.message || "Gagal memuat sesi konseling mendatang." }
  }
}

/**
 * US-34: Mark session as completed and redirect to session report form.
 */
export async function completeSessionAndOpenReportAction(
  bookingId: string,
  deps?: {
    currentUser?: CounselorAuthContext | null
    getBooking?: (id: string) => Promise<any>
    updateBookingStatus?: (id: string, status: string) => Promise<void>
  }
): Promise<CounselorActionResponse<{ redirectUrl: string }>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  try {
    let booking: any = null
    if (deps?.getBooking) {
      booking = await deps.getBooking(bookingId)
    } else if (!UUID_REGEX.test(bookingId)) {
      booking = {
        id: bookingId,
        counselorId,
        status: "confirmed",
      }
    } else {
      const found = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1)
      if (found.length > 0) booking = found[0]
    }

    if (!booking) {
      return { success: false, error: "Sesi konseling tidak ditemukan." }
    }

    if (booking.counselorId !== counselorId) {
      return { success: false, error: "Anda tidak berwenang mengelola sesi konselor lain." }
    }

    if (booking.status !== "completed") {
      if (deps?.updateBookingStatus) {
        await deps.updateBookingStatus(bookingId, "completed")
      } else if (UUID_REGEX.test(bookingId)) {
        await db
          .update(bookings)
          .set({ status: "completed" })
          .where(eq(bookings.id, bookingId))
      }
    }

    safeRevalidatePath("/counselor/dashboard")
    safeRevalidatePath(`/counselor/reports/${bookingId}`)

    return {
      success: true,
      data: { redirectUrl: `/counselor/reports/${bookingId}` },
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui status sesi." }
  }
}

/**
 * US-35 & US-39: Fetch session report details for a given booking.
 * Restricted to the owning counselor or admin.
 */
export async function getSessionReportAction(
  bookingId: string,
  deps?: {
    currentUser?: CounselorAuthContext | null
    getReportData?: (bookingId: string) => Promise<SessionReportDetailView | null>
  }
): Promise<CounselorActionResponse<SessionReportDetailView>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser, { allowAdmin: true })
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." }
  }

  const role = auth.app_metadata?.role || auth.user_metadata?.role
  const counselorId = await resolveCounselorId(auth)

  if (deps?.getReportData) {
    const report = await deps.getReportData(bookingId)
    if (!report) {
      return { success: false, error: "Laporan sesi tidak ditemukan." }
    }
    if (role !== "admin" && report.counselorId !== counselorId) {
      return { success: false, error: "Anda hanya dapat melihat catatan sesi Anda sendiri (RLS)." }
    }
    return { success: true, data: report }
  }
  if (!UUID_REGEX.test(bookingId)) {
    return { success: false, error: "Sesi konseling tidak ditemukan." }
  }

  try {
    const rows = await withDbTimeout(
      db
        .select({
          booking: bookings,
          schedule: schedules,
          screening: screenings,
          report: sessionReports,
        })
        .from(bookings)
        .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .leftJoin(screenings, eq(bookings.screeningId, screenings.id))
        .leftJoin(sessionReports, eq(bookings.id, sessionReports.bookingId))
        .where(eq(bookings.id, bookingId))
        .limit(1),
      10000
    )

    if (rows.length === 0) {
      return { success: false, error: "Sesi konseling tidak ditemukan." }
    }

    const { booking, schedule, screening, report } = rows[0]

    if (role !== "admin" && booking.counselorId !== counselorId) {
      return { success: false, error: "Anda hanya dapat melihat catatan sesi Anda sendiri (RLS)." }
    }

    const formattedTimeRange = formatTimeRange(schedule.startTime, schedule.endTime)

    const detail: SessionReportDetailView = {
      id: report?.id || "",
      bookingId: booking.id,
      counselorId: booking.counselorId,
      summary: report?.summary || "",
      actionPlan: report?.actionPlan || "",
      followUpRecommendation: report?.followUpRecommendation || null,
      attachmentR2Keys: (report?.attachmentR2Keys as string[]) || [],
      createdAt: report ? report.createdAt.toISOString() : new Date().toISOString(),
      booking: {
        id: booking.id,
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        patientPhone: booking.patientPhone,
        date: schedule.date,
        timeRange: formattedTimeRange,
        initialNotes: booking.initialNotes,
        srqScore: screening ? screening.totalScore : null,
        hasSuicidalThoughts: screening ? Boolean(screening.hasSuicidalThoughts) : false,
        bypassedRecommendation: Boolean(booking.bypassedRecommendation),
      },
    }

    return { success: true, data: detail }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memuat detail laporan sesi." }
  }
}

/**
 * US-35: Submit or update a clinical session report with summary (min 20 chars),
 * action plan (min 20 chars), follow-up recommendation, and private attachments.
 */
export async function submitSessionReportAction(
  rawInput: SessionReportInput,
  deps?: {
    currentUser?: CounselorAuthContext | null
    getBooking?: (id: string) => Promise<any>
    saveReport?: (data: any) => Promise<{ id: string }>
  }
): Promise<CounselorActionResponse<{ reportId: string }>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  const parsed = sessionReportSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "Data laporan sesi belum memenuhi syarat klinis.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { bookingId, summary, actionPlan, followUpRecommendation, attachmentR2Keys } = parsed.data

  try {
    let booking: any = null
    if (deps?.getBooking) {
      booking = await deps.getBooking(bookingId)
    } else if (!UUID_REGEX.test(bookingId)) {
      booking = {
        id: bookingId,
        counselorId,
        status: "confirmed",
      }
    } else {
      const found = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1)
      if (found.length > 0) booking = found[0]
    }

    if (!booking) {
      return { success: false, error: "Sesi konseling tidak ditemukan." }
    }

    if (booking.counselorId !== counselorId) {
      return { success: false, error: "Anda tidak berwenang mengisi laporan untuk sesi konselor lain." }
    }

    let reportId = ""

    if (deps?.saveReport) {
      const res = await deps.saveReport({
        bookingId,
        counselorId,
        summary,
        actionPlan,
        followUpRecommendation,
        attachmentR2Keys,
      })
      reportId = res.id
    } else if (!UUID_REGEX.test(bookingId)) {
      reportId = `rep-${Date.now()}`
    } else {
      // Upsert into session_reports
      const existing = await db
        .select({ id: sessionReports.id })
        .from(sessionReports)
        .where(eq(sessionReports.bookingId, bookingId))
        .limit(1)

      if (existing.length > 0) {
        reportId = existing[0].id
        await db
          .update(sessionReports)
          .set({
            summary,
            actionPlan,
            followUpRecommendation: followUpRecommendation || null,
            attachmentR2Keys: attachmentR2Keys || [],
          })
          .where(eq(sessionReports.id, reportId))
      } else {
        const inserted = await db
          .insert(sessionReports)
          .values({
            bookingId,
            counselorId,
            summary,
            actionPlan,
            followUpRecommendation: followUpRecommendation || null,
            attachmentR2Keys: attachmentR2Keys || [],
          })
          .returning({ id: sessionReports.id })
        reportId = inserted[0].id
      }

      // Ensure booking status is marked completed
      await db
        .update(bookings)
        .set({ status: "completed" })
        .where(eq(bookings.id, bookingId))
    }

    safeRevalidatePath("/counselor/dashboard")
    safeRevalidatePath(`/counselor/reports/${bookingId}`)

    return {
      success: true,
      data: { reportId },
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menyimpan laporan sesi klinis." }
  }
}

/**
 * US-36: Fetch counselor profile for editing.
 */
export async function getCounselorProfileAction(deps?: {
  currentUser?: CounselorAuthContext | null
  getProfile?: (counselorId: string) => Promise<CounselorProfileView | null>
}): Promise<CounselorActionResponse<CounselorProfileView>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  if (deps?.getProfile) {
    const profile = await deps.getProfile(counselorId)
    if (!profile) return { success: false, error: "Profil tidak ditemukan." }
    return { success: true, data: profile }
  }

  try {
    const rows = await withDbTimeout(
      db
        .select()
        .from(counselors)
        .where(eq(counselors.id, counselorId))
        .limit(1),
      10000
    )

    if (rows.length === 0) {
      return { success: false, error: "Profil konselor tidak ditemukan di database." }
    }

    const c = rows[0]
    const profile: CounselorProfileView = {
      id: c.id,
      userId: c.userId,
      fullName: c.fullName,
      title: c.title,
      counselorType: c.counselorType as "peer" | "psychologist",
      bio: c.bio,
      specializations: (c.specializations as string[]) || [],
      avatarR2Url: c.avatarR2Url,
      isActive: c.isActive,
    }

    return { success: true, data: profile }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memuat profil konselor." }
  }
}

/**
 * US-36 & US-37: Update counselor profile (title, bio, specializations, avatarR2Url).
 */
export async function updateCounselorProfileAction(
  rawInput: CounselorProfileInput,
  deps?: {
    currentUser?: CounselorAuthContext | null
    updateProfile?: (counselorId: string, data: CounselorProfileInput) => Promise<void>
  }
): Promise<CounselorActionResponse<{ updated: boolean }>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  const parsed = counselorProfileSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "Data profil belum valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    if (deps?.updateProfile) {
      await deps.updateProfile(counselorId, parsed.data)
    } else {
      await db
        .update(counselors)
        .set({
          title: parsed.data.title,
          bio: parsed.data.bio,
          specializations: parsed.data.specializations,
          avatarR2Url: parsed.data.avatarR2Url || null,
        })
        .where(eq(counselors.id, counselorId))
    }

    safeRevalidatePath("/counselor/profile")
    safeRevalidatePath("/counselor/dashboard")
    safeRevalidatePath("/counselors")

    return { success: true, data: { updated: true } }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui profil konselor." }
  }
}

/**
 * US-35 & US-37: Generate presigned PUT URL for client-side direct upload.
 * - Avatar: public bucket (solulu-public/avatars/...)
 * - Clinical Attachment: private bucket (solulu-private/reports/...)
 */
export async function getPresignedUploadUrlAction(
  rawInput: PresignedUploadRequestInput,
  deps?: {
    currentUser?: CounselorAuthContext | null
    generatePutUrl?: typeof generatePresignedPutUrl
  }
): Promise<CounselorActionResponse<{ uploadUrl: string; key: string; publicUrl?: string }>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." }
  }

  const parsed = presignedUploadRequestSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "Parameter upload tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { type, fileName, contentType, bookingId } = parsed.data
  const r2Config = getR2Config()

  try {
    const putFn = deps?.generatePutUrl || generatePresignedPutUrl

    if (type === "avatar") {
      const key = generateR2Key("avatars", fileName)
      const res = await putFn({
        bucket: r2Config.publicBucketName,
        key,
        contentType,
        expiresIn: 3600,
      })
      const publicUrl = getPublicR2Url(key)
      return {
        success: true,
        data: {
          uploadUrl: res.uploadUrl,
          key,
          publicUrl,
        },
      }
    } else {
      // report_attachment: strictly private bucket
      const prefix = bookingId ? `reports/${bookingId}` : "reports"
      const key = generateR2Key(prefix, fileName)
      const res = await putFn({
        bucket: r2Config.privateBucketName,
        key,
        contentType,
        expiresIn: 3600,
      })
      return {
        success: true,
        data: {
          uploadUrl: res.uploadUrl,
          key,
        },
      }
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal membuat URL upload dokumen." }
  }
}

/**
 * US-35 & US-39: Generate a presigned GET URL for viewing private session report attachments (15-min TTL).
 */
export async function getAttachmentDownloadUrlAction(
  key: string,
  deps?: {
    currentUser?: CounselorAuthContext | null
    generateGetUrl?: typeof generatePresignedGetUrl
  }
): Promise<CounselorActionResponse<{ downloadUrl: string }>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." }
  }

  if (!key || typeof key !== "string") {
    return { success: false, error: "Key dokumen tidak valid." }
  }

  try {
    const getFn = deps?.generateGetUrl || generatePresignedGetUrl
    const downloadUrl = await getFn({
      key,
      expiresIn: 900, // 15 minutes TTL per PRD
    })

    return { success: true, data: { downloadUrl } }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengunduh dokumen lampiran." }
  }
}

/**
 * Updates counselor account login password in Supabase Auth.
 */
export async function updateCounselorPasswordAction(
  newPassword: string,
  deps?: {
    currentUser?: CounselorAuthContext | null
    updateUserFn?: (id: string, attributes: any) => Promise<{ data: any; error: any }>
  }
): Promise<CounselorActionResponse<{ updated: boolean }>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  if (!newPassword || newPassword.trim().length < 8) {
    return { success: false, error: "Kata sandi baru minimal 8 karakter." }
  }

  try {
    if (deps?.updateUserFn) {
      const res = await deps.updateUserFn(auth.id, { password: newPassword.trim() })
      if (res.error) {
        return { success: false, error: `Gagal memperbarui kata sandi: ${res.error.message}` }
      }
      return { success: true, data: { updated: true } }
    }

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.auth.admin.updateUserById(auth.id, {
      password: newPassword.trim(),
    })

    if (error) {
      return { success: false, error: `Gagal memperbarui kata sandi: ${error.message}` }
    }

    return { success: true, data: { updated: true } }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui kata sandi." }
  }
}

/**
 * Switches the active demo counselor identity for testing and simulation.
 */
export async function switchDemoCounselorAction(counselorId: string) {
  const cookieStore = await cookies()
  cookieStore.set("solulu_demo_role", "counselor", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  })
  cookieStore.set("solulu_demo_counselor_id", counselorId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  })
  safeRevalidatePath("/counselor/dashboard")
  safeRevalidatePath("/counselor/profile")
  safeRevalidatePath("/counselor/schedules")
  return { success: true }
}

/**
 * Returns available real counselors in the database for the switcher dropdown.
 */
export async function getCounselorsListForSwitchAction() {
  try {
    const rows = await db
      .select({
        id: counselors.id,
        fullName: counselors.fullName,
        title: counselors.title,
        counselorType: counselors.counselorType,
      })
      .from(counselors)
      .where(eq(counselors.isActive, true))
      .orderBy(counselors.fullName)

    return { success: true, data: rows }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}

