/**
 * Concurrency & Schedule Management Utilities for Solulu
 *
 * Implements:
 * - 90-minute fixed consultation slot computations
 * - Overlap detection algorithms (existingStart < newStart + 90m AND existingEnd > newStart)
 * - Maximum 2 platform-wide concurrent session guard (ADR-0001 & ADR-0002 for Zero-Cost 2 Zoom Accounts)
 * - Self-overlap prevention for individual counselor schedules
 * - Protected slot cancellation rules
 */

export const SESSION_DURATION_MINUTES = 90
export const MAX_PLATFORM_CONCURRENCY = 2
export const MIN_BOOKING_LEAD_TIME_MINUTES = 120 // 2 Jam buffer minimum sebelum sesi dimulai
export const MAX_BOOKING_HORIZON_DAYS = 14 // Jendela pemesanan maksimal 14 hari ke depan
export const MAX_COUNSELOR_DAILY_SESSIONS = 4 // Batas beban kerja maksimal 4 sesi 90 menit per hari per konselor

/**
 * Parses time strings in "HH:mm" or "HH:mm:ss" format into total minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":")
  const hours = parseInt(parts[0] || "0", 10)
  const minutes = parseInt(parts[1] || "0", 10)
  return hours * 60 + minutes
}

/**
 * Converts total minutes since midnight back into "HH:mm" or "HH:mm:ss" string.
 */
export function minutesToTime(totalMinutes: number, withSeconds = false): string {
  // Wrap around midnight if necessary
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  const hh = String(hours).padStart(2, "0")
  const mm = String(mins).padStart(2, "0")

  return withSeconds ? `${hh}:${mm}:00` : `${hh}:${mm}`
}

/**
 * Computes slot endTime by adding 90 minutes to startTime.
 * Preserves seconds format if the input includes seconds.
 */
export function computeEndTime(startTime: string): string {
  const hasSeconds = startTime.trim().split(":").length >= 3
  const startMins = parseTimeToMinutes(startTime)
  const endMins = startMins + SESSION_DURATION_MINUTES
  return minutesToTime(endMins, hasSeconds)
}

/**
 * Formats a start and end time into a friendly full range string (e.g. "19:00 – 20:30 WIB").
 * Uses standard typography en-dash with proper spacing.
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const cleanStart = minutesToTime(parseTimeToMinutes(startTime))
  const cleanEnd = minutesToTime(parseTimeToMinutes(endTime))
  return `${cleanStart} – ${cleanEnd} WIB`
}

/**
 * Determines whether two time intervals on the same day overlap.
 * Range overlap check: (startA < endB) AND (endA > startB)
 * Back-to-back adjacent slots (e.g., 09:00–10:30 and 10:30–12:00) do NOT overlap.
 */
export function isTimeRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = parseTimeToMinutes(startA)
  const aEnd = parseTimeToMinutes(endA)
  const bStart = parseTimeToMinutes(startB)
  const bEnd = parseTimeToMinutes(endB)

  return aStart < bEnd && aEnd > bStart
}

export interface SlotInterval {
  startTime: string
  endTime: string
  status?: string
}

/**
 * Checks whether a proposed slot overlaps with any of the counselor's existing non-cancelled slots.
 */
export function checkSelfOverlap(
  existingSlots: SlotInterval[],
  newStartTime: string,
  newEndTime: string
): boolean {
  return existingSlots.some((slot) => {
    if (slot.status === "cancelled") {
      return false
    }
    return isTimeRangeOverlapping(slot.startTime, slot.endTime, newStartTime, newEndTime)
  })
}

/**
 * Counts how many active sessions (reserved or confirmed/booked) overlap with a target time window.
 */
export function countOverlappingActiveSessions(
  activeSessions: SlotInterval[],
  targetStartTime: string,
  targetEndTime: string
): number {
  return activeSessions.filter((session) => {
    if (session.status === "cancelled") {
      return false
    }
    return isTimeRangeOverlapping(session.startTime, session.endTime, targetStartTime, targetEndTime)
  }).length
}

/**
 * Checks whether a slot is available under the platform concurrency guard.
 * Returns true if overlapping active sessions < MAX_PLATFORM_CONCURRENCY (2).
 */
export function isSlotAvailableUnderConcurrencyGuard(
  activeSessions: SlotInterval[],
  targetStartTime: string,
  targetEndTime: string,
  maxLimit: number = MAX_PLATFORM_CONCURRENCY
): boolean {
  const count = countOverlappingActiveSessions(activeSessions, targetStartTime, targetEndTime)
  return count < maxLimit
}

/**
 * Filters out available candidate slots that exceed the platform concurrency capacity.
 */
export function filterSlotsByConcurrencyGuard<T extends SlotInterval>(
  candidateSlots: T[],
  activeSessionsOnDate: SlotInterval[],
  maxLimit: number = MAX_PLATFORM_CONCURRENCY
): T[] {
  return candidateSlots.filter((slot) =>
    isSlotAvailableUnderConcurrencyGuard(
      activeSessionsOnDate,
      slot.startTime,
      slot.endTime,
      maxLimit
    )
  )
}

export type SlotCancellationStatus = "available" | "reserved" | "booked" | "cancelled"

/**
 * Returns current Date adjusted to Asia/Jakarta (WIB) time components.
 */
