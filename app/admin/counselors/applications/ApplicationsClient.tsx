"use client"

import * as React from "react"
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
  } | null>(null)

  // Review modal state
  const [approveModal, setApproveModal] = React.useState<CounselorApplicationView | null>(null)
  const [counselorTitle, setCounselorTitle] = React.useState("")
  const [rejectModal, setRejectModal] = React.useState<CounselorApplicationView | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

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
    <div className="w-full flex flex-col gap-6">
      {/* Header & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-64">Nama & Kategori</TableHead>
                <TableHead className="w-56">Kontak</TableHead>
                <TableHead className="min-w-64">Berkas Kualifikasi &amp; Izin Praktik</TableHead>
                <TableHead className="w-32">Persetujuan Etik</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-40 text-right">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    Tidak ada data pendaftaran yang sesuai kriteria pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/30">
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground text-sm">
                          {app.fullName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={app.counselorType === "psychologist" ? "default" : "secondary"}
                            className="text-[10px] py-0"
                          >
                            {app.counselorType === "psychologist"
                              ? "Psikolog Klinis"
                              : "Konselor Sebaya"}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                          {app.bio}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <a
                          href={`mailto:${app.email}`}
                          className="flex items-center gap-1.5 text-foreground hover:underline text-xs"
                        >
                          <Mail className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[180px]">{app.email}</span>
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
                        <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(app.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {/* CV */}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleViewDocument(app.id, "cv")}
                          disabled={docLoading}
                          className="text-[11px] h-7"
                          id={`view-cv-${app.id}`}
                        >
                          <FileText className="size-3 mr-1 text-primary" />
                          CV
                        </Button>

                        {/* KTP */}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleViewDocument(app.id, "ktp")}
                          disabled={docLoading}
                          className="text-[11px] h-7"
                          id={`view-ktp-${app.id}`}
                        >
                          <FileText className="size-3 mr-1 text-primary" />
                          KTP
                        </Button>

                        {/* Ijazah */}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleViewDocument(app.id, "diploma")}
                          disabled={docLoading}
                          className="text-[11px] h-7"
                          id={`view-diploma-${app.id}`}
                        >
                          <FileText className="size-3 mr-1 text-primary" />
                          Ijazah
                        </Button>

                        {/* Izin Praktik / STR */}
                        {app.strR2Key ? (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleViewDocument(app.id, "str")}
                            disabled={docLoading}
                            className="text-[11px] h-7 bg-primary/10 text-primary hover:bg-primary/20"
                            id={`view-str-${app.id}`}
                          >
                            <ShieldCheck className="size-3 mr-1" />
                            Izin Praktik Aktif
                          </Button>
                        ) : app.counselorType === "psychologist" ? (
                          <Badge variant="destructive" className="text-[10px] h-7 px-2">
                            Izin Praktik Tidak Ada
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground self-center px-1">
                            (Tanpa Izin Praktik)
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                          <CheckCircle2 className="size-3.5" />
                          Disetujui
                        </span>
                        <span className="text-[10px]">
                          {new Date(app.agreedToTermsAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="align-top py-4">
                      {app.status === "pending" && (
                        <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 text-xs">
                          Menunggu
                        </Badge>
                      )}
                      {app.status === "approved" && (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-xs">
                          Disetujui
                        </Badge>
                      )}
                      {app.status === "rejected" && (
                        <Badge variant="destructive" className="text-xs">
                          Ditolak
                        </Badge>
                      )}
                      {app.rejectionReason && (
                        <span className="block text-[10px] text-muted-foreground mt-1 italic">
                          Alasan: {app.rejectionReason}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="align-top py-4 text-right">
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
                            className="h-8 text-xs font-medium"
                          >
                            <ShieldCheck className="size-3.5 mr-1" />
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
                            className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="size-3.5 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      ) : app.status === "approved" ? (
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <UserCheck className="size-3.5 text-emerald-600" />
                          Terdaftar
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Ditolak
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
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

            <div className="flex items-center justify-center p-8 rounded-xl border border-dashed border-border bg-card">
              <div className="text-center flex flex-col items-center gap-3">
                <FileText className="size-12 text-primary/70" />
                <span className="text-sm font-medium text-foreground">
                  Berkas siap ditinjau
                </span>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <a
                      href={activeDoc?.url}
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
                      href={activeDoc?.url}
                      download
                      className="flex items-center gap-1.5"
                    >
                      <FileDown className="size-3.5" />
                      Unduh Berkas
                    </a>
                  </Button>
                </div>
              </div>
            </div>
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

              <Alert className="border-primary/20 bg-primary/5 text-xs">
                <ShieldCheck className="size-4 text-primary" />
                <AlertDescription className="text-muted-foreground">
                  Sistem akan memanggil Supabase Admin API untuk mengirimkan email aktivasi akun dan membuat entri konselor resmi.
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
              disabled={isProcessing}
              id="confirm-approval-btn"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Mengirim Undangan...
                </>
              ) : (
                "Setujui & Kirim Undangan"
              )}
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
