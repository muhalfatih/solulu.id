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

      {/* 3 Telemetry Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card p-5 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-col gap-2">
              <div className="h-3.5 w-24 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-7 w-12 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-3 w-32 bg-muted/70 animate-pulse rounded-md" />
            </div>
            <div className="size-10 rounded-lg bg-muted/70 animate-pulse shrink-0" />
          </div>
        ))}
      </div>

      {/* Table Skeleton with Card Header */}
      <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <div className="p-6 pb-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="h-5 w-36 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-3.5 w-48 bg-muted/70 animate-pulse rounded-md" />
          </div>
          <div className="h-9 w-72 bg-muted/70 animate-pulse rounded-md" />
        </div>

        <div className="p-6 pt-5">
          <div className="rounded-lg border border-border/70 overflow-hidden divide-y divide-border/60">
            <div className="p-3.5 bg-muted/40 flex items-center justify-between gap-4">
              <div className="h-4 w-20 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-4 w-32 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-4 w-24 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-4 w-16 bg-muted/70 animate-pulse rounded-md" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="h-4 w-28 bg-muted/70 animate-pulse rounded-md" />
                  <div className="h-4 w-36 bg-muted/70 animate-pulse rounded-md" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-6 w-20 bg-muted/70 animate-pulse rounded-md" />
                  <div className="h-7 w-16 bg-muted/70 animate-pulse rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
