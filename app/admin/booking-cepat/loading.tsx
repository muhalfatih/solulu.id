import { Skeleton } from "@/components/ui/skeleton"
import { TableCardSkeleton } from "@/components/skeletons/table-page-skeleton"

/** Bentuknya mengikuti BookingCepatClient: header, kartu formulir, lalu kartu tabel 6 kolom. */
export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-2 border-b border-border pb-5">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <TableCardSkeleton columns={6} rows={10} filters={2} />
    </div>
  )
}
