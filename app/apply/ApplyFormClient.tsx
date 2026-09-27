"use client"

import * as React from "react"
import {
  counselorApplicationInputSchema,
  type CounselorType,
} from "@/lib/validations/counselor-application"
import {
  getPresignedUploadUrlAction,
  submitCounselorApplicationAction,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  UserCheck,
  HeartHandshake,
  ArrowRight,
  Info,
  Loader2,
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

  // Document states
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

  // Direct R2 file upload handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: "cv" | "ktp" | "diploma" | "str",
    setDocState: React.Dispatch<React.SetStateAction<DocumentUploadState>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Allowed types check
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
      // 1. Request presigned PUT URL from server action
      const presignedRes = await getPresignedUploadUrlAction({
        fileType: file.type as any,
        fileName: file.name,
        category,
      })

      if (!presignedRes.success || !presignedRes.data) {
        throw new Error(presignedRes.error || "Gagal memperoleh izin upload R2.")
      }

      const { uploadUrl, r2Key } = presignedRes.data

      // 2. Direct PUT to Cloudflare R2 bucket (bypassing Vercel server)
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error(`Upload berkas ke penyimpanan privat gagal (${uploadRes.status})`)
      }

      setDocState({
        file,
        r2Key,
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

    // Client-side Zod validation
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
      <div className="mx-auto max-w-2xl py-12 px-4">
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Pendaftaran Mitra Berhasil Dikirimkan
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground pt-1">
              Terima kasih atas dedikasi Anda untuk bergabung bersama ekosistem layanan kesehatan mental Solulu.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 text-sm">
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <ShieldCheck className="size-5 text-emerald-600" />
              <AlertTitle className="font-semibold text-foreground">
                Dokumen Tersimpan Aman di Cloudflare R2
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                Semua berkas kredensial dan identitas Anda telah diunggah langsung ke bucket privat berstandar enkripsi tinggi untuk proses audit administrasi.
              </AlertDescription>
            </Alert>

            <div className="rounded-xl border border-border p-5 bg-card flex flex-col gap-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Info className="size-4 text-primary" />
                Langkah Selanjutnya:
              </h4>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Verifikasi Berkas:</strong> Tim administrasi kami akan meneliti keabsahan ijazah, KTP, dan STR Anda dalam 1–3 hari kerja.
                </li>
                <li>
                  <strong className="text-foreground">Undangan Aktivasi Akun:</strong> Setelah berkas dinyatakan lengkap dan valid, Anda akan menerima email undangan resmi dari sistem Supabase untuk membuat kata sandi dan mengakses Portal Konselor Solulu.
                </li>
                <li>
                  <strong className="text-foreground">Pengaturan Jadwal:</strong> Di portal konselor, Anda dapat menentukan jadwal praktik mandiri 90 menit dan menyematkan ruang Zoom otomatis.
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-center">
              <Button asChild variant="outline">
                <a href="/">Kembali ke Beranda Solulu</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl py-12 px-4 sm:px-6">
      <div className="mb-8 flex flex-col gap-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
            Kemitraan Profesional
          </Badge>
          <span className="text-xs text-muted-foreground">
            Layanan Terbuka untuk Konselor & Psikolog
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Pendaftaran Mitra Konselor Solulu
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          Bergabunglah dalam ruang konsultasi psikologis yang ramah, privat, dan terstandarisasi. Dokumen kredensial Anda diunggah langsung secara aman tanpa perantara.
        </p>
      </div>

      {globalError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>Periksa Kembali Data Anda</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Step 1: Counselor Category Selection */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="size-5 text-primary" />
              1. Kategori Kemitraan
            </CardTitle>
            <CardDescription>
              Pilih peran kemitraan yang sesuai dengan latar belakang pendidikan dan kualifikasi profesi Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              id="counselor-type-peer-btn"
              onClick={() => setCounselorType("peer")}
              className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                counselorType === "peer"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-sm">
                  Konselor Sebaya (Peer)
                </span>
                {counselorType === "peer" && (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lulusan S1 Psikologi atau Bimbingan Konseling dengan keahlian pendampingan non-klinis dan pertolongan pertama psikologis (PFA).
              </p>
              <Badge variant="outline" className="w-fit text-[11px] mt-1">
                STR Opsional
              </Badge>
            </button>

            <button
              type="button"
              id="counselor-type-psychologist-btn"
              onClick={() => setCounselorType("psychologist")}
              className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                counselorType === "psychologist"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-sm">
                  Psikolog Klinis
                </span>
                {counselorType === "psychologist" && (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Magister Psikologi Profesi berijazah sah dengan Surat Tanda Registrasi (STR) aktif untuk menangani diagnosis dan psikoterapi klinis.
              </p>
              <Badge variant="secondary" className="w-fit text-[11px] mt-1 bg-primary/10 text-primary">
                STR Wajib
              </Badge>
            </button>
          </CardContent>
        </Card>

        {/* Step 2: Personal Profile */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HeartHandshake className="size-5 text-primary" />
              2. Data Pribadi & Kontak
            </CardTitle>
            <CardDescription>
              Informasi ini akan dicocokkan dengan identitas resmi dan digunakan untuk aktivasi akun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={Boolean(fieldErrors.fullName)}>
                <FieldLabel htmlFor="fullName">Nama Lengkap & Gelar</FieldLabel>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Contoh: Siti Rahmawati, S.Psi atau Dr. Ahmad, M.Psi., Psikolog"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                />
                <FieldDescription>
                  Gunakan nama lengkap sesuai KTP dan cantumkan gelar profesi jika ada.
                </FieldDescription>
                {fieldErrors.fullName && (
                  <FieldError>{fieldErrors.fullName[0]}</FieldError>
                )}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field data-invalid={Boolean(fieldErrors.email)}>
                  <FieldLabel htmlFor="email">Alamat Email Aktif</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                  <FieldDescription>
                    Tautan aktivasi akun konselor akan dikirimkan ke email ini.
                  </FieldDescription>
                  {fieldErrors.email && (
                    <FieldError>{fieldErrors.email[0]}</FieldError>
                  )}
                </Field>

                <Field data-invalid={Boolean(fieldErrors.phone)}>
                  <FieldLabel htmlFor="phone">Nomor Telepon / WhatsApp</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    aria-invalid={Boolean(fieldErrors.phone)}
                  />
                  <FieldDescription>
                    Format Indonesia (diawali 08 atau +62).
                  </FieldDescription>
                  {fieldErrors.phone && (
                    <FieldError>{fieldErrors.phone[0]}</FieldError>
                  )}
                </Field>
              </div>

              <Field data-invalid={Boolean(fieldErrors.bio)}>
                <FieldLabel htmlFor="bio">Ringkasan Profil & Pengalaman Praktik</FieldLabel>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  placeholder="Ceritakan latar belakang pendidikan, pendekatan konseling yang digunakan (misal CBT, ACT, Humanistik), dan pengalaman pendampingan klien Anda..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.bio)}
                />
                <FieldDescription>
                  Minimal 20 karakter. Deskripsi ini akan ditampilkan pada profil publik konselor setelah disetujui.
                </FieldDescription>
                {fieldErrors.bio && <FieldError>{fieldErrors.bio[0]}</FieldError>}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Step 3: Document Uploads (Direct R2 Presigned PUT) */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UploadCloud className="size-5 text-primary" />
              3. Berkas Kredensial (Direct-to-R2)
            </CardTitle>
            <CardDescription>
              Berkas Anda langsung dikirim ke Cloudflare R2 privat tanpa disimpan di server aplikasi, menjamin privasi penuh. Format: PDF, JPG, PNG (maks. 15MB).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* 1. CV */}
            <div className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  Curriculum Vitae (CV) Terkini
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                    Wajib
                  </Badge>
                </span>
                <span className="text-xs text-muted-foreground">
                  Memuat riwayat pendidikan, pelatihan konseling, dan pengalaman kerja.
                </span>
                {cvDoc.file && (
                  <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 mt-1">
                    <FileCheck className="size-3.5" />
                    {cvDoc.file.name} ({(cvDoc.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
                {cvDoc.error && (
                  <span className="text-xs text-destructive mt-1">{cvDoc.error}</span>
                )}
              </div>
              <div className="shrink-0">
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
                >
                  <label htmlFor="cv-file-input" className="cursor-pointer">
                    {cvDoc.uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Mengunggah...
                      </>
                    ) : cvDoc.r2Key ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600 mr-1.5" />
                        Ganti Berkas
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5 mr-1.5" />
                        Pilih Berkas CV
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>

            {/* 2. KTP */}
            <div className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  KTP (Kartu Tanda Penduduk)
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                    Wajib
                  </Badge>
                </span>
                <span className="text-xs text-muted-foreground">
                  Foto atau pindaian KTP yang jelas untuk verifikasi identitas resmi.
                </span>
                {ktpDoc.file && (
                  <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 mt-1">
                    <FileCheck className="size-3.5" />
                    {ktpDoc.file.name} ({(ktpDoc.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
                {ktpDoc.error && (
                  <span className="text-xs text-destructive mt-1">{ktpDoc.error}</span>
                )}
              </div>
              <div className="shrink-0">
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
                >
                  <label htmlFor="ktp-file-input" className="cursor-pointer">
                    {ktpDoc.uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Mengunggah...
                      </>
                    ) : ktpDoc.r2Key ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600 mr-1.5" />
                        Ganti Berkas
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5 mr-1.5" />
                        Pilih Berkas KTP
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>

            {/* 3. Diploma / Ijazah */}
            <div className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  Ijazah Terakhir (S1 / Profesi)
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                    Wajib
                  </Badge>
                </span>
                <span className="text-xs text-muted-foreground">
                  Pindaian ijazah asli atau legalisir dari perguruan tinggi terakreditasi.
                </span>
                {diplomaDoc.file && (
                  <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 mt-1">
                    <FileCheck className="size-3.5" />
                    {diplomaDoc.file.name} ({(diplomaDoc.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
                {diplomaDoc.error && (
                  <span className="text-xs text-destructive mt-1">{diplomaDoc.error}</span>
                )}
              </div>
              <div className="shrink-0">
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
                >
                  <label htmlFor="diploma-file-input" className="cursor-pointer">
                    {diplomaDoc.uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Mengunggah...
                      </>
                    ) : diplomaDoc.r2Key ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600 mr-1.5" />
                        Ganti Berkas
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5 mr-1.5" />
                        Pilih Berkas Ijazah
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>

            {/* 4. STR (Surat Tanda Registrasi) - Conditional */}
            <div
              className={`rounded-xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                counselorType === "psychologist"
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-muted/20"
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  Surat Tanda Registrasi (STR) Tenaga Psikologi Klinis
                  {counselorType === "psychologist" ? (
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                      Wajib untuk Psikolog
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      Opsional
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  STR yang masih berlaku dari Konsil Tenaga Kesehatan Indonesia (KTKI).
                </span>
                {strDoc.file && (
                  <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 mt-1">
                    <FileCheck className="size-3.5" />
                    {strDoc.file.name} ({(strDoc.file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
                {fieldErrors.strR2Key && (
                  <span className="text-xs text-destructive mt-1">
                    {fieldErrors.strR2Key[0]}
                  </span>
                )}
                {strDoc.error && (
                  <span className="text-xs text-destructive mt-1">{strDoc.error}</span>
                )}
              </div>
              <div className="shrink-0">
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
                >
                  <label htmlFor="str-file-input" className="cursor-pointer">
                    {strDoc.uploading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                        Mengunggah...
                      </>
                    ) : strDoc.r2Key ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600 mr-1.5" />
                        Ganti Berkas
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-3.5 mr-1.5" />
                        Pilih Berkas STR
                      </>
                    )}
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Terms & Agreement */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                name="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(Boolean(checked))}
                className="mt-1"
                aria-invalid={Boolean(fieldErrors.agreeToTerms)}
              />
              <div className="flex flex-col gap-1 leading-snug">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium text-foreground cursor-pointer select-none"
                >
                  Saya menyatakan kebenaran data dan menyetujui Ketentuan Kemitraan Solulu
                </label>
                <p className="text-xs text-muted-foreground">
                  Saya menjamin dokumen yang diunggah adalah asli dan sah. Saya bersedia mematuhi kode etik kerahasiaan klien, standar sesi 90 menit, dan tata kelola platform Solulu.{" "}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-primary underline underline-offset-2 hover:opacity-80 inline-block font-medium cursor-pointer"
                  >
                    Baca Ketentuan Kemitraan
                  </button>
                </p>
                {fieldErrors.agreeToTerms && (
                  <span className="text-xs text-destructive mt-1">
                    {fieldErrors.agreeToTerms[0]}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <span className="text-xs text-muted-foreground text-center sm:text-left">
            Dengan mengirimkan formulir, Anda memberikan izin kepada tim Solulu untuk melakukan audit verifikasi berkas.
          </span>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full sm:w-auto px-8 font-semibold"
            id="submit-application-btn"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Memproses Pendaftaran...
              </>
            ) : (
              <>
                Kirim Berkas Pendaftaran
                <ArrowRight className="size-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Terms of Partnership Modal */}
      <Dialog open={termsModalOpen} onOpenChange={setTermsModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ketentuan & Kode Etik Kemitraan Solulu</DialogTitle>
            <DialogDescription>
              Pedoman integritas dan standar profesional bagi calon mitra konselor Solulu.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-xs text-muted-foreground leading-relaxed py-2">
            <div>
              <strong className="text-foreground text-sm block mb-1">
                1. Kerahasiaan & Privasi Pasien
              </strong>
              Mitra wajib mematuhi standar perlindungan data pribadi dan menjaga kerahasiaan seluruh informasi, catatan asesmen, serta dinamika sesi konseling kecuali diatur lain oleh ketentuan hukum penanganan krisis darurat.
            </div>
            <div>
              <strong className="text-foreground text-sm block mb-1">
                2. Standar Sesi Konsultasi 90 Menit
              </strong>
              Seluruh sesi konsultasi di Solulu dijadwalkan dengan durasi penuh 90 menit melalui tautan Zoom terenkripsi yang dibuat otomatis oleh sistem untuk memastikan kedalaman pendampingan.
            </div>
            <div>
              <strong className="text-foreground text-sm block mb-1">
                3. Keabsahan Dokumen Profesi
              </strong>
              Mitra menjamin bahwa seluruh berkas (KTP, Ijazah, dan STR) adalah sah, aktif, dan diterbitkan oleh otoritas resmi yang berwenang. Pemalsuan dokumen berakibat pada pemutusan kemitraan seketika dan tindakan hukum.
            </div>
            <div>
              <strong className="text-foreground text-sm block mb-1">
                4. Batasan Ruang Lingkup Praktik
              </strong>
              Konselor sebaya tidak diperkenankan memberikan diagnosis klinis atau resep farmakoterapi, dan wajib merujuk kasus dengan indikasi risiko tinggi (skor SRQ-20 tinggi / ide bunuh diri) kepada psikolog klinis atau layanan krisis rujukan Solulu.
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setAgreeToTerms(true)
                setTermsModalOpen(false)
              }}
            >
              Saya Mengerti & Setuju
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
