import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti daftar pengajuan konselor. */
export default function Loading() {
  return <AdminPageSkeleton body="table" columns={5} filters={3} />
}
