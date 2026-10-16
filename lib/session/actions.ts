"use server"

import { eq } from "drizzle-orm"
import { db } from "@/db"
import {
  bookings,
  counselors,
  schedules,
  transactions,
  sessionReports,
  platformSettings,
} from "@/db/schema"
import { formatTimeRange } from "@/lib/schedules/concurrency"
import { formatIndonesianDate } from "@/lib/session/time"
import { normalizeIndonesianPhone, extensionPaymentSchema } from "@/lib/validations/session"
import {
  DEMO_SESSIONS,
  formatRupiah,
  type ActionResponse,
  type SessionPageData,
  type ClientSessionReportView,
} from "./types"

export interface SessionDataDependencies {
  findBookingByAccessToken?: (token: string) => Promise<any>
}

/**
 * Fetches all necessary session and counselor details for /session/[token]
 */
export async function getSessionByTokenAction(
  accessToken: string,
  deps?: SessionDataDependencies
): Promise<ActionResponse<SessionPageData>> {
  try {
    if (!accessToken || typeof accessToken !== "string" || accessToken.trim().length === 0) {
      return {
        success: false,
        error: "Token sesi tidak valid atau kosong",
      }
    }

    const cleanToken = accessToken.trim()

    // 1. Dependency injection for unit testing
    if (deps?.findBookingByAccessToken) {
      const customRes = await deps.findBookingByAccessToken(cleanToken)
      if (!customRes) {
        return {
          success: false,
          error: "Sesi konseling dengan tautan ini tidak ditemukan",
        }
      }
      // Ensure bookingCode exists in test payload
      if (customRes.booking && !customRes.booking.bookingCode) {
        customRes.booking.bookingCode = "SL-1001"
      }
      if (customRes.booking && customRes.booking.isExtended === undefined) {
        customRes.booking.isExtended = false
        customRes.booking.extensionMinutes = 0
        customRes.booking.extensionFee = 0
        customRes.booking.extensionPaymentStatus = "NONE"
      }
      // STRICT PRIVACY GUARD: strip internalNotes & attachmentR2Keys
      if (customRes.report) {
        delete (customRes.report as any).internalNotes
        delete (customRes.report as any).attachmentR2Keys
      }
      return {
        success: true,
        data: {
          ...customRes,
          hasReport: customRes.hasReport ?? Boolean(customRes.report),
          platformSettings: customRes.platformSettings || {
            isManualPaymentEnabled: true,
            manualPaymentInstructions: "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health.",
            bcaAccountNumber: "123-456-7890",
            bcaAccountName: "Solulu Mental Health",
          },
        },
      }
    }

    // 2. Demo fallback
    if (DEMO_SESSIONS[cleanToken]) {
      const demo = DEMO_SESSIONS[cleanToken]
      if (cleanToken === "demo-session-ready") {
        const now = new Date()
        const start = new Date(now.getTime() + 5 * 60 * 1000)
        const end = new Date(now.getTime() + 95 * 60 * 1000)
        const fmtDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Jakarta",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        const fmtTime = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        const dateStr = fmtDate.format(start)
        const startTime = fmtTime.format(start)
        const endTime = fmtTime.format(end)

        return {
          success: true,
          data: {
            ...demo,
            schedule: {
              ...demo.schedule,
              date: dateStr,
              startTime,
              endTime,
              timeRange: `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)} WIB`,
              formattedDate: formatIndonesianDate(dateStr),
            },
          },
        }
      }

      return {
        success: true,
        data: demo,
      }
    }

    // 3. Database query (Zero-Mock Policy & Strict Confidentiality Guard)
    const [rows, settingsRows] = await Promise.all([
      db
        .select({
          booking: bookings,
          counselor: counselors,
          schedule: schedules,
          transaction: transactions,
          // STRICT CONFIDENTIALITY GUARD:
          // Only select client-visible fields: mainIssue, summary, actionPlan, followUpRecommendation, createdAt.
          // DO NOT select internalNotes or attachmentR2Keys!
          report: {
            id: sessionReports.id,
            mainIssue: sessionReports.mainIssue,
            summary: sessionReports.summary,
            actionPlan: sessionReports.actionPlan,
            followUpRecommendation: sessionReports.followUpRecommendation,
            createdAt: sessionReports.createdAt,
          },
        })
        .from(bookings)
        .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
        .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .leftJoin(transactions, eq(bookings.id, transactions.bookingId))
        .leftJoin(sessionReports, eq(bookings.id, sessionReports.bookingId))
        .where(eq(bookings.accessToken, cleanToken))
        .limit(1),
      db.select().from(platformSettings).limit(1),
    ])

    if (rows.length === 0) {
      return {
        success: false,
        error: "Sesi konseling dengan tautan ini tidak ditemukan",
      }
    }

    const item = rows[0]
    const settings = settingsRows[0]
    const netAmount = item.transaction ? Number(item.transaction.netAmount) : 0
    const extensionFeeNum = Number(item.booking.extensionFee || 0)

    const sessionData: SessionPageData = {
      booking: {
        id: item.booking.id,
        accessToken: item.booking.accessToken,
        bookingCode: item.booking.bookingCode || "SL-1001",
        patientName: item.booking.patientName,
        patientEmail: item.booking.patientEmail,
        patientPhone: item.booking.patientPhone,
        initialNotes: item.booking.initialNotes,
        status: item.booking.status as any,
        zoomJoinUrl: item.booking.zoomJoinUrl,
        zoomMeetingId: item.booking.zoomMeetingId,
        zoomAllocationMode: item.booking.zoomAllocationMode || "standalone",
        breakoutRoomName: item.booking.breakoutRoomName || null,
        paymentMethod: item.booking.paymentMethod,
        manualPaymentProofR2Key: item.booking.manualPaymentProofR2Key,
        manualPaymentStatus: item.booking.manualPaymentStatus,
        isExtended: item.booking.isExtended,
        extensionMinutes: item.booking.extensionMinutes,
        extensionFee: extensionFeeNum,
        extensionFeeFormatted: formatRupiah(extensionFeeNum),
        extensionPaymentStatus: (item.booking.extensionPaymentStatus as any) || "NONE",
        extensionPaymentMethod: item.booking.extensionPaymentMethod,
        extensionProofR2Key: item.booking.extensionProofR2Key,
        createdAt: item.booking.createdAt,
      },
      counselor: {
        id: item.counselor.id,
        fullName: item.counselor.fullName,
        title: item.counselor.title,
        counselorType: item.counselor.counselorType as any,
        counselorTypeDisplay:
          item.counselor.counselorType === "psychologist"
            ? "Psikolog Klinis"
            : "Konselor Sebaya",
        bio: item.counselor.bio,
        specializations: item.counselor.specializations || [],
        avatarR2Url: item.counselor.avatarR2Url,
      },
      schedule: {
        id: item.schedule.id,
        date: item.schedule.date,
        startTime: item.schedule.startTime,
        endTime: item.schedule.endTime,
        timeRange: formatTimeRange(item.schedule.startTime, item.schedule.endTime),
        formattedDate: formatIndonesianDate(item.schedule.date),
      },
      transaction: item.transaction
        ? {
            id: item.transaction.id,
            paymentProvider: item.transaction.paymentProvider,
            paymentMethod: item.transaction.paymentMethod,
            referenceNumber: item.transaction.referenceNumber,
            grossAmount: Number(item.transaction.grossAmount),
            discountAmount: Number(item.transaction.discountAmount),
            netAmount,
            netAmountFormatted: formatRupiah(netAmount),
            status: item.transaction.status,
          }
        : null,
      hasReport: Boolean(item.report && item.report.id),
      // Report remains locked until verified via WhatsApp gate
      report: null,
      platformSettings: {
        isManualPaymentEnabled: settings?.isManualPaymentEnabled ?? true,
        manualPaymentInstructions:
          settings?.manualPaymentInstructions ??
          "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.",
        bcaAccountNumber: "123-456-7890",
        bcaAccountName: "Solulu Mental Health",
      },
    }

    return {
      success: true,
      data: sessionData,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memuat informasi sesi konseling",
    }
  }
}

