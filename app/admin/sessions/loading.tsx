import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti sesi: tabel. */
export default function Loading() {
  return <AdminPageSkeleton body="table" columns={7} filters={5} />
}