export function getNowWIB(d: Date = new Date()): {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  dateStr: string
  timeMinutes: number
} {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(d)
  const partMap: Record<string, string> = {}
  for (const part of parts) {
    partMap[part.type] = part.value
  }

  const year = parseInt(partMap.year || "2026", 10)
  const month = parseInt(partMap.month || "1", 10)
  const day = parseInt(partMap.day || "1", 10)
  const hours = parseInt(partMap.hour || "0", 10)
  const minutes = parseInt(partMap.minute || "0", 10)

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  const timeMinutes = hours * 60 + minutes

  return { year, month, day, hours, minutes, dateStr, timeMinutes }
}

/**
 * Returns YYYY-MM-DD date string in WIB timezone.
 */
export function getWIBDateString(d: Date = new Date()): string {
  return getNowWIB(d).dateStr
}

/**
 * Returns max bookable date string (WIB) based on horizon days.
 */
export function getMaxBookableDateString(
  d: Date = new Date(),
  horizonDays: number = MAX_BOOKING_HORIZON_DAYS
): string {
  const target = new Date(d.getTime() + horizonDays * 24 * 60 * 60 * 1000)
  return getWIBDateString(target)
}

/**
 * Checks whether a slot has already started or ended in the past (WIB).
 */
export function isSlotInPast(
  date: string,
  time: string,
  now: Date = new Date()
): boolean {
  const wib = getNowWIB(now)
  if (date < wib.dateStr) {
    return true
  }
  if (date > wib.dateStr) {
    return false
  }
  const slotMinutes = parseTimeToMinutes(time)
  return slotMinutes <= wib.timeMinutes
}

/**
 * Determines whether a slot can be booked by a patient in the public flow.
 * Rules:
 * 1. Slot date must not be in the past.
 * 2. Slot date must not exceed max horizon days (14 days).
 * 3. Slot startTime must have at least leadTimeMinutes (120 mins / 2 hours) from current time.
 */
export function isSlotBookable(
  date: string,
  startTime: string,
  now: Date = new Date(),
  leadTimeMinutes: number = MIN_BOOKING_LEAD_TIME_MINUTES,
  maxHorizonDays: number = MAX_BOOKING_HORIZON_DAYS
): { bookable: boolean; reason?: string } {
  const wib = getNowWIB(now)
  const maxDate = getMaxBookableDateString(now, maxHorizonDays)

  if (date < wib.dateStr) {
    return { bookable: false, reason: "Tanggal slot sudah terlewat." }
  }

  if (date > maxDate) {
    return {
      bookable: false,
      reason: `Slot hanya dapat dipesan maksimal ${maxHorizonDays} hari ke depan.`,
    }
  }

  const slotMinutes = parseTimeToMinutes(startTime)

  if (date === wib.dateStr) {
    // Same day: check lead time buffer
    if (slotMinutes <= wib.timeMinutes) {
      return { bookable: false, reason: "Waktu slot sesi telah terlewat." }
    }
    if (slotMinutes - wib.timeMinutes < leadTimeMinutes) {
      return {
        bookable: false,
        reason: `Pemesanan sesi membutuhkan jeda minimal ${Math.round(
          leadTimeMinutes / 60
        )} jam sebelum waktu praktik dimulai.`,
      }
    }
  }

  return { bookable: true }
}

/**
 * Filters a list of slots keeping only those that are bookable.
 */
export function filterBookableSlots<T extends { date: string; startTime: string }>(
  slots: T[],
  now: Date = new Date(),
  leadTimeMinutes: number = MIN_BOOKING_LEAD_TIME_MINUTES,
  maxHorizonDays: number = MAX_BOOKING_HORIZON_DAYS
): T[] {
  return slots.filter(
    (slot) => isSlotBookable(slot.date, slot.startTime, now, leadTimeMinutes, maxHorizonDays).bookable
  )
}

/**
 * Determines whether a counselor can cancel a schedule slot.
 * - 'available': Allowed if not already in the past.
 * - 'reserved': Rejected (protected during the 17-minute payment hold window).
 * - 'booked': Rejected (confirmed session with patient).
 * - 'cancelled': Rejected (already cancelled).
 */
export function canCancelSlot(
  status: SlotCancellationStatus | string,
  isPast: boolean = false
): { allowed: boolean; reason?: string } {
  if (isPast) {
    return {
      allowed: false,
      reason: "Slot sudah terlewat / kedaluwarsa sehingga tidak dapat dibatalkan.",
    }
  }

  if (status === "available") {
    return { allowed: true }
  }

  if (status === "reserved") {
    return {
      allowed: false,
      reason:
        "Slot sedang dalam proses reservasi pemesanan oleh pasien (hold 17 menit) dan tidak dapat dibatalkan.",
    }
  }

  if (status === "booked") {
    return {
      allowed: false,
      reason:
        "Slot sudah dikonfirmasi dan dipesan oleh pasien. Hubungi admin operasional untuk pembatalan atau penjadwalan ulang.",
    }
  }

  if (status === "cancelled") {
    return {
      allowed: false,
      reason: "Slot ini sudah dalam status dibatalkan.",
    }
  }

  return {
    allowed: false,
    reason: `Status slot tidak valid untuk dibatalkan (${status}).`,
  }
}

