/**
 * Foundational 7 Fixed Slots & Scheduling Domain Module (SSOT)
 *
 * Implements Solulu Master SOP & ADR-0005:
 * - 7 Fixed Daily Consultation Slots (08.00–22.00 WIB)
 * - Maximum Default Concurrency: 10 Sessions per Slot (Hybrid 4 Zoom Pro Accounts)
 * - Mandatory Cutoff H-4 Jam (4 hours / 240 minutes) before slot start
 * - WIB (Asia/Jakarta) Date and Time Normalization
 */

export interface FixedSlot {
  slotIndex: number
  startTime: string
  endTime: string
  label: string
  displayTime: string
}

export const FIXED_SLOTS: FixedSlot[] = [
  {
    slotIndex: 1,
    startTime: "08:00:00",
    endTime: "10:00:00",
    label: "Slot 1 (08.00–10.00 WIB)",
    displayTime: "08.00 – 10.00 WIB",
  },
  {
    slotIndex: 2,
    startTime: "10:00:00",
    endTime: "12:00:00",
    label: "Slot 2 (10.00–12.00 WIB)",
    displayTime: "10.00 – 12.00 WIB",
  },
  {
    slotIndex: 3,
    startTime: "12:00:00",
    endTime: "14:00:00",
    label: "Slot 3 (12.00–14.00 WIB)",
    displayTime: "12.00 – 14.00 WIB",
  },
  {
    slotIndex: 4,
    startTime: "14:00:00",
    endTime: "16:00:00",
    label: "Slot 4 (14.00–16.00 WIB)",
    displayTime: "14.00 – 16.00 WIB",
  },
  {
    slotIndex: 5,
    startTime: "16:00:00",
    endTime: "18:00:00",
    label: "Slot 5 (16.00–18.00 WIB)",
    displayTime: "16.00 – 18.00 WIB",
  },
  {
    slotIndex: 6,
    startTime: "18:00:00",
    endTime: "20:00:00",
    label: "Slot 6 (18.00–20.00 WIB)",
    displayTime: "18.00 – 20.00 WIB",
  },
  {
    slotIndex: 7,
    startTime: "20:00:00",
    endTime: "22:00:00",
    label: "Slot 7 (20.00–22.00 WIB)",
    displayTime: "20.00 – 22.00 WIB",
  },
]

export const DEFAULT_MAX_SLOT_QUOTA = 10
export const CLINIC_BOOKING_CUTOFF_HOURS = 4 // H-4 Jam per Master SOP
export const MIN_BOOKING_LEAD_TIME_MINUTES = CLINIC_BOOKING_CUTOFF_HOURS * 60 // 240 minutes
export const MAX_BOOKING_HORIZON_DAYS = 14

/**
 * Resolves fixed slot details by 1-based slot index (1..7).
 */
export function getSlotByIndex(slotIndex: number): FixedSlot | undefined {
  return FIXED_SLOTS.find((s) => s.slotIndex === slotIndex)
}

/**
 * Resolves fixed slot details by startTime string (e.g. "08:00", "08:00:00").
 */
export function getSlotByStartTime(startTime: string): FixedSlot | undefined {
  const clean = startTime.trim().slice(0, 5) // "08:00"
  return FIXED_SLOTS.find((s) => s.startTime.startsWith(clean))
}

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
 * Parses time string into total minutes since midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":")
  const hours = parseInt(parts[0] || "0", 10)
  const minutes = parseInt(parts[1] || "0", 10)
  return hours * 60 + minutes
}

/**
 * Checks whether a slot is in the past (WIB).
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
 * Checks whether a slot is locked by the H-4 Jam cutoff rule.
 */
export function isWithinH4Cutoff(
  date: string,
  startTime: string,
  now: Date = new Date(),
  cutoffHours: number = CLINIC_BOOKING_CUTOFF_HOURS
): boolean {
  const wib = getNowWIB(now)
  if (date < wib.dateStr) return true
  if (date > wib.dateStr) return false

  const slotMinutes = parseTimeToMinutes(startTime)
  const cutoffMinutes = cutoffHours * 60
  return slotMinutes - wib.timeMinutes < cutoffMinutes
}

/**
 * Evaluates whether a slot can be booked by a patient in the public flow.
 * Rules:
 * 1. Slot is not on leave.
 * 2. Slot date is not in the past.
 * 3. Slot date is within the booking horizon (default 14 days).
 * 4. Slot satisfies the cutoff buffer (default H-4 hours).
 */
export function isSlotBookable(
  date: string,
  startTime: string,
  now: Date = new Date(),
  leadTimeMinutes: number = MIN_BOOKING_LEAD_TIME_MINUTES,
  maxHorizonDays: number = MAX_BOOKING_HORIZON_DAYS,
  isLeave: boolean = false
): { bookable: boolean; reason?: string } {
  if (isLeave) {
    return {
      bookable: false,
      reason: "Mitra konselor sedang izin/cuti praktik pada jadwal ini.",
    }
  }

  const wib = getNowWIB(now)
  const maxDate = new Date(now.getTime() + maxHorizonDays * 24 * 60 * 60 * 1000)
  const maxDateStr = getWIBDateString(maxDate)

  if (date < wib.dateStr) {
    return { bookable: false, reason: "Tanggal slot sudah terlewat." }
  }

  if (date > maxDateStr) {
    return {
      bookable: false,
      reason: `Slot hanya dapat dipesan maksimal ${maxHorizonDays} hari ke depan.`,
    }
  }

  const slotMinutes = parseTimeToMinutes(startTime)

  if (date === wib.dateStr) {
    if (slotMinutes <= wib.timeMinutes) {
      return { bookable: false, reason: "Waktu slot sesi telah terlewat." }
    }
    if (slotMinutes - wib.timeMinutes < leadTimeMinutes) {
      const hours = Math.round(leadTimeMinutes / 60)
      return {
        bookable: false,
        reason: `Pemesanan sesi membutuhkan jeda minimal ${hours} jam (H-${hours}) sebelum waktu praktik dimulai.`,
      }
    }
  }

  return { bookable: true }
}
