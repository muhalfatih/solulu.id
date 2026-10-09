import * as React from "react"

export default function CounselorProfileLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Memuat profil konselor">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-64 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-5 w-24 bg-muted/70 animate-pulse rounded-md" />
          </div>
          <div className="h-4 w-96 max-w-full bg-muted/70 animate-pulse rounded-md" />
        </div>

        <div className="h-9 w-36 bg-muted/70 animate-pulse rounded-md" />
      </div>

      {/* Main Profile Form Card Skeleton */}
      <div className="rounded-xl border border-border/80 bg-card shadow-xs p-6 flex flex-col gap-6">
        {/* Avatar Section Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-border/60">
          <div className="size-24 rounded-full bg-muted/70 animate-pulse shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-44 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-3.5 w-72 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-8 w-32 bg-muted/70 animate-pulse rounded-md mt-1" />
          </div>
        </div>

        {/* Form Fields Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-10 w-full bg-muted/70 animate-pulse rounded-md" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-10 w-full bg-muted/70 animate-pulse rounded-md" />
          </div>
        </div>

        {/* Bio Textarea Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-4 w-28 bg-muted/70 animate-pulse rounded-md" />
          <div className="h-28 w-full bg-muted/70 animate-pulse rounded-md" />
        </div>

        {/* Specialization Chips Skeleton */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 bg-muted/70 animate-pulse rounded-md" />
            <div className="h-4 w-20 bg-muted/70 animate-pulse rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-7 w-28 bg-muted/70 animate-pulse rounded-md" />
            ))}
          </div>
        </div>

        {/* Save Button Skeleton */}
        <div className="pt-4 border-t border-border/60 flex justify-end">
          <div className="h-10 w-44 bg-muted/70 animate-pulse rounded-md" />
        </div>
      </div>
    </div>
  )
}
