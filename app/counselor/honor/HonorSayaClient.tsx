"use client"

import * as React from "react"
import { AlertCircle, Lock, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatRupiah } from "@/lib/utils"
import { HOLD_REASON_LABELS, type HonorLine, type HonorSayaView } from "@/lib/finance"

interface HonorSayaClientProps {
  view: HonorSayaView | null
  error: string | null
}

function formatSessionDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  )
}

function LineRow({ line }: { line: HonorLine }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">{formatSessionDate(line.sessionDate)}</TableCell>
      <TableCell>
        <span className="font-mono text-xs">{line.bookingCode}</span>
        <span className="block text-xs text-muted-foreground">{line.serviceName}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{line.part === "base" ? "Honor pokok" : "Honor overtime"}</Badge>
          {line.sessionStatus === "no_show" && <Badge variant="secondary">No-Show (dibayar penuh)</Badge>}
        </div>
      </TableCell>
      {line.reasons.length > 0 && (
        <TableCell className="text-sm text-muted-foreground">
          {line.reasons.map((r) => HOLD_REASON_LABELS[r]).join("; ")}
        </TableCell>
      )}
      <TableCell className="text-right font-medium tabular-nums">{formatRupiah(line.amount)}</TableCell>
    </TableRow>
  )
}

export function HonorSayaClient({ view, error }: HonorSayaClientProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1 pb-5 border-b border-border/60">
        <h1 className="text-2xl font-semibold tracking-tight">Honor Saya</h1>
        <p className="text-sm text-muted-foreground">
          Honor Anda per Periode Payroll, termasuk honor yang tertahan dan alasannya. Pencairan dilakukan Admin lewat
          transfer bank sesuai rekening di Profil.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Gagal memuat honor</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {view && view.held.lines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" aria-hidden />
              Honor tertahan: {formatRupiah(view.held.total)}
            </CardTitle>
            <CardDescription>
              Honor ini belum masuk periode mana pun. Begitu syaratnya terpenuhi, honor otomatis masuk periode yang
              masih terbuka.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal sesi</TableHead>
                  <TableHead>Sesi</TableHead>
                  <TableHead>Bagian</TableHead>
                  <TableHead>Alasan ditahan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.held.lines.map((line) => (
                  <LineRow key={`${line.bookingId}-${line.part}`} line={line} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {view && view.periods.length === 0 && view.held.lines.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wallet />
            </EmptyMedia>
            <EmptyTitle>Belum ada honor</EmptyTitle>
            <EmptyDescription>
              Honor muncul setelah sesi Anda selesai atau klien tidak hadir (No-Show).
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {view?.periods.map((period) => (
        <Card key={period.startDate}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                Periode {period.label}
                <Badge variant={period.status === "closed" ? "secondary" : "outline"}>
                  {period.status === "closed" ? "Ditutup" : "Terbuka"}
                </Badge>
              </span>
              <span className="tabular-nums">{formatRupiah(period.total)}</span>
            </CardTitle>
            <CardDescription>
              {period.sessionCount} sesi. Pokok {formatRupiah(period.baseTotal)}, overtime{" "}
              {formatRupiah(period.overtimeTotal)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal sesi</TableHead>
                  <TableHead>Sesi</TableHead>
                  <TableHead>Bagian</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {period.lines.map((line) => (
                  <LineRow key={`${line.bookingId}-${line.part}`} line={line} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
