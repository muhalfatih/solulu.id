"use client"

import * as React from "react"
import {
  Sliders,
  ShieldCheck,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lock,
  Info,
  Loader2,
  Calendar,
  ExternalLink,
  X,
  Settings2,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldContent,
} from "@/components/ui/field"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { AdminPageHeader, AdminMetricCard } from "@/components/admin"
import {
  getScreeningSettingAction,
  toggleScreeningRequiredAction,
} from "./actions"

export default function AdminSettingsPage() {
  const [isRequired, setIsRequired] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("clinical")
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
        // Retain default fallback without crash
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
          message:
            res.message ||
            "Pengaturan berhasil diperbarui dan langsung diterapkan pada sistem pemesanan.",
        })
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menyimpan perubahan pengaturan.",
        })
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Terjadi kendala saat menyimpan pengaturan. Silakan coba lagi."
      setFeedback({
        type: "error",
        message: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-20 font-sans">
        {/* Page Header: Jelas, manusiawi, dan tidak menggunakan jargon teknis */}
        <AdminPageHeader
          title="Pengaturan Layanan"
          description="Atur ketentuan pengisian kuesioner pasien serta aturan jadwal sesi konseling."
          icon={Sliders}
          badge={
            isLoading
              ? undefined
              : isRequired
                ? "Skrining Wajib"
                : "Skrining Bebas"
          }
          badgeVariant={isRequired ? "default" : "secondary"}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs h-8"
              >
                <Link href="/admin/zoom-settings">
                  <Lock data-icon="inline-start" />
                  <span>Pengaturan Zoom</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs h-8"
              >
                <Link href="/admin/sessions">
                  <Calendar data-icon="inline-start" />
                  <span>Kalender Jadwal</span>
                </Link>
              </Button>
            </div>
          }
        />

        {/* Notifikasi Umpan Balik */}
        {feedback && (
          <Alert
            variant={feedback.type === "error" ? "destructive" : "default"}
            className="animate-in fade-in transition-all border shadow-xs"
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="size-4 text-foreground shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
            )}
            <div className="flex items-start justify-between w-full gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <AlertTitle className="font-semibold text-xs">
                  {feedback.type === "success"
                    ? "Pengaturan Berhasil Disimpan"
                    : "Penyimpanan Gagal"}
                </AlertTitle>
                <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
                  {feedback.message}
                </AlertDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setFeedback(null)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Tutup notifikasi"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </Alert>
        )}

        {/* Kartu Ringkasan Metrik: Bahasa natural dan tidak kaku */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <AdminMetricCard
            title="Kuesioner Awal (SRQ-20)"
            value={isLoading ? "Memuat..." : isRequired ? "Wajib Diisi" : "Boleh Dilewati"}
            isLoading={isLoading}
            status={isRequired ? "warning" : "default"}
            icon={ClipboardList}
            trendLabel={
              isRequired
                ? "Pasien mengisi kuesioner sebelum memesan sesi"
                : "Pasien dapat langsung lanjut tanpa kuesioner"
            }
          />
          <AdminMetricCard
            title="Alur Pemesanan"
            value={isLoading ? "Memuat..." : isRequired ? "Terarah" : "Langsung"}
            isLoading={isLoading}
            status="neutral"
            icon={ShieldCheck}
            trendLabel="Tampil pada langkah pemilihan jadwal"
          />
          <AdminMetricCard
            title="Kerahasiaan Jawaban"
            value="Aman & Terjaga"
            isLoading={isLoading}
            status="success"
            icon={Lock}
            trendLabel="Hanya konselor bertugas yang dapat membaca"
          />
        </div>

        {/* Tab Navigasi: Standar Vega dengan label jelas */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col gap-6"
        >
          <TabsList className="w-full sm:w-auto self-start grid grid-cols-2 sm:inline-flex h-9 p-1 bg-muted/60 border border-border/40 rounded-lg">
            <TabsTrigger
              value="clinical"
              className="text-xs font-medium gap-2 px-3 py-1.5"
            >
              <ClipboardList data-icon="inline-start" />
              <span>Kuesioner Pasien</span>
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="text-xs font-medium gap-2 px-3 py-1.5"
            >
              <Settings2 data-icon="inline-start" />
              <span>Aturan Jadwal & Zoom</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Kuesioner Pasien (SRQ-20) */}
          <TabsContent value="clinical" className="flex flex-col gap-6 m-0 outline-none">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pt-6 px-6 pb-5 border-b border-border/60">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Pengisian Kuesioner SRQ-20 Sebelum Pembayaran
                    </CardTitle>
                    <Badge
                      variant={isRequired ? "default" : "secondary"}
                      className="text-[11px] font-medium"
                    >
                      {isRequired
                        ? "Wajib Diisi"
                        : "Bebas (Opsional)"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    Tentukan apakah calon pasien wajib menjawab 20 pertanyaan kesehatan emosional sebelum menyelesaikan pembayaran sesi.
                  </CardDescription>
                </div>

                <CardAction>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-help">
                        <Badge variant="outline" className="text-[11px]">
                          {isRequired ? "Mode Wajib" : "Mode Fleksibel"}
                        </Badge>
                        <HelpCircle className="size-3.5 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="max-w-xs text-xs">
                        {isRequired
                          ? "Pasien harus mengisi seluruh pertanyaan sebelum diarahkan ke halaman pembayaran."
                          : "Pasien dapat melewati kuesioner jika butuh konsultasi cepat."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </CardAction>
              </CardHeader>

              <CardContent className="pt-6 px-6 pb-6 flex flex-col gap-6 text-xs">
                {/* Form Switch Control */}
                <FieldGroup className="gap-4">
                  <Field
                    orientation="horizontal"
                    className="p-5 rounded-lg border border-border/70 bg-muted/15 hover:bg-muted/25 transition-colors flex items-center justify-between gap-4"
                  >
                    <FieldContent className="gap-1">
                      <div className="flex items-center gap-2">
                        <FieldLabel
                          htmlFor="toggle-screening-required"
                          className="text-sm font-medium text-foreground cursor-pointer"
                        >
                          Wajibkan Pengisian Kuesioner
                        </FieldLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help inline-flex text-muted-foreground hover:text-foreground">
                              <Info className="size-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="max-w-xs text-xs">
                              Kuesioner SRQ-20 adalah daftar 20 pertanyaan standar WHO untuk membantu mengenali keluhan cemas atau suasana hati pasien.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FieldDescription className="text-xs text-muted-foreground">
                        Jika diaktifkan, tombol lanjut pembayaran tidak dapat diklik sebelum seluruh pertanyaan dijawab oleh pasien.
                      </FieldDescription>
                    </FieldContent>

                    <div className="flex items-center gap-3 shrink-0">
                      {isSaving && (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        id="toggle-screening-required"
                        checked={isRequired}
                        onCheckedChange={handleToggle}
                        disabled={isLoading || isSaving}
                        aria-label="Kewajiban pengisian kuesioner SRQ-20"
                      />
                    </div>
                  </Field>
                </FieldGroup>

                <Separator />

                {/* Perbandingan Mode: Bahasa ramah & mudah dimengerti */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-5 rounded-lg border transition-all flex flex-col gap-2.5 ${
                      !isRequired
                        ? "bg-card border-foreground/30 shadow-xs ring-1 ring-foreground/5"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          Mode Fleksibel (Boleh Dilewati)
                        </span>
                        {!isRequired && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 font-medium">
                            Aktif
                          </Badge>
                        )}
                      </div>
                      {!isRequired && (
                        <CheckCircle2 className="size-4 text-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Pasien diajak mengisi kuesioner saat memilih jadwal, namun tetap diberi pilihan untuk melewatinya. Cocok bagi pasien yang membutuhkan bantuan cepat tanpa hambatan pengisian formulir.
                    </p>
                  </div>

                  <div
                    className={`p-5 rounded-lg border transition-all flex flex-col gap-2.5 ${
                      isRequired
                        ? "bg-card border-foreground/30 shadow-xs ring-1 ring-foreground/5"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          Mode Terarah (Wajib Diisi)
                        </span>
                        {isRequired && (
                          <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 font-medium">
                            Aktif
                          </Badge>
                        )}
                      </div>
                      {isRequired && (
                        <CheckCircle2 className="size-4 text-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Pasien wajib menyelesaikan 20 butir pertanyaan sebelum menuju pembayaran. Memastikan konselor selalu memiliki data awal kondisi pasien sebelum telekonseling dimulai.
                    </p>
                  </div>
                </div>

                {/* Catatan Privasi */}
                <Alert className="bg-muted/30 border-border/70 text-muted-foreground">
                  <Info className="size-4 text-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <AlertTitle className="font-semibold text-xs text-foreground">
                      Lokasi Pengisian Kuesioner
                    </AlertTitle>
                    <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
                      Pertanyaan kuesioner hanya ditampilkan pada alur pemesanan jadwal, bukan di halaman depan publik. Privasi pengunjung website tetap terjaga.
                    </AlertDescription>
                  </div>
                </Alert>
              </CardContent>

              <CardFooter className="pt-4 px-6 pb-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                <span>Perubahan langsung tersimpan dan berlaku untuk semua pemesanan baru.</span>
                <span className="text-xs text-muted-foreground/80">
                  Status Saat Ini: <strong className="text-foreground font-medium">{isRequired ? "Wajib Diisi" : "Boleh Dilewati"}</strong>
                </span>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 2: Aturan Jadwal & Zoom */}
          <TabsContent value="operations" className="flex flex-col gap-6 m-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kebijakan 1: Jeda Pemesanan & Kunci Jadwal */}
              <Card className="border border-border/80 shadow-xs flex flex-col justify-between">
                <CardHeader className="pt-6 px-6 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <Clock className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Jeda Waktu &amp; Penguncian Jadwal
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Mencegah jadwal bentrok dan memberi waktu persiapan bagi konselor.
                  </CardDescription>
                  <CardAction>
                    <Badge variant="outline" className="text-[10px]">
                      Otomatis
                    </Badge>
                  </CardAction>
                </CardHeader>

                <CardContent className="pt-5 px-6 pb-5 flex flex-col gap-2.5 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    Pemesanan dibatasi minimal <strong className="text-foreground font-semibold">2 jam</strong> sebelum sesi dimulai agar konselor memiliki waktu persiapan yang cukup.
                  </p>
                  <p>
                    Saat calon pasien sedang berada di tahap pembayaran, jadwal tersebut dikunci sementara selama <strong className="text-foreground font-semibold">15 menit</strong> agar tidak dipesan oleh orang lain secara bersamaan.
                  </p>
                </CardContent>

                <CardFooter className="pt-3.5 px-6 pb-3.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Batas Minimal Pemesanan:</span>
                  <span className="font-medium text-foreground">2 Jam Sebelum Sesi</span>
                </CardFooter>
              </Card>

              {/* Kebijakan 2: Keamanan Zoom */}
              <Card className="border border-border/80 shadow-xs flex flex-col justify-between">
                <CardHeader className="pt-6 px-6 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                    <Lock className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold text-foreground">
                      Keamanan Akun &amp; Ruang Temu Zoom
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Perlindungan ruang temu agar tautan sesi konseling tidak tertukar.
                  </CardDescription>
                  <CardAction>
                    <Badge variant="outline" className="text-[10px]">
                      Terkunci Aman
                    </Badge>
                  </CardAction>
                </CardHeader>

                <CardContent className="pt-5 px-6 pb-5 flex flex-col gap-2.5 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    Seluruh data koneksi Zoom disimpan dengan proteksi sandi yang aman dan terlindungi.
                  </p>
                  <p>
                    Sistem secara otomatis mengunci akun Zoom yang sedang dipakai konseling aktif, sehingga tautan ruang temu tidak akan tertukar antar pasien yang berbeda jadwal.
                  </p>
                </CardContent>

                <CardFooter className="pt-3.5 px-6 pb-3.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Proteksi Ruang Pertemuan:</span>
                  <span className="text-foreground font-medium">Kunci Otomatis Aktif</span>
                </CardFooter>
              </Card>
            </div>

            {/* Akses Cepat ke Pengaturan Zoom */}
            <Card className="border border-border/80 shadow-xs">
              <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground">
                    Pengaturan Akun Zoom
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Kelola akun Zoom Pro yang terhubung, uji koneksi, dan lihat jadwal ruang temu yang sedang aktif.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="text-xs shrink-0"
                >
                  <Link href="/admin/zoom-settings">
                    <span>Buka Pengaturan Zoom</span>
                    <ExternalLink data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
