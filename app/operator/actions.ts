"use server"

import { revalidatePath } from "next/cache"
import { eq, and, inArray, asc } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, counselors, zoomAccounts, platformSettings } from "@/db/schema"
import {
  FIXED_SLOTS,
  type OperatorMatrixResponse,
  type OperatorParticipantSession,
  type OperatorSlotData,
} from "@/lib/operator/types"
import {
  determineSlotMode,
  formatBreakoutRoomName,
  formatIndonesianDate,
  getCurrentSlotIndex,
  getTodayWibDateString,
} from "@/lib/operator/dispatcher"

/**
 * Fetches the complete 7-slot matrix for the specified date.
 *
 * Strict Privacy & Zero-Mock Enforcement:
 * 1. Data is queried directly from Supabase PostgreSQL via Drizzle ORM.
 * 2. Medical notes (`sessionReports`) and financial data (`transactions`) are strictly excluded
 *    from the query to guarantee HIPAA/operational privacy compliance for the operator role.
 */
export async function getOperatorSlotMatrixAction(
  dateInput?: string
): Promise<OperatorMatrixResponse> {
  const targetDate = dateInput?.trim() || getTodayWibDateString()

  // 1. Fetch platform settings for max quota (fallback to 10 per SOP)
  let maxQuota = 10
  try {
    const settings = await db.select({ maxSlotQuota: platformSettings.maxSlotQuota }).from(platformSettings).limit(1)
    if (settings.length > 0 && settings[0].maxSlotQuota) {
      maxQuota = settings[0].maxSlotQuota
    }
  } catch {
    maxQuota = 10
  }

  // 2. Query all active bookings on the selected schedule date
  // OPERATIONAL FIELDS ONLY — clinical notes and financial transactions are strictly omitted.
  const queryResult = await db
    .select({
      bookingId: bookings.id,
      bookingCode: bookings.bookingCode,
      patientName: bookings.patientName,
      patientPhone: bookings.patientPhone,
      bookingStatus: bookings.status,
      zoomAllocationMode: bookings.zoomAllocationMode,
      zoomAccountNumber: bookings.zoomAccountNumber,
      zoomJoinUrl: bookings.zoomJoinUrl,
      zoomMeetingId: bookings.zoomMeetingId,
      zoomHostKey: bookings.zoomHostKey,
      breakoutRoomName: bookings.breakoutRoomName,
      operatorAdmittedAt: bookings.operatorAdmittedAt,
      counselorId: counselors.id,
      counselorName: counselors.fullName,
      counselorTitle: counselors.title,
      counselorType: counselors.counselorType,
      slotIndex: schedules.slotIndex,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      scheduleDate: schedules.date,
      zoomAccountName: zoomAccounts.name,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
    .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
    .leftJoin(zoomAccounts, eq(bookings.zoomAccountId, zoomAccounts.id))
    .where(
      and(
        eq(schedules.date, targetDate),
        inArray(bookings.status, ["confirmed", "completed", "pending_payment"])
      )
    )
    .orderBy(asc(schedules.slotIndex), asc(bookings.createdAt))

  const currentSlotIndex = getCurrentSlotIndex()
  const todayWib = getTodayWibDateString()
  const isTargetDateToday = targetDate === todayWib

  let totalSessions = 0
  let totalAdmitted = 0
  let totalPendingAdmit = 0
  let breakoutSlotsCount = 0
  let standaloneSlotsCount = 0

  // 3. Build slot matrix for all 7 standard fixed slots
  const slots: OperatorSlotData[] = FIXED_SLOTS.map((fixedSlot) => {
    // Filter bookings belonging to this slot
    const slotBookings = queryResult.filter(
      (row) => row.slotIndex === fixedSlot.slotIndex
    )

    const sessionCount = slotBookings.length
    const mode = determineSlotMode(sessionCount)

    if (mode === "breakout_room") {
      breakoutSlotsCount++
    } else {
      standaloneSlotsCount++
    }

    const isCurrent = isTargetDateToday && currentSlotIndex === fixedSlot.slotIndex
    let isPast = false
    if (isTargetDateToday && currentSlotIndex !== null) {
      isPast = fixedSlot.slotIndex < currentSlotIndex
    } else if (targetDate < todayWib) {
      isPast = true
    }

    const sessions: OperatorParticipantSession[] = slotBookings.map((b, idx) => {
      const isAdmitted = Boolean(b.operatorAdmittedAt)
      if (isAdmitted) {
        totalAdmitted++
      } else {
        totalPendingAdmit++
      }
      totalSessions++

      // Formatted room name
      const roomName =
        b.breakoutRoomName ||
        formatBreakoutRoomName(b.bookingCode, b.counselorName)

      // Effective Zoom Allocation Mode
      let effectiveMode: "standalone" | "breakout_room" = "standalone"
      if (mode === "breakout_room" && (b.zoomAccountNumber === 4 || idx >= 3)) {
        effectiveMode = "breakout_room"
      } else if (b.zoomAllocationMode === "breakout_room") {
        effectiveMode = "breakout_room"
      }

      return {
        bookingId: b.bookingId,
        bookingCode: b.bookingCode,
        patientName: b.patientName,
        patientPhone: b.patientPhone,
        bookingStatus: b.bookingStatus,
        zoomAllocationMode: effectiveMode,
        zoomAccountNumber: b.zoomAccountNumber || (effectiveMode === "breakout_room" ? 4 : Math.min(idx + 1, 4)),
        zoomAccountName: b.zoomAccountName || `Akun Zoom Pro ${b.zoomAccountNumber || 1}`,
        zoomJoinUrl: b.zoomJoinUrl,
        zoomMeetingId: b.zoomMeetingId,
        zoomHostKey: b.zoomHostKey,
        breakoutRoomName: roomName,
        operatorAdmittedAt: b.operatorAdmittedAt ? new Date(b.operatorAdmittedAt).toISOString() : null,
        counselorId: b.counselorId,
        counselorName: b.counselorName,
        counselorTitle: b.counselorTitle,
        counselorType: b.counselorType,
        slotIndex: b.slotIndex,
        startTime: b.startTime,
        endTime: b.endTime,
        date: b.scheduleDate,
      }
    })

    return {
      slotIndex: fixedSlot.slotIndex,
      startTime: fixedSlot.startTime,
      endTime: fixedSlot.endTime,
      label: fixedSlot.label,
      displayTime: fixedSlot.displayTime,
      sessionCount,
      maxQuota,
      mode,
      isCurrent,
      isPast,
      sessions,
    }
  })

  return {
    date: targetDate,
    formattedDate: formatIndonesianDate(targetDate),
    maxQuota,
    summary: {
      totalSessions,
      totalAdmitted,
      totalPendingAdmit,
      breakoutSlotsCount,
      standaloneSlotsCount,
      currentSlotIndex: isTargetDateToday ? currentSlotIndex : null,
    },
    slots,
  }
}

/**
 * Executes Admit action updating `operator_admitted_at` timestamp in PostgreSQL.
 * Visually transitions participant status in real-time.
 */
export async function admitParticipantAction(input: {
  bookingId: string
}): Promise<{
  success: boolean
  bookingId: string
  admittedAt?: string
  error?: string
}> {
  try {
    const bookingId = input?.bookingId?.trim()
    if (!bookingId) {
      return { success: false, bookingId: "", error: "ID Pemesanan tidak valid" }
    }

    const now = new Date()

    const updated = await db
      .update(bookings)
      .set({
        operatorAdmittedAt: now,
      })
      .where(eq(bookings.id, bookingId))
      .returning({ id: bookings.id, operatorAdmittedAt: bookings.operatorAdmittedAt })

    if (updated.length === 0) {
      return { success: false, bookingId, error: "Pemesanan tidak ditemukan" }
    }

    try {
      revalidatePath("/operator")
    } catch {
      // In unit test runner, revalidatePath is a no-op
    }

    return {
      success: true,
      bookingId,
      admittedAt: now.toISOString(),
    }
  } catch (error: any) {
    return {
      success: false,
      bookingId: input?.bookingId || "",
      error: error?.message || "Gagal memperbarui status admit operator",
    }
  }
}

/**
 * Reverts Admit status back to pending in PostgreSQL (e.g., if clicked accidentally).
 */
export async function unadmitParticipantAction(input: {
  bookingId: string
}): Promise<{
  success: boolean
  bookingId: string
  error?: string
}> {
  try {
    const bookingId = input?.bookingId?.trim()
    if (!bookingId) {
      return { success: false, bookingId: "", error: "ID Pemesanan tidak valid" }
    }

    const updated = await db
      .update(bookings)
      .set({
        operatorAdmittedAt: null,
      })
      .where(eq(bookings.id, bookingId))
      .returning({ id: bookings.id })

    if (updated.length === 0) {
      return { success: false, bookingId, error: "Pemesanan tidak ditemukan" }
    }

    try {
      revalidatePath("/operator")
    } catch {
      // In unit test runner, revalidatePath is a no-op
    }

    return {
      success: true,
      bookingId,
    }
  } catch (error: any) {
    return {
      success: false,
      bookingId: input?.bookingId || "",
      error: error?.message || "Gagal membatalkan status admit",
    }
  }
}
