"use client"

import * as React from "react"
import Image from "next/image"
import {
  User,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Plus,
  X,
  ShieldCheck,
  Camera,
  ExternalLink,
  Check,
  Tag,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { FieldGroup, Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field"
import {
  updateCounselorProfileAction,
  getPresignedUploadUrlAction,
} from "@/app/counselor/actions"
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

  const bioLength = bio.trim().length
  const isBioValid = bioLength >= 20
  const isTitleValid = title.trim().length >= 2
  const hasSpecializations = specializations.length > 0

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
        setStatusMessage({
          type: "success",
          text: "Profil profesional Anda berhasil diperbarui dan tampil di katalog publik Solulu.",
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
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Profil Profesional Mitra</h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
              {profile.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Kelola identitas, gelar, pendekatan konseling, topik keahlian, dan foto avatar publik Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2 text-xs h-9">
            <a href="/counselors" target="_blank" rel="noopener noreferrer">
              <span>Lihat Katalog Publik</span>
              <ExternalLink className="size-3" />
            </a>
          </Button>
        </div>
      </div>

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
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          <AlertTitle className="text-xs font-semibold">
            {statusMessage.type === "success" ? "Profil Diperbarui" : "Gagal Memperbarui"}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {statusMessage.text}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-4 border-b border-border/60">
            <CardTitle className="text-lg font-bold tracking-tight">Foto Profil & Gelar</CardTitle>
            <CardDescription className="text-xs">
              Foto akan ditampilkan di halaman booking pasien dan katalog konselor.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <FieldGroup className="flex flex-col gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="relative size-24 shrink-0">
                  <Avatar className="size-24 rounded-2xl border-2 border-border/80 shadow-xs after:rounded-2xl">
                    {avatarUrl ? (
                      <AvatarImage
                        src={avatarUrl}
                        alt={profile.fullName}
                        className="rounded-2xl object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="rounded-2xl bg-muted text-muted-foreground/60">
                      <User className="size-10" />
                    </AvatarFallback>
                  </Avatar>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 rounded-2xl bg-background/80 flex items-center justify-center z-20">
                      <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold">Unggah Foto Avatar Baru</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs relative overflow-hidden"
                      disabled={uploadingAvatar}
                    >
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleAvatarFile}
                        accept="image/png,image/jpeg,image/webp"
                        disabled={uploadingAvatar}
                        id="input-avatar"
                      />
                      <Camera className="size-3.5" />
                      <span>Pilih Foto Avatar (Maks. 5MB)</span>
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setAvatarUrl("")}
                      >
                        Hapus Foto
                      </Button>
                    )}
                  </div>
                  {uploadError && <span className="text-xs text-destructive">{uploadError}</span>}
                  <p className="text-xs text-muted-foreground">
                    Format didukung: JPG, PNG, atau WEBP. Disarankan foto portrait rasio 1:1.
                  </p>
                </div>
              </div>

              {/* Readonly Name & Editable Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                <Field>
                  <FieldLabel className="text-sm font-semibold">Nama Lengkap Terverifikasi</FieldLabel>
                  <Input value={profile.fullName} disabled className="bg-muted text-foreground font-medium" />
                  <FieldDescription className="text-xs">
                    Nama resmi terdaftar di STR/KTP (hubungi admin untuk perubahan nama).
                  </FieldDescription>
                </Field>

                <Field data-invalid={!!fieldErrors.title}>
                  <FieldLabel htmlFor="counselor-title" className="text-sm font-semibold">
                    Gelar / Sub-profesi <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="counselor-title"
                    placeholder="Contoh: Psikolog Klinis Dewasa / S.Psi"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-sm"
                    aria-invalid={!!fieldErrors.title}
                    required
                  />
                  {fieldErrors.title ? (
                    <FieldError className="text-xs">{fieldErrors.title[0]}</FieldError>
                  ) : (
                    <FieldDescription className="text-xs">
                      Gelar akademis atau spesialisasi utama yang disandang.
                    </FieldDescription>
                  )}
                </Field>
              </div>

              {/* Bio Field */}
              <Field data-invalid={!!fieldErrors.bio} className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="counselor-bio" className="text-sm font-semibold">
                    Bio & Pendekatan Konseling <span className="text-destructive">*</span>
                  </FieldLabel>
                  <span
                    className={`text-xs ${
                      isBioValid
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {bioLength} / 20 karakter min {isBioValid && "✓"}
                  </span>
                </div>
                <Textarea
                  id="counselor-bio"
                  rows={5}
                  placeholder="Ceritakan latar belakang pengalaman, metode konseling (CBT, ACT, Person-Centered), dan cara Anda menemani klien..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="resize-y text-sm"
                  aria-invalid={!!fieldErrors.bio}
                  required
                />
                {fieldErrors.bio && <FieldError className="text-xs">{fieldErrors.bio[0]}</FieldError>}
              </Field>

              {/* Topik Fokus & Spesialisasi dari Database Resmi */}
              <Field data-invalid={!!fieldErrors.specializations} className="pt-2 border-t border-border/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <FieldLabel className="text-sm font-semibold">
                        Topik Fokus & Spesialisasi <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Badge variant="outline" className="text-xs font-normal text-primary border-primary/20 bg-primary/5">
                        Database Resmi
                      </Badge>
                    </div>
                    <FieldDescription className="text-xs">
                      Pilih topik dari Database Fokus & Spesialisasi resmi Solulu seperti di halaman admin.
                    </FieldDescription>
                  </div>
                  <span className="text-xs font-medium text-primary tabular-nums shrink-0">
                    {specializations.length} topik terpilih
                  </span>
                </div>

                {/* Specialization Selection Chips from Database */}
                {isLoadingSpecs ? (
                  <div className="flex flex-wrap gap-2 pt-1" id="loading-specs-skeleton">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-7 w-28 bg-muted/70 animate-pulse rounded-md"
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
                          {isSelected ? <Check className="size-3" /> : <Tag className="size-3 opacity-60" />}
                          <span>{spec}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Active Chips / Terpasang di Profil */}
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
                            <span className="text-xs text-muted-foreground/80 italic">(Topik tersimpan)</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-destructive transition-colors ml-0.5"
                            title={`Hapus ${tag}`}
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

                {/* Info notice about official database */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground">
                  <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Topik spesialisasi disinkronkan langsung dengan Database Fokus & Spesialisasi. Konselor hanya dapat memilih topik yang telah disetujui. Apabila memerlukan topik spesialisasi baru yang belum tersedia, silakan ajukan kepada tim Admin Solulu.
                  </span>
                </div>

                {fieldErrors.specializations && (
                  <FieldError className="text-xs font-medium">{fieldErrors.specializations[0]}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="flex items-center justify-between gap-3 pt-6 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Perubahan profil akan segera diperbarui di katalog Solulu.
            </span>

            <Button
              type="submit"
              size="sm"
              className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
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
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
