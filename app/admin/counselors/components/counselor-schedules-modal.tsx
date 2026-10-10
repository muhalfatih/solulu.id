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
  X,
  Lock,
  RefreshCw,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  getCounselorSlotsAdminAction,
  createCounselorSlotsAdminAction,
  deleteCounselorSlotAdminAction,
  type AdminCounselorSlotView,
} from "../actions"
import {
  computeEndTime,
  formatTimeRange,
  getNowWIB,
  getWIBDateString,
  getMaxBookableDateString,
  parseTimeToMinutes,
} from "@/lib/schedules/concurrency"

interface CounselorScheduleModalProps {
  counselor: {
    id: string
    name: string
    title?: string
    type?: string
  } | null
  isOpen: boolean
  onClose: () => void
  onSlotsUpdated?: () => void
}

const PRESET_START_TIMES = [
  "09:00",
  "11:00",
  "13:30",
  "15:30",
  "19:00",
  "20:30",
]

export function CounselorSchedulesModal({
  counselor,
  isOpen,
  onClose,
  onSlotsUpdated,
}: CounselorScheduleModalProps) {
  const [slots, setSlots] = React.useState<AdminCounselorSlotView[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"list" | "add">("list")

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
  const [viewDateFilter, setViewDateFilter] = React.useState<string>("all")

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Fetch slots on open
  const loadSlots = React.useCallback(async () => {
    if (!counselor?.id) return
    setIsLoading(true)
    try {
      const res = await getCounselorSlotsAdminAction(counselor.id)
      if (res.success && res.data) {
        setSlots(res.data)
      } else {
        showToast("error", res.error || "Gagal memuat slot konselor")
      }
    } catch (err: any) {
      showToast("error", err.message || "Terjadi kesalahan saat memuat jadwal")
    } finally {
      setIsLoading(false)
    }
  }, [counselor?.id])

  React.useEffect(() => {
    if (isOpen && counselor?.id) {
      loadSlots()
      setActiveTab("list")
    }
  }, [isOpen, counselor?.id, loadSlots])

  // Computed preview of slots to be added
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
      setFormError(`Jam ${customTime} sudah dipilih`)
      return
    }

    setSelectedTimes([...selectedTimes, customTime])
    setCustomTime("")
    setFormError(null)
  }

  const handleCreateSlots = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!counselor?.id) return
    if (selectedTimes.length === 0) {
      setFormError("Pilih minimal 1 jam mulai sesi.")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const res = await createCounselorSlotsAdminAction({
        counselorId: counselor.id,
        date: selectedDate,
        startTimes: selectedTimes,
      })

      if (!res.success) {
        setFormError(res.error || "Gagal menambahkan slot jadwal.")
      } else {
        showToast(
          "success",
          `Berhasil membuka ${res.count} slot jadwal untuk ${counselor.name}.`
        )
        // Reset selections
        setSelectedTimes(["09:00", "19:00"])
        await loadSlots()
        setActiveTab("list")
        if (onSlotsUpdated) onSlotsUpdated()
      }
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan slot jadwal.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSlot = async (slotId: string, timeRange: string) => {
    if (!confirm(`Hapus slot waktu ${timeRange} ini?`)) return

    setDeletingId(slotId)
    try {
      const res = await deleteCounselorSlotAdminAction(slotId)
      if (res.success) {
        showToast("success", `Slot waktu ${timeRange} berhasil dihapus.`)
        setSlots((prev) => prev.filter((s) => s.id !== slotId))
        if (onSlotsUpdated) onSlotsUpdated()
      } else {
        showToast("error", res.error || "Gagal menghapus slot jadwal.")
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal menghapus slot jadwal.")
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered slot items
  const distinctDates = React.useMemo(() => {
    const set = new Set<string>()
    slots.forEach((s) => set.add(s.date))
    return Array.from(set).sort().reverse()
  }, [slots])

  const displayedSlots = React.useMemo(() => {
    if (viewDateFilter === "all") return slots
    return slots.filter((s) => s.date === viewDateFilter)
  }, [slots, viewDateFilter])

  const availableCount = slots.filter((s) => s.status === "available").length
  const bookedCount = slots.filter((s) => s.status === "booked").length
  const reservedCount = slots.filter((s) => s.status === "reserved").length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border rounded-xl shadow-xl">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <CalendarIcon className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                Kelola Slot Jadwal: {counselor?.name}
              </DialogTitle>
              {counselor?.type && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  <span>{counselor.type === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}</span>
                </span>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed sm:pl-10.5">
              Atur ketersediaan slot sesi konsultasi 90 menit. Sesi otomatis tayang di katalog publik bagi pasien.
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={loadSlots}
              disabled={isLoading}
              title="Muat ulang jadwal"
              className="size-8.5 rounded-md cursor-pointer hover:bg-muted"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`px-6 py-3 text-xs flex items-center justify-between border-b ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-destructive" />
              )}
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 p-0.5 cursor-pointer rounded transition-opacity"
              aria-label="Tutup notifikasi"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs & Telemetry Ribbon */}
        <div className="px-6 py-3 border-b border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "list" | "add")}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-9 p-1 bg-muted/60 border border-border rounded-lg">
              <TabsTrigger
                value="list"
                className="text-xs px-3.5 py-1 font-medium gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
              >
                <span>Daftar Slot Praktik</span>
                <span className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono font-medium tabular-nums">
                  {slots.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="add"
                className="text-xs px-3.5 py-1 font-medium gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Buka Slot Baru</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Telemetry Status Counters */}
          <div className="flex items-center gap-2 text-xs tabular-nums flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>{availableCount} Tersedia</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span>{bookedCount} Dipesan</span>
            </span>
            {reservedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
                <span>{reservedCount} Hold</span>
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* TAB 1: DAFTAR SLOT PRAKTIK */}
          {activeTab === "list" && (
            <div className="flex flex-col gap-4">
              {/* Table Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Filter Tanggal:
                  </span>
                  {distinctDates.length > 1 ? (
                    <select
                      value={viewDateFilter}
                      onChange={(e) => setViewDateFilter(e.target.value)}
                      className="h-8.5 text-xs rounded-md border border-border bg-background px-3 font-mono cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="all">Semua Tanggal ({slots.length})</option>
                      {distinctDates.map((d) => (
                        <option key={d} value={d}>
                          {d} ({slots.filter((s) => s.date === d).length} slot)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-mono font-medium text-foreground px-2.5 py-1 rounded-md bg-muted/50 border border-border">
                      {distinctDates[0] ? `${distinctDates[0]} (${slots.length} slot)` : "Semua Jadwal"}
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => setActiveTab("add")}
                  className="gap-1.5 text-xs h-8.5 px-3.5 font-medium cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Buka Slot Baru</span>
                </Button>
              </div>

              {/* Slots Table Card */}
              <div className="rounded-xl border border-border overflow-hidden bg-background shadow-2xs">
                {displayedSlots.length === 0 ? (
                  <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <div className="size-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60">
                      <CalendarIcon className="size-6" />
                    </div>
                    <div className="flex flex-col gap-1 max-w-sm">
                      <span className="text-sm font-semibold text-foreground">Belum ada slot waktu terdaftar</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        Buka slot sesi praktik agar pasien dapat menjadwalkan konsultasi melalui katalog publik.
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("add")}
                      className="mt-2 gap-2 text-xs h-8.5 px-4 font-medium cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Buka Slot Pertama</span>
                    </Button>
                  </div>
                ) : (
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border">
                        <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">Tanggal</TableHead>
                        <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">Waktu Sesi (90 Menit)</TableHead>
                        <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground">Status Slot</TableHead>
                        <TableHead className="px-5 py-3 text-xs font-semibold text-muted-foreground text-right">Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedSlots.map((s) => {
                        const isDeleting = deletingId === s.id

                        return (
                          <TableRow key={s.id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                            <TableCell className="px-5 py-3.5 font-mono text-foreground font-medium tabular-nums text-xs">
                              {s.date}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 font-mono text-foreground tabular-nums text-xs font-medium">
                              {s.timeRange}
                            </TableCell>
                            <TableCell className="px-5 py-3.5">
                              {s.status === "available" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                                  <span>Tersedia</span>
                                </span>
                              ) : s.status === "booked" ? (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                  title={s.deleteRestrictionReason}
                                >
                                  <span className="size-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                                  <span>Dipesan Pasien</span>
                                </span>
                              ) : s.status === "reserved" ? (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                  title={s.deleteRestrictionReason}
                                >
                                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden="true" />
                                  <span>Hold (17m)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                                  <span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                                  <span>Dibatalkan</span>
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 text-right">
                              {s.canDelete ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSlot(s.id, s.timeRange)}
                                  disabled={isDeleting}
                                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
                                  title="Hapus slot jadwal ini"
                                >
                                  <Trash2 className="size-3.5 mr-1" />
                                  <span>{isDeleting ? "..." : "Hapus"}</span>
                                </Button>
                              ) : (
                                <span
                                  className="text-xs text-muted-foreground/70 italic cursor-help inline-flex items-center justify-end gap-1.5"
                                  title={s.deleteRestrictionReason || "Slot tidak dapat dihapus"}
                                >
                                  <Lock className="size-3 text-muted-foreground/50" />
                                  <span>Terkunci</span>
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FORM BUKA SLOT PRAKTIK BARU */}
          {activeTab === "add" && (
            <div className="flex flex-col gap-6">
              {/* Guidance Notice Banner */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3">
                <Info className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">Alokasi Waktu Standar 90 Menit</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tentukan tanggal dan pilih jam mulai sesi. Waktu selesai otomatis dihitung (+90 menit). Sistem secara mandiri memvalidasi ketersediaan dan mencegah bentrok jadwal.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateSlots} className="flex flex-col gap-6">
                {/* Error Banner */}
                {formError && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
                    <AlertCircle className="size-4 shrink-0" />
                    <span className="font-medium">{formError}</span>
                  </div>
                )}

                {/* Section 1: Tanggal Praktik */}
                <div className="space-y-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="slot-date" className="text-xs font-semibold text-foreground">
                      Tanggal Praktik
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Pilih tanggal dalam rentang 14 hari ke depan ({maxDateWIB}). Sesi lampau tidak dapat dibuka.
                    </p>
                  </div>
                  <Input
                    id="slot-date"
                    type="date"
                    min={todayWIB}
                    max={maxDateWIB}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setFormError(null)
                    }}
                    required
                    className="h-10 text-xs bg-background tabular-nums font-mono sm:max-w-xs rounded-md"
                  />
                </div>

                {/* Section 2: Preset Jam Mulai Sesi */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="text-xs font-semibold text-foreground">
                      Pilih Jam Mulai Sesi (Durasi 90 Menit)
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Klik opsi untuk memilih atau membatalkan
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {PRESET_START_TIMES.map((time) => {
                      const isSelected = selectedTimes.includes(time)
                      const endStr = computeEndTime(time)
                      const isTimePassedToday =
                        selectedDate === todayWIB && parseTimeToMinutes(time) <= nowWIB.timeMinutes

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isTimePassedToday}
                          onClick={() => !isTimePassedToday && togglePresetTime(time)}
                          className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg border text-xs transition-colors cursor-pointer select-none ${
                            isTimePassedToday
                              ? "bg-muted/40 text-muted-foreground/50 border-border/40 cursor-not-allowed line-through"
                              : isSelected
                              ? "bg-primary text-primary-foreground border-primary font-medium shadow-2xs"
                              : "bg-background text-foreground border-border hover:bg-muted/40"
                          }`}
                        >
                          <span className="font-semibold text-sm tabular-nums">{time}</span>
                          <span
                            className={`text-xs mt-0.5 ${
                              isTimePassedToday
                                ? "text-muted-foreground/40"
                                : isSelected
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
                </div>

                {/* Section 3: Jam Kustom */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label htmlFor="custom-time-input" className="text-xs font-medium text-foreground">
                    Atau Tambahkan Jam Mulai Kustom (HH:mm)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="custom-time-input"
                      type="text"
                      placeholder="Contoh: 14:15"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-36 h-9 text-xs bg-background text-center font-mono tabular-nums rounded-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomTime}
                      className="h-9 px-3.5 text-xs cursor-pointer rounded-md"
                    >
                      Tambah Jam
                    </Button>
                  </div>
                </div>

                {/* Section 4: Ringkasan Slot Terpilih */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" />
                      <span>Ringkasan Slot ({previewProposedSlots.length} Sesi Terpilih)</span>
                    </span>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums px-2 py-0.5 rounded bg-background border border-border">
                      Tanggal: {selectedDate}
                    </span>
                  </div>

                  {previewProposedSlots.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">Belum ada jam sesi yang dipilih.</span>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {previewProposedSlots.map((p) => (
                        <span
                          key={p.startTime}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium bg-background border border-border text-foreground shadow-2xs"
                        >
                          <span>{p.timeRange}</span>
                          <button
                            type="button"
                            onClick={() => togglePresetTime(p.startTime)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer ml-0.5 transition-colors"
                            aria-label={`Hapus jam ${p.startTime}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("list")}
                    className="h-9 text-xs cursor-pointer gap-1.5 rounded-md"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Kembali ke Daftar</span>
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || selectedTimes.length === 0}
                    className="h-9 px-5 text-xs font-medium gap-2 cursor-pointer rounded-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Menyimpan Slot...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        <span>Buka {selectedTimes.length} Slot Praktik</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-4 text-primary shrink-0" />
            <span>Maksimal 2 sesi bersamaan se-platform (Platform Concurrency Guard 2 Akun Zoom).</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8.5 px-4 text-xs cursor-pointer rounded-md shrink-0">
            Tutup Dialog
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
