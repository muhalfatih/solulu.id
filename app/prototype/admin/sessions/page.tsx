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
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200 text-xs shadow-md animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Manajemen Sesi, Overlap & Reschedule
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Pantau status alokasi sesi 90 menit, mitigasi klinis SRQ-20, dan eksekusi reschedule semi-otomatis.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 font-mono shadow-xs">
          <span>Durasi Sesi:</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Fixed 90 Menit</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Cari kode booking, nama pasien, atau nama mitra konselor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none font-medium"
          >
            <option value="all">Semua Status Sesi</option>
            <option value="in_session">Sedang Berlangsung (In Session)</option>
            <option value="confirmed">Terkonfirmasi (Mendatang)</option>
            <option value="completed">Selesai (Riwayat)</option>
          </select>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/40 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200/90 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Kode & Jadwal (WIB)</th>
              <th className="py-3.5 px-3">Pasien & Triage SRQ-20</th>
              <th className="py-3.5 px-3">Mitra Konselor</th>
              <th className="py-3.5 px-3">Alokasi Zoom</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3">Pembayaran</th>
              <th className="py-3.5 px-4 text-right">Tindakan Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
            {filteredSessions.map((ses) => (
              <tr
                key={ses.id}
                className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {ses.code}
                  </div>
                  <div className="text-[11px] text-neutral-700 dark:text-neutral-300 flex items-center gap-1 mt-0.5 font-medium">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>{ses.timeRange}</span>
                  </div>
                  <div className="text-[10px] text-neutral-400">{ses.date}</div>
                </td>

                <td className="py-4 px-3">
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">
                    {ses.patientName}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {ses.patientContact}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ses.srqScore >= 8
                          ? "bg-rose-100 text-rose-900 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60"
                          : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      }`}
                    >
                      Skor SRQ: {ses.srqScore}/20
                    </span>
                    {ses.hasSuicidalThoughts && (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        [Suicidal Waiver ✓]
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-4 px-3">
                  <div className="text-neutral-900 dark:text-neutral-200 font-semibold">
                    {ses.counselorName}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {ses.counselorType}
                  </div>
                </td>

                <td className="py-4 px-3">
                  <div className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span className="font-mono text-neutral-700 dark:text-neutral-300 font-semibold text-[11px]">
                      {ses.zoomRoom}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-3">
                  <span
                    className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      ses.status === "in_session"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                        : ses.status === "confirmed"
                        ? "bg-sky-100 text-sky-900 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40"
                        : "bg-neutral-100 text-neutral-600 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {ses.status === "in_session"
                      ? "Sedang Berlangsung"
                      : ses.status === "confirmed"
                      ? "Terkonfirmasi"
                      : "Selesai"}
                  </span>
                </td>

                <td className="py-4 px-3">
                  <div className="text-neutral-900 dark:text-white font-bold">
                    Rp {ses.amount.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {ses.paymentMethod}
                  </div>
                  {ses.voucherCode && (
                    <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 font-mono font-bold">
                      Voucher: {ses.voucherCode}
                    </span>
                  )}
                </td>

                <td className="py-4 px-4 text-right space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSessionForReschedule(ses)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 dark:hover:text-white text-[11px] font-semibold transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
                    title="Jadwalkan ulang sesi"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(ses.code)}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-emerald-600 hover:text-white text-neutral-700 dark:bg-neutral-800 dark:hover:bg-emerald-600 dark:text-neutral-300 dark:hover:text-white text-[11px] font-semibold transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700 inline-flex items-center gap-1"
                    title="Salin Tautan Sesi Pasien"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResendEmail(ses.patientName)}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-sky-600 hover:text-white text-neutral-700 dark:bg-neutral-800 dark:hover:bg-sky-600 dark:text-neutral-300 dark:hover:text-white text-[11px] font-semibold transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700 inline-flex items-center gap-1"
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
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white text-sm">
                  Reschedule Sesi: {selectedSessionForReschedule.code}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Pasien: {selectedSessionForReschedule.patientName} • Konselor:{" "}
                  {selectedSessionForReschedule.counselorName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionForReschedule(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Validation Guard: H-12 Rule */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Aturan Reschedule Platform (H-12 Jam)</span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Permintaan reschedule hanya dapat disetujui jika jadwal sesi berjarak lebih dari 12 jam.
                Ketika dipindahkan, sistem secara otomatis mengirimkan email konfirmasi ke pasien dengan tautan sesi yang baru.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">Jadwal Sesi Asli:</span>
                <div className="font-bold text-neutral-900 dark:text-white">
                  {selectedSessionForReschedule.date} ({selectedSessionForReschedule.timeRange})
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-700 dark:text-neutral-300 font-semibold">
                  Pilih Slot Jadwal Baru Konselor yang Tersedia:
                </label>
                <select className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-200 focus:outline-none font-medium">
                  <option>Jumat, 18 Sep 2026 — 19:00 - 20:30 WIB (Tersedia • Zoom OK)</option>
                  <option>Jumat, 18 Sep 2026 — 21:00 - 22:30 WIB (Tersedia • Zoom OK)</option>
                  <option>Sabtu, 19 Sep 2026 — 10:00 - 11:30 WIB (Tersedia • Zoom OK)</option>
                  <option>Sabtu, 19 Sep 2026 — 14:00 - 15:30 WIB (Tersedia • Zoom OK)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSessionForReschedule(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(
                    `✅ Sesi ${selectedSessionForReschedule.code} berhasil dipindahkan. Email konfirmasi jadwal baru terkirim ke pasien!`
                  )
                  setSelectedSessionForReschedule(null)
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-xs"
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
