import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

/** Bentuknya mengikuti CounselorScheduleClient: header, kartu mode, tab, lalu grid kalender mingguan. */
export default function CounselorScheduleLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-16 sm:p-6 lg:p-8" aria-busy="true" aria-label="Memuat jadwal praktik">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-64" />
      </div>

      <Card>
        <CardContent>
          <div className="grid h-96 grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
