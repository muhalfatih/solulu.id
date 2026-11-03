"use server"

import { revalidatePath } from "next/cache"
import { requireStaffUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, type RoleCarrier } from "@/lib/auth/staff-role"
import { closePayrollPeriod, type ClosePayrollResult } from "@/lib/finance"
import { drizzleHonorStore } from "@/lib/finance/honor-store"
import { drizzlePayrollCloseStore } from "@/lib/finance/payroll-store"

/** Tutup Periode Payroll (Admin/Superadmin). Aktor selalu dari sesi login. */
export async function closePayrollPeriodAction(
  startDate: string,
  deps?: { currentUser?: RoleCarrier | null; now?: Date }
): Promise<ClosePayrollResult> {
  const actor = await requireStaffUser(deps?.currentUser, ADMIN_ROLES)
  if (!actor) return { ok: false, error: "Akses ditolak. Hanya Admin atau Superadmin." }

  try {
    const result = await closePayrollPeriod({
      startDate,
      actor,
      now: deps?.now ?? new Date(),
      honorStore: drizzleHonorStore,
      payrollStore: drizzlePayrollCloseStore,
    })
    if (result.ok) {
      try {
        revalidatePath("/admin/payroll")
        revalidatePath(`/admin/payroll/${startDate}`)
      } catch {
        // di luar konteks request Next.js (mis. Vitest)
      }
    }
    return result
  } catch (err) {
    console.error("[admin/payroll] gagal menutup periode", err)
    return { ok: false, error: "Periode gagal ditutup. Tidak ada perubahan yang disimpan." }
  }
}
