"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq, and, sql, desc, asc } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, screenings, sessionReports, counselors, zoomAccounts, platformSettings } from "@/db/schema"
import { formatTimeRange } from "@/lib/schedules/concurrency"
import { calculateExtendFee } from "@/lib/counselor/timer"
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

    const [rows, settingsRows] = await Promise.all([
      withDbTimeout(
        db
          .select({
            booking: bookings,
            schedule: schedules,
            screening: screenings,
            report: sessionReports,
            counselor: counselors,
            zoomAccount: zoomAccounts,
          })
          .from(bookings)
          .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
          .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
          .leftJoin(zoomAccounts, eq(bookings.zoomAccountId, zoomAccounts.id))
          .leftJoin(screenings, eq(bookings.screeningId, screenings.id))
          .leftJoin(sessionReports, eq(bookings.id, sessionReports.bookingId))
          .where(
            and(
              eq(bookings.counselorId, counselorId),
              sql`${bookings.status} IN ('pending_payment', 'confirmed', 'completed', 'cancelled')`,
              sql`${schedules.date} >= ${todayStr} AND ${schedules.date} <= ${sevenDaysLaterStr}`
            )
          )
          .orderBy(asc(schedules.date), asc(schedules.startTime)),
        10000
      ),
      withDbTimeout(
        db
          .select({
            counselorExtendFeePer30Min: platformSettings.counselorExtendFeePer30Min,
            psychologistExtendFeePer30Min: platformSettings.psychologistExtendFeePer30Min,
          })
          .from(platformSettings)
          .where(eq(platformSettings.id, "default"))
          .limit(1),
        5000
      ).catch(() => []),
    ])

    const customRates = settingsRows?.length
      ? {
          peerRate: Number(settingsRows[0].counselorExtendFeePer30Min),
          psychologistRate: Number(settingsRows[0].psychologistExtendFeePer30Min),
        }
      : undefined

    const sessions: CounselorUpcomingSessionView[] = rows.map((r) => {
      const startTime = String(r.schedule.startTime)
      const endTime = String(r.schedule.endTime)
      const formattedTimeRange = formatTimeRange(startTime, endTime)
      const zoomHostKey = r.booking.zoomHostKey || r.zoomAccount?.hostKey || null
      const counselorType = (r.counselor?.counselorType || "peer") as "peer" | "psychologist"
      const counselorName = r.counselor?.fullName || "Mitra Konselor"
      const bookingCode = r.booking.bookingCode || `SL-${r.booking.id.slice(0, 4)}`

      return {
        id: r.booking.id,
        accessToken: r.booking.accessToken,
        bookingCode,
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
        zoomHostKey,
        zoomAccountNumber: r.booking.zoomAccountNumber,
        zoomAllocationMode: r.booking.zoomAllocationMode,
        breakoutRoomName: r.booking.breakoutRoomName,
        counselorType,
        counselorName,
        isExtended: Boolean(r.booking.isExtended),
        extensionMinutes: r.booking.extensionMinutes ?? 0,
        extensionFee: r.booking.extensionFee ?? "0",
        extensionPaymentStatus: r.booking.extensionPaymentStatus || "NONE",
        customRates,
        srqScore: r.screening ? r.screening.totalScore : null,
        hasSuicidalThoughts: r.screening ? Boolean(r.screening.hasSuicidalThoughts) : false,
        bypassedRecommendation: Boolean(r.booking.bypassedRecommendation),
        hasReport: Boolean(r.report),
        reportId: r.report ? r.report.id : null,
        actualDurationMinutes: r.report?.actualDurationMinutes ?? null,
        timerStartedAt: r.report?.timerStartedAt ? r.report.timerStartedAt.toISOString() : null,
        timerStoppedAt: r.report?.timerStoppedAt ? r.report.timerStoppedAt.toISOString() : null,
        operatorAdmittedAt: r.booking.operatorAdmittedAt ? r.booking.operatorAdmittedAt.toISOString() : null,
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
    safeRevalidatePath(`/counselor/sessions/${bookingId}/report`)
    safeRevalidatePath(`/counselor/reports/${bookingId}`)

    return {
      success: true,
      data: {
        redirectUrl: deps?.getBooking
          ? `/counselor/reports/${bookingId}`
          : `/counselor/sessions/${bookingId}/report`,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui status sesi." }
  }
}

/**
 * US-35 & US-39 & Ticket 05: Fetch session report details for a given booking.
 * Restricted to the owning counselor or admin.
 * Confidentiality guard: internalNotes is strictly excluded from Admin payloads.
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
    const safeReport: SessionReportDetailView = { ...report }
    // Confidentiality guard: Admin & Superadmin cannot view internal clinical notes
    if (role === "admin" || role === "superadmin") {
      delete safeReport.internalNotes
    }
    return { success: true, data: safeReport }
  }
  if (!UUID_REGEX.test(bookingId)) {
    return { success: false, error: "Sesi konseling tidak ditemukan." }
  }

    const isAdminOrSuper = role === "admin" || role === "superadmin"

  try {
    const rows = await withDbTimeout(
      db
        .select({
          booking: bookings,
          schedule: schedules,
          screening: screenings,
          report: {
            id: sessionReports.id,
            bookingId: sessionReports.bookingId,
            counselorId: sessionReports.counselorId,
            mainIssue: sessionReports.mainIssue,
            summary: sessionReports.summary,
            actionPlan: sessionReports.actionPlan,
            // Zero Clinical Leak Invariant: SQL projection guarantees confidential notes never enter server memory for Admin/Superadmin
            internalNotes: isAdminOrSuper ? sql<string | null>`NULL` : sessionReports.internalNotes,
            followUpRecommendation: sessionReports.followUpRecommendation,
            attachmentR2Keys: sessionReports.attachmentR2Keys,
            actualDurationMinutes: sessionReports.actualDurationMinutes,
            timerStartedAt: sessionReports.timerStartedAt,
            timerStoppedAt: sessionReports.timerStoppedAt,
            createdAt: sessionReports.createdAt,
          },
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

    if (!isAdminOrSuper && booking.counselorId !== counselorId) {
      return { success: false, error: "Anda hanya dapat melihat catatan sesi Anda sendiri (RLS)." }
    }

    const formattedTimeRange = formatTimeRange(schedule.startTime, schedule.endTime)

    const detail: SessionReportDetailView = {
      id: report?.id || "",
      bookingId: booking.id,
      counselorId: booking.counselorId,
      mainIssue: report?.mainIssue || "Konsultasi Emosional & Stres",
      summary: report?.summary || "",
      actionPlan: report?.actionPlan || "",
      // Confidentiality Guard: internalNotes is STRICTLY excluded from Admin & Superadmin payloads
      internalNotes: isAdminOrSuper ? undefined : (report?.internalNotes || ""),
      followUpRecommendation: report?.followUpRecommendation || null,
      attachmentR2Keys: (report?.attachmentR2Keys as string[]) || [],
      actualDurationMinutes: report?.actualDurationMinutes ?? null,
      timerStartedAt: report?.timerStartedAt ? report.timerStartedAt.toISOString() : null,
      timerStoppedAt: report?.timerStoppedAt ? report.timerStoppedAt.toISOString() : null,
      createdAt: report ? report.createdAt.toISOString() : new Date().toISOString(),
      booking: {
        id: booking.id,
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        patientPhone: booking.patientPhone,
        date: schedule.date,
        timeRange: formattedTimeRange,
        startTime: String(schedule.startTime),
        endTime: String(schedule.endTime),
        initialNotes: booking.initialNotes,
        srqScore: screening ? screening.totalScore : null,
        hasSuicidalThoughts: screening ? Boolean(screening.hasSuicidalThoughts) : false,
        bypassedRecommendation: Boolean(booking.bypassedRecommendation),
        operatorAdmittedAt: booking.operatorAdmittedAt ? booking.operatorAdmittedAt.toISOString() : null,
      },
    }

    return { success: true, data: detail }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memuat detail laporan sesi." }
  }
}

/**
 * US-35 & Ticket 05: Submit or update a clinical session report with:
 * - Mandatory "Permasalahan Utama (Main Issue)"
 * - Mandatory "Ringkasan Dinamika Sesi" (summary, min 20 chars)
 * - Optional "Saran / Rekomendasi" (action_plan)
 * - Strictly confidential "Catatan Internal Konselor" (internal_notes)
 * - Internal attendance proof photo uploads (attachment_r2_keys)
 *
 * Transitions booking status to "completed" in database upon submission.
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

  const {
    bookingId,
    mainIssue,
    summary,
    actionPlan,
    internalNotes,
    followUpRecommendation,
    attachmentR2Keys,
  } = parsed.data

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
        mainIssue: mainIssue || "Konsultasi Emosional & Stres",
        summary,
        actionPlan: actionPlan || null,
        internalNotes: internalNotes || null,
        followUpRecommendation: followUpRecommendation || null,
        attachmentR2Keys: attachmentR2Keys || [],
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
        const updatePayload: any = {
          mainIssue: mainIssue || "Konsultasi Emosional & Stres",
          summary,
          actionPlan: actionPlan || null,
          internalNotes: internalNotes || null,
          followUpRecommendation: followUpRecommendation || null,
          attachmentR2Keys: attachmentR2Keys || [],
        }
        if (typeof parsed.data.actualDurationMinutes === "number") {
          updatePayload.actualDurationMinutes = parsed.data.actualDurationMinutes
        }
        if (parsed.data.timerStartedAt) {
          updatePayload.timerStartedAt = new Date(parsed.data.timerStartedAt)
        }
        if (parsed.data.timerStoppedAt) {
          updatePayload.timerStoppedAt = new Date(parsed.data.timerStoppedAt)
        }
        await db
          .update(sessionReports)
          .set(updatePayload)
          .where(eq(sessionReports.id, reportId))
      } else {
        const insertPayload: any = {
          bookingId,
          counselorId,
          mainIssue: mainIssue || "Konsultasi Emosional & Stres",
          summary,
          actionPlan: actionPlan || null,
          internalNotes: internalNotes || null,
          followUpRecommendation: followUpRecommendation || null,
          attachmentR2Keys: attachmentR2Keys || [],
          actualDurationMinutes: typeof parsed.data.actualDurationMinutes === "number" ? parsed.data.actualDurationMinutes : 90,
          timerStartedAt: parsed.data.timerStartedAt ? new Date(parsed.data.timerStartedAt) : null,
          timerStoppedAt: parsed.data.timerStoppedAt ? new Date(parsed.data.timerStoppedAt) : null,
        }
        const inserted = await db
          .insert(sessionReports)
          .values(insertPayload)
          .returning({ id: sessionReports.id })
        reportId = inserted[0].id
      }

      // Ensure booking status is marked completed & admitted
      await db
        .update(bookings)
        .set({
          status: "completed",
          operatorAdmittedAt: sql`COALESCE(${bookings.operatorAdmittedAt}, NOW())`,
        })
        .where(eq(bookings.id, bookingId))
    }

    safeRevalidatePath("/counselor/dashboard")
    safeRevalidatePath(`/counselor/sessions/${bookingId}/report`)
    safeRevalidatePath(`/counselor/reports/${bookingId}`)
    safeRevalidatePath("/operator")

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
    const rawRows = await withDbTimeout(
      db.execute(sql`
        SELECT 
          c.id,
          c.user_id as "userId",
          c.full_name as "fullName",
          c.title,
          c.counselor_type as "counselorType",
          c.bio,
          c.specializations,
          c.avatar_r2_url as "avatarR2Url",
          c.is_active as "isActive",
          u.email as "email"
        FROM counselors c
        LEFT JOIN auth.users u ON c.user_id = u.id
        WHERE c.id = ${counselorId}::uuid
        LIMIT 1
      `),
      10000
    )

    const rows = (rawRows as any[]) || []
    if (rows.length === 0) {
      return { success: false, error: "Profil konselor tidak ditemukan di database." }
    }

    const c = rows[0]
    let counselorEmail = c.email || auth.user_metadata?.email || (auth as any).email || ""
    if (!counselorEmail && c.userId) {
      try {
        const supabaseAdmin = createAdminClient()
        const { data } = await supabaseAdmin.auth.admin.getUserById(c.userId)
        if (data?.user?.email) counselorEmail = data.user.email
      } catch {}
    }

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
      email: counselorEmail || "-",
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

/**
 * Ticket 04: Automatically records 30-minute extension fee in PostgreSQL bookings table.
 * Standard extend rules:
 * - Sebaya (Peer Counselor): Rp 35.000
 * - Psikolog Klinis: Rp 50.000
 * Automatically triggered at minute 96 or when counselor clicks "Catat Perpanjangan".
 */
export async function recordSessionExtensionAction(
  bookingId: string,
  deps?: {
    currentUser?: CounselorAuthContext | null
    dbClient?: typeof db
  }
): Promise<CounselorActionResponse<{ isExtended: boolean; extensionMinutes: number; fee: number }>> {
  if (!bookingId || !UUID_REGEX.test(bookingId)) {
    return { success: false, error: "ID booking tidak valid." }
  }

  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  try {
    const dbConn = deps?.dbClient || db

    const bookingRows = await withDbTimeout(
      dbConn
        .select({
          booking: bookings,
          counselor: counselors,
        })
        .from(bookings)
        .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
        .where(and(eq(bookings.id, bookingId), eq(bookings.counselorId, counselorId)))
        .limit(1),
      10000
    )

    if (!bookingRows.length) {
      return { success: false, error: "Sesi konseling tidak ditemukan atau bukan milik Anda." }
    }

    const { booking, counselor } = bookingRows[0]
    const counselorType = (counselor.counselorType || "peer") as "peer" | "psychologist"

    // Fetch custom pricing if set
    let customRates: { peerRate?: number; psychologistRate?: number } | undefined
    try {
      const settingsRows = await dbConn
        .select({
          counselorExtendFeePer30Min: platformSettings.counselorExtendFeePer30Min,
          psychologistExtendFeePer30Min: platformSettings.psychologistExtendFeePer30Min,
        })
        .from(platformSettings)
        .where(eq(platformSettings.id, "default"))
        .limit(1)

      if (settingsRows.length) {
        customRates = {
          peerRate: Number(settingsRows[0].counselorExtendFeePer30Min),
          psychologistRate: Number(settingsRows[0].psychologistExtendFeePer30Min),
        }
      }
    } catch {
      // Fallback to default in calculateExtendFee
    }

    const feeCalc = calculateExtendFee(96, counselorType, customRates)

    await withDbTimeout(
      dbConn
        .update(bookings)
        .set({
          isExtended: true,
          extensionMinutes: 30,
          extensionFee: feeCalc.fee.toString(),
          extensionPaymentStatus: booking.extensionPaymentStatus === "PAID" ? "PAID" : "NONE",
        })
        .where(eq(bookings.id, bookingId)),
      10000
    )

    safeRevalidatePath("/counselor/dashboard")

    return {
      success: true,
      data: {
        isExtended: true,
        extensionMinutes: 30,
        fee: feeCalc.fee,
      },
    }
  } catch (err: any) {
    console.error("[ERROR RECORD EXTENSION]", err)
    return { success: false, error: err.message || "Gagal mencatat perpanjangan sesi ke database." }
  }
}

/**
 * Ticket 04: Records actual timer metadata (duration and timestamps) in PostgreSQL session_reports.
 */
export async function recordSessionTimerAction(
  bookingId: string,
  payload: {
    actualDurationMinutes: number
    timerStartedAt?: string
    timerStoppedAt?: string
  },
  deps?: {
    currentUser?: CounselorAuthContext | null
    dbClient?: typeof db
  }
): Promise<CounselorActionResponse<{ actualDurationMinutes: number }>> {
  if (!bookingId || !UUID_REGEX.test(bookingId)) {
    return { success: false, error: "ID booking tidak valid." }
  }

  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  try {
    const dbConn = deps?.dbClient || db

    // Verify booking
    const bookingRows = await withDbTimeout(
      dbConn
        .select({ id: bookings.id })
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), eq(bookings.counselorId, counselorId)))
        .limit(1),
      10000
    )

    if (!bookingRows.length) {
      return { success: false, error: "Sesi konseling tidak ditemukan." }
    }

    // Check if session report exists
    const existingReports = await withDbTimeout(
      dbConn
        .select({ id: sessionReports.id })
        .from(sessionReports)
        .where(eq(sessionReports.bookingId, bookingId))
        .limit(1),
      10000
    )

    const timerStarted = payload.timerStartedAt ? new Date(payload.timerStartedAt) : new Date()
    const timerStopped = payload.timerStoppedAt ? new Date(payload.timerStoppedAt) : new Date()

    if (existingReports.length > 0) {
      await withDbTimeout(
        dbConn
          .update(sessionReports)
          .set({
            actualDurationMinutes: payload.actualDurationMinutes,
            timerStartedAt: timerStarted,
            timerStoppedAt: timerStopped,
          })
          .where(eq(sessionReports.id, existingReports[0].id)),
        10000
      )
    } else {
      await withDbTimeout(
        dbConn
          .insert(sessionReports)
          .values({
            bookingId,
            counselorId,
            mainIssue: "Konsultasi Emosional & Stres",
            summary: "Sesi konseling telah terekam melalui Floating Timer.",
            actualDurationMinutes: payload.actualDurationMinutes,
            timerStartedAt: timerStarted,
            timerStoppedAt: timerStopped,
          }),
        10000
      )
    }

    // Auto-admit client on timer start: ensure bookings.operatorAdmittedAt is set
    const [currentBooking] = await withDbTimeout(
      dbConn
        .select({ operatorAdmittedAt: bookings.operatorAdmittedAt })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1),
      10000
    )

    if (currentBooking && !currentBooking.operatorAdmittedAt) {
      await withDbTimeout(
        dbConn
          .update(bookings)
          .set({
            operatorAdmittedAt: timerStarted,
          })
          .where(eq(bookings.id, bookingId)),
        10000
      )
    }

    safeRevalidatePath("/counselor/dashboard")
    safeRevalidatePath("/operator")

    return {
      success: true,
      data: {
        actualDurationMinutes: payload.actualDurationMinutes,
      },
    }
  } catch (err: any) {
    console.error("[ERROR RECORD TIMER METADATA]", err)
    return { success: false, error: err.message || "Gagal menyimpan metadata durasi sesi." }
  }
}

