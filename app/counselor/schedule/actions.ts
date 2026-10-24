"use server"

import { revalidatePath } from "next/cache"
import { eq, and, sql, gte, lte, inArray } from "drizzle-orm"
import { db, type DbClient } from "@/db"
import { schedules, bookings, counselors, counselorWeeklyTemplates } from "@/db/schema"
import { FIXED_SLOTS, type FixedSlot } from "@/lib/schedules/slots"
import {
  MIN_WEEKLY_SLOTS_TARGET,
  CLINIC_BOOKING_CUTOFF_HOURS,
  getWeekDates,
  calculateWeeklyCommitment,
  canCounselorToggleSlot,
  isSlotPastH4Cutoff,
  type WeeklyGridDay,
  type GridSlotCell,
  type WeeklyCommitmentSummary,
  type SlotCellStatus,
} from "@/lib/schedules/commitment"
import {
  toggleScheduleSlotSchema,
  leaveRequestSchema,
  saveCounselorTemplateSchema,
  toggleScheduleModeSchema,
  type ToggleScheduleSlotInput,
  type LeaveRequestInput,
  type SaveCounselorTemplateInput,
  type ToggleScheduleModeInput,
  type TemplateSlotItem,
} from "@/lib/validations/schedules"
import {
  getCounselorTemplateMatrix,
  saveCounselorWeeklyTemplates,
  materializeCounselorSlots,
  type MaterializeResult,
} from "@/lib/schedules/template"
import { getAuthenticatedCounselor, resolveCounselorId } from "@/lib/counselor/auth"
import type { CounselorAuthContext } from "@/lib/counselor/types"
import { getNowWIB } from "@/lib/schedules/concurrency"

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // Safely ignore when called outside active Next.js request context (e.g. Vitest)
  }
}

export interface CounselorWeeklyGridData {
  weekDates: WeeklyGridDay[]
  fixedSlots: FixedSlot[]
  grid: Record<number, Record<string, GridSlotCell>> // [slotIndex][dateStr]
  commitment: WeeklyCommitmentSummary
  counselorName: string
  counselorTitle: string
}

/**
 * Server Action: Fetch the complete 7-day weekly grid across the 7 fixed 2-hour slots
 * for the authenticated counselor.
 */
