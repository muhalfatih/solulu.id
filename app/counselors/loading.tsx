import { Skeleton } from "@/components/ui/skeleton"
import { PublicShell } from "@/components/public/public-shell"

export default function CounselorsLoading() {
  return (
    <PublicShell>
      {/* 1. Hero Skeleton */}
      <section className="border-b border-border/60 py-12 sm:py-16 bg-gradient-to-b from-purple-50/50 via-background to-background dark:from-purple-950/20 dark:via-background dark:to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-4">
          <Skeleton className="h-6 w-52 rounded-full" />
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-lg rounded-xl" />
          <Skeleton className="h-5 w-full max-w-md rounded-md" />

          {/* 3 Value Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>
        </div>
      </section>

      {/* 2. Workspace Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-28 sm:pb-36 flex flex-col gap-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-4 p-4 rounded-2xl bg-card border border-border/70 shadow-2xs">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <Skeleton className="h-10 w-full sm:max-w-md rounded-xl" />
            <div className="flex gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>
          {/* Topic Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-22 rounded-full" />
          </div>
        </div>

        {/* Counselors Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-2xs"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-2xl shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>

              <Skeleton className="h-12 w-full rounded-lg" />

              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3 mt-auto">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </PublicShell>
  )
}
