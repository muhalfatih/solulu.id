import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti klien tersedia: tabel. */
export default function Loading() {
  return <AdminPageSkeleton body="table" columns={5} filters={2} />
}
