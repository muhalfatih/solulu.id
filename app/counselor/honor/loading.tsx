import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Bentuknya mengikuti HonorSayaClient: judul, lalu kartu periode berisi tabel honor. */
export default function CounselorHonorLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-16 sm:p-6 lg:p-8" aria-busy="true" aria-label="Memuat Honor Saya">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-4">
              {Array.from({ length: 4 }, (_, c) => (
                <Skeleton key={c} className="h-4 flex-1" />
              ))}
            </div>
            {Array.from({ length: 4 }, (_, r) => (
              <Skeleton key={r} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
