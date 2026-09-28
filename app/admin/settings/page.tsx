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
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
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
      const res = await getScreeningSettingAction()
      if (res.success && res.isScreeningRequired !== undefined) {
        setIsRequired(Boolean(res.isScreeningRequired))
      }
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true)
    setFeedback(null)
    const res = await toggleScreeningRequiredAction(checked)
    if (res.success && res.isScreeningRequired !== undefined) {
      setIsRequired(Boolean(res.isScreeningRequired))
      setFeedback({
        type: "success",
        message: res.message || "Pengaturan berhasil disimpan",
      })
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Gagal menyimpan perubahan",
      })
    }
    setIsSaving(false)
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sliders className="size-4" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pengaturan Layanan &amp; Kebijakan Operasional
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Konfigurasikan prasyarat klinis, gerbang skrining mandiri, dan parameter alur reservasi pasien.
        </p>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === "error" ? "destructive" : "default"}
          className={
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : ""
          }
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          <AlertTitle className="font-semibold text-xs">
            {feedback.type === "success" ? "Konfigurasi Diperbarui" : "Terjadi Kesalahan"}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {feedback.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Setting Card */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Kewajiban Pengisian Skrining SRQ-20 Saat Booking
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    isRequired
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  }
                >
                  {isRequired ? "Wajib Sebelum Checkout" : "Opsional (Boleh Dilewati)"}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                Tentukan apakah calon pasien wajib menyelesaikan kuesioner mandiri 20 butir SRQ-20 sebelum diizinkan melanjutkan ke formulir pembayaran sesi.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 pt-1 shrink-0">
              {isSaving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              <Switch
                id="toggle-screening-required"
                checked={isRequired}
                onCheckedChange={handleToggle}
                disabled={isLoading || isSaving}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 text-xs pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-4 rounded-xl border transition-colors ${
                !isRequired
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/30 border-border/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">Mode Fleksibel (Opsional)</span>
                {!isRequired && (
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Pasien diberikan tawaran untuk mengisi SRQ-20 saat memilih jadwal. Pasien berhak melewati langkah ini untuk langsung menyelesaikan pemesanan jadwal. Memaksimalkan konversi booking pasien tamu.
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border transition-colors ${
                isRequired
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/30 border-border/60 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">Mode Terproteksi (Wajib)</span>
                {isRequired && (
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Seluruh pasien diwajibkan menyelesaikan 20 pertanyaan SRQ-20 sebelum melanjutkan ke form booking. Skor dan catatan triase klinis dipastikan selalu tersedia di laporan awal konselor.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-muted/40 border border-border/70 flex items-start gap-2.5 text-muted-foreground">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">Catatan Kebijakan Triage:</span>
              <span>
                Skrining tidak lagi dipajang di landing page publik. Pasien hanya akan menemui instrumen skrining saat mereka berkehendak memesan jadwal temu (*booking funnel*).
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>Perubahan berlaku seketika di seluruh halaman pemesanan pasien.</span>
          <span className="text-[11px] font-mono">Status: {isLoading ? "Memuat..." : isRequired ? "STRICT_ENFORCEMENT" : "PERMISSIVE_ENFORCEMENT"}</span>
        </CardFooter>
      </Card>
    </div>
  )
}
