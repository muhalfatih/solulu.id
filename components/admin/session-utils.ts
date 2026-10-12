import type { SessionOperationalStatus } from "./status-badge"

export interface SessionTimingInput {
  date?: string | Date | null
  startTime?: string | null
  endTime?: string | null
  status: string
}

export interface SessionTimingResult {
  status: SessionOperationalStatus
  isPast: boolean
  isExpired: boolean
  isOngoing: boolean
  hoursUntilSession: number
  startDateTime: Date | null
  endDateTime: Date | null
}

/**
 * Normalizes date input to a standard YYYY-MM-DD string.
 */
export function normalizeDateString(dateVal: string | Date | null | undefined): string {
  if (!dateVal) return ""
  if (typeof dateVal === "string") {
    return dateVal.includes("T") ? dateVal.split("T")[0] : dateVal
  }
  const year = dateVal.getFullYear()
  const month = String(dateVal.getMonth() + 1).padStart(2, "0")
  const day = String(dateVal.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Computes exact operational status and elapsed/past state for a session.
 * Rules:
 * - 'pending_payment' past startTime becomes 'expired'.
 * - 'confirmed' / 'in_session' between startTime and endTime is 'in_session'.
 * - 'confirmed' / 'in_session' past endTime becomes 'completed'.
 * - 'cancelled' and 'completed' always belong to past/history.
 */
export function resolveSessionTimingAndStatus(
  input: SessionTimingInput,
  referenceNow: Date = new Date()
): SessionTimingResult {
  const dateStr = normalizeDateString(input.date)
  const startTimeStr = input.startTime ? input.startTime.slice(0, 5) : "09:00"
  const endTimeStr = input.endTime ? input.endTime.slice(0, 5) : "10:30"

  let startDateTime: Date | null = null
  let endDateTime: Date | null = null
  let hoursUntilSession = 0

  if (dateStr) {
    const parts = dateStr.split("-").map(Number)
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const [year, month, day] = parts
      const [startH, startM] = startTimeStr.split(":").map((v) => parseInt(v, 10) || 0)
      const [endH, endM] = endTimeStr.split(":").map((v) => parseInt(v, 10) || 0)

      startDateTime = new Date(year, month - 1, day, startH, startM, 0)
      endDateTime = new Date(year, month - 1, day, endH, endM, 0)

      hoursUntilSession = Math.round(
        (startDateTime.getTime() - referenceNow.getTime()) / (1000 * 60 * 60)
      )
    }
  }

  const nowMs = referenceNow.getTime()
  const isPastStart = startDateTime ? nowMs >= startDateTime.getTime() : false
  const isPastEnd = endDateTime ? nowMs >= endDateTime.getTime() : false
  const isOngoing = isPastStart && !isPastEnd

  const rawStatus = (input.status || "pending_payment") as string
  let resolvedStatus: SessionOperationalStatus = "pending_payment"
  let isPast = false
  let isExpired = false

  if (rawStatus === "cancelled") {
    resolvedStatus = "cancelled"
    isPast = true
  } else if (rawStatus === "completed") {
    resolvedStatus = "completed"
    isPast = true
  } else if (rawStatus === "pending_payment") {
    if (isPastStart) {
      resolvedStatus = "expired"
      isExpired = true
      isPast = true
    } else {
      resolvedStatus = "pending_payment"
      isPast = false
    }
  } else if (rawStatus === "confirmed" || rawStatus === "in_session") {
    if (isPastEnd) {
      resolvedStatus = "completed"
      isPast = true
    } else if (isOngoing) {
      resolvedStatus = "in_session"
      isPast = false
    } else {
      resolvedStatus = "confirmed"
      isPast = false
    }
  } else if (rawStatus === "expired") {
    resolvedStatus = "expired"
    isExpired = true
    isPast = true
  } else {
    resolvedStatus = isPastEnd ? "completed" : "pending_payment"
    isPast = isPastEnd
  }

  return {
    status: resolvedStatus,
    isPast,
    isExpired,
    isOngoing,
    hoursUntilSession,
    startDateTime,
    endDateTime,
  }
}

/**
 * Groups sessions into Upcoming/Active vs Past/Elapsed categories.
 */
export function groupSessionsByTime<T extends { isPast?: boolean; status: SessionOperationalStatus }>(
  sessions: T[]
): {
  upcomingSessions: T[]
  pastSessions: T[]
} {
  const upcomingSessions: T[] = []
  const pastSessions: T[] = []

  for (const s of sessions) {
    if (s.isPast || s.status === "completed" || s.status === "expired" || s.status === "cancelled") {
      pastSessions.push(s)
    } else {
      upcomingSessions.push(s)
    }
  }

  return { upcomingSessions, pastSessions }
}
