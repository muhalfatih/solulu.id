"use client"

import * as React from "react"
import Link from "next/link"
import {
  getApplicationDocumentUrlAction,
  reviewCounselorApplicationAction,
  getCounselorApplicationsAction,
} from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Phone,
  Clock,
  UserCheck,
  RefreshCw,
  Loader2,
  Calendar,
  Filter,
  FileDown,
  Info,
  Copy,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  MessageSquare,
} from "lucide-react"

export interface CounselorApplicationView {
  id: string
  fullName: string
  email: string
  phone: string
  counselorType: "peer" | "psychologist"
  bio: string
  cvR2Key: string
  ktpR2Key: string
  diplomaR2Key: string
  strR2Key: string | null
  status: "pending" | "approved" | "rejected"
  rejectionReason?: string | null
  agreedToTermsAt: Date | string
  createdAt: Date | string
}

export function ApplicationsClient({
  initialApplications,
}: {
  initialApplications: CounselorApplicationView[]
}) {
  const [applications, setApplications] =
    React.useState<CounselorApplicationView[]>(initialApplications)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [typeFilter, setTypeFilter] = React.useState<"all" | "peer" | "psychologist">("all")
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // Document preview state
  const [docLoading, setDocLoading] = React.useState(false)
  const [activeDoc, setActiveDoc] = React.useState<{
    url: string
    documentType: string
    applicantName: string
    expiresInSeconds: number
    fileName?: string
  } | null>(null)

  // Review modal state
  const [approveModal, setApproveModal] = React.useState<CounselorApplicationView | null>(null)
  const [counselorTitle, setCounselorTitle] = React.useState("")
  const [initialPassword, setInitialPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [rejectModal, setRejectModal] = React.useState<CounselorApplicationView | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // Issued Credentials Success Modal state
  const [issuedCredentials, setIssuedCredentials] = React.useState<{
    email: string
    password: string
    fullName: string
    phone: string
  } | null>(null)
  const [isCopied, setIsCopied] = React.useState(false)

  // Helper to generate secure random password
  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*"
    let pwd = "Sol"
    for (let i = 0; i < 9; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setInitialPassword(pwd + "26!")
  }

  // Pre-fill default title & random password when modal opens
  React.useEffect(() => {
    if (approveModal) {
      setCounselorTitle(
        approveModal.counselorType === "psychologist"
          ? "M.Psi., Psikolog"
          : "S.Psi"
      )
      const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*"
      let pwd = "Sol"
      for (let i = 0; i < 9; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      setInitialPassword(pwd + "26!")
      setShowPassword(false)
    }
  }, [approveModal])

  const refreshApplications = async () => {
    setIsRefreshing(true)
    try {
      const res = await getCounselorApplicationsAction()
      if (res.success && res.data) {
        setApplications(res.data)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  // Open Document with Presigned GET URL (15-min expiry)
  const handleViewDocument = async (
    applicationId: string,
    documentType: "cv" | "ktp" | "diploma" | "str"
  ) => {
    setDocLoading(true)
    setFeedback(null)
    try {
      const res = await getApplicationDocumentUrlAction({
        applicationId,
        documentType,
      })
      if (!res.success || !res.data) {
        setFeedback({
          type: "error",
          message: res.error || "Gagal membuka berkas dokumen.",
        })
        return
      }

      setActiveDoc({
        url: res.data.url,
        documentType: res.data.documentType,
        applicantName: res.data.applicantName,
        expiresInSeconds: res.data.expiresInSeconds,
        fileName: res.data.fileName,
      })
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Terjadi kesalahan saat memuat dokumen.",
      })
    } finally {
      setDocLoading(false)
    }
  }

  // Approve counselor application
  const handleApproveSubmit = async () => {
    if (!approveModal) return
    setIsProcessing(true)
    setFeedback(null)

    try {
      const res = await reviewCounselorApplicationAction({
        applicationId: approveModal.id,
        status: "approved",
        title: counselorTitle,
        initialPassword: initialPassword.trim(),
      })

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menyetujui aplikasi.",
        })
        setIsProcessing(false)
        return
      }

      setFeedback({
        type: "success",
        message: res.message || "Aplikasi konselor berhasil disetujui.",
      })
      if (res.credentials) {
        setIssuedCredentials({
          email: res.credentials.email,
          password: res.credentials.password,
          fullName: res.credentials.fullName,
          phone: res.credentials.phone || approveModal.phone || "",
        })
      }
      setApproveModal(null)
      await refreshApplications()
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Terjadi kendala saat menyetujui aplikasi.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Reject counselor application
  const handleRejectSubmit = async () => {
    if (!rejectModal) return
    setIsProcessing(true)
    setFeedback(null)

    try {
      const res = await reviewCounselorApplicationAction({
        applicationId: rejectModal.id,
        status: "rejected",
        rejectionReason: rejectionReason.trim() || undefined,
      })

      if (!res.success) {
        setFeedback({
          type: "error",
          message: res.error || "Gagal menolak aplikasi.",
        })
        setIsProcessing(false)
        return
      }

      setFeedback({
        type: "success",
        message: res.message || "Aplikasi telah ditolak.",
      })
      setRejectModal(null)
      setRejectionReason("")
      await refreshApplications()
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Terjadi kendala saat menolak aplikasi.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Filtered applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery)

    const matchesStatus =
      statusFilter === "all" ? true : app.status === statusFilter

    const matchesType =
      typeFilter === "all" ? true : app.counselorType === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const pendingCount = applications.filter((a) => a.status === "pending").length
  const approvedCount = applications.filter((a) => a.status === "approved").length
  const rejectedCount = applications.filter((a) => a.status === "rejected").length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Verifikasi Berkas Kemitraan Konselor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tinjau kredensial Ijazah, KTP, dan Surat Izin Praktik (STR) sebelum mengaktifkan akun serta mengirimkan undangan resmi Supabase.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshApplications}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`size-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Segarkan
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href="/admin/counselors">Daftar Konselor Aktif</a>
          </Button>
        </div>
      </div>

      {/* Alert Feedback */}
      {feedback && (
        <Alert
          variant={feedback.type === "error" ? "destructive" : "default"}
          className={feedback.type === "success" ? "border-emerald-500/30 bg-emerald-500/5 text-foreground" : ""}
        >
          {feedback.type === "error" ? (
            <AlertTriangle className="size-4" />
          ) : (
            <CheckCircle2 className="size-4 text-emerald-600" />
          )}
          <AlertTitle>
            {feedback.type === "error" ? "Perhatian" : "Berhasil Diproses"}
          </AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      {/* Rate Limit notice info */}
      <div className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span>
            <strong>Batas Keamanan Supabase Auth:</strong> Maksimal 4 pengiriman email undangan per jam untuk mencegah spam otomatis.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-foreground font-semibold">
            {pendingCount} Menunggu Tindakan
          </span>
        </div>
      </div>

      {/* Controls & Search */}
      <Card className="border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-applications-input"
              placeholder="Cari nama, email, nomor HP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Type selector */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Tipe:</span>
              <select
                aria-label="Filter Tipe Konselor"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">Semua Kategori</option>
                <option value="peer">Konselor Sebaya (Peer)</option>
                <option value="psychologist">Psikolog Klinis</option>
              </select>
            </div>

            {/* Status tabs */}
            <Tabs
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as any)}
              className="w-auto"
            >
              <TabsList className="h-8">
                <TabsTrigger value="pending" className="text-xs px-2.5">
                  Menunggu ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs px-2.5">
                  Disetujui ({approvedCount})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs px-2.5">
                  Ditolak ({rejectedCount})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs px-2.5">
                  Semua ({applications.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="border-border overflow-hidden shadow-xs">
        <div className="w-full overflow-hidden">
          <Table className="w-full text-xs">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="py-3 px-3.5 font-semibold text-foreground">Nama &amp; Kategori</TableHead>
                <TableHead className="py-3 px-3.5 font-semibold text-foreground w-[210px]">Kontak</TableHead>
                <TableHead className="py-3 px-3.5 font-semibold text-foreground w-[230px]">Berkas Dokumen</TableHead>
                <TableHead className="py-3 px-3.5 font-semibold text-foreground w-[130px]">Status</TableHead>
                <TableHead className="py-3 px-3.5 font-semibold text-foreground text-right w-[140px]">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                    Tidak ada data pendaftaran yang sesuai kriteria pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/30 transition-colors border-border/60">
                    <TableCell className="align-top py-3.5 px-3.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">
                            {app.fullName}
                          </span>
                          <Badge
                            variant={app.counselorType === "psychologist" ? "default" : "secondary"}
                            className="text-[10px] py-0 px-1.5 font-medium"
                          >
                            {app.counselorType === "psychologist"
                              ? "Psikolog Klinis"
                              : "Konselor Sebaya"}
                          </Badge>
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20"
                            title={`Persetujuan Etik: Pelamar telah menyetujui kode etik (${new Date(app.agreedToTermsAt).toLocaleDateString("id-ID")})`}
                          >
                            <CheckCircle2 className="size-2.5" />
                            <span>Etik ✓</span>
                          </span>
                        </div>
                        {app.bio ? (
                          <span className="text-[11px] text-muted-foreground line-clamp-2 italic leading-relaxed">
                            &ldquo;{app.bio}&rdquo;
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-3.5 px-3.5">
                      <div className="flex flex-col gap-1 text-xs">
                        <a
                          href={`mailto:${app.email}`}
                          className="flex items-center gap-1.5 text-foreground hover:underline text-xs"
                        >
                          <Mail className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[170px]">{app.email}</span>
                        </a>
                        <a
                          href={`https://wa.me/${app.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs"
                        >
                          <Phone className="size-3 shrink-0" />
                          <span>{app.phone}</span>
                        </a>
                        <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground/80" />
                          <span>
                            {new Date(app.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-3.5 px-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {/* CV */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(app.id, "cv")}
                          disabled={docLoading}
                          className="text-xs h-7 px-2 cursor-pointer font-normal bg-background hover:bg-muted/60"
                          id={`view-cv-${app.id}`}
                          title="Lihat Curriculum Vitae"
                        >
                          <FileText className="size-3 mr-1 text-primary shrink-0" />
                          <span>CV</span>
                        </Button>

                        {/* KTP */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(app.id, "ktp")}
                          disabled={docLoading}
                          className="text-xs h-7 px-2 cursor-pointer font-normal bg-background hover:bg-muted/60"
                          id={`view-ktp-${app.id}`}
                          title="Lihat KTP"
                        >
                          <FileText className="size-3 mr-1 text-primary shrink-0" />
                          <span>KTP</span>
                        </Button>

                        {/* Ijazah */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(app.id, "diploma")}
                          disabled={docLoading}
                          className="text-xs h-7 px-2 cursor-pointer font-normal bg-background hover:bg-muted/60"
                          id={`view-diploma-${app.id}`}
                          title="Lihat Ijazah"
                        >
                          <FileText className="size-3 mr-1 text-primary shrink-0" />
                          <span>Ijazah</span>
                        </Button>

                        {/* Izin Praktik / STR */}
                        {app.strR2Key ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleViewDocument(app.id, "str")}
                            disabled={docLoading}
                            className="text-xs h-7 px-2 cursor-pointer font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                            id={`view-str-${app.id}`}
                            title="Lihat Surat Izin Praktik (STR/SIP)"
                          >
                            <ShieldCheck className="size-3 mr-1 text-primary shrink-0" />
                            <span>STR</span>
                          </Button>
                        ) : app.counselorType === "psychologist" ? (
                          <span className="inline-flex items-center text-[10px] text-destructive bg-destructive/10 border border-destructive/20 rounded px-1.5 py-0.5 self-center font-medium" title="STR tidak dilampirkan">
                            STR Kosong
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground self-center px-1">
                            (Tanpa STR)
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-3.5 px-3.5">
                      {app.status === "pending" && (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 text-xs font-medium">
                          Menunggu
                        </Badge>
                      )}
                      {app.status === "approved" && (
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-xs font-medium w-fit">
                            <CheckCircle2 className="size-3 mr-1 text-emerald-600 shrink-0" />
                            Disetujui
                          </Badge>
                        </div>
                      )}
                      {app.status === "rejected" && (
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="destructive" className="text-xs font-medium">
                            <XCircle className="size-3 mr-1 shrink-0" />
                            Ditolak
                          </Badge>
                          {app.rejectionReason && (
                            <span
                              className="text-[10px] text-muted-foreground/80 line-clamp-2 max-w-[120px] italic leading-tight"
                              title={`Alasan: ${app.rejectionReason}`}
                            >
                              {app.rejectionReason}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="align-top py-3.5 px-3.5 text-right">
                      {app.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setApproveModal(app)
                              setCounselorTitle(
                                app.counselorType === "psychologist"
                                  ? "M.Psi., Psikolog"
                                  : "S.Psi"
                              )
                            }}
                            id={`approve-btn-${app.id}`}
                            className="h-7 text-xs font-medium px-2.5 cursor-pointer"
                          >
                            <ShieldCheck className="size-3 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejectModal(app)
                              setRejectionReason("")
                            }}
                            id={`reject-btn-${app.id}`}
                            className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                          >
                            <XCircle className="size-3 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      ) : app.status === "approved" ? (
                        <div className="flex items-center justify-end">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-medium border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                          >
                            <Link href="/admin/counselors">
                              <UserCheck className="size-3 mr-1 text-emerald-600" />
                              <span>Profil Konselor</span>
                            </Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setApproveModal(app)
                              setCounselorTitle(
                                app.counselorType === "psychologist"
                                  ? "M.Psi., Psikolog"
                                  : "S.Psi"
                              )
                            }}
                            className="h-7 text-xs font-medium border-destructive/30 hover:bg-destructive/10 text-destructive cursor-pointer"
                          >
                            <RefreshCw className="size-3 mr-1" />
                            <span>Tinjau Ulang</span>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Document Viewer Modal with Presigned URL notice */}
      <Dialog open={Boolean(activeDoc)} onOpenChange={(open) => !open && setActiveDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Dokumen {activeDoc?.documentType.toUpperCase()} — {activeDoc?.applicantName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <Clock className="size-3 text-amber-600" />
              Tautan kedaluwarsa dalam 15 menit (keamanan audit medis R2 Solulu).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col gap-4">
            <Alert className="bg-muted/40 border-border text-xs">
              <Info className="size-4 text-primary" />
              <AlertDescription className="text-muted-foreground">
                Dokumen diambil dari bucket privat Cloudflare R2 secara langsung. Anda dapat melihat pratinjau atau membuka di tab baru.
              </AlertDescription>
            </Alert>

            {activeDoc && (
              <div className="flex flex-col gap-3">
                {activeDoc.url.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i) ||
                activeDoc.fileName?.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                  <div className="relative rounded-xl border border-border bg-muted/20 p-2 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeDoc.url}
                      alt={`Dokumen ${activeDoc.documentType}`}
                      className="max-h-[480px] w-auto max-w-full rounded-lg object-contain shadow-xs border border-border/60 bg-background"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-border bg-card overflow-hidden h-[460px]">
                    <iframe
                      src={activeDoc.url}
                      className="w-full h-full border-0"
                      title={`Dokumen ${activeDoc.documentType}`}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    {activeDoc.fileName || `${activeDoc.documentType}.pdf`}
                  </span>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <a
                        href={activeDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5"
                      >
                        <ExternalLink className="size-3.5" />
                        Buka Dokumen di Tab Baru
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={activeDoc.url}
                        download={activeDoc.fileName || `${activeDoc.documentType}.pdf`}
                        className="flex items-center gap-1.5"
                      >
                        <FileDown className="size-3.5" />
                        Unduh Berkas
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDoc(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Dialog */}
      <Dialog open={Boolean(approveModal)} onOpenChange={(open) => !open && setApproveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Persetujuan Kemitraan</DialogTitle>
            <DialogDescription>
              Menyetujui aplikasi akan mengaktifkan mitra konselor di platform Solulu.
            </DialogDescription>
          </DialogHeader>

          {approveModal && (
            <div className="flex flex-col gap-4 py-2 text-xs">
              <div className="rounded-xl border border-border p-3.5 bg-muted/20 flex flex-col gap-1.5">
                <span className="font-semibold text-foreground text-sm">
                  {approveModal.fullName}
                </span>
                <span className="text-muted-foreground">{approveModal.email}</span>
                <span className="text-muted-foreground">{approveModal.phone}</span>
                <Badge variant="outline" className="w-fit text-[10px] mt-1">
                  Kategori: {approveModal.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}
                </Badge>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="counselor-title-input" className="font-medium text-foreground text-xs">
                  Gelar / Titel Praktik Konselor
                </label>
                <Input
                  id="counselor-title-input"
                  value={counselorTitle}
                  onChange={(e) => setCounselorTitle(e.target.value)}
                  placeholder="Contoh: M.Psi., Psikolog atau S.Psi"
                  className="text-xs"
                />
                <span className="text-[11px] text-muted-foreground">
                  Gelar ini akan disematkan pada jadwal konsultasi dan kartu profil konselor.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="counselor-password-input" className="font-medium text-foreground text-xs">
                    Kata Sandi Akun Login (/counselor)
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="size-3" />
                    Buat Acak
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="counselor-password-input"
                    type={showPassword ? "text" : "password"}
                    value={initialPassword}
                    onChange={(e) => setInitialPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="text-xs pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Kata sandi ini otomatis dikirim via email dan dapat disalin langsung untuk dikirim via WhatsApp.
                </span>
              </div>

              <Alert className="border-primary/20 bg-primary/5 text-xs">
                <ShieldCheck className="size-4 text-primary" />
                <AlertDescription className="text-muted-foreground">
                  Sistem akan menerbitkan akun konselor resmi, mengaktifkan login, dan mengirimkan email kredensial via sistem Solulu.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveModal(null)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              onClick={handleApproveSubmit}
              disabled={isProcessing || initialPassword.trim().length < 8}
              id="confirm-approval-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Mengaktifkan Akun...
                </>
              ) : (
                "Setujui & Terbitkan Akun"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issued Credentials Success Modal (with Copy & WhatsApp) */}
      <Dialog
        open={Boolean(issuedCredentials)}
        onOpenChange={(open) => !open && setIssuedCredentials(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle>Akun Konselor Berhasil Diterbitkan!</DialogTitle>
            <DialogDescription>
              Akun login portal konselor telah aktif. Email notifikasi otomatis telah dikirim via Resend. Anda juga dapat menyalin kredensial berikut untuk dikirimkan melalui WhatsApp.
            </DialogDescription>
          </DialogHeader>

          {issuedCredentials && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col gap-2.5">
                <span className="font-semibold text-foreground text-sm">
                  {issuedCredentials.fullName}
                </span>

                <div className="flex flex-col gap-1 pt-1 border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground font-medium">Email Login:</span>
                  <div className="flex items-center justify-between p-2 rounded-md bg-background border border-border">
                    <code className="text-xs font-mono font-semibold">{issuedCredentials.email}</code>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Kata Sandi:</span>
                  <div className="flex items-center justify-between p-2 rounded-md bg-background border border-border">
                    <code className="text-xs font-mono font-bold text-primary">{issuedCredentials.password}</code>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground font-medium">URL Portal Konselor:</span>
                  <div className="flex items-center justify-between p-2 rounded-md bg-background border border-border">
                    <code className="text-[11px] font-mono text-muted-foreground">https://solulu.id/login</code>
                  </div>
                </div>
              </div>

              {/* WhatsApp message text template */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-xs h-9 cursor-pointer"
                  onClick={() => {
                    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://solulu.id"
                    const loginUrl = `${currentOrigin}/login`
                    const waText = `Halo ${issuedCredentials.fullName},\n\nSelamat! Aplikasi kemitraan konselor Anda di Solulu telah disetujui. Berikut adalah akun login portal konselor Anda:\n\n• Email: ${issuedCredentials.email}\n• Kata Sandi: ${issuedCredentials.password}\n• Tautan Login: ${loginUrl}\n\nSilakan masuk dan lengkapi jadwal praktik Anda. Terima kasih!\n- Tim Solulu`
                    navigator.clipboard.writeText(waText)
                    setIsCopied(true)
                    setTimeout(() => setIsCopied(false), 2500)
                  }}
                >
                  {isCopied ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span>Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Salin Format WhatsApp</span>
                    </>
                  )}
                </Button>

                {issuedCredentials.phone && (
                  <Button
                    className="w-full gap-2 text-xs h-9 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://solulu.id"
                      const loginUrl = `${currentOrigin}/login`
                      const cleanPhone = issuedCredentials.phone.replace(/[^0-9]/g, "").replace(/^0/, "62")
                      const waText = encodeURIComponent(
                        `Halo ${issuedCredentials.fullName},\n\nSelamat! Aplikasi kemitraan konselor Anda di Solulu telah disetujui. Berikut adalah akun login portal konselor Anda:\n\n• Email: ${issuedCredentials.email}\n• Kata Sandi: ${issuedCredentials.password}\n• Tautan Login: ${loginUrl}\n\nSilakan masuk dan lengkapi jadwal praktik Anda.\n- Tim Solulu`
                      )
                      window.open(`https://wa.me/${cleanPhone}?text=${waText}`, "_blank")
                    }}
                  >
                    <MessageSquare className="size-3.5" />
                    <span>Kirim via WhatsApp</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIssuedCredentials(null)}>
              Selesai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={Boolean(rejectModal)} onOpenChange={(open) => !open && setRejectModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Aplikasi Pendaftaran</DialogTitle>
            <DialogDescription>
              Aplikasi akan ditandai sebagai ditolak. Anda dapat mencantumkan alasan penolakan berkas.
            </DialogDescription>
          </DialogHeader>

          {rejectModal && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <span className="text-muted-foreground">
                Menolak berkas atas nama <strong>{rejectModal.fullName}</strong> ({rejectModal.email}).
              </span>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="rejection-reason-input" className="font-medium text-foreground text-xs">
                  Alasan Penolakan (Opsional)
                </label>
                <Textarea
                  id="rejection-reason-input"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Berkas izin praktik (STR) tidak terbaca jelas, masa berlaku habis, atau kualifikasi belum sesuai standar klinis Solulu."
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectModal(null)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={isProcessing}
              id="confirm-rejection-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Memproses...
                </>
              ) : (
                "Tolak Berkas"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
