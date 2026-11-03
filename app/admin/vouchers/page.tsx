import { Tag } from "lucide-react"
import { desc } from "drizzle-orm"
import { db } from "@/db"
import { vouchers } from "@/db/schema"
import { AdminPageHeader } from "@/components/admin"
import { ErrorState } from "@/components/data-table/error-state"
import { getSessionUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, getStaffRole, hasStaffRole, SUPERADMIN_ONLY } from "@/lib/auth/staff-role"
import { VouchersClient, type VoucherRow } from "./VouchersClient"

export const metadata = {
  title: "Voucher | Solulu Admin",
  description: "Kode promo diskon untuk klien. Admin melihat, hanya Superadmin yang dapat mengubah.",
}

export const dynamic = "force-dynamic"

export default async function AdminVouchersPage() {
  const user = await getSessionUser()
  if (!hasStaffRole(user, ADMIN_ROLES)) {
    return (
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <ErrorState title="Akses ditolak" message="Voucher hanya dapat dibuka oleh Admin atau Superadmin." />
      </div>
    )
  }
  const canMutate = hasStaffRole(user, SUPERADMIN_ONLY)

  let rows: VoucherRow[] = []
  let loadError: string | null = null
  try {
    const data = await db.select().from(vouchers).orderBy(desc(vouchers.createdAt))
    rows = data.map((v) => ({
      id: v.id,
      code: v.code,
      discountType: v.discountType === "percentage" ? "percentage" : "fixed",
      discountValue: Number(v.discountValue),
      quota: v.quota,
      usedCount: v.usedCount,
      expiresAt: v.expiresAt ? v.expiresAt.toISOString() : null,
      isActive: v.isActive,
    }))
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Gagal memuat voucher dari database."
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-16 sm:p-6 lg:p-8">
      <AdminPageHeader
        icon={Tag}
        title="Voucher"
        description="Kode promo diskon persentase atau nominal. Hanya Superadmin yang dapat membuat, menonaktifkan, atau menghapus."
        badge={getStaffRole(user) === "superadmin" ? "Superadmin" : "Hanya lihat"}
      />
      {loadError ? (
        <ErrorState title="Gagal memuat voucher" message={loadError} />
      ) : (
        <VouchersClient rows={rows} canMutate={canMutate} />
      )}
    </div>
  )
}
