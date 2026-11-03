import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti pembayaran manual: tabel. */
export default function Loading() {
  return <AdminPageSkeleton kpis={4} body="table" columns={6} filters={4} />
}
