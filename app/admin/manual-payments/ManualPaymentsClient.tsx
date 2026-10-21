"use client"

import * as React from "react"
import {
  ReceiptText,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Ban,
  FileText,
  Eye,
  RefreshCw,
  Sparkles,
  Download,
  X,
  CreditCard,
  User,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  type ManualPaymentQueueItem,
  confirmManualPaymentAdminAction,
  rejectManualPaymentAdminAction,
} from "./actions"

interface ManualPaymentsClientProps {
  initialItems: ManualPaymentQueueItem[]
}

const REJECTION_REASONS = [
  "Nominal transfer tidak sesuai / kurang",
  "Bukti transfer tidak terbaca / buram",
  "Dana belum masuk di mutasi bank resmi",
  "Indikasi bukti transfer tidak valid / palsu",
  "Klien membatalkan transaksi",
]

const PAYMENT_METHODS = [
  "Transfer Bank BCA (Manual)",
  "Transfer Bank Mandiri (Manual)",
  "Transfer Bank BRI (Manual)",
  "Transfer Bank BNI (Manual)",
  "QRIS Statis Kasir",
  "Tunai / Subsidi Layanan",
]

export function ManualPaymentsClient({ initialItems }: ManualPaymentsClientProps) {
  const [items, setItems] = React.useState<ManualPaymentQueueItem[]>(initialItems)
  const [activeTab, setActiveTab] = React.useState<"all" | "initial" | "extension">("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isPending, startTransition] = React.useTransition()

  // Slip Preview Modal
  const [previewSlipItem, setPreviewSlipItem] = React.useState<ManualPaymentQueueItem | null>(null)

  // Confirmation Modal
  const [confirmItem, setConfirmItem] = React.useState<ManualPaymentQueueItem | null>(null)
  const [selectedChannel, setSelectedChannel] = React.useState(PAYMENT_METHODS[0])
  const [refNumber, setRefNumber] = React.useState("")
  const [confirmNotes, setConfirmNotes] = React.useState("")
  const [isSubmittingConfirm, setIsSubmittingConfirm] = React.useState(false)

  // Rejection Modal
  const [rejectItem, setRejectItem] = React.useState<ManualPaymentQueueItem | null>(null)
  const [selectedReason, setSelectedReason] = React.useState(REJECTION_REASONS[0])
  const [rejectNotes, setRejectNotes] = React.useState("")
  const [isSubmittingReject, setIsSubmittingReject] = React.useState(false)

  // Filter items
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "initial" && item.paymentType !== "initial") return false
      if (activeTab === "extension" && item.paymentType !== "extension") return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchCode = item.bookingCode.toLowerCase().includes(q)
        const matchName = item.patientName.toLowerCase().includes(q)
        const matchPhone = item.patientPhone.toLowerCase().includes(q)
        const matchCounselor = item.counselorName.toLowerCase().includes(q)
        if (!matchCode && !matchName && !matchPhone && !matchCounselor) return false
      }

      return true
    })
  }, [items, activeTab, searchQuery])

  // Top KPIs
  const totalPending = items.length
  const initialPendingCount = items.filter((i) => i.paymentType === "initial").length
  const extensionPendingCount = items.filter((i) => i.paymentType === "extension").length
  const totalNominal = items.reduce((acc, curr) => acc + curr.nominalAmount, 0)

  // Handle Quick Open Confirm
  const handleOpenConfirm = (item: ManualPaymentQueueItem) => {
    setConfirmItem(item)
    setSelectedChannel(PAYMENT_METHODS[0])
    setRefNumber(`MANUAL-${Math.floor(100000 + Math.random() * 900000)}`)
    setConfirmNotes("Mutasi transfer bank diverifikasi oleh Admin.")
  }

  // Handle Submit Confirm
  const handleSubmitConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmItem) return

    setIsSubmittingConfirm(true)
    try {
      const res = await confirmManualPaymentAdminAction({
        bookingId: confirmItem.id,
        paymentType: confirmItem.paymentType,
        paymentMethod: selectedChannel,
        referenceNumber: refNumber.trim(),
        adminNotes: confirmNotes.trim(),
      })

      if (res.success) {
        toast.success(res.message || "Pembayaran berhasil dikonfirmasi Lunas!")
        setItems((prev) => prev.filter((i) => i.id !== confirmItem.id))
        setConfirmItem(null)
      } else {
        toast.error(res.error || "Gagal mengonfirmasi pembayaran.")
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memproses konfirmasi.")
    } finally {
      setIsSubmittingConfirm(false)
    }
  }

  // Handle Open Reject
  const handleOpenReject = (item: ManualPaymentQueueItem) => {
    setRejectItem(item)
    setSelectedReason(REJECTION_REASONS[0])
    setRejectNotes("")
  }

  // Handle Submit Reject
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectItem) return

    setIsSubmittingReject(true)
    try {
      const res = await rejectManualPaymentAdminAction({
        bookingId: rejectItem.id,
        paymentType: rejectItem.paymentType,
        reason: selectedReason,
        adminNotes: rejectNotes.trim(),
      })

      if (res.success) {
        toast.info(res.message || "Pembayaran manual berhasil ditolak.")
        setItems((prev) => prev.filter((i) => i.id !== rejectItem.id))
        setRejectItem(null)
      } else {
        toast.error(res.error || "Gagal menolak pembayaran.")
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menolak pembayaran.")
    } finally {
      setIsSubmittingReject(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Verifikasi Transfer Bank Manual
            </h1>
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 gap-1 font-mono">
              <Clock className="size-3 text-amber-500" />
              <span>{totalPending} Antrean</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Antrean validasi bukti mutasi transfer rekening klinik (BCA 123-456-7890 a.n. Solulu Mental Health)
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Total Menunggu</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">{totalPending}</span>
              <Badge variant="secondary" className="text-[10px]">Aktif</Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">Perlu verifikasi admin</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Booking Awal</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">{initialPendingCount}</span>
              <Badge variant="outline" className="text-[10px] text-primary">Sesi Baru</Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">Menunggu alokasi Zoom</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Pelunasan Extend</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">{extensionPendingCount}</span>
              <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400">
                +30/60 Menit
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">Perpanjangan konseling</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Nominal Menggantung</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                Rp {totalNominal.toLocaleString("id-ID")}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">Total dana transfer klien</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Content & Table */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Daftar Antrean Bukti Transfer
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Periksa slip mutasi bank sebelum melakukan konfirmasi lunas atau penolakan.
              </CardDescription>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode booking / klien..."
                  className="pl-8 h-8 text-xs w-full sm:w-56 bg-background"
                />
              </div>

              <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "all"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semua ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("initial")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "initial"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Booking Awal ({initialPendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("extension")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeTab === "extension"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Extend Sesi ({extensionPendingCount})
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <Empty className="py-16">
              <EmptyMedia variant="icon">
                <ReceiptText className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Belum Ada Antrean Transfer</EmptyTitle>
                <EmptyDescription>
                  Semua transaksi transfer bank manual telah diproses atau klien belum mengunggah bukti transfer baru.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span>Sistem siap menerima verifikasi otomatis dan manual secara bersamaan.</span>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Kode Booking</TableHead>
                    <TableHead>Nama Klien &amp; Kontak</TableHead>
                    <TableHead>Mitra Konselor</TableHead>
                    <TableHead>Jadwal Sesi</TableHead>
                    <TableHead>Tipe Transaksi</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Bukti Transfer</TableHead>
                    <TableHead className="text-right">Aksi Verifikasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={`${item.id}-${item.paymentType}`}>
                      <TableCell className="font-mono font-medium text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{item.bookingCode}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-foreground">
                            {item.patientName}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {item.patientPhone}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">
                            {item.counselorName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {item.counselorType}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs font-mono">
                          <span className="text-foreground">{item.scheduleDate || "Belum ada jadwal"}</span>
                          <span className="text-[11px] text-muted-foreground">
                            Slot {item.slotIndex} ({item.timeRange})
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={item.paymentType === "extension" ? "secondary" : "outline"}
                          className={`text-[10px] font-normal ${
                            item.paymentType === "extension"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                              : "text-foreground"
                          }`}
                        >
                          {item.paymentType === "extension" ? "Pelunasan Extend" : "Pemesanan Awal"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        Rp {item.nominalAmount.toLocaleString("id-ID")}
                      </TableCell>

                      <TableCell>
                        {item.slipUrl || item.slipR2Key ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewSlipItem(item)}
                            className="h-7 text-[11px] gap-1.5 cursor-pointer"
                          >
                            <Eye className="size-3" data-icon="inline-start" />
                            <span>Lihat Struk</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Belum diunggah
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenConfirm(item)}
                            className="h-7 text-[11px] font-medium gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="size-3" data-icon="inline-start" />
                            <span>Konfirmasi Lunas</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReject(item)}
                            className="h-7 text-[11px] font-medium gap-1 text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
                          >
                            <Ban className="size-3" data-icon="inline-start" />
                            <span>Tolak</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: BUKTI TRANSFER PREVIEW (CLOUDFLARE R2) */}
      <Dialog open={Boolean(previewSlipItem)} onOpenChange={(open) => !open && setPreviewSlipItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Bukti Transfer Bank
            </DialogTitle>
            <DialogDescription className="text-xs">
              {previewSlipItem?.bookingCode} • {previewSlipItem?.patientName} • Rp {previewSlipItem?.nominalAmount.toLocaleString("id-ID")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="relative rounded-xl border border-border bg-muted/40 min-h-[220px] max-h-[360px] overflow-hidden flex items-center justify-center p-2">
              {previewSlipItem?.slipUrl ? (
                previewSlipItem.slipUrl.toLowerCase().endsWith(".pdf") ? (
                  <div className="flex flex-col items-center gap-2 text-center p-4">
                    <FileText className="size-12 text-primary/70" />
                    <span className="text-xs font-medium text-foreground">Dokumen Bukti Transfer (PDF)</span>
                    <a
                      href={previewSlipItem.slipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline flex items-center gap-1 mt-1"
                    >
                      Buka Dokumen PDF <ExternalLink className="size-3" />
                    </a>
                  </div>
                ) : (
                  <img
                    src={previewSlipItem.slipUrl}
                    alt={`Bukti Transfer ${previewSlipItem.bookingCode}`}
                    className="max-h-[340px] max-w-full rounded-lg object-contain shadow-xs"
                  />
                )
              ) : (
                <div className="flex flex-col items-center gap-1 text-center p-6 text-muted-foreground text-xs">
                  <AlertTriangle className="size-8 text-amber-500 mb-1" />
                  <span>Klien belum melampirkan berkas bukti transfer fisik.</span>
                  <span className="text-[11px]">Validasi dapat dilakukan melalui pengecekan mutasi nomor referensi BCA.</span>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-2.5 flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Rekening Tujuan:</span>
                <span className="font-medium text-foreground">BCA 123-456-7890 (Solulu)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Nominal Seharusnya:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  Rp {previewSlipItem?.nominalAmount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Keamanan Token R2:</span>
                <span className="text-[11px] text-muted-foreground">Tautan aman berlaku 15 menit</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row sm:justify-between items-center gap-2">
            {previewSlipItem?.slipUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
                className="h-8 text-xs gap-1.5"
              >
                <a href={previewSlipItem.slipUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="size-3.5" data-icon="inline-start" />
                  Unduh Berkas
                </a>
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewSlipItem(null)}
                className="h-8 text-xs"
              >
                Tutup
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const target = previewSlipItem
                  setPreviewSlipItem(null)
                  if (target) handleOpenConfirm(target)
                }}
                className="h-8 text-xs font-medium gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="size-3" data-icon="inline-start" />
                Lanjutkan Konfirmasi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: KONFIRMASI LUNAS */}
      <Dialog open={Boolean(confirmItem)} onOpenChange={(open) => !open && setConfirmItem(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmitConfirm} className="flex flex-col gap-4">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CreditCard className="size-4" />
                </div>
                <div className="flex flex-col">
                  <DialogTitle className="text-base font-bold text-foreground">
                    Konfirmasi Pembayaran Lunas
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {confirmItem?.bookingCode} • {confirmItem?.patientName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipe Transaksi:</span>
                <span className="font-semibold text-foreground">
                  {confirmItem?.paymentType === "extension" ? "Pelunasan Perpanjangan Sesi" : "Pemesanan Awal Sesi"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mitra Konselor:</span>
                <span className="font-medium text-foreground">{confirmItem?.counselorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Jadwal Sesi:</span>
                <span className="font-mono text-foreground">
                  {confirmItem?.scheduleDate} ({confirmItem?.timeRange})
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Nominal Terverifikasi:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                  Rp {confirmItem?.nominalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <FieldGroup className="flex flex-col gap-3">
              <Field>
                <FieldLabel className="text-xs">Kanal Rekening Tujuan Bank</FieldLabel>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Pilih rekening bank..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method} className="text-xs">
                          {method}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel className="text-xs">Nomor Referensi Mutasi</FieldLabel>
                <Input
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="Contoh: BCA-894123"
                  className="h-8 text-xs font-mono bg-background"
                />
              </Field>

              <Field>
                <FieldLabel className="text-xs">Catatan Admin (Opsional)</FieldLabel>
                <Input
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  placeholder="Catatan verifikasi transfer..."
                  className="h-8 text-xs bg-background"
                />
              </Field>
            </FieldGroup>

            {confirmItem?.paymentType === "initial" && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 leading-snug">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Otomatisasi Alokasi Host Zoom Pro
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Sistem akan mengalokasikan akun Zoom Pro bebas bentrok, menerbitkan meeting ID, dan mengirim tiket konfirmasi ke pasien &amp; konselor.
                  </span>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmItem(null)}
                disabled={isSubmittingConfirm}
                className="h-8 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingConfirm}
                className="h-8 text-xs font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmittingConfirm ? (
                  <>
                    <Spinner className="size-3.5" data-icon="inline-start" />
                    <span>Memproses Alokasi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" data-icon="inline-start" />
                    <span>Konfirmasi Lunas &amp; Terbitkan Sesi</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: TOLAK PEMBAYARAN */}
      <Dialog open={Boolean(rejectItem)} onOpenChange={(open) => !open && setRejectItem(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmitReject} className="flex flex-col gap-4">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                  <Ban className="size-4" />
                </div>
                <div className="flex flex-col">
                  <DialogTitle className="text-base font-bold text-foreground">
                    Tolak Pembayaran Transfer
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {rejectItem?.bookingCode} • {rejectItem?.patientName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5 text-destructive text-xs">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 leading-relaxed">
                <span className="font-semibold">Konfirmasi Pembatalan &amp; Pelepasan Slot</span>
                <span className="text-[11px] text-muted-foreground">
                  {rejectItem?.paymentType === "initial"
                    ? "Menolak pembayaran akan membatalkan pemesanan, mengembalikan slot jadwal ke kalender publik, dan menandai transaksi sebagai GAGAL."
                    : "Menolak pembayaran perpanjangan akan menandai status pembayaran extend sebagai DITOLAK."}
                </span>
              </div>
            </div>

            <FieldGroup className="flex flex-col gap-3">
              <Field>
                <FieldLabel className="text-xs">
                  Alasan Penolakan <span className="text-destructive">*</span>
                </FieldLabel>
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Pilih alasan penolakan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {REJECTION_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason} className="text-xs">
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel className="text-xs">Catatan Tambahan untuk Audit (Opsional)</FieldLabel>
                <Input
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Misal: Bukti terpotong, mutasi BCA atas nama pengirim tidak ditemukan..."
                  className="h-8 text-xs bg-background"
                />
              </Field>
            </FieldGroup>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectItem(null)}
                disabled={isSubmittingReject}
                className="h-8 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={isSubmittingReject}
                className="h-8 text-xs font-medium gap-1.5"
              >
                {isSubmittingReject ? (
                  <>
                    <Spinner className="size-3.5" data-icon="inline-start" />
                    <span>Menolak...</span>
                  </>
                ) : (
                  <>
                    <Ban className="size-3.5" data-icon="inline-start" />
                    <span>Konfirmasi Tolak Pembayaran</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
