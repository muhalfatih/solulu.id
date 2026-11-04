import { Skeleton } from "@/components/ui/skeleton"
import { TableCardSkeleton } from "@/components/skeletons/table-page-skeleton"

/** Bentuknya mengikuti app/admin/audit/page.tsx: header dan kartu tabel 7 kolom. */
export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <TableCardSkeleton columns={7} rows={10} filters={5} />
    </div>
  )
}
