import { eq, or, and, desc, ilike } from "drizzle-orm"
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
import { createXenditInvoice, getXenditInvoice } from "@/lib/xendit"
import { getAppBaseUrl } from "@/lib/url"
import {
  formatRupiah,
  type ActionResponse,
  type SessionPageData,
  type ClientSessionReportView,
} from "./types"

export interface SessionDataDependencies {
  findBookingByAccessToken?: (token: string) => Promise<any>
}

export interface SubmitExtensionPaymentInput {
  accessToken: string
  paymentMethod: "xendit" | "manual_bank_transfer"
  proofR2Key?: string | null
  notes?: string | null
}

export interface ExtensionPaymentDependencies {
  findBooking?: (token: string) => Promise<any>
  updateBooking?: (id: string, updates: any) => Promise<any>
  createXenditInvoice?: (params: any) => Promise<any>
}

/**
 * Deep Module: Guest Session Access & Privacy Gate
 *
 * Encapsulates:
 * 1. Guest session state & data resolution via strictly projected SQL (zero clinical leakage).
 * 2. WhatsApp phone gate verification to unlock clinical session reports.
 * 3. Dual-payment settlement engine for session extensions (>90 min).
 */

/**
 * Retrieves full guest session data for /session/[token].
 * Enforces strict confidentiality: clinical notes and attachment keys are never selected into memory.
 */
