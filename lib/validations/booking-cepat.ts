import { z } from "zod"
import { indonesianPhoneRegex } from "./booking"

/** Tiga cara bayar Booking Cepat (#30). */
export const BOOKING_CEPAT_WAYS = ["xendit", "transfer", "manual_zero"] as const
export type BookingCepatWay = (typeof BOOKING_CEPAT_WAYS)[number]

export const bookingCepatSchema = z.object({
  counselorId: z.string().min(1, "Pilih konselor"),
  scheduleId: z.string().min(1, "Pilih slot jadwal"),
  serviceId: z.string().min(1, "Pilih Layanan"),
  patientName: z.string().trim().min(2, "Nama klien minimal 2 karakter").max(100, "Nama klien maksimal 100 karakter"),
  patientEmail: z.string().trim().email("Format email tidak valid").toLowerCase(),
  patientPhone: z
    .string()
    .trim()
    .regex(indonesianPhoneRegex, "Nomor WhatsApp harus nomor Indonesia yang valid (contoh: 08123456789)"),
  initialNotes: z.string().trim().max(1000, "Catatan maksimal 1000 karakter").optional().nullable(),
  payment: z.discriminatedUnion("way", [
    z.object({ way: z.literal("xendit") }),
    z.object({
      way: z.literal("transfer"),
      proofR2Key: z.string().trim().min(1, "Unggah bukti transfer terlebih dahulu"),
      referenceNumber: z.string().trim().max(100).optional().nullable(),
    }),
    z.object({
      way: z.literal("manual_zero"),
      reason: z
        .string()
        .trim()
        .min(3, "Alasan Booking Manual Rp 0 wajib diisi (minimal 3 karakter)")
        .max(500, "Alasan maksimal 500 karakter"),
    }),
  ]),
})

export type BookingCepatInput = z.infer<typeof bookingCepatSchema>
