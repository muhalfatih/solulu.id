"use server"

import { revalidatePath } from "next/cache"
import { eq, desc, and } from "drizzle-orm"
import { db } from "@/db"
import { testimonials } from "@/db/schema"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/app/admin/counselors/actions"

/**
 * Public action to retrieve featured active testimonials for the public homepage.
 * Gracefully falls back to active testimonials if fewer than 3 are explicitly marked as featured.
 */
export async function getFeaturedTestimonialsForHomepageAction() {
  try {
    let rows = await db
      .select({
        id: testimonials.id,
        clientName: testimonials.clientName,
        isAnonymous: testimonials.isAnonymous,
        anonymousDisplay: testimonials.anonymousDisplay,
        sessionCode: testimonials.sessionCode,
        counselorName: testimonials.counselorName,
        counselorType: testimonials.counselorType,
        rating: testimonials.rating,
        quoteHighlight: testimonials.quoteHighlight,
        comment: testimonials.comment,
        topic: testimonials.topic,
        isActive: testimonials.isActive,
        isFeatured: testimonials.isFeatured,
      })
      .from(testimonials)
      .where(and(eq(testimonials.isActive, true), eq(testimonials.isFeatured, true)))
      .orderBy(desc(testimonials.createdAt))
      .limit(6)

    if (!rows || rows.length === 0) {
      rows = await db
        .select({
          id: testimonials.id,
          clientName: testimonials.clientName,
          isAnonymous: testimonials.isAnonymous,
          anonymousDisplay: testimonials.anonymousDisplay,
          sessionCode: testimonials.sessionCode,
          counselorName: testimonials.counselorName,
          counselorType: testimonials.counselorType,
          rating: testimonials.rating,
          quoteHighlight: testimonials.quoteHighlight,
          comment: testimonials.comment,
          topic: testimonials.topic,
          isActive: testimonials.isActive,
          isFeatured: testimonials.isFeatured,
        })
        .from(testimonials)
        .where(eq(testimonials.isActive, true))
        .orderBy(desc(testimonials.createdAt))
        .limit(6)
    }

    return {
      success: true,
      data: rows,
    }
  } catch (err: any) {
    console.error("Failed to fetch featured testimonials for homepage:", err)
    return {
      success: false,
      error: err.message || "Gagal mengambil data ulasan testimoni.",
      data: [],
    }
  }
}

export interface TestimonialInput {
  clientName: string // Nama (Sebagai Anonim)
  isAnonymous?: boolean
  anonymousDisplay?: string
  sessionCode?: string
  counselorName?: string
  counselorType?: string
  rating?: number
  quoteHighlight: string // Subjek testimoni
  comment: string // Isi ulasan
  topic: string // Topik masalah (fokus & spesialisasi)
  isActive: boolean
  isFeatured?: boolean
}

export async function getTestimonialsAdminAction(options?: {
  currentUser?: AdminAuthContext | null
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const rows = await db
      .select()
      .from(testimonials)
      .orderBy(desc(testimonials.createdAt))

    return {
      success: true,
      data: rows,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil data ulasan testimoni.",
    }
  }
}

export async function createTestimonialAdminAction(
  input: TestimonialInput,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const [inserted] = await db
      .insert(testimonials)
      .values({
        clientName: input.clientName,
        isAnonymous: input.isAnonymous ?? true,
        anonymousDisplay: input.anonymousDisplay || input.clientName,
        sessionCode: input.sessionCode || null,
        counselorName: input.counselorName || "Solulu",
        counselorType: input.counselorType || "Konselor",
        rating: input.rating ?? 5,
        quoteHighlight: input.quoteHighlight,
        comment: input.comment,
        topic: input.topic,
        isActive: input.isActive,
        isFeatured: input.isFeatured ?? input.isActive,
      })
      .returning()

    try {
      revalidatePath("/admin/testimonials")
      revalidatePath("/")
    } catch {
      // safe fallback
    }

    return {
      success: true,
      data: inserted,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menambahkan ulasan.",
    }
  }
}

export async function updateTestimonialAdminAction(
  id: string,
  input: Partial<TestimonialInput>,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const [updated] = await db
      .update(testimonials)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(testimonials.id, id))
      .returning()

    try {
      revalidatePath("/admin/testimonials")
      revalidatePath("/")
    } catch {
      // safe fallback
    }

    return {
      success: true,
      data: updated,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui ulasan.",
    }
  }
}

export async function toggleTestimonialActiveAction(
  id: string,
  isActive: boolean,
  options?: { currentUser?: AdminAuthContext | null }
) {
  return updateTestimonialAdminAction(id, { isActive }, options)
}

export async function deleteTestimonialAdminAction(
  id: string,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    await db.delete(testimonials).where(eq(testimonials.id, id))

    try {
      revalidatePath("/admin/testimonials")
      revalidatePath("/")
    } catch {
      // safe fallback
    }

    return {
      success: true,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menghapus ulasan.",
    }
  }
}
