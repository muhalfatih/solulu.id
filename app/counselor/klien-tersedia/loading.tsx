import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Bentuknya mengikuti halaman Klien Tersedia: judul, deskripsi, lalu daftar kartu klien. */
export default function CounselorKlienTersediaLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Memuat klien tersedia">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-[40rem] max-w-full" />
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-9 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
