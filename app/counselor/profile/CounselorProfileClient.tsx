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
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  updateCounselorProfileAction,
  getPresignedUploadUrlAction,
} from "@/app/counselor/actions"
import type { CounselorProfileView } from "@/lib/counselor/types"

interface CounselorProfileClientProps {
  initialProfile: CounselorProfileView
}

const COMMON_SPECIALIZATIONS = [
  "Kecemasan (Anxiety)",
  "Depresi Ringan-Sedang",
  "Burnout & Stres Kerja",
  "Quarter-life Crisis",
  "Relasi & Pasangan",
  "Pengembangan Diri",
  "Trauma & Regulasi Emosi",
  "Manajemen Amarah",
]

export function CounselorProfileClient({ initialProfile }: CounselorProfileClientProps) {
  const [profile, setProfile] = React.useState<CounselorProfileView>(initialProfile)
  const [title, setTitle] = React.useState(profile.title || "")
  const [bio, setBio] = React.useState(profile.bio || "")
  const [specializations, setSpecializations] = React.useState<string[]>(
    profile.specializations || []
  )
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatarR2Url || "")
  const [customTagInput, setCustomTagInput] = React.useState("")

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

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (!specializations.includes(trimmed)) {
      setSpecializations((prev) => [...prev, trimmed])
    }
    setCustomTagInput("")
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
        <div
          role="alert"
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-4 border-b border-border/60">
            <CardTitle className="text-lg font-bold tracking-tight">Foto Profil & Gelar</CardTitle>
            <CardDescription className="text-xs">
              Foto akan ditampilkan di halaman booking pasien dan katalog konselor.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 flex flex-col gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative size-24 rounded-2xl overflow-hidden bg-muted border-2 border-border/80 shrink-0 flex items-center justify-center shadow-xs">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="size-10 text-muted-foreground/60" />
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
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
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-semibold">Nama Lengkap Terverifikasi</Label>
                <Input value={profile.fullName} disabled className="bg-muted text-foreground font-medium" />
                <p className="text-xs text-muted-foreground">
                  Nama resmi terdaftar di STR/KTP (hubungi admin untuk perubahan nama).
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="counselor-title" className="text-sm font-semibold">
                  Gelar / Sub-profesi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="counselor-title"
                  placeholder="Contoh: Psikolog Klinis Dewasa / S.Psi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`text-sm ${fieldErrors.title ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  required
                />
                {fieldErrors.title ? (
                  <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Gelar akademis atau spesialisasi utama yang disandang.
                  </p>
                )}
              </div>
            </div>

            {/* Bio Field */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label htmlFor="counselor-bio" className="text-sm font-semibold">
                  Bio & Pendekatan Konseling <span className="text-destructive">*</span>
                </Label>
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
                className={`resize-y text-sm ${fieldErrors.bio ? "border-destructive focus-visible:ring-destructive" : ""}`}
                required
              />
              {fieldErrors.bio && <p className="text-xs text-destructive">{fieldErrors.bio[0]}</p>}
            </div>

            {/* Specializations Tags */}
            <div className="flex flex-col gap-3 pt-2 border-t border-border/60">
              <div className="flex flex-col gap-1">
                <Label className="text-sm font-semibold">
                  Topik Spesialisasi & Isu yang Ditangani <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pilih dari rekomendasi atau tambahkan topik khusus yang menjadi fokus praktik Anda.
                </p>
              </div>

              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2 min-h-8 p-3 rounded-lg border border-border/80 bg-muted/20">
                {specializations.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    Belum ada topik spesialisasi yang dipilih.
                  </span>
                ) : (
                  specializations.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1.5 py-1 px-2.5 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full hover:bg-primary/30 p-0.5"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              {fieldErrors.specializations && (
                <p className="text-xs text-destructive">{fieldErrors.specializations[0]}</p>
              )}

              {/* Add Custom Tag */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ketik topik baru lalu tekan tambah..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag(customTagInput)
                    }
                  }}
                  className="text-xs h-9"
                  id="input-custom-specialization"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-9 shrink-0"
                  onClick={() => handleAddTag(customTagInput)}
                  disabled={!customTagInput.trim()}
                  id="btn-add-specialization"
                >
                  <Plus className="size-3.5" />
                  <span>Tambah</span>
                </Button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-xs text-muted-foreground font-medium">Saran Topik Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SPECIALIZATIONS.map((suggestion) => {
                    const isSelected = specializations.includes(suggestion)
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                          isSelected ? handleRemoveTag(suggestion) : handleAddTag(suggestion)
                        }
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                          isSelected
                            ? "bg-primary/15 text-primary border-primary/30 font-medium"
                            : "bg-background text-muted-foreground border-border/70 hover:border-foreground/30 hover:text-foreground"
                        }`}
                      >
                        {isSelected ? `✓ ${suggestion}` : `+ ${suggestion}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
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
