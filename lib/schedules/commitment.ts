import { FIXED_SLOTS, type FixedSlot } from "@/lib/schedules/slots"
import { getNowWIB, parseTimeToMinutes } from "@/lib/schedules/concurrency"

export const MIN_WEEKLY_SLOTS_TARGET = 10
export const CLINIC_BOOKING_CUTOFF_HOURS = 4

export interface WeeklyGridDay {
  date: string // YYYY-MM-DD
  dayName: string // "Senin", "Selasa", etc.
  dayShort: string // "Sen", "Sel", etc.
  dayNumber: string // "19"
  monthName: string // "Okt"
  fullDisplay: string // "Senin, 19 Okt"
  isToday: boolean
  isPast: boolean
}

export type SlotCellStatus = "available" | "reserved" | "booked" | "cancelled" | "unopened"

export interface GridSlotCell {
  scheduleId?: string
  slotIndex: number // 1 to 7
  date: string // YYYY-MM-DD
  startTime: string // HH:mm:ss
  endTime: string // HH:mm:ss
  displayTime: string // "08.00 – 10.00 WIB"
  status: SlotCellStatus
  isLeave: boolean
  leaveReason?: string | null
  isPast: boolean
  isWithinH4: boolean
  canToggle: boolean
  toggleDisabledReason?: string
  patientName?: string | null
  bookingCode?: string | null
  bookingStatus?: string | null
}

export interface WeeklyCommitmentSummary {
  activeCount: number
  target: number
  isMet: boolean
  remaining: number
  percentage: number
}

const INDONESIAN_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const INDONESIAN_DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
const INDONESIAN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
]

/**
 * Calculates the Monday of the week for a given reference date (WIB-aware).
 */
export function getMondayOfWeek(referenceDate: Date | string = new Date()): Date {
  const dateObj = typeof referenceDate === "string" ? new Date(`${referenceDate}T00:00:00+07:00`) : new Date(referenceDate)
  const day = dateObj.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(dateObj)
  monday.setDate(dateObj.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/**
 * Generates array of 7 consecutive dates (Monday through Sunday) for the target week.
 */
export function getWeekDates(referenceDate: Date | string = new Date(), nowRef: Date = new Date()): WeeklyGridDay[] {
  const monday = getMondayOfWeek(referenceDate)
  const nowWIB = getNowWIB(nowRef)
  const todayStr = nowWIB.dateStr

  const days: WeeklyGridDay[] = []

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday)
    current.setDate(monday.getDate() + i)

    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, "0")
    const dateNum = String(current.getDate()).padStart(2, "0")
    const dateStr = `${year}-${month}-${dateNum}`

    const dayIndex = current.getDay()
    const dayName = INDONESIAN_DAYS[dayIndex]
    const dayShort = INDONESIAN_DAYS_SHORT[dayIndex]
    const monthName = INDONESIAN_MONTHS[current.getMonth()]
    const isToday = dateStr === todayStr
    const isPast = dateStr < todayStr

    days.push({
      date: dateStr,
      dayName,
      dayShort,
      dayNumber: dateNum,
      monthName,
      fullDisplay: `${dayName}, ${parseInt(dateNum, 10)} ${monthName}`,
      isToday,
      isPast,
    })
  }

  return days
}

/**
 * Computes weekly commitment metrics against the required target (default: 10 slots).
 * Only active non-leave available/reserved/booked slots count toward the quota.
 */
export function calculateWeeklyCommitment(
  slots: Array<{ status: string; isLeave?: boolean; date?: string }>,
  target: number = MIN_WEEKLY_SLOTS_TARGET
): WeeklyCommitmentSummary {
  const activeSlots = slots.filter((slot) => {
    if (slot.isLeave) return false
    return slot.status === "available" || slot.status === "reserved" || slot.status === "booked"
  })

  const activeCount = activeSlots.length
  const isMet = activeCount >= target
  const remaining = Math.max(0, target - activeCount)
  const percentage = Math.min(100, Math.round((activeCount / target) * 100))

  return {
    activeCount,
    target,
    isMet,
    remaining,
    percentage,
  }
}

/**
 * Checks whether a slot is starting in less than `cutoffHours` (H-4 cutoff) or already in the past.
 */
