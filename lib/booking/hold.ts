import crypto from "crypto"
import { SLOT_HOLD_MINUTES, holdExpiresAt } from "@/lib/booking-cycle"

export { SLOT_HOLD_MINUTES }
export const XENDIT_INVOICE_DURATION_SECONDS = 900 // 15 minutes

/**
 * Computes the reserved_until timestamp: NOW() + 17 minutes
 */
export function computeHoldExpiry(now: Date = new Date()): Date {
  return holdExpiresAt(now, "public")
}

/**
 * Checks whether a stored reserved_until deadline has passed.
 * (Duration rules per hold source live in lib/booking-cycle.)
 */
export function isHoldExpired(
  reservedUntil: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!reservedUntil) return true
  const expiry = typeof reservedUntil === "string" ? new Date(reservedUntil) : reservedUntil
  return now.getTime() > expiry.getTime()
}

/**
 * Generates a 32-character cryptographically secure access token for /session/[token]
 */
export function generateSessionAccessToken(): string {
  return crypto.randomBytes(16).toString("hex")
}

/**
 * Generates a human-friendly reference number for transactions: e.g. SOL-20261015-A1B2
 */
export function generateReferenceNumber(date: Date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase()
  return `SOL-${yyyy}${mm}${dd}-${rand}`
}
