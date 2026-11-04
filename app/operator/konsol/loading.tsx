import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCardsSkeleton, PageHeaderSkeleton } from "@/components/skeletons/table-page-skeleton"

/** Bentuknya mengikuti OperatorConsoleClient: header, 4 kartu KPI, lalu 7 kartu slot harian. */
export default function OperatorKonsolLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-16 sm:p-6 lg:p-8" aria-busy="true" aria-label="Memuat konsol operator">
      <PageHeaderSkeleton />
      <KpiCardsSkeleton count={4} />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 7 }, (_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
