import { z } from "zod"

/**
 * Rekening bank konselor untuk transfer massal honor (ADR-0007).
 * Nomor rekening dinormalkan menjadi digit saja (spasi dan strip dibuang).
 */
export const bankAccountSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(2, "Nama bank wajib diisi")
    .max(60, "Nama bank maksimal 60 karakter"),
  accountNumber: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d+$/, "Nomor rekening hanya boleh berisi angka")
        .min(6, "Nomor rekening minimal 6 digit")
        .max(20, "Nomor rekening maksimal 20 digit")
    ),
  accountHolder: z
    .string()
    .trim()
    .min(3, "Nama pemilik rekening wajib diisi (minimal 3 karakter)")
    .max(100, "Nama pemilik rekening maksimal 100 karakter"),
})

export type BankAccountInput = z.input<typeof bankAccountSchema>
export type BankAccount = z.output<typeof bankAccountSchema>
