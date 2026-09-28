import { z } from "zod"

export const testimonialValidationSchema = z.object({
  clientName: z.string().trim().min(2, "Nama klien minimal 2 karakter"),
  isAnonymous: z.boolean().default(true),
  anonymousDisplay: z.string().trim().min(1, "Inisial tampilan wajib diisi"),
  sessionCode: z.string().trim().optional(),
  counselorName: z.string().trim().min(2, "Nama konselor minimal 2 karakter"),
  counselorType: z.string().trim().default("Psikolog Klinis"),
  rating: z.number().int().min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
  quoteHighlight: z.string().trim().min(10, "Kutipan utama minimal 10 karakter"),
  comment: z.string().trim().min(20, "Isi testimoni minimal 20 karakter"),
  topic: z.string().trim().min(2, "Topik sesi minimal 2 karakter"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

export type TestimonialInput = z.infer<typeof testimonialValidationSchema>

export const galleryUploadValidationSchema = z.object({
  imageUrl: z.string().url("URL gambar tidak valid"),
  caption: z.string().trim().min(3, "Keterangan foto minimal 3 karakter"),
  isCensoredAndConsented: z.literal(true, {
    message:
      "Persetujuan sensor wajah dan izin klien wajib dicentang untuk perlindungan privasi medis.",
  }),
  isPublished: z.boolean().default(true),
})

export type GalleryUploadInput = z.infer<typeof galleryUploadValidationSchema>

export const adminProfileContactSchema = z.object({
  email: z.string().trim().email("Format email tidak valid"),
  phone: z.string().trim().min(8, "Nomor kontak WhatsApp minimal 8 digit"),
  notifyUrgent: z.boolean().default(true),
  notifyCounselor: z.boolean().default(true),
  notifySession: z.boolean().default(true),
})

export type AdminProfileContactInput = z.infer<typeof adminProfileContactSchema>
