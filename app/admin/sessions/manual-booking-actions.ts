"use server"

import { revalidatePath } from "next/cache"
import { eq, and, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/db"
import { counselors, schedules, bookings, transactions, zoomAccounts } from "@/db/schema"
import {
  computeEndTime,
  isTimeRangeOverlapping,
  MAX_PLATFORM_CONCURRENCY,
} from "@/lib/schedules/concurrency"
import { generateSessionAccessToken } from "@/lib/booking/hold"
import { getAuthenticatedAdmin, type AdminAuthContext } from "@/app/admin/counselors/actions"
import {
  adminManualBookingSchema,
  type AdminManualBookingInput,
} from "@/lib/validations/admin-manual-booking"

/**
 * Fetches all active counselors available for manual booking assignment.
 */
export async function getAvailableCounselorsAction(options?: {
  currentUser?: AdminAuthContext | null
  fetchFn?: () => Promise<any[]>
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    if (options?.fetchFn) {
      const data = await options.fetchFn()
      return { success: true, data }
    }

    const rows = await db
      .select({
        id: counselors.id,
        fullName: counselors.fullName,
        title: counselors.title,
        counselorType: counselors.counselorType,
        avatarR2Url: counselors.avatarR2Url,
        isActive: counselors.isActive,
      })
      .from(counselors)
      .where(eq(counselors.isActive, true))
      .orderBy(counselors.fullName)

    return { success: true, data: rows }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memuat daftar mitra konselor.",
    }
  }
}

/**
 * Fetches available upcoming slots for a specific counselor.
 */
export async function getCounselorAvailableSlotsAction(
  counselorId: string,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchSlotsFn?: (counselorId: string) => Promise<any[]>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    if (options?.fetchSlotsFn) {
      const data = await options.fetchSlotsFn(counselorId)
      return { success: true, data }
    }

    const todayStr = new Date().toISOString().split("T")[0]

    const rows = await db
      .select({
        id: schedules.id,
        counselorId: schedules.counselorId,
        date: schedules.date,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        status: schedules.status,
      })
      .from(schedules)
      .where(
        and(
          eq(schedules.counselorId, counselorId),
          eq(schedules.status, "available"),
          gte(schedules.date, todayStr)
        )
      )
      .orderBy(schedules.date, schedules.startTime)

    return { success: true, data: rows }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memuat jadwal konselor.",
    }
  }
}

/**
 * Checks platform-wide Zoom concurrency for a proposed date and time window.
 * Returns whether 2 concurrent Zoom limit is saturated.
 */
export async function checkZoomConcurrencyAction(
  dateStr: string,
  startTimeStr: string,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchOverlapCountFn?: (date: string, start: string, end: string) => Promise<number>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const endTimeStr = computeEndTime(startTimeStr)

    if (options?.fetchOverlapCountFn) {
      const activeOverlapCount = await options.fetchOverlapCountFn(dateStr, startTimeStr, endTimeStr)
      return {
        success: true,
        data: {
          available: activeOverlapCount < MAX_PLATFORM_CONCURRENCY,
          activeOverlapCount,
          maxConcurrency: MAX_PLATFORM_CONCURRENCY,
        },
      }
    }

    // Query active bookings overlapping this window on this date
    const overlappingSchedules = await db
      .select({
        id: schedules.id,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
      })
      .from(schedules)
      .innerJoin(bookings, eq(bookings.scheduleId, schedules.id))
      .where(
        and(
          eq(schedules.date, dateStr),
          inArray(bookings.status, ["confirmed", "pending_payment"])
        )
      )

    let activeOverlapCount = 0
    for (const s of overlappingSchedules) {
      if (isTimeRangeOverlapping(s.startTime, s.endTime, startTimeStr, endTimeStr)) {
        activeOverlapCount++
      }
    }

    return {
      success: true,
      data: {
        available: activeOverlapCount < MAX_PLATFORM_CONCURRENCY,
        activeOverlapCount,
        maxConcurrency: MAX_PLATFORM_CONCURRENCY,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memeriksa kuota Zoom.",
    }
  }
}

