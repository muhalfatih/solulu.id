import { Skeleton } from "@/components/ui/skeleton"
import { PublicShell } from "@/components/public/public-shell"

export default function PricingLoading() {
  return (
    <PublicShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20 flex flex-col gap-14 sm:gap-16">
        {/* 1. Hero Skeleton */}
        <section className="flex flex-col items-center text-center gap-5 max-w-3xl mx-auto">
          <Skeleton className="h-6 w-64 rounded-full" />
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-lg rounded-xl" />
          <Skeleton className="h-5 w-full max-w-xl rounded-md" />

          {/* Quick Value Pillars */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-1">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>
        </section>

        {/* 2. Pricing Cards Grid Skeleton */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1 */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>
            <div className="flex items-baseline gap-2 py-2">
              <Skeleton className="h-10 w-40 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="size-4 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                </div>
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-full mt-auto" />
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl border border-purple-500/30 bg-purple-50/10 dark:bg-purple-950/10 p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex items-baseline gap-2 py-2">
              <Skeleton className="h-10 w-44 rounded-lg" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <div className="flex flex-col gap-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Skeleton className="size-4 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                </div>
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-full mt-auto" />
          </div>
        </section>
      </div>
    </PublicShell>
  )
}
