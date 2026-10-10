"use client"

import * as React from "react"
import {
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  ShieldCheck,
  Camera,
  ExternalLink,
  Check,
  Tag,
  Circle,
  Lock,
  Key,
  Mail,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { FieldGroup, Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field"
import { updateCounselorProfileAction, updateCounselorPasswordAction } from "@/app/counselor/actions"
import { getActiveSpecializationsAction } from "@/app/admin/specializations/actions"
import { SOLULU_SPECIALIZATION_PRESETS } from "@/lib/validations/counselor-admin"
import type { CounselorProfileView } from "@/lib/counselor/types"

interface CounselorProfileClientProps {
  initialProfile: CounselorProfileView
  availableSpecializations?: string[]
}

export function CounselorProfileClient({
  initialProfile,
  availableSpecializations,
}: CounselorProfileClientProps) {
  const [profile, setProfile] = React.useState<CounselorProfileView>(initialProfile)
  const [title, setTitle] = React.useState(profile.title || "")
  const [bio, setBio] = React.useState(profile.bio || "")
  const [specializations, setSpecializations] = React.useState<string[]>(
    profile.specializations || []
  )
  const [availableSpecs, setAvailableSpecs] = React.useState<string[]>(
    availableSpecializations && availableSpecializations.length > 0
      ? availableSpecializations
      : [...SOLULU_SPECIALIZATION_PRESETS]
  )
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatarR2Url || "")

  const [isLoadingSpecs, setIsLoadingSpecs] = React.useState(
    !availableSpecializations || availableSpecializations.length === 0
  )

  // Sync active specializations from database on mount
  React.useEffect(() => {
    async function loadSpecs() {
      try {
        const res = await getActiveSpecializationsAction()
        if (res.success && res.data && res.data.length > 0) {
          setAvailableSpecs(res.data.map((s: any) => s.name))
        }
      } catch {
        // Fallback to initial
      } finally {
        setIsLoadingSpecs(false)
      }
    }
    loadSpecs()
  }, [])

  const [uploadingAvatar, setUploadingAvatar] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({})

  // Security & Password state
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState(false)
  const [passwordFeedback, setPasswordFeedback] = React.useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordFeedback(null)

    if (newPassword.trim().length < 8) {
      setPasswordFeedback({
        type: "error",
        text: "Kata sandi baru minimal 8 karakter.",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        text: "Konfirmasi kata sandi tidak cocok.",
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const res = await updateCounselorPasswordAction(newPassword)
      if (!res.success) {
        setPasswordFeedback({
          type: "error",
          text: res.error || "Gagal memperbarui kata sandi.",
        })
      } else {
        setPasswordFeedback({
          type: "success",
          text: "Kata sandi akun Anda berhasil diperbarui. Gunakan kata sandi ini untuk sesi login berikutnya.",
        })
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: "error",
        text: err.message || "Terjadi kesalahan saat memperbarui kata sandi.",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const bioLength = bio.trim().length
  const isBioValid = bioLength >= 20
  const isTitleValid = title.trim().length >= 2
  const hasSpecializations = specializations.length > 0

  // Completeness Telemetry
  const completenessCriteria = React.useMemo(
    () => [
      {
        label: "Foto Avatar Terpasang",
        isComplete: Boolean(avatarUrl),
        detail: avatarUrl ? "Foto profil aktif" : "Belum diunggah",
      },
      {
        label: "Gelar & Sub-profesi",
        isComplete: isTitleValid,
        detail: isTitleValid ? title : "Minimal 2 karakter",
      },
      {
        label: "Bio & Pendekatan",
        isComplete: isBioValid,
        detail: isBioValid ? `${bioLength} karakter` : "Minimal 20 karakter",
      },
      {
        label: "Topik Spesialisasi",
        isComplete: hasSpecializations,
        detail: hasSpecializations ? `${specializations.length} topik aktif` : "Belum ada topik",
      },
    ],
    [avatarUrl, isTitleValid, title, isBioValid, bioLength, hasSpecializations, specializations.length]
  )

  const completedCount = completenessCriteria.filter((c) => c.isComplete).length
  const completenessPercentage = Math.round((completedCount / completenessCriteria.length) * 100)

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran foto profil maksimal 5 MB.")
      return
    }

    setUploadingAvatar(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", "avatar")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || !data.success || !data.data?.publicUrl) {
        throw new Error(data.error || `Upload avatar gagal (Status: ${res.status})`)
      }

      setAvatarUrl(data.data.publicUrl)
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengunggah foto profil.")
    } finally {
      setUploadingAvatar(false)
      e.target.value = ""
    }
  }

  const toggleSpec = (spec: string) => {
    setSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSpecializations((prev) => prev.filter((t) => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setStatusMessage(null)
    setFieldErrors({})

    try {
      const res = await updateCounselorProfileAction({
        title,
        bio,
        specializations,
        avatarR2Url: avatarUrl || null,
      })

      if (res.success) {
        setProfile((prev) => ({
          ...prev,
          title,
          bio,
          specializations,
          avatarR2Url: avatarUrl || null,
        }))
        setStatusMessage({
          type: "success",
          text: "Profil profesional Anda berhasil diperbarui dan segera tampil di katalog publik Solulu.",
        })
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Gagal memperbarui profil. Periksa formulir Anda.",
        })
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors)
        }
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Terjadi kesalahan jaringan saat menyimpan profil.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Profil Profesional Mitra</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
              <span>{profile.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Kelola foto avatar publik, kredensial klinis, pendekatan terapi, dan topik keahlian resmi Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs h-9 cursor-pointer">
            <a href="/counselors" target="_blank" rel="noopener noreferrer">
              <span>Lihat Katalog Publik</span>
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      {/* Alert Feedback */}
      {statusMessage && (
        <Alert
          variant={statusMessage.type === "success" ? "default" : "destructive"}
          className={
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : ""
          }
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <AlertTitle className="text-xs font-semibold">
            {statusMessage.type === "success" ? "Profil Diperbarui" : "Gagal Memperbarui"}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {statusMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Main 2-Column Responsive Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Avatar, Identity, Completeness Telemetry (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card: Avatar & Public Identity */}
          <Card className="border border-border/70 shadow-xs bg-card">
            <CardHeader className="p-6 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">Foto Avatar Publik</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Tampil di katalog konselor dan halaman pemesanan pasien.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="relative size-32 rounded-xl border-2 border-border/70 overflow-hidden bg-muted/40 shadow-2xs">
                <Avatar className="size-full rounded-none">
                  {avatarUrl ? (
                    <AvatarImage
                      src={avatarUrl}
                      alt={profile.fullName}
                      className="size-full object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="size-full rounded-none bg-muted text-muted-foreground/60 flex items-center justify-center">
                    <User className="size-12" aria-hidden="true" />
                  </AvatarFallback>
                </Avatar>

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-1.5 z-20">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-[11px] font-medium text-foreground">Mengunggah...</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-bold text-foreground">{profile.fullName}</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Mitra Terverifikasi</span>
                </span>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2 border-t border-border/60">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="input-avatar"
                    className={`inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer select-none ${
                      uploadingAvatar ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <Camera className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <span>{avatarUrl ? "Ganti Foto Avatar" : "Pilih Foto Avatar"}</span>
                    <input
                      type="file"
                      id="input-avatar"
                      className="sr-only"
                      onChange={handleAvatarFile}
                      accept="image/png,image/jpeg,image/webp"
                      disabled={uploadingAvatar}
                    />
                  </label>

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-muted-foreground hover:text-destructive cursor-pointer"
                      onClick={() => setAvatarUrl("")}
                    >
                      Hapus Foto
                    </Button>
                  )}
                </div>

                {uploadError && (
                  <span className="text-xs text-destructive text-left">{uploadError}</span>
                )}

                <p className="text-[11px] text-muted-foreground text-left leading-relaxed">
                  Format: JPG, PNG, atau WEBP. Maksimal 5 MB. Disarankan foto potret rasio 1:1.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card: Completeness Telemetry */}
          <Card className="border border-border/70 shadow-xs bg-card">
            <CardHeader className="p-6 pb-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground">Kelengkapan Profil</CardTitle>
                <span className="text-xs font-bold tabular-nums text-foreground">
                  {completenessPercentage}%
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Kesiapan informasi sebelum sesi dapat dipesan pasien.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 flex flex-col gap-4">
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${completenessPercentage}%` }}
                />
              </div>

              {/* Checklist Items */}
              <div className="flex flex-col gap-2.5">
                {completenessCriteria.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {item.isComplete ? (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={item.isComplete ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {item.detail}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Credentials, Bio, Specializations, Save Button (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card: Kredensial & Pendekatan Klinis */}
          <Card className="border border-border/70 shadow-xs bg-card">
            <CardHeader className="p-6 pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">
                Kredensial & Pendekatan Konseling
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Informasi gelar akademis dan modalitas terapi yang Anda gunakan.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 flex flex-col gap-5">
              <FieldGroup className="flex flex-col gap-5">
                {/* Readonly Name, Email & Editable Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Nama Lengkap Resmi
                    </FieldLabel>
                    <Input
                      value={profile.fullName}
                      disabled
                      className="bg-muted text-foreground font-medium text-sm h-10 cursor-not-allowed"
                    />
                    <FieldDescription className="text-xs text-muted-foreground">
                      Terdaftar di STR/KTP (hubungi admin untuk perubahan).
                    </FieldDescription>
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <span>Email Login Portal</span>
                      </FieldLabel>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Terverifikasi
                      </span>
                    </div>
                    <Input
                      value={profile.email || "-"}
                      disabled
                      className="bg-muted text-foreground font-mono text-sm h-10 cursor-not-allowed select-all"
                    />
                    <FieldDescription className="text-xs text-muted-foreground">
                      Akun kredensial resmi untuk masuk ke portal konselor Solulu.
                    </FieldDescription>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Field data-invalid={!!fieldErrors.title}>
                    <FieldLabel
                      htmlFor="counselor-title"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Gelar / Sub-profesi <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Input
                      id="counselor-title"
                      placeholder="Contoh: Psikolog Klinis Dewasa / S.Psi"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-sm h-10"
                      aria-invalid={!!fieldErrors.title}
                      required
                    />
                    {fieldErrors.title ? (
                      <FieldError className="text-xs">{fieldErrors.title[0]}</FieldError>
                    ) : (
                      <FieldDescription className="text-xs text-muted-foreground">
                        Gelar akademis atau spesialisasi utama yang disandang di katalog publik.
                      </FieldDescription>
                    )}
                  </Field>
                </div>

                {/* Bio Field */}
                <Field data-invalid={!!fieldErrors.bio} className="pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between pb-1">
                    <FieldLabel
                      htmlFor="counselor-bio"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Bio & Pendekatan Konseling <span className="text-destructive">*</span>
                    </FieldLabel>
                    <span
                      className={`text-xs tabular-nums font-mono ${
                        isBioValid
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {bioLength} / 20 karakter min {isBioValid && "✓"}
                    </span>
                  </div>
                  <Textarea
                    id="counselor-bio"
                    rows={5}
                    placeholder="Ceritakan latar belakang pengalaman, metode konseling (seperti CBT, ACT, Person-Centered), dan cara Anda menemani klien..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="resize-y text-sm leading-relaxed"
                    aria-invalid={!!fieldErrors.bio}
                    required
                  />
                  {fieldErrors.bio ? (
                    <FieldError className="text-xs">{fieldErrors.bio[0]}</FieldError>
                  ) : (
                    <FieldDescription className="text-xs text-muted-foreground">
                      Jelaskan orientasi teoritis dan suasana sesi konseling agar klien merasa aman dan terarah.
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Card: Topik Fokus & Spesialisasi */}
          <Card className="border border-border/70 shadow-xs bg-card">
            <CardHeader className="p-6 pb-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-foreground">
                    Topik Fokus & Spesialisasi
                  </CardTitle>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-primary bg-primary/10 border border-primary/20">
                    Database Resmi
                  </span>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  Pilih topik resmi yang relevan dengan ranah keahlian praktik Anda.
                </CardDescription>
              </div>

              <span className="text-xs font-semibold text-primary tabular-nums shrink-0">
                {specializations.length} topik terpilih
              </span>
            </CardHeader>

            <CardContent className="p-6 flex flex-col gap-5">
              {/* Available Database Specialization Chips */}
              {isLoadingSpecs ? (
                <div className="flex flex-wrap gap-2 pt-1" id="loading-specs-skeleton">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-8 w-28 bg-muted/70 animate-pulse rounded-md"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableSpecs.map((spec) => {
                    const isSelected = specializations.includes(spec)
                    return (
                      <button
                        type="button"
                        key={spec}
                        aria-pressed={isSelected}
                        onClick={() => toggleSpec(spec)}
                        className={`text-xs px-3 py-1.5 rounded-md border transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-medium shadow-2xs"
                            : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                        }`}
                        id={`spec-chip-${spec.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        {isSelected ? (
                          <Check className="size-3" aria-hidden="true" />
                        ) : (
                          <Tag className="size-3 opacity-60" aria-hidden="true" />
                        )}
                        <span>{spec}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Active Selection Chips Summary */}
              {specializations.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/60">
                  <span className="text-xs text-muted-foreground font-medium mr-1">
                    Terpasang di profil:
                  </span>
                  {specializations.map((tag) => {
                    const isOfficial = availableSpecs.includes(tag)
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-muted text-foreground font-medium border border-border/60"
                      >
                        <span>{tag}</span>
                        {!isOfficial && (
                          <span className="text-[11px] text-muted-foreground/80 italic">
                            (Topik tersimpan)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                          aria-label={`Hapus topik ${tag}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Minimal pilih 1 topik spesialisasi dari database di atas untuk profil Anda.</span>
                </div>
              )}

              {/* Information Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">
                  Topik spesialisasi disinkronkan langsung dengan Database Resmi Solulu. Apabila Anda memiliki fokus penanganan khusus yang belum terdaftar, silakan ajukan penambahan topik ke tim Admin Solulu.
                </span>
              </div>

              {fieldErrors.specializations && (
                <FieldError className="text-xs font-medium">{fieldErrors.specializations[0]}</FieldError>
              )}
            </CardContent>
          </Card>

          {/* Card: Keamanan Akun & Perubahan Kata Sandi */}
          <Card className="border border-border/70 shadow-xs bg-card">
            <CardHeader className="p-6 pb-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-foreground">
                    Keamanan & Kata Sandi Akun
                  </CardTitle>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20">
                    Supabase Auth
                  </span>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  Perbarui kata sandi sementara Anda untuk memastikan keamanan akses portal konselor.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex flex-col gap-5">
              {passwordFeedback && (
                <Alert
                  className={`text-xs ${
                    passwordFeedback.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      : "border-destructive/30 bg-destructive/10 text-destructive"
                  }`}
                >
                  {passwordFeedback.type === "success" ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-4 text-destructive" />
                  )}
                  <AlertTitle className="text-xs font-semibold">
                    {passwordFeedback.type === "success" ? "Berhasil Diperbarui" : "Kendala Pembaruan"}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {passwordFeedback.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-password-input" className="text-xs font-semibold">
                    Kata Sandi Baru
                  </Label>
                  <Input
                    id="new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="text-xs font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirm-password-input" className="text-xs font-semibold">
                    Konfirmasi Kata Sandi Baru
                  </Label>
                  <Input
                    id="confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-muted-foreground">
                  Gunakan kombinasi huruf, angka, dan karakter khusus agar akun Anda aman.
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUpdatePassword}
                  disabled={isUpdatingPassword || newPassword.length < 8 || confirmPassword.length < 8}
                  className="gap-2 text-xs h-9 cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Memperbarui...</span>
                    </>
                  ) : (
                    <>
                      <Key className="size-3.5" />
                      <span>Perbarui Kata Sandi</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar Card */}
          <Card className="border border-border/70 shadow-xs bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground leading-relaxed">
              Perubahan profil akan segera diperbarui di katalog publik Solulu.
            </span>

            <Button
              type="submit"
              size="sm"
              className="gap-2 text-xs font-medium h-9 shrink-0 cursor-pointer"
              disabled={submitting || !isBioValid || !isTitleValid || !hasSpecializations}
              id="btn-save-profile"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}
