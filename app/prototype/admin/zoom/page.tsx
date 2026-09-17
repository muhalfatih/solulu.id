"use client"

import * as React from "react"
import { MOCK_ZOOM_ACCOUNTS, ZoomAccount } from "../mock-data"
import {
  Video,
  Lock,
  ShieldAlert,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertOctagon,
  Info,
  Server,
  Zap,
} from "lucide-react"

export default function ZoomAdminPage() {
  const [accounts, setAccounts] = React.useState<ZoomAccount[]>(MOCK_ZOOM_ACCOUNTS)
  const [showSecret, setShowSecret] = React.useState<{ [key: string]: boolean }>({})
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const toggleSecret = (id: string) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }))
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
            Kredensial 2 Akun Zoom & Safety Lock
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manajemen alokasi akun Zoom Pro berkapasitas 2 sesi bersamaan dengan proteksi keselamatan sesi.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Safety Lock: Aktif (2 Akun Terkunci)</span>
        </div>
      </div>

      {/* ADR-0002 Safety Lock Policy Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-amber-300 font-semibold text-sm">
            Arsitektur Keamanan: Kebijakan Safety Lock (ADR-0002)
          </strong>
          <p className="text-neutral-300 leading-relaxed text-[11px]">
            Platform beroperasi dengan 2 akun Zoom Pro independen. Demi mencegah kegagalan fatal pada sesi pasien yang telah membayar, sistem melarang keras pengeditan atau penghapusan akun Zoom yang masih memiliki sesi aktif atau mendatang berstatus <code>reserved</code> atau <code>confirmed</code>.
          </p>
        </div>
      </div>

      {/* 2 Zoom Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc, index) => (
          <div
            key={acc.id}
            className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-5 shadow-sm"
          >
            {/* Account Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-base">{acc.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono">
                    Slot #{index + 1}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">{acc.email}</div>
              </div>

              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                In Session
              </span>
            </div>

            {/* Current Live Session */}
            {acc.currentMeeting && (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="font-medium text-emerald-400">Sesi Aktif Saat Ini:</span>
                  <span className="font-mono text-[11px] text-neutral-300">
                    {acc.currentMeeting.code}
                  </span>
                </div>
                <div className="text-white font-medium">
                  {acc.currentMeeting.patient} ↔ {acc.currentMeeting.counselor}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Rentang Waktu: {acc.currentMeeting.timeRange}
                </div>
              </div>
            )}

            {/* Safety Lock Info Box */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Pengaman Aktif</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-200">
                  {acc.safetyLock.upcomingCount} Sesi Terikat
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                {acc.safetyLock.reason}
              </p>
            </div>

            {/* Credentials Info (AES-256 Mock) */}
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-medium text-neutral-400">
                Kredensial Server-to-Server OAuth (Terenkripsi AES-256-GCM):
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-400">Account ID:</span>
                  <span className="text-neutral-200">zm_acc_8928192839182</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-400">Client ID:</span>
                  <span className="text-neutral-200">zm_cli_990182847192</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-400">Client Secret:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-200">
                      {showSecret[acc.id] ? "sec_7x9128mKlpQ8192kLx" : "••••••••••••••••••••"}
                    </span>
                    <button
                      onClick={() => toggleSecret(acc.id)}
                      className="text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showSecret[acc.id] ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Cache & Action Button */}
            <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Token Cache: {acc.tokenExpiresIn}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast(`Token OAuth untuk ${acc.name} berhasil diperbarui!`)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700"
                  title="Perbarui Token Cache"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled
                  className="px-3 py-1.5 rounded-xl bg-neutral-800/60 text-neutral-500 border border-neutral-700/40 text-xs cursor-not-allowed flex items-center gap-1.5"
                  title="Terkunci oleh Safety Lock (ADR-0002)"
                >
                  <Lock className="w-3 h-3" />
                  <span>Ubah Kredensial</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Free Tier Capacity Guard Card */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>
            Batas Maksimal Platform: <strong>Tepat 2 Akun Zoom</strong>. Penambahan akun ke-3
            dinonaktifkan untuk mematuhi arsitektur zero-cost server.
          </span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400">STATUS: OPTIMAL</span>
      </div>
    </div>
  )
}
