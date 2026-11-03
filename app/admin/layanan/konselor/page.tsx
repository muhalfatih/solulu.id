import Link from "next/link"
import { Users } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { ErrorState } from "@/components/data-table/error-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionUser } from "@/lib/auth/staff"
import { getStaffRole } from "@/lib/auth/staff-role"
import {
  parseTableParams,
  type RawSearchParams,
  type TableConfig,
} from "@/lib/data-table/search-params"
import {
  listAllServices,
  listCounselorsWithExclusions,
  type CounselorExclusionRow,
  type ServiceRecord,
} from "@/lib/services/repository"
import { ExclusionToggle } from "./ExclusionToggle"

export const metadata = {
  title: "Pengecualian Layanan per Konselor | Solulu Admin",
  description: "Matikan Layanan tertentu untuk konselor tertentu.",
}

export const dynamic = "force-dynamic"

const PATH = "/admin/layanan/konselor"
const wrap = "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"
const config: TableConfig = {
  sortable: [],
  defaultSort: { key: "name", dir: "asc" },
  filters: { q: "text" },
  pageSize: 15,
  maxPageSize: 50,
}
const TYPE_LABEL = { peer: "Konselor Sebaya", psychologist: "Psikolog Klinis" } as const

export default async function CounselorExclusionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const role = getStaffRole(await getSessionUser())
  if (role !== "superadmin" && role !== "admin") {
    return (
      <div className={wrap}>
        <ErrorState title="Akses ditolak" message="Halaman ini hanya untuk Admin dan Superadmin." />
      </div>
    )
  }
  const state = parseTableParams(await searchParams, config)

  let services: ServiceRecord[]
  let data: { rows: CounselorExclusionRow[]; total: number }
  try {
    services = (await listAllServices()).filter((s) => s.isActive)
    data = await listCounselorsWithExclusions({
      page: state.page,
      pageSize: state.pageSize,
      q: state.filters.q,
    })
  } catch (err) {
    console.error("[admin/layanan/konselor] gagal memuat data", err)
    return (
      <div className={wrap}>
        <ErrorState message="Data konselor tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </div>
    )
  }

  const columns: DataTableColumn<CounselorExclusionRow>[] = [
    { id: "name", header: "Konselor", cell: (c) => <span className="font-medium">{c.fullName}</span> },
    { id: "type", header: "Tipe", cell: (c) => <Badge variant="outline">{TYPE_LABEL[c.counselorType]}</Badge> },
    {
      id: "services",
      header: "Layanan yang ditawarkan",
      cell: (c) => {
        const eligible = services.filter((s) => s.allowedCounselorTypes.includes(c.counselorType))
        if (eligible.length === 0) {
          return <span className="text-sm text-muted-foreground">Tidak ada Layanan aktif untuk tipe ini.</span>
        }
        return (
          <div className="flex flex-col gap-2">
            {eligible.map((s) => (
              <ExclusionToggle
                key={s.id}
                counselorId={c.id}
                serviceId={s.id}
                serviceName={s.name}
                offered={!c.excludedServiceIds.includes(s.id)}
              />
            ))}
          </div>
        )
      },
    },
  ]

  return (
    <div className={`${wrap} flex flex-col gap-6 pb-16`}>
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Pengecualian Layanan per Konselor</h1>
          <p className="text-sm text-muted-foreground">
            Secara bawaan konselor menawarkan semua Layanan aktif yang cocok dengan tipenya. Matikan saklar untuk
            menyembunyikan konselor dari Layanan tertentu.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/layanan">Kembali ke Layanan &amp; Tarif</Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Konselor</CardTitle>
            <CardDescription>{data.total} konselor aktif terverifikasi.</CardDescription>
          </div>
          <DataTableToolbar
            pathname={PATH}
            state={state}
            config={config}
            search={{ name: "q", placeholder: "Cari nama konselor" }}
            selects={[]}
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={data.rows}
            rowKey={(c) => c.id}
            total={data.total}
            state={state}
            config={config}
            pathname={PATH}
            empty={{
              icon: <Users />,
              title: "Belum Ada Konselor",
              description: "Tidak ada konselor aktif terverifikasi yang cocok dengan pencarian.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
