"use client"

import * as React from "react"
import Link from "next/link"
import {
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Lock,
  Loader2,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Video,
  CreditCard,
  Building2,
  Receipt,
  Users,
  Timer,
  HeartHandshake,
  HelpCircle,
  Sparkles,
  Info,
} from "lucide-react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  getPlatformSettingsAction,
  updatePlatformSettingsAction,
} from "./actions"
import type { PlatformSettingsData } from "@/lib/settings/platform"

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSuperadmin, setIsSuperadmin] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("operations")
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Form State
  const [formData, setFormData] = React.useState<PlatformSettingsData>({
    bookingCutoffHours: 4,
    rescheduleCutoffHours: 4,
    paymentHoldMinutes: 15,
    maxSlotQuota: 10,
    minCounselorWeeklySlots: 10,
    noShowTimeoutMinutes: 30,
    basePrice: "150000",
    counselorExtendFeePer30Min: "35000",
    psychologistExtendFeePer30Min: "50000",
    isManualPaymentEnabled: true,
    manualPaymentInstructions:
      "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.",
    isScreeningRequired: false,
  })

  // Load settings on mount
  React.useEffect(() => {
    async function loadSettings() {
      setIsLoading(true)
      try {
        const res = await getPlatformSettingsAction()
        if (res.success && res.settings) {
          setFormData(res.settings)
          setIsSuperadmin(Boolean(res.isSuperadmin))
        }
      } catch {
        // Fallback default
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperadmin) {
      setFeedback({
        type: "error",
        message:
          "Akses ditolak: Hanya peran Superadmin yang berwenang menyimpan perubahan parameter sistem.",
      })
      return
    }

    setIsSaving(true)
    setFeedback(null)
    try {
      const res = await updatePlatformSettingsAction({
        bookingCutoffHours: Number(formData.bookingCutoffHours),
        rescheduleCutoffHours: Number(formData.rescheduleCutoffHours),
        paymentHoldMinutes: Number(formData.paymentHoldMinutes),
        maxSlotQuota: Number(formData.maxSlotQuota),
        minCounselorWeeklySlots: Number(formData.minCounselorWeeklySlots),
        noShowTimeoutMinutes: Number(formData.noShowTimeoutMinutes),
        basePrice: String(formData.basePrice),
        counselorExtendFeePer30Min: String(formData.counselorExtendFeePer30Min),
        psychologistExtendFeePer30Min: String(formData.psychologistExtendFeePer30Min),
        isManualPaymentEnabled: formData.isManualPaymentEnabled,
        manualPaymentInstructions: formData.manualPaymentInstructions,
        isScreeningRequired: formData.isScreeningRequired,
      })

      if (res.success && res.settings) {
        setFormData(res.settings)
        setFeedback({
          type: "success",
          message:
            res.message ||
            "Pengaturan operasional berhasil diperbarui dan diterapkan ke seluruh sistem.",
        })
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menyimpan perubahan pengaturan sistem.",
        })
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan pengaturan."
      setFeedback({
        type: "error",
        message: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatRupiah = (val: string | number) => {
    const num = Number(val) || 0
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <TooltipProvider delayDuration={150}>
      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16 font-sans"
      >
        {/* Header Portal Admin / Superadmin */}
        <AdminPageHeader
          title="Pengaturan Sistem & Operasional"
          description="Pusat kendali parameter bisnis real-time: cutoff H-4 jam, kuota sesi, tarif extend, dan kanal pembayaran transfer manual."
          icon={Sliders}
          badge={
            isLoading
              ? "Memuat..."
              : isSuperadmin
                ? "Superadmin: Akses Penuh"
                : "Admin: Mode Tinjau"
          }
          badgeVariant={isSuperadmin ? "default" : "secondary"}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs h-8"
              >
                <Link href="/admin/zoom">
                  <Video data-icon="inline-start" />
                  <span>4 Akun Zoom Pro</span>
                </Link>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || isSaving || !isSuperadmin}
                className="text-xs h-8 font-medium shadow-xs"
              >
                {isSaving ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                <span>Simpan Perubahan</span>
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
                    ? "Pembaruan Berhasil Disimpan"
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
                ✕
              </Button>
            </div>
          </Alert>
        )}

        {/* Banner Hak Akses Superadmin */}
        {!isLoading && (
          <Alert
            variant="default"
            className={`border ${
              isSuperadmin
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/40 border-border/80"
            }`}
          >
            {isSuperadmin ? (
              <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="size-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex flex-col gap-1 min-w-0">
              <AlertTitle className="font-semibold text-xs">
                {isSuperadmin
                  ? "Hak Akses Superadmin Dikonfirmasi"
                  : "Perhatian: Mode Hanya Baca (Role: Admin)"}
              </AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
                {isSuperadmin
                  ? "Anda memiliki hak istimewa penuh untuk mengatur parameter sistem, batas toleransi, tarif perpanjangan sesi, dan rekening transfer klinik."
                  : "Halaman ini dalam mode tinjau. Hanya akun dengan peran Superadmin yang dapat menyimpan perubahan konfigurasi ke database produksi."}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Kartu Ringkasan Metrik Operasional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <AdminMetricCard
            title="Cutoff Pemesanan"
            value={isLoading ? "..." : `H-${formData.bookingCutoffHours} Jam`}
            isLoading={isLoading}
            status="default"
            icon={Clock}
            trendLabel="Batas minimal booking sebelum sesi dimulai"
          />
          <AdminMetricCard
            title="Kunci Jadwal"
            value={isLoading ? "..." : `${formData.paymentHoldMinutes} Menit`}
            isLoading={isLoading}
            status="default"
            icon={Timer}
            trendLabel="Slot diamankan saat klien checkout"
          />
          <AdminMetricCard
            title="Kapasitas Slot"
            value={isLoading ? "..." : `${formData.maxSlotQuota} Sesi`}
            isLoading={isLoading}
            status="neutral"
            icon={Users}
            trendLabel="Maksimal sesi serentak per slot waktu"
          />
          <AdminMetricCard
            title="Tarif Extend Sebaya / Psikolog"
            value={
              isLoading
                ? "..."
                : `${formatRupiah(formData.counselorExtendFeePer30Min)} / ${formatRupiah(formData.psychologistExtendFeePer30Min)}`
            }
            isLoading={isLoading}
            status="success"
            icon={CreditCard}
            trendLabel="Biaya perpanjangan sesi per 30 menit"
          />
        </div>

        {/* Tab Konfigurasi Sistem */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col gap-6"
        >
          <TabsList className="w-full sm:w-auto self-start grid grid-cols-2 sm:inline-flex h-9 p-1 bg-muted/60 border border-border/40 rounded-lg">
            <TabsTrigger
              value="operations"
              className="text-xs font-medium gap-2 px-3 py-1.5"
            >
              <Clock data-icon="inline-start" />
              <span>Parameter Operasional</span>
            </TabsTrigger>
            <TabsTrigger
              value="fees"
              className="text-xs font-medium gap-2 px-3 py-1.5"
            >
              <CreditCard data-icon="inline-start" />
              <span>Tarif &amp; Extend Sesi</span>
            </TabsTrigger>
            <TabsTrigger
              value="manual-transfer"
              className="text-xs font-medium gap-2 px-3 py-1.5"
            >
              <Building2 data-icon="inline-start" />
              <span>Transfer Bank Manual</span>
            </TabsTrigger>
            <TabsTrigger
              value="screening"
              className="text-xs font-medium gap-2 px-3 py-1.5"
            >
              <HeartHandshake data-icon="inline-start" />
              <span>Kuesioner SRQ-20</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PARAMETER OPERASIONAL */}
          <TabsContent value="operations" className="flex flex-col gap-6 m-0 outline-none">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pt-6 px-6 pb-5 border-b border-border/60">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Parameter Jadwal &amp; Batas Waktu Operasional
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px]">
                      Master SOP v1.0
                    </Badge>
                  </div>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    Aturan batasan waktu pemesanan, toleransi reschedule, penguncian checkout, dan kuota slot konseling harian.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-6 px-6 pb-6 flex flex-col gap-6">
                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Cutoff Pemesanan Baru */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="bookingCutoffHours" className="text-xs font-semibold">
                        Cutoff Pemesanan Baru (H-X Jam)
                      </FieldLabel>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Default H-4
                      </Badge>
                    </div>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Batas waktu minimal sebelum sesi dimulai di mana calon klien masih boleh memesan jadwal konseling.
                    </FieldDescription>
                    <Input
                      id="bookingCutoffHours"
                      type="number"
                      min={1}
                      max={72}
                      disabled={isLoading || isSaving || !isSuperadmin}
                      value={formData.bookingCutoffHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bookingCutoffHours: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-sm font-medium"
                    />
                  </Field>

                  {/* 2. Cutoff Reschedule */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="rescheduleCutoffHours" className="text-xs font-semibold">
                        Cutoff Reschedule Pasien (H-X Jam)
                      </FieldLabel>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Default H-4
                      </Badge>
                    </div>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Batas waktu maksimal klien dapat mengajukan penundaan atau pergantian jadwal secara mandiri.
                    </FieldDescription>
                    <Input
                      id="rescheduleCutoffHours"
                      type="number"
                      min={1}
                      max={72}
                      disabled={isLoading || isSaving || !isSuperadmin}
                      value={formData.rescheduleCutoffHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rescheduleCutoffHours: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-sm font-medium"
                    />
                  </Field>

                  {/* 3. Durasi Kunci Jadwal */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="paymentHoldMinutes" className="text-xs font-semibold">
                        Durasi Kunci Jadwal Pembayaran (Menit)
                      </FieldLabel>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        15–30 Menit
                      </Badge>
                    </div>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Lama waktu slot dikunci sementara saat klien memilih pembayaran, sebelum otomatis dilepas jika tidak dibayar.
                    </FieldDescription>
                    <Input
                      id="paymentHoldMinutes"
                      type="number"
                      min={5}
                      max={60}
                      disabled={isLoading || isSaving || !isSuperadmin}
                      value={formData.paymentHoldMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentHoldMinutes: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-sm font-medium"
                    />
                  </Field>

                  {/* 4. Kuota Maksimal per Slot */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="maxSlotQuota" className="text-xs font-semibold">
                        Kuota Maksimal Konseling per Slot
                      </FieldLabel>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Default 10 Sesi
                      </Badge>
                    </div>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Jumlah batas maksimal sesi yang dapat berlangsung bersamaan di satu jam slot waktu yang sama.
                    </FieldDescription>
                    <Input
                      id="maxSlotQuota"
                      type="number"
                      min={1}
                      max={50}
                      disabled={isLoading || isSaving || !isSuperadmin}
                      value={formData.maxSlotQuota}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxSlotQuota: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-sm font-medium"
                    />
                  </Field>

                  {/* 5. Batas Toleransi No-Show */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="noShowTimeoutMinutes" className="text-xs font-semibold">
                        Batas Toleransi Hadir / No-Show (Menit)
                      </FieldLabel>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Default 30 Menit
                      </Badge>
                    </div>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Menit keterlambatan maksimal pasien di ruang temu Zoom sebelum ditandai status No-Show dan sesi ditutup.
                    </FieldDescription>
                    <Input
                      id="noShowTimeoutMinutes"
                      type="number"
                      min={5}
                      max={120}
                      disabled={isLoading || isSaving || !isSuperadmin}
                      value={formData.noShowTimeoutMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          noShowTimeoutMinutes: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-sm font-medium"
                    />
                  </Field>

                  {/* 6. Target Minimal Slot Mingguan Konselor */}
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="minCounselorWeeklySlots" className="text-xs font-semibold">
                        Target Minimal Sesi Konselor per Minggu
                      </FieldLabel>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        Default 10 Sesi
                      </Badge>
                    </div>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Komitmen kuota jadwal mingguan yang wajib dibuka oleh mitra konselor aktif sesuai Master SOP.
                    </FieldDescription>
                    <Input
                      id="minCounselorWeeklySlots"
                      type="number"
                      min={1}
                      max={50}
                      disabled={isLoading || isSaving || !isSuperadmin}
                      value={formData.minCounselorWeeklySlots}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minCounselorWeeklySlots: parseInt(e.target.value) || 0,
                        })
                      }
                      className="text-sm font-medium"
                    />
                  </Field>
                </FieldGroup>
              </CardContent>

              <CardFooter className="pt-4 px-6 pb-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>Perubahan parameter langsung disinkronkan ke PostgreSQL.</span>
                <span className="font-medium text-foreground">Status Sinkronisasi Aktif</span>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* TAB 2: TARIF & EXTEND SESI */}
          <TabsContent value="fees" className="flex flex-col gap-6 m-0 outline-none">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pt-6 px-6 pb-5 border-b border-border/60">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Tarif Dasar &amp; Biaya Perpanjangan Sesi (Extend Fees)
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px]">
                      Dinamis / Tanpa Redeploy
                    </Badge>
                  </div>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    Atur tarif dasar konseling serta tarif tambahan per 30 menit ketika konselor dan klien menyetujui extend waktu.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-6 px-6 pb-6 flex flex-col gap-6">
                {/* Tarif Dasar Platform */}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="basePrice" className="text-xs font-semibold">
                      Tarif Dasar Konseling Standar (Rp)
                    </FieldLabel>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Harga patokan dasar untuk sesi konseling telekonsultasi 90 menit.
                    </FieldDescription>
                    <Input
                      id="basePrice"
                      type="number"
                      min={0}
                      disabled={isLoading || isSaving || !isSuperadmin}
                      value={formData.basePrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          basePrice: e.target.value,
                        })
                      }
                      className="text-sm font-medium max-w-sm"
                    />
                  </Field>
                </FieldGroup>

                <Separator />

                {/* Section Dedicated: Extend Session Fees */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      Tarif Perpanjangan Sesi per 30 Menit (Dedicated Section)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Biaya perpanjangan ini diterapkan secara otomatis saat konselor mengaktifkan tombol Extend di Floating Timer konseling.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Extend Fee Konselor Sebaya */}
                    <div className="p-5 rounded-lg border border-border/70 bg-muted/15 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Mitra Konselor Sebaya
                        </span>
                        <Badge variant="secondary" className="text-[11px]">
                          Default Rp 35.000
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Tarif tambahan per 30 menit perpanjangan sesi dengan konselor sebaya (lulusan S1 Psikologi).
                      </p>
                      <Field className="mt-1">
                        <FieldLabel htmlFor="counselorExtendFeePer30Min" className="text-xs font-medium">
                          Tarif Tambahan per 30 Menit (Rp)
                        </FieldLabel>
                        <Input
                          id="counselorExtendFeePer30Min"
                          type="number"
                          min={0}
                          disabled={isLoading || isSaving || !isSuperadmin}
                          value={formData.counselorExtendFeePer30Min}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              counselorExtendFeePer30Min: e.target.value,
                            })
                          }
                          className="text-sm font-medium bg-background"
                        />
                      </Field>
                    </div>

                    {/* Extend Fee Psikolog Klinis */}
                    <div className="p-5 rounded-lg border border-border/70 bg-muted/15 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          Psikolog Klinis Ber-STR/SIPP
                        </span>
                        <Badge variant="default" className="text-[11px]">
                          Default Rp 50.000
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Tarif tambahan per 30 menit perpanjangan sesi dengan Psikolog Klinis berizin praktik resmi.
                      </p>
                      <Field className="mt-1">
                        <FieldLabel htmlFor="psychologistExtendFeePer30Min" className="text-xs font-medium">
                          Tarif Tambahan per 30 Menit (Rp)
                        </FieldLabel>
                        <Input
                          id="psychologistExtendFeePer30Min"
                          type="number"
                          min={0}
                          disabled={isLoading || isSaving || !isSuperadmin}
                          value={formData.psychologistExtendFeePer30Min}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              psychologistExtendFeePer30Min: e.target.value,
                            })
                          }
                          className="text-sm font-medium bg-background"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <Alert className="bg-muted/30 border-border/70 text-muted-foreground text-xs">
                  <Info className="size-4 text-foreground shrink-0 mt-0.5" />
                  <AlertDescription className="text-xs leading-relaxed">
                    Sistem perpanjangan sesi Solulu sepenuhnya transparan. Klien akan menerima invoice perpanjangan di halaman sesi konseling dan dapat membayar melalui QRIS/Xendit maupun Transfer Bank Manual.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: TRANSFER BANK MANUAL */}
          <TabsContent value="manual-transfer" className="flex flex-col gap-6 m-0 outline-none">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pt-6 px-6 pb-5 border-b border-border/60">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Kanal Pembayaran Transfer Bank Manual
                    </CardTitle>
                    <Badge
                      variant={formData.isManualPaymentEnabled ? "default" : "secondary"}
                      className="text-[11px]"
                    >
                      {formData.isManualPaymentEnabled ? "Kanal Aktif" : "Dinonaktifkan"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    Kelola ketersediaan opsi pembayaran manual serta instruksi nomor rekening klinik bagi calon pasien.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-6 px-6 pb-6 flex flex-col gap-6">
                {/* Toggle Enable/Disable Transfer Manual */}
                <Field
                  orientation="horizontal"
                  className="p-5 rounded-lg border border-border/70 bg-muted/15 flex items-center justify-between gap-4"
                >
                  <FieldContent className="gap-1">
                    <FieldLabel htmlFor="isManualPaymentEnabled" className="text-sm font-medium text-foreground cursor-pointer">
                      Aktifkan Opsi Transfer Bank Manual
                    </FieldLabel>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Jika diaktifkan, klien dapat memilih opsi transfer bank manual dan mengunggah bukti bayar di formulir checkout.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="isManualPaymentEnabled"
                    checked={formData.isManualPaymentEnabled}
                    disabled={isLoading || isSaving || !isSuperadmin}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isManualPaymentEnabled: checked,
                      })
                    }
                  />
                </Field>

                {/* Textarea Instruksi Rekening */}
                <Field>
                  <FieldLabel htmlFor="manualPaymentInstructions" className="text-xs font-semibold">
                    Instruksi Transfer &amp; Detail Rekening Klinik
                  </FieldLabel>
                  <FieldDescription className="text-xs text-muted-foreground">
                    Teks instruksi yang tampil pada layar checkout klien (cantumkan bank, nomor rekening, atas nama, dan petunjuk berita transfer).
                  </FieldDescription>
                  <Textarea
                    id="manualPaymentInstructions"
                    rows={4}
                    disabled={isLoading || isSaving || !isSuperadmin}
                    value={formData.manualPaymentInstructions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manualPaymentInstructions: e.target.value,
                      })
                    }
                    className="text-sm font-medium leading-relaxed"
                  />
                </Field>

                <Alert className="bg-muted/30 border-border/70 text-muted-foreground text-xs">
                  <Receipt className="size-4 text-foreground shrink-0 mt-0.5" />
                  <AlertDescription className="text-xs leading-relaxed">
                    Setiap pembayaran transfer manual yang diunggah klien akan masuk ke antrean verifikasi di menu <strong>Verifikasi Transfer Manual</strong> sebelum tautan sesi Zoom diterbitkan.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: KUESIONER SRQ-20 */}
          <TabsContent value="screening" className="flex flex-col gap-6 m-0 outline-none">
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pt-6 px-6 pb-5 border-b border-border/60">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-semibold text-foreground">
                      Kebijakan Pengisian Kuesioner SRQ-20
                    </CardTitle>
                    <Badge
                      variant={formData.isScreeningRequired ? "default" : "secondary"}
                      className="text-[11px]"
                    >
                      {formData.isScreeningRequired ? "Skrining Wajib" : "Skrining Opsional"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    Tentukan apakah calon pasien wajib menyelesaikan 20 pertanyaan kuesioner kesehatan mental WHO sebelum booking.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="pt-6 px-6 pb-6 flex flex-col gap-6">
                <Field
                  orientation="horizontal"
                  className="p-5 rounded-lg border border-border/70 bg-muted/15 flex items-center justify-between gap-4"
                >
                  <FieldContent className="gap-1">
                    <FieldLabel htmlFor="isScreeningRequired" className="text-sm font-medium text-foreground cursor-pointer">
                      Wajibkan Pengisian Kuesioner Sebelum Pembayaran
                    </FieldLabel>
                    <FieldDescription className="text-xs text-muted-foreground">
                      Bila aktif, tombol pembayaran tidak dapat diklik sebelum 20 butir kuesioner dijawab secara lengkap.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="isScreeningRequired"
                    checked={formData.isScreeningRequired}
                    disabled={isLoading || isSaving || !isSuperadmin}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        isScreeningRequired: checked,
                      })
                    }
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-5 rounded-lg border transition-all flex flex-col gap-2.5 ${
                      !formData.isScreeningRequired
                        ? "bg-card border-foreground/30 shadow-xs ring-1 ring-foreground/5"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    <span className="font-semibold text-foreground text-sm">
                      Mode Fleksibel (Boleh Dilewati)
                    </span>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Pasien diajak mengisi kuesioner saat memilih jadwal, namun tetap diberi opsi untuk langsung lanjut jika membutuhkan bantuan darurat.
                    </p>
                  </div>

                  <div
                    className={`p-5 rounded-lg border transition-all flex flex-col gap-2.5 ${
                      formData.isScreeningRequired
                        ? "bg-card border-foreground/30 shadow-xs ring-1 ring-foreground/5"
                        : "bg-muted/10 border-border/60 opacity-60"
                    }`}
                  >
                    <span className="font-semibold text-foreground text-sm">
                      Mode Terarah (Wajib Diisi)
                    </span>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      Pasien wajib menjawab seluruh pertanyaan sebelum menuju pembayaran. Memastikan data awal klinis siap sebelum telekonseling dimulai.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </TooltipProvider>
  )
}
