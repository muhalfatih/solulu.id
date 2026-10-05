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
