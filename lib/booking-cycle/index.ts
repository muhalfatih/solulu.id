/**
 * Modul Siklus Booking (ADR-0008): pure logic, no I/O.
 *
 * The booking status column stores only what cannot be derived
 * (pending_payment, confirmed, completed, no_show, cancelled, expired).
 * Every other Tahap Booking is derived here from facts stored elsewhere.
 */

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "no_show"
  | "cancelled"
  | "expired"

export type BookingStage =
  | "menunggu_bayar"
  | "terkonfirmasi"
  | "ditugaskan"
  | "dijadwal_ulang"
  | "sesi_berjalan"
  | "selesai"
  | "laporan_masuk"
  | "payroll_ditutup"
  | "kedaluwarsa"
  | "dibatalkan"
  | "no_show"

export const STAGE_LABELS: Record<BookingStage, string> = {
  menunggu_bayar: "Menunggu Bayar",
  terkonfirmasi: "Terkonfirmasi",
  ditugaskan: "Ditugaskan",
  dijadwal_ulang: "Dijadwal Ulang",
  sesi_berjalan: "Sesi Berjalan",
  selesai: "Selesai",
  laporan_masuk: "Laporan Masuk",
  payroll_ditutup: "Payroll Ditutup",
  kedaluwarsa: "Kedaluwarsa",
  dibatalkan: "Dibatalkan",
  no_show: "No-Show",
}

export function stageLabel(stage: BookingStage): string {
  return STAGE_LABELS[stage]
}

export interface StageInput {
  status: BookingStatus
  /** Konselor sudah ditetapkan pada booking. */
  counselorAssigned: boolean
  rescheduleCount: number
  /** Timer sesi sudah dimulai (session_reports.timer_started_at). */
  timerStartedAt?: Date | string | null
  /** Laporan sesi sudah ada. */
  hasReport: boolean
  /** Sesi masuk Periode Payroll yang sudah ditutup (diisi oleh tiket payroll). */
  payrollClosed?: boolean
}

export function deriveStage(input: StageInput): BookingStage {
  switch (input.status) {
    case "pending_payment":
      return "menunggu_bayar"
    case "expired":
      return "kedaluwarsa"
    case "cancelled":
      return "dibatalkan"
    case "no_show":
      return "no_show"
    case "completed":
      if (input.payrollClosed) return "payroll_ditutup"
      if (input.hasReport) return "laporan_masuk"
      return "selesai"
    case "confirmed":
      if (input.timerStartedAt) return "sesi_berjalan"
      if (input.rescheduleCount > 0) return "dijadwal_ulang"
      if (input.counselorAssigned) return "ditugaskan"
      return "terkonfirmasi"
  }
}

// ---------------------------------------------------------------------------
// Session time (WIB)
// ---------------------------------------------------------------------------

/** Builds the session start instant from a schedule date ("YYYY-MM-DD") and time ("HH:mm[:ss]") in WIB (UTC+7). */
export function sessionStartAt(date: string, startTime: string): Date {
  const timeClean = startTime.includes(":") ? startTime.slice(0, 5) : startTime
  return new Date(`${date}T${timeClean}:00+07:00`)
}

// ---------------------------------------------------------------------------
// No-Show
// ---------------------------------------------------------------------------

export const NO_SHOW_TOLERANCE_MINUTES = 30

export interface NoShowInput {
  status: BookingStatus
  sessionStart: Date
  now?: Date
  toleranceMinutes?: number
  timerStartedAt?: Date | string | null
}

export interface NoShowCheck {
  allowed: boolean
  reason?: string
}

