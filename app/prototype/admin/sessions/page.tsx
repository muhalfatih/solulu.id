"use client"

import * as React from "react"
import { MOCK_SESSIONS, BookingSession } from "../mock-data"
import {
  Clock,
  Copy,
  Search,
  Video,
  CheckCircle2,
  ShieldAlert,
  Mail,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
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

export default function DistilledSessionsPage() {
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
    showToast(`Tautan sesi pasien untuk ${code} berhasil disalin ke papan klip.`)
  }

  const handleResendEmail = (patientName: string) => {
    showToast(`Email konfirmasi jadwal dan tautan sesi berhasil dikirim ulang ke ${patientName}.`)
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Page Header: Standardized with unified font size, ADR badge, and subtitle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Jadwal & Sesi Konseling
            </h1>
            <Badge variant="outline" className="text-xs font-mono py-0.5 px-2">
              ADR-0002
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Manajemen sesi telekonseling 90 menit dan penegakan batas waktu reschedule H-12 jam.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono py-0.5 px-2">
          <span>Durasi Tetap:</span>
          <span className="text-foreground font-semibold ml-1.5">90 Menit</span>
        </Badge>
      </div>

      {/* Distilled Policy Notice: Sleek 1-row strip with direct scenario triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-muted/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldAlert className="size-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground font-medium">Kebijakan Reschedule (ADR-0002):</strong> Perubahan jadwal dibatasi minimal 12 jam sebelum sesi untuk melindungi alokasi 2 akun Zoom Pro.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              const target = sessions.find((s) => s.code === "SL-9281")
              if (target) setSelectedSession(target)
            }}
            className="h-7 text-xs font-normal"
          >
            <span>Uji Kasus &lt;12j (SL-9281)</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              const target = sessions.find((s) => s.code === "SL-9285")
              if (target) setSelectedSession(target)
            }}
            className="h-7 text-xs font-normal"
          >
            <span>Uji Kasus &gt;12j (SL-9285)</span>
          </Button>
        </div>
      </div>

      {/* Unified Table Surface with Integrated Toolbar */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
        {/* Integrated Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari kode sesi, nama pasien, atau konselor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-card"
              aria-label="Cari jadwal sesi"
            />
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-background text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("in_session")}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  statusFilter === "in_session"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Live
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("confirmed")}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  statusFilter === "confirmed"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Terkonfirmasi
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  statusFilter === "completed"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Selesai
              </button>
            </div>

            <span className="text-xs text-muted-foreground tabular-nums">
              {filteredSessions.length} sesi
            </span>
          </div>
        </div>

        {/* Table Body */}
        <Table className="text-xs">
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60">
              <TableHead className="py-3 px-3.5 font-semibold text-foreground">Sesi & Jadwal</TableHead>
              <TableHead className="py-3 px-3.5 font-semibold text-foreground">Pasien & Triage</TableHead>
              <TableHead className="py-3 px-3.5 font-semibold text-foreground">Mitra Konselor</TableHead>
              <TableHead className="py-3 px-3.5 font-semibold text-foreground">Ruang Zoom</TableHead>
              <TableHead className="py-3 px-3.5 font-semibold text-foreground">Status Sesi</TableHead>
              <TableHead className="py-3 px-3.5 font-semibold text-foreground">Kelayakan Reschedule</TableHead>
              <TableHead className="py-3 px-3.5 font-semibold text-foreground text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.map((ses) => {
              const isCompleted = ses.status === "completed" || ses.hoursUntilSession < 0
              const isLocked = ses.hoursUntilSession > 0 && ses.hoursUntilSession < 12

              return (
                <TableRow key={ses.id} className="hover:bg-muted/30 transition-colors border-border/60">
                  {/* Col 1: Sesi & Jadwal */}
                  <TableCell className="py-3.5 px-3.5">
                    <div className="font-mono font-semibold text-primary text-sm">{ses.code}</div>
                    <div className="text-foreground flex items-center gap-1.5 mt-0.5 font-medium tabular-nums text-xs">
                      <Clock className="size-3 text-muted-foreground shrink-0" />
                      <span>{ses.timeRange}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{ses.date}</div>
                  </TableCell>

                  {/* Col 2: Pasien & Triage */}
                  <TableCell className="py-3.5 px-3">
                    <div className="font-semibold text-foreground">{ses.patientName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{ses.patientContact}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge
                        variant={ses.srqScore >= 8 ? "destructive" : "secondary"}
                        className="text-[10px] py-0 px-1.5 font-normal"
                      >
                        SRQ: {ses.srqScore}/20
                      </Badge>
                      {ses.hasSuicidalThoughts && (
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-medium">
                          Waiver Darurat
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Col 3: Konselor */}
                  <TableCell className="py-3.5 px-3">
                    <div className="text-foreground font-medium">{ses.counselorName}</div>
                    <div className="text-[11px] text-muted-foreground">{ses.counselorType}</div>
                  </TableCell>

                  {/* Col 4: Ruang Zoom */}
                  <TableCell className="py-3.5 px-3">
                    <Badge variant="outline" className="font-mono text-[10px] gap-1 px-2 py-0.5">
                      <Video className="size-3 text-primary" />
                      <span>{ses.zoomRoom}</span>
                    </Badge>
                  </TableCell>

                  {/* Col 5: Status Sesi */}
                  <TableCell className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                        ses.status === "in_session"
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          ses.status === "in_session"
                            ? "bg-emerald-500 animate-pulse"
                            : ses.status === "confirmed"
                            ? "bg-primary"
                            : "bg-muted-foreground/40"
                        }`}
                      />
                      <span>
                        {ses.status === "in_session"
                          ? "Sedang Berlangsung"
                          : ses.status === "confirmed"
                          ? "Terkonfirmasi"
                          : "Selesai"}
                      </span>
                    </span>
                  </TableCell>

                  {/* Col 6: Kelayakan Reschedule */}
                  <TableCell className="py-3.5 px-3">
                    {isCompleted ? (
                      <span className="text-[11px] text-muted-foreground">Telah selesai</span>
                    ) : isLocked ? (
                      <Badge variant="destructive" className="text-[10px] py-0.5 px-2 font-normal">
                        Terkunci ({ses.hoursUntilSession}j lagi)
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] py-0.5 px-2 font-normal text-emerald-600 dark:text-emerald-400">
                        Diizinkan ({ses.hoursUntilSession}j lagi)
                      </Badge>
                    )}
                  </TableCell>

                  {/* Col 7: Tindakan */}
                  <TableCell className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={isCompleted}
                        onClick={() => setSelectedSession(ses)}
                        className="h-7 text-xs font-normal"
                        title={isCompleted ? "Sesi telah selesai, tidak dapat dijadwalkan ulang" : "Jadwalkan ulang sesi"}
                      >
                        Reschedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopyLink(ses.code)}
                        title="Salin Tautan Sesi Pasien"
                        aria-label="Salin tautan sesi pasien"
                        className="size-7 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleResendEmail(ses.patientName)}
                        title="Kirim Ulang Email Konfirmasi"
                        aria-label="Kirim ulang email konfirmasi"
                        className="size-7 text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Reschedule Dialog Modal: Distilled & Clarified */}
      {selectedSession && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Reschedule Sesi: <span className="font-mono text-primary">{selectedSession.code}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pasien: <span className="text-foreground font-medium">{selectedSession.patientName}</span> • Konselor: <span className="text-foreground font-medium">{selectedSession.counselorName}</span>
                </p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setSelectedSession(null)} className="size-6 p-0">
                ✕
              </Button>
            </div>

            {/* CASE 1: BLOCKED (< 12 hours away) */}
            {selectedSession.hoursUntilSession > 0 && selectedSession.hoursUntilSession < 12 && (
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <AlertTriangle className="size-4" />
                    <span>Reschedule Ditolak: Batas Waktu H-12 Jam Telah Lewat</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    Sesi dijadwalkan mulai dalam <strong className="text-destructive font-semibold">{selectedSession.hoursUntilSession} jam</strong>. Sistem mengunci penjadwalan ulang di bawah 12 jam (ADR-0002) guna mencegah slot Zoom Pro hangus tanpa kehadiran mitra konselor.
                  </p>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-destructive/20">
                    Untuk kendala darurat, lakukan koordinasi langsung dengan konselor yang bertugas.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Jadwal Sesi Terkunci:</span>
                  <span className="font-semibold text-foreground tabular-nums">{selectedSession.timeRange}</span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setSelectedSession(null)} className="h-8 text-xs">
                    Tutup
                  </Button>
                </div>
              </div>
            )}

            {/* CASE 2: ALLOWED (> 12 hours away) */}
            {(selectedSession.hoursUntilSession >= 12 || selectedSession.hoursUntilSession <= 0) && (
              <div className="flex flex-col gap-4">
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span>Jadwal Memenuhi Syarat Reschedule</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sesi berjarak lebih dari 12 jam. Pemindahan slot akan otomatis memperbarui reservasi Zoom dan mengirimkan email konfirmasi ke pasien.
                  </p>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Jadwal Sesi Saat Ini:</span>
                    <div className="font-semibold text-foreground tabular-nums">
                      {selectedSession.date} ({selectedSession.timeRange})
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground font-medium text-xs">
                      Pilih Slot Pengganti yang Tersedia:
                    </label>
                    <select className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none font-medium">
                      <option>Rabu, 23 Sep 2026 — 19:00 - 20:30 WIB (Tersedia • Zoom OK)</option>
                      <option>Kamis, 24 Sep 2026 — 19:00 - 20:30 WIB (Tersedia • Zoom OK)</option>
                      <option>Jumat, 25 Sep 2026 — 14:00 - 15:30 WIB (Tersedia • Zoom OK)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedSession(null)} className="h-8 text-xs">
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      showToast(
                        `Jadwal baru sesi ${selectedSession.code} berhasil dikonfirmasi. Tautan baru telah dikirimkan ke pasien.`
                      )
                      setSelectedSession(null)
                    }}
                    className="h-8 text-xs font-medium"
                  >
                    Konfirmasi Jadwal Baru
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
