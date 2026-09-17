"use client"

import * as React from "react"
import { MOCK_SESSIONS, BookingSession } from "../mock-data"
import {
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Send,
  Video,
  FileText,
  User,
} from "lucide-react"

export default function SessionsAdminPage() {
  const [sessions, setSessions] = React.useState<BookingSession[]>(MOCK_SESSIONS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] =
    React.useState<BookingSession | null>(null)
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 text-xs shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Manajemen Sesi, Overlap & Reschedule
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Pantau status alokasi sesi 90 menit, mitigasi klinis SRQ-20, dan eksekusi reschedule semi-otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono">
          <span>Durasi Sesi:</span>
          <span className="text-emerald-400 font-bold">Fixed 90 Menit</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Cari kode booking, nama pasien, atau nama mitra konselor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300 focus:outline-none"
          >
            <option value="all">Semua Status Sesi</option>
            <option value="in_session">Sedang Berlangsung (In Session)</option>
            <option value="confirmed">Terkonfirmasi (Mendatang)</option>
            <option value="completed">Selesai (Riwayat)</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="border border-neutral-800 rounded-2xl bg-neutral-900/40 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-medium">
            <tr>
              <th className="py-3.5 px-4">Kode & Waktu (WIB)</th>
              <th className="py-3.5 px-3">Pasien & Triage SRQ-20</th>
              <th className="py-3.5 px-3">Mitra Konselor</th>
              <th className="py-3.5 px-3">Alokasi Zoom</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3">Pembayaran</th>
              <th className="py-3.5 px-4 text-right">Tindakan Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredSessions.map((ses) => (
              <tr key={ses.id} className="hover:bg-neutral-800/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-mono font-bold text-emerald-400 text-sm">{ses.code}</div>
                  <div className="text-[11px] text-neutral-300 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>{ses.timeRange}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500">{ses.date}</div>
                </td>

                <td className="py-3.5 px-3">
                  <div className="font-medium text-white text-sm">{ses.patientName}</div>
                  <div className="text-[11px] text-neutral-400">{ses.patientContact}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        ses.srqScore >= 8
                          ? "bg-rose-950/60 text-rose-300 border border-rose-800/60"
                          : "bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      Skor SRQ: {ses.srqScore}/20
                    </span>
                    {ses.hasSuicidalThoughts && (
                      <span className="text-[10px] text-rose-400 font-bold">
                        [Suicidal Waiver ✓]
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  <div className="text-neutral-200 font-medium">{ses.counselorName}</div>
                  <div className="text-[11px] text-neutral-400">{ses.counselorType}</div>
                </td>

                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-teal-400" />
                    <span className="font-mono text-neutral-300 font-medium text-[11px]">
                      {ses.zoomRoom}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  <span
                    className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                      ses.status === "in_session"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : ses.status === "confirmed"
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {ses.status === "in_session"
                      ? "Sedang Berlangsung"
                      : ses.status === "confirmed"
                      ? "Terkonfirmasi"
                      : "Selesai"}
                  </span>
                </td>

                <td className="py-3.5 px-3">
                  <div className="text-white font-medium">
                    Rp {ses.amount.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-neutral-400">{ses.paymentMethod}</div>
                  {ses.voucherCode && (
                    <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-teal-950/60 text-teal-300 border border-teal-800 font-mono">
                      Voucher: {ses.voucherCode}
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-4 text-right space-x-1.5">
                  <button
                    onClick={() => setSelectedSessionForReschedule(ses)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer border border-neutral-700"
                    title="Jadwalkan ulang sesi"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleCopyLink(ses.code)}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-emerald-700 text-neutral-300 hover:text-white text-[11px] transition-colors cursor-pointer border border-neutral-700 inline-flex items-center gap-1"
                    title="Salin Tautan Sesi Pasien"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleResendEmail(ses.patientName)}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-sky-700 text-neutral-300 hover:text-white text-[11px] transition-colors cursor-pointer border border-neutral-700 inline-flex items-center gap-1"
                    title="Kirim Ulang Email Tautan"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reschedule Modal with H-12 Hour Check */}
      {selectedSessionForReschedule && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-semibold text-white text-sm">
                  Reschedule Sesi: {selectedSessionForReschedule.code}
                </h3>
                <p className="text-xs text-neutral-400">
                  Pasien: {selectedSessionForReschedule.patientName} • Konselor:{" "}
                  {selectedSessionForReschedule.counselorName}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionForReschedule(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Validation Guard: H-12 Rule */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Aturan Reschedule Platform (H-12 Jam)</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Permintaan reschedule hanya dapat disetujui jika jadwal sesi berjarak lebih dari 12 jam.
                Ketika dipindahkan, sistem secara otomatis mengirimkan email konfirmasi ke pasien dengan tautan sesi yang baru.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                <span className="text-neutral-400">Jadwal Sesi Asli:</span>
                <div className="font-medium text-white">
                  {selectedSessionForReschedule.date} ({selectedSessionForReschedule.timeRange})
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">
                  Pilih Slot Jadwal Baru Konselor yang Tersedia:
                </label>
                <select className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-neutral-200 focus:outline-none">
                  <option>Jumat, 18 Sep 2026 — 19:00 - 20:30 WIB (Tersedia • Zoom OK)</option>
                  <option>Jumat, 18 Sep 2026 — 21:00 - 22:30 WIB (Tersedia • Zoom OK)</option>
                  <option>Sabtu, 19 Sep 2026 — 10:00 - 11:30 WIB (Tersedia • Zoom OK)</option>
                  <option>Sabtu, 19 Sep 2026 — 14:00 - 15:30 WIB (Tersedia • Zoom OK)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSessionForReschedule(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  showToast(
                    `✅ Sesi ${selectedSessionForReschedule.code} berhasil dipindahkan. Email konfirmasi jadwal baru terkirim ke pasien!`
                  )
                  setSelectedSessionForReschedule(null)
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                Konfirmasi & Kirim Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