export async function getGuestSessionByToken(
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

    // 1. Dependency injection seam for test isolation
    if (deps?.findBookingByAccessToken) {
      const customRes = await deps.findBookingByAccessToken(cleanToken)
      if (!customRes) {
        return {
          success: false,
          error: "Sesi konseling dengan tautan ini tidak ditemukan",
        }
      }

      if (customRes.booking && !customRes.booking.bookingCode) {
        customRes.booking.bookingCode = "SL-1001"
      }
      if (customRes.booking && customRes.booking.isExtended === undefined) {
        customRes.booking.isExtended = false
        customRes.booking.extensionMinutes = 0
        customRes.booking.extensionFee = 0
        customRes.booking.extensionPaymentStatus = "NONE"
      }

      // STRICT PRIVACY GUARD: strip confidential fields if passed in customRes
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
            manualPaymentInstructions:
              "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health.",
            bcaAccountNumber: "123-456-7890",
            bcaAccountName: "Solulu Mental Health",
          },
        },
      }
    }

    // 2. Authoritative Database Query (Zero-Mock Policy & Strict SQL Projection)
    const [rows, settingsRows] = await Promise.all([
      db
        .select({
          booking: bookings,
          counselor: counselors,
          schedule: schedules,
          transaction: transactions,
          // STRICT CONFIDENTIALITY GUARD:
          // Strictly project only client-safe fields.
          // internalNotes and attachmentR2Keys are completely omitted from SQL projection.
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
        .where(or(eq(bookings.accessToken, cleanToken), eq(bookings.bookingCode, cleanToken)))
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

    // AUTO-SYNC EXTENSION PAYMENT VIA XENDIT (Zero-Friction Client Experience)
    // If extension is pending with Xendit, check Xendit invoice status directly
    if (
      item.booking.isExtended &&
      item.booking.extensionPaymentMethod === "xendit" &&
      item.booking.extensionPaymentStatus === "PENDING"
    ) {
      try {
        const extTxRows = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.bookingId, item.booking.id),
              or(
                eq(transactions.adminNotes, "EXTENSION"),
                ilike(transactions.referenceNumber, "EXT-%")
              )
            )
          )
          .orderBy(desc(transactions.createdAt))
          .limit(1)

        const extTx = extTxRows[0]
        if (extTx && extTx.xenditInvoiceId) {
          const xenditInvoice = await getXenditInvoice(extTx.xenditInvoiceId)
          if (
            xenditInvoice &&
            (xenditInvoice.status === "PAID" || xenditInvoice.status === "SETTLED")
          ) {
            await Promise.all([
              db
                .update(transactions)
                .set({
                  status: "PAID",
                  paidAt: xenditInvoice.paid_at ? new Date(xenditInvoice.paid_at) : new Date(),
                  paymentMethod:
                    xenditInvoice.payment_method ||
                    xenditInvoice.payment_channel ||
                    "XENDIT_AUTO",
                })
                .where(eq(transactions.id, extTx.id)),
              db
                .update(bookings)
                .set({
                  extensionPaymentStatus: "PAID",
                })
                .where(eq(bookings.id, item.booking.id)),
            ])
            item.booking.extensionPaymentStatus = "PAID"
          }
        }
      } catch (syncErr) {
        console.error("[AUTO_SYNC_XENDIT_EXT_ERROR]", syncErr)
      }
    }

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
 * Verifies patient's WhatsApp number and unlocks the official clinical report.
 */
export async function verifyClientPhoneAndUnlockReport(
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

  // 1. Dependency injection seam for testing
  if (deps?.findReport) {
    const custom = await deps.findReport(cleanToken, verificationPhone)
    if (!custom) {
      return { success: false, error: "Laporan sesi belum tersedia atau token tidak valid" }
    }

    if (custom.patientPhone) {
      const cleanInput = normalizeIndonesianPhone(verificationPhone)
      const cleanBooking = normalizeIndonesianPhone(custom.patientPhone)
      if (
        cleanInput !== cleanBooking &&
        !cleanBooking.endsWith(cleanInput) &&
        !cleanInput.endsWith(cleanBooking)
      ) {
        return {
          success: false,
          error: "Nomor WhatsApp verifikasi tidak cocok dengan data pendaftaran sesi.",
        }
      }
    }

    if (
      custom.isExtended &&
      Number(custom.extensionFee || 0) > 0 &&
      custom.extensionPaymentStatus !== "PAID"
    ) {
      return {
        success: false,
        error:
          "Laporan klinis resmi belum dapat diakses karena biaya perpanjangan sesi belum dilunasi. Silakan selesaikan pembayaran perpanjangan terlebih dahulu.",
      }
    }

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

  // 2. Real Database Query with Strict Projection
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
      .where(or(eq(bookings.accessToken, cleanToken), eq(bookings.bookingCode, cleanToken)))
      .limit(1)

    if (rows.length === 0) {
      return {
        success: false,
        error: "Laporan klinis untuk sesi ini belum tersedia atau token tidak valid.",
      }
    }

    const { booking, counselor, report } = rows[0]

    // Auto-sync Xendit extension status before checking gate
    const extFeeNum = Number(booking.extensionFee || 0)
    if (
      booking.isExtended &&
      extFeeNum > 0 &&
      booking.extensionPaymentMethod === "xendit" &&
      booking.extensionPaymentStatus === "PENDING"
    ) {
      try {
        const extTxRows = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.bookingId, booking.id),
              or(
                eq(transactions.adminNotes, "EXTENSION"),
                ilike(transactions.referenceNumber, "EXT-%")
              )
            )
          )
          .orderBy(desc(transactions.createdAt))
          .limit(1)

        const extTx = extTxRows[0]
        if (extTx && extTx.xenditInvoiceId) {
          const xenditInvoice = await getXenditInvoice(extTx.xenditInvoiceId)
          if (
            xenditInvoice &&
            (xenditInvoice.status === "PAID" || xenditInvoice.status === "SETTLED")
          ) {
            await Promise.all([
              db
                .update(transactions)
                .set({
                  status: "PAID",
                  paidAt: xenditInvoice.paid_at ? new Date(xenditInvoice.paid_at) : new Date(),
                  paymentMethod:
                    xenditInvoice.payment_method ||
                    xenditInvoice.payment_channel ||
                    "XENDIT_AUTO",
                })
                .where(eq(transactions.id, extTx.id)),
              db
                .update(bookings)
                .set({
                  extensionPaymentStatus: "PAID",
                })
                .where(eq(bookings.id, booking.id)),
            ])
            booking.extensionPaymentStatus = "PAID"
          }
        }
      } catch (syncErr) {
        console.error("[AUTO_SYNC_UNLOCK_EXT_ERROR]", syncErr)
      }
    }

    // Extend payment security gate
    if (booking.isExtended && extFeeNum > 0 && booking.extensionPaymentStatus !== "PAID") {
      return {
        success: false,
        error:
          "Laporan klinis resmi belum dapat diakses karena biaya perpanjangan sesi belum dilunasi. Silakan selesaikan pembayaran perpanjangan terlebih dahulu.",
      }
    }

    // Phone verification check
    const cleanInput = normalizeIndonesianPhone(verificationPhone)
    const cleanBookingPhone = normalizeIndonesianPhone(booking.patientPhone)
    if (
      cleanInput !== cleanBookingPhone &&
      !cleanBookingPhone.endsWith(cleanInput) &&
      !cleanInput.endsWith(cleanBookingPhone)
    ) {
      return {
        success: false,
        error: "Nomor WhatsApp verifikasi tidak cocok dengan data pendaftaran sesi.",
      }
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
 * Processes session extension payment via either Manual Bank Transfer or Xendit.
 */
export async function processExtensionPayment(
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

    // 1. Dependency injection seam for testing
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
        const createInvoiceFn = deps.createXenditInvoice || createXenditInvoice
        const appUrl = getAppBaseUrl()
        const invoice = await createInvoiceFn({
          externalId: `EXT-${b.bookingCode || b.id.slice(0, 8)}-${Date.now()}`,
          amount: b.extensionFee || 35000,
          payerEmail: b.patientEmail || "pasien@example.com",
          description: `Perpanjangan Sesi Konseling (${b.extensionMinutes || 30} menit)`,
          successRedirectUrl: `${appUrl}/session/${accessToken}?extend_status=success`,
          failureRedirectUrl: `${appUrl}/session/${accessToken}?extend_status=failed`,
        })

        await deps.updateBooking(b.id, {
          extensionPaymentMethod: "xendit",
        })

        return {
          success: true,
          data: {
            status: "PENDING",
            message: "Silakan lanjutkan pembayaran melalui gerbang pembayaran Xendit.",
            paymentUrl: invoice.invoiceUrl,
          },
        }
      }
    }

    // 2. Real Database Execution
    const bookingRows = await db
      .select()
      .from(bookings)
      .where(or(eq(bookings.accessToken, accessToken), eq(bookings.bookingCode, accessToken)))
      .limit(1)

    if (bookingRows.length === 0) {
      return { success: false, error: "Sesi konseling tidak ditemukan" }
    }

    const booking = bookingRows[0]

    if (paymentMethod === "manual_bank_transfer") {
      await db
        .update(bookings)
        .set({
          extensionPaymentStatus: "PENDING",
          extensionPaymentMethod: "manual_bank_transfer",
          extensionProofR2Key: proofR2Key,
        })
        .where(eq(bookings.id, booking.id))

      return {
        success: true,
        data: {
          status: "PENDING",
          message: "Bukti transfer perpanjangan sesi berhasil dikirim. Menunggu verifikasi admin.",
        },
      }
    } else {
      const appUrl = getAppBaseUrl()
      const fee = booking.extensionFee ? Number(booking.extensionFee) : 35000
      const externalId = `EXT-${booking.bookingCode || booking.id.slice(0, 8)}-${Date.now()}`

      const invoice = await createXenditInvoice({
        externalId,
        amount: fee,
        payerEmail: booking.patientEmail,
        description: `Perpanjangan Sesi Konseling ${booking.bookingCode || ""} (${booking.extensionMinutes || 30} menit)`,
        successRedirectUrl: `${appUrl}/session/${accessToken}?extend_status=success`,
        failureRedirectUrl: `${appUrl}/session/${accessToken}?extend_status=failed`,
      })

      // Insert transaction record for the extension
      await db.insert(transactions).values({
        bookingId: booking.id,
        xenditInvoiceId: invoice.id,
        xenditPaymentUrl: invoice.invoiceUrl,
        paymentProvider: "xendit",
        paymentMethod: "XENDIT_AUTO",
        referenceNumber: externalId,
        adminNotes: "EXTENSION",
        grossAmount: String(fee),
        netAmount: String(fee),
        status: "PENDING",
      })

      await db
        .update(bookings)
        .set({
          extensionPaymentMethod: "xendit",
          extensionPaymentStatus: "PENDING",
        })
        .where(eq(bookings.id, booking.id))

      return {
        success: true,
        data: {
          status: "PENDING",
          message: "Silakan lanjutkan pembayaran melalui gerbang pembayaran Xendit.",
          paymentUrl: invoice.invoiceUrl,
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
