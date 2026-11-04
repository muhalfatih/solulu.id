import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti laporan keuangan: KPI dan kartu. */
export default function Loading() {
  return <AdminPageSkeleton kpis={4} body="cards" maxWidth="max-w-5xl" />
}
