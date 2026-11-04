import Link from "next/link"
import { Download } from "lucide-react"
import { ErrorState } from "@/components/data-table/error-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSessionUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, hasStaffRole } from "@/lib/auth/staff-role"
import { HOLD_REASON_LABELS, payrollPeriodFor, wibDateOf } from "@/lib/finance"
import { loadPayrollPeriodDetail } from "@/lib/finance/payroll-load"
import { formatRupiah } from "@/lib/utils"
import { ClosePeriodButton } from "../ClosePeriodButton"

export const dynamic = "force-dynamic"

export const metadata = { title: "Rincian Payroll | Solulu Admin" }

const START_PARAM = /^\d{4}-\d{2}-(01|16)$/

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">{children}</div>
}

export default async function PayrollPeriodPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params
  const user = await getSessionUser()
  if (!hasStaffRole(user, ADMIN_ROLES)) {
    return <Shell><ErrorState title="Akses ditolak" message="Payroll hanya dapat dibuka oleh Admin atau Superadmin." /></Shell>
  }
  let normalized: string | null = null
  try {
    if (START_PARAM.test(period)) normalized = payrollPeriodFor(period).startDate
  } catch {
    normalized = null
  }
  if (normalized !== period) {
    return <Shell><ErrorState title="Periode tidak ditemukan" message="Alamat periode tidak valid." /></Shell>
  }

  const now = new Date()
  let detail: Awaited<ReturnType<typeof loadPayrollPeriodDetail>>
  try {
    detail = await loadPayrollPeriodDetail({ startDate: period, now })
  } catch (err) {
    console.error("[admin/payroll] gagal memuat rincian", err)
    return <Shell><ErrorState message="Rincian payroll tidak dapat dimuat saat ini. Muat ulang halaman." /></Shell>
  }

  const ended = wibDateOf(now) > detail.endDate
  const closed = detail.status === "closed"

  return (
    <Shell>
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <Link href="/admin/payroll" className="text-sm text-muted-foreground hover:underline">
            Payroll
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Periode {detail.label}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={closed ? "secondary" : "outline"}>{closed ? "Tertutup" : "Terbuka"}</Badge>
            <span>Total {formatRupiah(detail.total)}</span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Button variant="outline" asChild>
            <a href={`/admin/payroll/${detail.startDate}/export`} download>
              <Download data-icon="inline-start" />
              Ekspor CSV
            </a>
          </Button>
          {!closed && <ClosePeriodButton startDate={detail.startDate} label={detail.label} canClose={ended} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Honor per Konselor</CardTitle>
          <CardDescription>Hanya honor yang sudah masuk periode ini; honor tertahan ada di bawah.</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.counselors.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Belum ada honor di periode ini</EmptyTitle>
                <EmptyDescription>Honor masuk setelah sesi selesai atau No-Show dan laporan sesi diserahkan.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Konselor</TableHead>
                  <TableHead>Rekening</TableHead>
                  <TableHead className="text-right">Sesi</TableHead>
                  <TableHead className="text-right">Pokok</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.counselors.map((c) => (
                  <TableRow key={c.counselorId}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">
                      {c.bankComplete ? (
                        <>
                          {c.bankName} {c.accountNumber}
                          <span className="block text-xs text-muted-foreground">a.n. {c.accountHolder}</span>
                        </>
                      ) : (
                        <Badge variant="destructive">Rekening belum lengkap</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.sessionCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(c.baseTotal)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(c.overtimeTotal)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatRupiah(c.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {detail.held.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Honor Tertahan</CardTitle>
            <CardDescription>
              Belum masuk periode mana pun. Honor ini otomatis masuk periode terbuka begitu syaratnya terpenuhi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Konselor</TableHead>
                  <TableHead>Sesi</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.held.flatMap((h) =>
                  h.lines.map((l) => (
                    <TableRow key={`${h.counselorId}-${l.bookingId}-${l.part}`}>
                      <TableCell>{h.name}</TableCell>
                      <TableCell className="font-mono text-xs">{l.bookingCode}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.reasons.map((r) => HOLD_REASON_LABELS[r]).join("; ")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(l.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Shell>
  )
}
