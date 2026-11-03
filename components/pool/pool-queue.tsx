"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface PoolQueueRow {
  bookingId: string
  bookingCode: string
  serviceName: string
  poolDate: string
  startTime: string
  endTime: string
  candidates?: { id: string; fullName: string }[]
}

type Result = { success: true } | { success: false; error: string }

/** Antrean Klien Tersedia; mode "claim" untuk konselor, "assign" untuk Admin. */
export function PoolQueue({
  items,
  error,
  mode,
  onClaim,
  onAssign,
}: {
  items: PoolQueueRow[]
  error: string | null
  mode: "claim" | "assign"
  onClaim?: (bookingId: string) => Promise<Result>
  onAssign?: (bookingId: string, counselorId: string) => Promise<Result>
}) {
  const [pending, setPending] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [picked, setPicked] = React.useState<Record<string, string>>({})
  const [done, setDone] = React.useState<Set<string>>(new Set())

  const run = async (id: string, fn: () => Promise<Result>) => {
    setPending(id)
    setMessage(null)
    const res = await fn()
    setPending(null)
    if (res.success) setDone((d) => new Set(d).add(id))
    else setMessage(res.error)
  }

  const rows = items.filter((i) => !done.has(i.bookingId))

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {rows.length === 0 && !error ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Tidak ada klien tersedia</EmptyTitle>
            <EmptyDescription>Belum ada booking Konselor Bebas yang menunggu konselor.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Jadwal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.bookingId}>
                    <TableCell className="font-mono text-xs">{r.bookingCode}</TableCell>
                    <TableCell>{r.serviceName}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {r.poolDate}, {r.startTime.slice(0, 5)} - {r.endTime.slice(0, 5)} WIB
                    </TableCell>
                    <TableCell className="text-right">
                      {mode === "claim" ? (
                        <Button size="sm" disabled={pending === r.bookingId} onClick={() => run(r.bookingId, () => onClaim!(r.bookingId))}>
                          {pending === r.bookingId && <Loader2 className="mr-1 size-4 animate-spin" />}
                          Klaim Sesi
                        </Button>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            aria-label="Pilih konselor"
                            className="h-8 rounded-md border bg-background px-2 text-sm"
                            value={picked[r.bookingId] ?? ""}
                            onChange={(e) => setPicked((p) => ({ ...p, [r.bookingId]: e.target.value }))}
                          >
                            <option value="">Pilih konselor</option>
                            {(r.candidates ?? []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.fullName}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            disabled={!picked[r.bookingId] || pending === r.bookingId}
                            onClick={() => run(r.bookingId, () => onAssign!(r.bookingId, picked[r.bookingId]))}
                          >
                            {pending === r.bookingId && <Loader2 className="mr-1 size-4 animate-spin" />}
                            Tugaskan
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
