"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Clock,
  Video,
  User,
  ExternalLink,
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Ban,
  Calendar,
  Layers,
  FileText,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { RescheduleAdminDialog } from "./RescheduleAdminDialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { FIXED_SLOTS } from "@/lib/operator/types"
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { buildTableHref, type TableState } from "@/lib/data-table/search-params"
import { formatDateId, formatDateTimeWib } from "@/lib/format/datetime"
import { formatRupiah } from "@/lib/utils"
import type { BookingKpis } from "./list-query"
import { BOOKINGS_PATH, bookingsTableConfig } from "./table-config"
import {
  type AdminBookingItem,
  type BookingCounselorOption,
  markBookingNoShowAction,
  markBookingFollowedUpAction,
  generateWhatsAppReportUrl,
} from "./actions"

interface BookingsClientProps {
  bookings: AdminBookingItem[]
  total: number
  kpis: BookingKpis
  counselorOptions: BookingCounselorOption[]
  state: TableState
}

const SLOT_OPTIONS = FIXED_SLOTS.map((slot) => ({
  value: String(slot.slotIndex),
  label: `Slot ${slot.slotIndex} (${slot.startTime} - ${slot.endTime} WIB)`,
}))

const STATUS_OPTIONS = [
  { value: "pending_payment", label: "Menunggu Pembayaran" },
  { value: "confirmed", label: "Terkonfirmasi (Aktif)" },
  { value: "completed", label: "Selesai (Completed)" },
  { value: "cancelled", label: "Dibatalkan (Cancelled)" },
  { value: "no_show", label: "No-Show" },
  { value: "expired", label: "Kedaluwarsa" },
]

const REPORT_STATUS_OPTIONS = [
  { value: "filled", label: "Laporan Lengkap (Siap)" },
  { value: "pending", label: "Menunggu Laporan Konselor" },
]

