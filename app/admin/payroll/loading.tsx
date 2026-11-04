import { Skeleton } from "@/components/ui/skeleton"
import { TableCardSkeleton } from "@/components/skeletons/table-page-skeleton"

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <TableCardSkeleton columns={6} rows={6} filters={0} />
    </div>
  )
}
