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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function FreshZoomAdminPage() {
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
    <div className="max-w-6xl mx-auto flex flex-col gap-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-card border border-primary/40 text-foreground text-xs shadow-md animate-in fade-in flex items-center justify-between">
          <span>{toastMessage}</span>
          <Button variant="ghost" size="xs" onClick={() => setToastMessage(null)}>
            ✕
          </Button>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Kredensial 2 Akun Zoom & Safety Lock
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manajemen alokasi akun Zoom Pro berkapasitas 2 sesi bersamaan dengan proteksi keselamatan sesi.
          </p>
        </div>

        <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold">
          <Lock className="size-3.5" />
          <span>Safety Lock: Aktif (2 Akun Terkunci)</span>
        </Badge>
      </div>

      {/* ADR-0002 Safety Lock Policy Banner */}
      <Card className="p-5 bg-muted/40 border-border flex flex-row items-start gap-3.5 shadow-xs">
        <ShieldAlert className="size-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">
            Arsitektur Keamanan: Kebijakan Safety Lock (ADR-0002)
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Platform beroperasi dengan 2 akun Zoom Pro independen. Demi mencegah kegagalan fatal pada sesi pasien yang telah membayar, sistem melarang keras pengeditan atau penghapusan akun Zoom yang masih memiliki sesi aktif atau mendatang berstatus <code>reserved</code> atau <code>confirmed</code>.
          </CardDescription>
        </div>
      </Card>

      {/* 2 Zoom Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc, index) => (
          <Card key={acc.id} className="p-6 flex flex-col gap-5 shadow-xs">
            {/* Account Header */}
            <CardHeader className="p-0 flex flex-row items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{acc.name}</CardTitle>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Slot #{index + 1}
                  </Badge>
                </div>
                <CardDescription className="font-mono text-xs mt-0.5">
                  {acc.email}
                </CardDescription>
              </div>

              <Badge variant="default" className="flex items-center gap-1.5 py-1 px-2.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>In Session</span>
              </Badge>
            </CardHeader>

            {/* Current Live Session */}
            {acc.currentMeeting && (
              <div className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="font-bold text-primary">Sesi Aktif Saat Ini:</span>
                  <span className="font-mono text-[11px] font-semibold">{acc.currentMeeting.code}</span>
                </div>
                <div className="text-foreground font-bold text-sm">
                  {acc.currentMeeting.patient} ↔ {acc.currentMeeting.counselor}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Rentang Waktu: {acc.currentMeeting.timeRange}
                </div>
              </div>
            )}

            {/* Safety Lock Info Box */}
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between font-bold text-destructive">
                <span className="flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  <span>Kunci Pengaman Aktif</span>
                </span>
                <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                  {acc.safetyLock.upcomingCount} Sesi Terikat
                </Badge>
              </div>
              <p className="text-[11px] text-foreground leading-relaxed">
                {acc.safetyLock.reason}
              </p>
            </div>

            {/* Credentials Info (AES-256 Mock) */}
            <div className="flex flex-col gap-2 text-xs">
              <div className="text-[11px] font-semibold text-foreground">
                Kredensial S2S OAuth (Terenkripsi AES-256-GCM):
              </div>
              <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <span className="text-muted-foreground font-sans">Account ID:</span>
                  <span className="text-foreground font-semibold">zm_acc_8928192839182</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <span className="text-muted-foreground font-sans">Client ID:</span>
                  <span className="text-foreground font-semibold">zm_cli_990182847192</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <span className="text-muted-foreground font-sans">Client Secret:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-semibold">
                      {showSecret[acc.id] ? "sec_7x9128mKlpQ8192kLx" : "••••••••••••••••••••"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => toggleSecret(acc.id)}
                      aria-label="Tampilkan atau sembunyikan secret"
                    >
                      {showSecret[acc.id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Cache & Action */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                <Zap className="size-3.5 text-primary" />
                <span>Token Cache: {acc.tokenExpiresIn}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => showToast(`Token OAuth untuk ${acc.name} berhasil diperbarui!`)}
                  title="Perbarui Token Cache"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="cursor-not-allowed text-xs text-muted-foreground"
                  title="Terkunci oleh Safety Lock (ADR-0002)"
                >
                  <Lock className="size-3 mr-1" />
                  <span>Ubah Kredensial</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Capacity Guard Info */}
      <Card className="p-4 bg-card border-border flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <Server className="size-4 text-primary shrink-0" />
          <span>
            Batas Maksimal Platform: <strong>Tepat 2 Akun Zoom Pro</strong>. Penambahan akun ke-3
            dinonaktifkan demi mematuhi arsitektur zero-cost server.
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          OPTIMAL
        </Badge>
      </Card>
    </div>
  )
}