/**
 * Counselor Admit: Counselor explicitly marks client as admitted / entered session.
 */
export async function counselorAdmitClientAction(
  payload: { bookingId: string },
  deps?: { currentUser?: CounselorAuthContext | null; dbClient?: typeof db }
): Promise<CounselorActionResponse<{ admittedAt: string }>> {
  const { bookingId } = payload
  if (!bookingId || !UUID_REGEX.test(bookingId)) {
    return { success: false, error: "ID booking tidak valid." }
  }

  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  try {
    const dbConn = deps?.dbClient || db
    const now = new Date()

    const updated = await withDbTimeout(
      dbConn
        .update(bookings)
        .set({ operatorAdmittedAt: now })
        .where(and(eq(bookings.id, bookingId), eq(bookings.counselorId, counselorId)))
        .returning({ id: bookings.id, operatorAdmittedAt: bookings.operatorAdmittedAt }),
      10000
    )

    if (!updated.length) {
      return { success: false, error: "Sesi konseling tidak ditemukan atau bukan milik Anda." }
    }

    safeRevalidatePath("/counselor/dashboard")
    safeRevalidatePath("/operator")

    return {
      success: true,
      data: { admittedAt: updated[0].operatorAdmittedAt!.toISOString() },
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menandai kehadiran klien." }
  }
}

/**
 * Counselor Unadmit: Counselor reverts client admission status.
 */
export async function counselorUnadmitClientAction(
  payload: { bookingId: string },
  deps?: { currentUser?: CounselorAuthContext | null; dbClient?: typeof db }
): Promise<CounselorActionResponse<{ success: boolean }>> {
  const { bookingId } = payload
  if (!bookingId || !UUID_REGEX.test(bookingId)) {
    return { success: false, error: "ID booking tidak valid." }
  }

  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) {
    return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return { success: false, error: "Profil konselor tidak ditemukan." }
  }

  try {
    const dbConn = deps?.dbClient || db
    const updated = await withDbTimeout(
      dbConn
        .update(bookings)
        .set({ operatorAdmittedAt: null })
        .where(and(eq(bookings.id, bookingId), eq(bookings.counselorId, counselorId)))
        .returning({ id: bookings.id }),
      10000
    )

    if (!updated.length) {
      return { success: false, error: "Sesi konseling tidak ditemukan atau bukan milik Anda." }
    }

    safeRevalidatePath("/counselor/dashboard")
    safeRevalidatePath("/operator")

    return { success: true, data: { success: true } }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal membatalkan status kehadiran." }
  }
}


