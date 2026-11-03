import { Skeleton } from "@/components/ui/skeleton"
import { KpiCardsSkeleton, TableCardSkeleton } from "@/components/skeletons/table-page-skeleton"

/** Bentuknya mengikuti app/admin/bookings/page.tsx: header, 4 KPI, kartu tabel 7 kolom. */
export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-80" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
      <KpiCardsSkeleton count={4} />
      <TableCardSkeleton columns={7} rows={10} filters={5} />
    </div>
  )
}
