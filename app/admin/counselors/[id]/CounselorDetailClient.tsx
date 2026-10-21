"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  GraduationCap,
  Award,
  Calendar,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Eye,
  Download,
  ExternalLink,
  RefreshCw,
  Building2,
  DollarSign,
  TrendingUp,
  Sparkles,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  updateCounselorVerificationStatusAction,
  toggleCounselorActiveAction,
  toggleFeaturedCounselorAction,
} from "../actions"

export interface CounselorAttachment {
  type: string
  name: string
  category: string
  url: string | null
  r2Key: string | null
  isUploaded: boolean
  isPublic: boolean
}

export interface CounselorDetailData {
  id: string
  userId: string
  fullName: string
  title: string
  email: string
  phone: string
  domicile?: string | null
  counselorType: "peer" | "psychologist"
  education?: string | null
  experienceYears?: number | null
  bio: string
  specializations?: string[] | null
  himpsiNumber?: string | null
  customFeeRate?: string | number | null
  counselorCommissionRate?: string | number | null
  sippNumber?: string | null
  sippExpiresAt?: string | null
  strNumber?: string | null
  strExpiresAt?: string | null
  avatarR2Url?: string | null
  verificationStatus: "verified" | "pending" | "rejected"
  weeklySlotTarget?: number | null
  isActive: boolean
  isFeatured: boolean
  createdAt: string | Date
  radar: {
    hasRadarAlert: boolean
    alertSeverity: "critical" | "warning" | null
    alertMessage: string | null
    strStatus: {
      status: string
      daysRemaining: number | null
      isExpiringSoon: boolean
      isExpired: boolean
      label: string
      formattedDate: string | null
      badgeVariant: "destructive" | "warning" | "default" | "secondary" | "outline"
    }
    sippStatus: {
      status: string
      daysRemaining: number | null
      isExpiringSoon: boolean
      isExpired: boolean
      label: string
      formattedDate: string | null
      badgeVariant: "destructive" | "warning" | "default" | "secondary" | "outline"
    }
  }
  attachments: CounselorAttachment[]
}

interface CounselorDetailClientProps {
  initialCounselor: CounselorDetailData
}

