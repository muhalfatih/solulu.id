import { eq, and, gte, lte, inArray, sql, ne } from "drizzle-orm"
import { db, type DbClient } from "@/db"
import {
  counselorWeeklyTemplates,
  schedules,
  bookings,
  counselors,
  type CounselorWeeklyTemplate,
  type ScheduleMode,
} from "@/db/schema"
import { FIXED_SLOTS, isSlotInPast } from "@/lib/schedules/slots"

export interface MaterializeOptions {
  referenceDate?: Date | string
  dbClient?: DbClient
}

export interface MaterializeResult {
  success: boolean
  counselorId: string
  weeksAhead: number
  startDate: string
  endDate: string
  createdCount: number
  updatedCount: number
  preservedBookedCount: number
  preservedLeaveCount: number
  cancelledCount: number
  totalProcessedDays: number
}

export { TEMPLATE_DAYS, type CounselorTemplateDayInfo } from "@/lib/schedules/slots"

/**
 * Returns year, month, day, and formatted YYYY-MM-DD date string in Asia/Jakarta (WIB).
 */
export function getWIBDate(d: Date | string = new Date()): {
  year: number
  month: number
  day: number
  dateStr: string
} {
  const dateObj =
    typeof d === "string"
      ? new Date(d.includes("T") ? d : `${d}T12:00:00+07:00`)
      : d
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const dateStr = formatter.format(dateObj)
  const [year, month, day] = dateStr.split("-").map(Number)
  return { year, month, day, dateStr }
}

/**
 * Calculates the Monday of the week (YYYY-MM-DD) for a reference date in WIB timezone.
 */
export function getMondayOfWIBWeek(referenceDate: Date | string = new Date()): string {
  const { year, month, day } = getWIBDate(referenceDate)
  const midDay = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const dayOfWeek = midDay.getUTCDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(Date.UTC(year, month - 1, day + diffToMonday, 12, 0, 0))
  return monday.toISOString().slice(0, 10)
}

/**
 * Generates an array of dates and their corresponding day_of_week (1 = Senin .. 7 = Minggu)
 * for a rolling window of weeksAhead (default 4 weeks = 28 days) starting from Monday of referenceDate.
 */
export function getMaterializationDates(
  referenceDate: Date | string = new Date(),
  weeksAhead: number = 4
): {
  dates: Array<{ date: string; dayOfWeek: number }>
  startDate: string
  endDate: string
} {
  const mondayStr = getMondayOfWIBWeek(referenceDate)
  const [mYear, mMonth, mDay] = mondayStr.split("-").map(Number)

  const totalDays = weeksAhead * 7
  const dates: Array<{ date: string; dayOfWeek: number }> = []

  for (let i = 0; i < totalDays; i++) {
    const curDate = new Date(Date.UTC(mYear, mMonth - 1, mDay + i, 12, 0, 0))
    const dateStr = curDate.toISOString().slice(0, 10)
    const utcDay = curDate.getUTCDay() // 0 = Sunday, 1 = Monday ... 6 = Saturday
    const dayOfWeek = utcDay === 0 ? 7 : utcDay // 1 (Senin) .. 7 (Minggu)
    dates.push({ date: dateStr, dayOfWeek })
  }

  return {
    dates,
    startDate: dates[0].date,
    endDate: dates[dates.length - 1].date,
  }
}

/**
 * Synchronizes and materializes physical schedule rows in PostgreSQL for a 4-week
 * rolling window according to the counselor's active recurring weekly template.
 *
 * Guarantees:
 * 1. Booking Protection: Slots with status 'booked', 'reserved', or active non-cancelled bookings are never overwritten or deleted.
 * 2. Leave Priority: Slots on dates with is_leave: true are strictly preserved and never reopened to 'available'.
 * 3. Idempotent: Can be called repeatedly (by save action, toggle, or cron) without generating duplicates.
 * 4. Past Guard: Past slots/dates are never modified or newly created.
 */
