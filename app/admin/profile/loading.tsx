import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti profil admin: formulir. */
export default function Loading() {
  return <AdminPageSkeleton body="form" fields={5} maxWidth="max-w-5xl" />
}
