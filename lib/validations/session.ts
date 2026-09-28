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