export async function materializeCounselorSlots(
  counselorId: string,
  weeksAhead: number = 4,
  options?: MaterializeOptions
): Promise<MaterializeResult> {
  const client = options?.dbClient || db
  const refDate = options?.referenceDate
    ? typeof options.referenceDate === "string"
      ? new Date(
          options.referenceDate.includes("T")
            ? options.referenceDate
            : `${options.referenceDate}T00:00:00+07:00`
        )
      : options.referenceDate
    : new Date()

  // 1. Fetch active recurring template slots for this counselor
  const templateRows = await client
    .select()
    .from(counselorWeeklyTemplates)
    .where(
      and(
        eq(counselorWeeklyTemplates.counselorId, counselorId),
        eq(counselorWeeklyTemplates.isActive, true)
      )
    )

  const activeTemplateMap = new Set<string>()
  for (const row of templateRows) {
    activeTemplateMap.add(`${row.dayOfWeek}_${row.slotIndex}`)
  }

  // 2. Compute date window (e.g. 28 days for 4 weeks)
  const { dates, startDate, endDate } = getMaterializationDates(refDate, weeksAhead)

  // 3. Fetch existing schedules and non-cancelled bookings in this date window
  const existingRows = await client
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
        ne(bookings.status, "cancelled")
      )
    )
    .where(
      and(
        eq(schedules.counselorId, counselorId),
        gte(schedules.date, startDate),
        lte(schedules.date, endDate)
      )
    )

  interface ExistingScheduleEntry {
    id: string
    date: string
    slotIndex: number
    startTime: string
    endTime: string
    status: string
    isLeave: boolean
    leaveReason: string | null
    hasBooking: boolean
  }

  const existingMap = new Map<string, ExistingScheduleEntry>()
  for (const r of existingRows) {
    const s = r.schedule
    const key = `${s.date}_${s.slotIndex}`
    const existingEntry = existingMap.get(key)
    const hasActiveBooking = Boolean(r.booking?.id) || s.status === "booked" || s.status === "reserved"

    if (!existingEntry) {
      existingMap.set(key, {
        id: s.id,
        date: s.date,
        slotIndex: s.slotIndex,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        isLeave: Boolean(s.isLeave),
        leaveReason: s.leaveReason,
        hasBooking: hasActiveBooking,
      })
    } else if (hasActiveBooking) {
      existingEntry.hasBooking = true
    }
  }

  const toInsert: Array<{
    counselorId: string
    date: string
    slotIndex: number
    startTime: string
    endTime: string
    status: "available"
    isLeave: boolean
  }> = []

  const toReactivate: string[] = []
  const toCancel: string[] = []

  let createdCount = 0
  let updatedCount = 0
  let preservedBookedCount = 0
  let preservedLeaveCount = 0
  let cancelledCount = 0

  // 4. Iterate through every date and every fixed slot in the window
  for (const day of dates) {
    for (const slot of FIXED_SLOTS) {
      const templateKey = `${day.dayOfWeek}_${slot.slotIndex}`
      const isTemplateActive = activeTemplateMap.has(templateKey)
      const slotKey = `${day.date}_${slot.slotIndex}`
      const existing = existingMap.get(slotKey)

      // Past check: never modify or create past slots
      const isPast = isSlotInPast(day.date, slot.startTime, refDate)
      if (isPast) {
        continue
      }

      if (isTemplateActive) {
        if (!existing) {
          // Slot does not exist -> Create as available
          toInsert.push({
            counselorId,
            date: day.date,
            slotIndex: slot.slotIndex,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: "available",
            isLeave: false,
          })
          createdCount++
        } else {
          // Existing slot exists
          if (existing.isLeave) {
            // Guard: Leave record takes precedence over template
            preservedLeaveCount++
          } else if (existing.hasBooking || existing.status === "booked" || existing.status === "reserved") {
            // Guard: Client booked/reserved sessions strictly protected
            preservedBookedCount++
          } else if (existing.status === "cancelled") {
            // Re-activate previously cancelled slot to match active template
            toReactivate.push(existing.id)
            updatedCount++
          } else if (existing.status === "available") {
            // Already available and active, no action needed
          }
        }
      } else {
        // Slot is NOT active in template
        if (existing) {
          if (existing.isLeave) {
            preservedLeaveCount++
          } else if (existing.hasBooking || existing.status === "booked" || existing.status === "reserved") {
            preservedBookedCount++
          } else if (existing.status === "available") {
            // Unbooked future slot removed from template -> safely cancel
            toCancel.push(existing.id)
            cancelledCount++
          }
        }
      }
    }
  }

  // 5. Execute DB batch updates/inserts in a transaction
  if (toInsert.length > 0 || toReactivate.length > 0 || toCancel.length > 0) {
    await client.transaction(async (tx) => {
      if (toInsert.length > 0) {
        // Chunk inserts to avoid query parameter limits
        const chunkSize = 100
        for (let i = 0; i < toInsert.length; i += chunkSize) {
          const chunk = toInsert.slice(i, i + chunkSize)
          await tx.insert(schedules).values(chunk)
        }
      }

      if (toReactivate.length > 0) {
        const chunkSize = 100
        for (let i = 0; i < toReactivate.length; i += chunkSize) {
          const chunk = toReactivate.slice(i, i + chunkSize)
          await tx
            .update(schedules)
            .set({ status: "available" })
            .where(inArray(schedules.id, chunk))
        }
      }

      if (toCancel.length > 0) {
        const chunkSize = 100
        for (let i = 0; i < toCancel.length; i += chunkSize) {
          const chunk = toCancel.slice(i, i + chunkSize)
          await tx
            .update(schedules)
            .set({ status: "cancelled" })
            .where(inArray(schedules.id, chunk))
        }
      }
    })
  }

  return {
    success: true,
    counselorId,
    weeksAhead,
    startDate,
    endDate,
    createdCount,
    updatedCount,
    preservedBookedCount,
    preservedLeaveCount,
    cancelledCount,
    totalProcessedDays: dates.length,
  }
}