export async function getCounselorWeeklyGridAction(
  referenceDate?: string,
  options?: {
    currentUser?: CounselorAuthContext | null
    getSchedules?: (counselorId: string, startDate: string, endDate: string) => Promise<any[]>
    getCounselor?: (counselorId: string) => Promise<any>
    now?: Date
  }
): Promise<ActionResponse<CounselorWeeklyGridData>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return {
      success: false,
      error: "Profil mitra konselor tidak ditemukan.",
    }
  }

  try {
    const now = options?.now || new Date()
    const weekDays = getWeekDates(referenceDate || now, now)
    const startDate = weekDays[0].date
    const endDate = weekDays[6].date

    // 1. Fetch counselor profile info
    let counselorName = auth.user_metadata?.full_name || "Mitra Konselor"
    let counselorTitle = "Konselor Solulu"

    if (options?.getCounselor) {
      const c = await options.getCounselor(counselorId)
      if (c) {
        counselorName = c.fullName || counselorName
        counselorTitle = c.title || counselorTitle
      }
    } else {
      const cRows = await db
        .select({
          fullName: counselors.fullName,
          title: counselors.title,
        })
        .from(counselors)
        .where(eq(counselors.id, counselorId))
        .limit(1)

      if (cRows.length > 0) {
        counselorName = cRows[0].fullName
        counselorTitle = cRows[0].title
      }
    }

    // 2. Query schedules in the 7-day range
    let rows: any[] = []
    if (options?.getSchedules) {
      rows = await options.getSchedules(counselorId, startDate, endDate)
    } else {
      const weekDateStrings = weekDays.map((d) => d.date)
      rows = await db
        .select({
          schedule: schedules,
          booking: {
            id: bookings.id,
            patientName: bookings.patientName,
            bookingCode: bookings.bookingCode,
            status: bookings.status,
          },
        })
        .from(schedules)
        .leftJoin(
          bookings,
          and(
            eq(bookings.scheduleId, schedules.id),
            sql`${bookings.status} != 'cancelled'`
          )
        )
        .where(
          and(
            eq(schedules.counselorId, counselorId),
            gte(schedules.date, startDate),
            lte(schedules.date, endDate)
          )
        )
    }

    // 3. Map schedule rows by slotIndex and date
    const scheduleMap = new Map<string, any>()
    for (const r of rows) {
      const s = r.schedule || r
      const b = r.booking || null
      const key = `${s.slotIndex}_${s.date}`
      scheduleMap.set(key, { ...s, booking: b })
    }

    // 4. Construct full 7x7 grid
    const grid: Record<number, Record<string, GridSlotCell>> = {}
    const activeSlotsForCommitment: Array<{ status: string; isLeave?: boolean; date: string }> = []

    for (const slot of FIXED_SLOTS) {
      grid[slot.slotIndex] = {}

      for (const day of weekDays) {
        const key = `${slot.slotIndex}_${day.date}`
        const existing = scheduleMap.get(key)

        const isPastSlot = isSlotPastH4Cutoff(day.date, slot.startTime, now, 0)
        const isWithinH4 = isSlotPastH4Cutoff(day.date, slot.startTime, now, CLINIC_BOOKING_CUTOFF_HOURS)

        if (existing) {
          const hasBooking = Boolean(existing.booking?.id)
          let cellStatus: SlotCellStatus = existing.status as SlotCellStatus
          if (hasBooking) {
            cellStatus = "booked"
          } else if (existing.isLeave) {
            cellStatus = "cancelled"
          }

          const toggleGuard = canCounselorToggleSlot(cellStatus, existing.isLeave, isPastSlot)

          const cell: GridSlotCell = {
            scheduleId: existing.id,
            slotIndex: slot.slotIndex,
            date: day.date,
            startTime: existing.startTime || slot.startTime,
            endTime: existing.endTime || slot.endTime,
            displayTime: slot.displayTime,
            status: cellStatus,
            isLeave: Boolean(existing.isLeave),
            leaveReason: existing.leaveReason,
            isPast: isPastSlot,
            isWithinH4,
            canToggle: toggleGuard.canToggle,
            toggleDisabledReason: toggleGuard.reason,
            patientName: existing.booking?.patientName,
            bookingCode: existing.booking?.bookingCode,
            bookingStatus: existing.booking?.status,
          }

          grid[slot.slotIndex][day.date] = cell

          if (!cell.isLeave && (cell.status === "available" || cell.status === "reserved" || cell.status === "booked")) {
            activeSlotsForCommitment.push({
              status: cell.status,
              isLeave: cell.isLeave,
              date: day.date,
            })
          }
        } else {
          // Unopened slot
          const cell: GridSlotCell = {
            slotIndex: slot.slotIndex,
            date: day.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            displayTime: slot.displayTime,
            status: "unopened",
            isLeave: false,
            isPast: isPastSlot,
            isWithinH4,
            canToggle: !isPastSlot,
            toggleDisabledReason: isPastSlot ? "Slot sudah terlewat" : undefined,
          }

          grid[slot.slotIndex][day.date] = cell
        }
      }
    }

    // 5. Calculate weekly quota commitment metrics
    const commitment = calculateWeeklyCommitment(activeSlotsForCommitment, MIN_WEEKLY_SLOTS_TARGET)

    return {
      success: true,
      data: {
        weekDates: weekDays,
        fixedSlots: FIXED_SLOTS,
        grid,
        commitment,
        counselorName,
        counselorTitle,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memuat matriks jadwal mingguan konselor.",
    }
  }
}

/**
 * Server Action: Toggle slot availability on/off with instant PostgreSQL persistence.
 * Prevents toggling off slots that are already booked or in reserved hold.
 */
