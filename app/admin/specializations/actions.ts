"use server"

import { revalidatePath } from "next/cache"
import { eq, desc, asc } from "drizzle-orm"
import { db } from "@/db"
import { specializations } from "@/db/schema"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/app/admin/counselors/actions"

export interface SpecializationItem {
  id: string
  name: string
  description: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateSpecializationInput {
  name: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateSpecializationInput {
  id: string
  name: string
  description?: string
  isActive?: boolean
  sortOrder?: number
}

/**
 * Fetches all specializations for admin management table.
 */
export async function getSpecializationsAdminAction(options?: {
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
      .from(specializations)
      .orderBy(asc(specializations.sortOrder), asc(specializations.name))

    return {
      success: true,
      data: rows as SpecializationItem[],
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil daftar spesialisasi.",
    }
  }
}

/**
 * Fetches only active specializations (used by counselor form selector).
 */
export async function getActiveSpecializationsAction() {
  try {
    const rows = await db
      .select({
        id: specializations.id,
        name: specializations.name,
        description: specializations.description,
        sortOrder: specializations.sortOrder,
      })
      .from(specializations)
      .where(eq(specializations.isActive, true))
      .orderBy(asc(specializations.sortOrder), asc(specializations.name))

    return {
      success: true,
      data: rows,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil daftar topik aktif.",
    }
  }
}

/**
 * Creates a new specialization in admin database.
 */
export async function createSpecializationAction(
  input: CreateSpecializationInput,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  const cleanName = input.name?.trim()
  if (!cleanName || cleanName.length < 2) {
    return {
      success: false,
      error: "Nama topik spesialisasi minimal 2 karakter.",
    }
  }

  try {
    const [inserted] = await db
      .insert(specializations)
      .values({
        name: cleanName,
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
        updatedAt: new Date(),
      })
      .returning()

    revalidatePath("/admin/specializations")
    revalidatePath("/admin/counselors/new")
    revalidatePath("/admin/counselors/[id]/edit")
    revalidatePath("/counselors")

    return {
      success: true,
      data: inserted,
      message: `Topik spesialisasi "${cleanName}" berhasil ditambahkan.`,
    }
  } catch (err: any) {
    if (err.message?.includes("unique") || err.code === "23505") {
      return {
        success: false,
        error: `Topik spesialisasi "${cleanName}" sudah terdaftar.`,
      }
    }
    return {
      success: false,
      error: err.message || "Gagal menambahkan topik spesialisasi.",
    }
  }
}

/**
 * Updates an existing specialization.
 */
export async function updateSpecializationAction(
  input: UpdateSpecializationInput,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  const cleanName = input.name?.trim()
  if (!cleanName || cleanName.length < 2) {
    return {
      success: false,
      error: "Nama topik spesialisasi minimal 2 karakter.",
    }
  }

  try {
    const [updated] = await db
      .update(specializations)
      .set({
        name: cleanName,
        description: input.description?.trim() || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(specializations.id, input.id))
      .returning()

    revalidatePath("/admin/specializations")
    revalidatePath("/admin/counselors/new")
    revalidatePath("/admin/counselors/[id]/edit")
    revalidatePath("/counselors")

    return {
      success: true,
      data: updated,
      message: `Topik "${cleanName}" berhasil diperbarui.`,
    }
  } catch (err: any) {
    if (err.message?.includes("unique") || err.code === "23505") {
      return {
        success: false,
        error: `Topik "${cleanName}" sudah terdaftar dengan nama yang sama.`,
      }
    }
    return {
      success: false,
      error: err.message || "Gagal memperbarui topik spesialisasi.",
    }
  }
}

/**
 * Toggles the active status of a specialization.
 */
export async function toggleSpecializationAction(
  id: string,
  isActive: boolean,
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
      .update(specializations)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(specializations.id, id))
      .returning()

    revalidatePath("/admin/specializations")
    revalidatePath("/admin/counselors/new")
    revalidatePath("/admin/counselors/[id]/edit")

    return {
      success: true,
      data: updated,
      message: `Status topik berhasil diubah.`,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengubah status topik.",
    }
  }
}

/**
 * Deletes a specialization from database.
 */
export async function deleteSpecializationAction(
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
    await db.delete(specializations).where(eq(specializations.id, id))

    revalidatePath("/admin/specializations")
    revalidatePath("/admin/counselors/new")
    revalidatePath("/admin/counselors/[id]/edit")
    revalidatePath("/counselors")

    return {
      success: true,
      message: "Topik spesialisasi berhasil dihapus.",
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menghapus topik spesialisasi.",
    }
  }
}
