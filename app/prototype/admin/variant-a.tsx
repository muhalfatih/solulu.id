"use client"

import * as React from "react"
import {
  MOCK_METRICS,
  MOCK_ZOOM_ACCOUNTS,
  MOCK_APPLICANTS,
  MOCK_SESSIONS,
} from "./mock-data"
import {
  Video,
  ShieldAlert,
  Users,
  Calendar,
  DollarSign,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  LayoutDashboard,
  Tag,
  ImageIcon,
  LogOut,
  Sparkles,
} from "lucide-react"

export function VariantA() {
  const [applicants, setApplicants] = React.useState(MOCK_APPLICANTS)
  const [selectedApplicant, setSelectedApplicant] = React.useState<string | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const handleApprove = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "approved" as const } : app))
    )
    showToast(`✅ Undangan Supabase Auth terkirim otomatis ke ${name}`)
  }

  const handleReject = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" as const } : app))
    )
    showToast(`❌ Pelamar ${name} ditandai sebagai ditolak`)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex pb-20">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md p-5 flex flex-col justify-between hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-neutral-950 text-sm shadow-md shadow-emerald-900/20">
              S
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                Solulu Admin
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ops
                </span>
              </h1>
              <p className="text-[11px] text-neutral-400">Zero-Cost Infrastructure</p>
            </div>
          </div>

          <nav className="space-y-1 text-xs">
            <a
              href="#dashboard"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Utama</span>
            </a>
            <a
              href="#verifikasi"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Verifikasi Mitra</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                2
              </span>
            </a>
            <a
              href="#sesi"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Sesi & Penjadwalan</span>
            </a>
            <a
              href="#zoom"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
            >
              <Video className="w-4 h-4" />
              <span>Zoom & Safety Lock</span>
            </a>
            <a
              href="#pricing"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
            >
              <Tag className="w-4 h-4" />
              <span>Tarif & Voucher</span>
            </a>
            <a
              href="#gallery"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Moderasi Galeri</span>
            </a>
          </nav>
        </div>

        <div className="pt-4 border-t border-neutral-800/80 space-y-3 text-xs">
          <div className="p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Sistem Aktif</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Vercel Hobby • Supabase Free • QStash Worker • 2 Zoom Pro
            </p>
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs transition-colors cursor-pointer">
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-800/80 px-6 flex items-center justify-between bg-neutral-900/40">
          <div>
            <h2 className="font-semibold text-base text-white tracking-tight">
              Executive Overview
            </h2>
            <p className="text-xs text-neutral-400">
              Kamis, 17 September 2026 • Monitoring Realtime
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">2 Zoom Pool Terkoneksi</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-200">
              OP
            </div>
          </div>
        </header>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-900/70 border border-emerald-500 text-emerald-200 text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* Scrollable Dashboard Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top 4 KPI Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_METRICS.map((stat, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/90 shadow-sm hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span>{stat.label}</span>
                  {i === 0 && <Calendar className="w-4 h-4 text-emerald-400" />}
                  {i === 1 && <DollarSign className="w-4 h-4 text-teal-400" />}
                  {i === 2 && <Lock className="w-4 h-4 text-amber-400" />}
                  {i === 3 && <Users className="w-4 h-4 text-sky-400" />}
                </div>
                <div className="mt-2 text-2xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>{stat.subtext}</span>
                  {stat.trend && (
                    <span
                      className={`font-semibold ${
                        stat.trendUp ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {stat.trend}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* 2-Column Split: Left = Live Sessions & Schedule | Right = Zoom Safety Lock & Applicants */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Live Sesi Monitoring */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-xl bg-neutral-900/70 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-emerald-400" />
                      <span>Sesi Hari Ini & Triage Pasien</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Durasi 90 menit • Terkoneksi otomatis ke Zoom Host & Link Pasien
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 px-2.5 py-1 rounded-md bg-neutral-800 border border-neutral-700">
                    Maks 2 Overlap
                  </span>
                </div>

                {/* Table of Sessions */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 font-medium">
                        <th className="pb-2.5 pl-1">Sesi & Kode</th>
                        <th className="pb-2.5">Pasien</th>
                        <th className="pb-2.5">Konselor</th>
                        <th className="pb-2.5">Waktu (90m)</th>
                        <th className="pb-2.5">Zoom & Status</th>
                        <th className="pb-2.5 text-right pr-1">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {MOCK_SESSIONS.map((ses) => (
                        <tr key={ses.id} className="hover:bg-neutral-800/30 transition-colors">
                          <td className="py-3 pl-1 font-mono font-medium text-emerald-400">
                            {ses.code}
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-white">{ses.patientName}</div>
                            <div className="text-[10px] text-neutral-400">
                              SRQ: {ses.srqScore}/20
                              {ses.hasSuicidalThoughts && (
                                <span className="ml-1 text-rose-400 font-semibold">
                                  [Waiver Signed]
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-neutral-200">{ses.counselorName}</div>
                            <div className="text-[10px] text-neutral-400">{ses.counselorType}</div>
                          </td>
                          <td className="py-3 text-neutral-300 font-medium">
                            {ses.timeRange}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  ses.status === "in_session"
                                    ? "bg-emerald-400 animate-ping"
                                    : ses.status === "confirmed"
                                    ? "bg-sky-400"
                                    : "bg-neutral-500"
                                }`}
                              />
                              <span className="text-neutral-200 text-[11px] font-medium">
                                {ses.zoomRoom}
                              </span>
                            </div>
                            <span
                              className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                ses.status === "in_session"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : ses.status === "confirmed"
                                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
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
                          <td className="py-3 text-right pr-1">
                            <a
                              href={ses.zoomJoinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-emerald-600 hover:text-white text-[11px] font-medium transition-colors text-neutral-300 border border-neutral-700"
                            >
                              <span>Buka Zoom</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Zoom Safety Lock & Verification Widget */}
            <div className="space-y-4">
              {/* Widget: Zoom Safety Lock */}
              <div className="p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Zoom Safety Lock</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                    Proteksi Aktif
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Kredensial akun Zoom dikunci otomatis agar tidak dapat diedit atau dihapus jika
                  ada sesi aktif/mendatang yang terikat.
                </p>

                <div className="space-y-2.5 pt-1">
                  {MOCK_ZOOM_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-medium text-white">
                        <span>{acc.name}</span>
                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                          <Lock className="w-3 h-3" />
                          <span>LOCKED</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">{acc.email}</div>
                      <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 leading-tight">
                        {acc.safetyLock.reason}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-neutral-500 pt-1">
                        <span>Token OAuth: {acc.tokenExpiresIn}</span>
                        <button
                          disabled
                          className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-500 cursor-not-allowed text-[10px]"
                          title="Terkunci oleh Safety Lock"
                        >
                          Ubah Kredensial
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget: Pending Counselor Verification */}
              <div className="p-5 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Verifikasi Pelamar Mitra</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold">
                    {applicants.filter((a) => a.status === "pending").length} Menunggu
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {applicants.map((app) => (
                    <div
                      key={app.id}
                      className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                        app.status === "approved"
                          ? "bg-emerald-950/20 border-emerald-800/40"
                          : app.status === "rejected"
                          ? "bg-rose-950/20 border-rose-800/40 opacity-60"
                          : "bg-neutral-950/60 border-neutral-800"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-white">{app.name}</div>
                          <div className="text-[11px] text-sky-400 font-medium">{app.type}</div>
                        </div>
                        {app.status === "approved" && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Disetujui
                          </span>
                        )}
                        {app.status === "rejected" && (
                          <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-neutral-400 line-clamp-2">{app.bio}</div>

                      {/* Documents Badge */}
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          KTP ✓
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          CV ✓
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          Ijazah ✓
                        </span>
                        {app.documents.str && (
                          <span className="px-1.5 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700/40">
                            STR: {app.strNumber}
                          </span>
                        )}
                      </div>

                      {app.status === "pending" && (
                        <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80">
                          <button
                            onClick={() => handleApprove(app.id, app.name)}
                            className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
                          >
                            Setujui & Undang
                          </button>
                          <button
                            onClick={() => handleReject(app.id, app.name)}
                            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-300 text-[11px] transition-colors cursor-pointer"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