export async function toggleSlotAvailabilityAction(
  rawInput: ToggleScheduleSlotInput,
  options?: {
    currentUser?: CounselorAuthContext | null
    getSlot?: (counselorId: string, date: string, slotIndex: number) => Promise<any>
    insertSlot?: (slot: any) => Promise<any>
    updateSlot?: (id: string, updates: any) => Promise<any>
    now?: Date
  }
): Promise<ActionResponse<{ scheduleId: string; status: SlotCellStatus; isLeave: boolean }>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  const parsed = toggleScheduleSlotSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "Data slot tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { date, slotIndex } = parsed.data
  const fixedSlot = FIXED_SLOTS.find((s) => s.slotIndex === slotIndex)
  if (!fixedSlot) {
    return {
      success: false,
      error: "Slot index tidak valid (harus 1 sampai 7).",
    }
  }

  const now = options?.now || new Date()
  const isPast = isSlotPastH4Cutoff(date, fixedSlot.startTime, now, 0)
  if (isPast) {
    return {
      success: false,
      error: "Tidak dapat membuka atau mengubah slot jadwal yang sudah terlewat.",
    }
  }

  try {
    const counselorId = await resolveCounselorId(auth)
    if (!counselorId) {
      return {
        success: false,
        error: "Profil mitra konselor tidak ditemukan.",
      }
    }

    // 1. Fetch existing slot record
    let existing: any = null
    if (options?.getSlot) {
      existing = await options.getSlot(counselorId, date, slotIndex)
    } else {
      const found = await db
        .select({
          schedule: schedules,
          booking: {
            id: bookings.id,
            status: bookings.status,
          },
        })
        .from(schedules)
        .leftJoin(
          bookings,
          and(
            eq(bookings.scheduleId, schedules.id),
            sql`${bookings.status} != 'cancelled'`
          )
        )
        .where(
          and(
            eq(schedules.counselorId, counselorId),
            eq(schedules.date, date),
            eq(schedules.slotIndex, slotIndex)
          )
        )
        .limit(1)

      if (found.length > 0) {
        existing = {
          ...found[0].schedule,
          booking: found[0].booking,
        }
      }
    }

    // 2. Perform Toggle Logic
    if (existing) {
      // Guard against booked or reserved slots
      if (existing.booking?.id || existing.status === "booked") {
        return {
          success: false,
          error: "Slot ini sudah dipesan oleh klien dan tidak dapat dinonaktifkan langsung. Silakan hubungi admin operasional untuk bantuan penjadwalan ulang.",
        }
      }

      if (existing.status === "reserved") {
        return {
          success: false,
          error: "Slot ini sedang dalam hold proses pembayaran klien dan tidak dapat dinonaktifkan.",
        }
      }

      // If available and not leave -> toggle OFF (cancelled)
      if (existing.status === "available" && !existing.isLeave) {
        if (options?.updateSlot) {
          await options.updateSlot(existing.id, { status: "cancelled" })
        } else {
          await db
            .update(schedules)
            .set({ status: "cancelled" })
            .where(eq(schedules.id, existing.id))
        }

        safeRevalidatePath("/counselor/schedule")
        safeRevalidatePath("/counselor/schedules")
        safeRevalidatePath("/counselors")

        return {
          success: true,
          data: {
            scheduleId: existing.id,
            status: "cancelled",
            isLeave: false,
          },
        }
      }

      // If cancelled or leave -> toggle ON (available)
      if (options?.updateSlot) {
        await options.updateSlot(existing.id, {
          status: "available",
          isLeave: false,
          leaveReason: null,
        })
      } else {
        await db
          .update(schedules)
          .set({
            status: "available",
            isLeave: false,
            leaveReason: null,
          })
          .where(eq(schedules.id, existing.id))
      }

      safeRevalidatePath("/counselor/schedule")
      safeRevalidatePath("/counselor/schedules")
      safeRevalidatePath("/counselors")

      return {
        success: true,
        data: {
          scheduleId: existing.id,
          status: "available",
          isLeave: false,
        },
      }
    }

    // 3. Slot does not exist -> insert as available
    const newRecord = {
      counselorId,
      date,
      slotIndex,
      startTime: fixedSlot.startTime,
      endTime: fixedSlot.endTime,
      status: "available" as const,
      isLeave: false,
      leaveReason: null,
    }

    let inserted: any = null
    if (options?.insertSlot) {
      inserted = await options.insertSlot(newRecord)
    } else {
      const rows = await db.insert(schedules).values(newRecord).returning()
      inserted = rows[0]
    }

    safeRevalidatePath("/counselor/schedule")
    safeRevalidatePath("/counselor/schedules")
    safeRevalidatePath("/counselors")

    return {
      success: true,
      data: {
        scheduleId: inserted.id,
        status: "available",
        isLeave: false,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui ketersediaan slot jadwal.",
    }
  }
}

/**
 * Server Action: Submit leave/permission request.
 * Updates or creates schedule entries with `is_leave: true` and `leave_reason`.
 */
