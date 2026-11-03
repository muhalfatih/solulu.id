"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { DailyPoint, Heatmap, PaymentMixSlice, ServiceSessions } from "@/lib/admin-metrics"
import { cn, formatRupiah } from "@/lib/utils"

/** `YYYY-MM-DD` (tanggal kalender WIB) sebagai teks id-ID; tanpa konversi zona. */
const fmt = (day: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("id-ID", { ...opts, timeZone: "UTC" })
const shortDay = (day: string) => fmt(day, { day: "numeric", month: "short" })
const weekday = (day: string) => fmt(day, { weekday: "short" })
const longDay = (day: string) => fmt(day, { weekday: "long", day: "numeric", month: "long", year: "numeric" })

const compactRupiah = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`
    : v >= 1000
      ? `${Math.round(v / 1000)} rb`
      : String(v)

/** Alternatif tabel untuk setiap chart; dapat dijangkau keyboard (details/summary). */
function TableAlternative({ children, label = "Lihat sebagai tabel" }: { children: React.ReactNode; label?: string }) {
  return (
    <details className="group text-sm">
      <summary className="w-fit cursor-pointer rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none select-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
        {label}
      </summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-md border">{children}</div>
    </details>
  )
}

// ------------------------------------------------------------ Omzet vs HPP
const revenueConfig = {
  omzet: { label: "Omzet", color: "var(--chart-1)" },
  hpp: { label: "HPP (honor)", color: "var(--chart-2)" },
} satisfies ChartConfig

export function RevenueHppChart({ data }: { data: DailyPoint[] }) {
  const totals = data.reduce((acc, d) => ({ omzet: acc.omzet + d.omzet, hpp: acc.hpp + d.hpp }), { omzet: 0, hpp: 0 })
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm" aria-label="Total rentang">
        {(Object.keys(revenueConfig) as (keyof typeof revenueConfig)[]).map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span className="size-2.5 rounded-[3px]" style={{ background: `var(--color-${key})` }} aria-hidden />
            <span className="text-muted-foreground">{revenueConfig[key].label}</span>
            <span className="font-medium tabular-nums">{formatRupiah(totals[key])}</span>
          </li>
        ))}
      </ul>
      <ChartContainer config={revenueConfig} className="aspect-auto h-64 w-full">
        <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }} accessibilityLayer>
          <CartesianGrid vertical={false} strokeOpacity={0.5} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={shortDay} />
          <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={compactRupiah} />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => longDay(String(payload?.[0]?.payload?.day ?? ""))}
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {revenueConfig[name as keyof typeof revenueConfig]?.label ?? name}
                    </span>
                    <span className="font-mono font-medium text-foreground tabular-nums">{formatRupiah(Number(value))}</span>
                  </div>
                )}
              />
            }
          />
          <Area isAnimationActive={false} dataKey="omzet" type="linear" stroke="var(--color-omzet)" strokeWidth={2} fill="var(--color-omzet)" fillOpacity={0.12} />
          <Area isAnimationActive={false} dataKey="hpp" type="linear" stroke="var(--color-hpp)" strokeWidth={2} fill="var(--color-hpp)" fillOpacity={0.08} />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
      <TableAlternative>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Omzet</TableHead>
              <TableHead className="text-right">HPP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.day}>
                <TableCell>{longDay(d.day)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(d.omzet)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(d.hpp)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableAlternative>
    </div>
  )
}

// ------------------------------------------------------ Sesi per Layanan
const serviceConfig = {
  selesai: { label: "Selesai", color: "var(--chart-1)" },
  noShow: { label: "No-Show", color: "var(--chart-2)" },
} satisfies ChartConfig

const hideZero = (v: unknown) => (Number(v) > 0 ? String(v) : "")

export function SessionsByServiceChart({ data }: { data: ServiceSessions[] }) {
  return (
    <div className="flex flex-col gap-3">
      <ChartContainer config={serviceConfig} className="aspect-auto h-56 w-full">
        <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }} accessibilityLayer>
          <CartesianGrid vertical={false} strokeOpacity={0.5} />
          <XAxis dataKey="layanan" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
          <Bar isAnimationActive={false} dataKey="selesai" stackId="s" fill="var(--color-selesai)" stroke="var(--background)" strokeWidth={2} maxBarSize={56}>
            <LabelList dataKey="selesai" position="center" formatter={hideZero} className="fill-white text-xs" />
          </Bar>
          <Bar isAnimationActive={false} dataKey="noShow" stackId="s" fill="var(--color-noShow)" stroke="var(--background)" strokeWidth={2} maxBarSize={56}>
            <LabelList dataKey="noShow" position="center" formatter={hideZero} className="fill-white text-xs" />
          </Bar>
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
      <TableAlternative>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layanan</TableHead>
              <TableHead className="text-right">Selesai</TableHead>
              <TableHead className="text-right">No-Show</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((s) => (
              <TableRow key={s.serviceId}>
                <TableCell>{s.layanan}</TableCell>
                <TableCell className="text-right tabular-nums">{s.selesai}</TableCell>
                <TableCell className="text-right tabular-nums">{s.noShow}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableAlternative>
    </div>
  )
}

// ------------------------------------------------------------ Metode bayar
const paymentConfig = {
  xendit: { label: "Xendit", color: "var(--chart-1)" },
  transfer: { label: "Transfer Manual", color: "var(--chart-2)" },
  bypass: { label: "Booking Rp 0", color: "var(--chart-3)" },
  other: { label: "Lainnya", color: "var(--chart-4)" },
} satisfies ChartConfig

export function PaymentMixChart({ data }: { data: PaymentMixSlice[] }) {
  const total = data.reduce((a, b) => a + b.count, 0)
  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={paymentConfig} className="mx-auto aspect-square h-44">
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie isAnimationActive={false} data={data} dataKey="count" nameKey="key" innerRadius={52} outerRadius={78} strokeWidth={2} stroke="var(--background)">
            {data.map((d) => (
              <Cell key={d.key} fill={`var(--color-${d.key})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <p className="text-center text-sm text-muted-foreground">
        <span className="text-lg font-semibold text-foreground tabular-nums">{total}</span> transaksi lunas
      </p>
      {/* Legenda sekaligus label langsung: warna chart-3 kontrasnya rendah, jadi nilai selalu tertulis. */}
      <ul className="flex flex-col gap-1.5 text-sm" aria-label="Metode bayar">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: `var(--color-${d.key})` }} aria-hidden />
            <span className="flex-1 text-muted-foreground">{d.label}</span>
            <span className="tabular-nums">{d.count}</span>
            <span className="w-28 text-right font-mono text-xs text-muted-foreground tabular-nums">{formatRupiah(d.amount)}</span>
          </li>
        ))}
      </ul>
      <TableAlternative>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metode</TableHead>
              <TableHead className="text-right">Transaksi</TableHead>
              <TableHead className="text-right">Nilai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.key}>
                <TableCell>{d.label}</TableCell>
                <TableCell className="text-right tabular-nums">{d.count}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(d.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableAlternative>
    </div>
  )
}

