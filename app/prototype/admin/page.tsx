"use client"

import * as React from "react"
import Link from "next/link"
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
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

export default function AdminDashboardPage() {
  const [applicants, setApplicants] = React.useState(MOCK_APPLICANTS)
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
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200 text-xs shadow-md animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Ringkasan Operasional & Monitoring Realtime
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Status kapasitas 2 akun Zoom Pro, pemantauan transaksi hold 15m, dan alur sesi pasien hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 rounded-xl shadow-xs">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Kamis, 17 September 2026 (WIB)</span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Metrik utama operasional">
        {MOCK_METRICS.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-neutral-900/70 border border-neutral-200/90 dark:border-neutral-800/90 shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs">
              <span className="font-medium">{stat.label}</span>
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80">
                {i === 0 && <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                {i === 1 && <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
                {i === 2 && <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                {i === 3 && <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
              </div>
            </div>
            <div className="mt-3 text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {stat.value}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
              <span>{stat.subtext}</span>
              {stat.trend && (
                <span
                  className={`font-semibold ${
                    stat.trendUp
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-700 dark:text-amber-400"
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
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/70 border border-neutral-200/90 dark:border-neutral-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Sesi Hari Ini & Triage Klinis</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Durasi fixed 90 menit • Terhubung otomatis ke Zoom Host & Link Pasien
                </p>
              </div>
              <Link
                href="/prototype/admin/sessions"
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Kelola Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Table of Sessions */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200/80 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold">
                  <tr>
                    <th className="py-3 px-3">Kode</th>
                    <th className="py-3 px-3">Pasien & Kontak</th>
                    <th className="py-3 px-3">Mitra Konselor</th>
                    <th className="py-3 px-3">Jadwal (90m)</th>
                    <th className="py-3 px-3">Ruang Zoom</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                  {MOCK_SESSIONS.map((ses) => (
                    <tr
                      key={ses.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {ses.code}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {ses.patientName}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          SRQ: {ses.srqScore}/20
                          {ses.hasSuicidalThoughts && (
                            <span className="ml-1 text-rose-600 dark:text-rose-400 font-bold">
                              [Waiver ✓]
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {ses.counselorName}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {ses.counselorType}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-700 dark:text-neutral-300 font-medium">
                        {ses.timeRange}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ses.status === "in_session"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                              : ses.status === "confirmed"
                              ? "bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30"
                              : "bg-neutral-100 text-neutral-600 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ses.status === "in_session"
                                ? "bg-emerald-500 animate-ping"
                                : "bg-neutral-400"
                            }`}
                          />
                          <span>{ses.zoomRoom}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <a
                          href={ses.zoomJoinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-emerald-600 hover:text-white dark:bg-neutral-800 dark:hover:bg-emerald-600 text-[11px] font-semibold transition-colors text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
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
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/70 border border-neutral-200/90 dark:border-neutral-800 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Zoom Safety Lock</span>
              </h2>
              <Link
                href="/prototype/admin/zoom"
                className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 font-semibold hover:bg-amber-200 transition-colors"
              >
                Detail →
              </Link>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Kredensial akun Zoom dikunci otomatis agar tidak dapat diedit atau dihapus jika
              ada sesi aktif/mendatang yang terikat.
            </p>

            <div className="space-y-2.5 pt-1">
              {MOCK_ZOOM_ACCOUNTS.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-neutral-900 dark:text-white">
                    <span>{acc.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                      <Lock className="w-3 h-3" />
                      <span>LOCKED</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                    {acc.email}
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                    {acc.safetyLock.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget: Pending Counselor Verification */}
          <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/70 border border-neutral-200/90 dark:border-neutral-800 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Verifikasi Pelamar Mitra</span>
              </h2>
              <Link
                href="/prototype/admin/counselors"
                className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30 font-semibold hover:bg-sky-200 transition-colors"
              >
                Buka Pipeline →
              </Link>
            </div>

            <div className="space-y-3 pt-1">
              {applicants.map((app) => (
                <div
                  key={app.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                    app.status === "approved"
                      ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40"
                      : app.status === "rejected"
                      ? "bg-rose-50/70 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800/40 opacity-60"
                      : "bg-neutral-50 dark:bg-neutral-950/80 border-neutral-200/80 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {app.name}
                      </div>
                      <div className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold">
                        {app.type}
                      </div>
                    </div>
                    {app.status === "approved" && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Disetujui
                      </span>
                    )}
                    {app.status === "rejected" && (
                      <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Ditolak
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {app.bio}
                  </div>

                  {app.status === "pending" && (
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-200/80 dark:border-neutral-800/80">
                      <button
                        type="button"
                        onClick={() => handleApprove(app.id, app.name)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-xs"
                      >
                        Setujui & Undang
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(app.id, app.name)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-200 hover:bg-rose-100 text-neutral-700 hover:text-rose-700 dark:bg-neutral-800 dark:hover:bg-rose-900/60 dark:text-neutral-400 dark:hover:text-rose-300 text-[11px] font-semibold transition-colors cursor-pointer border border-neutral-300 dark:border-neutral-700"
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
  )
}
