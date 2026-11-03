import Link from "next/link"
import { Lock, Wallet } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { PoolQueueRow } from "@/components/pool/pool-queue"
import type { HonorDashboardSummary } from "@/lib/counselor/dashboard"
import { formatRupiah } from "@/lib/utils"
import { PoolQueueDashboard } from "./PoolQueueDashboard"

export const POOL_PREVIEW_LIMIT = 5

export function HonorSummary({ summary, error }: { summary: HonorDashboardSummary | null; error: string | null }) {
  if (!summary) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error ?? "Honor belum dapat dimuat."}</AlertDescription>
      </Alert>
    )
  }
  const hasHeld = summary.heldTotal > 0
  return (
    <section aria-label="Honor Saya" className="grid gap-4 sm:grid-cols-2">
      <Card size="sm">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Wallet className="size-4" aria-hidden />
            Honor Saya, periode {summary.periodLabel}
          </CardDescription>
          <CardTitle className="text-3xl tabular-nums">{formatRupiah(summary.total)}</CardTitle>
          <CardAction>
            <Badge variant={summary.status === "closed" ? "secondary" : "outline"}>
              {summary.status === "closed" ? "Ditutup" : "Terbuka"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
          {summary.sessionCount === 0
            ? "Belum ada honor pada periode ini."
            : `${summary.sessionCount} sesi. Pokok ${formatRupiah(summary.baseTotal)}, overtime ${formatRupiah(summary.overtimeTotal)}.`}
          </p>
        </CardFooter>
      </Card>
      <Card size="sm">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Lock className="size-4" aria-hidden />
            Honor tertahan
          </CardDescription>
          <CardTitle className="text-3xl tabular-nums">{formatRupiah(summary.heldTotal)}</CardTitle>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/counselor/honor">Rincian</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
          {hasHeld
            ? `${summary.heldCount} sesi menunggu syarat terpenuhi, misalnya laporan sesi.`
            : "Tidak ada honor yang tertahan."}
          </p>
        </CardFooter>
      </Card>
    </section>
  )
}

export function PoolSummary({ items, error }: { items: PoolQueueRow[]; error: string | null }) {
  const shown = items.slice(0, POOL_PREVIEW_LIMIT)
  return (
    <section aria-labelledby="pool-heading" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="pool-heading" className="text-sm font-medium text-muted-foreground">
          Klien Tersedia{items.length > 0 ? ` (${items.length})` : ""}
        </h2>
        {items.length > shown.length && (
          <Button asChild variant="link" size="sm">
            <Link href="/counselor/klien-tersedia">Lihat semua</Link>
          </Button>
        )}
      </div>
      <PoolQueueDashboard items={shown} error={error} />
    </section>
  )
}
