"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
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
} from "lucide-react"
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

interface SessionReportFormClientProps {
  initialData: SessionReportDetailView
}

interface UploadedFileItem {
  key: string
  name: string
  size: number
}

export function SessionReportFormClient({ initialData }: SessionReportFormClientProps) {
  const router = useRouter()
  const { booking } = initialData
  const [attendanceStatus, setAttendanceStatus] = React.useState<"attended" | "no_show">("attended")
  const [summary, setSummary] = React.useState(initialData.summary || "")
  const [actionPlan, setActionPlan] = React.useState(initialData.actionPlan || "")
  const [followUpRecommendation, setFollowUpRecommendation] = React.useState(
    initialData.followUpRecommendation || ""
  )
  const [attachments, setAttachments] = React.useState<string[]>(
    initialData.attachmentR2Keys || []
  )

  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({})

  const summaryChars = summary.trim().length
  const actionPlanChars = actionPlan.trim().length
  const isSummaryValid = summaryChars >= 20
  const isActionPlanValid = actionPlanChars >= 20

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    // 10MB limit per clinical attachment
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran dokumen maksimal 10 MB.")
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
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah file lampiran.")
    } finally {
      setUploading(false)
      // reset file input
      e.target.value = ""
    }
  }

  const handleRemoveAttachment = (keyToRemove: string) => {
    setAttachments((prev) => prev.filter((k) => k !== keyToRemove))
  }

  const handleDownloadAttachment = async (key: string) => {
    try {
      const res = await getAttachmentDownloadUrlAction(key)
      if (res.success && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, "_blank", "noopener,noreferrer")
      } else {
        alert(res.error || "Gagal membuka file lampiran.")
      }
    } catch {
      alert("Terjadi kesalahan saat memproses tautan unduhan.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setStatusMessage(null)
    setFieldErrors({})

    try {
      const res = await submitSessionReportAction({
        bookingId: booking.id,
        attendanceStatus,
        summary,
        actionPlan,
        followUpRecommendation: followUpRecommendation || null,
        attachmentR2Keys: attachments,
      })

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: "Catatan sesi klinis berhasil disimpan ke arsip rahasia. Status booking telah ditandai selesai.",
        })
        setTimeout(() => {
          router.push("/counselor/dashboard")
        }, 1500)
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal menyimpan laporan sesi. Periksa input formulir Anda.",
        })
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        }
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Terjadi kesalahan jaringan saat menyimpan laporan.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-2 text-xs -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/counselor/dashboard">
            <ArrowLeft className="size-3.5" />
            <span>Kembali ke Daftar Sesi</span>
          </Link>
        </Button>
      </div>

      {/* Patient & Session Context Card */}
      <Card className="border border-border/80 shadow-xs bg-muted/20">
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                {booking.patientName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-foreground">
                  {booking.patientName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {booking.patientEmail} • {booking.patientPhone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

          {/* Clinical Risk & Intake Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-background border border-border/70">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Hasil Skrining Klinis SRQ-20
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
              <p className="text-muted-foreground italic leading-relaxed">
                &ldquo;{booking.initialNotes || "Pasien tidak mencantumkan catatan awal keluhan."}&rdquo;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold tracking-tight">
                    Catatan Klinis & Rekam Sesi
                  </CardTitle>
                  <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1">
                    <Lock className="size-3" />
                    Enkripsi & RLS Terlindungi
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Dokumen ini bersifat rahasia medis. Hanya Anda (konselor penanggung jawab) dan Super Admin yang dapat mengakses catatan ini.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <FieldGroup className="flex flex-col gap-6">
              {statusMessage && (
                <Alert
                  variant={statusMessage.type === "success" ? "default" : "destructive"}
                  className={statusMessage.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" : ""}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="size-4" />
                  )}
                  <AlertTitle className="text-xs font-semibold">
                    {statusMessage.type === "success" ? "Berhasil Disimpan" : "Gagal Menyimpan"}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {statusMessage.text}
                  </AlertDescription>
                </Alert>
              )}

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
                    onClick={() => {
                      setAttendanceStatus("attended")
                    }}
                    className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      attendanceStatus === "attended"
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <CheckCircle2 className={`size-4 mt-0.5 shrink-0 ${attendanceStatus === "attended" ? "text-primary" : "text-muted-foreground/40"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">Hadir Penuh</span>
                      <span className="text-[11px] text-muted-foreground">Klien hadir dan sesi telekonseling 90 menit berjalan lancar.</span>
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
                    className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      attendanceStatus === "no_show"
                        ? "border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/30"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <AlertCircle className={`size-4 mt-0.5 shrink-0 ${attendanceStatus === "no_show" ? "text-amber-600" : "text-muted-foreground/40"}`} />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">Klien Tidak Hadir (No-Show)</span>
                      <span className="text-[11px] text-muted-foreground">Konselor bersiaga namun klien tidak memasuki Zoom sampai jam berakhir.</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Field 1: Ringkasan Sesi */}
              <Field data-invalid={!!fieldErrors.summary}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="report-summary" className="text-sm font-semibold">
                    Ringkasan Sesi Konseling <span className="text-destructive">*</span>
                  </FieldLabel>
                  <span
                    className={`text-xs ${
                      isSummaryValid
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {summaryChars} / 20 karakter min {isSummaryValid && "✓"}
                  </span>
                </div>
                <Textarea
                  id="report-summary"
                  rows={5}
                  placeholder="Tuliskan dinamika konseling, eksplorasi masalah utama, kondisi afek pasien, dan tema yang dibahas..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="resize-y text-sm"
                  aria-invalid={!!fieldErrors.summary}
                  required
                />
                {fieldErrors.summary ? (
                  <FieldError className="text-xs">{fieldErrors.summary[0]}</FieldError>
                ) : (
                  <FieldDescription className="text-xs">
                    Uraikan dinamika psikologis, tema pembahasan, dan kondisi afek klien selama sesi 90 menit.
                  </FieldDescription>
                )}
              </Field>

              {/* Field 2: Rencana Tindak Lanjut / Action Plan */}
              <Field data-invalid={!!fieldErrors.actionPlan}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="report-action-plan" className="text-sm font-semibold">
                    Rencana Intervensi & Tindak Lanjut Pasien <span className="text-destructive">*</span>
                  </FieldLabel>
                  <span
                    className={`text-xs ${
                      isActionPlanValid
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {actionPlanChars} / 20 karakter min {isActionPlanValid && "✓"}
                  </span>
                </div>
                <Textarea
                  id="report-action-plan"
                  rows={4}
                  placeholder="Rencana aksi mandiri pasien, tugas rumah (journaling, pernapasan, relaksasi), atau langkah penanganan krisis..."
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="resize-y text-sm"
                  aria-invalid={!!fieldErrors.actionPlan}
                  required
                />
                {fieldErrors.actionPlan ? (
                  <FieldError className="text-xs">{fieldErrors.actionPlan[0]}</FieldError>
                ) : (
                  <FieldDescription className="text-xs">
                    Langkah nyata atau latihan psikologis yang disepakati untuk dipraktikkan pasien.
                  </FieldDescription>
                )}
              </Field>

              {/* Field 3: Rekomendasi Rujukan / Jadwal Sesi Berikutnya */}
              <Field>
                <FieldLabel htmlFor="report-recommendation" className="text-sm font-semibold">
                  Rekomendasi Rujukan / Jadwal Berikutnya (Opsional)
                </FieldLabel>
                <Input
                  id="report-recommendation"
                  placeholder="Contoh: Disarankan sesi lanjutan 1 minggu lagi, atau rujukan psikiatri untuk evaluasi medikasi."
                  value={followUpRecommendation}
                  onChange={(e) => setFollowUpRecommendation(e.target.value)}
                  className="text-sm"
                />
                <FieldDescription className="text-xs">
                  Dapat berupa saran frekuensi pertemuan selanjutnya atau arahan rujukan medis bila diperlukan.
                </FieldDescription>
              </Field>

              {/* Field 4: Lampiran Dokumen Medis Privat */}
              <Field className="pt-2 border-t border-border/60">
                <FieldLabel className="text-sm font-semibold">
                  Lampiran Dokumen Klinis Rahasia (Opsional)
                </FieldLabel>
                <FieldDescription className="text-xs">
                  Unggah catatan tulisan tangan, asesmen PDF, atau lembar kerja. File disimpan di Cloudflare R2 bucket privat (<code className="text-xs bg-muted px-1 py-0.5 rounded">solulu-private</code>) dan dienkripsi.
                </FieldDescription>

              {/* Upload Drop/Button */}
              <div className="flex items-center gap-3">
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
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    id="input-file-attachment"
                  />
                  {uploading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Mengunggah ke R2 Privat...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-3.5" />
                      <span>Pilih File Dokumen (Maks. 10MB)</span>
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
                    Dokumen Terlampir ({attachments.length}):
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {attachments.map((key, idx) => {
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
                              <Download className="size-3" />
                              <span>Unduh</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveAttachment(key)}
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
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/counselor/dashboard">Batal</Link>
            </Button>

            <Button
              type="submit"
              size="sm"
              className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              disabled={submitting || !isSummaryValid || !isActionPlanValid}
              id="btn-submit-report"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Menyimpan Laporan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Simpan Catatan Sesi Klinis</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
