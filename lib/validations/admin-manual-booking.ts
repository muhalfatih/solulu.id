import { z } from "zod"
import { indonesianPhoneRegex } from "./booking"

export const adminManualBookingSchema = z
  .object({
    counselorId: z.string().min(1, "Pilih mitra konselor yang valid"),
    scheduleMode: z.enum(["existing", "adhoc"], {
      message: "Pilih opsi jadwal (slot tersedia atau jadwal ad-hoc)",
    }),
    scheduleId: z.string().min(1, "ID slot jadwal tidak valid").optional().nullable(),
    adhocDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)")
      .optional()
      .nullable(),
    adhocStartTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam mulai tidak valid (HH:mm)")
      .optional()
      .nullable(),
    patientName: z
      .string()
      .trim()
      .min(2, "Nama lengkap pasien minimal 2 karakter")
      .max(100, "Nama lengkap pasien maksimal 100 karakter"),
    patientEmail: z
      .string()
      .trim()
      .email("Format email pasien tidak valid")
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
    adminNotes: z
      .string()
      .trim()
      .min(3, "Catatan audit alasan bypass minimal 3 karakter")
      .max(500, "Catatan audit maksimal 500 karakter")
      .optional()
      .default("Booking manual via Admin Console"),
    createZoom: z.boolean().default(true),
    manualMeetingUrl: z
      .string()
      .trim()
      .url("Tautan rapat manual harus berupa URL yang valid (misal: https://meet.google.com/...)")
      .optional()
      .nullable()
      .or(z.literal("")),
    sendConfirmationEmail: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.scheduleMode === "existing") {
      if (!data.scheduleId || data.scheduleId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pilih salah satu slot jadwal konselor yang tersedia",
          path: ["scheduleId"],
        })
      }
    } else if (data.scheduleMode === "adhoc") {
      if (!data.adhocDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal sesi ad-hoc wajib dipilih",
          path: ["adhocDate"],
        })
      }
      if (!data.adhocStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jam mulai sesi ad-hoc wajib dipilih",
          path: ["adhocStartTime"],
        })
      }
    }

    if (!data.createZoom && (!data.manualMeetingUrl || data.manualMeetingUrl.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tautan rapat manual wajib diisi jika pembuatan Zoom otomatis dinonaktifkan",
        path: ["manualMeetingUrl"],
      })
    }
  })

export type AdminManualBookingInput = z.infer<typeof adminManualBookingSchema>
