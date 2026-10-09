import * as React from "react"

export default function CounselorSchedulesLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Memuat jadwal praktik konselor">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-60 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-5 w-24 bg-muted/70 animate-pulse rounded-md" />
          </div>
          <div className="h-4 w-96 max-w-full bg-muted/70 animate-pulse rounded-md" />
        </div>

        <div className="h-9 w-44 bg-muted/70 animate-pulse rounded-md" />
      </div>

      {/* Date Filter & Status Tabs Skeleton */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="h-9 w-52 bg-muted/70 animate-pulse rounded-md" />
        <div className="h-8 w-64 bg-muted/70 animate-pulse rounded-md" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="h-5 w-36 bg-muted/70 animate-pulse rounded-md" />
          <div className="h-4 w-28 bg-muted/70 animate-pulse rounded-md" />
        </div>

        <div className="divide-y divide-border/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-muted/70 animate-pulse" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-44 bg-muted/70 animate-pulse rounded-md" />
                  <div className="h-3 w-32 bg-muted/70 animate-pulse rounded-md" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-6 w-24 bg-muted/70 animate-pulse rounded-full" />
                <div className="h-8 w-20 bg-muted/70 animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
