import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { KpiCardsSkeleton, TableCardSkeleton } from "@/components/skeletons/table-page-skeleton"

/** Header AdminPageHeader (judul, deskripsi, garis bawah) sebagai blok Skeleton. */
export function AdminHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-5">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>
  )
}

/** Grid kartu isi (daftar kartu). */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** Kartu formulir: sejumlah baris label + kolom isian. */
export function FormCardSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton halaman admin: header, KPI opsional, lalu badan sebentuk halaman.
 * `maxWidth` mengikuti lebar halaman aslinya.
 */
export function AdminPageSkeleton({
  body = "table",
  kpis = 0,
  columns = 6,
  rows = 8,
  filters = 3,
  fields = 5,
  maxWidth = "max-w-7xl",
}: {
  body?: "table" | "cards" | "form"
  kpis?: number
  columns?: number
  rows?: number
  filters?: number
  fields?: number
  maxWidth?: "max-w-7xl" | "max-w-5xl"
}) {
  return (
    <div
      className={`mx-auto flex w-full flex-col gap-6 p-4 pb-16 sm:p-6 lg:p-8 ${maxWidth}`}
      aria-busy="true"
      aria-label="Memuat halaman"
    >
      <AdminHeaderSkeleton />
      {kpis > 0 && <KpiCardsSkeleton count={kpis} />}
      {body === "table" && <TableCardSkeleton columns={columns} rows={rows} filters={filters} />}
      {body === "cards" && <CardGridSkeleton />}
      {body === "form" && <FormCardSkeleton fields={fields} />}
    </div>
  )
}
