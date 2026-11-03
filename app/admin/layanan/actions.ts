"use server"

import { revalidatePath } from "next/cache"
import { requireStaffUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, SUPERADMIN_ONLY, type RoleCarrier } from "@/lib/auth/staff-role"
import {
  createServiceAudited,
  setCounselorServiceExclusionAudited,
  setServiceActiveAudited,
  updateServiceByIdAudited,
  type ServiceRecord,
} from "@/lib/services/repository"
import {
  slugifyServiceName,
  validateServiceInput,
  type ServiceFormInput,
} from "@/lib/services/validation"

const SUPERADMIN_ONLY_MESSAGE =
  "Akses ditolak: hanya Superadmin yang dapat mengubah Layanan dan tarif. Admin hanya dapat melihat."
const ADMIN_ONLY_MESSAGE = "Akses ditolak: diperlukan peran Admin."

export type LayananActionResult =
  | { success: true; data?: ServiceRecord; message: string }
  | { success: false; error: string }

interface ActionOptions {
  currentUser?: RoleCarrier | null
}

function refresh() {
  try {
    for (const path of ["/", "/pricing", "/counselors", "/booking", "/admin/layanan"]) {
      revalidatePath(path)
    }
  } catch {
    // Di luar konteks server Next.js (unit test) revalidate tidak tersedia.
  }
}

function failure(err: unknown, fallback: string): LayananActionResult {
  console.error("[layanan]", err)
  return { success: false, error: fallback }
}

export async function createServiceAction(
  input: ServiceFormInput,
  options?: ActionOptions
): Promise<LayananActionResult> {
  const superadmin = await requireStaffUser(options?.currentUser, SUPERADMIN_ONLY)
  if (!superadmin) return { success: false, error: SUPERADMIN_ONLY_MESSAGE }

  const parsed = validateServiceInput(input)
  if (!parsed.ok) return { success: false, error: parsed.error }

  try {
    const row = await createServiceAudited(
      parsed.values,
      slugifyServiceName(parsed.values.name),
      superadmin
    )
    refresh()
    return { success: true, data: row, message: `Layanan "${row.name}" berhasil dibuat.` }
  } catch (err) {
    return failure(err, "Gagal membuat Layanan. Coba lagi.")
  }
}

export async function updateServiceAction(
  serviceId: string,
  input: ServiceFormInput,
  options?: ActionOptions
): Promise<LayananActionResult> {
  const superadmin = await requireStaffUser(options?.currentUser, SUPERADMIN_ONLY)
  if (!superadmin) return { success: false, error: SUPERADMIN_ONLY_MESSAGE }

  const parsed = validateServiceInput(input)
  if (!parsed.ok) return { success: false, error: parsed.error }

  try {
    const row = await updateServiceByIdAudited(serviceId, parsed.values, superadmin)
    if (!row) return { success: false, error: "Layanan tidak ditemukan." }
    refresh()
    return { success: true, data: row, message: `Layanan "${row.name}" berhasil diperbarui.` }
  } catch (err) {
    return failure(err, "Gagal memperbarui Layanan. Coba lagi.")
  }
}

/** Nonaktifkan (bukan hapus) atau aktifkan kembali sebuah Layanan. */
export async function setServiceActiveAction(
  serviceId: string,
  isActive: boolean,
  options?: ActionOptions
): Promise<LayananActionResult> {
  const superadmin = await requireStaffUser(options?.currentUser, SUPERADMIN_ONLY)
  if (!superadmin) return { success: false, error: SUPERADMIN_ONLY_MESSAGE }

  try {
    const row = await setServiceActiveAudited(serviceId, isActive, superadmin)
    if (!row) return { success: false, error: "Layanan tidak ditemukan." }
    refresh()
    return {
      success: true,
      data: row,
      message: `Layanan "${row.name}" ${isActive ? "diaktifkan" : "dinonaktifkan"}.`,
    }
  } catch (err) {
    return failure(err, "Gagal mengubah status Layanan. Coba lagi.")
  }
}

/** Admin (atau Superadmin) mematikan/menyalakan satu Layanan untuk satu konselor. */
export async function setCounselorServiceExcludedAction(
  counselorId: string,
  serviceId: string,
  excluded: boolean,
  options?: ActionOptions
): Promise<LayananActionResult> {
  const admin = await requireStaffUser(options?.currentUser, ADMIN_ROLES)
  if (!admin) return { success: false, error: ADMIN_ONLY_MESSAGE }

  try {
    await setCounselorServiceExclusionAudited(counselorId, serviceId, excluded, admin)
    refresh()
    return {
      success: true,
      message: excluded
        ? "Layanan dimatikan untuk konselor ini."
        : "Layanan ditawarkan kembali oleh konselor ini.",
    }
  } catch (err) {
    return failure(err, "Gagal mengubah pengecualian konselor. Coba lagi.")
  }
}
