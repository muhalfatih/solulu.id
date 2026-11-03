import * as React from "react"

export default function CounselorHonorLoading() {
  return (
    <div
      className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 pb-16"
      aria-busy="true"
      aria-label="Memuat Honor Saya"
    >
      <div className="flex flex-col gap-2 pb-5 border-b border-border/60">
        <div className="h-8 w-48 bg-muted/70 animate-pulse rounded-md" />
        <div className="h-4 w-96 max-w-full bg-muted/70 animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border/80 bg-muted/40 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border/80 bg-muted/40 animate-pulse" />
    </div>
  )
}
