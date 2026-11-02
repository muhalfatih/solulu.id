"use client"
// PROTOTYPE — chart pieces shared by the dashboard variants.
// Palette: dataviz reference categorical slots 1–3 (validated all-pairs, both modes).
// Aqua (slot 3) is < 3:1 on light → donut always shows direct values + a table.

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn, formatRupiah } from "@/lib/utils"
import type { DashboardData } from "./dashboard-data"

const SLOT = {
  1: { light: "#2a78d6", dark: "#3987e5" },
  2: { light: "#eb6834", dark: "#d95926" },
  3: { light: "#1baf7a", dark: "#199e70" },
}

export const compactRupiah = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}jt`
    : v >= 1000
      ? `${Math.round(v / 1000)}rb`
      : `${v}`

const shortDay = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" })
const weekday = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" })

// ---------------------------------------------------------------- Omzet vs HPP
const revenueConfig = {
  omzet: { label: "Omzet", theme: SLOT[1] },
  hpp: { label: "HPP (honor)", theme: SLOT[2] },
} satisfies ChartConfig

export function RevenueHppChart({ data, className }: { data: DashboardData["daily"]; className?: string }) {
  return (
    <ChartContainer config={revenueConfig} className={cn("aspect-auto h-64 w-full", className)}>
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }} accessibilityLayer>
        <CartesianGrid vertical={false} strokeDasharray="0" strokeOpacity={0.5} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={shortDay} />
        <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={compactRupiah} />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, p) => shortDay(String(p?.[0]?.payload?.day ?? ""))}
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{revenueConfig[name as keyof typeof revenueConfig]?.label}</span>
                  <span className="font-mono font-medium tabular-nums text-foreground">{formatRupiah(Number(value))}</span>
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
  )
}

// ------------------------------------------------------- Sessions per Layanan
const serviceConfig = {
  selesai: { label: "Selesai", theme: SLOT[1] },
  noShow: { label: "No-Show", theme: SLOT[2] },
} satisfies ChartConfig

export function SessionsByServiceChart({
  data,
  layout = "horizontal",
  className,
}: {
  data: DashboardData["perService"]
  layout?: "horizontal" | "vertical"
  className?: string
}) {
  const vertical = layout === "vertical"
  return (
    <ChartContainer config={serviceConfig} className={cn("aspect-auto h-56 w-full", className)}>
      <BarChart data={data} layout={vertical ? "vertical" : "horizontal"} margin={{ left: 4, right: 12 }} accessibilityLayer>
        <CartesianGrid vertical={vertical} horizontal={!vertical} strokeOpacity={0.5} />
        {vertical ? (
          <>
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="layanan" tickLine={false} axisLine={false} width={104} />
          </>
        ) : (
          <>
            <XAxis dataKey="layanan" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
          </>
        )}
        <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
        <Bar isAnimationActive={false} dataKey="selesai" stackId="s" fill="var(--color-selesai)" stroke="var(--background)" strokeWidth={2} radius={vertical ? [4, 0, 0, 4] : [0, 0, 4, 4]} maxBarSize={44} />
        <Bar isAnimationActive={false} dataKey="noShow" stackId="s" fill="var(--color-noShow)" stroke="var(--background)" strokeWidth={2} radius={vertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={44} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}

// ------------------------------------------------------------ Payment method
const paymentConfig = {
  xendit: { label: "Xendit", theme: SLOT[1] },
  transfer: { label: "Transfer Manual", theme: SLOT[2] },
  bypass: { label: "Booking Rp 0", theme: SLOT[3] },
} satisfies ChartConfig

export function PaymentMixChart({ data, className }: { data: DashboardData["payments"]; className?: string }) {
  const total = data.reduce((a, b) => a + b.count, 0)
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <ChartContainer config={paymentConfig} className="mx-auto aspect-square h-44">
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie isAnimationActive={false} data={data} dataKey="count" nameKey="key" innerRadius={52} outerRadius={78} strokeWidth={2} stroke="var(--background)">
            {data.map((d) => (
              <Cell key={d.key} fill={`var(--color-${d.key})`} />
            ))}
            <Label
              content={({ viewBox }) =>
                viewBox && "cx" in viewBox ? (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold tabular-nums">
                      {total}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                      transaksi
                    </tspan>
                  </text>
                ) : null
              }
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* Direct labels (relief rule for low-contrast slot) */}
      <ul className="flex flex-col gap-1.5 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: `var(--color-${d.key})` }} aria-hidden />
            <span className="flex-1 text-muted-foreground">{d.label}</span>
            <span className="tabular-nums text-foreground">{d.count}</span>
            <span className="w-24 text-right font-mono text-xs tabular-nums text-muted-foreground">{formatRupiah(d.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// --------------------------------------------------------------- Slot heatmap
// Sequential blue (dataviz ramp). Value = booked / opened in that cell.
const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"]

export function SlotHeatmap({
  rows,
  days,
  compact = false,
}: {
  rows: DashboardData["heatmap"]
  days: string[]
  compact?: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <div
        role="table"
        aria-label="Keterisian slot per hari"
        className="grid gap-1"
        style={{ gridTemplateColumns: `${compact ? "2.75rem" : "3.5rem"} repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div role="row" className="contents">
          <span role="columnheader" />
          {days.map((d) => (
            <span role="columnheader" key={d} className="pb-1 text-center text-xs text-muted-foreground">
              <span className="block">{weekday(d)}</span>
              {!compact && <span className="block tabular-nums">{shortDay(d)}</span>}
            </span>
          ))}
        </div>
        {rows.map((r) => (
          <div role="row" key={r.slot} className="contents">
            <span role="rowheader" className="self-center text-xs tabular-nums text-muted-foreground">
              {r.label}
            </span>
            {r.cells.map((c) => {
              const ratio = c.opened ? c.booked / c.opened : 0
              const step = c.booked === 0 ? -1 : Math.min(RAMP.length - 1, Math.floor(ratio * RAMP.length))
              return (
                <Tooltip key={c.day}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      role="cell"
                      aria-label={`${weekday(c.day)} ${shortDay(c.day)} slot ${r.label}: ${c.booked} terisi dari ${c.opened} dibuka`}
                      className={cn(
                        "flex items-center justify-center rounded-[4px] text-[11px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        compact ? "h-6" : "h-8",
                        c.opened === 0 ? "bg-muted/40 text-muted-foreground/60" : step < 0 ? "bg-muted text-muted-foreground" : ""
                      )}
                      style={step >= 0 ? { background: RAMP[step], color: step >= 3 ? "#fff" : "#0d366b" } : undefined}
                    >
                      {c.opened === 0 ? "–" : c.booked > 0 ? c.booked : ""}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {weekday(c.day)} {shortDay(c.day)} · {r.label} WIB — {c.booked} terisi / {c.opened} slot dibuka konselor
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Kosong</span>
        <span className="h-2.5 w-4 rounded-[3px] bg-muted" />
        {RAMP.map((c) => (
          <span key={c} className="h-2.5 w-4 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>Penuh</span>
        <span className="ml-auto">– = tidak ada konselor membuka slot</span>
      </div>
    </div>
  )
}

// --------------------------------------------------------- Data-table fallback
export function DataTableToggle({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer select-none text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-2">
        {summary}
      </summary>
      <div className="mt-2 max-h-60 overflow-auto rounded-md border">{children}</div>
    </details>
  )
}
