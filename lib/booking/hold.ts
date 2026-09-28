import crypto from "crypto"

export const SLOT_HOLD_MINUTES = 17 // 15-minute Xendit invoice + 2-minute latency buffer per CONTEXT.md
export const XENDIT_INVOICE_DURATION_SECONDS = 900 // 15 minutes

export interface OfficialBankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountHolder: string
  badge: string
}

export const OFFICIAL_BANK_ACCOUNTS: OfficialBankAccount[] = [
  {
    id: "bca",
    bankName: "Bank BCA",
    accountNumber: "1234567890",
    accountHolder: "PT Solulu Kesehatan Indonesia",
    badge: "Verifikasi Cepat",
  },
  {
    id: "mandiri",
    bankName: "Bank Mandiri",
    accountNumber: "1370001234567",
    accountHolder: "PT Solulu Kesehatan Indonesia",
    badge: "Transfer Online",
  },
  {
    id: "bri",
    bankName: "Bank BRI",
    accountNumber: "001201000123456",
    accountHolder: "PT Solulu Kesehatan Indonesia",
    badge: "Transfer Online",
  },
]

/**
 * Computes the reserved_until timestamp: NOW() + 17 minutes
 */
export function computeHoldExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + SLOT_HOLD_MINUTES * 60 * 1000)
}

/**
 * Checks whether a slot hold has expired
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
