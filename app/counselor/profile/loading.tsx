import * as React from "react"

export default function CounselorProfileLoading() {
  return (
    <div className="flex flex-col gap-6 w-full pb-12" aria-busy="true" aria-label="Memuat profil konselor">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-64 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-5 w-28 bg-muted/70 animate-pulse rounded-md" />
          </div>
          <div className="h-4 w-96 max-w-full bg-muted/70 animate-pulse rounded-md" />
        </div>

        <div className="h-9 w-36 bg-muted/70 animate-pulse rounded-md" />
      </div>

      {/* Main 2-Column Responsive Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Avatar & Identity Card Skeleton */}
          <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="p-6 pb-4 border-b border-border/60 flex flex-col gap-1.5">
              <div className="h-5 w-36 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-3.5 w-52 bg-muted/70 animate-pulse rounded-md" />
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              <div className="size-32 rounded-xl bg-muted/70 animate-pulse" />
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="h-4 w-40 bg-muted/70 animate-pulse rounded-md" />
                <div className="h-5 w-28 bg-muted/70 animate-pulse rounded-md" />
              </div>
              <div className="w-full pt-2 border-t border-border/60 flex flex-col gap-2">
                <div className="h-9 w-full bg-muted/70 animate-pulse rounded-md" />
                <div className="h-3 w-48 bg-muted/70 animate-pulse rounded-md" />
              </div>
            </div>
          </div>

          {/* Completeness Telemetry Card Skeleton */}
          <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="p-6 pb-4 border-b border-border/60 flex items-center justify-between">
              <div className="h-5 w-32 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-4 w-10 bg-muted/70 animate-pulse rounded-md" />
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="h-1.5 w-full bg-muted/70 animate-pulse rounded-md" />
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-4 rounded-md bg-muted/70 animate-pulse" />
                      <div className="h-3.5 w-32 bg-muted/70 animate-pulse rounded-md" />
                    </div>
                    <div className="h-3 w-20 bg-muted/70 animate-pulse rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Credentials Card Skeleton */}
          <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="p-6 pb-4 border-b border-border/60 flex flex-col gap-1.5">
              <div className="h-5 w-56 bg-muted/70 animate-pulse rounded-md" />
              <div className="h-3.5 w-72 bg-muted/70 animate-pulse rounded-md" />
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-3.5 w-36 bg-muted/70 animate-pulse rounded-md" />
                  <div className="h-10 w-full bg-muted/70 animate-pulse rounded-md" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-3.5 w-36 bg-muted/70 animate-pulse rounded-md" />
                  <div className="h-10 w-full bg-muted/70 animate-pulse rounded-md" />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-44 bg-muted/70 animate-pulse rounded-md" />
                  <div className="h-3.5 w-24 bg-muted/70 animate-pulse rounded-md" />
                </div>
                <div className="h-28 w-full bg-muted/70 animate-pulse rounded-md" />
              </div>
            </div>
          </div>

          {/* Specializations Card Skeleton */}
          <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            <div className="p-6 pb-4 border-b border-border/60 flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="h-5 w-48 bg-muted/70 animate-pulse rounded-md" />
                <div className="h-3.5 w-64 bg-muted/70 animate-pulse rounded-md" />
              </div>
              <div className="h-4 w-24 bg-muted/70 animate-pulse rounded-md" />
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-8 w-28 bg-muted/70 animate-pulse rounded-md" />
                ))}
              </div>
              <div className="h-12 w-full bg-muted/50 animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Action Bar Card Skeleton */}
          <div className="rounded-xl border border-border/70 bg-card shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="h-4 w-64 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-9 w-44 bg-muted/70 animate-pulse rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
