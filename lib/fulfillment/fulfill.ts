import { eq, and, inArray, asc } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, zoomAccounts } from "@/db/schema"
import { getZoomAccessToken, createZoomMeeting } from "@/lib/zoom/client"
import { formatTimeRange } from "@/lib/schedules/concurrency"
import { formatIndonesianDate } from "@/lib/session/time"
import {
  dispatchZoomForSession,
  formatBreakoutRoomName,
} from "@/lib/operator/dispatcher"
import {
  sendPatientConfirmationEmail,
  sendCounselorNotificationEmail,
} from "./emails"

export interface FulfillSessionOptions {
  source?: "xendit" | "manual_bank" | "admin_bypass"
  manualMeetingUrl?: string
  skipEmails?: boolean
}

export interface FulfillSessionAdapters {
  zoomClient?: {
    getAccessToken?: typeof getZoomAccessToken
    createMeeting?: typeof createZoomMeeting
  }
  notifier?: {
    sendPatientEmail?: typeof sendPatientConfirmationEmail
    sendCounselorEmail?: typeof sendCounselorNotificationEmail
  }
  // Internal test shims for isolated environments
  fetchBookingData?: (bookingId: string) => Promise<any>
  getZoomAccount?: (accountNumber: number) => Promise<any>
  allocateAccount?: (date: string, startTime: string, endTime: string) => Promise<any>
}

// Backward compatibility alias for legacy test callers
export type FulfillBookingDependencies = FulfillSessionAdapters & {
  allocateAccount?: (date: string, startTime: string, endTime: string) => Promise<any>
  getAccessToken?: typeof getZoomAccessToken
  createMeeting?: typeof createZoomMeeting
  sendPatientEmail?: typeof sendPatientConfirmationEmail
  sendCounselorEmail?: typeof sendCounselorNotificationEmail
  dispatchZoom?: typeof dispatchZoomForSession
}

export type FulfillSessionDependencies = FulfillBookingDependencies

export interface FulfillSessionResult {
  success: boolean
  bookingId: string
  zoomJoinUrl?: string | null
  zoomStartUrl?: string | null
  zoomMeetingId?: string | null
  zoomAccountId?: string | null
  zoomAccountNumber?: number
  zoomAllocationMode?: "standalone" | "breakout_room"
  breakoutRoomName?: string | null
  zoomRoom?: string
  error?: string
}

export type FulfillBookingResult = FulfillSessionResult

/**
 * Deep Module: Pemenuhan Sesi (Session Fulfillment)
 *
 * Canonical, unified post-payment execution for Solulu consultation sessions:
 * 1. Single Seam: Handles Xendit Webhooks, Admin Manual Bank Transfer, and Admin Rp0 Bypass.
 * 2. Idempotency Invariant: Returns existing meeting URLs if already fulfilled.
 * 3. Master SOP 4-Zoom Hybrid Dispatcher (ADR-0005):
 *    - Ranks 1..3: Zoom 1, 2, 3 (standalone)
 *    - Rank 4: Zoom 4 (standalone if total <= 4; breakout if total > 4)
 *    - Ranks 5..10: Zoom 4 in Breakout Room guided by Operator.
 * 4. External URL Override: Seamlessly records manual meeting URLs (e.g. Google Meet fallback)
 *    without invoking Zoom S2S APIs.
 * 5. Payment Resilience Invariant (CONTEXT.md): On Zoom API error, locks booking to 'confirmed'
 *    and schedule to 'booked' so patient payment is never lost.
 * 6. Transactional Notifications: Asynchronously notifies Klien and Mitra Konselor via Resend.
 */
