// PROTOTYPE — small pieces reused by the dashboard variants (server-renderable).
import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn, formatRupiah } from "@/lib/utils"
import type { AttentionItem, DashboardData } from "./dashboard-data"

export const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })

export function rangeLabel(r: DashboardData["range"]) {
  return `${fmtDate(r.start)} – ${fmtDate(r.end)}`
}

export function DeltaBadge({ delta, kind = "pct" }: { delta: number | null; kind?: "pct" | "pp" }) {
  if (delta === null || !Number.isFinite(delta)) {
    return (
      <Badge variant="outline" className="gap-1 font-normal text-muted-foreground" title="Periode pembanding tidak punya data">
        <Minus data-icon="inline-start" />
        <span className="sr-only">tidak ada pembanding</span>
        <span aria-hidden>n/a</span>
      </Badge>
    )
  }
  const up = delta >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const text = kind === "pct" ? `${(delta * 100).toFixed(0)}%` : `${(delta * 100).toFixed(1)} poin`
  return (
    <Badge variant={up ? "secondary" : "outline"} className="gap-1 tabular-nums">
      <Icon data-icon="inline-start" />
      {up ? "+" : ""}
      {text}
    </Badge>
  )
}

export type KpiKey = "omzet" | "laba" | "sesi" | "okupansi"

export function kpiDisplay(data: DashboardData, key: KpiKey) {
  const k = data.kpi
  switch (key) {
    case "omzet":
      return { label: "Omzet", value: formatRupiah(k.omzet.value), sub: `Lunas ${data.payments.reduce((a, b) => a + b.count, 0)} transaksi`, delta: k.omzet.delta, kind: "pct" as const }
    case "laba":
      return { label: "Laba Bersih", value: formatRupiah(k.laba.value), sub: `HPP estimasi ${formatRupiah(k.hpp.value)}`, delta: k.laba.delta, kind: "pct" as const }
    case "sesi":
      return { label: "Sesi Selesai", value: String(k.sesi.value), sub: `${k.sesi.noShow} No-Show`, delta: k.sesi.delta, kind: "pct" as const }
    case "okupansi":
      return {
        label: "Keterisian Slot",
        value: k.okupansi.value === null ? "–" : `${(k.okupansi.value * 100).toFixed(1)}%`,
        sub: `${k.okupansi.booked} dari ${k.okupansi.opened} slot dibuka`,
        delta: k.okupansi.delta,
        kind: "pp" as const,
      }
  }
}

export function AttentionList({ items, dense = false }: { items: AttentionItem[]; dense?: boolean }) {
  return (
    <ul className="flex flex-col divide-y">
      {items.map((it) => {
        const disabled = it.count === null
        const urgent = (it.count ?? 0) > 0
        return (
          <li key={it.key}>
            <Link
              href={it.href}
              aria-disabled={disabled}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
                dense ? "py-2" : "py-3",
                disabled && "pointer-events-none opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm font-semibold tabular-nums",
                  urgent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {disabled ? "–" : it.count}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{it.label}</span>
                {!dense && <span className="truncate text-xs text-muted-foreground">{it.hint}</span>}
              </span>
              {disabled ? (
                <Badge variant="outline" className="font-normal">
                  belum ada
                </Badge>
              ) : (
                <ChevronRight className="text-muted-foreground" aria-hidden />
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
