"use server"

import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"
import { db } from "@/db"
import { recordAudit } from "@/lib/audit/record"
import { publicDocumentations } from "@/db/schema"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/lib/auth/admin"

export interface GalleryInput {
  title: string
  category: string
  r2Url: string
  caption?: string
  isActive?: boolean
}

export async function getGalleryAdminAction(options?: {
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
      .from(publicDocumentations)
      .orderBy(desc(publicDocumentations.createdAt))

    return {
      success: true,
      data: rows,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil data galeri dokumentasi.",
    }
  }
}

export async function createGalleryAdminAction(
  input: GalleryInput,
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
    const inserted = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(publicDocumentations)
        .values({
          imageUrl: input.r2Url,
          caption: input.caption || input.title || "Dokumentasi Kegiatan Solulu",
          isCensoredAndConsented: true,
          isPublished: input.isActive ?? true,
          uploadedBy:
            admin.id && admin.id.length === 36
              ? admin.id
              : "00000000-0000-0000-0000-000000000000",
        })
        .returning()
      await recordAudit(tx, {
        actor: admin,
        action: "gallery.create",
        entityType: "gallery_item",
        entityId: row.id,
        before: null,
        after: row,
      })
      return row
    })

    try {
      revalidatePath("/admin/gallery")
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
      error: err.message || "Gagal menyimpan foto galeri ke database.",
    }
  }
}

export async function deleteGalleryAdminAction(
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
    await db.transaction(async (tx) => {
      const [before] = await tx
        .select()
        .from(publicDocumentations)
        .where(eq(publicDocumentations.id, id))
        .limit(1)
      await tx.delete(publicDocumentations).where(eq(publicDocumentations.id, id))
      await recordAudit(tx, {
        actor: admin,
        action: "gallery.delete",
        entityType: "gallery_item",
        entityId: id,
        before,
        after: null,
      })
    })

    try {
      revalidatePath("/admin/gallery")
    } catch {
      // safe fallback
    }

    return {
      success: true,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menghapus foto galeri.",
    }
  }
}
