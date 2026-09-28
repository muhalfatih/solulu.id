import { eq, and, inArray } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, zoomAccounts } from "@/db/schema"
import { isTimeRangeOverlapping } from "@/lib/schedules/concurrency"

export interface ZoomAccountSummary {
  id: string
  name: string
  email: string
  accountId: string
  clientId: string
  clientSecretEncrypted: string
  cachedAccessToken?: string | null
  tokenExpiresAt?: Date | null
  isActive: boolean
}

export interface AllocateZoomOptions {
  fetchAccounts?: () => Promise<ZoomAccountSummary[]>
  fetchOverlappingBookings?: (
    date: string,
    startTime: string,
    endTime: string
  ) => Promise<Array<{ zoomAccountId: string | null }>>
}

export interface AllocationResult {
  success: boolean
  account?: ZoomAccountSummary
  error?: string
}

/**
 * Dynamically allocates an available Zoom Pro account for a 90-minute session.
 * Adheres to ADR-0001 & ADR-0002: Maximum 2 concurrent Zoom Pro accounts platform-wide.
 * Evaluates overlapping active sessions on the schedule date.
 */
export async function allocateZoomAccount(
  scheduleDate: string,
  startTime: string,
  endTime: string,
  options: AllocateZoomOptions = {}
): Promise<AllocationResult> {
  try {
    // 1. Fetch active Zoom accounts (max 2 in Solulu v1 architecture)
    let accounts: ZoomAccountSummary[]
    if (options.fetchAccounts) {
      accounts = await options.fetchAccounts()
    } else {
      const rows = await db
        .select()
        .from(zoomAccounts)
        .where(eq(zoomAccounts.isActive, true))
      accounts = rows
    }

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: "Tidak ada akun Zoom Pro aktif yang terkonfigurasi di sistem.",
      }
    }

    // 2. Fetch overlapping sessions with confirmed or active bookings
    let overlappingZoomAccountIds: (string | null)[]
    if (options.fetchOverlappingBookings) {
      const overlaps = await options.fetchOverlappingBookings(
        scheduleDate,
        startTime,
        endTime
      )
      overlappingZoomAccountIds = overlaps.map((o) => o.zoomAccountId)
    } else {
      // Query bookings on the same date with active status
      const existingSessions = await db
        .select({
          zoomAccountId: bookings.zoomAccountId,
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          bookingStatus: bookings.status,
        })
        .from(bookings)
        .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .where(
          and(
            eq(schedules.date, scheduleDate),
            inArray(bookings.status, ["confirmed", "pending_payment"])
          )
        )

      overlappingZoomAccountIds = existingSessions
        .filter((session) =>
          isTimeRangeOverlapping(
            session.startTime,
            session.endTime,
            startTime,
            endTime
          )
        )
        .map((s) => s.zoomAccountId)
    }

    const occupiedSet = new Set(
      overlappingZoomAccountIds.filter((id): id is string => Boolean(id))
    )

    // 3. Find an available account that is NOT in the occupied set
    const availableAccount = accounts.find((acc) => !occupiedSet.has(acc.id))

    if (!availableAccount) {
      return {
        success: false,
        error:
          "Semua akun Zoom Pro (maksimal 2) sedang digunakan pada slot waktu yang tumpang tindih.",
      }
    }

    return {
      success: true,
      account: availableAccount,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal mengalokasikan akun Zoom.",
    }
  }
}
