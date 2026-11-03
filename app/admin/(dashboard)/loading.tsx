import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Rangka sama dengan app/admin/page.tsx: judul + filter, Perlu Tindakan, 4 KPI, grid chart. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-16 sm:p-6 lg:p-8" aria-busy="true" aria-label="Memuat dashboard">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-96 max-w-full" />
      </div>

      <section className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} size="sm">
            <CardHeader>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-3 w-28" />
            </CardFooter>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {[true, false, false, true].map((wide, i) => (
          <Card key={i} className={wide ? "xl:col-span-2" : undefined}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