export async function submitLeaveRequestAction(
  rawInput: LeaveRequestInput,
  options?: {
    currentUser?: CounselorAuthContext | null
    getExistingSlotsInRange?: (counselorId: string, startDate: string, endDate: string) => Promise<any[]>
    saveLeaveSlots?: (records: any[]) => Promise<any>
    now?: Date
  }
): Promise<ActionResponse<{ affectedDays: number; affectedSlots: number }>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  const parsed = leaveRequestSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "Formulir pengajuan cuti tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { startDate, endDate, leaveReason, slotIndices } = parsed.data

  const now = options?.now || new Date()
  const todayWIB = getNowWIB(now).dateStr
  if (startDate < todayWIB) {
    return {
      success: false,
      error: "Tanggal mulai cuti tidak boleh pada tanggal yang sudah terlewat.",
    }
  }

  try {
    const counselorId = await resolveCounselorId(auth)
    if (!counselorId) {
      return {
        success: false,
        error: "Profil mitra konselor tidak ditemukan.",
      }
    }

    // 1. Generate list of dates in the range
    const dates: string[] = []
    const cur = new Date(`${startDate}T00:00:00+07:00`)
    const end = new Date(`${endDate}T00:00:00+07:00`)

    while (cur <= end) {
      const year = cur.getFullYear()
      const month = String(cur.getMonth() + 1).padStart(2, "0")
      const day = String(cur.getDate()).padStart(2, "0")
      dates.push(`${year}-${month}-${day}`)
      cur.setDate(cur.getDate() + 1)
    }

    // 2. Determine target slot indices (default: all 7 fixed slots)
    const targetSlots = slotIndices && slotIndices.length > 0 ? slotIndices : [1, 2, 3, 4, 5, 6, 7]

    // 3. Fetch existing slots in range to avoid breaking existing confirmed bookings
    let existingSlots: any[] = []
    if (options?.getExistingSlotsInRange) {
      existingSlots = await options.getExistingSlotsInRange(counselorId, startDate, endDate)
    } else {
      existingSlots = await db
        .select({
          schedule: schedules,
          booking: {
            id: bookings.id,
            status: bookings.status,
          },
        })
        .from(schedules)
        .leftJoin(
          bookings,
          and(
            eq(bookings.scheduleId, schedules.id),
            sql`${bookings.status} != 'cancelled'`
          )
        )
        .where(
          and(
            eq(schedules.counselorId, counselorId),
            gte(schedules.date, startDate),
            lte(schedules.date, endDate)
          )
        )
    }

    const existingMap = new Map<string, any>()
    for (const r of existingSlots) {
      const s = r.schedule || r
      const b = r.booking || null
      existingMap.set(`${s.slotIndex}_${s.date}`, { ...s, booking: b })
    }

    let affectedSlotsCount = 0

    // 4. Update or insert leave entries
    for (const dateStr of dates) {
      for (const sIndex of targetSlots) {
        const fixed = FIXED_SLOTS.find((s) => s.slotIndex === sIndex)
        if (!fixed) continue

        const key = `${sIndex}_${dateStr}`
        const existing = existingMap.get(key)

        // If slot is already booked, we do NOT overwrite client booking with uncoordinated leave
        if (existing?.booking?.id || existing?.status === "booked") {
          continue
        }

        if (existing) {
          if (options?.saveLeaveSlots) {
            await options.saveLeaveSlots([{ id: existing.id, isLeave: true, leaveReason }])
          } else {
            await db
              .update(schedules)
              .set({
                isLeave: true,
                leaveReason,
                status: "cancelled",
              })
              .where(eq(schedules.id, existing.id))
          }
          affectedSlotsCount++
        } else {
          // Insert new record as leave
          const record = {
            counselorId,
            date: dateStr,
            slotIndex: sIndex,
            startTime: fixed.startTime,
            endTime: fixed.endTime,
            status: "cancelled" as const,
            isLeave: true,
            leaveReason,
          }

          if (options?.saveLeaveSlots) {
            await options.saveLeaveSlots([record])
          } else {
            await db.insert(schedules).values(record)
          }
          affectedSlotsCount++
        }
      }
    }

    safeRevalidatePath("/counselor/schedule")
    safeRevalidatePath("/counselor/schedules")
    safeRevalidatePath("/counselors")

    return {
      success: true,
      data: {
        affectedDays: dates.length,
        affectedSlots: affectedSlotsCount,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memproses pengajuan izin/cuti praktik.",
    }
  }
}

