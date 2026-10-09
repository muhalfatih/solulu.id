"use server"

import { revalidatePath } from "next/cache"
import {
  getPlatformPricing,
  updatePlatformPricing,
  type RolePricing,
  type PlatformPricingData,
} from "@/lib/pricing/platform-pricing"

export async function getPlatformPricingAction(): Promise<{
  success: boolean
  data: PlatformPricingData
}> {
  const data = await getPlatformPricing()
  return {
    success: true,
    data,
  }
}

export async function updateRolePricingAction(
  roleId: "sebaya" | "psikolog",
  data: {
    regularPrice: number
    salePrice: number
    isSaleActive: boolean
    allowVoucher: boolean
  }
): Promise<{
  success: boolean
  data?: RolePricing
  error?: string
  message?: string
}> {
  try {
    const counselorType = roleId === "sebaya" ? "peer" : "psychologist"
    const updated = await updatePlatformPricing(counselorType, {
      basePrice: data.regularPrice,
      promoPrice: data.salePrice,
      isSaleActive: data.isSaleActive,
      allowVoucher: data.allowVoucher,
    })

    try {
      revalidatePath("/")
      revalidatePath("/pricing")
      revalidatePath("/counselors")
      revalidatePath("/booking")
      revalidatePath("/admin/pricing")
    } catch {
      // Safe fallback when running outside of Next.js HTTP server context (e.g. unit tests)
    }

    const roleName = roleId === "sebaya" ? "Konselor Sebaya" : "Psikolog Klinis"
    return {
      success: true,
      data: updated,
      message: `Tarif untuk ${roleName} berhasil diperbarui dan disinkronkan ke seluruh sistem.`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal memperbarui tarif",
    }
  }
}

import { db } from "@/db"
import { vouchers } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/app/admin/counselors/actions"

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
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const [inserted] = await db
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

    try {
      revalidatePath("/admin/pricing")
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
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const [updated] = await db
      .update(vouchers)
      .set({ isActive })
      .where(eq(vouchers.id, id))
      .returning()

    try {
      revalidatePath("/admin/pricing")
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
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    await db.delete(vouchers).where(eq(vouchers.id, id))

    try {
      revalidatePath("/admin/pricing")
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

