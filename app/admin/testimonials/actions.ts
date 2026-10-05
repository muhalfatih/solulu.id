"use server"

import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"
import { db } from "@/db"
import { testimonials } from "@/db/schema"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/app/admin/counselors/actions"

export interface TestimonialInput {
  clientName: string
  isAnonymous: boolean
  anonymousDisplay: string
  sessionCode?: string
  counselorName: string
  counselorType: string
  rating: number
  quoteHighlight: string
  comment: string
  topic: string
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
        isAnonymous: input.isAnonymous,
        anonymousDisplay: input.anonymousDisplay,
        sessionCode: input.sessionCode || `SES-${Math.floor(1000 + Math.random() * 9000)}`,
        counselorName: input.counselorName,
        counselorType: input.counselorType,
        rating: input.rating,
        quoteHighlight: input.quoteHighlight,
        comment: input.comment,
        topic: input.topic,
        isActive: input.isActive,
        isFeatured: input.isFeatured ?? false,
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
