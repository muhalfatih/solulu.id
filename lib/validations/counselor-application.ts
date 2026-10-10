import { z } from "zod"

export const counselorTypeSchema = z.enum(["peer", "psychologist"])
export type CounselorType = z.infer<typeof counselorTypeSchema>

export const counselorApplicationInputSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama lengkap maksimal 100 karakter"),
    email: z.string().email("Format alamat email tidak valid"),
    phone: z
      .string()
      .min(10, "Nomor telepon/WhatsApp minimal 10 digit")
      .max(16, "Nomor telepon/WhatsApp maksimal 16 digit")
      .regex(
        /^(\+62|62|0)[0-9]{8,14}$/,
        "Nomor telepon harus format Indonesia yang valid (contoh: 08123456789 atau +628123456789)"
      ),
    counselorType: counselorTypeSchema,
    bio: z
      .string()
      .min(20, "Deskripsi profil dan latar belakang minimal 20 karakter")
      .max(1500, "Deskripsi profil maksimal 1500 karakter"),
    cvR2Key: z.string().min(1, "Dokumen CV/Resume wajib diunggah"),
    ktpR2Key: z.string().min(1, "Dokumen KTP wajib diunggah"),
    diplomaR2Key: z.string().min(1, "Dokumen Ijazah wajib diunggah"),
    strR2Key: z.string().optional().nullable(),
    agreeToTerms: z.literal(true, {
      error: "Anda wajib menyetujui syarat & ketentuan kemitraan Solulu",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.counselorType === "psychologist") {
      if (!data.strR2Key || data.strR2Key.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Surat Tanda Registrasi (STR) aktif wajib diunggah untuk psikolog klinis",
          path: ["strR2Key"],
        })
      }
    }
  })

export type CounselorApplicationInput = z.infer<typeof counselorApplicationInputSchema>

export const presignedUploadRequestSchema = z.object({
  fileType: z.enum([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  fileName: z.string().min(1, "Nama file wajib ada"),
  category: z.enum(["cv", "ktp", "diploma", "str"]),
})

export type PresignedUploadRequest = z.infer<typeof presignedUploadRequestSchema>

export const reviewApplicationInputSchema = z.object({
  applicationId: z.string().uuid("ID aplikasi tidak valid"),
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().max(500, "Alasan penolakan maksimal 500 karakter").optional(),
  title: z.string().max(50, "Gelar/titel maksimal 50 karakter").optional(),
  initialPassword: z.string().min(8, "Kata sandi minimal 8 karakter").max(100).optional(),
})

export type ReviewApplicationInput = z.infer<typeof reviewApplicationInputSchema>
