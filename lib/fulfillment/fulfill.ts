import { eq } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, transactions, zoomAccounts } from "@/db/schema"
import { allocateZoomAccount } from "./allocate-zoom"
import { getZoomAccessToken, createZoomMeeting } from "@/lib/zoom/client"
import { formatTimeRange } from "@/lib/schedules/concurrency"
import { formatIndonesianDate } from "@/lib/session/time"
import {
  sendPatientConfirmationEmail,
  sendCounselorNotificationEmail,
} from "./emails"

export interface FulfillBookingDependencies {
  fetchBookingData?: (bookingId: string) => Promise<any>
  allocateAccount?: typeof allocateZoomAccount
  getAccessToken?: typeof getZoomAccessToken
  createMeeting?: typeof createZoomMeeting
  sendPatientEmail?: typeof sendPatientConfirmationEmail
  sendCounselorEmail?: typeof sendCounselorNotificationEmail
}

export interface FulfillBookingResult {
  success: boolean
  bookingId: string
  zoomJoinUrl?: string | null
  zoomStartUrl?: string | null
  zoomMeetingId?: string | null
  zoomAccountId?: string | null
  error?: string
}

/**
 * Executes decoupled fulfillment for a booked session:
 * 1. Allocates available Zoom Pro account dynamically
 * 2. Creates 90-minute Zoom meeting room
 * 3. Persists join/start URLs to bookings table
 * 4. Sends confirmation emails to both patient and counselor
 */
export async function fulfillBooking(
  bookingId: string,
  deps: FulfillBookingDependencies = {}
): Promise<FulfillBookingResult> {
  try {
    if (!bookingId) {
      return { success: false, bookingId: "", error: "Booking ID wajib diisi" }
    }

    // 1. Fetch Booking, Counselor, Schedule, and Counselor User record
    let bookingRow: any
    let counselorRow: any
    let scheduleRow: any

    if (deps.fetchBookingData) {
      const data = await deps.fetchBookingData(bookingId)
      if (!data) {
        return {
          success: false,
          bookingId,
          error: `Data booking dengan ID ${bookingId} tidak ditemukan`,
        }
      }
      bookingRow = data.booking
      counselorRow = data.counselor
      scheduleRow = data.schedule
    } else {
      const rows = await db
        .select({
          booking: bookings,
          counselor: counselors,
          schedule: schedules,
        })
        .from(bookings)
        .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
        .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .where(eq(bookings.id, bookingId))
        .limit(1)

      if (rows.length === 0) {
        return {
          success: false,
          bookingId,
          error: `Data booking dengan ID ${bookingId} tidak ditemukan`,
        }
      }

      bookingRow = rows[0].booking
      counselorRow = rows[0].counselor
      scheduleRow = rows[0].schedule
    }

    // Check if Zoom room is already generated (idempotency)
    if (bookingRow.zoomJoinUrl && bookingRow.zoomStartUrl) {
      return {
        success: true,
        bookingId,
        zoomJoinUrl: bookingRow.zoomJoinUrl,
        zoomStartUrl: bookingRow.zoomStartUrl,
        zoomMeetingId: bookingRow.zoomMeetingId,
        zoomAccountId: bookingRow.zoomAccountId,
      }
    }

    // 2. Allocate an available Zoom Pro account
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
        error: allocation.error || "Gagal mengalokasikan akun Zoom",
      }
    }

    const assignedAccount = allocation.account

    // 3. Create Zoom Meeting via S2S OAuth
    const getAccessTokenFn = deps.getAccessToken ?? getZoomAccessToken
    const createMeetingFn = deps.createMeeting ?? createZoomMeeting

    let joinUrl: string
    let startUrl: string
    let meetingId: string

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
      // If Zoom API fails, keep booking confirmed so money isn't lost (per CONTEXT.md)
      // The session page displays "Zoom sedang disiapkan" (US-24)
      console.error("Zoom API meeting creation error:", zoomErr)
      return {
        success: false,
        bookingId,
        error: `Gagal membuat ruang Zoom: ${zoomErr.message}`,
      }
    }

    // 4. Persist Zoom meeting info to database
    if (!deps.fetchBookingData) {
      await db
        .update(bookings)
        .set({
          zoomAccountId: assignedAccount.id,
          zoomMeetingId: meetingId,
          zoomJoinUrl: joinUrl,
          zoomStartUrl: startUrl,
          status: "confirmed",
        })
        .where(eq(bookings.id, bookingId))

      // Also ensure schedule is booked
      await db
        .update(schedules)
        .set({ status: "booked" })
        .where(eq(schedules.id, scheduleRow.id))
    }

    // 5. Send Transactional Emails (Patient & Counselor)
    const formattedDate = formatIndonesianDate(scheduleRow.date)
    const timeRange = formatTimeRange(
      scheduleRow.startTime,
      scheduleRow.endTime
    )

    const sendPatientFn =
      deps.sendPatientEmail ?? sendPatientConfirmationEmail
    const sendCounselorFn =
      deps.sendCounselorEmail ?? sendCounselorNotificationEmail

    // Non-blocking email dispatches
    await Promise.allSettled([
      sendPatientFn({
        patientEmail: bookingRow.patientEmail,
        patientName: bookingRow.patientName,
        counselorName: counselorRow.fullName,
        date: formattedDate,
        timeRange,
        accessToken: bookingRow.accessToken,
      }),
      // Counselor email (from counselor application or counselor record email)
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
      zoomJoinUrl: joinUrl,
      zoomStartUrl: startUrl,
      zoomMeetingId: meetingId,
      zoomAccountId: assignedAccount.id,
    }
  } catch (error: any) {
    return {
      success: false,
      bookingId,
      error: error?.message || "Terjadi kesalahan pada alur fulfillment",
    }
  }
}