export function CounselorDetailClient({ initialCounselor }: CounselorDetailClientProps) {
  const router = useRouter()
  const [counselor, setCounselor] = React.useState<CounselorDetailData>(initialCounselor)
  const [isActionPending, setIsActionPending] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc?: string; type?: "success" | "error" } | null>(null)

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = React.useState<{
    title: string
    url: string
    isImage: boolean
  } | null>(null)

  // Rejection Confirmation Dialog
  const [showRejectDialog, setShowRejectDialog] = React.useState(false)

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, desc, type })
    setTimeout(() => setToastMessage(null), 4500)
  }

  const handleVerify = async () => {
    setIsActionPending(true)
    try {
      const res = await updateCounselorVerificationStatusAction(counselor.id, "verified")
      if (res.success) {
        setCounselor((prev) => ({
          ...prev,
          verificationStatus: "verified",
          isActive: true,
        }))
        showToast("Konselor Berhasil Diverifikasi", "Kredensial disetujui dan status praktik telah diaktifkan.")
        router.refresh()
      } else {
        showToast("Gagal Memverifikasi", res.error || "Terjadi kesalahan.", "error")
      }
    } catch (err: any) {
      showToast("Gagal Memverifikasi", err.message, "error")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleReject = async () => {
    setIsActionPending(true)
    try {
      const res = await updateCounselorVerificationStatusAction(counselor.id, "rejected")
      if (res.success) {
        setCounselor((prev) => ({
          ...prev,
          verificationStatus: "rejected",
          isActive: false,
        }))
        setShowRejectDialog(false)
        showToast("Konselor Ditolak", "Aplikasi ditolak dan status praktik ditangguhkan.")
        router.refresh()
      } else {
        showToast("Gagal Menolak", res.error || "Terjadi kesalahan.", "error")
      }
    } catch (err: any) {
      showToast("Gagal Menolak", err.message, "error")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleToggleActive = async () => {
    setIsActionPending(true)
    const nextState = !counselor.isActive
    try {
      const res = await toggleCounselorActiveAction(counselor.id, nextState)
      if (res.success) {
        setCounselor((prev) => ({ ...prev, isActive: nextState }))
        showToast(
          nextState ? "Praktik Diaktifkan" : "Praktik Ditangguhkan",
          `Status praktik untuk ${counselor.fullName} telah diperbarui.`
        )
        router.refresh()
      } else {
        showToast("Gagal Mengubah Status", res.error || "Terjadi kesalahan.", "error")
      }
    } catch (err: any) {
      showToast("Gagal Mengubah Status", err.message, "error")
    } finally {
      setIsActionPending(false)
    }
  }

  const handleToggleFeatured = async () => {
    const nextState = !counselor.isFeatured
    try {
      const res = await toggleFeaturedCounselorAction(counselor.id, nextState)
      if (res.success) {
        setCounselor((prev) => ({ ...prev, isFeatured: nextState }))
        showToast(
          nextState ? "Ditampilkan di Homepage" : "Dilepas dari Homepage",
          `Status unggulan beranda diperbarui.`
        )
        router.refresh()
      } else {
        showToast("Gagal Mengubah Status", res.error || "Terjadi kesalahan.", "error")
      }
    } catch (err: any) {
      showToast("Gagal Mengubah Status", err.message, "error")
    }
  }

  const isPsychologist = counselor.counselorType === "psychologist"
  const radar = counselor.radar

  const formatCurrency = (val?: string | number | null) => {
    if (!val) return "Tarif Standar Platform"
    const num = Number(val)
    return isNaN(num) ? String(val) : `Rp ${num.toLocaleString("id-ID")}`
  }

  const registeredDateFormatted = new Date(counselor.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-20">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-border shadow-xl animate-in fade-in flex items-start gap-3 max-w-md">
          {toastMessage.type === "error" ? (
            <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">{toastMessage.title}</p>
            {toastMessage.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{toastMessage.desc}</p>}
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/counselors">Direktori Konselor</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{counselor.fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Top Banner: Automated STR/SIPP Expiry Radar Warning (< 60 Days) */}
      {isPsychologist && radar.hasRadarAlert && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            radar.alertSeverity === "critical"
              ? "bg-destructive/10 border-destructive/30 text-destructive"
              : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                radar.alertSeverity === "critical"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              }`}
            >
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Radar Peringatan Kredensial Izin Praktik Kemenkes
                </span>
                <Badge
                  variant={radar.alertSeverity === "critical" ? "destructive" : "warning"}
                  className="text-[10px] uppercase font-bold"
                >
                  {radar.alertSeverity === "critical" ? "Tindakan Mendesak" : "Perhatian Khusus"}
                </Badge>
              </div>
              <p className="text-sm font-semibold mt-0.5">{radar.alertMessage}</p>
              <p className="text-xs opacity-90 mt-1">
                Kredensial izin praktik resmi (STR / SIPP) mendekati masa kedaluwarsa (&lt; 60 hari) atau telah kedaluwarsa.
                Segera hubungi konselor untuk pembaruan dokumen registrasi agar sesi konsultasi klinis tetap sah secara hukum.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-xs bg-background/80 hover:bg-background border-current font-medium cursor-pointer"
            >
              <a href={`https://wa.me/${counselor.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                <Phone className="size-3.5 mr-1.5" />
                Hubungi via WA
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <Card className="border-border/60 overflow-hidden shadow-xs">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <Avatar className="size-16 rounded-2xl border-2 border-border/80 shrink-0">
              {counselor.avatarR2Url ? (
                <AvatarImage src={counselor.avatarR2Url} alt={counselor.fullName} className="object-cover" />
              ) : null}
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                {counselor.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{counselor.fullName}</h1>
                <Badge
                  variant={isPsychologist ? "default" : "secondary"}
                  className="text-[11px] font-semibold px-2 py-0.5"
                >
                  {isPsychologist ? "Psikolog Klinis" : "Konselor Sebaya"}
                </Badge>

                {/* Verification Badge */}
                {counselor.verificationStatus === "verified" ? (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold gap-1">
                    <CheckCircle2 className="size-3" />
                    Terverifikasi
                  </Badge>
                ) : counselor.verificationStatus === "pending" ? (
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold gap-1">
                    <Clock className="size-3" />
                    Pending Verifikasi
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[11px] font-semibold gap-1">
                    <XCircle className="size-3" />
                    Aplikasi Ditolak
                  </Badge>
                )}

                {/* Active Practice Status Badge */}
                <Badge
                  variant="outline"
                  className={
                    counselor.isActive
                      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-[11px]"
                      : "border-muted-foreground/30 text-muted-foreground bg-muted text-[11px]"
                  }
                >
                  <span
                    className={`size-1.5 rounded-full mr-1.5 ${
                      counselor.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                    }`}
                  />
                  {counselor.isActive ? "Praktik Aktif" : "Ditangguhkan"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span>{counselor.title}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="size-3.5" />
                  {counselor.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="size-3.5" />
                  {counselor.phone}
                </span>
                {counselor.domicile && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {counselor.domicile}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {counselor.verificationStatus === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={handleVerify}
                  disabled={isActionPending}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-semibold text-xs"
                >
                  <CheckCircle2 className="size-3.5" />
                  Verifikasi Mitra
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isActionPending}
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer font-medium text-xs"
                >
                  <XCircle className="size-3.5" />
                  Tolak
                </Button>
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleActive}
              disabled={isActionPending}
              className="gap-1.5 text-xs font-medium cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isActionPending ? "animate-spin" : ""}`} />
              {counselor.isActive ? "Tangguhkan Praktik" : "Aktifkan Praktik"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleFeatured}
              className="gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Sparkles className={`size-3.5 ${counselor.isFeatured ? "text-amber-500 fill-amber-500" : ""}`} />
              {counselor.isFeatured ? "Lepas Beranda" : "Jadikan Unggulan"}
            </Button>

            <Button asChild size="sm" variant="default" className="gap-1.5 text-xs font-medium">
              <Link href={`/admin/counselors/${counselor.id}/edit`}>
                <Pencil className="size-3.5" />
                Edit Profil
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid: 21 Data Fields in Structural Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Informasi Kontak & Domisili (5 Fields) */}
        <Card className="border-border/60 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Identitas & Kontak</CardTitle>
            </div>
            <CardDescription className="text-xs">Data profil dasar dan kontak operasional</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Nama Lengkap & Gelar</span>
              <span className="font-semibold text-foreground text-sm">{counselor.fullName}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Gelar Resmi</span>
              <span className="text-foreground">{counselor.title}</span>
            </div>
            <Separator className="my-0.5" />
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Email Terdaftar</span>
              <span className="font-mono text-foreground">{counselor.email}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Nomor WhatsApp</span>
              <span className="font-mono text-foreground">{counselor.phone}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Domisili</span>
              <span className="text-foreground">{counselor.domicile || "Belum dicantumkan"}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Terdaftar Sejak</span>
              <span className="text-foreground">{registeredDateFormatted}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Kualifikasi & Praktik Klinis (6 Fields) */}
        <Card className="border-border/60 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Kualifikasi Klinis</CardTitle>
            </div>
            <CardDescription className="text-xs">Pendidikan, asosiasi profesi, dan pengalaman</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Jenis Mitra</span>
              <div className="mt-0.5">
                <Badge variant={isPsychologist ? "default" : "secondary"} className="text-[10px]">
                  {isPsychologist ? "Psikolog Klinis Profesional" : "Konselor Sebaya (Peer Counselor)"}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Riwayat Pendidikan</span>
              <span className="text-foreground">{counselor.education || "Pendidikan S1/S2 Psikologi"}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Pengalaman Praktik</span>
              <span className="font-semibold text-foreground">{counselor.experienceYears ?? 1} Tahun</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Nomor Anggota HIMPSI</span>
              <span className="font-mono text-foreground">{counselor.himpsiNumber || "Belum ada nomor HIMPSI"}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Area Spesialisasi & Topik</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {counselor.specializations && counselor.specializations.length > 0 ? (
                  counselor.specializations.map((spec) => (
                    <Badge key={spec} variant="outline" className="text-[10px] bg-muted/30">
                      {spec}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">Konseling Umum</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Izin Praktik STR & SIPP (4 Fields + Expiry Radar) */}
        <Card
          className={`border-border/60 shadow-2xs ${
            radar.hasRadarAlert ? "border-amber-400/50 dark:border-amber-700/50 bg-amber-500/5" : ""
          }`}
        >
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Izin Praktik Kemenkes</CardTitle>
              </div>
              {isPsychologist && (
                <Badge
                  variant={radar.hasRadarAlert ? (radar.alertSeverity === "critical" ? "destructive" : "warning") : "outline"}
                  className="text-[10px]"
                >
                  {radar.hasRadarAlert ? "Radar Aktif" : "Kredensial Sah"}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">Nomor registrasi dan status kadaluarsa</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3.5 text-xs">
            {isPsychologist ? (
              <>
                {/* STR Status */}
                <div className="p-2.5 rounded-lg border border-border/60 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">Nomor STR / Surat Tanda Registrasi</span>
                    <Badge variant={radar.strStatus.badgeVariant} className="text-[10px] py-0 px-1.5">
                      {radar.strStatus.label}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm font-semibold text-foreground mt-1">
                    {counselor.strNumber || "Belum Terdaftar"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Berlaku hingga: {radar.strStatus.formattedDate || "Tidak ditentukan"}
                  </p>
                </div>

                {/* SIPP Status */}
                <div className="p-2.5 rounded-lg border border-border/60 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">Nomor SIPP / Izin Praktik Psikologi</span>
                    <Badge variant={radar.sippStatus.badgeVariant} className="text-[10px] py-0 px-1.5">
                      {radar.sippStatus.label}
                    </Badge>
                  </div>
                  <p className="font-mono text-sm font-semibold text-foreground mt-1">
                    {counselor.sippNumber || "Belum Terdaftar"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Berlaku hingga: {radar.sippStatus.formattedDate || "Tidak ditentukan"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="size-3.5 shrink-0 text-primary" />
                  <span>Ambang batas radar peringatan otomatis: &lt; 60 hari.</span>
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                <p className="font-medium text-foreground">Konselor Sebaya (Non-Klinis)</p>
                <p className="text-[11px] mt-1">
                  Konselor sebaya tidak memerlukan STR & SIPP Kemenkes untuk memberikan layanan pendampingan emosional.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bio & Operasional Platform (Tarif, Komisi, Kuota) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bio Narrative */}
        <Card className="md:col-span-2 border-border/60 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold">Bio & Pendekatan Konseling</CardTitle>
            <CardDescription className="text-xs">Deskripsi publik yang tampil pada profil klien</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">
              {counselor.bio || "Tidak ada deskripsi bio yang dicantumkan."}
            </p>
          </CardContent>
        </Card>

        {/* Tarif & Operasional */}
        <Card className="border-border/60 shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Tarif & Operasional</CardTitle>
            </div>
            <CardDescription className="text-xs">Pengaturan komisi dan komitmen jadwal</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Tarif Sesi Per 90 Menit</span>
              <span className="font-semibold text-foreground text-sm">{formatCurrency(counselor.customFeeRate)}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Bagi Hasil / Komisi Konselor</span>
              <span className="font-semibold text-foreground">{formatCurrency(counselor.counselorCommissionRate)}</span>
            </div>
            <Separator className="my-0.5" />
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Target Komitmen Slot Mingguan</span>
              <span className="font-semibold text-foreground">
                {counselor.weeklySlotTarget ?? 10} Sesi / Minggu
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Status Unggulan Beranda</span>
              <span className="text-foreground">{counselor.isFeatured ? "Ditampilkan di Homepage" : "Reguler"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section: 8 Cloudflare R2 Compliance Attachments */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Berkas Kepatuhan & Legalitas (8 Lampiran R2)</h2>
            <p className="text-xs text-muted-foreground">
              Tautan unduhan dan pratinjau aman terenkripsi (Cloudflare R2 private bucket, masa berlaku token 15 menit).
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold gap-1.5 py-1 px-3">
            <ShieldCheck className="size-3.5 text-primary" />
            {counselor.attachments.filter((a) => a.isUploaded).length} dari 8 Berkas Terunggah
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {counselor.attachments.map((doc, idx) => (
            <Card key={doc.type} className="border-border/60 shadow-2xs hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">Lampiran #{idx + 1}</span>
                    <Badge
                      variant={doc.isUploaded ? "default" : "outline"}
                      className={`text-[9px] py-0 px-1.5 ${
                        doc.isUploaded
                          ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "text-muted-foreground"
                      }`}
                    >
                      {doc.isUploaded ? "Tersedia" : "Belum Ada"}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-foreground line-clamp-1" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{doc.category}</p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center gap-1.5">
                  {doc.url ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPreviewDoc({
                            title: doc.name,
                            url: doc.url!,
                            isImage:
                              doc.type === "avatar" ||
                              doc.url!.includes(".jpg") ||
                              doc.url!.includes(".png") ||
                              doc.url!.includes(".webp"),
                          })
                        }
                        className="flex-1 h-7 text-[11px] gap-1 cursor-pointer"
                      >
                        <Eye className="size-3" />
                        Pratinjau
                      </Button>
                      <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0 cursor-pointer" title="Buka di tab baru">
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="w-full h-7 text-[11px] opacity-60">
                      Tidak Tersedia
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{previewDoc?.title}</DialogTitle>
            <DialogDescription className="text-xs">
              Tautan aman Cloudflare R2 (Pre-signed URL 15 menit).
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-[450px] w-full overflow-hidden rounded-xl border border-border/60 bg-muted/20 flex items-center justify-center p-2">
            {previewDoc?.isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            ) : (
              <iframe src={previewDoc?.url} className="w-full h-[60vh] rounded-lg" title={previewDoc?.title} />
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between items-center w-full mt-2">
            <span className="text-[11px] text-muted-foreground">Bucket solulu-private / solulu-public</span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="text-xs">
                <a href={previewDoc?.url} target="_blank" rel="noreferrer" download>
                  <Download className="size-3.5 mr-1.5" />
                  Unduh Dokumen
                </a>
              </Button>
              <Button size="sm" onClick={() => setPreviewDoc(null)} className="text-xs">
                Tutup
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Application Confirmation Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Tolak Aplikasi Konselor
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menolak aplikasi kemitraan atas nama{" "}
              <strong className="text-foreground">{counselor.fullName}</strong>? Status verifikasi akan diubah menjadi
              Ditolak dan akun konselor ditangguhkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectDialog(false)}
              disabled={isActionPending}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isActionPending}
              className="text-xs font-semibold cursor-pointer"
            >
              {isActionPending ? "Memproses..." : "Ya, Tolak Aplikasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
