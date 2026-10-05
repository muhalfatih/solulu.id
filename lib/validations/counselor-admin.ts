import { z } from "zod"

export const SOLULU_SPECIALIZATION_PRESETS = [
  "Kecemasan & Stres",
  "Depresi & Mood",
  "Hubungan & Asmara",
  "Keluarga & Relasi",
  "Pengembangan Diri",
  "Karir & Akademik",
  "Burnout & Kelelahan",
  "Trauma & Emosi",
  "Duka & Kehilangan",
  "Quarter-life Crisis",
] as const

export const createCounselorAdminSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  title: z
    .string()
    .trim()
    .min(2, "Gelar profesi minimal 2 karakter (contoh: S.Psi atau M.Psi., Psikolog)")
    .max(100, "Gelar profesi maksimal 100 karakter"),
  counselorType: z.enum(["peer", "psychologist"], {
    message: "Tipe konselor harus Konselor Sebaya atau Psikolog Klinis",
  }),
  email: z
    .string()
    .trim()
    .email("Format alamat email tidak valid")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password akun minimal 8 karakter")
    .max(100, "Password akun maksimal 100 karakter"),
  bio: z
    .string()
    .trim()
    .min(20, "Bio profil minimal 20 karakter agar pasien mengenal profil dan pendekatan konselor")
    .max(2000, "Bio profil maksimal 2000 karakter"),
  specializations: z
    .array(z.string().trim().min(2, "Spesialisasi minimal 2 karakter"))
    .min(1, "Pilih atau tambahkan minimal 1 topik spesialisasi"),
  avatarR2Url: z
    .string()
    .url("URL avatar tidak valid")
    .optional()
    .nullable()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
})

export type CreateCounselorAdminInput = z.infer<typeof createCounselorAdminSchema>

export const updateCounselorAdminSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  title: z
    .string()
    .trim()
    .min(2, "Gelar profesi minimal 2 karakter (contoh: S.Psi atau M.Psi., Psikolog)")
    .max(100, "Gelar profesi maksimal 100 karakter"),
  counselorType: z.enum(["peer", "psychologist"], {
    message: "Tipe konselor harus Konselor Sebaya atau Psikolog Klinis",
  }),
  bio: z
    .string()
    .trim()
    .min(20, "Bio profil minimal 20 karakter")
    .max(2000, "Bio profil maksimal 2000 karakter"),
  specializations: z
    .array(z.string().trim().min(2, "Spesialisasi minimal 2 karakter"))
    .min(1, "Pilih atau tambahkan minimal 1 topik spesialisasi"),
  avatarR2Url: z
    .string()
    .url("URL avatar tidak valid")
    .optional()
    .nullable()
    .or(z.literal("")),
  isActive: z.boolean(),
})

export type UpdateCounselorAdminInput = z.infer<typeof updateCounselorAdminSchema>
