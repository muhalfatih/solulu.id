import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full" />
    </div>
  )
}

function CardHeaderSkeleton() {
  return (
    <CardHeader>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-56 max-w-full" />
    </CardHeader>
  )
}

/** Bentuknya mengikuti CounselorProfileClient: header, kolom kiri (avatar, kelengkapan), kolom kanan (formulir) dan rekening bank. */
export default function CounselorProfileLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-16 sm:p-6 lg:p-8" aria-busy="true" aria-label="Memuat profil konselor">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Card>
            <CardHeaderSkeleton />
            <CardContent className="flex flex-col items-center gap-4">
              <Skeleton className="size-32" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeaderSkeleton />
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-8">
          <Card>
            <CardHeaderSkeleton />
            <CardContent className="flex flex-col gap-5">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </CardContent>
          </Card>
          <Card>
            <CardHeaderSkeleton />
            <CardContent className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-8 w-28" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeaderSkeleton />
            <CardContent className="flex flex-col gap-5">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-9 w-48" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeaderSkeleton />
        <CardContent className="flex flex-col gap-4">
          <FieldSkeleton />
          <FieldSkeleton />
        </CardContent>
      </Card>
    </div>
  )
}
