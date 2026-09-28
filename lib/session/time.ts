/**
 * Solulu Session Time & Countdown Computation Utilities
 *
 * Implements:
 * - Deterministic Western Indonesia Time (WIB / UTC+7) parsing
 * - 90-minute session window boundaries
 * - 10-minute pre-session Zoom room unlocking (US-16, US-17)
 * - Real-time countdown calculation and formatted display
 */

export type SessionState =
  | "UPCOMING_LOCKED"
  | "ROOM_OPEN_PREPARING"
  | "IN_PROGRESS"
  | "ENDED"

export interface SessionTimeInfo {
  sessionStart: Date
  sessionEnd: Date
  zoomUnlockTime: Date
  state: SessionState
  isZoomActive: boolean
  msUntilStart: number
  msUntilUnlock: number
  msUntilEnd: number
}

export interface CountdownDisplay {
  days: number
  hours: number
  minutes: number
  seconds: number
  isZero: boolean
  formatted: string
  label: string
}

/**
 * Parses a date (YYYY-MM-DD) and time (HH:mm or HH:mm:ss) into a Date object
 * pinned explicitly to Western Indonesia Time (WIB, UTC+7).
 */
export function parseWibDateTime(dateStr: string, timeStr: string): Date {
  const parts = timeStr.trim().split(":")
  const hh = (parts[0] || "00").padStart(2, "0")
  const mm = (parts[1] || "00").padStart(2, "0")
  const ss = (parts[2] || "00").padStart(2, "0")
  const isoStr = `${dateStr.trim()}T${hh}:${mm}:${ss}+07:00`
  return new Date(isoStr)
}

/**
 * Computes session start, end, unlock boundaries, and current time state.
 * @param dateStr Date in "YYYY-MM-DD"
 * @param startTime Time in "HH:mm" or "HH:mm:ss"
 * @param endTime Time in "HH:mm" or "HH:mm:ss"
 * @param now Current timestamp (defaults to new Date())
 */
export function calculateSessionTimeInfo(
  dateStr: string,
  startTime: string,
  endTime: string,
  now: Date = new Date()
): SessionTimeInfo {
  const sessionStart = parseWibDateTime(dateStr, startTime)
  let sessionEnd = parseWibDateTime(dateStr, endTime)

  // Handle rare midnight crossing where endTime < startTime
  if (sessionEnd.getTime() <= sessionStart.getTime()) {
    sessionEnd = new Date(sessionEnd.getTime() + 24 * 60 * 60 * 1000)
  }

  // Zoom unlocks exactly 10 minutes prior to session start (US-16, US-17)
  const zoomUnlockTime = new Date(sessionStart.getTime() - 10 * 60 * 1000)

  const nowMs = now.getTime()
  const startMs = sessionStart.getTime()
  const endMs = sessionEnd.getTime()
  const unlockMs = zoomUnlockTime.getTime()

  let state: SessionState
  let isZoomActive: boolean

  if (nowMs < unlockMs) {
    state = "UPCOMING_LOCKED"
    isZoomActive = false
  } else if (nowMs < startMs) {
    state = "ROOM_OPEN_PREPARING"
    isZoomActive = true
  } else if (nowMs <= endMs) {
    state = "IN_PROGRESS"
    isZoomActive = true
  } else {
    state = "ENDED"
    isZoomActive = false
  }

  return {
    sessionStart,
    sessionEnd,
    zoomUnlockTime,
    state,
    isZoomActive,
    msUntilStart: Math.max(0, startMs - nowMs),
    msUntilUnlock: Math.max(0, unlockMs - nowMs),
    msUntilEnd: Math.max(0, endMs - nowMs),
  }
}

/**
 * Calculates countdown breakdown and formatted string according to session state.
 */
export function getSessionCountdown(
  timeInfo: SessionTimeInfo,
  now: Date = new Date()
): CountdownDisplay {
  const { state, sessionStart, sessionEnd } = timeInfo
  const nowMs = now.getTime()

  if (state === "ENDED") {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isZero: true,
      formatted: "00:00:00",
      label: "Sesi telah berakhir",
    }
  }

  // If in progress, countdown to session end
  const targetMs = state === "IN_PROGRESS" ? sessionEnd.getTime() : sessionStart.getTime()
  const diffMs = Math.max(0, targetMs - nowMs)

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  const pad = (n: number) => String(n).padStart(2, "0")
  let formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  if (days > 0) {
    formatted = `${days}h ${pad(hours)}j ${pad(minutes)}m`
  }

  let label: string
  if (state === "UPCOMING_LOCKED") {
    label = "Sesi dimulai dalam"
  } else if (state === "ROOM_OPEN_PREPARING") {
    label = "Ruang Zoom siap • Sesi dimulai dalam"
  } else {
    label = "Sesi sedang berlangsung • Sisa waktu"
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isZero: diffMs === 0,
    formatted,
    label,
  }
}

/**
 * Formats a date string (YYYY-MM-DD) into Indonesian locale format (e.g. "Senin, 28 September 2026").
 */
export function formatIndonesianDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10))
  // Construct date at 12:00 WIB to prevent any day shifting
  const date = new Date(Date.UTC(year, month - 1, day, 5, 0, 0))
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date)
}
