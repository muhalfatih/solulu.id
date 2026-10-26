export interface RescheduleCheckResult {
  allowed: boolean
  hoursUntilSession: number
  reason?: string
}

/**
 * Evaluates whether a session can be rescheduled based on configurable cutoff hours.
 * Batas waktu reschedule dinamis menyesuaikan konfigurasi admin pada Platform Settings (default: H-12 atau H-4).
 */
export function canRescheduleSession(
  sessionDate: string,
  startTime: string,
  currentTime: Date = new Date(),
  cutoffHours: number = 12
): RescheduleCheckResult {
  // Parse session datetime (WIB / UTC+7 or local date string)
  // Format expected: date: 'YYYY-MM-DD', startTime: 'HH:mm' or 'HH:mm:ss'
  const timeClean = startTime.includes(":") ? startTime.slice(0, 5) : startTime
  const sessionDateTimeStr = `${sessionDate}T${timeClean}:00+07:00`
  const sessionTimestamp = new Date(sessionDateTimeStr).getTime()

  if (isNaN(sessionTimestamp)) {
    return {
      allowed: false,
      hoursUntilSession: 0,
      reason: "Format tanggal atau jam sesi tidak valid.",
    }
  }

  const currentTimestamp = currentTime.getTime()
  const diffMs = sessionTimestamp - currentTimestamp
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

  return {
    allowed: true,
    hoursUntilSession,
  }
}