/**
 * Fetches counselor's template records as a 7x7 matrix.
 */
export async function getCounselorTemplateMatrix(
  counselorId: string,
  client: DbClient = db
): Promise<{
  activeCount: number
  matrix: Record<number, Record<number, boolean>> // [dayOfWeek][slotIndex] -> isActive
}> {
  const rows = await client
    .select()
    .from(counselorWeeklyTemplates)
    .where(eq(counselorWeeklyTemplates.counselorId, counselorId))

  const matrix: Record<number, Record<number, boolean>> = {}
  for (let day = 1; day <= 7; day++) {
    matrix[day] = {}
    for (let slot = 1; slot <= 7; slot++) {
      matrix[day][slot] = false
    }
  }

  let activeCount = 0
  for (const r of rows) {
    if (matrix[r.dayOfWeek]) {
      matrix[r.dayOfWeek][r.slotIndex] = r.isActive
      if (r.isActive) {
        activeCount++
      }
    }
  }

  return { activeCount, matrix }
}

/**
 * Saves or updates counselor weekly template slots in PostgreSQL.
 */
export async function saveCounselorWeeklyTemplates(
  counselorId: string,
  slots: Array<{ dayOfWeek: number; slotIndex: number; isActive: boolean }>,
  client: DbClient = db
): Promise<{ activeCount: number }> {
  let activeCount = 0

  if (slots.length === 0) {
    const [activeRow] = await client
      .select({ count: sql<number>`count(*)::int` })
      .from(counselorWeeklyTemplates)
      .where(
        and(
          eq(counselorWeeklyTemplates.counselorId, counselorId),
          eq(counselorWeeklyTemplates.isActive, true)
        )
      )
    return { activeCount: Number(activeRow?.count ?? 0) }
  }

  await client.transaction(async (tx) => {
    const batchValues = slots.map((slot) => ({
      counselorId,
      dayOfWeek: slot.dayOfWeek,
      slotIndex: slot.slotIndex,
      isActive: slot.isActive,
      updatedAt: new Date(),
    }))

    await tx
      .insert(counselorWeeklyTemplates)
      .values(batchValues)
      .onConflictDoUpdate({
        target: [
          counselorWeeklyTemplates.counselorId,
          counselorWeeklyTemplates.dayOfWeek,
          counselorWeeklyTemplates.slotIndex,
        ],
        set: {
          isActive: sql`EXCLUDED.is_active`,
          updatedAt: sql`EXCLUDED.updated_at`,
        },
      })

    const [activeRow] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(counselorWeeklyTemplates)
      .where(
        and(
          eq(counselorWeeklyTemplates.counselorId, counselorId),
          eq(counselorWeeklyTemplates.isActive, true)
        )
      )

    activeCount = Number(activeRow?.count ?? 0)
  })

  return { activeCount }
}

export interface ScheduleMaintenanceOptions {
  referenceDate?: Date | string
  weeksAhead?: number
  dbClient?: DbClient
  counselorId?: string
}