/**
 * Server Action: Cancel leave on a specific schedule slot.
 */
export async function cancelSlotLeaveAction(
  scheduleId: string,
  options?: {
    currentUser?: CounselorAuthContext | null
    updateSlot?: (id: string, updates: any) => Promise<any>
  }
): Promise<ActionResponse<{ scheduleId: string }>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  try {
    if (options?.updateSlot) {
      await options.updateSlot(scheduleId, {
        isLeave: false,
        leaveReason: null,
        status: "available",
      })
    } else {
      await db
        .update(schedules)
        .set({
          isLeave: false,
          leaveReason: null,
          status: "available",
        })
        .where(eq(schedules.id, scheduleId))
    }

    safeRevalidatePath("/counselor/schedule")
    safeRevalidatePath("/counselor/schedules")
    safeRevalidatePath("/counselors")

    return {
      success: true,
      data: { scheduleId },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal membatalkan status cuti pada slot ini.",
    }
  }
}

// =============================================================================
// RECURRING SCHEDULE TEMPLATE SERVER ACTIONS
// =============================================================================

export interface CounselorTemplateSlotCell {
  dayOfWeek: number // 1 (Senin) .. 7 (Minggu)
  dayName: string // "Senin", "Selasa", ..., "Minggu"
  dayShort: string // "Sen", "Sel", ..., "Min"
  slotIndex: number // 1 .. 7
  startTime: string // "08:00:00"
  endTime: string // "10:00:00"
  displayTime: string // "08.00 – 10.00 WIB"
  isActive: boolean
}

export interface CounselorTemplateDayInfo {
  dayOfWeek: number // 1 (Senin) .. 7 (Minggu)
  dayName: string
  dayShort: string
}

export const TEMPLATE_DAYS: CounselorTemplateDayInfo[] = [
  { dayOfWeek: 1, dayName: "Senin", dayShort: "Sen" },
  { dayOfWeek: 2, dayName: "Selasa", dayShort: "Sel" },
  { dayOfWeek: 3, dayName: "Rabu", dayShort: "Rab" },
  { dayOfWeek: 4, dayName: "Kamis", dayShort: "Kam" },
  { dayOfWeek: 5, dayName: "Jumat", dayShort: "Jum" },
  { dayOfWeek: 6, dayName: "Sabtu", dayShort: "Sab" },
  { dayOfWeek: 7, dayName: "Minggu", dayShort: "Min" },
]

export interface CounselorTemplateData {
  counselorId: string
  counselorName: string
  counselorTitle: string
  scheduleMode: "manual" | "automatic"
  weeklySlotTarget: number
  activeCount: number
  isTargetMet: boolean
  remainingSlots: number
  percentage: number
  matrix: Record<number, Record<number, boolean>> // [dayOfWeek][slotIndex] -> isActive
  slots: CounselorTemplateSlotCell[]
  fixedSlots: FixedSlot[]
  days: CounselorTemplateDayInfo[]
}

/**
 * Server Action: Fetch the complete recurring schedule blueprint template for the authenticated counselor.
 * Returns the 7x7 matrix (7 days x 7 fixed slots), active slot count, target metrics, and schedule mode.
 */
