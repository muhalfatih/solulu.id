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
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { computeEndTime, formatTimeRange } from "@/lib/schedules/concurrency"

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
          `Berhasil menambahkan ${res.count} slot jadwal untuk ${counselor.name}.`
        )
        // Reset selections
        setSelectedTimes(["09:00", "19:00"])
        await loadSlots()
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
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1 text-left">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              <DialogTitle className="text-base font-semibold text-foreground">
                Kelola Slot Jadwal: {counselor?.name}
              </DialogTitle>
              {counselor?.type && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {counselor.type}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Atur slot sesi 90 menit. Sesi otomatis tayang di katalog publik jika kapasitas 2 sesi bersamaan platform tersedia.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={loadSlots}
              disabled={isLoading}
              title="Muat ulang jadwal"
              className="size-8"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center justify-between border-b ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="size-3.5 shrink-0" />
              ) : (
                <AlertCircle className="size-3.5 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs hover:opacity-80 p-0.5"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* Section 1: Form Tambah Slot Baru */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Plus className="size-3.5 text-primary" />
                Tambah Slot Sesi Baru (Durasi 90 Menit)
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Auto-Compute End Time (+90m)
              </span>
            </div>

            <form onSubmit={handleCreateSlots} className="flex flex-col gap-3.5">
              {/* Row 1: Tanggal & Preset Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 sm:col-span-1">
                  <label htmlFor="slot-date" className="text-xs font-medium text-foreground">
                    Tanggal Praktik
                  </label>
                  <Input
                    id="slot-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setFormError(null)
                    }}
                    required
                    className="h-8 text-xs bg-background tabular-nums"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Pilih Jam Mulai Sesi (Preset)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Klik chip untuk memilih
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {PRESET_START_TIMES.map((time) => {
                      const isSelected = selectedTimes.includes(time)
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => togglePresetTime(time)}
                          className={`h-7 px-2.5 rounded-md text-xs font-medium tabular-nums border transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                              : "bg-background text-muted-foreground border-input hover:text-foreground"
                          }`}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Custom Time Input & Preview */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">Jam Kustom:</span>
                  <Input
                    type="text"
                    placeholder="14:15"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-20 h-7 text-xs bg-background text-center font-mono tabular-nums"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomTime}
                    className="h-7 px-2 text-xs"
                  >
                    Tambah
                  </Button>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || selectedTimes.length === 0}
                  className="h-8 text-xs font-medium gap-1.5 cursor-pointer ml-auto"
                >
                  <Plus className="size-3.5" />
                  <span>
                    {isSubmitting
                      ? "Menyimpan..."
                      : `Buat ${selectedTimes.length} Slot Jadwal`}
                  </span>
                </Button>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Preview of slots to be added */}
              {previewProposedSlots.length > 0 && (
                <div className="p-2.5 rounded-lg bg-background border border-border/80 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    Preview ({previewProposedSlots.length} sesi):
                  </span>
                  {previewProposedSlots.map((p) => (
                    <span
                      key={p.startTime}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/40"
                    >
                      {p.timeRange}
                    </span>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Section 2: Daftar Slot Jadwal Aktif */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-foreground">
                  Daftar Slot Jadwal ({slots.length})
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5">
                    {availableCount} Available
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] py-0 px-1.5">
                    {bookedCount} Booked
                  </Badge>
                  {reservedCount > 0 && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] py-0 px-1.5">
                      {reservedCount} Reserved
                    </Badge>
                  )}
                </div>
              </div>

              {/* Filter Tanggal */}
              {distinctDates.length > 1 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground text-[11px]">Filter:</span>
                  <select
                    value={viewDateFilter}
                    onChange={(e) => setViewDateFilter(e.target.value)}
                    className="h-7 text-xs rounded-md border border-input bg-background px-2 py-0 font-mono"
                  >
                    <option value="all">Semua Tanggal ({slots.length})</option>
                    {distinctDates.map((d) => (
                      <option key={d} value={d}>
                        {d} ({slots.filter((s) => s.date === d).length})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Table of Slots */}
            <div className="border border-border rounded-xl overflow-hidden bg-background">
              {displayedSlots.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5">
                  <CalendarIcon className="size-6 text-muted-foreground/40 mb-1" />
                  <span>Belum ada slot waktu untuk konselor ini.</span>
                  <span className="text-[11px] text-muted-foreground/80">
                    Gunakan formulir di atas untuk menambahkan slot sesi.
                  </span>
                </div>
              ) : (
                <Table className="text-xs">
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border/60">
                      <TableHead className="py-2.5 px-3 font-semibold text-foreground">Tanggal</TableHead>
                      <TableHead className="py-2.5 px-3 font-semibold text-foreground">Waktu Sesi (90 Menit)</TableHead>
                      <TableHead className="py-2.5 px-3 font-semibold text-foreground">Status</TableHead>
                      <TableHead className="py-2.5 px-3 font-semibold text-foreground text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedSlots.map((s) => {
                      const isDeleting = deletingId === s.id

                      return (
                        <TableRow key={s.id} className="border-border/60 hover:bg-muted/20">
                          <TableCell className="py-2.5 px-3 font-mono text-foreground font-medium">
                            {s.date}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 font-mono text-foreground">
                            {s.timeRange}
                          </TableCell>
                          <TableCell className="py-2.5 px-3">
                            {s.status === "available" ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-2 gap-1 font-medium"
                              >
                                <span className="size-1 rounded-full bg-emerald-500" />
                                Available
                              </Badge>
                            ) : s.status === "booked" ? (
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/30 text-[10px] py-0 px-2 gap-1 font-medium"
                                title={s.deleteRestrictionReason}
                              >
                                <span className="size-1 rounded-full bg-primary" />
                                Booked (Pasien)
                              </Badge>
                            ) : s.status === "reserved" ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] py-0 px-2 gap-1 font-medium"
                                title={s.deleteRestrictionReason}
                              >
                                <span className="size-1 rounded-full bg-amber-500 animate-pulse" />
                                Hold (17m)
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] py-0 px-2">
                                Dibatalkan
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right">
                            {s.canDelete ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSlot(s.id, s.timeRange)}
                                disabled={isDeleting}
                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Hapus slot jadwal ini"
                              >
                                <Trash2 className="size-3 mr-1" />
                                <span>{isDeleting ? "..." : "Hapus"}</span>
                              </Button>
                            ) : (
                              <span
                                className="text-[11px] text-muted-foreground/70 italic cursor-help flex items-center justify-end gap-1"
                                title={s.deleteRestrictionReason || "Slot tidak dapat dihapus"}
                              >
                                <Lock className="size-3 text-muted-foreground/50" />
                                Terkunci
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 text-primary" />
            <span>Maksimal 2 sesi bersamaan se-platform (Platform Concurrency Guard 2 Akun Zoom).</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs cursor-pointer">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
