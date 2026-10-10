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
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border/70 rounded-xl shadow-lg">
        {/* Header */}
        <DialogHeader className="p-6 pb-5 border-b border-border/60 bg-muted/10 flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center gap-2.5 flex-wrap">
              <CalendarIcon className="size-4 text-primary shrink-0" />
              <DialogTitle className="text-base font-bold text-foreground">
                Kelola Slot Jadwal: {counselor?.name}
              </DialogTitle>
              {counselor?.type && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                  <span>{counselor.type}</span>
                </span>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Atur ketersediaan slot sesi 90 menit. Sesi otomatis tayang di katalog publik jika kapasitas platform tersedia.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={loadSlots}
              disabled={isLoading}
              title="Muat ulang jadwal"
              className="size-8 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`px-5 py-3 text-xs flex items-center justify-between border-b ${
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
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs hover:opacity-80 p-0.5 cursor-pointer"
              aria-label="Tutup notifikasi"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Section 1: Form Tambah Slot Baru */}
          <div className="rounded-xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Plus className="size-3.5 text-primary" />
                <span>Tambah Slot Sesi Baru (Durasi 90 Menit)</span>
              </span>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                Auto-Compute (+90m)
              </span>
            </div>

            <form onSubmit={handleCreateSlots} className="flex flex-col gap-4">
              {/* Row 1: Tanggal & Preset Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
                <div className="flex flex-col gap-1.5 sm:col-span-4">
                  <label htmlFor="slot-date" className="text-xs font-semibold text-foreground">
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
                    className="h-10 text-xs bg-background tabular-nums"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-8">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Pilih Jam Mulai Sesi (Preset)</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Klik chip untuk memilih
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {PRESET_START_TIMES.map((time) => {
                      const isSelected = selectedTimes.includes(time)
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => togglePresetTime(time)}
                          className={`h-8 px-3 rounded-md text-xs font-semibold tabular-nums border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                              : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                          }`}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Row 2: Custom Time Input & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Jam Kustom:</span>
                  <Input
                    type="text"
                    placeholder="14:15"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-24 h-8 text-xs bg-background text-center font-mono tabular-nums"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomTime}
                    className="h-8 px-3 text-xs cursor-pointer"
                  >
                    Tambah Jam
                  </Button>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || selectedTimes.length === 0}
                  className="h-9 px-4 text-xs font-medium gap-1.5 cursor-pointer ml-auto"
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
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Preview of slots to be added */}
              {previewProposedSlots.length > 0 && (
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/70 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mr-1">
                    <Clock className="size-3.5 text-primary" />
                    <span>Ringkasan ({previewProposedSlots.length} sesi):</span>
                  </span>
                  {previewProposedSlots.map((p) => (
                    <span
                      key={p.startTime}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-background border border-border text-foreground"
                    >
                      {p.timeRange}
                    </span>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Section 2: Daftar Slot Jadwal Aktif */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Daftar Slot Jadwal ({slots.length})
                </h3>
                <div className="flex items-center gap-1.5 text-xs tabular-nums">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>{availableCount} Available</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                    <span>{bookedCount} Booked</span>
                  </span>
                  {reservedCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
                      <span>{reservedCount} Reserved</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Filter Tanggal */}
              {distinctDates.length > 1 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground text-xs">Filter Tanggal:</span>
                  <select
                    value={viewDateFilter}
                    onChange={(e) => setViewDateFilter(e.target.value)}
                    className="h-8 text-xs rounded-md border border-border/80 bg-background px-3 font-mono cursor-pointer"
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
            <div className="rounded-lg border border-border/70 overflow-hidden bg-background">
              {displayedSlots.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <CalendarIcon className="size-7 text-muted-foreground/40 mb-1" />
                  <span className="font-medium text-foreground">Belum ada slot waktu untuk konselor ini.</span>
                  <span className="text-xs text-muted-foreground">
                    Gunakan formulir di atas untuk menambahkan slot sesi praktik baru.
                  </span>
                </div>
              ) : (
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/70">
                      <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waktu Sesi (90 Menit)</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Slot</TableHead>
                      <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedSlots.map((s) => {
                      const isDeleting = deletingId === s.id

                      return (
                        <TableRow key={s.id} className="border-b border-border/60 last:border-b-0 hover:bg-muted/20">
                          <TableCell className="px-4 py-3.5 font-mono text-foreground font-medium tabular-nums">
                            {s.date}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 font-mono text-foreground tabular-nums">
                            {s.timeRange}
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            {s.status === "available" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                                <span>Available</span>
                              </span>
                            ) : s.status === "booked" ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                title={s.deleteRestrictionReason}
                              >
                                <span className="size-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                                <span>Booked (Pasien)</span>
                              </span>
                            ) : s.status === "reserved" ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                title={s.deleteRestrictionReason}
                              >
                                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden="true" />
                                <span>Hold (17m)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/70">
                                <span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden="true" />
                                <span>Dibatalkan</span>
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right">
                            {s.canDelete ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSlot(s.id, s.timeRange)}
                                disabled={isDeleting}
                                className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                                title="Hapus slot jadwal ini"
                              >
                                <Trash2 className="size-3.5 mr-1" />
                                <span>{isDeleting ? "..." : "Hapus"}</span>
                              </Button>
                            ) : (
                              <span
                                className="text-xs text-muted-foreground/70 italic cursor-help inline-flex items-center justify-end gap-1"
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
        </div>

        {/* Footer */}
        <div className="p-5 px-6 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-4 text-primary shrink-0" />
            <span>Maksimal 2 sesi bersamaan se-platform (Platform Concurrency Guard 2 Akun Zoom).</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 text-xs cursor-pointer">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
