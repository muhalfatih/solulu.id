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
  Filter,
  Check,
  ShieldCheck,
  TableProperties,
  Sparkles,
  AlertTriangle,
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
import {
  computeEndTime,
  formatTimeRange,
  getNowWIB,
  getWIBDateString,
  getMaxBookableDateString,
  parseTimeToMinutes,
  isTimeRangeOverlapping,
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

function formatIndonesianDateLabel(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function formatIndonesianDateShort(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    if (!year || !month || !day) return dateStr
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  } catch {
    return dateStr
  }
}

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
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)

  // Layout presentation: "workbench" (Dual-pane) vs "table" (Full-width audit view)
  const [viewMode, setViewMode] = React.useState<"workbench" | "table">("workbench")
  // Mobile tab toggle when in small screen (< md)
  const [mobileTab, setMobileTab] = React.useState<"composer" | "slots">("composer")

  // Creation form date bounds (WIB)
  const nowWIB = React.useMemo(() => getNowWIB(), [])
  const todayWIB = nowWIB.dateStr
  const maxDateWIB = React.useMemo(() => getMaxBookableDateString(), [])

  const tomorrowStr = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return getWIBDateString(d)
  }, [])

  const dayAfterTomorrowStr = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return getWIBDateString(d)
  }, [])

  const threeDaysStr = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
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
      setConfirmDeleteId(null)
      setFormError(null)
    }
  }, [isOpen, counselor?.id, loadSlots])

  // Distinct dates in loaded slots
  const distinctDates = React.useMemo(() => {
    const set = new Set<string>()
    slots.forEach((s) => set.add(s.date))
    return Array.from(set).sort()
  }, [slots])

  // Filtered slots for right panel
  const displayedSlots = React.useMemo(() => {
    if (viewDateFilter === "all") return slots
    return slots.filter((s) => s.date === viewDateFilter)
  }, [slots, viewDateFilter])

  // Group slots by date for intuitive scanning
  const groupedSlots = React.useMemo(() => {
    const groups: Record<string, AdminCounselorSlotView[]> = {}
    displayedSlots.forEach((slot) => {
      if (!groups[slot.date]) groups[slot.date] = []
      groups[slot.date].push(slot)
    })
    // Sort slots in each date chronologically by start time
    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime))
    })
    return groups
  }, [displayedSlots])

  // Active slots existing on the selected creation date
  const existingSlotsOnSelectedDate = React.useMemo(() => {
    return slots.filter((s) => s.date === selectedDate && s.status !== "cancelled")
  }, [slots, selectedDate])

  // Concurrency & overlap intelligence for preset buttons
  const getPresetStatus = React.useCallback(
    (time: string) => {
      const isTimePassedToday =
        selectedDate === todayWIB && parseTimeToMinutes(time) <= nowWIB.timeMinutes
      if (isTimePassedToday) {
        return { isPassed: true, isExisting: false, hasOverlap: false, label: "Terlewat" }
      }

      const isExactExisting = existingSlotsOnSelectedDate.some((s) => s.startTime === time)
      if (isExactExisting) {
        return { isPassed: false, isExisting: true, hasOverlap: false, label: "Terdaftar" }
      }

      const endTime = computeEndTime(time)
      const isOverlapping = existingSlotsOnSelectedDate.some((s) =>
        isTimeRangeOverlapping(s.startTime, s.endTime, time, endTime)
      )
      if (isOverlapping) {
        return { isPassed: false, isExisting: false, hasOverlap: true, label: "Bentrok" }
      }

      return { isPassed: false, isExisting: false, hasOverlap: false, label: null }
    },
    [selectedDate, todayWIB, nowWIB.timeMinutes, existingSlotsOnSelectedDate]
  )

  const togglePresetTime = (timeStr: string) => {
    setFormError(null)
    const status = getPresetStatus(timeStr)
    if (status.isPassed || status.isExisting || status.hasOverlap) return

    if (selectedTimes.includes(timeStr)) {
      setSelectedTimes(selectedTimes.filter((t) => t !== timeStr))
    } else {
      setSelectedTimes([...selectedTimes, timeStr])
    }
  }

  const handleSelectQuickGroup = (group: "pagi" | "sore" | "all" | "clear") => {
    setFormError(null)
    if (group === "clear") {
      setSelectedTimes([])
      return
    }

    let candidates: string[] = []
    if (group === "pagi") candidates = ["09:00", "11:00"]
    if (group === "sore") candidates = ["15:30", "19:00", "20:30"]
    if (group === "all") candidates = PRESET_START_TIMES

    const validCandidates = candidates.filter((time) => {
      const status = getPresetStatus(time)
      return !status.isPassed && !status.isExisting && !status.hasOverlap
    })

    setSelectedTimes(validCandidates)
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

    const endTime = computeEndTime(customTime)
    const overlaps = existingSlotsOnSelectedDate.some((s) =>
      isTimeRangeOverlapping(s.startTime, s.endTime, customTime, endTime)
    )
    if (overlaps) {
      setFormError(`Jam ${customTime} bentrok dengan slot yang sudah ada pada tanggal ini.`)
      return
    }

    setSelectedTimes([...selectedTimes, customTime].sort())
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
        // Reset selections & reload
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
    setDeletingId(slotId)
    setConfirmDeleteId(null)
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

  const availableCount = slots.filter((s) => s.status === "available").length
  const bookedCount = slots.filter((s) => s.status === "booked").length
  const reservedCount = slots.filter((s) => s.status === "reserved").length

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full sm:max-w-4xl lg:max-w-[980px] h-[680px] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border border-border/80 rounded-xl shadow-2xl"
      >
        {/* Header - Clinical Precision & Operational Sanctuary */}
        <DialogHeader className="px-5 py-3 border-b border-border/70 bg-muted/10 flex flex-row items-center justify-between gap-3 shrink-0 space-y-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
              <CalendarIcon className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-sm font-semibold text-foreground tracking-tight truncate">
                  Kelola Slot Jadwal: {counselor?.name}
                </DialogTitle>
                {counselor?.type && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    <span>{counselor.type === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}</span>
                  </span>
                )}
              </div>
              <DialogDescription className="text-[11px] text-muted-foreground truncate">
                Sesi 90 menit • Concurrency Guard maks 2 Zoom Pro simultan se-platform
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={loadSlots}
              disabled={isLoading}
              title="Muat ulang data slot jadwal"
              className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
              aria-label="Tutup dialog"
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Toast Alert Banner */}
        {toastMessage && (
          <div
            className={`px-5 py-2 text-xs flex items-center justify-between border-b shrink-0 ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="size-3.5 shrink-0 text-destructive" />
              )}
              <span className="font-medium text-[11px]">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 p-0.5 cursor-pointer rounded transition-opacity"
              aria-label="Tutup notifikasi"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Operational Telemetry & Control Bar */}
        <div className="px-5 py-2 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Live Telemetry Counts */}
          <div className="flex items-center gap-2 text-xs tabular-nums">
            <span className="text-[11px] font-medium text-muted-foreground mr-0.5">Status:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{availableCount} Tersedia</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>{bookedCount} Dipesan</span>
            </span>
            {reservedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{reservedCount} Hold</span>
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-mono ml-1">
              ({slots.length} total)
            </span>
          </div>

          {/* Desktop View Switcher & Mobile Tabs */}
          <div className="flex items-center gap-2">
            {/* Small Screen Toggle (< md) */}
            <div className="flex md:hidden items-center p-0.5 bg-muted rounded-md border border-border">
              <button
                type="button"
                onClick={() => setMobileTab("composer")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1 ${
                  mobileTab === "composer"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Plus className="size-3" />
                <span>Buka Slot</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("slots")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                  mobileTab === "slots"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Daftar ({slots.length})
              </button>
            </div>

            {/* Desktop View Toggle */}
            <div className="hidden md:flex items-center gap-1 p-0.5 bg-muted/60 border border-border/60 rounded-md">
              <button
                type="button"
                onClick={() => setViewMode("workbench")}
                className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "workbench"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tampilan 2-kolom: Composer & Live Feed"
              >
                <Sparkles className="size-3 text-primary" />
                <span>Workbench</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-0.5 text-[11px] font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tampilan audit tabel penuh"
              >
                <TableProperties className="size-3 text-muted-foreground" />
                <span>Tabel Penuh</span>
              </button>
            </div>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* VIEW MODE 1: WORKBENCH (DUAL-PANE COMPACT COCKPIT) */}
          {viewMode === "workbench" ? (
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border/70 overflow-hidden">
              {/* LEFT PANE: COMPOSER (340px / 5 cols) */}
              <div
                className={`md:col-span-5 flex-col flex-1 h-full min-h-0 bg-muted/5 overflow-y-auto ${
                  mobileTab === "composer" ? "flex" : "hidden md:flex"
                }`}
              >
                <form onSubmit={handleCreateSlots} className="p-3.5 flex flex-col justify-between min-h-full gap-3">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-border/50">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Plus className="size-3.5 text-primary" />
                        <span>Buka Slot Praktik Baru</span>
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        +90 Menit/Sesi
                      </span>
                    </div>

                    {formError && (
                      <div className="p-2 rounded-md bg-destructive/10 text-destructive text-[11px] flex items-center gap-2 border border-destructive/20">
                        <AlertCircle className="size-3.5 shrink-0" />
                        <span className="font-medium leading-tight">{formError}</span>
                      </div>
                    )}

                    {/* 1. Date Selector with Fast relative chips */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="slot-date-wb" className="text-[11px] font-semibold text-foreground">
                          Tanggal Praktik
                        </label>
                        <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
                          Maks {maxDateWIB}
                        </span>
                      </div>

                      <Input
                        id="slot-date-wb"
                        type="date"
                        min={todayWIB}
                        max={maxDateWIB}
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value)
                          setFormError(null)
                        }}
                        required
                        className="h-7.5 text-xs bg-background tabular-nums font-mono rounded-md"
                      />

                      {/* Relative Date Shortcut Pills */}
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(tomorrowStr)}
                          className={`text-[11px] font-medium py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                            selectedDate === tomorrowStr
                              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                              : "bg-background text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                          }`}
                        >
                          Besok
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDate(dayAfterTomorrowStr)}
                          className={`text-[11px] font-medium py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                            selectedDate === dayAfterTomorrowStr
                              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                              : "bg-background text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                          }`}
                        >
                          Lusa
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDate(threeDaysStr)}
                          className={`text-[11px] font-medium py-1 px-1 rounded-md border text-center transition-all cursor-pointer ${
                            selectedDate === threeDaysStr
                              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-2xs"
                              : "bg-background text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                          }`}
                        >
                          +3 Hari
                        </button>
                      </div>
                    </div>

                    {/* 2. Session Start Times Matrix with Realtime Conflict Awareness */}
                    <div className="flex flex-col gap-1.5 pt-1.5 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-foreground">
                          Pilih Jam Mulai Sesi
                        </span>
                        {/* Batch Shortcuts */}
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleSelectQuickGroup("pagi")}
                            className="px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer font-medium"
                          >
                            Pagi
                          </button>
                          <span className="text-muted-foreground/30">•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectQuickGroup("sore")}
                            className="px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer font-medium"
                          >
                            Malam
                          </button>
                          <span className="text-muted-foreground/30">•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectQuickGroup("all")}
                            className="px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer font-medium"
                          >
                            Semua
                          </button>
                          <span className="text-muted-foreground/30">•</span>
                          <button
                            type="button"
                            onClick={() => handleSelectQuickGroup("clear")}
                            className="px-1.5 py-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted/60 cursor-pointer font-medium"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {PRESET_START_TIMES.map((time) => {
                          const isSelected = selectedTimes.includes(time)
                          const endStr = computeEndTime(time)
                          const status = getPresetStatus(time)
                          const isDisabled = status.isPassed || status.isExisting || status.hasOverlap

                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => togglePresetTime(time)}
                              title={status.hasOverlap ? "Bentrok dengan sesi lain pada tanggal ini" : undefined}
                              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-md border text-xs transition-all select-none relative ${
                                isDisabled
                                  ? status.hasOverlap
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 cursor-not-allowed"
                                    : "bg-muted/40 text-muted-foreground/45 border-border/40 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-primary text-primary-foreground border-primary font-medium shadow-2xs ring-1 ring-primary/40 cursor-pointer"
                                  : "bg-background text-foreground border-border hover:bg-muted/60 cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-mono font-bold text-xs tabular-nums">{time}</span>
                                {isSelected && <Check className="size-3 text-primary-foreground" />}
                              </div>
                              <span
                                className={`text-[10px] tabular-nums font-mono ${
                                  status.hasOverlap
                                    ? "text-amber-700 dark:text-amber-400 font-semibold"
                                    : isDisabled
                                    ? "text-muted-foreground/40"
                                    : isSelected
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {status.label ? status.label : `– ${endStr}`}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Integrated Custom Time Input */}
                      <div className="pt-1.5 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <label htmlFor="custom-time-input-wb" className="text-[10px] font-medium text-muted-foreground">
                            Jam Kustom (HH:mm)
                          </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Input
                            id="custom-time-input-wb"
                            type="text"
                            placeholder="14:15"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddCustomTime()
                              }
                            }}
                            className="w-20 h-7 text-xs bg-background text-center font-mono tabular-nums rounded-md"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddCustomTime}
                            className="h-7 px-2 text-xs cursor-pointer rounded-md shrink-0"
                          >
                            + Tambah
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Summary & Submit Action (Cleanly anchored at bottom) */}
                  <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Total Slot Dipilih:</span>
                      <span className="font-mono font-semibold text-foreground tabular-nums">
                        {selectedTimes.length} Sesi ({selectedTimes.length * 90} Mnt)
                      </span>
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting || selectedTimes.length === 0}
                      className="w-full h-8 px-3 text-xs font-medium gap-1.5 cursor-pointer rounded-md shadow-2xs"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Menyimpan Slot…</span>
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5" />
                          <span>Buka {selectedTimes.length} Slot ({formatIndonesianDateShort(selectedDate)})</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* RIGHT PANE: LIVE SCHEDULE FEED & EXPLORER (7 cols) */}
              <div
                className={`md:col-span-7 flex flex-col flex-1 h-full min-h-0 bg-background overflow-hidden ${
                  mobileTab === "slots" ? "flex" : "hidden md:flex"
                }`}
              >
                {/* Date Filter & Explorer Toolbar */}
                <div className="px-4 py-2 border-b border-border/60 bg-muted/10 flex flex-wrap items-center justify-between gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 flex-wrap max-w-full overflow-x-auto py-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-0.5">
                      <Filter className="size-3 text-muted-foreground/70" />
                      <span>Filter:</span>
                    </span>

                    {/* Quick Date Pills */}
                    <button
                      type="button"
                      onClick={() => setViewDateFilter("all")}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        viewDateFilter === "all"
                          ? "bg-primary text-primary-foreground border-primary font-medium shadow-2xs"
                          : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      Semua ({slots.length})
                    </button>

                    {distinctDates.map((date) => {
                      const count = slots.filter((s) => s.date === date).length
                      const isSelected = viewDateFilter === date
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setViewDateFilter(date)}
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-medium shadow-2xs"
                              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {formatIndonesianDateShort(date)} ({count})
                        </button>
                      )
                    })}
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
                    {displayedSlots.length} sesi aktif
                  </span>
                </div>

                {/* Grouped Slot Feed Container */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3.5 flex flex-col gap-2.5">
                  {displayedSlots.length === 0 ? (
                    <div className="py-16 px-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 my-auto">
                      <div className="size-9 rounded-lg bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground">
                        <CalendarIcon className="size-4 text-muted-foreground/70" />
                      </div>
                      <div className="flex flex-col gap-0.5 max-w-xs">
                        <span className="text-xs font-semibold text-foreground">
                          {viewDateFilter === "all"
                            ? "Belum ada slot waktu terdaftar"
                            : `Tidak ada slot untuk ${formatIndonesianDateLabel(viewDateFilter)}`}
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed">
                          Pilih tanggal dan jam di panel sebelah kiri untuk menambahkan slot konsultasi bagi konselor ini.
                        </span>
                      </div>
                    </div>
                  ) : (
                    Object.keys(groupedSlots).map((date) => {
                      const dateSlots = groupedSlots[date]

                      return (
                        <div key={date} className="shrink-0 rounded-lg border border-border/70 overflow-hidden bg-card shadow-2xs">
                          {/* Date Header Strip */}
                          <div className="px-3 py-1.5 bg-muted/40 border-b border-border/60 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5 font-mono">
                              <CalendarIcon className="size-3 text-primary" />
                              <span>{formatIndonesianDateLabel(date)}</span>
                            </span>
                            <span className="text-[10px] font-mono font-medium text-muted-foreground tabular-nums">
                              {dateSlots.length} Sesi
                            </span>
                          </div>

                          {/* Slot Rows List */}
                          <div className="divide-y divide-border/40">
                            {dateSlots.map((s) => {
                              const isDeleting = deletingId === s.id
                              const isConfirming = confirmDeleteId === s.id

                              return (
                                <div
                                  key={s.id}
                                  className="px-3 py-2 flex items-center justify-between gap-2.5 hover:bg-muted/20 transition-colors"
                                >
                                  {/* Left: Time & 90m Indicator */}
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Clock className="size-3.5 text-muted-foreground/70 shrink-0" />
                                    <span className="text-xs font-mono font-semibold tabular-nums text-foreground">
                                      {s.timeRange}
                                    </span>
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-muted/60 text-muted-foreground font-mono">
                                      90m
                                    </span>
                                  </div>

                                  {/* Right: Status Pill & Delete Button */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {s.status === "available" ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                        <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        <span>Tersedia</span>
                                      </span>
                                    ) : s.status === "booked" ? (
                                      <span
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                                        title={s.deleteRestrictionReason}
                                      >
                                        <span className="size-1.5 rounded-full bg-primary shrink-0" />
                                        <span>Dipesan</span>
                                      </span>
                                    ) : s.status === "reserved" ? (
                                      <span
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                        title={s.deleteRestrictionReason}
                                      >
                                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        <span>Hold</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                                        <span>Dibatalkan</span>
                                      </span>
                                    )}

                                    {/* Action Button: Two-Step Confirm Delete */}
                                    {s.canDelete ? (
                                      isConfirming ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSlot(s.id, s.timeRange)}
                                            disabled={isDeleting}
                                            className="h-6 px-2 text-[11px] bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded font-medium cursor-pointer shadow-2xs"
                                          >
                                            {isDeleting ? "Hapus…" : "Yakin?"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:bg-muted rounded cursor-pointer"
                                          >
                                            Batal
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(s.id)}
                                          className="size-6.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors cursor-pointer"
                                          title="Hapus slot jadwal ini"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </button>
                                      )
                                    ) : (
                                      <span
                                        className="size-6.5 flex items-center justify-center text-muted-foreground/50 cursor-help"
                                        title={s.deleteRestrictionReason || "Slot tidak dapat dihapus"}
                                      >
                                        <Lock className="size-3" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: AUDIT TABLE VIEW (FULL WIDTH) */
            <div className="flex-1 min-h-0 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center justify-between pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Audit Data Slot Jadwal
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    ({displayedSlots.length} baris)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={viewDateFilter}
                    onChange={(e) => setViewDateFilter(e.target.value)}
                    className="h-7 text-xs rounded border border-border bg-background px-2 font-mono cursor-pointer"
                  >
                    <option value="all">Semua Tanggal ({slots.length})</option>
                    {distinctDates.map((d) => (
                      <option key={d} value={d}>
                        {formatIndonesianDateLabel(d)} ({slots.filter((s) => s.date === d).length})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewMode("workbench")}
                    className="h-7 px-2.5 text-xs font-medium cursor-pointer"
                  >
                    Buka Workbench
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden bg-background shadow-2xs flex-1 min-h-0">
                <div className="overflow-y-auto h-full">
                  <Table className="text-xs">
                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-xs z-10 border-b border-border">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground w-44">
                          Tanggal Praktik
                        </TableHead>
                        <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground w-48">
                          Jam Sesi (90 Mnt)
                        </TableHead>
                        <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground w-36">
                          Status
                        </TableHead>
                        <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground text-right">
                          Tindakan
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedSlots.map((s) => {
                        const isDeleting = deletingId === s.id
                        const isConfirming = confirmDeleteId === s.id

                        return (
                          <TableRow key={s.id} className="border-b border-border last:border-b-0 hover:bg-muted/15">
                            <TableCell className="px-4 py-2 font-mono font-medium tabular-nums text-xs">
                              {formatIndonesianDateLabel(s.date)}
                            </TableCell>
                            <TableCell className="px-4 py-2 font-mono text-foreground tabular-nums text-xs font-medium">
                              {s.timeRange}
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              {s.status === "available" ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  <span>Tersedia</span>
                                </span>
                              ) : s.status === "booked" ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                                  <span>Dipesan Pasien</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  <span>Hold</span>
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-2 text-right">
                              {s.canDelete ? (
                                isConfirming ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSlot(s.id, s.timeRange)}
                                      disabled={isDeleting}
                                      className="h-6 px-2 text-[11px] bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded font-medium cursor-pointer"
                                    >
                                      {isDeleting ? "Hapus…" : "Yakin?"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="h-6 px-1.5 text-[11px] text-muted-foreground hover:bg-muted rounded cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmDeleteId(s.id)}
                                    className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                                  >
                                    <Trash2 className="size-3 mr-1" />
                                    <span>Hapus</span>
                                  </Button>
                                )
                              ) : (
                                <span className="text-[11px] text-muted-foreground/60 italic">
                                  Terkunci
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unified Bottom Footer */}
        <div className="px-5 py-2.5 border-t border-border/70 bg-muted/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Info className="size-3.5 text-primary shrink-0" />
            <span>Maksimal 2 sesi bersamaan se-platform (Platform Concurrency Guard 2 Akun Zoom Pro).</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7.5 px-3 text-xs cursor-pointer rounded-md shrink-0"
          >
            Tutup Dialog
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
