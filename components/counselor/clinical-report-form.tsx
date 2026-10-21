"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  ShieldAlert,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Download,
  File,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Timer,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  submitSessionReportAction,
  getPresignedUploadUrlAction,
  getAttachmentDownloadUrlAction,
} from "@/app/counselor/actions"
import type { SessionReportDetailView } from "@/lib/counselor/types"
import { cn } from "@/lib/utils"

export interface ClinicalReportFormProps {
  initialData: SessionReportDetailView
  isModal?: boolean
  onSuccess?: (reportId: string) => void
  onCancel?: () => void
}

const COMMON_ISSUES = [
  "Konsultasi Emosional & Stres",
  "Kecemasan & Overthinking",
  "Quarter-life Crisis & Karir",
  "Konflik Relasi Interpersonal",
  "Gejala Depresi & Mood",
  "Burnout & Kelelahan Kerja",
  "Regulasi Emosi & Manajemen Marah",
  "Trauma & Kedukaan",
]

function extractTimesFromTimeRange(timeRange?: string, defaultStart = "14:00", defaultEnd = "15:30") {
  if (!timeRange) return { start: defaultStart, end: defaultEnd }
  const matches = timeRange.match(/(\d{1,2})[.:](\d{2})/g)
  if (matches && matches.length >= 2) {
    const start = matches[0].replace(".", ":").padStart(5, "0")
    const end = matches[1].replace(".", ":").padStart(5, "0")
    return { start, end }
  }
  return { start: defaultStart, end: defaultEnd }
}

