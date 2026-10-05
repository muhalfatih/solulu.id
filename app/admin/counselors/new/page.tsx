"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  ArrowLeft,
  Upload,
  Copy,
  Check,
  Sparkles,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SOLULU_SPECIALIZATION_PRESETS,
  type CreateCounselorAdminInput,
} from "@/lib/validations/counselor-admin"
import {
  createCounselorAction,
  getAvatarUploadPresignedUrlAction,
} from "../actions"

export default function NewCounselorPage() {
  const router = useRouter()

  const [fullName, setFullName] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [education, setEducation] = React.useState("")
  const [counselorType, setCounselorType] = React.useState<"peer" | "psychologist">("peer")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isCopied, setIsCopied] = React.useState(false)
  const [bio, setBio] = React.useState("")
  const [selectedSpecs, setSelectedSpecs] = React.useState<string[]>([
    "Kecemasan & Stres",
    "Pengembangan Diri",
  ])
  const [customTagInput, setCustomTagInput] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState<string>("")
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [isActive, setIsActive] = React.useState(true)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // Generate random secure password
  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*"
    let res = ""
    for (let i = 0; i < 14; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(res)
    handleCopyPassword(res)
  }

  const handleCopyPassword = (textToCopy: string) => {
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2500)
  }

  const toggleSpec = (spec: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    )
  }

  const handleAddCustomTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return
    e.preventDefault()
    const trimmed = customTagInput.trim()
    if (!trimmed) return
    if (!selectedSpecs.includes(trimmed)) {
      setSelectedSpecs((prev) => [...prev, trimmed])
    }
    setCustomTagInput("")
  }

  const removeSpec = (spec: string) => {
    setSelectedSpecs((prev) => prev.filter((s) => s !== spec))
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Instant local preview
    const localPreview = URL.createObjectURL(file)
    setAvatarUrl(localPreview)

    setIsUploadingAvatar(true)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", "avatar")

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok || !uploadJson.success || !uploadJson.data?.publicUrl) {
        throw new Error(uploadJson.error || "Gagal mengunggah foto ke Cloudflare R2.")
      }

      setAvatarUrl(uploadJson.data.publicUrl)
    } catch (err: any) {
      console.warn("Direct upload error (using local preview fallback):", err.message)
      // Keep local preview for form submission demo
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (selectedSpecs.length === 0) {
      setErrorMessage("Pilih atau tambahkan minimal 1 topik spesialisasi.")
      return
    }

    setIsSubmitting(true)

    const payload: CreateCounselorAdminInput = {
      fullName,
      title,
      education,
      counselorType,
      email,
      password,
      bio,
      specializations: selectedSpecs,
      avatarR2Url: avatarUrl.startsWith("blob:") ? null : avatarUrl,
      isActive,
    }

    try {
      const result = await createCounselorAction(payload)
      if (!result.success) {
        setErrorMessage(result.error || "Gagal mendaftarkan mitra konselor.")
        setIsSubmitting(false)
        return
      }

      setSuccessMessage(
        `Mitra konselor ${fullName} berhasil didaftarkan. Mengalihkan ke direktori...`
      )
      setTimeout(() => {
        router.push("/admin/counselors")
      }, 1500)
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan sistem saat menyimpan data.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-20">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href="/admin/counselors"
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          <span>Data Konselor</span>
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground font-medium">Tambah Konselor Baru</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pendaftaran Mitra Konselor Baru
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Daftarkan mitra konselor resmi, tetapkan kredensial awal, dan terbitkan akun login dashboard mandiri.
        </p>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-destructive hover:opacity-80 p-1"
            aria-label="Tutup pesan error"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Section 1: Profil & Kualifikasi */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold text-foreground">Identitas & Gelar Profesi</h2>
              <p className="text-xs text-muted-foreground">Informasi publik yang ditampilkan pada katalog pasien.</p>
            </div>
            <Badge variant="outline" className="text-[11px] font-normal">
              Informasi Publik
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Circular Avatar Upload */}
            <div className="flex flex-col items-center gap-3 shrink-0 self-center md:self-start">
              <Avatar className="size-24 border-2 border-border shadow-xs">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Pratinjau Avatar" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {fullName ? fullName.slice(0, 2).toUpperCase() : "FOTO"}
                </AvatarFallback>
              </Avatar>

              <label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background hover:bg-muted/70 text-xs font-medium text-foreground transition-colors"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5 text-muted-foreground" />
                )}
                <span>{isUploadingAvatar ? "Mengunggah..." : "Unggah Foto"}</span>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleAvatarFileChange}
                />
              </label>
              <span className="text-[10px] text-muted-foreground text-center">JPG, PNG atau WebP (Maks 2MB)</span>
            </div>

            {/* Fields Grid */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="fullName" className="text-xs font-medium text-foreground">
                  Nama Lengkap & Gelar Profesi <span className="text-destructive">*</span>
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Contoh: Sarah Annisa, M.Psi., Psikolog atau Rian Hidayat, S.Psi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-medium text-foreground">
                  Peran / Jabatan Klinis <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Contoh: Psikolog Klinis Dewasa atau Konselor Sebaya Senior"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="counselorType" className="text-xs font-medium text-foreground">
                  Kategori Konselor <span className="text-destructive">*</span>
                </label>
                <Select
                  value={counselorType}
                  onValueChange={(val: "peer" | "psychologist") => setCounselorType(val)}
                >
                  <SelectTrigger id="counselorType" className="h-9 text-xs w-full">
                    <SelectValue placeholder="Pilih tipe konselor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="peer" className="text-xs">
                        Konselor Sebaya (Pendampingan Emosional)
                      </SelectItem>
                      <SelectItem value="psychologist" className="text-xs">
                        Psikolog Klinis (Intervensi Klinis & STR)
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="education" className="text-xs font-medium text-foreground">
                  Riwayat Pendidikan & Izin <span className="text-destructive">*</span>
                </label>
                <Input
                  id="education"
                  type="text"
                  placeholder="Contoh: S2 Profesi Psikologi • Izin Kemenkes STR Terverifikasi"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="bio" className="text-xs font-medium text-foreground">
                    Bio & Pendekatan Konseling <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {bio.length} / 2000 karakter
                  </span>
                </div>
                <Textarea
                  id="bio"
                  placeholder="Tuliskan latar belakang pendidikan, pengalaman, dan pendekatan konseling yang digunakan..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                  rows={4}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Topik & Spesialisasi */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold text-foreground">Topik Fokus & Spesialisasi</h2>
              <p className="text-xs text-muted-foreground">
                Pilih topik dari preset Solulu atau ketikkan tag topik kustom.
              </p>
            </div>
            <span className="text-xs font-medium text-primary tabular-nums">
              {selectedSpecs.length} topik terpilih
            </span>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-2">
            {SOLULU_SPECIALIZATION_PRESETS.map((preset) => {
              const active = selectedSpecs.includes(preset)
              return (
                <button
                  type="button"
                  key={preset}
                  onClick={() => toggleSpec(preset)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  {active && <Check className="size-3" />}
                  <span>{preset}</span>
                </button>
              )
            })}
          </div>

          {/* Custom Tag Input */}
          <div className="flex items-center gap-2 pt-2">
            <Input
              type="text"
              placeholder="Tambah topik lain (tekan Enter)..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              className="h-8 text-xs max-w-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomTag}
              className="h-8 px-3 text-xs"
            >
              <Plus className="size-3.5 mr-1" />
              Tambah Tag
            </Button>
          </div>

          {/* Active Chips Pill Display */}
          {selectedSpecs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60">
              <span className="text-[11px] text-muted-foreground self-center mr-1">Terpasang di profil:</span>
              {selectedSpecs.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-muted text-foreground font-medium"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => removeSpec(s)}
                    className="hover:text-destructive transition-colors ml-0.5"
                    aria-label={`Hapus topik ${s}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Akun Login & Kredensial */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <span>Kredensial Login Dashboard (/counselor)</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Kredensial dibuat langsung di Supabase Auth untuk memungkinkan konselor login dan mengelola jadwal.
              </p>
            </div>
            <Badge variant="outline" className="text-[11px] font-normal">
              Akses Rahasia
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-foreground">
                Alamat Email Login <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="konselor@solulu.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-foreground">
                  Password Awal <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="size-3" />
                  <span>Generate Password Acak</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <Input
                  id="password"
                  type="text"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-9 text-xs pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleCopyPassword(password)}
                  disabled={!password}
                  className="absolute right-1 size-7 text-muted-foreground hover:text-foreground"
                  aria-label="Salin password ke clipboard"
                  title="Salin password"
                >
                  {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
              {isCopied && (
                <span className="text-[10px] text-emerald-600 font-medium">
                  Password disalin ke clipboard! Siap dikirim ke mitra via WhatsApp atau email.
                </span>
              )}
            </div>
          </div>

          {/* Active practicing toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">Status Praktik Langsung Aktif</span>
              <p className="text-[11px] text-muted-foreground">
                Jika diaktifkan, profil akan langsung dapat menerima pemesanan sesi konseling.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Toggle status praktik" />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button asChild variant="outline" size="sm" className="h-9 text-xs">
            <Link href="/admin/counselors">Batal</Link>
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !fullName || !email || !password || !title || !bio}
            className="h-9 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 mr-2 animate-spin" />
                <span>Menyimpan & Menerbitkan Akun...</span>
              </>
            ) : (
              <>
                <UserCheck className="size-3.5 mr-2" />
                <span>Daftarkan Mitra Konselor</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
