"use server"

import { revalidatePath } from "next/cache"
import { getAuthenticatedAdmin, type AdminAuthContext } from "@/app/admin/counselors/actions"
import {
  listAllServices,
  updateServiceBySlug,
  type ServiceRecord,
  type ServicePatch,
} from "@/lib/services/repository"

/**
 * Transitional admin surface for the two seed Layanan (ADR-0010). The full Layanan
 * management UI (create, deactivate, payout split, allowed types) is a separate ticket (#25).
 */
export interface RolePricing {
  serviceId: string
  basePrice: number
  promoPrice: number
  isSaleActive: boolean
  allowVoucher: boolean
  overtimeRatePer30Min: number
}

export interface PlatformPricingData {
  peer: RolePricing | null
  psychologist: RolePricing | null
}

const SEED_SERVICE_SLUG = {
  sebaya: "partner-cerita",
  psikolog: "psikolog-klinis",
} as const

function toRolePricing(service: ServiceRecord | undefined): RolePricing | null {
  if (!service) return null
  const promo = service.promoPrice === null ? null : Number(service.promoPrice)
  return {
    serviceId: service.id,
    basePrice: Number(service.basePrice),
    promoPrice: promo ?? 0,
    isSaleActive: promo !== null,
    allowVoucher: service.allowVoucher,
    overtimeRatePer30Min: Number(service.overtimeRatePer30Min),
  }
}

export async function getPlatformPricingAction(options?: {
  listServicesFn?: () => Promise<ServiceRecord[]>
}): Promise<{
  success: boolean
  data: PlatformPricingData
}> {
  const rows = options?.listServicesFn ? await options.listServicesFn() : await listAllServices()
  return {
    success: true,
    data: {
      peer: toRolePricing(rows.find((r) => r.slug === SEED_SERVICE_SLUG.sebaya)),
      psychologist: toRolePricing(rows.find((r) => r.slug === SEED_SERVICE_SLUG.psikolog)),
    },
  }
}

export async function updateRolePricingAction(
  roleId: "sebaya" | "psikolog",
  data: {
    regularPrice: number
    salePrice: number
    isSaleActive: boolean
    allowVoucher: boolean
    overtimeRatePer30Min?: number
  },
  options?: {
    currentUser?: AdminAuthContext | null
    updateServiceFn?: (slug: string, patch: ServicePatch) => Promise<ServiceRecord | null>
  }
): Promise<{
  success: boolean
  data?: RolePricing
  error?: string
  message?: string
}> {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin atau Superadmin.",
    }
  }

  if (!(data.regularPrice > 0)) {
    return { success: false, error: "Tarif dasar harus lebih dari 0." }
  }
  if (data.isSaleActive && !(data.salePrice >= 0 && data.salePrice < data.regularPrice)) {
    return { success: false, error: "Tarif promo harus lebih rendah dari tarif dasar." }
  }
  if (data.overtimeRatePer30Min !== undefined && !(data.overtimeRatePer30Min >= 0)) {
    return { success: false, error: "Tarif perpanjangan tidak boleh negatif." }
  }

  try {
    const patch: ServicePatch = {
      basePrice: String(data.regularPrice),
      promoPrice: data.isSaleActive ? String(data.salePrice) : null,
      allowVoucher: data.allowVoucher,
    }
    if (data.overtimeRatePer30Min !== undefined) {
      patch.overtimeRatePer30Min = String(data.overtimeRatePer30Min)
    }

    const slug = SEED_SERVICE_SLUG[roleId]
    const updatedRow = options?.updateServiceFn
      ? await options.updateServiceFn(slug, patch)
      : await updateServiceBySlug(slug, patch)
    if (!updatedRow) {
      return { success: false, error: `Layanan "${slug}" belum ada di database.` }
    }

    try {
      revalidatePath("/")
      revalidatePath("/pricing")
      revalidatePath("/counselors")
      revalidatePath("/booking")
      revalidatePath("/admin/pricing")
      revalidatePath("/admin/settings")
    } catch {
      // Safe fallback when running outside of Next.js HTTP server context (e.g. unit tests)
    }

    const roleName = roleId === "sebaya" ? "Konselor Sebaya" : "Psikolog Klinis"
    return {
      success: true,
      data: toRolePricing(updatedRow) ?? undefined,
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

