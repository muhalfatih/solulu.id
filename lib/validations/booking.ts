import { z } from "zod"

// Indonesian phone number regex: starts with 08, 62, or +62, followed by 8-13 digits
export const indonesianPhoneRegex = /^(\+62|62|08)[0-9]{8,13}$/

export const validateVoucherSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kode voucher tidak boleh kosong")
    .transform((val) => val.toUpperCase()),
  counselorType: z.enum(["peer", "psychologist"], {
    message: "Tipe konselor tidak valid",
  }),
  grossAmount: z.number().positive("Tarif konseling harus lebih dari 0"),
})

export type ValidateVoucherInput = z.infer<typeof validateVoucherSchema>

export const createGuestBookingSchema = z
  .object({
    scheduleId: z.string().min(1, "ID slot jadwal tidak valid"),
    counselorId: z.string().min(1, "ID konselor tidak valid"),
    screeningId: z.string().min(1, "ID skrining tidak valid").optional().nullable(),

    // Patient info (Guest checkout)
    patientName: z
      .string()
      .trim()
      .min(2, "Nama lengkap minimal 2 karakter")
      .max(100, "Nama lengkap maksimal 100 karakter"),
    patientEmail: z
      .string()
      .trim()
      .email("Format email tidak valid")
      .toLowerCase(),
    patientEmailConfirm: z
      .string()
      .trim()
      .email("Format konfirmasi email tidak valid")
      .toLowerCase(),
    patientPhone: z
      .string()
      .trim()
      .regex(
        indonesianPhoneRegex,
        "Nomor WhatsApp harus nomor Indonesia yang valid (contoh: 08123456789 atau +628123456789)"
      ),
    initialNotes: z
      .string()
      .trim()
      .max(1000, "Catatan awal maksimal 1000 karakter")
      .optional()
      .nullable(),

    // Voucher (Optional)
    voucherCode: z
      .string()
      .trim()
      .transform((val) => (val ? val.toUpperCase() : undefined))
      .optional()
      .nullable(),

    // Payment method
    paymentProvider: z.enum(["xendit", "manual"], {
      message: "Metode pembayaran harus otomatis (Xendit) atau transfer manual",
    }),
    paymentMethod: z.string().trim().optional().nullable(), // e.g. "BCA", "Mandiri", "BRI", "QRIS Statis"
  })
  .refine((data) => data.patientEmail === data.patientEmailConfirm, {
    message: "Konfirmasi email tidak cocok dengan email Anda",
    path: ["patientEmailConfirm"],
  })

export type CreateGuestBookingInput = z.infer<typeof createGuestBookingSchema>