export async function getCounselorTemplateAction(
  options?: {
    currentUser?: CounselorAuthContext | null
    dbClient?: DbClient
  }
): Promise<ActionResponse<CounselorTemplateData>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return {
      success: false,
      error: "Profil mitra konselor tidak ditemukan.",
    }
  }

  try {
    const client = options?.dbClient || db

    // 1. Fetch counselor profile info & schedule mode
    const counselorRows = await client
      .select({
        id: counselors.id,
        fullName: counselors.fullName,
        title: counselors.title,
        scheduleMode: counselors.scheduleMode,
        weeklySlotTarget: counselors.weeklySlotTarget,
      })
      .from(counselors)
      .where(eq(counselors.id, counselorId))
      .limit(1)

    if (counselorRows.length === 0) {
      return {
        success: false,
        error: "Data profil mitra konselor tidak ditemukan di sistem.",
      }
    }

    const counselor = counselorRows[0]
    const target = counselor.weeklySlotTarget || MIN_WEEKLY_SLOTS_TARGET
    const scheduleMode = counselor.scheduleMode || "manual"

    // 2. Fetch template matrix from counselor_weekly_templates
    const { activeCount, matrix } = await getCounselorTemplateMatrix(counselorId, client)

    // 3. Build comprehensive list of 49 slot cells (7 days x 7 slots)
    const slots: CounselorTemplateSlotCell[] = []
    for (const day of TEMPLATE_DAYS) {
      for (const fixed of FIXED_SLOTS) {
        const isActive = matrix[day.dayOfWeek]?.[fixed.slotIndex] ?? false
        slots.push({
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          dayShort: day.dayShort,
          slotIndex: fixed.slotIndex,
          startTime: fixed.startTime,
          endTime: fixed.endTime,
          displayTime: fixed.displayTime,
          isActive,
        })
      }
    }

    const isTargetMet = activeCount >= target
    const remainingSlots = Math.max(0, target - activeCount)
    const percentage = Math.min(100, Math.round((activeCount / target) * 100))

    return {
      success: true,
      data: {
        counselorId,
        counselorName: counselor.fullName || auth.user_metadata?.full_name || "Mitra Konselor",
        counselorTitle: counselor.title || "Konselor Solulu",
        scheduleMode,
        weeklySlotTarget: target,
        activeCount,
        isTargetMet,
        remainingSlots,
        percentage,
        matrix,
        slots,
        fixedSlots: FIXED_SLOTS,
        days: TEMPLATE_DAYS,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memuat data template jadwal konselor.",
    }
  }
}

/**
 * Server Action: Save the counselor's recurring weekly blueprint slots.
 * Validates with Zod: strictly enforces minimum commitment of 10 active slots if automatic mode is active.
 * When saved with automatic mode active, immediately synchronizes physical schedule slots for the next 4 weeks.
 * Revalidates cache for /counselor/schedule, /counselor/schedules, and /counselors.
 */
