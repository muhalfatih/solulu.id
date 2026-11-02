"use server"

import { revalidatePath } from "next/cache"
import {
  getPlatformSettings,
  updatePlatformSettings,
  type PlatformSettingsData,
  type AuthContext,
} from "@/lib/settings/platform"
import { requireStaffUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, SUPERADMIN_ONLY, hasStaffRole } from "@/lib/auth/staff-role"

async function getAuthenticatedUser(
  customUser?: AuthContext | null
): Promise<{ user: AuthContext | null; isSuperadmin: boolean; isAdmin: boolean }> {
  const user = await requireStaffUser(customUser, ADMIN_ROLES)
  return {
    user,
    isSuperadmin: hasStaffRole(user, SUPERADMIN_ONLY),
    isAdmin: user !== null,
  }
}

/**
 * Fetch all platform settings with user role context.
 */
export async function getPlatformSettingsAction(options?: {
  currentUser?: AuthContext | null
}) {
  const { user, isSuperadmin, isAdmin } = await getAuthenticatedUser(options?.currentUser)
  if (!isAdmin && !isSuperadmin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin atau Superadmin.",
      settings: null,
      isSuperadmin: false,
    }
  }

  try {
    const settings = await getPlatformSettings()
    return {
      success: true,
      settings,
      isSuperadmin,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal memuat pengaturan sistem.",
      settings: null,
      isSuperadmin,
    }
  }
}

/**
 * Update platform operational parameters (Superadmin only).
 */
export async function updatePlatformSettingsAction(
  data: Partial<PlatformSettingsData>,
  options?: { currentUser?: AuthContext | null }
) {
  const { user, isSuperadmin } = await getAuthenticatedUser(options?.currentUser)

  if (!isSuperadmin) {
    return {
      success: false,
      error: "Akses ditolak: Hanya peran Superadmin yang berwenang mengubah parameter sistem.",
    }
  }

  try {
    const updated = await updatePlatformSettings(data, {
      currentUser: user,
      skipAuthCheck: false,
    })

    try {
      revalidatePath("/admin/settings")
      revalidatePath("/admin/zoom")
      revalidatePath("/admin/zoom-settings")
      revalidatePath("/admin")
      revalidatePath("/counselors")
      revalidatePath("/booking")
      revalidatePath("/pricing")
      revalidatePath("/")
    } catch {
      // Ignore cache revalidation errors in non-request test contexts
    }

    return {
      success: true,
      settings: updated,
      message: "Pengaturan sistem berhasil diperbarui secara langsung.",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Gagal menyimpan perubahan pengaturan.",
    }
  }
}

/**
 * Legacy/shortcut action for SRQ-20 screening status.
 */
export async function getScreeningSettingAction() {
  const settings = await getPlatformSettings()
  return {
    success: true,
    isScreeningRequired: settings.isScreeningRequired,
  }
}

/**
 * Legacy/shortcut action to toggle screening requirement.
 */
export async function toggleScreeningRequiredAction(isRequired: boolean) {
  try {
    const { isSuperadmin } = await getAuthenticatedUser()
    const updated = await updatePlatformSettings(
      { isScreeningRequired: isRequired },
      { skipAuthCheck: !isSuperadmin ? false : true }
    )

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
