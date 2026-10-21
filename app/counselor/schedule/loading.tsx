import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function CounselorScheduleLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </CardContent>
      </Card>

      <div className="h-10 w-full flex justify-between items-center bg-muted/40 p-2 rounded-lg">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="h-96 w-full rounded-xl border bg-card p-4">
        <div className="grid grid-cols-8 gap-2 h-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
