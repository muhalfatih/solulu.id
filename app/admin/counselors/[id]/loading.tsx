import { AdminPageSkeleton } from "@/components/skeletons/admin-page-skeleton"

/** Bentuknya mengikuti app/admin/counselors/[id]: detail konselor berupa kartu. */
export default function Loading() {
  return <AdminPageSkeleton body="cards" />
}
