import { DashboardSkeleton } from "@/components/app-shell/dashboard-frame"

export default function OperatorDashboardLoading() {
  return <DashboardSkeleton label="Memuat dashboard operator" stats={3} panels={3} />
}
