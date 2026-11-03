"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, sessionReports } from "@/db/schema"
import { canRescheduleSelf } from "@/lib/booking-cycle"
import { getPlatformSettings } from "@/lib/settings/platform"
import { rescheduleBySelf, type RescheduleDeps, type RescheduleResult } from "@/lib/booking/reschedule"
import {
  createRescheduleDeps,
  listRescheduleSlots,
  type RescheduleSlotOption,
} from "@/lib/booking/reschedule-store"
import {
  getGuestSessionByToken,
  verifyClientPhoneAndUnlockReport,
  processExtensionPayment,
  type SessionDataDependencies,
  type SubmitExtensionPaymentInput,
  type ExtensionPaymentDependencies,
} from "./access"
import type {
  ActionResponse,
  SessionPageData,
  ClientSessionReportView,
} from "./types"

export type {
  SessionDataDependencies,
  SubmitExtensionPaymentInput,
  ExtensionPaymentDependencies,
}

/**
 * Server Action Seam: Fetches all necessary session and counselor details for /session/[token].
 * Delegates to deep module lib/session/access.ts.
 */
export async function getSessionByTokenAction(
  accessToken: string,
  deps?: SessionDataDependencies
): Promise<ActionResponse<SessionPageData>> {
  return getGuestSessionByToken(accessToken, deps)
}

/**
 * Server Action Seam: Client-facing server action to unlock and fetch official clinical session report.
 * Requires client to verify registered phone number. Strictly projects only non-confidential fields.
 * Delegates to deep module lib/session/access.ts.
 */
export async function getClientSessionReportAction(
  accessToken: string,
  verificationPhone?: string,
  deps?: {
    findReport?: (token: string, phone?: string) => Promise<any>
  }
): Promise<ActionResponse<{ report: ClientSessionReportView; patientName: string; counselorName: string }>> {
  return verifyClientPhoneAndUnlockReport(accessToken, verificationPhone, deps)
}

/**
 * Alias for unlocking report
 */
export const verifyClientPhoneAndUnlockReportAction = getClientSessionReportAction

/**
 * Server Action Seam: Dual Payment settlement for session extensions (>90 min).
 * Allows choosing between automated Xendit (QRIS/VA) or Manual Bank Transfer.
 * Delegates to deep module lib/session/access.ts.
 */
export async function submitExtensionPaymentAction(
  input: SubmitExtensionPaymentInput,
  deps?: ExtensionPaymentDependencies
): Promise<ActionResponse<{ status: "PENDING" | "PAID"; message: string; paymentUrl?: string }>> {
  return processExtensionPayment(input, deps)
}

export interface RescheduleOptions {
  canReschedule: boolean
  reason?: string
  cutoffHours: number
  slots: RescheduleSlotOption[]
}

/**
 * Server Action Seam: eligibility + candidate slots for Reschedule Mandiri.
 * Only slots of the same counselor are offered. Rule owned by lib/booking-cycle.
 */
export async function getRescheduleOptionsAction(
  accessToken: string
): Promise<ActionResponse<RescheduleOptions>> {
  try {
    const [row] = await db
      .select({
        status: bookings.status,
        counselorId: bookings.counselorId,
        rescheduleCount: bookings.rescheduleCount,
        date: schedules.date,
        startTime: schedules.startTime,
        timerStartedAt: sessionReports.timerStartedAt,
      })
      .from(bookings)
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
      .where(eq(bookings.accessToken, accessToken.trim()))
      .limit(1)
    if (!row) return { success: false, error: "Sesi konseling tidak ditemukan." }

    const cutoffHours = (await getPlatformSettings()).rescheduleCutoffHours
    const check = canRescheduleSelf({
      status: row.status,
      selfRescheduleCount: row.rescheduleCount,
      sessionDate: String(row.date),
      startTime: row.startTime,
      timerStartedAt: row.timerStartedAt,
      cutoffHours,
    })
    if (!check.allowed) {
      return { success: true, data: { canReschedule: false, reason: check.reason, cutoffHours, slots: [] } }
    }
    const slots = await listRescheduleSlots(row.counselorId)
    return { success: true, data: { canReschedule: true, cutoffHours, slots } }
  } catch {
    return { success: false, error: "Gagal memuat opsi reschedule." }
  }
}

/** Server Action Seam: Reschedule Mandiri (maks 1x, sebelum cutoff, konselor yang sama). */
export async function rescheduleSessionAction(
  accessToken: string,
  newScheduleId: string,
  deps?: RescheduleDeps
): Promise<RescheduleResult> {
  if (!accessToken || !newScheduleId) {
    return { success: false, error: "Data reschedule tidak lengkap." }
  }
  const token = accessToken.trim()
  const result = await rescheduleBySelf({ accessToken: token, newScheduleId }, deps ?? createRescheduleDeps())
  if (result.success) {
    try {
      revalidatePath(`/session/${token}`)
      revalidatePath("/admin/bookings")
    } catch {
      // not in a request context (tests)
    }
  }
  return result
}
