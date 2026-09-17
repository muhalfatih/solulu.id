"use client"

import * as React from "react"
import { MOCK_SESSIONS, BookingSession } from "../mock-data"
import {
  Calendar,
  Clock,
  Copy,
  Search,
  Filter,
  AlertTriangle,
  Send,
  Video,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

export default function FreshSessionsAdminPage() {
  const [sessions, setSessions] = React.useState<BookingSession[]>(MOCK_SESSIONS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedSession, setSelectedSession] = React.useState<BookingSession | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.counselorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(`https://solulu.id/session/tok_${code.toLowerCase()}_sample`)
    showToast(`Tautan sesi pasien untuk ${code} berhasil disalin!`)
  }

  const handleResendEmail = (patientName: string) => {
    showToast(`Email konfirmasi dan tautan sesi berhasil dikirim ulang ke ${patientName} via Resend.`)
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-card border border-primary/40 text-foreground text-xs shadow-md animate-in fade-in flex items-center justify-between">
          <span>{toastMessage}</span>
          <Button variant="ghost" size="xs" onClick={() => setToastMessage(null)}>
            ✕
          </Button>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Sesi, Overlap & Reschedule
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pantau status alokasi sesi 90 menit, mitigasi klinis SRQ-20, dan simulasi dua skenario aturan H-12 jam.
          </p>
        </div>

        <Badge variant="outline" className="px-3.5 py-1.5 text-xs font-mono">
          <span>Durasi Sesi:</span>
          <span className="text-primary font-bold ml-1">Fixed 90 Menit</span>
        </Badge>
      </div>

      {/* Interactive Scenario Guide Banner */}
      <Card className="p-4 bg-muted/30 border-border flex flex-col gap-2 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <ShieldAlert className="size-4 text-primary shrink-0" />
          <span>Simulasi 2 Kasus Reschedule (Aturan H-12 Jam):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">Skenario 1: Sesi Terjadwal Hari Ini (&lt; 12 Jam)</span>
            <p className="text-[11px]">
              Klik tombol &ldquo;Reschedule&rdquo; pada sesi <strong className="text-primary">SL-9281</strong> untuk melihat dialog penolakan otomatis demi melindungi alokasi Zoom.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-card border border-border flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">Skenario 2: Sesi Terjadwal Pekan Depan (&gt; 12 Jam)</span>
            <p className="text-[11px]">
              Klik tombol &ldquo;Reschedule&rdquo; pada sesi <strong className="text-primary">SL-9285</strong> untuk memindahkan slot dan memicu email link baru ke pasien.
            </p>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-md">
          <Search className="size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari kode booking, nama pasien, atau konselor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="size-3.5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-muted border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none font-medium"
          >
            <option value="all">Semua Status Sesi</option>
            <option value="in_session">Sedang Berlangsung</option>
            <option value="confirmed">Terkonfirmasi</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
        <Table className="text-xs">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="py-3.5 px-4">Kode & Jadwal (WIB)</TableHead>
              <TableHead className="py-3.5 px-3">Pasien & Triage SRQ-20</TableHead>
              <TableHead className="py-3.5 px-3">Mitra Konselor</TableHead>
              <TableHead className="py-3.5 px-3">Alokasi Zoom</TableHead>
              <TableHead className="py-3.5 px-3">Status</TableHead>
              <TableHead className="py-3.5 px-3">Waktu Menuju Sesi</TableHead>
              <TableHead className="py-3.5 px-4 text-right">Aksi Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.map((ses) => (
              <TableRow key={ses.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="py-4 px-4">
                  <div className="font-mono font-bold text-primary text-sm">{ses.code}</div>
                  <div className="text-[11px] text-foreground flex items-center gap-1 mt-0.5 font-medium">
                    <Clock className="size-3 text-muted-foreground" />
                    <span>{ses.timeRange}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{ses.date}</div>
                </TableCell>

                <TableCell className="py-4 px-3">
                  <div className="font-bold text-foreground text-sm">{ses.patientName}</div>
                  <div className="text-[11px] text-muted-foreground">{ses.patientContact}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant={ses.srqScore >= 8 ? "destructive" : "secondary"} className="text-[10px]">
                      Skor SRQ: {ses.srqScore}/20
                    </Badge>
                    {ses.hasSuicidalThoughts && (
                      <span className="text-[10px] text-destructive font-bold">
                        [Suicidal Waiver ✓]
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-4 px-3">
                  <div className="text-foreground font-semibold">{ses.counselorName}</div>
                  <div className="text-[11px] text-muted-foreground">{ses.counselorType}</div>
                </TableCell>

                <TableCell className="py-4 px-3">
                  <Badge variant="outline" className="font-mono text-[11px] gap-1">
                    <Video className="size-3 text-primary" />
                    <span>{ses.zoomRoom}</span>
                  </Badge>
                </TableCell>

                <TableCell className="py-4 px-3">
                  <Badge
                    variant={ses.status === "in_session" ? "default" : "outline"}
                    className="text-[10px] py-0.5 px-2 font-bold"
                  >
                    {ses.status === "in_session"
                      ? "Sedang Berlangsung"
                      : ses.status === "confirmed"
                      ? "Terkonfirmasi"
                      : "Selesai"}
                  </Badge>
                </TableCell>

                <TableCell className="py-4 px-3">
                  {ses.hoursUntilSession > 0 ? (
                    <Badge
                      variant={ses.hoursUntilSession < 12 ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {ses.hoursUntilSession < 12
                        ? `${ses.hoursUntilSession} jam lagi (Terkunci)`
                        : `${ses.hoursUntilSession} jam lagi (Bisa Reschedule)`}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Sudah berlalu</span>
                  )}
                </TableCell>

                <TableCell className="py-4 px-4 text-right space-x-1">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setSelectedSession(ses)}
                    className="text-[11px]"
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleCopyLink(ses.code)}
                    title="Salin Tautan Sesi Pasien"
                  >
                    <Copy className="size-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleResendEmail(ses.patientName)}
                    title="Kirim Ulang Email"
                  >
                    <Send className="size-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reschedule Dialog Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <Card className="max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <CardTitle className="text-sm">
                  Reschedule Sesi: {selectedSession.code}
                </CardTitle>
                <CardDescription className="text-xs">
                  Pasien: {selectedSession.patientName} • Konselor: {selectedSession.counselorName}
                </CardDescription>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setSelectedSession(null)}>
                ✕
              </Button>
            </div>

            {/* CASE 1: BLOCKED (Less than 12 hours away) */}
            {selectedSession.hoursUntilSession > 0 && selectedSession.hoursUntilSession < 12 && (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="size-4" />
                    <span>Reschedule Ditolak: Batas Waktu H-12 Jam Telah Lewat</span>
                  </div>
                  <p className="text-[11px] text-foreground leading-relaxed">
                    Sesi ini dijadwalkan berlangsung dalam waktu <strong>{selectedSession.hoursUntilSession} jam</strong>.
                    Sesuai dokumen arsitektur kepatuhan (ADR-0002), reschedule mandiri maupun oleh admin diblokir jika sesi berjarak kurang dari 12 jam, demi mencegah akun Zoom menjadi tidak terpakai tanpa pemberitahuan kepada mitra konselor.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Jadwal yang terikat:</span>
                  <span className="font-bold text-foreground">{selectedSession.timeRange}</span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setSelectedSession(null)}>
                    Tutup Peringatan
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 2: ALLOWED (More than 12 hours away) */}
            {(selectedSession.hoursUntilSession >= 12 || selectedSession.hoursUntilSession <= 0) && (
              <div className="flex flex-col gap-4">
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>Jadwal Memenuhi Syarat Reschedule (&gt; 12 Jam)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Sesi ini berjarak lebih dari 12 jam. Memindahkan jadwal akan secara otomatis memperbarui alokasi Zoom dan mengirimkan email konfirmasi baru ke pasien.
                  </p>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-col gap-1">
                    <span className="text-muted-foreground font-medium">Jadwal Sesi Asli:</span>
                    <div className="font-bold text-foreground">
                      {selectedSession.date} ({selectedSession.timeRange})
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground font-semibold">
                      Pilih Slot Baru yang Tersedia:
                    </label>
                    <select className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none font-medium">
                      <option>Rabu, 23 Sep 2026 — 19:00 - 20:30 WIB (Tersedia • Zoom OK)</option>
                      <option>Kamis, 24 Sep 2026 — 19:00 - 20:30 WIB (Tersedia • Zoom OK)</option>
                      <option>Jumat, 25 Sep 2026 — 14:00 - 15:30 WIB (Tersedia • Zoom OK)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)}>
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      showToast(
                        `✅ Sesi ${selectedSession.code} berhasil dipindahkan. Email konfirmasi jadwal baru terkirim ke pasien!`
                      )
                      setSelectedSession(null)
                    }}
                    className="font-semibold"
                  >
                    Konfirmasi & Kirim Notifikasi
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
