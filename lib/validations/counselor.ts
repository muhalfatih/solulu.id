import { z } from "zod"

export const sessionReportSchema = z.object({
  bookingId: z.string().uuid("ID booking tidak valid"),
  attendanceStatus: z.enum(["attended", "no_show"]).optional().default("attended"),
  mainIssue: z
    .string()
    .trim()
    .min(3, "Permasalahan utama wajib diisi (minimal 3 karakter)")
    .default("Konsultasi Emosional & Stres"),
  summary: z
    .string()
    .trim()
    .min(20, "Ringkasan sesi minimal harus berisi 20 karakter"),
  actionPlan: z
    .string()
    .trim()
    .refine(
      (val) => !val || val.length >= 20,
      "Rencana aksi/tindak lanjut minimal harus berisi 20 karakter jika diisi"
    )
    .optional()
    .nullable(),
  internalNotes: z.string().trim().optional().nullable(),
  followUpRecommendation: z.string().trim().optional().nullable(),
  attachmentR2Keys: z.array(z.string().min(1)).optional().default([]),
})

export type SessionReportInput = z.input<typeof sessionReportSchema>
export type SessionReportOutput = z.output<typeof sessionReportSchema>

export const counselorProfileSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Gelar/Profesi minimal 2 karakter")
    .max(100, "Gelar/Profesi maksimal 100 karakter"),
  bio: z
    .string()
    .trim()
    .min(20, "Bio profil minimal 20 karakter agar pasien mengenal pendekatan Anda")
    .max(2000, "Bio profil maksimal 2000 karakter"),
  specializations: z
    .array(z.string().trim().min(2, "Spesialisasi minimal 2 karakter"))
    .min(1, "Pilih atau tuliskan minimal 1 topik spesialisasi"),
  avatarR2Url: z.string().url("URL avatar tidak valid").optional().nullable().or(z.literal("")),
})

export type CounselorProfileInput = z.infer<typeof counselorProfileSchema>

export const presignedUploadRequestSchema = z.object({
  type: z.enum(["avatar", "report_attachment"]),
  fileName: z.string().min(1, "Nama file wajib diisi"),
  contentType: z.string().min(1, "Content-Type file wajib diisi"),
  bookingId: z.string().uuid("ID booking tidak valid").optional(),
})

export type PresignedUploadRequestInput = z.infer<typeof presignedUploadRequestSchema>
