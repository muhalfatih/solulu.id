"use server"

import { revalidatePath } from "next/cache"
import { getPlatformSettings, updatePlatformSettings } from "@/lib/settings/platform"

export async function getScreeningSettingAction() {
  const settings = await getPlatformSettings()
  return {
    success: true,
    isScreeningRequired: settings.isScreeningRequired,
  }
}

export async function toggleScreeningRequiredAction(isRequired: boolean) {
  try {
    const updated = await updatePlatformSettings({
      isScreeningRequired: isRequired,
    })

    revalidatePath("/admin/settings")
    revalidatePath("/counselors")
    revalidatePath("/booking")

    return {
      success: true,
      isScreeningRequired: updated.isScreeningRequired,
      message: updated.isScreeningRequired
        ? "Skrining SRQ-20 kini diwajibkan bagi seluruh pasien sebelum booking."
        : "Skrining SRQ-20 kini bersifat opsional (pasien dapat melewati ke pembayaran).",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal memperbarui pengaturan",
    }
  }
}
