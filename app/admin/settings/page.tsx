"use client"

import * as React from "react"
import {
  Sliders,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Info,
  Loader2,
  Lock,
  Clock,
  FileText,
  X,
  Check,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AdminPageHeader, AdminMetricCard } from "@/components/admin"
import {
  getScreeningSettingAction,
  toggleScreeningRequiredAction,
} from "./actions"

export default function AdminSettingsPage() {
  const [isRequired, setIsRequired] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  React.useEffect(() => {
    async function loadSettings() {
      setIsLoading(true)
      try {
        const res = await getScreeningSettingAction()
        if (res.success && res.isScreeningRequired !== undefined) {
          setIsRequired(Boolean(res.isScreeningRequired))
        }
      } catch {
        // Fallback default
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true)
    setFeedback(null)
    try {
      const res = await toggleScreeningRequiredAction(checked)
      if (res.success && res.isScreeningRequired !== undefined) {
        setIsRequired(Boolean(res.isScreeningRequired))
        setFeedback({
          type: "success",
          message: res.message || "Pengaturan berhasil diperbarui dan disinkronkan ke seluruh sistem.",
        })
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menyimpan perubahan pengaturan.",
        })
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Terjadi kesalahan sistem saat menyimpan pengaturan.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-20 font-sans">
      {/* Page Header */}
      <AdminPageHeader
        title="Pengaturan Layanan & Kebijakan"
        description="Konfigurasikan prasyarat klinis, instrumen skrining mandiri, dan parameter operasional reservasi pasien."
        icon={Sliders}
        badge={isLoading ? undefined : isRequired ? "Mode Terproteksi" : "Mode Fleksibel"}
        badgeVariant="outline"
      />

      {/* Feedback Alert Banner */}
      {feedback && (
        <Alert
          variant={feedback.type === "error" ? "destructive" : "default"}
          className={`animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : ""
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <AlertTitle className="font-semibold text-xs">
                {feedback.type === "success" ? "Konfigurasi Diperbarui" : "Terjadi Kesalahan"}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {feedback.message}
              </AlertDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setFeedback(null)}
              className="shrink-0 hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Tutup notifikasi"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Top Metric Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminMetricCard
          title="Skrining Mandiri SRQ-20"
          value={isLoading ? "Memuat..." : isRequired ? "Wajib Diisi" : "Opsional"}
          isLoading={isLoading}
          status={isRequired ? "warning" : "success"}
          trendLabel={
            isRequired
              ? "Pasien wajib triase sebelum checkout"
              : "Pasien boleh melewati ke formulir checkout"
          }
        />
        <AdminMetricCard
          title="Alur Booking Pasien"
          value={isLoading ? "Memuat..." : isRequired ? "Terproteksi" : "Fleksibel"}
          isLoading={isLoading}
          status="neutral"
          trendLabel="Tampil saat pemilihan jadwal konseling"
        />
        <AdminMetricCard
          title="Standar Privasi Pasien"
          value="100% Terenkripsi"
          isLoading={isLoading}
          status="success"
          trendLabel="Kerahasiaan data klinis terjamin"
        />
      </div>

      {/* Main Setting Card: SRQ-20 Screening Requirement */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-foreground">
                  Kewajiban Pengisian Skrining SRQ-20 Saat Booking
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    isRequired
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px]"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px]"
                  }
                >
                  {isRequired ? "Wajib Sebelum Checkout" : "Opsional (Boleh Dilewati)"}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Tentukan apakah calon pasien wajib menyelesaikan kuesioner mandiri 20 butir SRQ-20 sebelum diizinkan melanjutkan ke formulir pembayaran sesi.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2.5 pt-1 shrink-0">
              {isSaving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              <Switch
                id="toggle-screening-required"
                checked={isRequired}
                onCheckedChange={handleToggle}
                disabled={isLoading || isSaving}
                size="sm"
                aria-label="Kewajiban pengisian skrining SRQ-20"
              />
              <Label
                htmlFor="toggle-screening-required"
                className="text-xs font-medium text-foreground cursor-pointer select-none"
              >
                {isRequired ? "Aktif (Wajib)" : "Nonaktif (Opsional)"}
              </Label>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 text-xs pt-4">
          {/* Comparison Cards: Flexible vs Protected */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border transition-all ${
                !isRequired
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : "bg-muted/20 border-border/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground text-sm">Mode Fleksibel (Opsional)</span>
                {!isRequired && (
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed text-xs">
                Pasien diberikan tawaran untuk mengisi SRQ-20 saat memilih jadwal. Pasien berhak melewati langkah ini untuk langsung menyelesaikan pemesanan jadwal. Memaksimalkan konversi booking pasien yang membutuhkan bantuan cepat tanpa hambatan formulir.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border transition-all ${
                isRequired
                  ? "bg-primary/5 border-primary/40 shadow-xs"
                  : "bg-muted/20 border-border/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground text-sm">Mode Terproteksi (Wajib)</span>
                {isRequired && (
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed text-xs">
                Seluruh pasien diwajibkan menyelesaikan 20 pertanyaan SRQ-20 sebelum melanjutkan ke form booking. Skor dan catatan triase klinis dipastikan selalu tersedia di laporan awal konselor untuk penanganan kasus emosional mendalam.
              </p>
            </div>
          </div>

          {/* Operational Policy Callout */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 flex items-start gap-2.5 text-muted-foreground">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground text-xs">Catatan Kebijakan Triage:</span>
              <span className="text-xs leading-relaxed">
                Skrining tidak lagi dipajang di landing page publik demi kenyamanan pengunjung. Pasien hanya akan menemui instrumen skrining saat mereka berkehendak memesan jadwal temu (*booking funnel*).
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 pb-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <span>Perubahan berlaku seketika di seluruh alur pemesanan pasien.</span>
          <span className="text-[11px] font-mono">
            Status: {isLoading ? "Memuat..." : isRequired ? "STRICT_ENFORCEMENT" : "PERMISSIVE_ENFORCEMENT"}
          </span>
        </CardFooter>
      </Card>

      {/* Auxiliary Operational Standards Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy 1: Lead-Time Buffer & Atomic Hold */}
        <Card className="p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Clock className="size-4 text-primary" />
              <span>Buffer Jadwal &amp; Atomic Hold</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sistem secara otomatis menerapkan <strong className="text-foreground">buffer 2 jam</strong> sebelum sesi dimulai untuk memastikan kesiapan konselor. Slot jadwal yang sedang diproses pembayaran dikunci sementara selama <strong className="text-foreground">15 menit</strong> untuk mencegah pemesanan ganda (*race condition*).
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Buffer Lead-Time: 2 Jam</span>
            <Badge variant="secondary" className="text-[10px]">Otomatis Sistem</Badge>
          </div>
        </Card>

        {/* Policy 2: Enkripsi & Safety Lock Zoom */}
        <Card className="p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Lock className="size-4 text-primary" />
              <span>Enkripsi Kredensial &amp; Safety Lock</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seluruh kredensial Server-to-Server OAuth Zoom Pro dienkripsi menggunakan algoritma standar militer <strong className="text-foreground">AES-256-GCM</strong>. Fitur Safety Lock otomatis mengunci akun yang sedang terikat sesi telekonseling aktif pasien.
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Standar Keamanan: AES-256-GCM</span>
            <Badge variant="secondary" className="text-[10px]">Terkunci Otomatis</Badge>
          </div>
        </Card>
      </div>
    </div>
  )
}
