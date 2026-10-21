"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedAdmin, type AdminAuthContext } from "@/app/admin/counselors/actions"

export interface AdminProfileView {
  id: string
  email: string
  role: "admin" | "superadmin"
  phone: string
  notifyUrgent: boolean
  notifyCounselor: boolean
  notifySession: boolean
}

export interface AdminProfileActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Fetches the authenticated Admin or Superadmin profile and notification preferences.
 */
export async function getAdminProfileDataAction(options?: {
  currentUser?: AdminAuthContext | null
}): Promise<AdminProfileActionResult<AdminProfileView>> {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return { success: false, error: "Akses ditolak: Diperlukan role Admin atau Superadmin." }
  }

  const role = (admin.app_metadata?.role || admin.user_metadata?.role || "admin") as "admin" | "superadmin"
  const email = (admin.user_metadata?.email || (admin as any).email || (role === "superadmin" ? "superadmin@solulu.id" : "admin@solulu.id")) as string
  const phone = (admin.user_metadata?.phone || "0812-3456-7890") as string
  const notifyUrgent = admin.user_metadata?.notifyUrgent ?? true
  const notifyCounselor = admin.user_metadata?.notifyCounselor ?? true
  const notifySession = admin.user_metadata?.notifySession ?? true

  return {
    success: true,
    data: {
      id: admin.id,
      email,
      role,
      phone,
      notifyUrgent,
      notifyCounselor,
      notifySession,
    },
  }
}

/**
 * Updates operational contact details and on-screen notification preferences.
 */
export async function updateAdminContactAction(
  input: {
    phone: string
    notifyUrgent: boolean
    notifyCounselor: boolean
    notifySession: boolean
  },
  options?: {
    currentUser?: AdminAuthContext | null
  }
): Promise<AdminProfileActionResult<{ updated: boolean }>> {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return { success: false, error: "Akses ditolak: Diperlukan role Admin atau Superadmin." }
  }

  const phone = input.phone?.trim()
  if (!phone || phone.length < 8) {
    return { success: false, error: "Nomor WhatsApp operasional wajib diisi (minimal 8 digit)." }
  }

  try {
    // If not a demo user, persist to Supabase Auth metadata
    if (!admin.id.startsWith("demo-")) {
      const supabaseAdmin = createAdminClient()
      const { error } = await supabaseAdmin.auth.admin.updateUserById(admin.id, {
        user_metadata: {
          ...admin.user_metadata,
          phone,
          notifyUrgent: Boolean(input.notifyUrgent),
          notifyCounselor: Boolean(input.notifyCounselor),
          notifySession: Boolean(input.notifySession),
        },
      })

      if (error) {
        return { success: false, error: `Gagal menyimpan profil: ${error.message}` }
      }
    }

    try {
      revalidatePath("/admin/profile")
    } catch {}

    return {
      success: true,
      message: "Data kontak dan preferensi notifikasi berhasil disimpan.",
      data: { updated: true },
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menyimpan perubahan kontak." }
  }
}

/**
 * Updates Admin / Superadmin account password in Supabase Auth.
 */
export async function updateAdminPasswordAction(
  newPassword: string,
  options?: {
    currentUser?: AdminAuthContext | null
  }
): Promise<AdminProfileActionResult<{ updated: boolean }>> {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return { success: false, error: "Akses ditolak: Diperlukan role Admin atau Superadmin." }
  }

  const cleanPass = newPassword?.trim() || ""
  if (cleanPass.length < 8) {
    return { success: false, error: "Kata sandi baru minimal terdiri dari 8 karakter." }
  }

  try {
    if (!admin.id.startsWith("demo-")) {
      const supabaseAdmin = createAdminClient()
      const { error } = await supabaseAdmin.auth.admin.updateUserById(admin.id, {
        password: cleanPass,
      })

      if (error) {
        return { success: false, error: `Gagal memperbarui kata sandi: ${error.message}` }
      }
    }

    return {
      success: true,
      message: "Kata sandi akun Anda berhasil diperbarui. Gunakan kata sandi baru untuk login berikutnya.",
      data: { updated: true },
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui kata sandi." }
  }
}
