import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti formulir ubah konselor. */
export default function Loading() {
  return <AdminPageSkeleton body="form" fields={7} maxWidth="max-w-5xl" />
}
