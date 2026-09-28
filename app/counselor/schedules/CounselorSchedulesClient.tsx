"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldCheck,
  X,
  Lock,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  createScheduleSlotsAction,
  cancelScheduleSlotAction,
  type ScheduleItemView,
} from "./actions"
import { computeEndTime, formatTimeRange } from "@/lib/schedules/concurrency"

interface CounselorSchedulesClientProps {
  initialSlots: ScheduleItemView[]
}

const PRESET_START_TIMES = [
  "09:00",
  "11:00",
  "13:30",
  "15:30",
  "19:00",
  "20:30",
]

export default function CounselorSchedulesClient({
  initialSlots,
}: CounselorSchedulesClientProps) {
  const [slots, setSlots] = React.useState<ScheduleItemView[]>(initialSlots)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false)
  const [slotToCancel, setSlotToCancel] = React.useState<ScheduleItemView | null>(null)

  // Creation form state
  const tomorrowStr = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split("T")[0]
  }, [])

  const [selectedDate, setSelectedDate] = React.useState<string>(tomorrowStr)
  const [selectedTimes, setSelectedTimes] = React.useState<string[]>(["09:00", "19:00"])
  const [customTime, setCustomTime] = React.useState<string>("")
  const [formError, setFormError] = React.useState<string | null>(null)
  const [toastMessage, setToastMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)

  // Date filter for table view
  const [viewDateFilter, setViewDateFilter] = React.useState<string>("all")

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 5000)
  }

  // Live calculation of proposed slots with auto-computed endTime (+90 mins)
  const previewProposedSlots = React.useMemo(() => {
    return selectedTimes
      .slice()
      .sort()
      .map((st) => ({
        startTime: st,
        endTime: computeEndTime(st),
        timeRange: formatTimeRange(st, computeEndTime(st)),
      }))
  }, [selectedTimes])

  const togglePresetTime = (timeStr: string) => {
    setFormError(null)
    if (selectedTimes.includes(timeStr)) {
      setSelectedTimes(selectedTimes.filter((t) => t !== timeStr))
    } else {
      setSelectedTimes([...selectedTimes, timeStr])
    }
  }

  const handleAddCustomTime = () => {
    if (!customTime) return
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(customTime)) {
      setFormError("Format waktu kustom harus HH:mm (contoh: 14:15)")
      return
    }
    if (selectedTimes.includes(customTime)) {
      setFormError("Waktu ini sudah ditambahkan ke daftar pilihan")
      return
    }
    setSelectedTimes([...selectedTimes, customTime])
    setCustomTime("")
    setFormError(null)
  }

  const handleCreateSlots = async () => {
    if (selectedTimes.length === 0) {
      setFormError("Minimal pilih atau tentukan 1 jam mulai praktik")
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    try {
      const res = await createScheduleSlotsAction({
        date: selectedDate,
        startTimes: selectedTimes,
      })

      if (!res.success) {
        setFormError(res.error || "Gagal membuat slot praktik")
        setIsSubmitting(false)
        return
      }

      if (res.data?.slots) {
        setSlots((prev) => [...res.data!.slots, ...prev])
        showToast("success", `Berhasil membuka ${res.data.count} slot praktik 90 menit pada ${selectedDate}`)
        setIsAddModalOpen(false)
        // Reset selections
        setSelectedTimes(["09:00", "19:00"])
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan saat menyimpan slot")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelSlot = async () => {
    if (!slotToCancel) return
    setIsCancelling(true)

    try {
      const res = await cancelScheduleSlotAction({
        scheduleId: slotToCancel.id,
      })

      if (!res.success) {
        showToast("error", res.error || "Gagal membatalkan slot")
        setIsCancelling(false)
        return
      }

      setSlots((prev) =>
        prev.map((s) => (s.id === slotToCancel.id ? { ...s, status: "cancelled", canCancel: false } : s))
      )
      showToast("success", `Slot ${slotToCancel.timeRange} (${slotToCancel.date}) berhasil dibatalkan`)
      setIsCancelModalOpen(false)
      setSlotToCancel(null)
    } catch (err: any) {
      showToast("error", err.message || "Gagal membatalkan slot")
    } finally {
      setIsCancelling(false)
    }
  }

  // Filter slots for table
  const displayedSlots = React.useMemo(() => {
    if (viewDateFilter === "all") return slots
    return slots.filter((s) => s.date === viewDateFilter)
  }, [slots, viewDateFilter])

  // Distinct dates in slots for dropdown filter
  const distinctDates = React.useMemo(() => {
    return Array.from(new Set(slots.map((s) => s.date))).sort()
  }, [slots])

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Feedback Alert */}
      {toastMessage && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-destructive" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Jadwal Praktik</h1>
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
              Durasi Standar 90 Menit
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Buka slot waktu konsultasi untuk pasien. Waktu selesai otomatis dihitung (+90 menit) dengan proteksi anti tabrakan mandiri.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 text-xs font-semibold h-10 shadow-xs cursor-pointer"
        >
          <Plus className="size-4" />
          <span>Buka Slot Praktik Baru</span>
        </Button>
      </div>

      {/* Policy Guidance Alert Card */}
      <Card className="border border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="p-4 flex items-start gap-3.5">
          <Info className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground text-sm">
              Pedoman Alokasi Sesi 90 Menit & Proteksi Kapasitas Ruang
            </span>
            <p>
              1. <strong>Durasi Pasti</strong>: Setiap slot berdurasi penuh 90 menit (misal: 19:00 – 20:30 WIB). Sistem menolak slot yang bertabrakan pada tanggal yang sama.
            </p>
            <p>
              2. <strong>Proteksi Pembatalan</strong>: Slot yang berstatus <span className="font-medium text-amber-700 dark:text-amber-400">Hold Reservasi</span> (pasien sedang proses bayar 17 menit) dan <span className="font-medium text-blue-700 dark:text-blue-400">Dipesan</span> (terkonfirmasi) dilindungi demi kenyamanan pasien dan tidak dapat dibatalkan sepihak.
            </p>
            <p>
              3. <strong>Proteksi Zoom Platform</strong>: Katalog publik akan menyembunyikan slot secara dinamis jika pada rentang waktu yang sama sudah ada 2 sesi aktif di platform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Schedules List Section */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-bold">Daftar Slot Praktik Anda</CardTitle>
            <CardDescription className="text-xs">
              Menampilkan {displayedSlots.length} slot dari total {slots.length} slot terdaftar
            </CardDescription>
          </div>

          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Filter Tanggal:</span>
            <select
              value={viewDateFilter}
              onChange={(e) => setViewDateFilter(e.target.value)}
              className="text-xs h-8 px-2.5 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary"
            >
              <option value="all">Semua Tanggal</option>
              {distinctDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold">Tanggal</TableHead>
                  <TableHead className="text-xs font-semibold">Rentang Waktu (WIB)</TableHead>
                  <TableHead className="text-xs font-semibold">Durasi</TableHead>
                  <TableHead className="text-xs font-semibold">Status Slot</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedSlots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="size-6 text-muted-foreground/50" />
                        <span>Belum ada slot praktik pada tanggal ini.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-1 text-xs h-7"
                        >
                          Buka Slot Sekarang
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedSlots.map((slot) => {
                    return (
                      <TableRow key={slot.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs font-medium tabular-nums">
                          {slot.date}
                        </TableCell>

                        <TableCell className="text-xs font-semibold text-foreground">
                          {slot.timeRange}
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[11px] font-normal py-0">
                            90 Menit
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {slot.status === "available" && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            >
                              Tersedia
                            </Badge>
                          )}
                          {slot.status === "reserved" && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            >
                              Hold Reservasi (17m)
                            </Badge>
                          )}
                          {slot.status === "booked" && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            >
                              Dipesan Pasien
                            </Badge>
                          )}
                          {slot.status === "cancelled" && (
                            <Badge variant="outline" className="text-xs text-muted-foreground border-border/80">
                              Dibatalkan
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {slot.status === "available" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSlotToCancel(slot)
                                setIsCancelModalOpen(true)
                              }}
                              className="text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Batalkan</span>
                            </Button>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground" title={slot.cancelRestrictionReason}>
                              <Lock className="size-3" />
                              <span>{slot.status === "cancelled" ? "Nonaktif" : "Terkunci"}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Buka Slot Praktik Baru */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Buka Slot Praktik Baru</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tentukan tanggal dan pilih jam mulai praktik. Sistem secara otomatis menghitung durasi 90 menit.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="flex flex-col gap-4 py-2">
            {formError && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Input Tanggal */}
            <Field>
              <FieldLabel htmlFor="schedule-date" className="text-xs font-semibold">
                Tanggal Praktik
              </FieldLabel>
              <Input
                id="schedule-date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm h-10"
              />
              <FieldDescription className="text-[11px]">
                Slot dibuka untuk tanggal yang dipilih.
              </FieldDescription>
            </Field>

            {/* Pilihan Jam Mulai (Presets) */}
            <Field>
              <FieldLabel className="text-xs font-semibold">Pilih Jam Mulai (Sesi 90 Menit)</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {PRESET_START_TIMES.map((timeStr) => {
                  const isChecked = selectedTimes.includes(timeStr)
                  const endStr = computeEndTime(timeStr)
                  return (
                    <button
                      key={timeStr}
                      type="button"
                      onClick={() => togglePresetTime(timeStr)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-colors cursor-pointer text-center ${
                        isChecked
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                          : "bg-card hover:bg-muted text-foreground border-border"
                      }`}
                    >
                      <span className="font-bold text-sm tabular-nums">{timeStr}</span>
                      <span className={`text-[10px] ${isChecked ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        s/d {endStr} WIB
                      </span>
                    </button>
                  )
                })}
              </div>
            </Field>

            {/* Tambah Jam Kustom */}
            <Field>
              <FieldLabel htmlFor="custom-time" className="text-xs font-medium text-muted-foreground">
                Atau masukkan jam mulai kustom (HH:mm)
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="custom-time"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  placeholder="Contoh: 14:00"
                  className="text-xs h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomTime}
                  className="text-xs h-9 shrink-0 cursor-pointer"
                >
                  Tambah Jam
                </Button>
              </div>
            </Field>

            {/* Live Calculation Preview */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground">
                Ringkasan Slot yang Akan Dibuka ({previewProposedSlots.length} Sesi):
              </span>
              {previewProposedSlots.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">Belum ada jam yang dipilih.</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {previewProposedSlots.map((slot) => (
                    <span
                      key={slot.startTime}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border text-xs text-foreground font-medium"
                    >
                      <span>{slot.timeRange}</span>
                      <button
                        type="button"
                        onClick={() => togglePresetTime(slot.startTime)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        aria-label={`Hapus jam ${slot.startTime}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </FieldGroup>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
              className="text-xs h-9 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleCreateSlots}
              disabled={isSubmitting || selectedTimes.length === 0}
              className="text-xs h-9 gap-2 cursor-pointer font-semibold"
            >
              {isSubmitting ? (
                <span>Menyimpan Slot...</span>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Buka {selectedTimes.length} Slot Praktik</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Pembatalan Slot */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span>Konfirmasi Pembatalan Slot Praktik</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              Apakah Anda yakin ingin membatalkan slot jadwal berikut? Slot yang dibatalkan tidak akan dapat dipesan oleh pasien di katalog publik.
            </DialogDescription>
          </DialogHeader>

          {slotToCancel && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border flex flex-col gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal:</span>
                <span className="font-semibold text-foreground">{slotToCancel.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waktu:</span>
                <span className="font-semibold text-foreground">{slotToCancel.timeRange}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durasi:</span>
                <span className="text-foreground">90 Menit</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
              className="text-xs h-9 cursor-pointer"
            >
              Kembali
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleCancelSlot}
              disabled={isCancelling}
              className="text-xs h-9 gap-1.5 cursor-pointer"
            >
              {isCancelling ? "Membatalkan..." : "Ya, Batalkan Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
