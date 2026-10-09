import { Skeleton } from "@/components/ui/skeleton"
import { PublicShell } from "@/components/public/public-shell"

export default function CekSesiLoading() {
  return (
    <PublicShell>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col gap-8">
        <div className="flex flex-col items-center text-center gap-3">
          <Skeleton className="h-6 w-36 rounded-full" />
          <Skeleton className="h-9 sm:h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-sm rounded-md" />
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-full mt-2" />
        </div>
      </div>
    </PublicShell>
  )
}