/**
 * Core server action: Creates zero-cost Admin Bypass booking.
 * 1. Validates inputs & audit notes.
 * 2. Prepares/validates schedule slot and calculates 90-minute end time.
 * 3. Enforces Zoom Concurrency Guard or accepts manual meeting link.
 * 4. Generates 32-char nanoid session token.
 * 5. Creates confirmed booking and PAID Rp0 transaction.
 */
export async function createAdminManualBookingAction(
  input: AdminManualBookingInput,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchCounselorFn?: (id: string) => Promise<any>
    fetchScheduleFn?: (id: string) => Promise<any>
    createScheduleFn?: (schedule: any) => Promise<any>
    updateScheduleStatusFn?: (id: string, status: string) => Promise<any>
    checkConcurrencyFn?: (date: string, start: string, end: string) => Promise<number>
    insertBookingFn?: (booking: any) => Promise<any>
    insertTransactionFn?: (tx: any) => Promise<any>
    sendEmailFn?: (payload: any) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk membuat booking manual.",
    }
  }

  const parsed = adminManualBookingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data formulir booking tidak valid.",
    }
  }

  const data = parsed.data

  try {
    // 1. Fetch Counselor to determine credentials & base pricing
    let counselor: any = null
    if (options?.fetchCounselorFn) {
      counselor = await options.fetchCounselorFn(data.counselorId)
    } else {
      const rows = await db
        .select()
        .from(counselors)
        .where(eq(counselors.id, data.counselorId))
        .limit(1)
      counselor = rows[0] || null
    }

    if (!counselor) {
      return { success: false, error: "Mitra konselor yang dipilih tidak ditemukan." }
    }

    // 2. Prepare Schedule Slot
    let scheduleId = data.scheduleId
    let scheduleDate: string
    let scheduleStartTime: string
    let scheduleEndTime: string

    if (data.scheduleMode === "existing") {
      let existingSchedule: any = null
      if (options?.fetchScheduleFn) {
        existingSchedule = await options.fetchScheduleFn(data.scheduleId!)
      } else {
        const rows = await db
          .select()
          .from(schedules)
          .where(eq(schedules.id, data.scheduleId!))
          .limit(1)
        existingSchedule = rows[0] || null
      }

      if (!existingSchedule) {
        return { success: false, error: "Slot jadwal yang dipilih tidak ditemukan." }
      }
      if (existingSchedule.status !== "available") {
        return { success: false, error: "Slot jadwal ini sudah tidak tersedia lagi." }
      }

      scheduleDate = existingSchedule.date
      scheduleStartTime = existingSchedule.startTime
      scheduleEndTime = existingSchedule.endTime
    } else {
      // Ad-hoc schedule creation
      scheduleDate = data.adhocDate!
      scheduleStartTime = data.adhocStartTime!
      scheduleEndTime = computeEndTime(scheduleStartTime)

      // Check Zoom concurrency for adhoc slot if auto Zoom is selected
      if (data.createZoom) {
        let overlapCount = 0
        if (options?.checkConcurrencyFn) {
          overlapCount = await options.checkConcurrencyFn(
            scheduleDate,
            scheduleStartTime,
            scheduleEndTime
          )
        } else {
          const overlapping = await db
            .select({
              id: schedules.id,
              startTime: schedules.startTime,
              endTime: schedules.endTime,
            })
            .from(schedules)
            .innerJoin(bookings, eq(bookings.scheduleId, schedules.id))
            .where(
              and(
                eq(schedules.date, scheduleDate),
                inArray(bookings.status, ["confirmed", "pending_payment"])
              )
            )

          for (const s of overlapping) {
            if (isTimeRangeOverlapping(s.startTime, s.endTime, scheduleStartTime, scheduleEndTime)) {
              overlapCount++
            }
          }
        }

        if (overlapCount >= MAX_PLATFORM_CONCURRENCY && !data.manualMeetingUrl) {
          return {
            success: false,
            error:
              "Kapasitas 2 Akun Zoom platform telah penuh pada jam tersebut. Silakan masukkan tautan rapat manual (Google Meet) atau pilih jam lain.",
          }
        }
      }

      // Create new adhoc schedule slot marked as booked
      const newSchedulePayload = {
        counselorId: data.counselorId,
        date: scheduleDate,
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
        status: "booked",
      }

      if (options?.createScheduleFn) {
        const created = await options.createScheduleFn(newSchedulePayload)
        scheduleId = created.id
      } else {
        const [created] = await db
          .insert(schedules)
          .values(newSchedulePayload as any)
          .returning()
        scheduleId = created.id
      }
    }

    // Lock existing schedule to 'booked' if existing mode
    if (data.scheduleMode === "existing") {
      if (options?.updateScheduleStatusFn) {
        await options.updateScheduleStatusFn(scheduleId!, "booked")
      } else {
        await db
          .update(schedules)
          .set({ status: "booked" })
          .where(eq(schedules.id, scheduleId!))
      }
    }

    // 3. Generate 32-character Token Sesi
    const accessToken = generateSessionAccessToken()

    // 4. Determine Meeting URL & Zoom details
    let zoomJoinUrl: string | null = null
    let zoomStartUrl: string | null = null
    let zoomAccountId: string | null = null
    let zoomMeetingId: string | null = null

    if (data.createZoom && !data.manualMeetingUrl) {
      // Automatic Zoom allocation mock/fallback
      const meetingNum = Math.floor(80000000000 + Math.random() * 10000000000)
      zoomMeetingId = String(meetingNum)
      zoomJoinUrl = `https://zoom.us/j/${meetingNum}`
      zoomStartUrl = `https://zoom.us/s/${meetingNum}`
    } else if (data.manualMeetingUrl) {
      zoomJoinUrl = data.manualMeetingUrl
      zoomStartUrl = data.manualMeetingUrl
    }

    // 5. Insert Booking
    const bookingPayload = {
      accessToken,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      initialNotes: data.initialNotes || null,
      scheduleId: scheduleId!,
      counselorId: data.counselorId,
      status: "confirmed",
      zoomAccountId,
      zoomMeetingId,
      zoomJoinUrl,
      zoomStartUrl,
    }

    let bookingRecord: any = null
    if (options?.insertBookingFn) {
      bookingRecord = await options.insertBookingFn(bookingPayload)
    } else {
      const [inserted] = await db
        .insert(bookings)
        .values(bookingPayload as any)
        .returning()
      bookingRecord = inserted
    }

    // 6. Insert Rp0 Audit Transaction
    const normalPrice = counselor.counselorType === "psychologist" ? "130000.00" : "85000.00"
    const txPayload = {
      bookingId: bookingRecord.id,
      paymentProvider: "admin_bypass",
      paymentMethod: "Admin Bypass (Rp 0)",
      referenceNumber: `ADMIN-BYPASS-${accessToken.slice(0, 8).toUpperCase()}`,
      grossAmount: normalPrice,
      discountAmount: normalPrice,
      netAmount: "0.00",
      status: "PAID",
      paidAt: new Date(),
      adminNotes: data.adminNotes,
    }

    let transactionRecord: any = null
    if (options?.insertTransactionFn) {
      transactionRecord = await options.insertTransactionFn(txPayload)
    } else {
      const [insertedTx] = await db
        .insert(transactions)
        .values(txPayload as any)
        .returning()
      transactionRecord = insertedTx
    }

    // 7. Optional Email Confirmation
    if (data.sendConfirmationEmail && options?.sendEmailFn) {
      try {
        await options.sendEmailFn({
          patientEmail: data.patientEmail,
          patientName: data.patientName,
          counselorName: counselor.fullName,
          accessToken,
          date: scheduleDate,
          time: `${scheduleStartTime} – ${scheduleEndTime} WIB`,
          zoomJoinUrl,
        })
      } catch (emailErr) {
        console.error("Failed to send manual booking confirmation email:", emailErr)
      }
    }

    try {
      revalidatePath("/admin/sessions")
      revalidatePath(`/session/${accessToken}`)
    } catch {
      // safe in test
    }

    return {
      success: true,
      message: `Booking manual atas nama ${data.patientName} berhasil dibuat.`,
      data: {
        bookingId: bookingRecord.id,
        accessToken,
        sessionUrl: `/session/${accessToken}`,
        transactionId: transactionRecord.id,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memproses booking manual.",
    }
  }
}