export function isSlotPastH4Cutoff(
  slotDate: string,
  startTime: string,
  now: Date = new Date(),
  cutoffHours: number = CLINIC_BOOKING_CUTOFF_HOURS
): boolean {
  const wib = getNowWIB(now)

  // 1. Past date
  if (slotDate < wib.dateStr) {
    return true
  }

  // 2. Future date beyond today
  if (slotDate > wib.dateStr) {
    // Check if slot tomorrow is within cutoff from late today (e.g. today 22:00, slot tomorrow 01:00)
    const slotTotalMinsFromMidnight = parseTimeToMinutes(startTime)
    const currentMinsFromMidnight = wib.timeMinutes
    
    // Convert dates to absolute timestamps for strict multi-day cutoff accuracy
    const [year, month, day] = slotDate.split("-").map(Number)
    const [startH, startM] = startTime.split(":").map(Number)
    const slotTimestamp = Date.UTC(year, month - 1, day, startH - 7, startM) // Convert WIB to UTC
    const currentTimestamp = now.getTime()
    const diffMs = slotTimestamp - currentTimestamp
    const diffHours = diffMs / (1000 * 60 * 60)

    return diffHours < cutoffHours
  }

  // 3. Same date: check minutes difference
  const slotMinutes = parseTimeToMinutes(startTime)
  const currentMinutes = wib.timeMinutes
  const diffMinutes = slotMinutes - currentMinutes

  return diffMinutes < cutoffHours * 60
}

/**
 * Validates whether a slot can be booked by a patient.
 * Enforces:
 * 1. Slot must exist and not be cancelled/unopened.
 * 2. Slot must NOT be marked as leave (`is_leave: true`).
 * 3. Slot must have >= 4 hours lead time (H-4 cutoff).
 * 4. Slot must not be already booked or in an unexpired hold.
 */
export function isSlotBookableForClient(
  slot: {
    date: string
    startTime: string
    status?: string
    isLeave?: boolean
    leaveReason?: string | null
    reservedUntil?: Date | string | null
  },
  now: Date = new Date(),
  cutoffHours: number = CLINIC_BOOKING_CUTOFF_HOURS
): { bookable: boolean; reason?: string } {
  if (slot.isLeave) {
    return {
      bookable: false,
      reason: `Slot konsultasi ini tidak tersedia karena konselor sedang izin/cuti praktik${
        slot.leaveReason ? ` (${slot.leaveReason})` : ""
      }.`,
    }
  }

  if (slot.status === "cancelled") {
    return {
      bookable: false,
      reason: "Slot jadwal ini tidak dibuka oleh konselor.",
    }
  }

  if (slot.status === "booked") {
    return {
      bookable: false,
      reason: "Slot jadwal ini sudah dipesan oleh pasien lain.",
    }
  }

  if (slot.status === "reserved" && slot.reservedUntil) {
    const holdExpiresAt = new Date(slot.reservedUntil).getTime()
    if (holdExpiresAt > now.getTime()) {
      return {
        bookable: false,
        reason: "Slot jadwal sedang dalam proses transaksi pemesanan pasien lain.",
      }
    }
  }

  if (isSlotPastH4Cutoff(slot.date, slot.startTime, now, cutoffHours)) {
    return {
      bookable: false,
      reason: `Pemesanan sesi ditutup karena telah melewati batas cutoff H-${cutoffHours} jam sebelum waktu praktik.`,
    }
  }

  return { bookable: true }
}

/**
 * Determines whether the counselor can toggle the slot on or off directly.
 */
export function canCounselorToggleSlot(
  status: SlotCellStatus,
  isLeave: boolean,
  isPast: boolean
): { canToggle: boolean; reason?: string } {
  if (isPast) {
    return {
      canToggle: false,
      reason: "Slot jadwal yang sudah terlewat tidak dapat diubah.",
    }
  }

  if (status === "booked") {
    return {
      canToggle: false,
      reason: "Slot sudah terpesan oleh pasien dan tidak dapat dimatikan langsung. Hubungi admin untuk penjadwalan ulang.",
    }
  }

  if (status === "reserved") {
    return {
      canToggle: false,
      reason: "Slot sedang dalam hold pembayaran pasien (15-30 menit) dan tidak dapat dimatikan langsung.",
    }
  }

  return { canToggle: true }
}
