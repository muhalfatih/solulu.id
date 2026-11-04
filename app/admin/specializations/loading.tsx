import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti spesialisasi: tabel. */
export default function Loading() {
  return <AdminPageSkeleton body="table" columns={4} filters={2} />
}
