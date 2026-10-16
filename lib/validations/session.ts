import { z } from "zod"
import { indonesianPhoneRegex } from "./booking"

export const recoverSessionSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi")
    .regex(
      indonesianPhoneRegex,
      "Nomor WhatsApp harus nomor Indonesia yang valid (contoh: 08123456789 atau +628123456789)"
    ),
})

export type RecoverSessionInput = z.infer<typeof recoverSessionSchema>

/**
 * Normalizes Indonesian phone numbers into standardized local format (08XXXXXXXXX)
 * Handles +62, 62, leading dashes, spaces, and leading zeros.
 */
export function normalizeIndonesianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("62")) {
    return "0" + digits.slice(2)
  }
  if (!digits.startsWith("0") && digits.length >= 9) {
    return "0" + digits
  }
  return digits
}

/**
 * Schema for unlocking official clinical session reports via registered WhatsApp number
 */
export const unlockReportSchema = z.object({
  accessToken: z.string().trim().min(1, "Token sesi wajib diisi"),
  phone: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi")
    .regex(
      indonesianPhoneRegex,
      "Nomor WhatsApp harus nomor Indonesia yang valid (contoh: 08123456789 atau +628123456789)"
    ),
})

export type UnlockReportInput = z.infer<typeof unlockReportSchema>

/**
 * Schema for settling extend session bills (>90 min) via Dual Payments (Xendit vs Manual BCA)
 */
export const extensionPaymentSchema = z
  .object({
    accessToken: z.string().trim().min(1, "Token sesi wajib diisi"),
    paymentMethod: z.enum(["xendit", "manual_bank_transfer"]),
    proofR2Key: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.paymentMethod === "manual_bank_transfer" && (!data.proofR2Key || data.proofR2Key.trim() === "")) {
        return false
      }
      return true
    },
    {
      message: "Bukti transfer wajib diunggah untuk metode transfer bank manual",
      path: ["proofR2Key"],
    }
  )

export type ExtensionPaymentInput = z.infer<typeof extensionPaymentSchema>

