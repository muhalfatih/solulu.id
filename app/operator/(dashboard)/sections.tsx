import Link from "next/link"
import { CalendarX2, MessageSquareOff, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type {
  OperatorDashboardData,
  OperatorDashboardSlot,
  OperatorDashboardZoomAccount,
  ZoomAccountState,
} from "@/lib/operator/dashboard"
import { WA_TEMPLATE_META } from "@/lib/whatsapp/templates"
import { formatDateId } from "@/lib/format/datetime"

const dayLabel = (day: string) => formatDateId(`${day}T00:00:00+07:00`)

export function StatCards({ data }: { data: OperatorDashboardData }) {
  const stats = [
    { label: "Sesi hari ini", value: data.totalSessions, hint: `${dayLabel(data.date)}, 7 slot WIB` },
    {
      label: "Slot Breakout",
      value: data.breakoutSlots,
      hint: data.breakoutSlots > 0 ? "Lebih dari 4 sesi: Zoom 4 Breakout" : "Semua slot Zoom langsung",
    },
    {
      label: "WhatsApp belum dikirim",
      value: data.pendingDispatch.total,
      hint: data.pendingDispatch.total > 0 ? "Menunggu Dispatch" : "Antrean kosong",
    },
  ]
  return (
    <section aria-label="Ringkasan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} size="sm">
          <CardHeader>
            <CardDescription>{s.label}</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
          </CardHeader>
          <CardFooter>
            <p className="text-xs text-muted-foreground">{s.hint}</p>
          </CardFooter>
        </Card>
      ))}
    </section>
  )
}

function ModeBadge({ slot }: { slot: OperatorDashboardSlot }) {
  if (slot.sessionCount === 0) return <Badge variant="outline">Kosong</Badge>
  return slot.mode === "breakout_room" ? (
    <Badge variant="secondary">Zoom 4 Breakout</Badge>
  ) : (
    <Badge variant="outline">Zoom langsung</Badge>
  )
}

export function SlotsCard({ data }: { data: OperatorDashboardData }) {
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Slot hari ini</CardTitle>
        <CardDescription>Jumlah sesi dan mode Zoom per slot, {dayLabel(data.date)}.</CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/operator/konsol">Buka Konsol Operator</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {data.totalSessions === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarX2 />
              </EmptyMedia>
              <EmptyTitle>Belum ada sesi hari ini</EmptyTitle>
              <EmptyDescription>Slot akan terisi saat ada booking terkonfirmasi untuk hari ini.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead className="text-right">Sesi</TableHead>
                <TableHead>Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slots.map((slot) => (
                <TableRow key={slot.slotIndex}>
                  <TableCell className="font-medium">{slot.label}</TableCell>
                  <TableCell className="whitespace-nowrap">{slot.displayTime} WIB</TableCell>
                  <TableCell className="text-right tabular-nums">{slot.sessionCount}</TableCell>
                  <TableCell>
                    <ModeBadge slot={slot} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

const ZOOM_STATE: Record<ZoomAccountState, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  active: { label: "Aktif", variant: "secondary" },
  inactive: { label: "Nonaktif", variant: "destructive" },
  missing: { label: "Belum dikonfigurasi", variant: "outline" },
}

export function ZoomAccountsCard({ accounts }: { accounts: OperatorDashboardZoomAccount[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Akun Zoom</CardTitle>
        <CardDescription>4 akun Zoom Pro dan jumlah sesi yang memakainya hari ini.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {accounts.map((a) => (
            <li key={a.accountNumber} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Video className="size-4 text-muted-foreground" aria-hidden />
                {a.name}
              </span>
              <span className="flex items-center gap-3">
                {a.state !== "missing" && (
                  <span className="text-xs tabular-nums text-muted-foreground">{a.sessionsToday} sesi</span>
                )}
                <Badge variant={ZOOM_STATE[a.state].variant}>{ZOOM_STATE[a.state].label}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function PendingDispatchCard({ pending }: { pending: OperatorDashboardData["pendingDispatch"] }) {
  return (
    <Card className="xl:col-span-3">
      <CardHeader>
        <CardTitle>Antrean Dispatch WhatsApp</CardTitle>
        <CardDescription>
          Booking yang pesannya belum ditandai Sudah Dikirim
          {pending.total > pending.rows.length ? `. Menampilkan ${pending.rows.length} dari ${pending.total}` : ""}.
        </CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/operator/dispatch-wa">Buka Dispatch WhatsApp</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {pending.rows.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareOff />
              </EmptyMedia>
              <EmptyTitle>Tidak ada pesan tertunda</EmptyTitle>
              <EmptyDescription>Semua pesan WhatsApp sudah ditandai terkirim.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Klien</TableHead>
                <TableHead>Konselor</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Pesan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.rows.map((r) => (
                <TableRow key={`${r.bookingId}-${r.kind}`}>
                  <TableCell className="font-mono text-xs">{r.bookingCode}</TableCell>
                  <TableCell>{r.patientName}</TableCell>
                  <TableCell>{r.counselorName}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {dayLabel(r.scheduleDate)}, {r.timeRange} WIB
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{WA_TEMPLATE_META[r.kind].name}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
