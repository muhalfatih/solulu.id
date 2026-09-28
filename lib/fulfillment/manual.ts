import { eq } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, transactions } from "@/db/schema"
import { allocateZoomAccount } from "./allocate-zoom"
import { getZoomAccessToken, createZoomMeeting } from "@/lib/zoom/client"
import { formatTimeRange } from "@/lib/schedules/concurrency"
import { formatIndonesianDate } from "@/lib/session/time"
import {
  sendPatientConfirmationEmail,
  sendCounselorNotificationEmail,
} from "./emails"

export interface ConfirmManualPaymentInput {
  bookingId: string
  paymentMethod: string
  referenceNumber: string
  adminNotes?: string
}

export interface ManualPaymentDependencies {
  fetchBookingData?: (bookingId: string) => Promise<any>
  allocateAccount?: typeof allocateZoomAccount
  getAccessToken?: typeof getZoomAccessToken
  createMeeting?: typeof createZoomMeeting
  sendPatientEmail?: typeof sendPatientConfirmationEmail
  sendCounselorEmail?: typeof sendCounselorNotificationEmail
}

export interface ConfirmManualPaymentResult {
  success: boolean
  bookingId: string
  zoomRoom?: string
  zoomJoinUrl?: string
  zoomStartUrl?: string
  error?: string
}

/**
 * Path B: Admin Manual Bank Transfer Verification (US-42, Spec Sec 119).
 * Directly allocates Zoom Pro host, creates Zoom meeting room,
 * marks transaction PAID, and dispatches confirmation email.
 */
export async function confirmManualPayment(
  input: ConfirmManualPaymentInput,
  deps: ManualPaymentDependencies = {}
): Promise<ConfirmManualPaymentResult> {
  try {
    const { bookingId, paymentMethod, referenceNumber, adminNotes } = input

    if (!bookingId || !paymentMethod || !referenceNumber) {
      return {
        success: false,
        bookingId: bookingId || "",
        error: "ID Pemesanan, metode pembayaran, dan nomor referensi wajib diisi.",
      }
    }

    // 1. Fetch booking details
    let bookingRow: any
    let counselorRow: any
    let scheduleRow: any
    let transactionRow: any

    if (deps.fetchBookingData) {
      const data = await deps.fetchBookingData(bookingId)
      if (!data) {
        return {
          success: false,
          bookingId,
          error: "Data sesi pemesanan tidak ditemukan.",
        }
      }
      bookingRow = data.booking
      counselorRow = data.counselor
      scheduleRow = data.schedule
      transactionRow = data.transaction
    } else {
      const rows = await db
        .select({
          booking: bookings,
          counselor: counselors,
          schedule: schedules,
          transaction: transactions,
        })
        .from(bookings)
        .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
        .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .leftJoin(transactions, eq(bookings.id, transactions.bookingId))
        .where(eq(bookings.id, bookingId))
        .limit(1)

      if (rows.length === 0) {
        return {
          success: false,
          bookingId,
          error: "Data sesi pemesanan tidak ditemukan.",
        }
      }

      bookingRow = rows[0].booking
      counselorRow = rows[0].counselor
      scheduleRow = rows[0].schedule
      transactionRow = rows[0].transaction
    }

    if (transactionRow && transactionRow.status === "PAID") {
      return {
        success: false,
        bookingId,
        error: "Transaksi untuk pemesanan ini telah berstatus LUNAS sebelumnya.",
      }
    }

    // 2. Allocate Zoom host dynamically
    const allocateFn = deps.allocateAccount ?? allocateZoomAccount
    const allocation = await allocateFn(
      scheduleRow.date,
      scheduleRow.startTime,
      scheduleRow.endTime
    )

    if (!allocation.success || !allocation.account) {
      return {
        success: false,
        bookingId,
        error:
          allocation.error ||
          "Gagal mengalokasikan akun Zoom Pro (kapasitas penuh).",
      }
    }

    const assignedAccount = allocation.account

    // 3. Create Zoom Meeting Room
    const getAccessTokenFn = deps.getAccessToken ?? getZoomAccessToken
    const createMeetingFn = deps.createMeeting ?? createZoomMeeting

    let joinUrl = ""
    let startUrl = ""
    let meetingId = ""

    try {
      const accessToken = await getAccessTokenFn(assignedAccount)
      const meetingResult = await createMeetingFn(accessToken, {
        topic: `Konseling Solulu: ${counselorRow.fullName} & ${bookingRow.patientName}`,
        startTime: `${scheduleRow.date}T${scheduleRow.startTime}+07:00`,
        durationMinutes: 90,
      })

      joinUrl = meetingResult.joinUrl
      startUrl = meetingResult.startUrl
      meetingId = meetingResult.meetingId
    } catch (zoomErr: any) {
      return {
        success: false,
        bookingId,
        error: `Gagal membuat ruang pertemuan Zoom: ${zoomErr.message}`,
      }
    }

    // 4. Update Database: Transaction, Booking, Schedule
    if (!deps.fetchBookingData) {
      if (transactionRow) {
        await db
          .update(transactions)
          .set({
            status: "PAID",
            paymentProvider: "manual",
            paymentMethod,
            referenceNumber,
            adminNotes: adminNotes || null,
            paidAt: new Date(),
          })
          .where(eq(transactions.id, transactionRow.id))
      }

      await db
        .update(bookings)
        .set({
          status: "confirmed",
          zoomAccountId: assignedAccount.id,
          zoomMeetingId: meetingId,
          zoomJoinUrl: joinUrl,
          zoomStartUrl: startUrl,
        })
        .where(eq(bookings.id, bookingId))

      await db
        .update(schedules)
        .set({ status: "booked" })
        .where(eq(schedules.id, scheduleRow.id))
    }

    // 5. Send Transactional Confirmation Emails
    const formattedDate = formatIndonesianDate(scheduleRow.date)
    const timeRange = formatTimeRange(
      scheduleRow.startTime,
      scheduleRow.endTime
    )

    const sendPatientFn =
      deps.sendPatientEmail ?? sendPatientConfirmationEmail
    const sendCounselorFn =
      deps.sendCounselorEmail ?? sendCounselorNotificationEmail

    await Promise.allSettled([
      sendPatientFn({
        patientEmail: bookingRow.patientEmail,
        patientName: bookingRow.patientName,
        counselorName: counselorRow.fullName,
        date: formattedDate,
        timeRange,
        accessToken: bookingRow.accessToken,
      }),
      sendCounselorFn({
        counselorEmail: counselorRow.email || "counselor@solulu.id",
        counselorName: counselorRow.fullName,
        patientName: bookingRow.patientName,
        date: formattedDate,
        timeRange,
        initialNotes: bookingRow.initialNotes,
      }),
    ])

    return {
      success: true,
      bookingId,
      zoomRoom: assignedAccount.name,
      zoomJoinUrl: joinUrl,
      zoomStartUrl: startUrl,
    }
  } catch (error: any) {
    return {
      success: false,
      bookingId: input?.bookingId || "",
      error: error?.message || "Gagal memverifikasi pembayaran manual.",
    }
  }
}
