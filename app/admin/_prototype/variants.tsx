// PROTOTYPE — three structurally different admin dashboard variants.
// A: Pusat Kendali   — attention strip, KPI row, chart grid (balanced overview)
// B: Operasional     — ops column (tasks + capacity) with a finance side rail
// C: Laporan Periode — editorial P&L statement + tabbed chart/table sections
import Link from "next/link"
import { AlertTriangle, ChartArea, Inbox } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRupiah } from "@/lib/utils"
import type { DashboardData } from "./dashboard-data"
import { AttentionList, DeltaBadge, fmtDate, kpiDisplay, rangeLabel, type KpiKey } from "./parts"
import { DataTableToggle, PaymentMixChart, RevenueHppChart, SessionsByServiceChart, SlotHeatmap } from "./charts"
import { RangeFilter } from "./range-filter"

type Props = { data: DashboardData }
const KPIS: KpiKey[] = ["omzet", "laba", "sesi", "okupansi"]

const hasMoney = (d: DashboardData) => d.daily.some((x) => x.omzet > 0 || x.hpp > 0)
const hasSessions = (d: DashboardData) => d.perService.some((x) => x.selesai + x.noShow > 0)

function NoData({ title, hint }: { title: string; hint?: string }) {
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

function DailyTable({ data }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead className="text-right">Omzet</TableHead>
          <TableHead className="text-right">HPP</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.daily
          .filter((d) => d.omzet || d.hpp)
          .map((d) => (
            <TableRow key={d.day}>
              <TableCell>{fmtDate(d.day)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatRupiah(d.omzet)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatRupiah(d.hpp)}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )
}

function ServiceTable({ data }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Layanan</TableHead>
          <TableHead className="text-right">Selesai</TableHead>
          <TableHead className="text-right">No-Show</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.perService.map((s) => (
          <TableRow key={s.layanan}>
            <TableCell>{s.layanan}</TableCell>
            <TableCell className="text-right tabular-nums">{s.selesai}</TableCell>
            <TableCell className="text-right tabular-nums">{s.noShow}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PageTitle({ data, title }: Props & { title: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {rangeLabel(data.range)} · dibanding {fmtDate(data.range.prevStart)} – {fmtDate(data.range.prevEnd)}
        </p>
      </div>
      <RangeFilter value={data.range.key} />
    </div>
  )
}

// =============================================================== VARIANT A
export function VariantA({ data }: Props) {
  return (
    <div className="flex flex-col gap-6 p-4 pt-2 md:p-6 md:pt-2">
      <PageTitle data={data} title="Dashboard" />

      <section aria-labelledby="a-attn" className="flex flex-col gap-2">
        <h2 id="a-attn" className="text-sm font-medium text-muted-foreground">
          Perlu Tindakan
        </h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {data.attention.map((it) => (
            <Link
              key={it.key}
              href={it.href}
              aria-disabled={it.count === null}
              className="flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring aria-disabled:pointer-events-none aria-disabled:opacity-60"
            >
              <span className="text-2xl font-semibold tabular-nums">{it.count ?? "–"}</span>
              <span className="truncate text-xs text-muted-foreground">{it.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Indikator utama" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => {
          const v = kpiDisplay(data, k)
          return (
            <Card key={k} size="sm">
              <CardHeader>
                <CardDescription>{v.label}</CardDescription>
                <div className="text-2xl font-semibold tracking-tight tabular-nums">{v.value}</div>
                <CardAction>
                  <DeltaBadge delta={v.delta} kind={v.kind} />
                </CardAction>
              </CardHeader>
              <CardFooter className="text-xs text-muted-foreground">{v.sub}</CardFooter>
            </Card>
          )
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Omzet vs HPP</CardTitle>
            <CardDescription>Rupiah per hari · Omzet per tanggal lunas, HPP per tanggal sesi (estimasi Bagi Hasil PRD)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {hasMoney(data) ? (
              <>
                <RevenueHppChart data={data.daily} />
                <DataTableToggle summary="Tampilkan sebagai tabel">
                  <DailyTable data={data} />
                </DataTableToggle>
              </>
            ) : (
              <NoData title="Belum ada omzet" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Metode Bayar</CardTitle>
            <CardDescription>Transaksi lunas</CardDescription>
          </CardHeader>
          <CardContent>
            {data.payments.length ? <PaymentMixChart data={data.payments} /> : <NoData title="Belum ada transaksi" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sesi per Layanan</CardTitle>
            <CardDescription>Selesai vs No-Show</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {hasSessions(data) ? (
              <>
                <SessionsByServiceChart data={data.perService} />
                <DataTableToggle summary="Tampilkan sebagai tabel">
                  <ServiceTable data={data} />
                </DataTableToggle>
              </>
            ) : (
              <NoData title="Belum ada sesi selesai" />
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Keterisian Slot</CardTitle>
            <CardDescription>7 slot × 7 hari · terisi dari slot yang dibuka konselor</CardDescription>
          </CardHeader>
          <CardContent>
            <SlotHeatmap rows={data.heatmap} days={data.heatDays} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =============================================================== VARIANT B
export function VariantB({ data }: Props) {
  const urgent = data.attention.filter((a) => (a.count ?? 0) > 0).length
  return (
    <div className="flex flex-col gap-6 p-4 pt-2 md:p-6 md:pt-2">
      <PageTitle data={data} title="Operasional Hari Ini" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Main ops column */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="text-muted-foreground" aria-hidden /> Perlu Tindakan
              </CardTitle>
              <CardDescription>{urgent ? `${urgent} antrean menunggu Anda` : "Semua antrean bersih"}</CardDescription>
            </CardHeader>
            <CardContent>
              <AttentionList items={data.attention} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Kapasitas 7 Hari</CardTitle>
              <CardDescription>Arahkan ke sel untuk detail · angka = sesi terisi</CardDescription>
            </CardHeader>
            <CardContent>
              <SlotHeatmap rows={data.heatmap} days={data.heatDays} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sesi per Layanan</CardTitle>
              <CardDescription>{rangeLabel(data.range)}</CardDescription>
            </CardHeader>
            <CardContent>
              {hasSessions(data) ? (
                <SessionsByServiceChart data={data.perService} layout="vertical" className="h-36" />
              ) : (
                <NoData title="Belum ada sesi selesai" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Finance rail */}
        <aside aria-label="Ringkasan keuangan" className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Keuangan Periode</CardTitle>
              <CardDescription>{rangeLabel(data.range)}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col divide-y">
                {KPIS.map((k) => {
                  const v = kpiDisplay(data, k)
                  return (
                    <div key={k} className="flex items-center justify-between gap-2 py-2.5">
                      <dt className="flex flex-col">
                        <span className="text-sm text-muted-foreground">{v.label}</span>
                        <span className="text-xs text-muted-foreground/80">{v.sub}</span>
                      </dt>
                      <dd className="flex flex-col items-end gap-1">
                        <span className="font-semibold tabular-nums">{v.value}</span>
                        <DeltaBadge delta={v.delta} kind={v.kind} />
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Omzet vs HPP</CardTitle>
            </CardHeader>
            <CardContent>
              {hasMoney(data) ? <RevenueHppChart data={data.daily} className="h-40" /> : <NoData title="Belum ada omzet" hint="Ganti rentang waktu di atas." />}
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Metode Bayar</CardTitle>
            </CardHeader>
            <CardContent>
              {data.payments.length ? <PaymentMixChart data={data.payments} /> : <NoData title="Belum ada transaksi" hint="Ganti rentang waktu di atas." />}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

// =============================================================== VARIANT C
export function VariantC({ data }: Props) {
  const k = data.kpi
  const urgent = data.attention.filter((a) => (a.count ?? 0) > 0)
  const margin = k.omzet.value ? k.laba.value / k.omzet.value : null
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pt-2 md:p-8 md:pt-2">
      {urgent.length > 0 && (
        <Alert>
          <AlertTriangle />
          <AlertTitle>Perlu tindakan hari ini</AlertTitle>
          <AlertDescription>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {urgent.map((u) => (
                <Link key={u.key} href={u.href} className="underline-offset-4 hover:underline">
                  <strong className="tabular-nums">{u.count}</strong> {u.label.toLowerCase()}
                </Link>
              ))}
            </span>
          </AlertDescription>
        </Alert>
      )}

      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Laporan {rangeLabel(data.range)}</p>
          <RangeFilter value={data.range.key} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Laba Bersih</span>
          <span className="text-5xl font-semibold tracking-tight tabular-nums">{formatRupiah(k.laba.value)}</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <DeltaBadge delta={k.laba.delta} /> vs periode sebelumnya
            {margin !== null && <> · margin {(margin * 100).toFixed(0)}%</>}
          </span>
        </div>
        {/* P&L statement strip */}
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
          {[
            { label: "Omzet terverifikasi", value: k.omzet.value, d: k.omzet.delta, op: "" },
            { label: "HPP honor konselor", value: k.hpp.value, d: k.hpp.delta, op: "−" },
            { label: "Laba bersih", value: k.laba.value, d: k.laba.delta, op: "=" },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-1 bg-card p-4">
              <span className="text-xs text-muted-foreground">
                {row.op && <span className="mr-1 font-mono">{row.op}</span>}
                {row.label}
              </span>
              <span className="text-xl font-semibold tabular-nums">{formatRupiah(row.value)}</span>
              <DeltaBadge delta={row.d} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {k.sesi.value} sesi selesai · {k.sesi.noShow} No-Show · keterisian slot{" "}
          {k.okupansi.value === null ? "–" : `${(k.okupansi.value * 100).toFixed(1)}%`} ({k.okupansi.booked}/{k.okupansi.opened})
        </p>
      </header>

      <Separator />

      <Tabs defaultValue="keuangan" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="keuangan">Keuangan</TabsTrigger>
          <TabsTrigger value="sesi">Sesi</TabsTrigger>
          <TabsTrigger value="kapasitas">Kapasitas</TabsTrigger>
          <TabsTrigger value="bayar">Pembayaran</TabsTrigger>
        </TabsList>
        <TabsContent value="keuangan" className="flex flex-col gap-4">
          {hasMoney(data) ? (
            <>
              <RevenueHppChart data={data.daily} className="h-72" />
              <div className="rounded-md border">
                <DailyTable data={data} />
              </div>
            </>
          ) : (
            <NoData title="Belum ada omzet" />
          )}
        </TabsContent>
        <TabsContent value="sesi" className="flex flex-col gap-4">
          {hasSessions(data) ? (
            <>
              <SessionsByServiceChart data={data.perService} className="h-64" />
              <div className="rounded-md border">
                <ServiceTable data={data} />
              </div>
            </>
          ) : (
            <NoData title="Belum ada sesi selesai" />
          )}
        </TabsContent>
        <TabsContent value="kapasitas">
          <SlotHeatmap rows={data.heatmap} days={data.heatDays} />
        </TabsContent>
        <TabsContent value="bayar" className="max-w-md">
          {data.payments.length ? <PaymentMixChart data={data.payments} /> : <NoData title="Belum ada transaksi" />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
