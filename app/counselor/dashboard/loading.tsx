import { DashboardSkeleton } from "@/components/app-shell/dashboard-frame"

export default function CounselorDashboardLoading() {
  return <DashboardSkeleton label="Memuat dashboard konselor" stats={2} panels={2} />
}
