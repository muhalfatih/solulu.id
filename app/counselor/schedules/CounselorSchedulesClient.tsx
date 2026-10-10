"use client"

import * as React from "react"
import {
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Lock,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  computeEndTime,
  formatTimeRange,
  getNowWIB,
  getWIBDateString,
  getMaxBookableDateString,
  parseTimeToMinutes,
} from "@/lib/schedules/concurrency"

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

  // Creation form date bounds (WIB)
  const nowWIB = React.useMemo(() => getNowWIB(), [])
  const todayWIB = nowWIB.dateStr
  const maxDateWIB = React.useMemo(() => getMaxBookableDateString(), [])

  const tomorrowStr = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return getWIBDateString(d)
  }, [])

  const [selectedDate, setSelectedDate] = React.useState<string>(tomorrowStr)
  const [selectedTimes, setSelectedTimes] = React.useState<string[]>(["09:00", "19:00"])
  const [customTime, setCustomTime] = React.useState<string>("")
  const [formError, setFormError] = React.useState<string | null>(null)
  const [toastMessage, setToastMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)

  // Date filter for table view: default to upcoming slots
  const [viewDateFilter, setViewDateFilter] = React.useState<string>("upcoming")

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

  // Telemetry statistics
  const telemetryStats = React.useMemo(() => {
    const availableUpcoming = slots.filter((s) => !s.isPast && s.status === "available").length
    const bookedUpcoming = slots.filter((s) => !s.isPast && (s.status === "booked" || s.status === "reserved")).length
    const completedPast = slots.filter((s) => s.isPast && s.status === "booked").length

    return {
      availableUpcoming,
      bookedUpcoming,
      completedPast,
    }
  }, [slots])

  // Filter slots for table
  const upcomingCount = React.useMemo(() => slots.filter((s) => !s.isPast).length, [slots])
  const todayCount = React.useMemo(() => slots.filter((s) => s.date === todayWIB).length, [slots, todayWIB])
  const pastCount = React.useMemo(() => slots.filter((s) => s.isPast).length, [slots])
  const allCount = slots.length

  const displayedSlots = React.useMemo(() => {
    if (viewDateFilter === "upcoming") {
      return slots.filter((s) => !s.isPast)
    }
    if (viewDateFilter === "today") {
      return slots.filter((s) => s.date === todayWIB)
    }
    if (viewDateFilter === "past") {
      return slots.filter((s) => s.isPast)
    }
    return slots
  }, [slots, viewDateFilter, todayWIB])

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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Jadwal Praktik</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/70">
              <Clock className="size-3 text-muted-foreground" aria-hidden="true" />
              <span>Standar 90 Menit</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Buka dan kelola ketersediaan sesi konsultasi konseling untuk pasien.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="gap-2 text-xs font-medium h-9 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          id="btn-open-add-slot-modal"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span>Buka Slot Praktik Baru</span>
        </Button>
      </div>

      {/* 3 Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/70 bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Slot Tersedia</span>
              <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {telemetryStats.availableUpcoming}
              </span>
              <span className="text-xs text-muted-foreground">Siap dipesan pasien</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Clock className="size-5" aria-hidden="true" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/70 bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Sesi Terjadwal</span>
              <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {telemetryStats.bookedUpcoming}
              </span>
              <span className="text-xs text-muted-foreground">Dipesan / dalam proses</span>
            </div>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </div>
          </div>
        </Card>

        <Card className="border border-border/70 bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Riwayat Terlaksana</span>
              <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {telemetryStats.completedPast}
              </span>
              <span className="text-xs text-muted-foreground">Sesi konsultasi selesai</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted text-muted-foreground border border-border/70 shrink-0">
              <Calendar className="size-5" aria-hidden="true" />
            </div>
          </div>
        </Card>
      </div>

      {/* Schedules List Section */}
      <Card className="border border-border/70 shadow-xs bg-card">
        <CardHeader className="p-6 pb-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-bold text-foreground">Daftar Slot Praktik</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Menampilkan {displayedSlots.length} dari {slots.length} total slot terdaftar
            </CardDescription>
          </div>

          {/* Filter Tabs */}
          <Tabs
            value={viewDateFilter}
            onValueChange={setViewDateFilter}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-9 p-1 bg-muted/60 border border-border/60">
              <TabsTrigger value="upcoming" className="text-xs px-3 py-1 font-medium rounded-md">
                Mendatang ({upcomingCount})
              </TabsTrigger>
              <TabsTrigger value="today" className="text-xs px-3 py-1 font-medium rounded-md">
                Hari Ini ({todayCount})
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs px-3 py-1 font-medium rounded-md">
                Riwayat ({pastCount})
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs px-3 py-1 font-medium rounded-md">
                Semua ({allCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-6 pt-5">
          <div className="rounded-lg border border-border/70 overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/70">
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rentang Waktu (WIB)</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Slot</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedSlots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-xs text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="size-6 text-muted-foreground/50" aria-hidden="true" />
                        <span>
                          {viewDateFilter === "upcoming"
                            ? "Belum ada slot praktik mendatang. Buka slot baru untuk pasien."
                            : "Tidak ada data slot pada filter ini."}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-1 text-xs h-7 cursor-pointer"
                        >
                          Buka Slot Sekarang
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedSlots.map((slot) => {
                    const isSlotToday = slot.date === todayWIB

                    return (
                      <TableRow key={slot.id} className="hover:bg-muted/20 border-b border-border/60 last:border-b-0">
                        <TableCell className="px-4 py-3.5 text-xs font-medium tabular-nums">
                          <div className="flex items-center gap-2">
                            <span>{slot.date}</span>
                            {isSlotToday && !slot.isPast && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/25">
                                Hari Ini
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-xs font-semibold text-foreground tabular-nums">
                          {slot.timeRange}
                        </TableCell>

                        <TableCell className="px-4 py-3.5">
                          {slot.isPast ? (
                            slot.status === "booked" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/70">
                                <span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                                <span>Selesai</span>
                              </span>
                            ) : slot.status === "cancelled" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                                <span className="size-1.5 rounded-full bg-destructive shrink-0" aria-hidden="true" />
                                <span>Dibatalkan</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 text-muted-foreground border border-border/70">
                                <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" aria-hidden="true" />
                                <span>Kedaluwarsa</span>
                              </span>
                            )
                          ) : (
                            <>
                              {slot.status === "available" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                                  <span>Tersedia</span>
                                </span>
                              )}
                              {slot.status === "reserved" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  <span className="size-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                                  <span>Hold Reservasi (17m)</span>
                                </span>
                              )}
                              {slot.status === "booked" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                  <span className="size-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                                  <span>Dipesan Pasien</span>
                                </span>
                              )}
                              {slot.status === "cancelled" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                                  <span className="size-1.5 rounded-full bg-destructive shrink-0" aria-hidden="true" />
                                  <span>Dibatalkan</span>
                                </span>
                              )}
                            </>
                          )}
                        </TableCell>

                        <TableCell className="px-4 py-3.5 text-right">
                          {slot.isPast ? (
                            <span className="text-xs text-muted-foreground/70 italic select-none">
                              {slot.status === "booked" ? "Sesi Selesai" : "Waktu Terlewat"}
                            </span>
                          ) : slot.status === "available" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSlotToCancel(slot)
                                setIsCancelModalOpen(true)
                              }}
                              className="text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                              <span>Batalkan</span>
                            </Button>
                          ) : (
                            <div
                              className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground"
                              title={slot.cancelRestrictionReason}
                            >
                              <Lock className="size-3 text-muted-foreground" aria-hidden="true" />
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

            {/* Context Guidance Banner */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5">
              <Info className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">Alokasi Waktu 90 Menit & Proteksi Jadwal</span>
                <span>Waktu selesai dihitung otomatis (+90m). Sistem secara mandiri mencegah tabrakan slot pada jam yang sama.</span>
              </div>
            </div>

            {/* Input Tanggal */}
            <Field>
              <FieldLabel htmlFor="schedule-date" className="text-xs font-semibold">
                Tanggal Praktik
              </FieldLabel>
              <Input
                id="schedule-date"
                type="date"
                min={todayWIB}
                max={maxDateWIB}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm h-10"
              />
              <FieldDescription className="text-xs">
                Maksimal 14 hari ke depan ({maxDateWIB}). Sesi tanggal lampau tidak dapat dibuka.
              </FieldDescription>
            </Field>

            {/* Pilihan Jam Mulai (Presets) */}
            <Field>
              <FieldLabel className="text-xs font-semibold">Pilih Jam Mulai (Sesi 90 Menit)</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {PRESET_START_TIMES.map((timeStr) => {
                  const isChecked = selectedTimes.includes(timeStr)
                  const endStr = computeEndTime(timeStr)
                  const isTimePassedToday =
                    selectedDate === todayWIB && parseTimeToMinutes(timeStr) <= nowWIB.timeMinutes

                  return (
                    <button
                      key={timeStr}
                      type="button"
                      disabled={isTimePassedToday}
                      aria-pressed={isChecked}
                      onClick={() => !isTimePassedToday && togglePresetTime(timeStr)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-colors text-center ${
                        isTimePassedToday
                          ? "bg-muted/40 text-muted-foreground/50 border-border/40 cursor-not-allowed line-through"
                          : isChecked
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs cursor-pointer"
                          : "bg-card hover:bg-muted text-foreground border-border cursor-pointer"
                      }`}
                    >
                      <span className="font-bold text-sm tabular-nums">{timeStr}</span>
                      <span
                        className={`text-xs ${
                          isTimePassedToday
                            ? "text-muted-foreground/40"
                            : isChecked
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isTimePassedToday ? "Sudah Terlewat" : `s/d ${endStr} WIB`}
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