export interface CounselorMaintenanceReport {
  counselorId: string
  counselorName: string
  success: boolean
  createdCount: number
  updatedCount: number
  preservedBookedCount: number
  preservedLeaveCount: number
  cancelledCount: number
  totalProcessedDays: number
  startDate: string
  endDate: string
  error?: string
}

export interface ScheduleMaintenanceResult {
  success: boolean
  processedCounselorsCount: number
  totalCreatedSlots: number
  totalUpdatedSlots: number
  totalPreservedBookedSlots: number
  totalPreservedLeaveSlots: number
  counselorReports: CounselorMaintenanceReport[]
  error?: string
}

/**
 * Scans all active counselors with schedule_mode = 'automatic' and ensures their
 * physical schedule slots are continuously materialized for the next 4-week rolling window.
 *
 * Guarantees (Issue 04 / ADR-0006):
 * 1. Automatic Counselor Scanning: Scans counselors where schedule_mode = 'automatic' AND is_active = true.
 * 2. Rolling Buffer Extension: Extends slots 4 weeks into the future from referenceDate.
 * 3. Idempotent: Can be run periodically without creating duplicate slot rows.
 * 4. Booking & Leave Protection: Preserves existing booked, reserved, and leave slots.
 */
export async function maintainAutomaticScheduleBuffers(
  options?: ScheduleMaintenanceOptions
): Promise<ScheduleMaintenanceResult> {
  const client = options?.dbClient || db
  const refDate = options?.referenceDate || new Date()
  const weeksAhead = options?.weeksAhead ?? 4

  try {
    const whereConditions = [
      eq(counselors.scheduleMode, "automatic"),
      eq(counselors.isActive, true),
    ]

    if (options?.counselorId) {
      whereConditions.push(eq(counselors.id, options.counselorId))
    }

    const autoCounselors = await client
      .select({
        id: counselors.id,
        fullName: counselors.fullName,
        scheduleMode: counselors.scheduleMode,
        isActive: counselors.isActive,
      })
      .from(counselors)
      .where(and(...whereConditions))

    let totalCreatedSlots = 0
    let totalUpdatedSlots = 0
    let totalPreservedBookedSlots = 0
    let totalPreservedLeaveSlots = 0
    const counselorReports: CounselorMaintenanceReport[] = []

    for (const counselor of autoCounselors) {
      try {
        const res = await materializeCounselorSlots(counselor.id, weeksAhead, {
          referenceDate: refDate,
          dbClient: client,
        })

        totalCreatedSlots += res.createdCount
        totalUpdatedSlots += res.updatedCount
        totalPreservedBookedSlots += res.preservedBookedCount
        totalPreservedLeaveSlots += res.preservedLeaveCount

        counselorReports.push({
          counselorId: counselor.id,
          counselorName: counselor.fullName,
          success: true,
          createdCount: res.createdCount,
          updatedCount: res.updatedCount,
          preservedBookedCount: res.preservedBookedCount,
          preservedLeaveCount: res.preservedLeaveCount,
          cancelledCount: res.cancelledCount,
          totalProcessedDays: res.totalProcessedDays,
          startDate: res.startDate,
          endDate: res.endDate,
        })
      } catch (counselorErr: any) {
        console.error(
          `Cron maintenance failed for counselor ${counselor.id} (${counselor.fullName}):`,
          counselorErr
        )
        counselorReports.push({
          counselorId: counselor.id,
          counselorName: counselor.fullName,
          success: false,
          createdCount: 0,
          updatedCount: 0,
          preservedBookedCount: 0,
          preservedLeaveCount: 0,
          cancelledCount: 0,
          totalProcessedDays: 0,
          startDate: "",
          endDate: "",
          error: counselorErr.message || "Gagal memproses perpanjangan slot otomatis",
        })
      }
    }

    return {
      success: true,
      processedCounselorsCount: autoCounselors.length,
      totalCreatedSlots,
      totalUpdatedSlots,
      totalPreservedBookedSlots,
      totalPreservedLeaveSlots,
      counselorReports,
    }
  } catch (error: any) {
    console.error("Error executing maintainAutomaticScheduleBuffers:", error)
    return {
      success: false,
      processedCounselorsCount: 0,
      totalCreatedSlots: 0,
      totalUpdatedSlots: 0,
      totalPreservedBookedSlots: 0,
      totalPreservedLeaveSlots: 0,
      counselorReports: [],
      error: error?.message || "Failed to maintain automatic schedule buffers",
    }
  }
}

