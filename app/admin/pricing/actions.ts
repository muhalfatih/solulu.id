"use server"

import { revalidatePath } from "next/cache"
import { getAuthenticatedAdmin, type AdminAuthContext } from "@/app/admin/counselors/actions"
import { requireStaffUser } from "@/lib/auth/staff"
import { recordAudit } from "@/lib/audit/record"
import { SUPERADMIN_ONLY } from "@/lib/auth/staff-role"

const SUPERADMIN_ONLY_MESSAGE =
  "Akses ditolak: Hanya peran Superadmin yang berwenang mengubah tarif dan voucher. Admin hanya dapat melihat."

import { db } from "@/db"
import { vouchers } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export interface VoucherInput {
  code: string
  discountType: "fixed" | "percentage"
  discountValue: number
  quota: number
  expiresAt?: string | Date | null
  isActive?: boolean
}

export async function getVouchersAdminAction(options?: {
  currentUser?: AdminAuthContext | null
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
      data: [],
    }
  }

  try {
    const rows = await db
      .select()
      .from(vouchers)
      .orderBy(desc(vouchers.createdAt))

    return {
      success: true,
      data: rows,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil daftar voucher dari database.",
      data: [],
    }
  }
}

export async function createVoucherAdminAction(
  input: VoucherInput,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const superadmin = await requireStaffUser(options?.currentUser, SUPERADMIN_ONLY)
  if (!superadmin) {
    return {
      success: false,
      error: SUPERADMIN_ONLY_MESSAGE,
    }
  }

  try {
    const inserted = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(vouchers)
        .values({
          code: input.code.toUpperCase().trim(),
          discountType: input.discountType,
          discountValue: String(input.discountValue),
          quota: input.quota,
          usedCount: 0,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          isActive: input.isActive ?? true,
        })
        .returning()
      await recordAudit(tx, {
        actor: superadmin,
        action: "voucher.create",
        entityType: "voucher",
        entityId: row.id,
        before: null,
        after: row,
      })
      return row
    })

    try {
      revalidatePath("/admin/pricing")
      revalidatePath("/admin/settings")
      revalidatePath("/booking")
    } catch {}

    return {
      success: true,
      data: inserted,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menambahkan voucher baru ke database.",
    }
  }
}

export async function toggleVoucherStatusAction(
  id: string,
  isActive: boolean,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const superadmin = await requireStaffUser(options?.currentUser, SUPERADMIN_ONLY)
  if (!superadmin) {
    return {
      success: false,
      error: SUPERADMIN_ONLY_MESSAGE,
    }
  }

  try {
    const updated = await db.transaction(async (tx) => {
      const [before] = await tx.select().from(vouchers).where(eq(vouchers.id, id)).limit(1)
      const [row] = await tx
        .update(vouchers)
        .set({ isActive })
        .where(eq(vouchers.id, id))
        .returning()
      await recordAudit(tx, {
        actor: superadmin,
        action: "voucher.toggle",
        entityType: "voucher",
        entityId: id,
        before,
        after: row,
      })
      return row
    })

    try {
      revalidatePath("/admin/pricing")
      revalidatePath("/admin/settings")
      revalidatePath("/booking")
    } catch {}

    return {
      success: true,
      data: updated,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui status voucher.",
    }
  }
}

export async function deleteVoucherAdminAction(
  id: string,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const superadmin = await requireStaffUser(options?.currentUser, SUPERADMIN_ONLY)
  if (!superadmin) {
    return {
      success: false,
      error: SUPERADMIN_ONLY_MESSAGE,
    }
  }

  try {
    await db.transaction(async (tx) => {
      const [before] = await tx.select().from(vouchers).where(eq(vouchers.id, id)).limit(1)
      await tx.delete(vouchers).where(eq(vouchers.id, id))
      await recordAudit(tx, {
        actor: superadmin,
        action: "voucher.delete",
        entityType: "voucher",
        entityId: id,
        before,
        after: null,
      })
    })

    try {
      revalidatePath("/admin/pricing")
      revalidatePath("/admin/settings")
      revalidatePath("/booking")
    } catch {}

    return {
      success: true,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menghapus voucher dari database.",
    }
  }
}

