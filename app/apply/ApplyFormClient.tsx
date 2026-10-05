"use client"

import * as React from "react"
import Link from "next/link"
import {
  counselorApplicationInputSchema,
  type CounselorType,
} from "@/lib/validations/counselor-application"
import { submitCounselorApplicationAction } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import {
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Info,
  Loader2,
  Clock,
  Lock,
  FileText,
  Users,
  GraduationCap,
  IdCard,
  Award,
} from "lucide-react"

interface DocumentUploadState {
  file: File | null
  r2Key: string | null
  uploading: boolean
  error: string | null
}

export function ApplyFormClient() {
  const [counselorType, setCounselorType] = React.useState<CounselorType>("peer")
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [agreeToTerms, setAgreeToTerms] = React.useState<boolean>(false)

  const [cvDoc, setCvDoc] = React.useState<DocumentUploadState>({
    file: null,
    r2Key: null,
    uploading: false,
    error: null,
  })
  const [ktpDoc, setKtpDoc] = React.useState<DocumentUploadState>({
    file: null,
    r2Key: null,
    uploading: false,
    error: null,
  })
  const [diplomaDoc, setDiplomaDoc] = React.useState<DocumentUploadState>({
    file: null,
    r2Key: null,
    uploading: false,
    error: null,
  })
  const [strDoc, setStrDoc] = React.useState<DocumentUploadState>({
    file: null,
    r2Key: null,
    uploading: false,
    error: null,
  })

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({})
  const [globalError, setGlobalError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [submittedSuccess, setSubmittedSuccess] = React.useState(false)
  const [termsModalOpen, setTermsModalOpen] = React.useState(false)

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: "cv" | "ktp" | "diploma" | "str",
    setDocState: React.Dispatch<React.SetStateAction<DocumentUploadState>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]
    if (!allowedTypes.includes(file.type)) {
      setDocState({
        file: null,
        r2Key: null,
        uploading: false,
        error: "Format berkas tidak didukung. Harap unggah PDF, JPG, atau PNG.",
      })
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setDocState({
        file: null,
        r2Key: null,
        uploading: false,
        error: "Ukuran berkas maksimal 15MB.",
      })
      return
    }

    setDocState({
      file,
      r2Key: null,
      uploading: true,
      error: null,
    })

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", category)

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const uploadJson = await uploadRes.json()

      if (!uploadRes.ok || !uploadJson.success || !uploadJson.data?.r2Key) {
        throw new Error(uploadJson.error || `Upload berkas gagal (${uploadRes.status})`)
      }

      setDocState({
        file,
        r2Key: uploadJson.data.r2Key,
        uploading: false,
        error: null,
      })
    } catch (err: any) {
      setDocState({
        file: null,
        r2Key: null,
        uploading: false,
        error: err.message || "Gagal mengunggah berkas. Silakan coba kembali.",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    setFieldErrors({})

    const payload = {
      fullName,
      email,
      phone,
      counselorType,
      bio,
      cvR2Key: cvDoc.r2Key || "",
      ktpR2Key: ktpDoc.r2Key || "",
      diplomaR2Key: diplomaDoc.r2Key || "",
      strR2Key: strDoc.r2Key || (counselorType === "peer" ? null : ""),
      agreeToTerms,
    }

    const validation = counselorApplicationInputSchema.safeParse(payload)
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors)
      const firstError = validation.error.issues[0]?.message
      setGlobalError(firstError || "Mohon lengkapi seluruh formulir dengan data yang valid.")
      return
    }

    setSubmitting(true)
    try {
      const res = await submitCounselorApplicationAction(payload as any)
      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        setGlobalError(res.error || "Gagal mengirimkan aplikasi.")
        setSubmitting(false)
        return
      }

      setSubmittedSuccess(true)
    } catch (err: any) {
      setGlobalError(err.message || "Terjadi kendala saat mengirim aplikasi.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10 sm:py-16">
        <div className="rounded-2xl border border-border/80 bg-card p-8 sm:p-10 shadow-xs flex flex-col gap-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
            <CheckCircle2 className="size-9" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Pendaftaran Mitra Berhasil Dikirimkan
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Terima kasih telah mendaftar. Seluruh berkas Anda sudah tersimpan dengan aman untuk proses verifikasi tim kami.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-5 text-left text-xs sm:text-sm space-y-3 text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <span className="size-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Verifikasi Berkas:</strong> Tim kami akan memverifikasi keabsahan dokumen (ijazah, KTP, dan STR) dalam 1-3 hari kerja.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="size-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Undangan Aktivasi Akun:</strong> Tautan resmi akan dikirim via email untuk mengatur kata sandi dan mengakses Portal Konselor.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="size-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
              <span>
                <strong className="text-foreground">Pengaturan Jadwal:</strong> Atur jadwal konsultasi mandiri dengan durasi penuh 90 menit dan tautan Zoom otomatis.
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Button asChild variant="public" size="pill" className="w-full sm:w-auto">
              <Link href="/">Kembali ke Beranda Solulu</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6">
      <div className="mb-8 sm:mb-10 text-center sm:text-left space-y-3.5">
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.12]">
          Pendaftaran Mitra Konselor
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
          Lengkapi data diri dan unggah berkas profesi Anda. Seluruh dokumen disimpan aman dan terenkripsi untuk proses verifikasi kemitraan.
        </p>

        <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium shadow-2xs">
            <Lock className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Berkas Aman &amp; Terenkripsi</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium shadow-2xs">
            <Clock className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Verifikasi 1-3 Hari Kerja</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium shadow-2xs">
            <ShieldCheck className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Standar Sesi 90 Menit</span>
          </div>
        </div>
      </div>

      {globalError && (
        <Alert variant="destructive" className="rounded-2xl border-destructive/30 mb-6 p-4">
          <AlertCircle className="size-4" />
          <AlertTitle className="text-sm font-semibold">Periksa Kembali Data Anda</AlertTitle>
          <AlertDescription className="text-xs">{globalError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xs p-6 sm:p-8 md:p-10 shadow-lg shadow-purple-500/5 divide-y divide-border/60 flex flex-col">
        <section className="pb-8 space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">
              1. Kategori Kemitraan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pilih peran kemitraan sesuai latar belakang kualifikasi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <button
              type="button"
              id="counselor-type-peer-btn"
              onClick={() => setCounselorType("peer")}
              className={`p-4 sm:p-5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                counselorType === "peer"
                  ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/30 dark:bg-purple-950/35 shadow-xs"
                  : "border-border/80 bg-muted/10 hover:bg-muted/30 hover:border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      counselorType === "peer"
                        ? "bg-purple-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Users className="size-4" />
                  </div>
                  <div>
                    <span className="font-heading font-semibold text-foreground text-sm sm:text-base block">
                      Konselor Sebaya (Peer)
                    </span>
                    <span className="text-xs text-muted-foreground">Teman Cerita Terlatih</span>
                  </div>
                </div>
                {counselorType === "peer" && (
                  <CheckCircle2 className="size-5 text-purple-600 shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lulusan S1 Psikologi atau Bimbingan Konseling dengan keahlian pendampingan non-klinis dan pertolongan pertama psikologis (PFA).
              </p>
              <div className="pt-0.5">
                <Badge variant="outline" className="w-fit text-xs border-muted-foreground/30 font-normal">
                  STR Opsional
                </Badge>
              </div>
            </button>

            <button
              type="button"
              id="counselor-type-psychologist-btn"
              onClick={() => setCounselorType("psychologist")}
              className={`p-4 sm:p-5 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                counselorType === "psychologist"
                  ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/30 dark:bg-purple-950/35 shadow-xs"
                  : "border-border/80 bg-muted/10 hover:bg-muted/30 hover:border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      counselorType === "psychologist"
                        ? "bg-purple-600 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <GraduationCap className="size-4" />
                  </div>
                  <div>
                    <span className="font-heading font-semibold text-foreground text-sm sm:text-base block">
                      Psikolog Klinis
                    </span>
                    <span className="text-xs text-muted-foreground">Izin Profesi Resmi</span>
                  </div>
                </div>
                {counselorType === "psychologist" && (
                  <CheckCircle2 className="size-5 text-purple-600 shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Magister Psikologi Profesi berijazah sah dengan Surat Tanda Registrasi (STR) aktif untuk diagnosis dan psikoterapi klinis.
              </p>
              <div className="pt-0.5">
                <Badge
                  variant="secondary"
                  className="w-fit text-xs bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold"
                >
                  STR Wajib
                </Badge>
              </div>
            </button>
          </div>
        </section>

        <section className="py-8 space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">
              2. Data Pribadi & Kontak
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Data ini akan dicocokkan dengan dokumen resmi untuk pembuatan akun konselor Anda.
            </p>
          </div>

          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(fieldErrors.fullName)}>
              <FieldLabel htmlFor="fullName" className="text-xs sm:text-sm font-medium">
                Nama Lengkap & Gelar
              </FieldLabel>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Contoh: Siti Rahmawati, S.Psi atau Dr. Ahmad, M.Psi., Psikolog"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={Boolean(fieldErrors.fullName)}
                className="rounded-xl border-border/80 focus-visible:ring-purple-500/30 focus-visible:border-purple-500"
              />
              <FieldDescription className="text-xs">
                Sesuai KTP dan cantumkan gelar profesi jika ada.
              </FieldDescription>
              {fieldErrors.fullName && (
                <FieldError className="text-xs">{fieldErrors.fullName[0]}</FieldError>
              )}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field data-invalid={Boolean(fieldErrors.email)}>
                <FieldLabel htmlFor="email" className="text-xs sm:text-sm font-medium">
                  Alamat Email Aktif
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className="rounded-xl border-border/80 focus-visible:ring-purple-500/30 focus-visible:border-purple-500"
                />
                <FieldDescription className="text-xs">
                  Tautan aktivasi akun konselor akan dikirim ke email ini.
                </FieldDescription>
                {fieldErrors.email && (
                  <FieldError className="text-xs">{fieldErrors.email[0]}</FieldError>
                )}
              </Field>

              <Field data-invalid={Boolean(fieldErrors.phone)}>
                <FieldLabel htmlFor="phone" className="text-xs sm:text-sm font-medium">
                  Nomor WhatsApp
                </FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  className="rounded-xl border-border/80 focus-visible:ring-purple-500/30 focus-visible:border-purple-500"
                />
                <FieldDescription className="text-xs">
                  Nomor aktif yang terhubung ke WhatsApp (contoh: 081234567890).
                </FieldDescription>
                {fieldErrors.phone && (
                  <FieldError className="text-xs">{fieldErrors.phone[0]}</FieldError>
                )}
              </Field>
            </div>

            <Field data-invalid={Boolean(fieldErrors.bio)}>
              <FieldLabel htmlFor="bio" className="text-xs sm:text-sm font-medium">
                Ringkasan Profil & Pengalaman Praktik
              </FieldLabel>
              <Textarea
                id="bio"
                name="bio"
                rows={3}
                placeholder="Ceritakan latar belakang pendidikan, pendekatan konseling yang digunakan (misal CBT, ACT, Humanistik), dan pengalaman pendampingan klien Anda..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                aria-invalid={Boolean(fieldErrors.bio)}
                className="rounded-xl border-border/80 focus-visible:ring-purple-500/30 focus-visible:border-purple-500 text-sm leading-relaxed"
              />
              <FieldDescription className="text-xs">
                Minimal 20 karakter. Ringkasan ini akan ditampilkan pada profil publik Anda.
              </FieldDescription>
              {fieldErrors.bio && <FieldError className="text-xs">{fieldErrors.bio[0]}</FieldError>}
            </Field>
          </FieldGroup>
        </section>

        <section className="py-8 space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-base sm:text-lg font-bold text-foreground">
              3. Berkas &amp; Dokumen Pendukung
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Format berkas: PDF, JPG, PNG (maksimal 15MB per berkas).
            </p>
          </div>

          <div className="space-y-3">
            <div
              className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                cvDoc.r2Key
                  ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                  : "border-border/70 bg-muted/15 hover:border-border"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    cvDoc.r2Key
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  <FileText className="size-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-sm text-foreground">
                      Curriculum Vitae (CV) Terkini
                    </span>
                    <Badge variant="destructive" className="text-xs py-0.5 px-2 font-normal">
                      Wajib
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Riwayat pendidikan, sertifikasi, dan pengalaman konseling.
                  </p>
                  {cvDoc.file && (
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <FileCheck className="size-3.5 shrink-0" />
                      {cvDoc.file.name} ({(cvDoc.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                  {cvDoc.error && (
                    <span className="text-xs text-destructive block font-medium">{cvDoc.error}</span>
                  )}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <input
                  type="file"
                  id="cv-file-input"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleFileUpload(e, "cv", setCvDoc)}
                  disabled={cvDoc.uploading}
                />
                <Button
                  type="button"
                  variant={cvDoc.r2Key ? "secondary" : "outline"}
                  size="sm"
                  asChild
                  disabled={cvDoc.uploading}
                  className={`rounded-full cursor-pointer text-xs font-medium shadow-2xs ${
                    cvDoc.r2Key
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : ""
                  }`}
                >
                  <label htmlFor="cv-file-input" className="cursor-pointer">
                    {cvDoc.uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5 text-purple-600" />
                        Mengunggah...
                      </>
                    ) : cvDoc.r2Key ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600 mr-1.5" />
                        Ganti Berkas
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5 mr-1.5 text-purple-600" />
                        Pilih Berkas CV
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                ktpDoc.r2Key
                  ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                  : "border-border/70 bg-muted/15 hover:border-border"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    ktpDoc.r2Key
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  <IdCard className="size-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-sm text-foreground">
                      KTP (Kartu Tanda Penduduk)
                    </span>
                    <Badge variant="destructive" className="text-xs py-0.5 px-2 font-normal">
                      Wajib
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Foto atau pindaian KTP yang jelas dan terbaca.
                  </p>
                  {ktpDoc.file && (
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <FileCheck className="size-3.5 shrink-0" />
                      {ktpDoc.file.name} ({(ktpDoc.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                  {ktpDoc.error && (
                    <span className="text-xs text-destructive block font-medium">{ktpDoc.error}</span>
                  )}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <input
                  type="file"
                  id="ktp-file-input"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleFileUpload(e, "ktp", setKtpDoc)}
                  disabled={ktpDoc.uploading}
                />
                <Button
                  type="button"
                  variant={ktpDoc.r2Key ? "secondary" : "outline"}
                  size="sm"
                  asChild
                  disabled={ktpDoc.uploading}
                  className={`rounded-full cursor-pointer text-xs font-medium shadow-2xs ${
                    ktpDoc.r2Key
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : ""
                  }`}
                >
                  <label htmlFor="ktp-file-input" className="cursor-pointer">
                    {ktpDoc.uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5 text-purple-600" />
                        Mengunggah...
                      </>
                    ) : ktpDoc.r2Key ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600 mr-1.5" />
                        Ganti Berkas
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5 mr-1.5 text-purple-600" />
                        Pilih Berkas KTP
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                diplomaDoc.r2Key
                  ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                  : "border-border/70 bg-muted/15 hover:border-border"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    diplomaDoc.r2Key
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  <GraduationCap className="size-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-sm text-foreground">
                      Ijazah Terakhir (S1 / Profesi)
                    </span>
                    <Badge variant="destructive" className="text-xs py-0.5 px-2 font-normal">
                      Wajib
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Foto atau pindaian ijazah asli atau legalisasi resmi perguruan tinggi.
                  </p>
                  {diplomaDoc.file && (
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <FileCheck className="size-3.5 shrink-0" />
                      {diplomaDoc.file.name} ({(diplomaDoc.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                  {diplomaDoc.error && (
                    <span className="text-xs text-destructive block font-medium">{diplomaDoc.error}</span>
                  )}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <input
                  type="file"
                  id="diploma-file-input"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleFileUpload(e, "diploma", setDiplomaDoc)}
                  disabled={diplomaDoc.uploading}
                />
                <Button
                  type="button"
                  variant={diplomaDoc.r2Key ? "secondary" : "outline"}
                  size="sm"
                  asChild
                  disabled={diplomaDoc.uploading}
                  className={`rounded-full cursor-pointer text-xs font-medium shadow-2xs ${
                    diplomaDoc.r2Key
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : ""
                  }`}
                >
                  <label htmlFor="diploma-file-input" className="cursor-pointer">
                    {diplomaDoc.uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5 text-purple-600" />
                        Mengunggah...
                      </>
                    ) : diplomaDoc.r2Key ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600 mr-1.5" />
                        Ganti Berkas
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5 mr-1.5 text-purple-600" />
                        Pilih Berkas Ijazah
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                strDoc.r2Key
                  ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                  : counselorType === "psychologist"
                    ? "border-purple-500/40 bg-purple-500/10 ring-1 ring-purple-500/20"
                    : "border-border/70 bg-muted/15 hover:border-border"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    strDoc.r2Key
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  <Award className="size-4" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-semibold text-sm text-foreground">
                      Surat Tanda Registrasi (STR)
                    </span>
                    {counselorType === "psychologist" ? (
                      <Badge variant="destructive" className="text-xs py-0.5 px-2 font-normal">
                        Wajib untuk Psikolog
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs py-0.5 px-2 border-muted-foreground/30 font-normal"
                      >
                        Opsional
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nomor dan berkas STR aktif dari KTKI (khusus psikolog klinis).
                  </p>
                  {strDoc.file && (
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <FileCheck className="size-3.5 shrink-0" />
                      {strDoc.file.name} ({(strDoc.file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                  {fieldErrors.strR2Key && (
                    <span className="text-xs text-destructive block font-medium">
                      {fieldErrors.strR2Key[0]}
                    </span>
                  )}
                  {strDoc.error && (
                    <span className="text-xs text-destructive block font-medium">{strDoc.error}</span>
                  )}
                </div>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <input
                  type="file"
                  id="str-file-input"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => handleFileUpload(e, "str", setStrDoc)}
                  disabled={strDoc.uploading}
                />
                <Button
                  type="button"
                  variant={strDoc.r2Key ? "secondary" : "outline"}
                  size="sm"
                  asChild
                  disabled={strDoc.uploading}
                  className={`rounded-full cursor-pointer text-xs font-medium shadow-2xs ${
                    strDoc.r2Key
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      : ""
                  }`}
                >
                  <label htmlFor="str-file-input" className="cursor-pointer">
                    {strDoc.uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5 text-purple-600" />
                        Mengunggah...
                      </>
                    ) : strDoc.r2Key ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600 mr-1.5" />
                        Ganti Berkas
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5 mr-1.5 text-purple-600" />
                        Pilih Berkas STR
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8 space-y-6">
          <div className="rounded-xl border border-border/80 p-4 sm:p-5 bg-muted/15 flex items-start gap-3.5 transition-colors">
            <Checkbox
              id="terms"
              name="terms"
              checked={agreeToTerms}
              onCheckedChange={(checked) => setAgreeToTerms(Boolean(checked))}
              className="mt-0.5 shrink-0 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              aria-invalid={Boolean(fieldErrors.agreeToTerms)}
            />
            <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <label
                htmlFor="terms"
                className="font-heading font-semibold text-foreground text-sm cursor-pointer select-none block"
              >
                Saya menyatakan kebenaran data dan menyetujui Ketentuan Kemitraan Solulu
              </label>
              <p>
                Saya menjamin keaslian dokumen yang diunggah dan bersedia menjaga kerahasiaan klien serta mematuhi standar layanan Solulu.{" "}
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(true)}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 underline underline-offset-2 font-semibold cursor-pointer"
                >
                  Baca Ketentuan Kemitraan
                </button>
              </p>
              {fieldErrors.agreeToTerms && (
                <span className="text-xs text-destructive block font-medium">
                  {fieldErrors.agreeToTerms[0]}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <span className="text-xs text-muted-foreground text-center sm:text-left leading-relaxed">
              Semua data dan berkas Anda diperiksa langsung secara rahasia oleh tim Solulu.
            </span>
            <Button
              type="submit"
              variant="public"
              size="pill-lg"
              disabled={submitting}
              className="w-full sm:w-auto px-8 shrink-0 shadow-md shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98] transition-all font-semibold"
              id="submit-application-btn"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Memproses Pendaftaran...
                </>
              ) : (
                <>
                  <span>Kirim Berkas Pendaftaran</span>
                  <ArrowRight className="size-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </section>
      </form>

      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-6 sm:p-8">
          <DialogHeader className="pb-2">
            <DialogTitle className="font-heading font-bold text-lg text-foreground">
              Ketentuan &amp; Kode Etik Kemitraan Solulu
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Pedoman integritas dan standar profesional bagi calon mitra konselor Solulu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed py-2">
            <div className="rounded-xl border border-border/80 p-3.5 bg-muted/20">
              <strong className="text-foreground text-xs sm:text-sm block mb-1">
                1. Kerahasiaan &amp; Privasi Pasien
              </strong>
              Mitra wajib mematuhi standar perlindungan data pribadi dan menjaga kerahasiaan seluruh informasi sesi konseling kecuali diatur lain oleh hukum darurat.
            </div>
            <div className="rounded-xl border border-border/80 p-3.5 bg-muted/20">
              <strong className="text-foreground text-xs sm:text-sm block mb-1">
                2. Standar Sesi Konsultasi 90 Menit
              </strong>
              Seluruh sesi konsultasi di Solulu dijadwalkan dengan durasi penuh 90 menit melalui tautan Zoom terenkripsi yang dibuat otomatis oleh sistem.
            </div>
            <div className="rounded-xl border border-border/80 p-3.5 bg-muted/20">
              <strong className="text-foreground text-xs sm:text-sm block mb-1">
                3. Keabsahan Dokumen Profesi
              </strong>
              Mitra menjamin seluruh berkas sah, aktif, dan diterbitkan otoritas resmi. Pemalsuan dokumen berakibat pemutusan kemitraan seketika dan tindakan hukum.
            </div>
            <div className="rounded-xl border border-border/80 p-3.5 bg-muted/20">
              <strong className="text-foreground text-xs sm:text-sm block mb-1">
                4. Batasan Ruang Lingkup Praktik
              </strong>
              Konselor sebaya tidak memberikan diagnosis klinis atau resep farmasi, serta wajib merujuk kasus risiko tinggi kepada psikolog klinis Solulu.
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="public"
              size="pill"
              onClick={() => {
                setAgreeToTerms(true)
                setTermsModalOpen(false)
              }}
            >
              Saya Mengerti &amp; Setuju
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
