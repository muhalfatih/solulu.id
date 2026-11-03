import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, ChartArea, ChevronRight, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AuditLog } from "@/db/schema"
import type { AttentionItem, DashboardKpis } from "@/lib/admin-metrics"
import { formatDateId, formatDateTimeWib } from "@/lib/format/datetime"
import { cn, formatRupiah } from "@/lib/utils"

/** `YYYY-MM-DD` WIB sebagai tanggal id-ID. */
export const dayLabel = (day: string) => formatDateId(`${day}T00:00:00+07:00`)

export function NoData({ title, hint }: { title: string; hint?: string }) {
  return (
    <Empty className="min-h-48 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ChartArea />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{hint ?? "Belum ada data pada rentang ini. Coba pilih Periode lalu atau 30 hari."}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

// ------------------------------------------------------------ Perlu Tindakan
export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  return (
    <section aria-labelledby="attention-heading" className="flex flex-col gap-2">
      <h2 id="attention-heading" className="text-sm font-medium text-muted-foreground">
        Perlu Tindakan
      </h2>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => {
          const urgent = (item.count ?? 0) > 0
          return (
            <li key={item.key} className="flex">
              <Link
                href={item.href}
                className="flex w-full flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-card-foreground outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-2xl font-semibold tabular-nums",
                      item.count === null && "text-muted-foreground",
                      !urgent && item.count !== null && "text-muted-foreground"
                    )}
                  >
                    {item.count ?? "-"}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </span>
                <span className="text-sm leading-snug font-medium">{item.label}</span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {item.count === null ? "Jumlah tidak dapat dimuat" : item.hint}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// -------------------------------------------------------------------- KPI
function DeltaBadge({ percent, points }: { percent?: number | null; points?: number | null }) {
  const value = points !== undefined ? points : percent
  if (value === null || value === undefined) {
    return (
      <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
        <Minus data-icon="inline-start" />
        Tanpa pembanding
      </Badge>
    )
  }
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const abs = Math.abs(value).toLocaleString("id-ID")
  const text = points !== undefined ? `${abs} poin` : `${abs}%`
  return (
    <Badge variant={up ? "secondary" : "outline"} className="gap-1 tabular-nums">
      <Icon data-icon="inline-start" />
      <span className="sr-only">{up ? "naik" : "turun"}</span>
      {up ? "+" : "-"}
      {text}
    </Badge>
  )
}

export function KpiCards({ kpis, comparisonLabel }: { kpis: DashboardKpis; comparisonLabel: string }) {
  const cards = [
    {
      key: "omzet",
      label: "Omzet",
      value: formatRupiah(kpis.omzet.value),
      sub: `Pembanding ${formatRupiah(kpis.omzet.previous)}`,
      delta: <DeltaBadge percent={kpis.omzet.deltaPercent} />,
    },
    {
      key: "laba",
      label: "Laba Bersih",
      value: formatRupiah(kpis.labaBersih.value),
      sub: `Setelah HPP ${formatRupiah(kpis.hpp.value)}`,
      delta: <DeltaBadge percent={kpis.labaBersih.deltaPercent} />,
    },
    {
      key: "sesi",
      label: "Sesi Selesai",
      value: String(kpis.sesiSelesai.value),
      sub: `${kpis.sesiSelesai.noShow} No-Show`,
      delta: <DeltaBadge percent={kpis.sesiSelesai.deltaPercent} />,
    },
    {
      key: "slot",
      label: "Keterisian Slot",
      value: kpis.keterisian.value === null ? "-" : `${(kpis.keterisian.value * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`,
      sub:
        kpis.keterisian.opened === 0
          ? "Belum ada slot dibuka konselor"
          : `${kpis.keterisian.booked} dari ${kpis.keterisian.opened} slot dibuka`,
      delta: <DeltaBadge points={kpis.keterisian.deltaPoints} />,
    },
  ]
  return (
    <section aria-label={`Indikator utama, dibanding ${comparisonLabel}`} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.key} size="sm">
          <CardHeader>
            <CardDescription>{c.label}</CardDescription>
            <CardTitle className="text-2xl tracking-tight tabular-nums">{c.value}</CardTitle>
            <CardAction>{c.delta}</CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </CardFooter>
        </Card>
      ))}
    </section>
  )
}

// ---------------------------------------------------------- Jejak Audit
export function RecentAudit({ rows }: { rows: AuditLog[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jejak Audit Terbaru</CardTitle>
        <CardDescription>Aksi sensitif staf terakhir, hanya terlihat oleh Superadmin</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/audit">Lihat semua</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <NoData title="Belum ada catatan audit" hint="Catatan muncul setelah staf melakukan aksi sensitif." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aktor</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Entitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTimeWib(r.createdAt)}</TableCell>
                  <TableCell className="capitalize">{r.actorRole ?? "sistem"}</TableCell>
                  <TableCell>
                    <code className="text-xs">{r.action}</code>
                  </TableCell>
                  <TableCell>{r.entityType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
