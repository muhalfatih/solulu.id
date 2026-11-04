import { AdminPageHeader } from "@/components/admin"
import { PoolQueueAdmin } from "./PoolQueueAdmin"
import { getPoolQueueAdminAction } from "./actions"

export const dynamic = "force-dynamic"
export const metadata = { title: "Klien Tersedia | Solulu Admin" }

export default async function AdminKlienTersediaPage() {
  const res = await getPoolQueueAdminAction()
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Klien Tersedia"
        description="Booking Konselor Bebas yang belum diklaim. Klaim ditutup H-4 jam; tugaskan konselor yang memenuhi syarat."
      />
      <PoolQueueAdmin items={res.success ? res.data : []} error={res.success ? null : res.error} />
    </div>
  )
}
