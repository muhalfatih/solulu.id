import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti app/admin/counselors/page.tsx: KPI, filter, daftar konselor. */
export default function Loading() {
  return <AdminPageSkeleton kpis={4} body="table" columns={6} filters={3} />
}
