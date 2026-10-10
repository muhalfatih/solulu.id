import * as React from "react"

export default function CounselorDashboardLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Memuat dashboard konselor">
      {/* Top Banner Header Skeleton */}
      <div className="flex flex-col gap-2 pb-5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="h-8 w-64 bg-muted/70 animate-pulse rounded-md" />
          <div className="h-5 w-24 bg-muted/70 animate-pulse rounded-md" />
        </div>
        <div className="h-4 w-96 max-w-full bg-muted/70 animate-pulse rounded-md" />
      </div>

      {/* Grid Overview Cards Skeleton - 3 Dynamic Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3 h-28"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-muted/70 animate-pulse rounded-md" />
              <div className="size-8 rounded-lg bg-muted/70 animate-pulse" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-7 w-20 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-3 w-36 bg-muted/70 animate-pulse rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Session List Skeleton */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="h-6 w-48 bg-muted/70 animate-pulse rounded-md" />
          <div className="h-8 w-60 bg-muted/70 animate-pulse rounded-md" />
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-xl border border-border/80 bg-card shadow-xs flex flex-col gap-4"
            >
              {/* Top Row: Time & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-28 bg-muted/70 animate-pulse rounded-md" />
                  <div className="h-6 w-32 bg-muted/70 animate-pulse rounded-md" />
                </div>
                <div className="h-5 w-24 bg-muted/70 animate-pulse rounded-md" />
              </div>

              {/* Patient Info */}
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-muted/70 animate-pulse" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-5 w-40 bg-muted/70 animate-pulse rounded-md" />
                  <div className="h-3.5 w-56 bg-muted/70 animate-pulse rounded-md" />
                </div>
              </div>

              {/* Patient Intake Note Placeholder */}
              <div className="h-12 bg-muted/40 animate-pulse rounded-lg" />

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                <div className="h-9 w-36 bg-muted/70 animate-pulse rounded-md" />
                <div className="h-9 w-48 bg-muted/70 animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
