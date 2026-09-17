"use client"

import * as React from "react"
import { MOCK_ZOOM_ACCOUNTS, ZoomAccount } from "../mock-data"
import {
  Video,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Info,
  X,
  AlertTriangle,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Mock detail sesi yang mengunci masing-masing akun Zoom (ADR-0002)
const BOUND_SESSIONS: Record<
  string,
  Array<{
    code: string
    patient: string
    counselor: string
    timeRange: string
    status: "live" | "confirmed" | "reserved"
    isOverlap?: boolean
  }>
> = {
  "zoom-1": [
    {
      code: "SL-9281",
      patient: "Anindya Putri",
      counselor: "Sarah Annisa, M.Psi., Psikolog",
      timeRange: "Hari Ini, 19:00 – 20:30 WIB",
      status: "live",
    },
    {
      code: "SL-9283",
      patient: "Budi Santoso",
      counselor: "Sarah Annisa, M.Psi., Psikolog",
      timeRange: "Hari Ini, 21:00 – 22:30 WIB",
      status: "confirmed",
    },
    {
      code: "SL-9285",
      patient: "Eka Pratiwi",
      counselor: "Sarah Annisa, M.Psi., Psikolog",
      timeRange: "Besok, 10:00 – 11:30 WIB",
      status: "confirmed",
    },
  ],
  "zoom-2": [
    {
      code: "SL-9282",
      patient: "Dimas Arya",
      counselor: "Rian Hidayat, S.Psi",
      timeRange: "Hari Ini, 19:30 – 21:00 WIB",
      status: "live",
      isOverlap: true,
    },
    {
      code: "SL-9284",
      patient: "Citra Lestari",
      counselor: "Rian Hidayat, S.Psi",
      timeRange: "Hari Ini, 21:30 – 23:00 WIB",
      status: "reserved",
    },
  ],
}

export default function DistilledZoomAdminPage() {
  const [accounts, setAccounts] = React.useState<ZoomAccount[]>(MOCK_ZOOM_ACCOUNTS)
  const [showSecret, setShowSecret] = React.useState<{ [key: string]: boolean }>({})
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Interactive Inspection & Edit States
  const [inspectingAccountId, setInspectingAccountId] = React.useState<string | null>(null)
  const [simulatedUnlockedId, setSimulatedUnlockedId] = React.useState<string | null>(null)
  const [editingAccountId, setEditingAccountId] = React.useState<string | null>(null)
  const [credentialForm, setCredentialForm] = React.useState({
    accountId: "zm_acc_8928192839182",
    clientId: "zm_cli_990182847192",
    clientSecret: "sec_7x9128mKlpQ8192kLx",
  })

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const toggleSecret = (id: string) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText?.(text)
    setCopiedKey(label)
    showToast(`${label} disalin ke papan klip!`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleSafetyLockSimulation = (id: string) => {
    if (simulatedUnlockedId === id) {
      setSimulatedUnlockedId(null)
      showToast(`Simulasi Safety Lock untuk ${id === "zoom-1" ? "Ruang #1" : "Ruang #2"} diaktifkan kembali (Terkunci).`)
    } else {
      setSimulatedUnlockedId(id)
      showToast(
        `Simulasi: Safety Lock untuk ${id === "zoom-1" ? "Ruang #1" : "Ruang #2"} dilepas (Semua sesi dianggap selesai). Kredensial kini dapat diubah!`
      )
    }
  }

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault()
    showToast(`Kredensial S2S OAuth untuk ${editingAccountId === "zoom-1" ? "Ruang #1" : "Ruang #2"} berhasil diperbarui & disimpan terenkripsi AES-256-GCM.`)
    setEditingAccountId(null)
  }

  const inspectingAccount = accounts.find((a) => a.id === inspectingAccountId)
  const inspectingSessions = inspectingAccountId ? BOUND_SESSIONS[inspectingAccountId] || [] : []

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Page Header: Clear & Informative */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Kredensial 2 Ruang Zoom & Safety Lock
            </h1>
            <Badge variant="outline" className="text-xs font-mono py-0.5">
              ADR-0001 & ADR-0002
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Manajemen alokasi pool 2 akun Zoom Pro independen untuk menangani sesi 90 menit dan jadwal tumpang tindih (*overlap*).
          </p>
        </div>

        {/* Executive Pool Metrics */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border">
            <Server className="size-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">Kapasitas Pool:</span>
            <span className="font-semibold text-foreground">2 / 2 Ruang Aktif</span>
          </div>
          <Badge
            variant={simulatedUnlockedId ? "secondary" : "destructive"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
          >
            <Lock className="size-3" />
            <span>
              {simulatedUnlockedId ? "Safety Lock: 1 Terkunci, 1 Terbuka (Uji)" : "Safety Lock: Aktif (2 Terkunci)"}
            </span>
          </Badge>
        </div>
      </div>

      {/* ADR-0002 Distilled Architectural Banner: Sleek 1-Row Policy Bar */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="size-4 text-amber-500 shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold text-foreground whitespace-nowrap">
              Proteksi Integritas Ruang Pasien (Safety Lock):
            </span>
            <span className="text-muted-foreground line-clamp-1 sm:line-clamp-none">
              Sistem memblokir edit/hapus kredensial selama terdapat sesi <em>confirmed</em> atau <em>reserved</em>.
            </span>
          </div>
        </div>

        {/* Direct Simulation Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setInspectingAccountId("zoom-1")}
            className="h-7 text-xs font-normal"
            title="Periksa sesi pasien yang mengunci Ruang #1"
          >
            Inspeksi Sesi Ruang #1
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => toggleSafetyLockSimulation("zoom-2")}
            className={`h-7 text-xs font-normal ${
              simulatedUnlockedId === "zoom-2"
                ? "border-primary text-primary bg-primary/10"
                : ""
            }`}
            title="Simulasikan pelepasan safety lock pada Ruang #2 saat tidak ada sesi mendatang"
          >
            {simulatedUnlockedId === "zoom-2" ? "Kunci Kembali Ruang #2" : "Simulasi Lepas Kunci #2"}
          </Button>
        </div>
      </div>

      {/* Visual Concurrency & 90-Minute Overlap Timeline (ADR-0002 Visual Proof) */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h2 className="text-xs font-bold text-foreground tracking-tight">
              Peta Alokasi Konkurensi Sesi 90-Menit (ADR-0002) — Hari Ini
            </h2>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span>Ruang #1 (Primary)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-chart-2" />
              <span>Ruang #2 (Overlap)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Overlap Window (2/2 Terisi)</span>
            </div>
          </div>
        </div>

        {/* Timeline Visualization Grid */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Time axis scale */}
          <div className="grid grid-cols-6 text-[10px] font-mono text-muted-foreground border-b border-border/60 pb-1 text-center">
            <div>18:00</div>
            <div>19:00</div>
            <div>20:00</div>
            <div>21:00</div>
            <div>22:00</div>
            <div>23:00</div>
          </div>

          {/* Track 1: Ruang #1 */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 font-medium text-foreground text-[11px] truncate">
              Ruang #1:
            </span>
            <div className="relative flex-1 h-8 bg-muted/30 rounded-lg border border-border/60 overflow-hidden">
              {/* SL-9281: 19:00 - 20:30 (approx 18.2% to 45.5%) */}
              <div
                className="absolute top-1 bottom-1 left-[18.2%] w-[27.3%] bg-primary/20 border border-primary/40 rounded-md px-2 flex items-center justify-between text-[10px] text-foreground font-semibold"
                title="SL-9281: 19:00 – 20:30 WIB (Live)"
              >
                <span className="truncate">SL-9281 (19:00 - 20:30)</span>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>

              {/* SL-9283: 21:00 - 22:30 (approx 54.5% to 81.8%) */}
              <div
                className="absolute top-1 bottom-1 left-[54.5%] w-[27.3%] bg-primary/10 border border-primary/30 rounded-md px-2 flex items-center text-[10px] text-muted-foreground"
                title="SL-9283: 21:00 – 22:30 WIB (Confirmed)"
              >
                <span className="truncate">SL-9283 (21:00 - 22:30)</span>
              </div>
            </div>
          </div>

          {/* Track 2: Ruang #2 */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 font-medium text-foreground text-[11px] truncate">
              Ruang #2:
            </span>
            <div className="relative flex-1 h-8 bg-muted/30 rounded-lg border border-border/60 overflow-hidden">
              {/* SL-9282: 19:30 - 21:00 (approx 27.3% to 54.5%) */}
              <div
                className="absolute top-1 bottom-1 left-[27.3%] w-[27.3%] bg-chart-2/20 border border-chart-2/50 rounded-md px-2 flex items-center justify-between text-[10px] text-foreground font-semibold"
                title="SL-9282: 19:30 – 21:00 WIB (Live Overlap)"
              >
                <span className="truncate">SL-9282 (19:30 - 21:00)</span>
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>

              {/* SL-9284: 21:30 - 23:00 (approx 63.6% to 90.9%) */}
              <div
                className="absolute top-1 bottom-1 left-[63.6%] w-[27.3%] bg-chart-2/10 border border-chart-2/30 rounded-md px-2 flex items-center text-[10px] text-muted-foreground"
                title="SL-9284: 21:30 – 23:00 WIB (Hold Pembayaran)"
              >
                <span className="truncate">SL-9284 (21:30 - 23:00)</span>
              </div>
            </div>
          </div>

          {/* Concurrency Overlap Highlight Banner */}
          <div className="mt-1 flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>
                <strong>Jendela Overlap 19:30 – 20:30 WIB:</strong> Kedua Ruang Zoom Pro aktif simultan melayani 2 sesi konseling.
              </span>
            </div>
            <span className="font-mono text-[10px] text-amber-500 font-semibold shrink-0">
              KAPASITAS POOL 100%
            </span>
          </div>
        </div>
      </div>

      {/* 2 Zoom Accounts Grid: Distilled, No Nested Card Fatigue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {accounts.map((acc, index) => {
          const isSimulatedUnlocked = simulatedUnlockedId === acc.id
          const boundCount = isSimulatedUnlocked ? 0 : acc.safetyLock.upcomingCount

          return (
            <div
              key={acc.id}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 shadow-xs transition-colors h-full"
            >
              {/* Card Header: Slot & Identity */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-base tracking-tight">
                      {acc.name}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">
                      Slot #{index + 1}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{acc.email}</span>
                </div>

                {/* Live Status Indicator */}
                <Badge
                  variant={isSimulatedUnlocked ? "secondary" : "default"}
                  className="flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium shrink-0"
                >
                  <span
                    className={`size-2 rounded-full ${
                      isSimulatedUnlocked ? "bg-muted-foreground" : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  <span>{isSimulatedUnlocked ? "Siaga (Standby)" : "Sesi Aktif"}</span>
                </Badge>
              </div>

              {/* Sesi Aktif Saat Ini: Clean Integrated Block with calibrated min-height */}
              <div className="rounded-xl bg-muted/30 p-3.5 flex flex-col gap-2 min-h-[82px] justify-center">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Video className="size-3.5 text-primary" />
                    <span>Sesi Berlangsung:</span>
                  </span>
                  {acc.currentMeeting && !isSimulatedUnlocked ? (
                    <Badge variant="secondary" className="font-mono text-[11px] font-semibold">
                      {acc.currentMeeting.code}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">Tidak ada sesi aktif</span>
                  )}
                </div>

                {acc.currentMeeting && !isSimulatedUnlocked ? (
                  <div className="flex flex-col gap-1 text-xs">
                    <div className="font-medium text-foreground text-sm">
                      {acc.currentMeeting.patient}{" "}
                      <span className="text-muted-foreground font-normal">dengan</span>{" "}
                      {acc.currentMeeting.counselor}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span className="tabular-nums">{acc.currentMeeting.timeRange}</span>
                      </span>
                      {acc.id === "zoom-2" && (
                        <span className="text-amber-500 font-medium">
                          • Jadwal Overlap (+30m)
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Ruang Zoom siap dialokasikan untuk pemesanan sesi konseling berikutnya.
                  </p>
                )}
              </div>

              {/* Status Safety Lock: Clean Integrated Alert with calibrated min-height */}
              <div
                className={`rounded-xl p-3.5 flex flex-col gap-2 text-xs border min-h-[88px] justify-between ${
                  isSimulatedUnlocked
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    {isSimulatedUnlocked ? (
                      <ShieldCheck className="size-4" />
                    ) : (
                      <Lock className="size-4" />
                    )}
                    <span>
                      {isSimulatedUnlocked
                        ? "Safety Lock Nonaktif (Bebas Diedit)"
                        : "Safety Lock Aktif (Kredensial Terkunci)"}
                    </span>
                  </span>

                  {!isSimulatedUnlocked && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setInspectingAccountId(acc.id)}
                      className="h-6 text-[11px] font-medium text-destructive hover:text-destructive hover:bg-destructive/15 px-2"
                      title="Lihat daftar sesi yang mengunci kredensial akun ini"
                    >
                      {boundCount} Sesi Terikat →
                    </Button>
                  )}
                </div>

                <p className="text-[11px] text-foreground/80 leading-relaxed">
                  {isSimulatedUnlocked
                    ? "Tidak ada sesi aktif atau reservasi mendatang yang terikat pada akun ini. Anda dapat memperbarui kredensial S2S OAuth secara aman."
                    : acc.safetyLock.reason}
                </p>
              </div>

              {/* Kredensial S2S OAuth: Sleek Unified Grid with calibrated label widths */}
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Kredensial Server-to-Server OAuth (AES-256-GCM)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Supabase Vault
                  </span>
                </div>

                <div className="rounded-xl border border-border divide-y divide-border/60 font-mono text-[11px] bg-background/50">
                  {/* Account ID */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground font-sans text-xs min-w-[90px]">Account ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground font-semibold">zm_acc_8928192839182</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopy("zm_acc_8928192839182", "Account ID")}
                        title="Salin Account ID"
                        aria-label="Salin Account ID"
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Client ID */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground font-sans text-xs min-w-[90px]">Client ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground font-semibold">zm_cli_990182847192</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopy("zm_cli_990182847192", "Client ID")}
                        title="Salin Client ID"
                        aria-label="Salin Client ID"
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Client Secret */}
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground font-sans text-xs min-w-[90px]">Client Secret</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground font-semibold">
                        {showSecret[acc.id] ? "sec_7x9128mKlpQ8192kLx" : "••••••••••••••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => toggleSecret(acc.id)}
                        title={showSecret[acc.id] ? "Sembunyikan Secret" : "Tampilkan Secret"}
                        aria-label={showSecret[acc.id] ? "Sembunyikan Secret" : "Tampilkan Secret"}
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        {showSecret[acc.id] ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleCopy("sec_7x9128mKlpQ8192kLx", "Client Secret")}
                        title="Salin Client Secret"
                        aria-label="Salin Client Secret"
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Token Cache & Action Buttons */}
              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs mt-auto">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                  <Zap className="size-3.5 text-primary" />
                  <span>Token Cache: {acc.tokenExpiresIn}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      showToast(
                        `Token OAuth untuk ${acc.name} berhasil diperbarui di cache memory (Masa berlaku direset ke 60 menit)!`
                      )
                    }
                    className="h-8 text-xs font-normal"
                    title="Perbarui masa berlaku token OAuth sekarang"
                  >
                    <RefreshCw className="size-3.5 mr-1.5 text-muted-foreground" />
                    <span>Perbarui Token</span>
                  </Button>

                  {isSimulatedUnlocked ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingAccountId(acc.id)
                      }}
                      className="h-8 text-xs font-medium"
                      title="Ubah kredensial S2S OAuth"
                    >
                      <Key className="size-3.5 mr-1.5" />
                      <span>Ubah Kredensial</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInspectingAccountId(acc.id)}
                      className="h-8 text-xs text-muted-foreground font-normal hover:text-destructive hover:border-destructive/40"
                      title="Klik untuk melihat mengapa akun ini terkunci oleh Safety Lock (ADR-0002)"
                    >
                      <Lock className="size-3 mr-1.5 text-destructive" />
                      <span>Kredensial Terkunci</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Capacity Guard Info: Executive Architectural Note */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2.5 min-w-0">
          <Server className="size-4 text-primary shrink-0" />
          <span>
            Arsitektur Zero-Cost: Kuota akun ditetapkan tepat <strong>2 Akun Zoom Pro</strong> untuk melayani konkurensi maksimal 2 sesi bersamaan secara aman.
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
          KAPASITAS OPTIMAL
        </Badge>
      </div>

      {/* Modal 1: Inspeksi Sesi Terikat & Kepatuhan Safety Lock */}
      {inspectingAccount && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-destructive" />
                  <h3 className="font-bold text-foreground text-base">
                    Audit Safety Lock: {inspectingAccount.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Daftar reservasi sesi aktif dan mendatang yang mengunci kredensial akun ini.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setInspectingAccountId(null)}
                aria-label="Tutup dialog"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Explanation Alert */}
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-xs text-destructive flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <Lock className="size-4 shrink-0" />
                <span>Kredensial Diblokir Demi Integritas Ruang Rapat Pasien</span>
              </div>
              <p className="text-foreground/90 leading-relaxed text-xs">
                Mengubah Client ID atau Secret saat ada sesi yang sudah dijadwalkan akan menyebabkan token rapat Zoom pasien tidak valid saat dimulai. Kredensial baru hanya dapat dimasukkan setelah seluruh sesi di bawah selesai atau dialihkan.
              </p>
            </div>

            {/* Bound Sessions List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground">
                Sesi Terikat ({inspectingSessions.length} Sesi):
              </span>
              <div className="rounded-xl border border-border divide-y divide-border/60 max-h-56 overflow-y-auto bg-muted/20">
                {inspectingSessions.map((ses) => (
                  <div key={ses.code} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground font-mono">{ses.code}</span>
                        {ses.status === "live" ? (
                          <Badge variant="default" className="text-[10px] py-0 px-1.5">
                            Sedang Berlangsung
                          </Badge>
                        ) : ses.status === "reserved" ? (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                            Hold Pembayaran (15m)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            Terkonfirmasi
                          </Badge>
                        )}
                        {ses.isOverlap && (
                          <span className="text-[10px] text-amber-500 font-medium">
                            • Overlap
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {ses.patient} ↔ {ses.counselor}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-medium text-foreground tabular-nums text-[11px]">
                        {ses.timeRange}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="text-muted-foreground text-[11px]">
                Aturan Kepatuhan: ADR-0001 (Zero-Cost Teleconsultation)
              </span>
              <Button
                size="sm"
                onClick={() => setInspectingAccountId(null)}
                className="h-8 text-xs font-medium"
              >
                Mengerti & Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Kredensial S2S OAuth (Saat Safety Lock Terbuka / Simulasi Bebas Sesi) */}
      {editingAccountId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Key className="size-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">
                    Ubah Kredensial S2S OAuth
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Perbarui kredensial untuk {editingAccountId === "zoom-1" ? "Ruang Zoom #1" : "Ruang Zoom #2"}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setEditingAccountId(null)}
                aria-label="Tutup form edit"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Success Info Alert */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-500 flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0" />
              <span className="text-foreground text-xs leading-relaxed">
                Safety lock terverifikasi nonaktif. Akun ini tidak memiliki sesi aktif sehingga kredensial aman diubah.
              </span>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveCredentials} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Zoom Account ID</label>
                <input
                  type="text"
                  value={credentialForm.accountId}
                  onChange={(e) =>
                    setCredentialForm({ ...credentialForm, accountId: e.target.value })
                  }
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Zoom Client ID</label>
                <input
                  type="text"
                  value={credentialForm.clientId}
                  onChange={(e) =>
                    setCredentialForm({ ...credentialForm, clientId: e.target.value })
                  }
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Zoom Client Secret</label>
                <input
                  type="password"
                  value={credentialForm.clientSecret}
                  onChange={(e) =>
                    setCredentialForm({ ...credentialForm, clientSecret: e.target.value })
                  }
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Kredensial disimpan terenkripsi menggunakan AES-256-GCM pada Supabase Vault.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAccountId(null)}
                  className="h-8 text-xs font-normal"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs font-medium">
                  Simpan Kredensial Baru
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

