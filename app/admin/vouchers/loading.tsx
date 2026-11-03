import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti voucher: tabel. */
export default function Loading() {
  return <AdminPageSkeleton body="table" columns={6} filters={2} />
}