export function ClinicalReportForm({
  initialData,
  isModal = false,
  onSuccess,
  onCancel,
}: ClinicalReportFormProps) {
  const router = useRouter()
  const { booking } = initialData

  const [attendanceStatus, setAttendanceStatus] = React.useState<"attended" | "no_show">("attended")
  const [mainIssue, setMainIssue] = React.useState(initialData.mainIssue || "Konsultasi Emosional & Stres")
  const [summary, setSummary] = React.useState(initialData.summary || "")
  const [actionPlan, setActionPlan] = React.useState(initialData.actionPlan || "")
  const [internalNotes, setInternalNotes] = React.useState(initialData.internalNotes || "")
  const [followUpRecommendation, setFollowUpRecommendation] = React.useState(
    initialData.followUpRecommendation || ""
  )
  const [attachments, setAttachments] = React.useState<string[]>(
    initialData.attachmentR2Keys || []
  )

  const hasRecordedTimer = Boolean(initialData.timerStartedAt && initialData.actualDurationMinutes)
  const defaultTimes = React.useMemo(
    () => extractTimesFromTimeRange(booking.timeRange, booking.startTime, booking.endTime),
    [booking.timeRange, booking.startTime, booking.endTime]
  )

  const [manualStartTime, setManualStartTime] = React.useState<string>(() => {
    if (initialData.timerStartedAt) {
      return new Date(initialData.timerStartedAt)
        .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
        .replace(".", ":")
    }
    return defaultTimes.start
  })

  const [manualEndTime, setManualEndTime] = React.useState<string>(() => {
    if (initialData.timerStoppedAt) {
      return new Date(initialData.timerStoppedAt)
        .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
        .replace(".", ":")
    }
    return defaultTimes.end
  })

  const calculatedDurationMinutes = React.useMemo(() => {
    if (hasRecordedTimer && typeof initialData.actualDurationMinutes === "number") {
      return initialData.actualDurationMinutes
    }
    const [startH, startM] = manualStartTime.split(":").map(Number)
    const [endH, endM] = manualEndTime.split(":").map(Number)
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 90
    let diff = (endH * 60 + endM) - (startH * 60 + startM)
    if (diff <= 0) diff += 24 * 60
    return diff
  }, [hasRecordedTimer, initialData.actualDurationMinutes, manualStartTime, manualEndTime])

  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({})

  const mainIssueTrimmed = mainIssue.trim()
  const summaryChars = summary.trim().length
  const actionPlanChars = actionPlan.trim().length

  const isMainIssueValid = mainIssueTrimmed.length >= 3
  const isSummaryValid = summaryChars >= 20
  const isActionPlanValid = actionPlanChars === 0 || actionPlanChars >= 20
  const isDurationValid = calculatedDurationMinutes >= 15 && calculatedDurationMinutes <= 180

  const canSubmit =
    isMainIssueValid &&
    isSummaryValid &&
    isActionPlanValid &&
    isDurationValid &&
    !submitting

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    // 10MB limit per clinical attachment
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran dokumen maksimal 10 MB.")
      toast.error("Ukuran file melebihi batas 10 MB.")
      return
    }

    setUploading(true)
    setUploadError(null)

    try {
      const presignedRes = await getPresignedUploadUrlAction({
        type: "report_attachment",
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        bookingId: booking.id,
      })

      if (!presignedRes.success || !presignedRes.data) {
        throw new Error(presignedRes.error || "Gagal mendapatkan izin upload R2.")
      }

      const { uploadUrl, key } = presignedRes.data

      // Upload directly to Cloudflare R2 via presigned PUT
      const uploadHttp = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      })

      if (!uploadHttp.ok) {
        throw new Error(`Upload langsung ke storage gagal (Status: ${uploadHttp.status})`)
      }

      setAttachments((prev) => [...prev, key])
      toast.success("Foto bukti kehadiran berhasil diunggah ke storage privat R2.")
    } catch (err: any) {
      const errMsg = err.message || "Gagal mengunggah file lampiran."
      setUploadError(errMsg)
      toast.error(errMsg)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleRemoveAttachment = (keyToRemove: string) => {
    setAttachments((prev) => prev.filter((k) => k !== keyToRemove))
    toast.info("Foto bukti dihapus dari daftar lampiran.")
  }

  const handleDownloadAttachment = async (key: string) => {
    try {
      const res = await getAttachmentDownloadUrlAction(key)
      if (res.success && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, "_blank", "noopener,noreferrer")
      } else {
        toast.error(res.error || "Gagal membuka file lampiran.")
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses tautan unduhan.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setFieldErrors({})

    try {
      let submitTimerStartedAt = initialData.timerStartedAt
      let submitTimerStoppedAt = initialData.timerStoppedAt

      if (!hasRecordedTimer && booking.date) {
        const [sH, sM] = manualStartTime.split(":")
        const [eH, eM] = manualEndTime.split(":")
        submitTimerStartedAt = new Date(`${booking.date}T${sH}:${sM}:00+07:00`).toISOString()
        submitTimerStoppedAt = new Date(`${booking.date}T${eH}:${eM}:00+07:00`).toISOString()
      }

      const res = await submitSessionReportAction({
        bookingId: booking.id,
        attendanceStatus,
        mainIssue: mainIssueTrimmed,
        summary: summary.trim(),
        actionPlan: actionPlan.trim() || null,
        internalNotes: internalNotes.trim() || null,
        followUpRecommendation: followUpRecommendation.trim() || null,
        attachmentR2Keys: attachments,
        actualDurationMinutes: calculatedDurationMinutes,
        timerStartedAt: submitTimerStartedAt || undefined,
        timerStoppedAt: submitTimerStoppedAt || undefined,
      })

      if (res.success && res.data) {
        toast.success(
          "Laporan sesi klinis berhasil disimpan. Status sesi telah ditandai Selesai.",
          {
            description: "Catatan internal terjaga rahasia medis dan booking telah bertransisi ke completed.",
          }
        )

        if (onSuccess) {
          onSuccess(res.data.reportId)
        } else {
          setTimeout(() => {
            router.push("/counselor/dashboard")
            router.refresh()
          }, 1200)
        }
      } else {
        toast.error(res.error || "Gagal menyimpan laporan sesi klinis.")
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        }
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan laporan sesi.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", !isModal && "max-w-4xl mx-auto pb-12")}>
      {/* Back button (standalone page only) */}
      {!isModal && (
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-2 text-xs -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Link href="/counselor/dashboard">
              <ArrowLeft className="size-3.5" data-icon="inline-start" />
              <span>Kembali ke Konsol Konselor</span>
            </Link>
          </Button>

          <Badge
            variant="outline"
            className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 gap-1.5 py-1"
          >
            <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
            <span>Privacy Guard & Zero-Leak Aktif</span>
          </Badge>
        </div>
      )}

      {/* Patient & Session Context Card */}
      <Card className="border border-border/80 shadow-xs bg-muted/20">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                {booking.patientName.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base sm:text-lg tracking-tight text-foreground truncate">
                  {booking.patientName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {booking.patientEmail} • {booking.patientPhone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-background text-foreground gap-1.5 py-1">
                <Clock className="size-3.5 text-primary" />
                <span>{booking.timeRange}</span>
              </Badge>
              <Badge variant="outline" className="text-xs bg-background text-foreground gap-1.5 py-1">
                <Calendar className="size-3.5 text-primary" />
                <span>{booking.date}</span>
              </Badge>
            </div>
          </div>

          {/* Clinical Intake Notes & Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-background border border-border/70">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Hasil Skrining Klinis Pasien (SRQ-20)
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-muted font-medium text-foreground">
                  Skor: <strong>{booking.srqScore !== null ? `${booking.srqScore}/20` : "Tidak ada"}</strong>
                </span>
                {booking.hasSuicidalThoughts && (
                  <span className="px-2 py-0.5 rounded bg-destructive/15 text-destructive font-semibold flex items-center gap-1">
                    <ShieldAlert className="size-3" />
                    Indikasi Ide Bunuh Diri (Q-17)
                  </span>
                )}
                {booking.bypassedRecommendation && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">
                    Bypass Rekomendasi
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-background border border-border/70">
              <span className="font-semibold text-foreground">Catatan Awal Pasien:</span>
              <p className="text-muted-foreground italic leading-relaxed line-clamp-3">
                &ldquo;{booking.initialNotes || "Pasien tidak mencantumkan catatan awal keluhan."}&rdquo;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Report Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-4 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg font-bold tracking-tight">
                    Formulir Laporan Sesi Klinis
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20 gap-1">
                    <FileText className="size-3" />
                    Standar Master SOP
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Isi ringkasan hasil konseling dan pisahkan antara catatan publik klien dengan catatan rahasia internal.
                </CardDescription>
              </div>

              {isModal && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 h-8 text-muted-foreground hover:text-foreground self-start sm:self-auto"
                >
                  <Link href={`/counselor/sessions/${booking.id}/report`} target="_blank">
                    <ExternalLink className="size-3.5" data-icon="inline-start" />
                    <span>Buka Halaman Penuh</span>
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <FieldGroup className="flex flex-col gap-6">
              {/* Field 0: Status Kehadiran Sesi (Attendance Status) */}
              <div className="flex flex-col gap-2.5 p-4 rounded-xl border border-border/80 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Status Kehadiran Pasien:
                  </span>
                  <Badge variant={attendanceStatus === "attended" ? "outline" : "secondary"} className="text-[11px]">
                    {attendanceStatus === "attended" ? "Sesi Terlaksana" : "Klien Tidak Hadir (No-Show)"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus("attended")}
                    className={cn(
                      "p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer",
                      attendanceStatus === "attended"
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "size-4 mt-0.5 shrink-0",
                        attendanceStatus === "attended" ? "text-primary" : "text-muted-foreground/40"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">Hadir Penuh</span>
                      <span className="text-[11px] text-muted-foreground">Klien hadir dan sesi telekonseling berjalan tuntas.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceStatus("no_show")
                      if (!summary.trim() || summary.includes("Klien tidak hadir")) {
                        setSummary("Klien tidak hadir dalam panggilan Zoom selama durasi sesi 90 menit (No-Show). Konselor telah bersiaga penuh di ruang tunggu.")
                      }
                      if (!actionPlan.trim() || actionPlan.includes("Status sesi dicatat")) {
                        setActionPlan("Status sesi dicatat sebagai No-Show. Hak honor kesiagaan konselor terlindungi. Menunggu konfirmasi admin / koordinasi reschedule bila ada alasan darurat.")
                      }
                    }}
                    className={cn(
                      "p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer",
                      attendanceStatus === "no_show"
                        ? "border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/30"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <AlertCircle
                      className={cn(
                        "size-4 mt-0.5 shrink-0",
                        attendanceStatus === "no_show" ? "text-amber-600" : "text-muted-foreground/40"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">Klien Tidak Hadir (No-Show)</span>
                      <span className="text-[11px] text-muted-foreground">Konselor bersiaga namun klien tidak memasuki Zoom sampai jam berakhir.</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Field Timer: Log Durasi & Waktu Sesi Klinis */}
              {hasRecordedTimer ? (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Timer className="size-4 text-emerald-600" />
                      <span className="text-xs font-semibold text-foreground">
                        Durasi Riil Sesi (Floating Timer Terverifikasi)
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 font-medium"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>Terekam Otomatis</span>
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="flex flex-col p-2.5 rounded-lg bg-background border border-border/70">
                      <span className="text-[11px] text-muted-foreground">Waktu Mulai</span>
                      <span className="text-sm font-bold text-foreground font-mono">
                        {initialData.timerStartedAt
                          ? new Date(initialData.timerStartedAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }) + " WIB"
                          : "-"}
                      </span>
                    </div>
                    <div className="flex flex-col p-2.5 rounded-lg bg-background border border-border/70">
                      <span className="text-[11px] text-muted-foreground">Waktu Selesai</span>
                      <span className="text-sm font-bold text-foreground font-mono">
                        {initialData.timerStoppedAt
                          ? new Date(initialData.timerStoppedAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }) + " WIB"
                          : "-"}
                      </span>
                    </div>
                    <div className="flex flex-col p-2.5 rounded-lg bg-background border border-border/70">
                      <span className="text-[11px] text-muted-foreground">Total Durasi Riil</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {calculatedDurationMinutes} Menit {calculatedDurationMinutes > 90 ? "(Perpanjangan)" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-4 text-amber-600" />
                      <span className="text-xs font-semibold text-foreground">
                        Waktu & Durasi Sesi (Konfirmasi Manual)
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[11px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1 font-medium"
                    >
                      <span>Input Manual Diperlukan</span>
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Log Floating Timer tidak terdeteksi untuk sesi ini. Harap konfirmasi jam mulai dan selesai sesi untuk pencatatan laporan klinis dan validasi payroll.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <Field>
                      <FieldLabel htmlFor="manual-start-time" className="text-xs font-medium">
                        Jam Mulai
                      </FieldLabel>
                      <Input
                        id="manual-start-time"
                        type="time"
                        value={manualStartTime}
                        onChange={(e) => setManualStartTime(e.target.value)}
                        className="h-9 font-mono text-xs"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="manual-end-time" className="text-xs font-medium">
                        Jam Selesai
                      </FieldLabel>
                      <Input
                        id="manual-end-time"
                        type="time"
                        value={manualEndTime}
                        onChange={(e) => setManualEndTime(e.target.value)}
                        className="h-9 font-mono text-xs"
                      />
                    </Field>
                    <div className="flex flex-col justify-end">
                      <div className="p-2 rounded-lg bg-background border border-border/70 flex flex-col justify-center h-9">
                        <span className="text-[10px] text-muted-foreground leading-tight">Durasi Terhitung</span>
                        <span className="text-xs font-bold text-foreground font-mono leading-tight">
                          {calculatedDurationMinutes} Menit {calculatedDurationMinutes > 90 ? "(Extend)" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isDurationValid && (
                    <span className="text-[11px] text-destructive font-medium">
                      Durasi sesi tidak valid (minimal 15 menit, maksimal 180 menit).
                    </span>
                  )}
                </div>
              )}

              {/* Field 1: Permasalahan Utama (Main Issue) - MANDATORY */}
              <Field data-invalid={!!fieldErrors.mainIssue}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FieldLabel htmlFor="report-main-issue" className="text-sm font-semibold text-foreground">
                      Permasalahan Utama (*Main Issue*) <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1">
                      <Eye className="size-2.5" />
                      Tampil di Laporan Klien
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Wajib diisi</span>
                </div>

                <Input
                  id="report-main-issue"
                  name="mainIssue"
                  placeholder="Contoh: Regulasi Emosi & Stres Akademik"
                  value={mainIssue}
                  onChange={(e) => setMainIssue(e.target.value)}
                  className="text-sm"
                  aria-invalid={!!fieldErrors.mainIssue}
                  required
                  autoComplete="off"
                />

                {/* Quick Topic Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
                    <Sparkles className="size-3 text-primary" />
                    Pilihan cepat:
                  </span>
                  {COMMON_ISSUES.map((issue) => (
                    <button
                      key={issue}
                      type="button"
                      onClick={() => setMainIssue(issue)}
                      className={cn(
                        "px-2 py-0.5 text-[11px] rounded-md border transition-colors cursor-pointer",
                        mainIssue === issue
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {issue}
                    </button>
                  ))}
                </div>

                {fieldErrors.mainIssue ? (
                  <FieldError className="text-xs">{fieldErrors.mainIssue[0]}</FieldError>
                ) : (
                  <FieldDescription className="text-xs">
                    Fokus tema klinis utama yang menjadi rujukan evaluasi. Field ini akan tercantum jelas di lembar laporan resmi klien.
                  </FieldDescription>
                )}
              </Field>

              {/* Field 2: Ringkasan Dinamika Sesi - MANDATORY */}
              <Field data-invalid={!!fieldErrors.summary}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FieldLabel htmlFor="report-summary" className="text-sm font-semibold text-foreground">
                      Ringkasan Dinamika Sesi <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1">
                      <Eye className="size-2.5" />
                      Tampil di Laporan Klien
                    </Badge>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-mono tabular-nums",
                      isSummaryValid
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    {summaryChars} / 20 karakter min {isSummaryValid && "✓"}
                  </span>
                </div>

                <Textarea
                  id="report-summary"
                  name="summary"
                  rows={5}
                  placeholder="Tuliskan dinamika konseling, eksplorasi masalah utama, kondisi afek pasien, dan tema yang dibahas..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="resize-y text-sm"
                  aria-invalid={!!fieldErrors.summary}
                  required
                  autoComplete="off"
                />

                {fieldErrors.summary ? (
                  <FieldError className="text-xs">{fieldErrors.summary[0]}</FieldError>
                ) : (
                  <FieldDescription className="text-xs">
                    Uraikan dinamika psikologis, tema pembahasan, dan kondisi afek klien selama sesi konseling.
                  </FieldDescription>
                )}
              </Field>

              {/* Field 3: Saran / Rekomendasi Tindak Lanjut - OPTIONAL */}
              <Field data-invalid={!!fieldErrors.actionPlan}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FieldLabel htmlFor="report-action-plan" className="text-sm font-semibold text-foreground">
                      Saran / Rekomendasi Tindak Lanjut (Opsional)
                    </FieldLabel>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1">
                      <Eye className="size-2.5" />
                      Tampil di Laporan Klien
                    </Badge>
                  </div>
                  {actionPlanChars > 0 && (
                    <span
                      className={cn(
                        "text-xs font-mono tabular-nums",
                        isActionPlanValid
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-destructive"
                      )}
                    >
                      {actionPlanChars} / 20 karakter min {isActionPlanValid && "✓"}
                    </span>
                  )}
                </div>

                <Textarea
                  id="report-action-plan"
                  name="actionPlan"
                  rows={4}
                  placeholder="Rencana aksi mandiri klien, latihan teknik coping (journaling, relaksasi pernapasan 4-7-8, grounding), atau tugas rumah..."
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="resize-y text-sm"
                  aria-invalid={!!fieldErrors.actionPlan}
                  autoComplete="off"
                />

                {fieldErrors.actionPlan ? (
                  <FieldError className="text-xs">{fieldErrors.actionPlan[0]}</FieldError>
                ) : (
                  <FieldDescription className="text-xs">
                    Langkah nyata atau latihan psikologis yang disepakati untuk dipraktikkan klien di kesehariannya.
                  </FieldDescription>
                )}
              </Field>

              {/* Field 4: Catatan Internal Konselor - STRICTLY CONFIDENTIAL */}
              <Field className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20">
                <div className="flex items-center justify-between gap-2 flex-wrap pb-2">
                  <div className="flex items-center gap-2">
                    <FieldLabel htmlFor="report-internal-notes" className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Lock className="size-3.5 text-purple-600 dark:text-purple-400" />
                      Catatan Internal Konselor
                    </FieldLabel>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30 font-semibold gap-1"
                    >
                      <EyeOff className="size-2.5" />
                      RAHASIA MEDIS — Disembunyikan dari Klien & Admin
                    </Badge>
                  </div>
                  <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">Privacy Guard Terproteksi</span>
                </div>

                <Textarea
                  id="report-internal-notes"
                  name="internalNotes"
                  rows={4}
                  placeholder="Tuliskan catatan observasi klinis mendalam, hipotesis diagnostik, dinamika transferensi, atau hal sensitif lainnya..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="resize-y text-sm bg-background border-purple-500/25 focus-visible:ring-purple-500"
                  autoComplete="off"
                />

                <FieldDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
                  <strong className="text-foreground">Proteksi Privasi Ketat:</strong> Catatan ini <span className="underline decoration-purple-500 font-medium">HANYA dapat diakses oleh Anda</span> sebagai konselor yang menangani klien. Sistem Privacy Guard secara ketat mengecualikan catatan ini dari tampilan Klien, unduhan PDF klien, dan payload Admin.
                </FieldDescription>
              </Field>

              {/* Field 5: Rekomendasi Rujukan / Jadwal Berikutnya - OPTIONAL */}
              <Field>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel htmlFor="report-follow-up" className="text-sm font-semibold text-foreground">
                    Rekomendasi Rujukan / Jadwal Berikutnya (Opsional)
                  </FieldLabel>
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1">
                    <Eye className="size-2.5" />
                    Tampil di Laporan Klien
                  </Badge>
                </div>

                <Input
                  id="report-follow-up"
                  name="followUpRecommendation"
                  placeholder="Contoh: Disarankan sesi lanjutan 1 minggu lagi, atau konsultasi psikiatri bila diperlukan evaluasi medikasi."
                  value={followUpRecommendation}
                  onChange={(e) => setFollowUpRecommendation(e.target.value)}
                  className="text-sm"
                  autoComplete="off"
                />
                <FieldDescription className="text-xs">
                  Dapat berupa anjuran frekuensi pertemuan berikutnya atau rujukan profesional bila berada di luar cakupan konseling.
                </FieldDescription>
              </Field>

              {/* Field 6: Foto Dokumentasi Bukti Kehadiran Sesi (R2 Private Bucket) */}
              <Field className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FieldLabel className="text-sm font-semibold text-foreground">
                      Dokumentasi Bukti Kehadiran Sesi (Foto / Screenshot Zoom)
                    </FieldLabel>
                    <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border gap-1">
                      <Lock className="size-2.5" />
                      Bukti Internal (Bukan untuk PDF Klien)
                    </Badge>
                  </div>
                </div>

                <FieldDescription className="text-xs">
                  Unggah tangkapan layar (screenshot) ruang Zoom sebagai bukti kehadiran internal klinik dan syarat verifikasi komisi. Dokumen ini disimpan di storage privat Cloudflare R2 (<code className="text-xs bg-muted px-1 py-0.5 rounded">solulu-private</code>) dan TIDAK disertakan dalam lembar PDF klien.
                </FieldDescription>

                {/* Upload Button */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs relative overflow-hidden"
                    disabled={uploading}
                  >
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept="image/*,.pdf"
                      id="input-file-proof-attachment"
                    />
                    {uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
                        <span>Mengunggah ke R2 Privat...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5" data-icon="inline-start" />
                        <span>Unggah Foto Bukti Sesi (Maks. 10MB)</span>
                      </>
                    )}
                  </Button>
                  {uploadError && (
                    <span className="text-xs text-destructive">{uploadError}</span>
                  )}
                </div>

                {/* Attachment list */}
                {attachments.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Foto Bukti Terunggah ({attachments.length}):
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {attachments.map((key) => {
                        const displayFileName = key.split("/").pop() || key
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/70 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <File className="size-4 text-primary shrink-0" />
                              <span className="truncate font-medium text-foreground">
                                {displayFileName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
                                onClick={() => handleDownloadAttachment(key)}
                              >
                                <Download className="size-3" data-icon="inline-start" />
                                <span>Unduh</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveAttachment(key)}
                                aria-label="Hapus file lampiran"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-3 pt-6 border-t border-border/60">
            {isModal && onCancel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={onCancel}
                disabled={submitting}
              >
                Batal
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/counselor/dashboard">Batal</Link>
              </Button>
            )}

            <Button
              type="submit"
              size="sm"
              className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={!canSubmit}
              id="btn-submit-clinical-report"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
                  <span>Menyimpan Laporan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" data-icon="inline-start" />
                  <span>Simpan Laporan & Selesaikan Sesi</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
