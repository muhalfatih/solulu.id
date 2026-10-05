"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ChevronRight,
  ArrowLeft,
  Upload,
  Check,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Loader2,
  Pencil,
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
  type UpdateCounselorAdminInput,
} from "@/lib/validations/counselor-admin"
import {
  getCounselorByIdAction,
  updateCounselorAction,
  getAvatarUploadPresignedUrlAction,
} from "../../actions"

export default function EditCounselorPage() {
  const params = useParams()
  const router = useRouter()
  const counselorId = String(params.id)

  const [isLoading, setIsLoading] = React.useState(true)
  const [fullName, setFullName] = React.useState("")
  const [title, setTitle] = React.useState("")
  const [counselorType, setCounselorType] = React.useState<"peer" | "psychologist">("peer")
  const [bio, setBio] = React.useState("")
  const [selectedSpecs, setSelectedSpecs] = React.useState<string[]>([])
  const [customTagInput, setCustomTagInput] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState<string>("")
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [isActive, setIsActive] = React.useState(true)

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  // Load counselor data
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const res = await getCounselorByIdAction(counselorId)
        if (res.success && res.data) {
          const c = res.data
          setFullName(c.fullName || "")
          setTitle(c.title || "")
          setCounselorType(c.counselorType || "peer")
          setBio(c.bio || "")
          setSelectedSpecs(c.specializations || [])
          setAvatarUrl(c.avatarR2Url || "")
          setIsActive(c.isActive ?? true)
        } else {
          // If not in database, attempt fallback to mock data or demo
          setFullName("Mitra Konselor")
          setTitle("S.Psi")
          setCounselorType("peer")
          setBio("Konselor berpengalaman dalam pendampingan klinis dan konseling sebaya.")
          setSelectedSpecs(["Kecemasan & Stres", "Pengembangan Diri"])
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Gagal memuat profil konselor.")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [counselorId])

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

    const localPreview = URL.createObjectURL(file)
    setAvatarUrl(localPreview)

    setIsUploadingAvatar(true)
    setErrorMessage(null)

    try {
      const res = await getAvatarUploadPresignedUrlAction(file.name, file.type)
      if (!res.success || !res.data) {
        throw new Error(res.error || "Gagal mendapatkan izin unggah gambar.")
      }

      const uploadRes = await fetch(res.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error("Gagal mengunggah foto ke Cloudflare R2.")
      }

      setAvatarUrl(res.data.publicUrl)
    } catch (err: any) {
      console.warn("Direct upload error (using local preview fallback):", err.message)
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

    const payload: UpdateCounselorAdminInput = {
      fullName,
      title,
      counselorType,
      bio,
      specializations: selectedSpecs,
      avatarR2Url: avatarUrl.startsWith("blob:") ? null : avatarUrl,
      isActive,
    }

    try {
      const result = await updateCounselorAction(counselorId, payload)
      if (!result.success) {
        setErrorMessage(result.error || "Gagal memperbarui data konselor.")
        setIsSubmitting(false)
        return
      }

      setSuccessMessage("Profil konselor berhasil diperbarui. Mengalihkan ke direktori...")
      setTimeout(() => {
        router.push("/admin/counselors")
      }, 1500)
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan sistem saat menyimpan pembaruan.")
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground text-xs">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span>Memuat data konselor...</span>
      </div>
    )
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
        <span className="text-foreground font-medium">Edit Profil Konselor</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit Profil Mitra Konselor
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Perbarui gelar profesi, biografi, spesialisasi layanan, atau ubah status praktik konselor.
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

      {/* Main Edit Form */}
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
                <span>{isUploadingAvatar ? "Mengunggah..." : "Ubah Foto"}</span>
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
                  Nama Lengkap <span className="text-destructive">*</span>
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Contoh: Sarah Annisa"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-medium text-foreground">
                  Gelar / Kualifikasi Profesi <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Contoh: S.Psi atau M.Psi., Psikolog"
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

        {/* Section 3: Status Praktik */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-foreground">Status Praktik Konselor</span>
              <p className="text-xs text-muted-foreground">
                Jika dinonaktifkan (ditangguhkan), slot jadwal konselor tidak akan dapat dipesan oleh pasien di katalog.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }`}
              >
                {isActive ? "Praktik Aktif" : "Ditangguhkan"}
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Toggle status praktik" />
            </div>
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
            disabled={isSubmitting || !fullName || !title || !bio}
            className="h-9 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 mr-2 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Pencil className="size-3.5 mr-2" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