export function BookingsClient({
  bookings,
  total,
  kpis,
  counselorOptions,
  state,
}: BookingsClientProps) {
  const router = useRouter()

  // Report Detail Preview Modal
  const [selectedReportBooking, setSelectedReportBooking] = React.useState<AdminBookingItem | null>(null)

  // Send WhatsApp Without Report Confirmation Dialog
  const [confirmSendWithoutReportItem, setConfirmSendWithoutReportItem] = React.useState<AdminBookingItem | null>(null)

  // Reschedule Admin Dialog State
  const [rescheduleItem, setRescheduleItem] = React.useState<AdminBookingItem | null>(null)

  // No-Show Dialog State
  const [noShowItem, setNoShowItem] = React.useState<AdminBookingItem | null>(null)
  const [isSubmittingNoShow, setIsSubmittingNoShow] = React.useState(false)

  // Follow-Up Loading State by Booking ID
  const [followingUpId, setFollowingUpId] = React.useState<string | null>(null)

  const activeReport = state.filters.report
  const reportHref = (value: "filled" | "pending") =>
    buildTableHref(BOOKINGS_PATH, state, bookingsTableConfig, {
      report: activeReport === value ? null : value,
    })

  // Action: Tandai No-Show
  const handleConfirmNoShow = async () => {
    if (!noShowItem) return
    setIsSubmittingNoShow(true)

    try {
      const res = await markBookingNoShowAction({ bookingId: noShowItem.id })
      if (res.success) {
        toast.success(res.message || "Sesi berhasil ditandai sebagai No-Show.")
        router.refresh()
        setNoShowItem(null)
      } else {
        toast.error(res.error || "Gagal menandai No-Show.")
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menandai No-Show.")
    } finally {
      setIsSubmittingNoShow(false)
    }
  }

  // Action: Kirim WA Laporan
  const handleSendWhatsAppReport = async (booking: AdminBookingItem) => {
    setFollowingUpId(booking.id)

    try {
      // 1. Generate pre-filled wa.me link
      const waUrl = await generateWhatsAppReportUrl({
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        accessToken: booking.accessToken,
      })

      // 2. Open WhatsApp in new tab
      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank", "noopener,noreferrer")
      }

      // 3. Mutate database: is_followed_up = true, followed_up_at = NOW()
      const res = await markBookingFollowedUpAction({ bookingId: booking.id })
      if (res.success) {
        toast.success(`Tautan laporan berhasil disiapkan untuk ${booking.patientName}!`)
        router.refresh()
      } else {
        toast.error(res.error || "Gagal mencatat status follow-up.")
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal membuka WhatsApp.")
    } finally {
      setFollowingUpId(null)
    }
  }

  const columns: DataTableColumn<AdminBookingItem>[] = [
    {
      id: "code",
      header: "Kode Booking",
      sortKey: "bookingCode",
      cell: (b) => {
        return (
          <>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{b.bookingCode}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDateId(b.createdAt)}
                            </span>
                          </div>
          </>
        )
      },
    },
    {
      id: "client",
      header: "Klien & WhatsApp",
      sortKey: "patientName",
      cell: (b) => {
        return (
          <>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs text-foreground">
                              {b.patientName}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {b.patientPhone}
                            </span>
                          </div>
          </>
        )
      },
    },
    {
      id: "counselor",
      header: "Mitra Konselor",
      sortKey: "counselorName",
      cell: (b) => {
        return (
          <>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {b.counselorName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {b.counselorType}
                            </span>
                          </div>
          </>
        )
      },
    },
    {
      id: "schedule",
      header: "Jadwal & Slot",
      sortKey: "scheduleDate",
      cell: (b) => {
        return (
          <>
                          <div className="flex flex-col text-xs font-mono">
                            <span className="text-foreground">{b.scheduleDate ? formatDateId(b.scheduleDate) : "Belum ada jadwal"}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 h-4 font-mono text-muted-foreground"
                              >
                                Slot {b.slotIndex}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {b.timeRange ? `${b.timeRange} WIB` : ""}
                              </span>
                            </div>
                          </div>
          </>
        )
      },
    },
    {
      id: "zoom",
      header: "Ruang Zoom Pro",
      cell: (b) => {
        return (
          <>
                          {b.zoomMeetingId ? (
                            <div className="flex flex-col text-xs font-mono">
                              <span className="text-foreground truncate max-w-[140px]">
                                ID: {b.zoomMeetingId}
                              </span>
                              {b.zoomHostKey && (
                                <span className="text-[10px] text-muted-foreground">
                                  Host Key: {b.zoomHostKey}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              Belum dialokasikan
                            </span>
                          )}
          </>
        )
      },
    },
    {
      id: "status",
      header: "Status Sesi",
      sortKey: "status",
      cell: (b) => {
        const statusVariant =
          b.status === "confirmed"
            ? "default"
            : b.status === "completed"
            ? "secondary"
            : b.status === "cancelled" || b.status === "no_show"
            ? "destructive"
            : "outline"
        return (
          <>
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant={statusVariant} className="text-[10px]">
                              {b.stageLabel}
                            </Badge>

                            {/* Clinical Report Status Badge */}
                            {b.status === "completed" && (
                              b.hasSessionReport ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 gap-1 font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                >
                                  <CheckCircle2 className="size-2.5 text-emerald-600" />
                                  <span>Laporan Lengkap</span>
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 gap-1 font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                >
                                  <Clock className="size-2.5 text-amber-600" />
                                  <span>Menunggu Catatan</span>
                                </Badge>
                              )
                            )}

                            {/* Extended Marker */}
                            {b.isExtended && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                +{b.extensionFee ? `${formatRupiah(b.extensionFee)}` : "Extend"}
                              </span>
                            )}
                          </div>
          </>
        )
      },
    },
    {
      id: "actions",
      header: "Aksi Operasional",
      align: "right",
      cell: (b) => {
        return (
          <>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Lihat Laporan Klinis (Jika sudah diisi) */}
                            {b.hasSessionReport && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReportBooking(b)}
                                className="h-7 text-[11px] gap-1 text-primary hover:bg-primary/10 border-primary/30 cursor-pointer"
                                title="Lihat rincian laporan sesi klinis"
                              >
                                <FileText className="size-3" data-icon="inline-start" />
                                <span className="hidden sm:inline">Lihat Laporan</span>
                              </Button>
                            )}

                            {b.status === "confirmed" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setRescheduleItem(b)}
                                className="h-7 text-[11px] gap-1 cursor-pointer"
                              >
                                <Calendar className="size-3" data-icon="inline-start" />
                                <span>Reschedule</span>
                              </Button>
                            )}

                            {/* 1. Tombol Tandai No-Show (Syarat: Tidak hadir dalam 30 menit) */}
                            {b.canMarkNoShow ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setNoShowItem(b)}
                                className="h-7 text-[11px] gap-1 text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer"
                              >
                                <AlertTriangle className="size-3" data-icon="inline-start" />
                                <span>Tandai No-Show</span>
                              </Button>
                            ) : b.status === "no_show" ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono bg-muted/40 px-2 py-1 rounded-md border border-border">
                                      <CheckCircle2 className="size-3 text-muted-foreground" />
                                      <span>Tercatat No-Show</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    Ditandai pada:{" "}
                                    {b.noShowMarkedAt
                                      ? formatDateTimeWib(b.noShowMarkedAt)
                                      : "Waktu tercatat"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null}

                            {/* 2. Tombol Kirim WA Laporan (hanya sesi selesai) */}
                            {b.status === "completed" && (
                            <Button
                              type="button"
                              size="sm"
                              variant={b.isFollowedUp ? "outline" : "default"}
                              disabled={followingUpId === b.id}
                              onClick={() => {
                                if (b.status === "completed" && !b.hasSessionReport) {
                                  setConfirmSendWithoutReportItem(b)
                                } else {
                                  handleSendWhatsAppReport(b)
                                }
                              }}
                              className={`h-7 text-[11px] gap-1 cursor-pointer font-medium ${
                                b.isFollowedUp
                                  ? "text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                            >
                              {followingUpId === b.id ? (
                                <>
                                  <Spinner className="size-3" data-icon="inline-start" />
                                  <span>Membuka WA...</span>
                                </>
                              ) : b.isFollowedUp ? (
                                <>
                                  <CheckCircle2 className="size-3 text-emerald-600" data-icon="inline-start" />
                                  <span>Kirim Ulang WA</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="size-3" data-icon="inline-start" />
                                  <span>Kirim WA Laporan</span>
                                </>
                              )}
                            </Button>
                            )}
                          </div>
          </>
        )
      },
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Pengawasan Operasional Booking
            </h1>
            <Badge variant="outline">
              <Layers data-icon="inline-start" />
              <span>{kpis.total} Sesi Terdata</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Oversight siklus pemesanan, filter matriks slot, monitoring No-Show 30 menit, dan gerbang WhatsApp laporan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/manual-payments">
              <Clock data-icon="inline-start" />
              <span>Verifikasi Transfer Manual</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/sessions">
              <Calendar data-icon="inline-start" />
              <span>Kalender Jadwal</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Total Pemesanan</span>
            <span className="text-2xl font-bold font-mono">{kpis.total}</span>
            <span className="text-xs text-muted-foreground">Seluruh sesi terdaftar</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Terkonfirmasi &amp; Aktif</span>
            <span className="text-2xl font-bold font-mono">{kpis.confirmed}</span>
            <span className="text-xs text-muted-foreground">Zoom Pro telah dialokasikan</span>
          </CardContent>
        </Card>

        <Link href={reportHref("filled")} scroll={false} className="block" title="Klik untuk menyaring sesi dengan laporan lengkap">
          <Card>
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Laporan Selesai</span>
                {activeReport === "filled" ? <Badge>Filter aktif</Badge> : null}
              </div>
              <span className="text-2xl font-bold font-mono">{kpis.reportsFilled}</span>
              <span className="text-xs text-muted-foreground">Catatan klinis sudah diisi</span>
            </CardContent>
          </Card>
        </Link>

        <Link href={reportHref("pending")} scroll={false} className="block" title="Klik untuk menyaring sesi yang konselornya belum mengisi laporan klinis">
          <Card>
            <CardContent className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Menunggu Laporan</span>
                {activeReport === "pending" ? <Badge>Filter aktif</Badge> : null}
              </div>
              <span className="text-2xl font-bold font-mono">{kpis.reportsPending}</span>
              <span className="text-xs text-muted-foreground">
                {kpis.reportsPending > 0
                  ? "Sesi selesai belum ada catatan klinis"
                  : "Semua rekam medis lengkap"}
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Filterable Table Card */}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Daftar Booking Sesi Klinis</CardTitle>
            <CardDescription>
              Filter berdasarkan slot harian, status sesi, status kelengkapan laporan konselor, dan mitra pendamping.
              Semua pilihan tersimpan di URL sehingga dapat dibagikan.
            </CardDescription>
          </div>
          <DataTableToolbar
            pathname={BOOKINGS_PATH}
            state={state}
            config={bookingsTableConfig}
            search={{ name: "q", placeholder: "Cari kode booking / nama / kontak..." }}
            selects={[
              { name: "slot", placeholder: "Pilih slot waktu", allLabel: "Semua Slot (1-7)", options: SLOT_OPTIONS },
              { name: "status", placeholder: "Pilih status sesi", allLabel: "Semua Status Sesi", options: STATUS_OPTIONS },
              { name: "report", placeholder: "Status laporan", allLabel: "Semua Status Laporan", options: REPORT_STATUS_OPTIONS },
              {
                name: "counselor",
                placeholder: "Pilih konselor",
                allLabel: "Semua Konselor",
                options: counselorOptions.map((c) => ({
                  value: c.id,
                  label: `${c.fullName} (${c.counselorType})`,
                })),
              },
            ]}
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={bookings}
            rowKey={(b) => b.id}
            total={total}
            state={state}
            config={bookingsTableConfig}
            pathname={BOOKINGS_PATH}
            empty={{
              icon: <CalendarCheck />,
              title: "Tidak Ada Sesi yang Cocok",
              description:
                "Tidak ditemukan sesi booking yang sesuai dengan kriteria filter atau kata kunci pencarian Anda.",
            }}
          />
        </CardContent>
      </Card>

      <RescheduleAdminDialog
        booking={rescheduleItem}
        counselors={counselorOptions}
        onClose={() => setRescheduleItem(null)}
        onDone={() => router.refresh()}
      />

      {/* DIALOG KONFIRMASI TANDAI NO-SHOW */}
      <Dialog open={Boolean(noShowItem)} onOpenChange={(open) => !open && setNoShowItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertTriangle className="size-4" />
              </div>
              <div className="flex flex-col">
                <DialogTitle className="text-base font-bold text-foreground">
                  Tandai Klien No-Show (Tidak Hadir)
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {noShowItem?.bookingCode} • {noShowItem?.patientName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5 text-destructive">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 leading-relaxed">
                <span className="font-semibold">Aturan Batas Hadir 30 Menit (SOP Solulu)</span>
                <span className="text-[11px] text-muted-foreground">
                  Sesuai ketentuan klinis, jika klien tidak memasuki ruang Zoom hingga 30 menit setelah jadwal sesi dimulai, admin berhak menandai sesi sebagai No-Show.
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jadwal Sesi:</span>
                <span className="font-mono text-foreground">
                  {noShowItem?.scheduleDate} ({noShowItem?.timeRange})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Konselor Pendamping:</span>
                <span className="font-medium text-foreground">{noShowItem?.counselorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Baru:</span>
                <span className="font-semibold text-foreground">
                  Status diubah ke <Badge variant="destructive" className="text-[10px]">no_show</Badge>
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNoShowItem(null)}
              disabled={isSubmittingNoShow}
              className="h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleConfirmNoShow}
              disabled={isSubmittingNoShow}
              className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
            >
              {isSubmittingNoShow ? (
                <>
                  <Spinner className="size-3.5" data-icon="inline-start" />
                  <span>Memproses Status...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3.5" data-icon="inline-start" />
                  <span>Konfirmasi Tandai No-Show</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 1: LIHAT RINCIAN LAPORAN KLINIS (ADMIN READ-ONLY) */}
      <Dialog open={Boolean(selectedReportBooking)} onOpenChange={(open) => !open && setSelectedReportBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText className="size-4.5" />
              </div>
              <div className="flex flex-col">
                <DialogTitle className="text-base font-bold text-foreground">
                  Laporan Sesi Klinis Konselor
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedReportBooking?.bookingCode} • Klien: {selectedReportBooking?.patientName} • Konselor: {selectedReportBooking?.counselorName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 text-xs">
            {/* Metadata Ringkas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-muted/40 border border-border/60">
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Jadwal Sesi</span>
                <span className="font-semibold text-foreground">
                  {selectedReportBooking?.scheduleDate} ({selectedReportBooking?.timeRange})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Durasi Riil Konseling</span>
                <span className="font-semibold text-foreground">
                  {selectedReportBooking?.reportDetails?.actualDurationMinutes
                    ? `${selectedReportBooking.reportDetails.actualDurationMinutes} Menit`
                    : "90 Menit"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-medium">Waktu Diserahkan</span>
                <span className="font-semibold text-foreground">
                  {selectedReportBooking?.reportDetails?.createdAt
                    ? formatDateTimeWib(selectedReportBooking.reportDetails.createdAt)
                    : "-"}
                </span>
              </div>
            </div>

            {/* Permasalahan Utama */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Permasalahan Utama (Main Issue)
              </span>
              <div className="p-3 rounded-md bg-background border border-border text-foreground font-medium">
                {selectedReportBooking?.reportDetails?.mainIssue || "-"}
              </div>
            </div>

            {/* Ringkasan Dinamika Sesi */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Ringkasan Dinamika Sesi (Clinical Summary)
              </span>
              <div className="p-3 rounded-md bg-background border border-border text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedReportBooking?.reportDetails?.summary || "Tidak ada ringkasan tertulis."}
              </div>
            </div>

            {/* Rencana Aksi */}
            {selectedReportBooking?.reportDetails?.actionPlan && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Rencana Aksi & Latihan Mandiri (Action Plan)
                </span>
                <div className="p-3 rounded-md bg-background border border-border text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedReportBooking.reportDetails.actionPlan}
                </div>
              </div>
            )}

            {/* Rekomendasi Sesi Lanjutan */}
            {selectedReportBooking?.reportDetails?.followUpRecommendation && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Rekomendasi Konselor untuk Klien
                </span>
                <div className="p-3 rounded-md bg-background border border-border text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedReportBooking.reportDetails.followUpRecommendation}
                </div>
              </div>
            )}

            {/* Zero Clinical Leak Privacy Disclaimer */}
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="text-[11px] leading-relaxed">
                <strong>Kepatuhan Etika & Kerahasiaan Medis:</strong> Catatan internal pribadi konselor (<em>Internal Notes</em>) dilindungi dan disembunyikan secara otomatis demi menjaga kerahasiaan proses terapi klien.
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedReportBooking(null)}
              className="text-xs h-8 cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (selectedReportBooking) {
                  const b = selectedReportBooking
                  setSelectedReportBooking(null)
                  handleSendWhatsAppReport(b)
                }
              }}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer font-medium"
            >
              <MessageSquare className="size-3.5" />
              <span>Kirimkan Tautan ke Klien via WA</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: PERINGATAN KIRIM WA SAAT LAPORAN BELUM DIISI */}
      <Dialog
        open={Boolean(confirmSendWithoutReportItem)}
        onOpenChange={(open) => !open && setConfirmSendWithoutReportItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-4" />
              </div>
              <div className="flex flex-col">
                <DialogTitle className="text-base font-bold text-foreground">
                  Catatan Konselor Belum Lengkap
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {confirmSendWithoutReportItem?.bookingCode} • Klien: {confirmSendWithoutReportItem?.patientName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <Clock className="size-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex flex-col gap-0.5 leading-relaxed">
                <span className="font-semibold">Mitra Konselor Belum Menyerahkan Laporan</span>
                <span className="text-[11px] text-muted-foreground">
                  Mitra konselor <strong>{confirmSendWithoutReportItem?.counselorName}</strong> belum mengisi formulir catatan klinis untuk sesi ini. Jika Anda mengirim tautan sekarang, klien akan melihat status laporan masih dalam proses.
                </span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Disarankan untuk menghubungi mitra konselor terlebih dahulu untuk melengkapi ringkasan sesi sebelum meneruskan ke klien. Apakah Anda tetap ingin membuka WhatsApp?
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmSendWithoutReportItem(null)}
              className="h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              onClick={() => {
                if (confirmSendWithoutReportItem) {
                  const b = confirmSendWithoutReportItem
                  setConfirmSendWithoutReportItem(null)
                  handleSendWhatsAppReport(b)
                }
              }}
              className="h-8 text-xs font-medium gap-1.5 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
            >
              <MessageSquare className="size-3.5" />
              <span>Tetap Buka WhatsApp</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
