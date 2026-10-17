"use server"

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
