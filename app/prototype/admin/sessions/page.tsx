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

export default function LayoutRefinedSessionsPage() {
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
    showToast(`Email konfirmasi dan tautan ruang konsultasi berhasil dikirim ulang ke ${patientName}.`)
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-md animate-in fade-in flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </span>
          <Button variant="ghost" size="xs" onClick={() => setToastMessage(null)} className="size-6 p-0">
            ✕
          </Button>
        </div>
      )}

      {/* Page Header: Clear hierarchy & aligned baseline */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Jadwal & Sesi Konseling
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring sesi aktif 90 menit, mitigasi klinis SRQ-20, dan penegakan aturan reschedule H-12 jam (ADR-0002)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="px-3 py-1 text-xs font-mono text-muted-foreground">
            <span>Durasi:</span>
            <span className="text-foreground font-semibold ml-1.5">90 Menit Fixed</span>
          </Badge>
        </div>
      </div>

      {/* Interactive Scenario Guide: Flat, balanced 2-column strip without nested card borders */}
      <div className="rounded-2xl border border-border bg-muted/20 p-5 flex flex-col gap-3.5 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <ShieldAlert className="size-4 text-primary shrink-0" />
          <span>Panduan Pengujian Aturan H-12 Jam (ADR-0002):</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Scenario 1 */}
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-background border border-border/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Skenario 1: Sesi &lt; 12 Jam</span>
              <Badge variant="destructive" className="text-[9px] py-0 px-1 font-medium">
                Terkunci
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Klik <strong className="text-foreground font-medium">Reschedule</strong> pada sesi{" "}
              <span className="font-mono font-semibold text-primary">SL-9281</span> (~2 jam lagi) untuk melihat dialog penolakan otomatis demi melindungi ketersediaan Zoom.
            </p>
          </div>

          {/* Scenario 2 */}
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-background border border-border/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Skenario 2: Sesi &gt; 12 Jam</span>
              <Badge variant="secondary" className="text-[9px] py-0 px-1 font-medium text-emerald-600 dark:text-emerald-400">
                Diizinkan
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Klik <strong className="text-foreground font-medium">Reschedule</strong> pada sesi{" "}
              <span className="font-mono font-semibold text-primary">SL-9285</span> (pekan depan) untuk memilih slot konselor baru dan menyimulasikan kirim notifikasi.
            </p>
          </div>
        </div>
      </div>

      {/* Unified Table Surface with Integrated Toolbar */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
        {/* Integrated Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <Input
              type="text"
              placeholder="Cari kode sesi, nama pasien, atau konselor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-background border border-border shadow-none focus-visible:ring-1"
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
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="py-3 px-4 font-medium">Kode & Jadwal (WIB)</TableHead>
              <TableHead className="py-3 px-3 font-medium">Pasien & Triage Klinis</TableHead>
              <TableHead className="py-3 px-3 font-medium">Mitra Konselor</TableHead>
              <TableHead className="py-3 px-3 font-medium">Alokasi Zoom</TableHead>
              <TableHead className="py-3 px-3 font-medium">Status Sesi</TableHead>
              <TableHead className="py-3 px-3 font-medium">Aturan Reschedule</TableHead>
              <TableHead className="py-3 px-4 font-medium text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSessions.map((ses) => (
              <TableRow key={ses.id} className="hover:bg-muted/30 transition-colors">
                {/* Col 1: Code & Schedule */}
                <TableCell className="py-3.5 px-4">
                  <div className="font-mono font-semibold text-primary text-sm">{ses.code}</div>
                  <div className="text-foreground flex items-center gap-1.5 mt-0.5 font-medium tabular-nums text-xs">
                    <Clock className="size-3 text-muted-foreground" />
                    <span>{ses.timeRange}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{ses.date}</div>
                </TableCell>

                {/* Col 2: Patient & Clinical Triage */}
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

                {/* Col 3: Counselor */}
                <TableCell className="py-3.5 px-3">
                  <div className="text-foreground font-medium">{ses.counselorName}</div>
                  <div className="text-[11px] text-muted-foreground">{ses.counselorType}</div>
                </TableCell>

                {/* Col 4: Zoom Room */}
                <TableCell className="py-3.5 px-3">
                  <Badge variant="outline" className="font-mono text-[10px] gap-1 px-2 py-0.5">
                    <Video className="size-3 text-primary" />
                    <span>{ses.zoomRoom}</span>
                  </Badge>
                </TableCell>

                {/* Col 5: Session Status */}
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

                {/* Col 6: Reschedule Eligibility */}
                <TableCell className="py-3.5 px-3">
                  {ses.hoursUntilSession > 0 ? (
                    <Badge
                      variant={ses.hoursUntilSession < 12 ? "destructive" : "secondary"}
                      className="text-[10px] py-0.5 px-2 font-normal"
                    >
                      {ses.hoursUntilSession < 12
                        ? `${ses.hoursUntilSession}j lagi (Terkunci)`
                        : `${ses.hoursUntilSession}j lagi (Bisa Pindah)`}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Sesi berlalu</span>
                  )}
                </TableCell>

                {/* Col 7: Actions */}
                <TableCell className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setSelectedSession(ses)}
                      className="h-7 text-xs font-normal"
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyLink(ses.code)}
                      title="Salin Tautan Sesi Pasien"
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleResendEmail(ses.patientName)}
                      title="Kirim Ulang Email"
                      className="size-7 text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reschedule Dialog Modal: Balanced, crisp layout */}
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
                    <span>Kebijakan Terkunci: Batas Waktu H-12 Jam Telah Lewat</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    Sesi ini dijadwalkan berlangsung dalam waktu <strong className="text-destructive">{selectedSession.hoursUntilSession} jam</strong>. Sesuai dokumen kepatuhan (ADR-0002), reschedule mandiri maupun oleh admin diblokir jika sesi berjarak kurang dari 12 jam demi menjaga integritas alokasi akun Zoom Pro dan waktu mitra konselor.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Jadwal Sesi Terikat:</span>
                  <span className="font-semibold text-foreground tabular-nums">{selectedSession.timeRange}</span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => setSelectedSession(null)} className="h-8 text-xs">
                    Tutup Peringatan
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
                    <span>Jadwal Memenuhi Syarat Reschedule (&gt; 12 Jam)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sesi berjarak lebih dari 12 jam. Memindahkan jadwal akan secara otomatis memperbarui reservasi Zoom dan mengirimkan email jadwal baru ke pasien.
                  </p>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border flex flex-col gap-0.5">
                    <span className="text-muted-foreground">Jadwal Sesi Asli:</span>
                    <div className="font-semibold text-foreground tabular-nums">
                      {selectedSession.date} ({selectedSession.timeRange})
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-foreground font-medium text-xs">
                      Pilih Slot Baru yang Tersedia:
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
                        `Sesi ${selectedSession.code} berhasil dipindahkan. Email konfirmasi jadwal baru terkirim ke pasien!`
                      )
                      setSelectedSession(null)
                    }}
                    className="h-8 text-xs font-medium"
                  >
                    Konfirmasi & Kirim Notifikasi
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
