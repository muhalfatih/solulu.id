import Link from "next/link"
import { Lock, LockOpen, Wallet } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table"
import { ErrorState } from "@/components/data-table/error-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, hasStaffRole } from "@/lib/auth/staff-role"
import { parseTableParams, type RawSearchParams, type TableConfig } from "@/lib/data-table/search-params"
import type { PayrollPeriodSummary } from "@/lib/finance"
import { loadPayrollOverview } from "@/lib/finance/payroll-load"
import { formatRupiah } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Payroll | Solulu Admin",
  description: "Periode Payroll, rincian honor per konselor, Tutup Periode, dan ekspor CSV transfer massal.",
}

const PAYROLL_PATH = "/admin/payroll"

const payrollTableConfig: TableConfig = {
  sortable: ["startDate"],
  defaultSort: { key: "startDate", dir: "desc" },
  filters: {},
  pageSize: 12,
  maxPageSize: 50,
}

const columns: DataTableColumn<PayrollPeriodSummary>[] = [
  {
    id: "startDate",
    header: "Periode",
    sortKey: "startDate",
    cell: (r) => <span className="font-medium">{r.label}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: (r) =>
      r.status === "closed" ? (
        <Badge variant="secondary"><Lock data-icon="inline-start" />Tertutup</Badge>
      ) : (
        <Badge variant="outline"><LockOpen data-icon="inline-start" />Terbuka</Badge>
      ),
  },
  { id: "counselors", header: "Konselor", align: "right", cell: (r) => r.counselorCount },
  { id: "sessions", header: "Sesi", align: "right", cell: (r) => r.sessionCount },
  {
    id: "total",
    header: "Total Honor",
    align: "right",
    cell: (r) => <span className="tabular-nums">{formatRupiah(r.total)}</span>,
  },
  {
    id: "actions",
    header: "",
    align: "right",
    cell: (r) => (
      <Button variant="outline" size="sm" asChild>
        <Link href={`${PAYROLL_PATH}/${r.startDate}`}>Rincian</Link>
      </Button>
    ),
  },
]

export default async function PayrollPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await getSessionUser()
  if (!hasStaffRole(user, ADMIN_ROLES)) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <ErrorState title="Akses ditolak" message="Payroll hanya dapat dibuka oleh Admin atau Superadmin." />
      </div>
    )
  }

  const state = parseTableParams(await searchParams, payrollTableConfig)

  let overview: Awaited<ReturnType<typeof loadPayrollOverview>>
  try {
    overview = await loadPayrollOverview({ now: new Date() })
  } catch (err) {
    console.error("[admin/payroll] gagal memuat payroll", err)
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <ErrorState message="Payroll tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </div>
    )
  }

  const sorted = [...overview.periods].sort((a, b) =>
    state.sort.dir === "asc" ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate)
  )
  const pageRows = sorted.slice((state.page - 1) * state.pageSize, state.page * state.pageSize)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
        <p className="text-sm text-muted-foreground">
          Honor Konselor per Periode Payroll (1-15 dan 16-akhir bulan). Tutup periode untuk membekukan isinya, lalu
          ekspor CSV untuk transfer massal.
        </p>
      </div>

      {overview.heldTotal > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Honor Tertahan</CardTitle>
            <CardDescription>
              {formatRupiah(overview.heldTotal)} dari {overview.heldCounselorCount} konselor belum masuk periode mana
              pun (laporan sesi belum masuk atau perpanjangan klien belum lunas). Rinciannya ada di halaman tiap
              periode.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Periode</CardTitle>
          <CardDescription>{overview.periods.length} periode memiliki honor.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={pageRows}
            rowKey={(r) => r.startDate}
            total={sorted.length}
            state={state}
            config={payrollTableConfig}
            pathname={PAYROLL_PATH}
            empty={{
              icon: <Wallet />,
              title: "Belum Ada Honor",
              description: "Periode muncul di sini setelah ada sesi selesai atau No-Show yang menghasilkan honor.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
