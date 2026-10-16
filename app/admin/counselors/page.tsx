"use client"

import * as React from "react"
import type { CounselorApplicant } from "@/lib/types/admin"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Eye,
  ShieldCheck,
  Mail,
  Phone,
  UserCheck,
  GraduationCap,
  Award,
  Clock,
  Calendar,
  ExternalLink,
  Filter,
  X,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  MoreHorizontal,
} from "lucide-react"
import { CounselorSchedulesModal } from "./components/counselor-schedules-modal"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AdminPageHeader, AdminMetricCard } from "@/components/admin"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCounselorsAdminAction,
  toggleCounselorActiveAction,
  toggleFeaturedCounselorAction,
  deleteCounselorAction,
} from "./actions"
import {
  getCounselorApplicationsAction,
  reviewCounselorApplicationAction,
  getApplicationDocumentUrlAction,
} from "./applications/actions"

function getDocButtonLabel(docKey: string | null | undefined, fallback: string) {
  if (!docKey) return `${fallback}.pdf`
  const clean = docKey.split("?")[0]
  const ext = clean.split(".").pop()?.toUpperCase()
  return ext ? `${fallback} (${ext})` : `${fallback}.pdf`
}

export default function DistilledCounselorsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [applicants, setApplicants] = React.useState<CounselorApplicant[]>([])
  const [activeCounselors, setActiveCounselors] = React.useState<any[]>([])
  const [activeTab, setActiveTab] = React.useState<"active" | "applicants">("active")
  const [previewDoc, setPreviewDoc] = React.useState<{
    name: string
    type: "cv" | "ktp" | "diploma" | "str"
    applicantName: string
    applicationId: string
    url?: string | null
    fileName?: string | null
    loading?: boolean
    error?: string | null
  } | null>(null)
  const [scheduleModalCounselor, setScheduleModalCounselor] = React.useState<{ id: string; name: string; title?: string; type?: string } | null>(null)

  const handleOpenPreviewDoc = async (
    applicationId: string,
    applicantName: string,
    docType: "cv" | "ktp" | "diploma" | "str",
    docTitle: string
  ) => {
    setPreviewDoc({
      name: docTitle,
      type: docType,
      applicantName,
      applicationId,
      url: null,
      loading: true,
      error: null,
    })

    try {
      const res = await getApplicationDocumentUrlAction({
        applicationId,
        documentType: docType,
      })

      if (res.success && res.data?.url) {
        setPreviewDoc((prev) =>
          prev && prev.applicationId === applicationId && prev.type === docType
            ? {
                ...prev,
                loading: false,
                url: res.data.url,
                fileName: res.data.fileName,
              }
            : prev
        )
      } else {
        setPreviewDoc((prev) =>
          prev && prev.applicationId === applicationId && prev.type === docType
            ? {
                ...prev,
                loading: false,
                error: res.error || "Gagal memuat berkas dokumen dari Cloudflare R2.",
              }
            : prev
        )
      }
    } catch (err: any) {
      setPreviewDoc((prev) =>
        prev && prev.applicationId === applicationId && prev.type === docType
          ? {
              ...prev,
              loading: false,
              error: err.message || "Terjadi kesalahan saat memuat berkas dokumen.",
            }
          : prev
      )
    }
  }
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "verified" | "pending" | "radar" | "active" | "suspended">("all")

  // Fetch real counselors and applications from database on mount, keeping resilient fallback
  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [counselorsRes, appsRes] = await Promise.all([
        getCounselorsAdminAction(),
        getCounselorApplicationsAction(),
      ])

      if (counselorsRes.success && counselorsRes.data && counselorsRes.data.length > 0) {
        const mapped = counselorsRes.data.map((row: any) => ({
          id: row.id,
          name: row.fullName,
          title: row.title,
          counselorType: row.counselorType,
          type: row.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
          email: row.email || "-",
          phone: row.phone || "-",
          specializations: row.specializations || [],
          isActive: row.isActive,
          verificationStatus: row.verificationStatus || "verified",
          totalSessions: row.completedSessionsCount ?? 0,
          activeSlots: row.activeSlotsCount ?? 0,
          avatarR2Url: row.avatarR2Url,
          education: row.education,
          strNumber: row.strNumber,
          strExpiresAt: row.strExpiresAt,
          sippNumber: row.sippNumber,
          sippExpiresAt: row.sippExpiresAt,
          radar: row.radar,
          isFeatured: row.isFeatured ?? false,
        }))
        setActiveCounselors(mapped)
      } else {
        setActiveCounselors([])
      }

      if (appsRes.success && appsRes.data) {
        if (appsRes.data.length > 0) {
          const mappedApps: CounselorApplicant[] = appsRes.data.map((app: any) => ({
            id: app.id,
            name: app.fullName,
            email: app.email,
            phone: app.phone || "-",
            type: app.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
            appliedAt: new Date(app.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            status: app.status as any,
            education: app.counselorType === "psychologist" ? "S2 Profesi Psikologi" : "S1 Psikologi",
            bio: app.bio || "",
            documents: {
              ktp: Boolean(app.ktpR2Key),
              cv: Boolean(app.cvR2Key),
              diploma: Boolean(app.diplomaR2Key),
              str: Boolean(app.strR2Key),
            },
            docKeys: {
              ktp: app.ktpR2Key || null,
              cv: app.cvR2Key || null,
              diploma: app.diplomaR2Key || null,
              str: app.strR2Key || null,
            },
          }))
          setApplicants(mappedApps)
        } else {
          setApplicants([])
        }
      }
    } catch (err) {
      console.warn("Failed to fetch counselors or applications from db:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleApprove = async (id: string, name: string, email: string) => {
    try {
      if (!id.startsWith("app-")) {
        await reviewCounselorApplicationAction({
          applicationId: id,
          status: "approved",
        })
      }
    } catch (e) {
      console.warn("Approve action error:", e)
    }
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "approved" as const } : app))
    )
    showToast(`Undangan aktivasi akun berhasil dikirimkan ke ${email}.`)
  }

  const handleReject = async (id: string, name: string) => {
    try {
      if (!id.startsWith("app-")) {
        await reviewCounselorApplicationAction({
          applicationId: id,
          status: "rejected",
          rejectionReason: "Berkas persyaratan belum memenuhi standar kualifikasi Solulu.",
        })
      }
    } catch (e) {
      console.warn("Reject action error:", e)
    }
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" as const } : app))
    )
    showToast(`Berkas atas nama ${name} ditolak.`)
  }

  const handleReconsider = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "pending" as const } : app))
    )
    showToast(`Berkas atas nama ${name} dikembalikan ke antrean peninjauan.`)
  }

  const handleToggleFeatured = async (counselorId: string, nextState: boolean) => {
    const previousState = !nextState
    setActiveCounselors((prev) =>
      prev.map((c) => (c.id === counselorId ? { ...c, isFeatured: nextState } : c))
    )
    try {
      const res = await toggleFeaturedCounselorAction(counselorId, nextState)
      if (res.success) {
        showToast(res.message || "Status featured berhasil diubah.")
      } else {
        throw new Error(res.error)
      }
    } catch {
      setActiveCounselors((prev) =>
        prev.map((c) => (c.id === counselorId ? { ...c, isFeatured: previousState } : c))
      )
      showToast("Gagal mengubah status featured konselor.")
    }
  }

  const toggleCounselorStatus = async (id: string) => {
    const counselor = activeCounselors.find((c) => c.id === id)
    if (!counselor) return
    const nextState = !counselor.isActive

    // Optimistic UI update
    setActiveCounselors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: nextState } : c))
    )

    try {
      const res = await toggleCounselorActiveAction(id, nextState)
      if (res.success) {
        showToast(res.message || "Status praktik konselor berhasil diperbarui.")
      } else {
        // Rollback
        setActiveCounselors((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !nextState } : c))
        )
        showToast("Gagal memperbarui status: " + res.error)
      }
    } catch {
      showToast("Status praktik konselor diperbarui secara lokal.")
    }
  }

  const handleDeleteCounselor = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data konselor ${name}? Tindakan ini permanen.`)) {
      return
    }

    try {
      const res = await deleteCounselorAction(id)
      if (res.success) {
        setActiveCounselors((prev) => prev.filter((c) => c.id !== id))
        showToast(`Konselor ${name} berhasil dihapus.`)
      } else {
        showToast("Gagal menghapus: " + res.error)
      }
    } catch {
      setActiveCounselors((prev) => prev.filter((c) => c.id !== id))
      showToast(`Konselor ${name} dihapus dari tampilan.`)
    }
  }

  const [roleFilter, setRoleFilter] = React.useState<"all" | "psychologist" | "peer">("all")

  const pendingApplicants = applicants.filter((a) => a.status === "pending")
  const totalPsychologists = activeCounselors.filter(
    (c) => c.counselorType === "psychologist" || c.type === "Psikolog Klinis"
  ).length
  const totalPeers = activeCounselors.filter(
    (c) => c.counselorType === "peer" || c.type === "Konselor Sebaya"
  ).length
  const totalActiveSlots = activeCounselors.reduce(
    (acc, c) => acc + (c.activeSlots || 0),
    0
  )

  const radarAlertCounselors = activeCounselors.filter((c) => c.radar?.hasRadarAlert)
  const radarAlertCount = radarAlertCounselors.length
  const pendingCounselorsCount = activeCounselors.filter((c) => c.verificationStatus === "pending").length
  const verifiedCounselorsCount = activeCounselors.filter((c) => c.verificationStatus === "verified").length
  const activeCount = activeCounselors.filter((c) => c.isActive).length
  const suspendedCount = activeCounselors.filter((c) => !c.isActive).length

  const filteredCounselors = activeCounselors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.strNumber && c.strNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.sippNumber && c.sippNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.education && c.education.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.specializations?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "verified"
        ? c.verificationStatus === "verified"
        : statusFilter === "pending"
        ? c.verificationStatus === "pending"
        : statusFilter === "radar"
        ? Boolean(c.radar?.hasRadarAlert)
        : statusFilter === "active"
        ? c.isActive
        : !c.isActive
    const matchesRole =
      roleFilter === "all"
        ? true
        : roleFilter === "psychologist"
        ? c.counselorType === "psychologist" || c.type === "Psikolog Klinis"
        : c.counselorType === "peer" || c.type === "Konselor Sebaya"
    return matchesSearch && matchesStatus && matchesRole
  })

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* 1. Header: Standardized Admin Page Header */}
      <AdminPageHeader
        title="Data Konselor"
        description="Kelola daftar konselor aktif dan periksa kelengkapan berkas pendaftar baru."
        actions={
          <div className="flex items-center gap-2.5">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/admin/counselors/new">
                <Plus className="size-3.5" />
                <span>Tambah Konselor</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/admin/counselors/applications">
                <FileText className="size-3.5 text-primary" />
                <span>Portal Verifikasi R2</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* 2. KPI Telemetry Cards: Standardized AdminMetricCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminMetricCard
          title="Psikolog Klinis"
          icon={GraduationCap}
          value={totalPsychologists}
          description="Berizin STR Kemenkes"
          loading={isLoading}
        />

        <AdminMetricCard
          title="Konselor Sebaya"
          icon={UserCheck}
          value={totalPeers}
          description="Partner Cerita Terlatih"
          loading={isLoading}
        />

        <AdminMetricCard
          title="Slot Jadwal Aktif"
          icon={Calendar}
          value={totalActiveSlots}
          description="Sesi 90 menit tersedia"
          loading={isLoading}
        />

        <AdminMetricCard
          title="Pendaftar Baru"
          icon={ShieldCheck}
          value={pendingApplicants.length}
          variant={pendingApplicants.length > 0 ? "warning" : "default"}
          badge={
            pendingApplicants.length > 0 ? (
              <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            ) : undefined
          }
          description="Menunggu verifikasi berkas"
          loading={isLoading}
        />
      </div>

      {/* STR / SIPP Expiry Radar Automated Alert Banner (< 60 Days) */}
      {radarAlertCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 dark:text-amber-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold flex items-center gap-2">
                <span>Radar Peringatan STR / SIPP</span>
                <Badge variant="warning" className="text-[10px] py-0 px-1.5 font-bold">
                  {radarAlertCount} Psikolog Mendekati / Lewat Jatuh Tempo
                </Badge>
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Kredensial izin praktik resmi kedaluwarsa atau tersisa kurang dari 60 hari. Harap evaluasi perpanjangan berkas.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActiveTab("active")
              setStatusFilter("radar")
            }}
            className="text-xs font-semibold h-8 bg-background/80 hover:bg-background border-amber-500/40 cursor-pointer shrink-0"
          >
            Filter Radar ({radarAlertCount})
          </Button>
        </div>
      )}

      {/* 3. Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <TabsList className="bg-muted p-1 rounded-lg shrink-0 h-9 border border-border/50">
            <TabsTrigger value="active" className="flex items-center gap-2 text-xs px-3 data-[state=active]:font-semibold">
              <span>Konselor Aktif</span>
              {isLoading ? (
                <Skeleton className="h-4 w-5 rounded-full" />
              ) : (
                <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-muted-foreground">
                  {activeCounselors.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="applicants" className="flex items-center gap-2 text-xs px-3 data-[state=active]:font-semibold">
              <span>Pendaftar Baru</span>
              {isLoading ? (
                <Skeleton className="h-4 w-5 rounded-full" />
              ) : pendingApplicants.length > 0 && (
                <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground">
                  {pendingApplicants.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground font-medium hidden sm:block">
            Total {activeCounselors.length} mitra konselor terdaftar
          </div>
        </div>

        {/* TAB 1: APPLICANTS AUDIT DECK */}
        <TabsContent value="applicants" className="flex flex-col gap-5 mt-0">
          {/* Telemetry bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>
                Dokumen tersimpan privat di Cloudflare R2 dengan tautan akses sementara 15 menit.
              </span>
            </div>
            <span className="tabular-nums font-medium text-foreground">
              {pendingApplicants.length} pelamar menunggu evaluasi
            </span>
          </div>

          {/* Cards Grid: Balanced rhythm and clear visual grouping without stacked borders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`applicant-skeleton-${i}`}
                  className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between gap-6 shadow-xs animate-pulse"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-36" />
                          <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-3.5 w-44" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3.5 w-4/5" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                      <Skeleton className="h-8 rounded-lg" />
                      <Skeleton className="h-8 rounded-lg" />
                      <Skeleton className="h-8 rounded-lg" />
                      <Skeleton className="h-8 rounded-lg" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border mt-2 flex gap-2.5">
                    <Skeleton className="h-8 flex-1 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))
            ) : applicants.length === 0 ? (
              <div className="col-span-full py-12 text-center border border-dashed border-border rounded-2xl bg-muted/10">
                <ShieldCheck className="size-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm font-medium text-foreground">Belum ada berkas pendaftar baru</p>
                <p className="text-xs text-muted-foreground">Semua aplikasi yang masuk telah ditinjau.</p>
              </div>
            ) : (
              applicants.map((app) => (
              <div
                key={app.id}
                className={`rounded-xl border bg-card p-6 flex flex-col justify-between gap-6 transition-all ${
                  app.status === "approved"
                    ? "border-primary/40 bg-primary/5"
                    : app.status === "rejected"
                    ? "border-destructive/30 bg-destructive/5 opacity-70"
                    : "border-border shadow-xs"
                }`}
              >
                {/* Upper Section: Profile & Credentials */}
                <div className="flex flex-col gap-5">
                  {/* Candidate Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-foreground text-base tracking-tight">
                          {app.name}
                        </h2>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                          {app.type}
                        </Badge>
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20" title="Persetujuan Etik: Pelamar telah menyetujui kode etik konseling Solulu">
                          <CheckCircle2 className="size-2.5" />
                          <span>Etik ✓</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3 text-muted-foreground/80" />
                          <span>{app.email}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3 text-muted-foreground/80" />
                          <span>{app.phone}</span>
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 pt-0.5">
                      {app.appliedAt}
                    </span>
                  </div>

                  {/* Academic & Izin Praktik Profile Block */}
                  <div className="flex flex-col justify-center gap-2 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/70 min-h-[68px]">
                    <div className="flex items-start gap-2 text-foreground">
                      <GraduationCap className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="leading-snug">{app.education}</span>
                    </div>

                    {app.strNumber && (
                      <div className="flex items-center gap-2 font-mono text-xs pt-1 border-t border-border/50">
                        <Award className="size-3.5 text-primary shrink-0" />
                        <span className="text-muted-foreground">Izin Praktik:</span>
                        <span className="font-semibold text-foreground">{app.strNumber}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                          Terdaftar
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Clinical Bio Quote */}
                  <div className="text-xs text-muted-foreground italic leading-relaxed pl-3 border-l-2 border-primary/30 min-h-[38px] flex items-center">
                    &ldquo;{app.bio}&rdquo;
                  </div>

                  {/* Document Audit Deck */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-medium text-foreground">
                      <span>Dokumen Kualifikasi</span>
                      <span className="text-[11px] text-muted-foreground">Klik untuk melihat</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!app.documents.ktp}
                        onClick={() =>
                          handleOpenPreviewDoc(
                            app.id,
                            app.name,
                            "ktp",
                            "KTP Elektronik (WNI)"
                          )
                        }
                        className="justify-between text-xs font-normal bg-background hover:bg-muted/60 px-2.5 cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{getDocButtonLabel(app.docKeys?.ktp, "KTP")}</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!app.documents.diploma}
                        onClick={() =>
                          handleOpenPreviewDoc(
                            app.id,
                            app.name,
                            "diploma",
                            "Ijazah Profesi / Akademik"
                          )
                        }
                        className="justify-between text-xs font-normal bg-background hover:bg-muted/60 px-2.5 cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{getDocButtonLabel(app.docKeys?.diploma, "Ijazah")}</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!app.documents.cv}
                        onClick={() =>
                          handleOpenPreviewDoc(
                            app.id,
                            app.name,
                            "cv",
                            "Curriculum Vitae"
                          )
                        }
                        className="justify-between text-xs font-normal bg-background hover:bg-muted/60 px-2.5 cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{getDocButtonLabel(app.docKeys?.cv, "CV")}</span>
                        </span>
                        <Eye className="size-3 text-muted-foreground shrink-0" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!app.documents.str}
                        onClick={() =>
                          app.documents.str &&
                          handleOpenPreviewDoc(
                            app.id,
                            app.name,
                            "str",
                            "Surat Izin Praktik Konselor (STR/SIP)"
                          )
                        }
                        className="justify-between text-xs font-normal bg-background hover:bg-muted/60 px-2.5 cursor-pointer"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Award className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{getDocButtonLabel(app.docKeys?.str, "Izin-Praktik")}</span>
                        </span>
                        {app.documents.str ? (
                          <Eye className="size-3 text-muted-foreground shrink-0" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60">-</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bottom Decision Bar: Clear generous separation from content */}
                <div className="pt-4 border-t border-border mt-2">
                  {app.status === "pending" ? (
                    <div className="flex items-center gap-2.5">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app.id, app.name, app.email)}
                        className="flex-1 text-xs font-medium h-8"
                      >
                        <UserCheck className="size-3.5 mr-1.5" />
                        <span>Setujui & Kirim Undangan</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(app.id, app.name)}
                        className="text-xs text-destructive hover:bg-destructive/10 h-8 px-3"
                      >
                        Tolak Berkas
                      </Button>
                    </div>
                  ) : app.status === "approved" ? (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">Mitra Disetujui & Diundang</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("active")}
                        className="h-7 text-xs font-semibold border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 cursor-pointer"
                      >
                        <span>Lihat di Konselor Aktif</span>
                        <ExternalLink className="size-3 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs">
                      <div className="flex items-center gap-2">
                        <XCircle className="size-4 shrink-0" />
                        <span>Berkas Ditolak</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReconsider(app.id, app.name)}
                        className="h-7 text-xs font-semibold border-destructive/30 hover:bg-destructive/10 text-destructive cursor-pointer"
                      >
                        <RefreshCw className="size-3 mr-1" />
                        <span>Tinjau Ulang</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
        </TabsContent>

        {/* TAB 2: REGISTERED COUNSELORS DIRECTORY (Unified Surface) */}
        <TabsContent value="active" className="flex flex-col gap-0 mt-0">
          <Card className="overflow-hidden shadow-xs">
            {/* Integrated Toolbar Header: Filter + Search + Stats in one surface */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
              <div className="relative flex-1 min-w-[220px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari nama konselor atau spesialisasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                  aria-label="Cari nama konselor"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                {/* Role Filter Button Group */}
                <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-background text-xs">
                  <button
                    type="button"
                    onClick={() => setRoleFilter("all")}
                    className={`h-7 px-2.5 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      roleFilter === "all"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Semua Profesi
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter("psychologist")}
                    className={`h-7 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      roleFilter === "psychologist"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Psikolog Klinis</span>
                    <span className="text-[10px] tabular-nums font-mono px-1 py-0.2 rounded-full bg-muted-foreground/20">
                      {totalPsychologists}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter("peer")}
                    className={`h-7 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      roleFilter === "peer"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Konselor Sebaya</span>
                    <span className="text-[10px] tabular-nums font-mono px-1 py-0.2 rounded-full bg-muted-foreground/20">
                      {totalPeers}
                    </span>
                  </button>
                </div>

                {/* Status Filter Button Group */}
                <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-background text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`h-7 px-2.5 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === "all"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("verified")}
                    className={`h-7 px-2 flex items-center gap-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === "verified"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Terverifikasi</span>
                    <span className="text-[10px] tabular-nums font-mono px-1 py-0.2 rounded-full bg-muted-foreground/20">
                      {verifiedCounselorsCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("pending")}
                    className={`h-7 px-2 flex items-center gap-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === "pending"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Pending</span>
                    {pendingCounselorsCount > 0 && (
                      <span className="text-[10px] tabular-nums font-mono px-1 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                        {pendingCounselorsCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("radar")}
                    className={`h-7 px-2 flex items-center gap-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === "radar"
                        ? "bg-amber-600 text-white font-semibold"
                        : radarAlertCount > 0
                        ? "text-amber-600 dark:text-amber-400 hover:text-amber-700 font-semibold bg-amber-500/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Konselor dengan STR/SIPP kedaluwarsa atau berakhir < 60 hari"
                  >
                    <AlertTriangle className="size-3" />
                    <span>Radar &lt; 60H</span>
                    {radarAlertCount > 0 && (
                      <span className="text-[10px] tabular-nums font-mono px-1 py-0.2 rounded-full bg-destructive text-white font-bold">
                        {radarAlertCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("suspended")}
                    className={`h-7 px-2 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === "suspended"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ditangguhkan
                  </button>
                </div>

                <span className="text-xs text-muted-foreground tabular-nums pl-2">
                  {filteredCounselors.length} mitra
                </span>
              </div>
            </div>

            {/* Table Body - Fluid Zero Horizontal Scroll */}
            <div className="w-full overflow-hidden">
              <Table className="w-full text-xs">
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border/60">
                    <TableHead className="py-3 px-3.5 font-semibold text-foreground">Konselor & Kualifikasi</TableHead>
                    <TableHead className="py-3 px-3.5 font-semibold text-foreground w-[220px]">Kinerja & Jadwal</TableHead>
                    <TableHead className="py-3 px-3.5 font-semibold text-foreground w-[160px]">Status & Tampilan</TableHead>
                    <TableHead className="py-3 px-3.5 font-semibold text-foreground text-right w-[120px]">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={`counselor-skeleton-${i}`} className="border-border/60">
                        <TableCell className="py-3.5 px-3.5">
                          <Skeleton className="h-4 w-36 mb-1.5" />
                          <Skeleton className="h-3 w-28 mb-1" />
                          <Skeleton className="h-2.5 w-44" />
                        </TableCell>
                        <TableCell className="py-3.5 px-3.5">
                          <Skeleton className="h-4 w-28 mb-1.5" />
                          <Skeleton className="h-3 w-32" />
                        </TableCell>
                        <TableCell className="py-3.5 px-3.5">
                          <Skeleton className="h-4 w-24 mb-1.5" />
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell className="py-3.5 px-3.5 text-right">
                          <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredCounselors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        <p className="text-sm font-medium">Tidak ada data konselor yang cocok</p>
                        <p className="text-xs text-muted-foreground mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCounselors.map((c) => (
                    <TableRow
                      key={c.id}
                      onClick={() => router.push(`/admin/counselors/${c.id}`)}
                      className="hover:bg-muted/30 transition-colors border-border/60 cursor-pointer"
                    >
                      {/* Konselor & Kualifikasi */}
                      <TableCell className="py-3.5 px-3.5 align-top">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/counselors/${c.id}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {c.name}
                          </Link>
                          <span className="text-xs text-muted-foreground">{c.title}</span>
                          <Badge
                            variant={c.counselorType === "psychologist" ? "default" : "secondary"}
                            className="text-[10px] font-normal py-0 px-1.5"
                          >
                            {c.type}
                          </Badge>
                          {c.verificationStatus === "pending" && (
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] py-0 px-1.5 font-medium">
                              Pending Verifikasi
                            </Badge>
                          )}
                          {c.verificationStatus === "rejected" && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-medium">
                              Ditolak
                            </Badge>
                          )}
                        </div>

                        {/* Automated High-Visibility STR / SIPP Expiry Radar Badge (< 60 Days) */}
                        {c.radar?.hasRadarAlert && (
                          <div className="mt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Badge
                              variant={c.radar.alertSeverity === "critical" ? "destructive" : "warning"}
                              className="text-[10px] font-bold gap-1 py-0.5 px-2 animate-pulse"
                            >
                              <AlertTriangle className="size-3" />
                              Radar: {c.radar.alertMessage}
                            </Badge>
                          </div>
                        )}

                        {/* License Credential Information (STR & SIPP) */}
                        {c.counselorType === "psychologist" ? (
                          <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-muted-foreground font-mono">
                            <div className="flex items-center gap-1.5">
                              <span>STR: {c.strNumber || "Belum ada"}</span>
                              {c.radar?.strStatus?.daysRemaining !== null && (
                                <span className={c.radar?.strStatus?.isExpired ? "text-destructive font-bold" : c.radar?.strStatus?.isExpiringSoon ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground"}>
                                  ({c.radar.strStatus.label})
                                </span>
                              )}
                            </div>
                            {c.sippNumber && (
                              <div className="flex items-center gap-1.5">
                                <span>SIPP: {c.sippNumber}</span>
                                {c.radar?.sippStatus?.daysRemaining !== null && (
                                  <span className={c.radar?.sippStatus?.isExpired ? "text-destructive font-bold" : c.radar?.sippStatus?.isExpiringSoon ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground"}>
                                    ({c.radar.sippStatus.label})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : c.education ? (
                          <div className="text-[10px] text-muted-foreground/80 mt-0.5 truncate max-w-[260px]" title={c.education}>
                            {c.education}
                          </div>
                        ) : null}

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-1">
                          <span>{c.email}</span>
                          <span>•</span>
                          <span>{c.phone}</span>
                        </div>
                      </TableCell>

                      {/* Kinerja & Jadwal */}
                      <TableCell className="py-3.5 px-3.5 align-top">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="tabular-nums font-semibold text-foreground">{c.totalSessions} sesi</span>
                          <span>•</span>
                          <span className="font-mono text-primary font-medium">{c.activeSlots} slot aktif</span>
                        </div>
                        {c.specializations && c.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5 max-w-[210px]">
                            {c.specializations.slice(0, 2).map((spec: string) => (
                              <span
                                key={spec}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium truncate max-w-[100px]"
                                title={spec}
                              >
                                {spec}
                              </span>
                            ))}
                            {c.specializations.length > 2 && (
                              <span
                                className="text-[10px] px-1 py-0.5 rounded bg-muted/80 text-muted-foreground font-medium"
                                title={c.specializations.slice(2).join(", ")}
                              >
                                +{c.specializations.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Status & Homepage */}
                      <TableCell className="py-3.5 px-3.5 align-top">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span
                            className={`size-1.5 rounded-full ${
                              c.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                            }`}
                          />
                          <span className={c.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                            {c.isActive ? "Praktik Aktif" : "Ditangguhkan"}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 mt-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={Boolean(c.isFeatured)}
                            onCheckedChange={(checked) => handleToggleFeatured(c.id, checked)}
                            aria-label={`Tampilkan ${c.name} di homepage`}
                            className="scale-75 origin-left"
                            id={`feat-${c.id}`}
                          />
                          <label htmlFor={`feat-${c.id}`} className="text-[10px] text-muted-foreground cursor-pointer select-none">
                            {c.isFeatured ? "Beranda" : "Reguler"}
                          </label>
                        </div>
                      </TableCell>

                      {/* Tindakan */}
                      <TableCell className="py-3.5 px-3.5 text-right align-top">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer"
                            title={`Periksa 21 data dan 8 berkas untuk ${c.name}`}
                          >
                            <Link href={`/admin/counselors/${c.id}`}>
                              <Eye className="size-3" />
                              <span className="hidden sm:inline">Detail</span>
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScheduleModalCounselor({ id: c.id, name: c.name, title: c.title, type: c.type })}
                            className="h-7 px-2 text-xs font-medium gap-1 cursor-pointer hover:border-primary/50"
                            title={`Kelola slot jadwal untuk ${c.name}`}
                          >
                            <Calendar className="size-3 text-primary" />
                            <span className="hidden sm:inline">Jadwal</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                aria-label={`Menu tindakan untuk ${c.name}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/counselors/${c.id}`} className="cursor-pointer">
                                  <Eye className="size-3.5 mr-2 text-primary" />
                                  <span>Lihat 21 Data & 8 Berkas</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/counselors/${c.id}/edit`} className="cursor-pointer">
                                  <Pencil className="size-3.5 mr-2" />
                                  <span>Edit Profil</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setScheduleModalCounselor({ id: c.id, name: c.name, title: c.title, type: c.type })}
                                className="cursor-pointer"
                              >
                                <Clock className="size-3.5 mr-2" />
                                <span>Atur Slot Jadwal</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleCounselorStatus(c.id)}
                                className="cursor-pointer"
                              >
                                <RefreshCw className="size-3.5 mr-2" />
                                <span>{c.isActive ? "Tangguhkan Praktik" : "Aktifkan Praktik"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  navigator.clipboard.writeText(`${c.name} (${c.email} / ${c.phone})`)
                                  showToast(`Kontak ${c.name} berhasil disalin`)
                                }}
                                className="cursor-pointer"
                              >
                                <Phone className="size-3.5 mr-2" />
                                <span>Salin Kontak</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteCounselor(c.id, c.name)}
                                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5 mr-2" />
                                <span>Hapus Konselor</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Real Document Preview Modal: Cloudflare R2 Presigned Viewer */}
      {previewDoc && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-5 flex flex-col gap-4 shadow-2xl max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <FileText className="size-4 text-primary" />
                  <span>{previewDoc.name}</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>
                    Pelamar: <strong className="text-foreground font-medium">{previewDoc.applicantName}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                    <Clock className="size-3" />
                    <span>Tautan kedaluwarsa dalam 15 menit</span>
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setPreviewDoc(null)}
                aria-label="Tutup pratinjau dokumen"
                className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </Button>
            </div>

            {/* Document Content Canvas */}
            <div className="flex-1 overflow-y-auto">
              {previewDoc.loading && (
                <div className="py-20 bg-muted/20 rounded-xl border border-border flex flex-col items-center justify-center text-center gap-3">
                  <Loader2 className="size-8 text-primary animate-spin" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Mengambil Berkas Dokumen dari Cloudflare R2...
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Menghasilkan tautan bertanda tangan aman (presigned GET)
                    </div>
                  </div>
                </div>
              )}

              {previewDoc.error && (
                <div className="p-8 bg-destructive/5 rounded-xl border border-destructive/20 flex flex-col items-center justify-center text-center gap-3">
                  <AlertCircle className="size-8 text-destructive" />
                  <div>
                    <div className="text-xs font-semibold text-destructive">
                      Gagal Memuat Berkas Dokumen
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 max-w-sm">
                      {previewDoc.error}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleOpenPreviewDoc(
                        previewDoc.applicationId,
                        previewDoc.applicantName,
                        previewDoc.type,
                        previewDoc.name
                      )
                    }
                    className="h-8 text-xs gap-1.5 mt-1 cursor-pointer"
                  >
                    <RefreshCw className="size-3" />
                    <span>Coba Lagi</span>
                  </Button>
                </div>
              )}

              {!previewDoc.loading && !previewDoc.error && previewDoc.url && (
                <div className="flex flex-col gap-3">
                  {previewDoc.url.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) ||
                  previewDoc.fileName?.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                    <div className="relative rounded-xl border border-border bg-muted/20 p-2 flex items-center justify-center min-h-[340px] max-h-[520px] overflow-auto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewDoc.url}
                        alt={previewDoc.name}
                        className="max-h-[500px] w-auto max-w-full rounded-lg object-contain shadow-xs border border-border/60 bg-background"
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-xl border border-border bg-card overflow-hidden h-[480px]">
                      <iframe
                        src={previewDoc.url}
                        className="w-full h-full border-0"
                        title={previewDoc.name}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer & Actions */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                <span>R2 Encrypted: Verified</span>
              </div>

              <div className="flex items-center gap-2">
                {previewDoc.url && (
                  <>
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5 cursor-pointer">
                      <a
                        href={previewDoc.url}
                        download={previewDoc.fileName || `${previewDoc.type}.pdf`}
                        className="flex items-center gap-1.5"
                      >
                        <Download className="size-3.5" />
                        <span>Unduh Berkas</span>
                      </a>
                    </Button>
                    <Button asChild size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                      <a
                        href={previewDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Buka di Tab Baru</span>
                      </a>
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(null)} className="h-8 text-xs cursor-pointer">
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Counselor Schedules Management Modal */}
      <CounselorSchedulesModal
        counselor={scheduleModalCounselor}
        isOpen={Boolean(scheduleModalCounselor)}
        onClose={() => setScheduleModalCounselor(null)}
        onSlotsUpdated={loadData}
      />
    </div>
  )
}