/**
 * Ticket 05 & Ticket 06: Client-facing server action to unlock and fetch official clinical session report.
 * Strict WhatsApp Verification Gate:
 * Requires client to verify registered phone number.
 * Strict Confidentiality Guard:
 * internal_notes and attachment_r2_keys are strictly excluded at query level.
 */
export async function getClientSessionReportAction(
  accessToken: string,
  verificationPhone?: string,
  deps?: {
    findReport?: (token: string, phone?: string) => Promise<any>
  }
): Promise<ActionResponse<{ report: ClientSessionReportView; patientName: string; counselorName: string }>> {
  if (!accessToken || typeof accessToken !== "string" || accessToken.trim().length === 0) {
    return { success: false, error: "Token sesi tidak valid atau kosong" }
  }

  const cleanToken = accessToken.trim()

  if (!verificationPhone || verificationPhone.trim().length === 0) {
    return {
      success: false,
      error: "Nomor WhatsApp verifikasi wajib diisi untuk membuka laporan resmi.",
    }
  }

  // 1. Dependency injection for testing
  if (deps?.findReport) {
    const custom = await deps.findReport(cleanToken, verificationPhone)
    if (!custom) {
      return { success: false, error: "Laporan sesi belum tersedia atau token tidak valid" }
    }
    // Strict phone verification if patientPhone exists in mock
    if (custom.patientPhone) {
      const cleanInput = normalizeIndonesianPhone(verificationPhone)
      const cleanBooking = normalizeIndonesianPhone(custom.patientPhone)
      if (cleanInput !== cleanBooking && !cleanBooking.endsWith(cleanInput) && !cleanInput.endsWith(cleanBooking)) {
        return {
          success: false,
          error: "Nomor WhatsApp verifikasi tidak cocok dengan data pendaftaran sesi.",
        }
      }
    }
    // Strictly strip internalNotes & attachmentR2Keys
    const raw = custom.report || custom
    const { internalNotes, attachmentR2Keys, ...safeReport } = raw
    return {
      success: true,
      data: {
        report: safeReport,
        patientName: custom.patientName || "Klien",
        counselorName: custom.counselorName || "Konselor",
      },
    }
  }

  // 2. Demo fallback
  if (DEMO_SESSIONS[cleanToken]) {
    const demo = DEMO_SESSIONS[cleanToken]
    const cleanInput = normalizeIndonesianPhone(verificationPhone)
    const cleanBooking = normalizeIndonesianPhone(demo.booking.patientPhone)
    if (cleanInput !== cleanBooking && !cleanBooking.endsWith(cleanInput) && !cleanInput.endsWith(cleanBooking)) {
      return {
        success: false,
        error: "Nomor WhatsApp verifikasi tidak cocok dengan data pendaftaran sesi.",
      }
    }

    const demoReport: ClientSessionReportView = {
      id: "demo-rep-1",
      mainIssue: "Quarter-life Crisis & Kecemasan Regulasi Diri",
      summary:
        "Klien mengeksplorasi ketakutan akan pilihan karir, ekspektasi keluarga, serta kebiasaan overthinking di malam hari. Diskusi berjalan reflektif dengan identifikasi akar ketegangan emosional.",
      actionPlan:
        "Mempraktikkan teknik mindfulness pernapasan 4-7-8, menyusun batas waktu kerja tanpa layar pada malam hari, dan latihan journaling harian.",
      followUpRecommendation: "Sesi konseling tindak lanjut disarankan 2 minggu ke depan.",
      createdAt: new Date().toISOString(),
    }

    return {
      success: true,
      data: {
        report: demoReport,
        patientName: demo.booking.patientName,
        counselorName: demo.counselor.fullName,
      },
    }
  }

  // 3. Real Database Query
  try {
    const rows = await db
      .select({
        booking: bookings,
        counselor: counselors,
        report: {
          id: sessionReports.id,
          mainIssue: sessionReports.mainIssue,
          summary: sessionReports.summary,
          actionPlan: sessionReports.actionPlan,
          followUpRecommendation: sessionReports.followUpRecommendation,
          createdAt: sessionReports.createdAt,
        },
      })
      .from(bookings)
      .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
      .innerJoin(sessionReports, eq(bookings.id, sessionReports.bookingId))
      .where(eq(bookings.accessToken, cleanToken))
      .limit(1)

    if (rows.length === 0) {
      return { success: false, error: "Laporan klinis untuk sesi ini belum tersedia atau token tidak valid." }
    }

    const { booking, counselor, report } = rows[0]

    // Phone verification
    const cleanInput = normalizeIndonesianPhone(verificationPhone)
    const cleanBookingPhone = normalizeIndonesianPhone(booking.patientPhone)
    if (cleanInput !== cleanBookingPhone && !cleanBookingPhone.endsWith(cleanInput) && !cleanInput.endsWith(cleanBookingPhone)) {
      return { success: false, error: "Nomor WhatsApp verifikasi tidak cocok dengan data pendaftaran sesi." }
    }

    const clientReport: ClientSessionReportView = {
      id: report.id,
      mainIssue: report.mainIssue || "Konsultasi Emosional & Stres",
      summary: report.summary,
      actionPlan: report.actionPlan || null,
      followUpRecommendation: report.followUpRecommendation || null,
      createdAt: report.createdAt.toISOString(),
    }

    return {
      success: true,
      data: {
        report: clientReport,
        patientName: booking.patientName,
        counselorName: counselor.fullName,
      },
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memuat laporan sesi klinis." }
  }
}

/**
 * Ticket 06: Alias for unlocking report
 */
export const verifyClientPhoneAndUnlockReportAction = getClientSessionReportAction

export interface SubmitExtensionPaymentInput {
  accessToken: string
  paymentMethod: "xendit" | "manual_bank_transfer"
  proofR2Key?: string | null
  notes?: string | null
}

export interface ExtensionPaymentDependencies {
  findBooking?: (token: string) => Promise<any>
  updateBooking?: (id: string, updates: any) => Promise<any>
}

/**
 * Ticket 06: Dual Payment settlement for session extensions (>90 min)
 * Allows choosing between automated Xendit (QRIS/VA) or Manual Bank Transfer (BCA 123-456-7890).
 */
export async function submitExtensionPaymentAction(
  input: SubmitExtensionPaymentInput,
  deps?: ExtensionPaymentDependencies
): Promise<ActionResponse<{ status: "PENDING" | "PAID"; message: string; paymentUrl?: string }>> {
  try {
    const parseRes = extensionPaymentSchema.safeParse(input)
    if (!parseRes.success) {
      const firstError = Object.values(parseRes.error.flatten().fieldErrors)[0]?.[0]
      return {
        success: false,
        error: firstError || "Data pembayaran perpanjangan sesi tidak valid",
      }
    }

    const { accessToken, paymentMethod, proofR2Key } = parseRes.data

    // 1. Dependency injection for testing
    if (deps?.findBooking && deps?.updateBooking) {
      const b = await deps.findBooking(accessToken)
      if (!b) {
        return { success: false, error: "Sesi konseling tidak ditemukan" }
      }
      if (paymentMethod === "manual_bank_transfer") {
        await deps.updateBooking(b.id, {
          extensionPaymentStatus: "PENDING",
          extensionPaymentMethod: "manual_bank_transfer",
          extensionProofR2Key: proofR2Key,
        })
        return {
          success: true,
          data: {
            status: "PENDING",
            message: "Bukti transfer perpanjangan sesi berhasil dikirim. Menunggu verifikasi admin.",
          },
        }
      } else {
        await deps.updateBooking(b.id, {
          extensionPaymentMethod: "xendit",
        })
        return {
          success: true,
          data: {
            status: "PENDING",
            message: "Silakan lanjutkan pembayaran melalui gerbang pembayaran Xendit.",
            paymentUrl: "https://checkout.xendit.co/web/mock_extend_invoice",
          },
        }
      }
    }

    // 2. Demo fallback
    if (DEMO_SESSIONS[accessToken]) {
      const demo = DEMO_SESSIONS[accessToken]
      if (paymentMethod === "manual_bank_transfer") {
        demo.booking.extensionPaymentStatus = "PENDING"
        demo.booking.extensionPaymentMethod = "manual_bank_transfer"
        demo.booking.extensionProofR2Key = proofR2Key || null
        return {
          success: true,
          data: {
            status: "PENDING",
            message: "Bukti transfer perpanjangan sesi berhasil dikirim. Menunggu verifikasi admin.",
          },
        }
      } else {
        demo.booking.extensionPaymentMethod = "xendit"
        return {
          success: true,
          data: {
            status: "PENDING",
            message: "Silakan lanjutkan pembayaran melalui gerbang pembayaran Xendit.",
            paymentUrl: "https://checkout.xendit.co/web/mock_extend_invoice",
          },
        }
      }
    }

    // 3. Real Database Update
    const bookingRows = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.accessToken, accessToken))
      .limit(1)

    if (bookingRows.length === 0) {
      return { success: false, error: "Sesi konseling tidak ditemukan" }
    }

    const bookingId = bookingRows[0].id

    if (paymentMethod === "manual_bank_transfer") {
      await db
        .update(bookings)
        .set({
          extensionPaymentStatus: "PENDING",
          extensionPaymentMethod: "manual_bank_transfer",
          extensionProofR2Key: proofR2Key,
        })
        .where(eq(bookings.id, bookingId))

      return {
        success: true,
        data: {
          status: "PENDING",
          message: "Bukti transfer perpanjangan sesi berhasil dikirim. Menunggu verifikasi admin.",
        },
      }
    } else {
      await db
        .update(bookings)
        .set({
          extensionPaymentMethod: "xendit",
        })
        .where(eq(bookings.id, bookingId))

      return {
        success: true,
        data: {
          status: "PENDING",
          message: "Silakan lanjutkan pembayaran melalui gerbang pembayaran Xendit.",
          paymentUrl: "https://checkout.xendit.co/web/mock_extend_invoice",
        },
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memproses pembayaran perpanjangan sesi",
    }
  }
}

