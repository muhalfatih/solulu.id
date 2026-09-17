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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 text-xs shadow-xl animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Welcome & Summary Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Ringkasan Operasional & Monitoring Realtime
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Status infrastruktur Vercel, alokasi 2 akun Zoom Pro, dan antrean sesi hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <Clock className="w-3.5 h-3.5 text-neutral-500" />
          <span>Kamis, 17 Sep 2026 (WIB)</span>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_METRICS.map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 shadow-sm hover:border-neutral-700 transition-colors"
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
          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>Sesi Hari Ini & Triage Pasien</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Durasi fixed 90 menit • Terkoneksi otomatis ke Zoom Host & Link Pasien
                </p>
              </div>
              <Link
                href="/prototype/admin/sessions"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
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
                      <td className="py-3 pl-1 font-mono font-semibold text-emerald-400">
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
                            ? "Berlangsung"
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-emerald-600 hover:text-white text-[11px] font-medium transition-colors text-neutral-300 border border-neutral-700"
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
          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Zoom Safety Lock</span>
              </h3>
              <Link
                href="/prototype/admin/zoom"
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold hover:bg-amber-500/25 transition-colors"
              >
                Detail Kredensial →
              </Link>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Kredensial akun Zoom dikunci otomatis agar tidak dapat diedit atau dihapus jika
              ada sesi aktif/mendatang yang terikat.
            </p>

            <div className="space-y-2.5 pt-1">
              {MOCK_ZOOM_ACCOUNTS.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-medium text-white">
                    <span>{acc.name}</span>
                    <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>LOCKED</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono">{acc.email}</div>
                  <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 leading-tight">
                    {acc.safetyLock.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget: Pending Counselor Verification */}
          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <span>Verifikasi Pelamar Mitra</span>
              </h3>
              <Link
                href="/prototype/admin/counselors"
                className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold hover:bg-sky-500/25 transition-colors"
              >
                Buka Pipeline →
              </Link>
            </div>

            <div className="space-y-3 pt-1">
              {applicants.map((app) => (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                    app.status === "approved"
                      ? "bg-emerald-950/20 border-emerald-800/40"
                      : app.status === "rejected"
                      ? "bg-rose-950/20 border-rose-800/40 opacity-60"
                      : "bg-neutral-950/80 border-neutral-800"
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

                  {app.status === "pending" && (
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80">
                      <button
                        onClick={() => handleApprove(app.id, app.name)}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        Setujui & Undang
                      </button>
                      <button
                        onClick={() => handleReject(app.id, app.name)}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-300 text-[11px] transition-colors cursor-pointer border border-neutral-700"
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
