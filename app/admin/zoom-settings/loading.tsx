import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti pengaturan Zoom: formulir. */
export default function Loading() {
  return <AdminPageSkeleton body="form" fields={5} />
}
