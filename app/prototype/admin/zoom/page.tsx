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
            Kredensial 2 Akun Zoom & Safety Lock
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manajemen alokasi akun Zoom Pro berkapasitas 2 sesi bersamaan dengan proteksi keselamatan sesi.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300 text-xs font-bold shadow-xs">
          <Lock className="w-3.5 h-3.5" />
          <span>Safety Lock: Aktif (2 Akun Terkunci)</span>
        </div>
      </div>

      {/* ADR-0002 Safety Lock Policy Banner */}
      <div className="p-5 rounded-3xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-amber-900 dark:text-amber-300 font-bold text-sm">
            Arsitektur Keamanan: Kebijakan Safety Lock (ADR-0002)
          </strong>
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-[11px]">
            Platform beroperasi dengan 2 akun Zoom Pro independen. Demi mencegah kegagalan fatal pada sesi pasien yang telah membayar, sistem melarang keras pengeditan atau penghapusan akun Zoom yang masih memiliki sesi aktif atau mendatang berstatus <code>reserved</code> atau <code>confirmed</code>.
          </p>
        </div>
      </div>

      {/* 2 Zoom Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc, index) => (
          <div
            key={acc.id}
            className="p-6 rounded-3xl bg-white dark:bg-neutral-900/70 border border-neutral-200/90 dark:border-neutral-800 space-y-5 shadow-xs"
          >
            {/* Account Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-neutral-900 dark:text-white text-base">
                    {acc.name}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono font-bold">
                    Slot #{index + 1}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                  {acc.email}
                </div>
              </div>

              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                In Session
              </span>
            </div>

            {/* Current Live Session */}
            {acc.currentMeeting && (
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Sesi Aktif Saat Ini:</span>
                  <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 font-semibold">
                    {acc.currentMeeting.code}
                  </span>
                </div>
                <div className="text-neutral-900 dark:text-white font-bold text-sm">
                  {acc.currentMeeting.patient} ↔ {acc.currentMeeting.counselor}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                  Rentang Waktu: {acc.currentMeeting.timeRange}
                </div>
              </div>
            )}

            {/* Safety Lock Info Box */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Pengaman Aktif</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-extrabold">
                  {acc.safetyLock.upcomingCount} Sesi Terikat
                </span>
              </div>
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {acc.safetyLock.reason}
              </p>
            </div>

            {/* Credentials Info (AES-256 Mock) */}
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                Kredensial Server-to-Server OAuth (Terenkripsi AES-256-GCM):
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400 font-sans">Account ID:</span>
                  <span className="text-neutral-900 dark:text-neutral-200 font-semibold">zm_acc_8928192839182</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400 font-sans">Client ID:</span>
                  <span className="text-neutral-900 dark:text-neutral-200 font-semibold">zm_cli_990182847192</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400 font-sans">Client Secret:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-900 dark:text-neutral-200 font-semibold">
                      {showSecret[acc.id] ? "sec_7x9128mKlpQ8192kLx" : "••••••••••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSecret(acc.id)}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                      aria-label={showSecret[acc.id] ? "Sembunyikan secret" : "Tampilkan secret"}
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
            <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Token Cache: {acc.tokenExpiresIn}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast(`Token OAuth untuk ${acc.name} berhasil diperbarui!`)}
                  className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 dark:hover:text-white transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
                  title="Perbarui Token Cache"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-400 border border-neutral-200 dark:bg-neutral-800/60 dark:text-neutral-500 dark:border-neutral-700/40 text-xs cursor-not-allowed flex items-center gap-1.5 font-semibold"
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
      <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200/90 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Batas Maksimal Platform: <strong>Tepat 2 Akun Zoom Pro</strong>. Penambahan akun ke-3
            dinonaktifkan demi mematuhi arsitektur zero-cost server.
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
          STATUS: OPTIMAL
        </span>
      </div>
    </div>
  )
}
