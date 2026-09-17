"use client"

import * as React from "react"
import {
  MOCK_SESSIONS,
  MOCK_APPLICANTS,
  MOCK_ZOOM_ACCOUNTS,
  MOCK_VOUCHERS,
  MOCK_PRICING,
  BookingSession,
} from "./mock-data"
import {
  Search,
  RefreshCw,
  Copy,
  Calendar,
  Lock,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  Filter,
} from "lucide-react"

export function VariantB() {
  const [activeTab, setActiveTab] = React.useState<"sessions" | "applicants" | "zoom" | "pricing">(
    "sessions"
  )
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [rescheduleSession, setRescheduleSession] = React.useState<BookingSession | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredSessions = MOCK_SESSIONS.filter((s) => {
    const matchSearch =
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.counselorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || s.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col pb-20 font-sans">
      {/* Top Cockpit Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-30 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              SOLULU // COMMAND CENTER
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 font-mono">
              LIVE 2 Sesi • QStash OK • 0 Error
            </span>
          </div>

          {/* Tab navigation */}
          <div className="flex items-center p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === "sessions"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Semua Sesi & Dispatcher ({MOCK_SESSIONS.length})
            </button>
            <button
              onClick={() => setActiveTab("applicants")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "applicants"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <span>Verifikasi Berkas</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                2
              </span>
            </button>
            <button
              onClick={() => setActiveTab("zoom")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === "zoom"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Zoom Safety Lock (2)
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === "pricing"
                  ? "bg-neutral-800 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Tarif & Voucher
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs shadow-xl">
          {toastMessage}
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 p-5 max-w-7xl w-full mx-auto space-y-4">
        {/* TAB 1: SESSIONS & DISPATCHER TABLE */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
                <Search className="w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Cari nama pasien, kode sesi, atau konselor..."
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
                  className="bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-1 text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="in_session">Sedang Berlangsung</option>
                  <option value="confirmed">Terkonfirmasi</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>
            </div>

            {/* High-density Table */}
            <div className="border border-neutral-800 rounded-xl bg-neutral-900/40 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900/80 border-b border-neutral-800 text-neutral-400 font-medium">
                  <tr>
                    <th className="py-3 px-4">Kode & Waktu (90m)</th>
                    <th className="py-3 px-3">Pasien & Triage SRQ</th>
                    <th className="py-3 px-3">Mitra Konselor</th>
                    <th className="py-3 px-3">Alokasi Zoom</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Metode Bayar</th>
                    <th className="py-3 px-4 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredSessions.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-emerald-400">
                          {item.code}
                        </div>
                        <div className="text-[11px] text-neutral-300 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{item.timeRange}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-white">{item.patientName}</div>
                        <div className="text-[10px] text-neutral-400">{item.patientContact}</div>
                        <div className="mt-1 flex items-center gap-1">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              item.srqScore >= 8
                                ? "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                                : "bg-neutral-800 text-neutral-300"
                            }`}
                          >
                            SRQ: {item.srqScore}/20
                          </span>
                          {item.hasSuicidalThoughts && (
                            <span className="text-[10px] text-rose-400 font-bold">
                              [Waiver ✓]
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-neutral-200 font-medium">{item.counselorName}</div>
                        <div className="text-[10px] text-neutral-400">{item.counselorType}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                          {item.zoomRoom}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            item.status === "in_session"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : item.status === "confirmed"
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {item.status === "in_session"
                            ? "Berlangsung"
                            : item.status === "confirmed"
                            ? "Terkonfirmasi"
                            : "Selesai"}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-neutral-200">
                          Rp {item.amount.toLocaleString("id-ID")}
                        </div>
                        <div className="text-[10px] text-neutral-400">{item.paymentMethod}</div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setRescheduleSession(item)}
                          className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] transition-colors cursor-pointer border border-neutral-700"
                          title="Reschedule Semi-Otomatis (H-12 jam)"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.zoomJoinUrl)
                            showToast(`Tautan sesi untuk ${item.patientName} disalin!`)
                          }}
                          className="px-2 py-1 rounded bg-neutral-800 hover:bg-emerald-600 text-neutral-300 hover:text-white text-[11px] transition-colors cursor-pointer border border-neutral-700 inline-flex items-center gap-1"
                          title="Salin Tautan Sesi"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: APPLICANT DOCUMENT INSPECTOR */}
        {activeTab === "applicants" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {MOCK_APPLICANTS.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{app.name}</h3>
                    <p className="text-xs text-sky-400 font-medium">{app.type}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {app.email} • {app.phone}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Menunggu Verifikasi
                  </span>
                </div>

                <div className="p-3 bg-neutral-950 rounded-lg text-xs space-y-1 text-neutral-300 border border-neutral-800/80">
                  <div className="font-medium text-neutral-200">Pendidikan & STR:</div>
                  <div className="text-[11px] text-neutral-400">{app.education}</div>
                  {app.strNumber && (
                    <div className="text-[11px] text-emerald-400 font-mono">
                      Nomor STR: {app.strNumber} (Aktif)
                    </div>
                  )}
                </div>

                {/* Document Verification Checklist */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-neutral-400 text-[11px] font-medium">
                    Berkas Pribadi (Presigned R2 URL 15m Expiry):
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> KTP.pdf
                      </span>
                      <span className="text-emerald-400 font-semibold">Tersedia</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> Ijazah.pdf
                      </span>
                      <span className="text-emerald-400 font-semibold">Tersedia</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" /> CV.pdf
                      </span>
                      <span className="text-emerald-400 font-semibold">Tersedia</span>
                    </div>
                    <div className="p-2 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-neutral-300">
                        <FileText className="w-3.5 h-3.5 text-teal-400" /> STR.pdf
                      </span>
                      <span
                        className={
                          app.documents.str ? "text-emerald-400 font-semibold" : "text-neutral-500"
                        }
                      >
                        {app.documents.str ? "Tersedia" : "N/A (Sebaya)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                  <button
                    onClick={() =>
                      showToast(`Undangan Supabase Auth (Invite) dikirim ke ${app.email}`)
                    }
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Setujui & Buat Akun Mitra
                  </button>
                  <button
                    onClick={() => showToast(`Lamaran ${app.name} ditolak.`)}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-rose-900/50 text-neutral-300 hover:text-rose-200 text-xs transition-colors cursor-pointer border border-neutral-700"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ZOOM ACCOUNTS & SAFETY LOCK */}
        {activeTab === "zoom" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-300">
                  Kebijakan Safety Lock (ADR-0002):
                </strong>{" "}
                Platform dibatasi pada 2 akun Zoom Pro pribadi. Demi mencegah sesi pasien putus di
                tengah jalan, kredensial akun yang sedang terikat jadwal aktif dilarang keras untuk
                diedit atau dihapus.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MOCK_ZOOM_ACCOUNTS.map((acc) => (
                <div
                  key={acc.id}
                  className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white text-sm">{acc.name}</h3>
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50">
                      <Lock className="w-3.5 h-3.5" />
                      LOCKED
                    </span>
                  </div>

                  <div className="text-xs text-neutral-400 font-mono">{acc.email}</div>

                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                    <div className="text-neutral-400">Alasan Kunci Keamanan:</div>
                    <div className="text-neutral-200 font-medium">{acc.safetyLock.reason}</div>
                    <div className="text-[11px] text-emerald-400 pt-1">
                      Token Cache S2S OAuth: {acc.tokenExpiresIn}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Kapasitas: 1 Sesi Konkuren</span>
                    <button
                      disabled
                      className="px-3 py-1.5 rounded bg-neutral-800 text-neutral-500 text-xs cursor-not-allowed border border-neutral-700/50"
                    >
                      Ubah Kredensial (Terkunci)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PRICING & VOUCHERS */}
        {activeTab === "pricing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Pricing Section */}
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Tarif Flat (90 Menit)</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Konselor Sebaya</div>
                    <div className="text-[11px] text-neutral-400">Tarif standar 90 menit</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    Rp {MOCK_PRICING.peerRate.toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Psikolog Klinis (STR)</div>
                    <div className="text-[11px] text-neutral-400">Tarif standar 90 menit</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    Rp {MOCK_PRICING.psychologistRate.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            </div>

            {/* Voucher Section */}
            <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">Kode Voucher & Kuota</h3>
                <button
                  onClick={() => showToast("Modal buat voucher baru dibuka (Mock)")}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  + Tambah Voucher
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {MOCK_VOUCHERS.map((v) => (
                  <div
                    key={v.code}
                    className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-emerald-400">{v.code}</div>
                      <div className="text-[11px] text-neutral-400">{v.discount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-neutral-300">
                        Kuota: {v.usedQuota}/{v.totalQuota}
                      </div>
                      <div className="text-[10px] text-neutral-500">Exp: {v.expiryDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Reschedule Modal Mockup */}
      {rescheduleSession && (
        <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Reschedule Sesi Pasien</h3>
              <button
                onClick={() => setRescheduleSession(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-neutral-950 rounded-lg text-xs space-y-1">
              <div className="text-neutral-400">Kode: {rescheduleSession.code}</div>
              <div className="font-medium text-white">
                Pasien: {rescheduleSession.patientName} ({rescheduleSession.counselorName})
              </div>
              <div className="text-neutral-300">Jadwal Asli: {rescheduleSession.timeRange}</div>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
              ⚠️ <strong>Aturan H-12 Jam:</strong> Reschedule hanya diperbolehkan jika sesi berjarak
              lebih dari 12 jam dari sekarang. Email pemberitahuan dengan link sesi baru akan
              terkirim otomatis ke pasien.
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-neutral-400">Pilih Slot Baru yang Tersedia:</label>
              <select className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200">
                <option>Jumat, 18 Sep 2026 — 19:00 - 20:30 WIB (Tersedia)</option>
                <option>Jumat, 18 Sep 2026 — 21:00 - 22:30 WIB (Tersedia)</option>
                <option>Sabtu, 19 Sep 2026 — 14:00 - 15:30 WIB (Tersedia)</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setRescheduleSession(null)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  showToast(`Sesi ${rescheduleSession.code} berhasil di-reschedule & email terkirim!`)
                  setRescheduleSession(null)
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer"
              >
                Konfirmasi Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