export async function fulfillSession(
  bookingId: string,
  optionsOrDeps: FulfillSessionOptions | FulfillSessionDependencies = {},
  maybeAdapters: FulfillSessionAdapters = {}
): Promise<FulfillSessionResult> {
  try {
    if (!bookingId) {
      return { success: false, bookingId: "", error: "Booking ID wajib diisi" }
    }

    // Resolve unified options vs legacy callback bag
    const isLegacyBag =
      "fetchBookingData" in optionsOrDeps ||
      "createMeeting" in optionsOrDeps ||
      "sendPatientEmail" in optionsOrDeps ||
      "allocateAccount" in optionsOrDeps ||
      "getAccessToken" in optionsOrDeps

    const options: FulfillSessionOptions = isLegacyBag
      ? {}
      : (optionsOrDeps as FulfillSessionOptions)

    const adapters: FulfillSessionAdapters = isLegacyBag
      ? (optionsOrDeps as FulfillSessionDependencies)
      : maybeAdapters

    const legacyDeps = (isLegacyBag ? optionsOrDeps : maybeAdapters) as FulfillBookingDependencies

    // 1. Fetch Booking, Counselor, and Schedule
    let bookingRow: any
    let counselorRow: any
    let scheduleRow: any

    if (adapters.fetchBookingData) {
      const data = await adapters.fetchBookingData(bookingId)
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

    // 2. Idempotency Guard: return existing room if already generated
    if (bookingRow.zoomJoinUrl && bookingRow.zoomStartUrl) {
      return {
        success: true,
        bookingId,
        zoomJoinUrl: bookingRow.zoomJoinUrl,
        zoomStartUrl: bookingRow.zoomStartUrl,
        zoomMeetingId: bookingRow.zoomMeetingId,
        zoomAccountId: bookingRow.zoomAccountId,
        zoomAccountNumber: bookingRow.zoomAccountNumber || 1,
        zoomAllocationMode: bookingRow.zoomAllocationMode || "standalone",
        breakoutRoomName: bookingRow.breakoutRoomName || null,
      }
    }

    const breakoutName = formatBreakoutRoomName(
      bookingRow.bookingCode || "SL-1001",
      counselorRow.fullName
    )

    // 3. Handle Manual Meeting URL Override (e.g. Google Meet Fallback)
    const manualUrl = options.manualMeetingUrl || bookingRow.zoomJoinUrl
    if (manualUrl && !manualUrl.includes("zoom.us")) {
      if (!adapters.fetchBookingData) {
        await db
          .update(bookings)
          .set({
            status: "confirmed",
            zoomJoinUrl: manualUrl,
            zoomStartUrl: manualUrl,
            zoomAllocationMode: "standalone",
            breakoutRoomName: null,
          })
          .where(eq(bookings.id, bookingId))

        await db
          .update(schedules)
          .set({ status: "booked" })
          .where(eq(schedules.id, scheduleRow.id))
      }

      await dispatchNotifications({
        bookingRow: { ...bookingRow, zoomJoinUrl: manualUrl },
        counselorRow,
        scheduleRow,
        options,
        adapters,
      })

      return {
        success: true,
        bookingId,
        zoomJoinUrl: manualUrl,
        zoomStartUrl: manualUrl,
        zoomAllocationMode: "standalone",
        zoomRoom: "External Meeting Link",
      }
    }

    // 4. Determine Zoom Account & Allocation Mode via Master SOP 4-Zoom Dispatcher
    let targetAccountNumber = 1
    let targetMode: "standalone" | "breakout_room" = "standalone"
    let assignedAccount: any

    const allocateAccountFn =
      adapters.allocateAccount ??
      (optionsOrDeps as FulfillBookingDependencies).allocateAccount
    if (allocateAccountFn) {
      const allocation = await allocateAccountFn(
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
      assignedAccount = allocation.account
      targetAccountNumber = (assignedAccount as any).accountNumber || 1
      targetMode = targetAccountNumber === 4 ? "breakout_room" : "standalone"
    } else {
      // Deterministic slot ranking based on (date, slotIndex)
      const slotIndex = scheduleRow.slotIndex || 1
      let sessionRank = 1
      let totalInSlot = 1

      if (!adapters.fetchBookingData) {
        const slotSessions = await db
          .select({ id: bookings.id })
          .from(bookings)
          .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
          .where(
            and(
              eq(schedules.date, scheduleRow.date),
              eq(schedules.slotIndex, slotIndex),
              inArray(bookings.status, ["confirmed", "pending_payment"])
            )
          )
          .orderBy(asc(bookings.createdAt))

        const existingIndex = slotSessions.findIndex((s) => s.id === bookingId)
        sessionRank = existingIndex >= 0 ? existingIndex + 1 : slotSessions.length + 1
        totalInSlot = Math.max(1, Math.max(slotSessions.length, sessionRank))
      }

      const dispatchFn = legacyDeps.dispatchZoom ?? dispatchZoomForSession
      const dispatchResult = dispatchFn(sessionRank, totalInSlot)
      targetAccountNumber = dispatchResult.accountNumber
      targetMode = dispatchResult.mode

      if (adapters.getZoomAccount) {
        assignedAccount = await adapters.getZoomAccount(targetAccountNumber)
      } else {
        const matchingAccounts = await db
          .select()
          .from(zoomAccounts)
          .where(
            and(
              eq(zoomAccounts.accountNumber, targetAccountNumber),
              eq(zoomAccounts.isActive, true)
            )
          )
          .limit(1)

        if (matchingAccounts.length > 0) {
          assignedAccount = matchingAccounts[0]
        } else {
          // Fallback to any active account
          const anyActive = await db
            .select()
            .from(zoomAccounts)
            .where(eq(zoomAccounts.isActive, true))
            .limit(1)
          assignedAccount = anyActive[0]
        }
      }

      if (!assignedAccount) {
        return {
          success: false,
          bookingId,
          error: "Tidak ada akun Zoom Pro aktif yang terkonfigurasi di sistem.",
        }
      }
    }

    // 5. Create Zoom Meeting via S2S OAuth Client Port
    const getAccessTokenFn =
      adapters.zoomClient?.getAccessToken ??
      (adapters as any).getAccessToken ??
      legacyDeps.getAccessToken ??
      getZoomAccessToken

    const createMeetingFn =
      adapters.zoomClient?.createMeeting ??
      (adapters as any).createMeeting ??
      legacyDeps.createMeeting ??
      createZoomMeeting

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
      console.error("[SESSION FULFILLMENT] Zoom API creation error:", zoomErr)
      // Resilience Invariant (CONTEXT.md): Persist 'confirmed' so patient payment is never lost
      if (!adapters.fetchBookingData) {
        await db
          .update(bookings)
          .set({ status: "confirmed" })
          .where(eq(bookings.id, bookingId))

        await db
          .update(schedules)
          .set({ status: "booked" })
          .where(eq(schedules.id, scheduleRow.id))
      }
      return {
        success: false,
        bookingId,
        error: `Gagal membuat ruang Zoom: ${zoomErr.message}`,
      }
    }

    // 6. Persist Confirmed Status & Zoom Details to Database
    if (!adapters.fetchBookingData) {
      await db
        .update(bookings)
        .set({
          status: "confirmed",
          zoomAccountId: assignedAccount.id,
          zoomAccountNumber: targetAccountNumber,
          zoomAllocationMode: targetMode,
          zoomMeetingId: meetingId,
          zoomJoinUrl: joinUrl,
          zoomStartUrl: startUrl,
          zoomHostKey: assignedAccount.hostKey || null,
          breakoutRoomName: breakoutName,
        })
        .where(eq(bookings.id, bookingId))

      await db
        .update(schedules)
        .set({ status: "booked" })
        .where(eq(schedules.id, scheduleRow.id))
    }

    // 7. Dispatch Transactional Confirmation Emails
    await dispatchNotifications({
      bookingRow: {
        ...bookingRow,
        zoomJoinUrl: joinUrl,
        accessToken: bookingRow.accessToken,
      },
      counselorRow,
      scheduleRow,
      options,
      adapters,
    })

    return {
      success: true,
      bookingId,
      zoomJoinUrl: joinUrl,
      zoomStartUrl: startUrl,
      zoomMeetingId: meetingId,
      zoomAccountId: assignedAccount.id,
      zoomAccountNumber: targetAccountNumber,
      zoomAllocationMode: targetMode,
      breakoutRoomName: breakoutName,
      zoomRoom: assignedAccount.name,
    }
  } catch (error: any) {
    return {
      success: false,
      bookingId,
      error: error?.message || "Terjadi kesalahan pada alur fulfillment",
    }
  }
}

async function dispatchNotifications({
  bookingRow,
  counselorRow,
  scheduleRow,
  options,
  adapters,
}: {
  bookingRow: any
  counselorRow: any
  scheduleRow: any
  options: FulfillSessionOptions
  adapters: FulfillSessionAdapters
}) {
  if (options.skipEmails) return

  const legacyDeps = adapters as FulfillBookingDependencies
  const sendPatientFn =
    adapters.notifier?.sendPatientEmail ??
    legacyDeps.sendPatientEmail ??
    sendPatientConfirmationEmail

  const sendCounselorFn =
    adapters.notifier?.sendCounselorEmail ??
    legacyDeps.sendCounselorEmail ??
    sendCounselorNotificationEmail

  const formattedDate = formatIndonesianDate(scheduleRow.date)
  const timeRange = formatTimeRange(scheduleRow.startTime, scheduleRow.endTime)

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
}

/**
 * Backward compatibility alias for legacy callers
 */
export const fulfillBooking = fulfillSession