// ---------------------------------------------------------- Heatmap slot
const SLOT_LABELS = ["08.00", "10.00", "12.00", "14.00", "16.00", "18.00", "20.00"]

export function SlotHeatmap({ heatmap }: { heatmap: Heatmap }) {
  const { days, rows } = heatmap
  return (
    <div className="flex flex-col gap-3">
      <div
        role="table"
        aria-label="Keterisian slot per hari"
        className="grid gap-1"
        style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div role="row" className="contents">
          <span role="columnheader" className="sr-only">
            Slot
          </span>
          {days.map((d) => (
            <span role="columnheader" key={d} className="pb-1 text-center text-xs text-muted-foreground">
              <span className="block">{weekday(d)}</span>
              <span className="block tabular-nums">{shortDay(d)}</span>
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div role="row" key={row.slotIndex} className="contents">
            <span role="rowheader" className="self-center text-xs text-muted-foreground tabular-nums">
              {SLOT_LABELS[row.slotIndex - 1]}
            </span>
            {row.cells.map((c) => (
              <Tooltip key={c.day}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="cell"
                    aria-label={`${longDay(c.day)}, slot ${SLOT_LABELS[row.slotIndex - 1]} WIB: ${c.booked} terisi dari ${c.opened} slot dibuka`}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-[4px] text-[11px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      c.level === null && "bg-muted/40 text-muted-foreground",
                      c.level === 0 && "bg-muted text-muted-foreground",
                      c.level !== null && c.level >= 4 && "text-white",
                      c.level !== null && c.level >= 1 && c.level <= 3 && "text-foreground"
                    )}
                    style={c.level !== null && c.level >= 1 ? { background: `var(--heat-${c.level})` } : undefined}
                  >
                    {c.level === null ? "-" : c.booked}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {longDay(c.day)} · {SLOT_LABELS[row.slotIndex - 1]} WIB: {c.booked} terisi dari {c.opened} slot dibuka
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Kosong</span>
        <span className="h-2.5 w-4 rounded-[3px] bg-muted" aria-hidden />
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="h-2.5 w-4 rounded-[3px]" style={{ background: `var(--heat-${n})` }} aria-hidden />
        ))}
        <span>Penuh</span>
        <span className="ml-auto">Angka = sesi terisi, tanda - = tidak ada konselor membuka slot</span>
      </div>
      <TableAlternative>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slot (WIB)</TableHead>
              {days.map((d) => (
                <TableHead key={d} className="text-right whitespace-nowrap">
                  {weekday(d)} {shortDay(d)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.slotIndex}>
                <TableCell className="tabular-nums">{SLOT_LABELS[row.slotIndex - 1]}</TableCell>
                {row.cells.map((c) => (
                  <TableCell key={c.day} className="text-right tabular-nums">
                    {c.level === null ? "-" : `${c.booked}/${c.opened}`}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableAlternative>
    </div>
  )
}
