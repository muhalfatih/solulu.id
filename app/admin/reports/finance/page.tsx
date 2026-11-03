import { ErrorState } from "@/components/data-table/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { loadProfitLoss, resolveRange } from "@/lib/admin-metrics"
import { drizzleMetricsStore } from "@/lib/admin-metrics/store"
import { getSessionUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, hasStaffRole } from "@/lib/auth/staff-role"
import { deltaPercent } from "@/lib/finance"
import { drizzleHonorStore } from "@/lib/finance/honor-store"
import { formatDateId } from "@/lib/format/datetime"
import { formatRupiah } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Laporan Keuangan | Solulu Admin",
  description: "Omzet, HPP honor, dan Laba Bersih per rentang tanggal beserta pembanding.",
}

type Params = Record<string, string | string[] | undefined>
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 pb-16">{children}</div>
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const pct = deltaPercent(current, previous)
  if (pct === null) return <span className="text-muted-foreground">-</span>
  return (
    <span className={pct < 0 ? "text-destructive" : undefined}>
      {pct > 0 ? "+" : ""}
      {pct.toLocaleString("id-ID")}%
    </span>
  )
}

const rangeLabel = (r: { from: string; to: string }) =>
  r.from === r.to ? formatDateId(`${r.from}T00:00:00+07:00`) : `${formatDateId(`${r.from}T00:00:00+07:00`)} - ${formatDateId(`${r.to}T00:00:00+07:00`)}`

export default async function FinanceReportPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await getSessionUser()
  if (!hasStaffRole(user, ADMIN_ROLES)) {
    return <Shell><ErrorState title="Akses ditolak" message="Laporan Keuangan hanya dapat dibuka oleh Admin atau Superadmin." /></Shell>
  }

  const raw = await searchParams
  const now = new Date()
  const range = resolveRange({ from: first(raw.from), to: first(raw.to) }, now)

  let report: Awaited<ReturnType<typeof loadProfitLoss>>
  try {
    report = await loadProfitLoss({ range, now, honorStore: drizzleHonorStore, metricsStore: drizzleMetricsStore })
  } catch (err) {
    console.error("[admin/reports/finance] gagal memuat laporan", err)
    return <Shell><ErrorState message="Laporan Keuangan tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." /></Shell>
  }

  const lines = [
    { label: "Omzet", note: "Dihitung pada tanggal pembayaran lunas", cur: report.omzet, prev: report.comparison.omzet },
    { label: "HPP (Honor Konselor)", note: "Pokok + overtime, menurut tanggal sesi", cur: report.hpp, prev: report.comparison.hpp },
    { label: "Laba Bersih", note: "Omzet dikurangi HPP", cur: report.labaBersih, prev: report.comparison.labaBersih },
  ]

  return (
    <Shell>
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Laporan Keuangan</h1>
        <p className="text-sm text-muted-foreground">
          Laba rugi per rentang tanggal. Laba Bersih hanya bermakna per rentang, jadi tidak ditampilkan per hari.
        </p>
      </div>

      <Card>
        <CardContent>
          <form method="get" className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
            <label className="flex flex-col gap-1 text-sm">
              Dari tanggal
              <Input type="date" name="from" defaultValue={range.from} required />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sampai tanggal
              <Input type="date" name="to" defaultValue={range.to} required />
            </label>
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{rangeLabel(report.range)}</CardTitle>
          <CardDescription>Pembanding: {rangeLabel(report.comparison.range)} (jumlah hari sama)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Komponen</TableHead>
                <TableHead className="text-right">Rentang ini</TableHead>
                <TableHead className="text-right">Pembanding</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.label}>
                  <TableCell>
                    <span className="font-medium">{l.label}</span>
                    <span className="block text-xs text-muted-foreground">{l.note}</span>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatRupiah(l.cur)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatRupiah(l.prev)}</TableCell>
                  <TableCell className="text-right tabular-nums"><Delta current={l.cur} previous={l.prev} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Shell>
  )
}
