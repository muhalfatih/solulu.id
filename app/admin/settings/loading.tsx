import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti pengaturan: formulir. */
export default function Loading() {
  return <AdminPageSkeleton body="form" fields={6} />
}