export function canMarkNoShow(input: NoShowInput): NoShowCheck {
  const now = input.now ?? new Date()
  const tolerance = input.toleranceMinutes ?? NO_SHOW_TOLERANCE_MINUTES

  if (input.status !== "confirmed") {
    return { allowed: false, reason: "No-Show hanya dapat ditandai pada booking berstatus Terkonfirmasi." }
  }
  if (input.timerStartedAt) {
    return { allowed: false, reason: "Sesi sudah berjalan (timer dimulai), klien tidak dapat ditandai No-Show." }
  }
  if (Number.isNaN(input.sessionStart.getTime())) {
    return { allowed: false, reason: "Jadwal sesi tidak valid." }
  }
  const earliest = input.sessionStart.getTime() + tolerance * 60_000
  if (now.getTime() < earliest) {
    return {
      allowed: false,
      reason: `No-Show baru dapat ditandai setelah toleransi ${tolerance} menit dari jam mulai sesi.`,
    }
  }
  return { allowed: true }
}

// ---------------------------------------------------------------------------
// Slot hold
// ---------------------------------------------------------------------------

export type HoldSource = "public" | "booking_cepat"

/** 15-minute Xendit invoice + 2-minute webhook latency buffer. */
export const SLOT_HOLD_MINUTES = 17
export const BOOKING_CEPAT_HOLD_MINUTES = 60

export function holdMinutes(source: HoldSource = "public"): number {
  return source === "booking_cepat" ? BOOKING_CEPAT_HOLD_MINUTES : SLOT_HOLD_MINUTES
}

export function holdExpiresAt(startedAt: Date, source: HoldSource = "public"): Date {
  return new Date(startedAt.getTime() + holdMinutes(source) * 60_000)
}

export function isHoldExpired(
  startedAt: Date | string,
  source: HoldSource = "public",
  now: Date = new Date()
): boolean {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt
  return now.getTime() > holdExpiresAt(start, source).getTime()
}

// ---------------------------------------------------------------------------
// Overtime
// ---------------------------------------------------------------------------

export const FREE_TOLERANCE_END_MINUTE = 95
export const OVERTIME_BLOCK_MINUTES = 30
export const HARD_STOP_MINUTES = 120

/** Number of 30-minute overtime blocks billed for a session of the given length. Free through minute 95; slot hard-stops at 120. */
export function overtimeBlocks(durationMinutes: number): number {
  if (durationMinutes <= FREE_TOLERANCE_END_MINUTE) return 0
  const billable = Math.min(durationMinutes, HARD_STOP_MINUTES) - 90
  return Math.ceil(billable / OVERTIME_BLOCK_MINUTES)
}

// ---------------------------------------------------------------------------
// Reschedule (absorbed from lib/admin/reschedule.ts)
// ---------------------------------------------------------------------------

export interface RescheduleCheckResult {
  allowed: boolean
  hoursUntilSession: number
  reason?: string
}

/**
 * Evaluates whether a session can be rescheduled based on a configurable cutoff
 * (Cutoff Reschedule from Platform Settings; legacy default 12 kept until the reschedule ticket).
 */
export function canRescheduleSession(
  sessionDate: string,
  startTime: string,
  currentTime: Date = new Date(),
  cutoffHours: number = 12
): RescheduleCheckResult {
  const sessionTimestamp = sessionStartAt(sessionDate, startTime).getTime()

  if (isNaN(sessionTimestamp)) {
    return {
      allowed: false,
      hoursUntilSession: 0,
      reason: "Format tanggal atau jam sesi tidak valid.",
    }
  }

  const diffMs = sessionTimestamp - currentTime.getTime()
  const hoursUntilSession = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10

  if (hoursUntilSession <= 0) {
    return {
      allowed: false,
      hoursUntilSession,
      reason: "Sesi konseling telah berlangsung atau telah lewat dari jadwal.",
    }
  }

  if (hoursUntilSession < cutoffHours) {
    return {
      allowed: false,
      hoursUntilSession,
      reason: `Perubahan jadwal ditutup karena sesi dimulai dalam ${hoursUntilSession} jam (Aturan H-${cutoffHours} mengharuskan minimal ${cutoffHours} jam sebelumnya).`,
    }
  }

  return { allowed: true, hoursUntilSession }
}
