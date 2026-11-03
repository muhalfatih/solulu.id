import { DashboardFrame } from "@/components/app-shell/dashboard-frame"
import { ErrorState } from "@/components/data-table/error-state"
import { getSessionUser } from "@/lib/auth/staff"
import { OPERATOR_PORTAL_ROLES, hasStaffRole } from "@/lib/auth/staff-role"
import { loadOperatorDashboard } from "@/lib/operator/dashboard"
import { drizzleOperatorDashboardStore } from "@/lib/operator/dashboard-store"
import { getTodayWibDateString } from "@/lib/operator/dispatcher"
import { PendingDispatchCard, SlotsCard, StatCards, ZoomAccountsCard } from "./sections"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dashboard | Solulu Operator",
  description: "Slot hari ini, akun Zoom, dan antrean Dispatch WhatsApp.",
}

export default async function OperatorDashboardPage() {
  const user = await getSessionUser()
  if (!hasStaffRole(user, OPERATOR_PORTAL_ROLES)) {
    return (
      <DashboardFrame title="Dashboard Operator">
        <ErrorState title="Akses ditolak" message="Halaman ini hanya untuk Operator, Admin, atau Superadmin." />
      </DashboardFrame>
    )
  }

  let data: Awaited<ReturnType<typeof loadOperatorDashboard>>
  try {
    data = await loadOperatorDashboard({ today: getTodayWibDateString(), store: drizzleOperatorDashboardStore })
  } catch (err) {
    console.error("[operator/dashboard] gagal memuat dashboard", err)
    return (
      <DashboardFrame title="Dashboard Operator">
        <ErrorState message="Dashboard tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </DashboardFrame>
    )
  }

  return (
    <DashboardFrame
      title="Dashboard Operator"
      description="Gambaran ruang hari ini: slot, akun Zoom, dan pesan WhatsApp yang menunggu."
    >
      <StatCards data={data} />
      <div className="grid gap-4 xl:grid-cols-3">
        <SlotsCard data={data} />
        <ZoomAccountsCard accounts={data.zoomAccounts} />
        <PendingDispatchCard pending={data.pendingDispatch} />
      </div>
    </DashboardFrame>
  )
}
