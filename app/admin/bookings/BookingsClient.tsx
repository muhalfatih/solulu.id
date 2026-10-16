"use client"

import * as React from "react"
import Link from "next/link"
import {
  CalendarCheck,
  Search,
  Filter,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import {
  type AdminBookingItem,
  type BookingCounselorOption,
  markBookingNoShowAction,
  markBookingFollowedUpAction,
  generateWhatsAppReportUrl,
} from "./actions"

interface BookingsClientProps {
  initialBookings: AdminBookingItem[]
  counselorOptions: BookingCounselorOption[]
}

const SLOT_OPTIONS = [
  { value: "0", label: "Semua Slot (1-7)" },
  { value: "1", label: "Slot 1 (08:00 - 10:00)" },
  { value: "2", label: "Slot 2 (10:00 - 12:00)" },
  { value: "3", label: "Slot 3 (12:00 - 14:00)" },
  { value: "4", label: "Slot 4 (14:00 - 16:00)" },
  { value: "5", label: "Slot 5 (16:00 - 18:00)" },
  { value: "6", label: "Slot 6 (18:00 - 20:00)" },
  { value: "7", label: "Slot 7 (20:00 - 22:00)" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status Sesi" },
  { value: "pending_payment", label: "Menunggu Pembayaran" },
  { value: "confirmed", label: "Terkonfirmasi (Aktif)" },
  { value: "completed", label: "Selesai (Completed)" },
  { value: "cancelled", label: "Dibatalkan (Cancelled)" },
]

export function BookingsClient({
  initialBookings,
  counselorOptions,
}: BookingsClientProps) {
  const [bookingsList, setBookingsList] = React.useState<AdminBookingItem[]>(initialBookings)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedSlot, setSelectedSlot] = React.useState("0")
  const [selectedStatus, setSelectedStatus] = React.useState("all")
  const [selectedCounselor, setSelectedCounselor] = React.useState("all")

  // No-Show Dialog State
  const [noShowItem, setNoShowItem] = React.useState<AdminBookingItem | null>(null)
  const [isSubmittingNoShow, setIsSubmittingNoShow] = React.useState(false)

  // Follow-Up Loading State by Booking ID
  const [followingUpId, setFollowingUpId] = React.useState<string | null>(null)

  // Filter Bookings
  const filteredBookings = React.useMemo(() => {
    return bookingsList.filter((b) => {
      // Slot Index filter
      if (selectedSlot !== "0" && b.slotIndex !== parseInt(selectedSlot, 10)) {
        return false
      }

      // Status filter
      if (selectedStatus !== "all" && b.status !== selectedStatus) {
        return false
      }

      // Counselor filter
      if (selectedCounselor !== "all" && b.counselorId !== selectedCounselor) {
        return false
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchCode = b.bookingCode.toLowerCase().includes(q)
        const matchName = b.patientName.toLowerCase().includes(q)
        const matchPhone = b.patientPhone.includes(q)
        const matchEmail = b.patientEmail.toLowerCase().includes(q)
        const matchCounselor = b.counselorName.toLowerCase().includes(q)
        if (!matchCode && !matchName && !matchPhone && !matchEmail && !matchCounselor) {
          return false
        }
      }

      return true
    })
  }, [bookingsList, selectedSlot, selectedStatus, selectedCounselor, searchQuery])

  // Top Metrics
  const totalBookings = bookingsList.length
  const confirmedCount = bookingsList.filter((b) => b.status === "confirmed").length
  const completedCount = bookingsList.filter((b) => b.status === "completed").length
  const needFollowUpCount = bookingsList.filter(
    (b) => b.status === "completed" && !b.isFollowedUp
  ).length

  // Action: Tandai No-Show
  const handleConfirmNoShow = async () => {
    if (!noShowItem) return
    setIsSubmittingNoShow(true)

    try {
      const res = await markBookingNoShowAction({ bookingId: noShowItem.id })
      if (res.success) {
        toast.success(res.message || "Sesi berhasil ditandai sebagai No-Show.")
        setBookingsList((prev) =>
          prev.map((item) =>
            item.id === noShowItem.id
              ? {
                  ...item,
                  isNoShow: true,
                  status: "completed",
                  noShowMarkedAt: new Date().toISOString(),
                }
              : item
          )
        )
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
        setBookingsList((prev) =>
          prev.map((item) =>
            item.id === booking.id
              ? {
                  ...item,
                  isFollowedUp: true,
                  followedUpAt: new Date().toISOString(),
                }
              : item
          )
        )
      } else {
        toast.error(res.error || "Gagal mencatat status follow-up.")
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal membuka WhatsApp.")
    } finally {
      setFollowingUpId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Pengawasan Operasional Booking
            </h1>
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 gap-1 font-mono">
              <Layers className="size-3 text-primary" />
              <span>{bookingsList.length} Sesi Terdata</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Oversight siklus pemesanan, filter matriks slot, monitoring No-Show 30 menit, dan gerbang WhatsApp laporan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5 cursor-pointer">
            <Link href="/admin/manual-payments">
              <Clock className="size-3.5 text-amber-500" data-icon="inline-start" />
              <span>Verifikasi Transfer Manual</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5 cursor-pointer">
            <Link href="/admin/sessions">
              <Calendar className="size-3.5 text-primary" data-icon="inline-start" />
              <span>Kalender Jadwal</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Total Pemesanan</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-foreground">{totalBookings}</span>
              <Badge variant="secondary" className="text-[10px]">Database Real</Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">Seluruh sesi terdaftar</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Terkonfirmasi &amp; Aktif</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-primary">{confirmedCount}</span>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                Siap Sesi
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">Zoom Pro telah dialokasikan</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Sesi Selesai</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </span>
              <Badge variant="secondary" className="text-[10px]">Completed</Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">Termasuk sesi No-Show</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Perlu Follow-up WA</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {needFollowUpCount}
              </span>
              <Badge
                variant={needFollowUpCount > 0 ? "destructive" : "secondary"}
                className="text-[10px]"
              >
                {needFollowUpCount > 0 ? "Perlu Kirim" : "Tuntas"}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">Laporan selesai belum dikirim</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Filterable Table Card */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Daftar Booking Sesi Klinis
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Filter berdasarkan slot harian 1-7, status siklus, dan mitra konselor pendamping.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  Menampilkan {filteredBookings.length} dari {bookingsList.length} sesi
                </span>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              {/* Search Keyword */}
              <div className="relative">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode booking / nama / kontak..."
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              {/* Slot Index Filter */}
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Pilih Slot Waktu..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SLOT_OPTIONS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value} className="text-xs">
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Pilih Status Sesi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value} className="text-xs">
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Counselor Filter */}
              <Select value={selectedCounselor} onValueChange={setSelectedCounselor}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Pilih Konselor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all" className="text-xs">
                      Semua Konselor
                    </SelectItem>
                    {counselorOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.fullName} ({c.counselorType})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredBookings.length === 0 ? (
            <Empty className="py-16">
              <EmptyMedia variant="icon">
                <CalendarCheck className="size-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Tidak Ada Sesi yang Cocok</EmptyTitle>
                <EmptyDescription>
                  Tidak ditemukan sesi booking yang sesuai dengan kriteria filter atau kata kunci pencarian Anda.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedSlot("0")
                    setSelectedStatus("all")
                    setSelectedCounselor("all")
                  }}
                  className="h-8 text-xs cursor-pointer"
                >
                  Reset Semua Filter
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Kode Booking</TableHead>
                    <TableHead>Klien &amp; WhatsApp</TableHead>
                    <TableHead>Mitra Konselor</TableHead>
                    <TableHead>Jadwal &amp; Slot</TableHead>
                    <TableHead>Ruang Zoom Pro</TableHead>
                    <TableHead>Status Sesi</TableHead>
                    <TableHead className="text-right">Aksi Operasional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((b) => {
                    const statusVariant =
                      b.status === "confirmed"
                        ? "default"
                        : b.status === "completed"
                        ? "secondary"
                        : b.status === "cancelled"
                        ? "destructive"
                        : "outline"

                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{b.bookingCode}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(b.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-xs text-foreground">
                              {b.patientName}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {b.patientPhone}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-foreground">
                              {b.counselorName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {b.counselorType}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col text-xs font-mono">
                            <span className="text-foreground">{b.scheduleDate || "Belum ada jadwal"}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 h-4 font-mono text-muted-foreground"
                              >
                                Slot {b.slotIndex}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {b.timeRange}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
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
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <Badge variant={statusVariant} className="text-[10px]">
                              {b.status === "confirmed"
                                ? "Terkonfirmasi"
                                : b.status === "completed"
                                ? "Selesai"
                                : b.status === "cancelled"
                                ? "Dibatalkan"
                                : "Menunggu Bayar"}
                            </Badge>

                            {/* No-Show Marker Badge */}
                            {b.isNoShow && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] px-1.5 py-0 gap-1 font-mono"
                              >
                                <AlertTriangle className="size-2.5" />
                                <span>No-Show</span>
                              </Badge>
                            )}

                            {/* Extended Marker */}
                            {b.isExtended && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                +{b.extensionFee ? `Rp ${b.extensionFee.toLocaleString("id-ID")}` : "Extend"}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1. Tombol Tandai No-Show (Syarat: Tidak hadir dalam 30 menit) */}
                            {!b.isNoShow && b.status !== "cancelled" ? (
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
                            ) : b.isNoShow ? (
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
                                      ? new Date(b.noShowMarkedAt).toLocaleString("id-ID")
                                      : "Waktu tercatat"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null}

                            {/* 2. Tombol Kirim WA Laporan */}
                            <Button
                              type="button"
                              size="sm"
                              variant={b.isFollowedUp ? "outline" : "default"}
                              disabled={followingUpId === b.id}
                              onClick={() => handleSendWhatsAppReport(b)}
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
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
                  Status diubah ke <Badge variant="secondary" className="text-[10px]">completed</Badge> dengan flag <Badge variant="destructive" className="text-[10px]">is_no_show: true</Badge>
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
    </div>
  )
}
