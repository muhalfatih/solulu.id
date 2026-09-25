import { eq, inArray, count } from "drizzle-orm"
import { db } from "../../db"
import { bookings, schedules, counselors, zoomAccounts } from "../../db/schema"

export interface LockedSessionInfo {
  bookingId: string
  patientName: string
  counselorName?: string
  date: string
  startTime: string
  endTime: string
  status: string
}

export interface SafetyLockResult {
  isLocked: boolean
  upcomingSessionCount: number
  lockedSessions: LockedSessionInfo[]
  reason?: string
}

export interface CanAddAccountResult {
  allowed: boolean
  currentCount: number
  error?: string
}

/**
 * Checks whether a given schedule date and end time is in the future.
 * Solulu schedules are set in WIB (Asia/Jakarta, UTC+7).
 */
export function isSessionUpcoming(
  sessionDate: string,
  endTime: string,
  currentDate = new Date()
): boolean {
  // Construct ISO timestamp for WIB (UTC+7)
  const normalizedTime = endTime.length === 5 ? `${endTime}:00` : endTime
  const sessionEndTimeUtc = new Date(`${sessionDate}T${normalizedTime}+07:00`)

  return sessionEndTimeUtc.getTime() > currentDate.getTime()
}

export interface CheckSafetyLockOptions {
  currentDate?: Date
  fetchSessions?: (zoomAccountId: string) => Promise<LockedSessionInfo[]>
}

/**
 * Checks whether a Zoom account is protected by Safety Lock.
 * Safety Lock is ACTIVE if there are any upcoming sessions with status
 * 'confirmed' or 'pending_payment' (reserved slot).
 */
export async function checkZoomSafetyLock(
  zoomAccountId: string,
  options: CheckSafetyLockOptions = {}
): Promise<SafetyLockResult> {
  const currentDate = options.currentDate ?? new Date()

  let rawSessions: LockedSessionInfo[]

  if (options.fetchSessions) {
    rawSessions = await options.fetchSessions(zoomAccountId)
  } else {
    // Production Drizzle query
    const rows = await db
      .select({
        bookingId: bookings.id,
        patientName: bookings.patientName,
        counselorName: counselors.fullName,
        date: schedules.date,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
      .where(eq(bookings.zoomAccountId, zoomAccountId))

    rawSessions = rows
      .filter(
        (row) => row.status === "confirmed" || row.status === "pending_payment"
      )
      .map((row) => ({
        bookingId: row.bookingId,
        patientName: row.patientName,
        counselorName: row.counselorName ?? "Konselor Solulu",
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        status: row.status,
      }))
  }

  // Filter only sessions whose endTime is still in the future
  const lockedSessions = rawSessions.filter((s) =>
    isSessionUpcoming(s.date, s.endTime, currentDate)
  )

  const upcomingSessionCount = lockedSessions.length
  const isLocked = upcomingSessionCount > 0

  let reason: string | undefined
  if (isLocked) {
    reason = `Akun Zoom terkunci: terdapat ${upcomingSessionCount} sesi mendatang (confirmed/reserved) yang bergantung pada akun ini. Perubahan atau penghapusan diblokir demi keamanan pasien.`
  }

  return {
    isLocked,
    upcomingSessionCount,
    lockedSessions,
    reason,
  }
}

export interface CanAddAccountOptions {
  fetchCount?: () => Promise<number>
}

/**
 * Enforces platform rule: Solulu operates on exactly max 2 Zoom Pro accounts.
 */
export async function canAddZoomAccount(
  options: CanAddAccountOptions = {}
): Promise<CanAddAccountResult> {
  let currentCount: number

  if (options.fetchCount) {
    currentCount = await options.fetchCount()
  } else {
    const result = await db.select({ total: count() }).from(zoomAccounts)
    currentCount = result[0]?.total ?? 0
  }

  if (currentCount >= 2) {
    return {
      allowed: false,
      currentCount,
      error:
        "Batas platform tercapai: Solulu dibatasi maksimal 2 akun Zoom Pro aktif.",
    }
  }

  return {
    allowed: true,
    currentCount,
  }
}