export async function saveCounselorTemplateAction(
  rawInput: SaveCounselorTemplateInput,
  options?: {
    currentUser?: CounselorAuthContext | null
    referenceDate?: Date | string
    dbClient?: DbClient
  }
): Promise<ActionResponse<{
  activeCount: number
  scheduleMode: "manual" | "automatic"
  materialized?: MaterializeResult
}>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return {
      success: false,
      error: "Profil mitra konselor tidak ditemukan.",
    }
  }

  // 1. Zod input validation
  const parsed = saveCounselorTemplateSchema.safeParse(rawInput)
  if (!parsed.success) {
    const primaryError = parsed.error.issues[0]?.message || "Validasi template jadwal tidak valid."
    return {
      success: false,
      error: primaryError,
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const client = options?.dbClient || db

    // 2. Fetch current counselor profile & schedule mode
    const counselorRows = await client
      .select({
        id: counselors.id,
        scheduleMode: counselors.scheduleMode,
        weeklySlotTarget: counselors.weeklySlotTarget,
      })
      .from(counselors)
      .where(eq(counselors.id, counselorId))
      .limit(1)

    if (counselorRows.length === 0) {
      return {
        success: false,
        error: "Profil mitra konselor tidak ditemukan di sistem.",
      }
    }

    const currentCounselor = counselorRows[0]
    const effectiveScheduleMode = parsed.data.scheduleMode || currentCounselor.scheduleMode

    // 3. Compute projected active slots across the entire 7x7 matrix
    const currentTemplate = await getCounselorTemplateMatrix(counselorId, client)
    const mergedActiveMap = new Map<string, boolean>()

    for (let d = 1; d <= 7; d++) {
      for (let s = 1; s <= 7; s++) {
        mergedActiveMap.set(`${d}_${s}`, currentTemplate.matrix[d]?.[s] ?? false)
      }
    }

    for (const item of parsed.data.slots) {
      mergedActiveMap.set(`${item.dayOfWeek}_${item.slotIndex}`, item.isActive)
    }

    let projectedActiveCount = 0
    for (const isActive of mergedActiveMap.values()) {
      if (isActive) projectedActiveCount++
    }

    // 4. Strict Quota Guardrail for Automatic Mode:
    // Minimum 10 slots commitment required if saving with or in automatic mode.
    if (effectiveScheduleMode === "automatic" && projectedActiveCount < MIN_WEEKLY_SLOTS_TARGET) {
      return {
        success: false,
        error: `Mode otomatis membutuhkan komitmen minimal ${MIN_WEEKLY_SLOTS_TARGET} slot aktif per minggu. Saat ini hanya memilih ${projectedActiveCount} slot aktif. Silakan tambahkan slot praktik rutin Anda.`,
      }
    }

    // 5. Save weekly template slots in PostgreSQL
    const { activeCount } = await saveCounselorWeeklyTemplates(counselorId, parsed.data.slots, client)

    // 6. Update counselor scheduleMode if provided and changed
    if (parsed.data.scheduleMode && parsed.data.scheduleMode !== currentCounselor.scheduleMode) {
      await client
        .update(counselors)
        .set({ scheduleMode: parsed.data.scheduleMode })
        .where(eq(counselors.id, counselorId))
    }

    // 7. If automatic mode is active, trigger immediate 4-week rolling materialization
    let materialized: MaterializeResult | undefined
    if (effectiveScheduleMode === "automatic") {
      materialized = await materializeCounselorSlots(counselorId, 4, {
        referenceDate: options?.referenceDate,
        dbClient: client,
      })
    }

    // 8. Revalidate paths
    safeRevalidatePath("/counselor/schedule")
    safeRevalidatePath("/counselor/schedules")
    safeRevalidatePath("/counselors")

    return {
      success: true,
      data: {
        activeCount,
        scheduleMode: effectiveScheduleMode,
        materialized,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menyimpan cetak biru template jadwal konselor.",
    }
  }
}

/**
 * Server Action: Toggle between 'manual' and 'automatic' schedule modes for the authenticated counselor.
 * When switching to 'automatic', enforces minimum 10 active slots requirement and immediately materializes 4 weeks ahead.
 * When switching to 'manual', existing future slots in PostgreSQL are strictly retained and preserved.
 * Revalidates cache for /counselor/schedule, /counselor/schedules, and /counselors.
 */
export async function toggleScheduleModeAction(
  rawInput: ToggleScheduleModeInput,
  options?: {
    currentUser?: CounselorAuthContext | null
    referenceDate?: Date | string
    dbClient?: DbClient
  }
): Promise<ActionResponse<{
  scheduleMode: "manual" | "automatic"
  activeCount: number
  materialized?: MaterializeResult
}>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) {
    return {
      success: false,
      error: "Profil mitra konselor tidak ditemukan.",
    }
  }

  const parsed = toggleScheduleModeSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "Mode jadwal tidak valid. Pilihan yang tersedia adalah 'manual' atau 'automatic'.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const targetMode = parsed.data.scheduleMode

  try {
    const client = options?.dbClient || db

    // 1. Fetch current counselor profile & weekly template active count
    const counselorRows = await client
      .select({
        id: counselors.id,
        scheduleMode: counselors.scheduleMode,
      })
      .from(counselors)
      .where(eq(counselors.id, counselorId))
      .limit(1)

    if (counselorRows.length === 0) {
      return {
        success: false,
        error: "Profil mitra konselor tidak ditemukan di sistem.",
      }
    }

    const { activeCount } = await getCounselorTemplateMatrix(counselorId, client)

    // 2. Guard: Cannot activate automatic mode if active slots < 10
    if (targetMode === "automatic" && activeCount < MIN_WEEKLY_SLOTS_TARGET) {
      return {
        success: false,
        error: `Tidak dapat mengaktifkan mode otomatis. Anda harus memilih minimal ${MIN_WEEKLY_SLOTS_TARGET} slot aktif pada template mingguan terlebih dahulu (saat ini ${activeCount} slot aktif).`,
      }
    }

    // 3. Update scheduleMode in counselors table
    await client
      .update(counselors)
      .set({ scheduleMode: targetMode })
      .where(eq(counselors.id, counselorId))

    // 4. If switching to automatic, trigger immediate 4-week rolling materialization
    let materialized: MaterializeResult | undefined
    if (targetMode === "automatic") {
      materialized = await materializeCounselorSlots(counselorId, 4, {
        referenceDate: options?.referenceDate,
        dbClient: client,
      })
    }
    // Note: When switching to 'manual', future slots already created in PostgreSQL
    // are strictly retained without any deletion or cancellation, preserving client bookings and counselor visibility.

    // 5. Revalidate Next.js cache
    safeRevalidatePath("/counselor/schedule")
    safeRevalidatePath("/counselor/schedules")
    safeRevalidatePath("/counselors")

    return {
      success: true,
      data: {
        scheduleMode: targetMode,
        activeCount,
        materialized,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengubah mode pengisian jadwal.",
    }
  }
}

