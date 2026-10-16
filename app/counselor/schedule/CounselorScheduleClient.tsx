"use client"

import * as React from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  CalendarOff,
  Plus,
  RefreshCw,
  Info,
  Sparkles,
  ShieldAlert,
  X,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  getCounselorWeeklyGridAction,
  toggleSlotAvailabilityAction,
  submitLeaveRequestAction,
  cancelSlotLeaveAction,
  type CounselorWeeklyGridData,
} from "./actions"
import type { GridSlotCell, WeeklyGridDay } from "@/lib/schedules/commitment"
import type { FixedSlot } from "@/lib/operator/types"

interface CounselorScheduleClientProps {
  initialData: CounselorWeeklyGridData
}

export default function CounselorScheduleClient({
  initialData,
}: CounselorScheduleClientProps) {
  const [data, setData] = React.useState<CounselorWeeklyGridData>(initialData)
  const [currentWeekReference, setCurrentWeekReference] = React.useState<string>(
    initialData.weekDates[0]?.date || new Date().toISOString().split("T")[0]
  )
  const [isLoadingWeek, setIsLoadingWeek] = React.useState<boolean>(false)
  const [togglingKeys, setTogglingKeys] = React.useState<Set<string>>(new Set())

  // Leave Dialog state
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = React.useState<boolean>(false)
  const [leaveStartDate, setLeaveStartDate] = React.useState<string>(
    initialData.weekDates[0]?.date || ""
  )
  const [leaveEndDate, setLeaveEndDate] = React.useState<string>(
    initialData.weekDates[0]?.date || ""
  )
  const [leaveReason, setLeaveReason] = React.useState<string>("")
  const [leaveFormError, setLeaveFormError] = React.useState<string | null>(null)
  const [isSubmittingLeave, setIsSubmittingLeave] = React.useState<boolean>(false)

  // Navigate week
  const handleNavigateWeek = async (direction: "prev" | "next" | "current") => {
    let newRefDate = new Date(currentWeekReference)
    if (direction === "prev") {
      newRefDate.setDate(newRefDate.getDate() - 7)
    } else if (direction === "next") {
      newRefDate.setDate(newRefDate.getDate() + 7)
    } else {
      newRefDate = new Date()
    }

    const year = newRefDate.getFullYear()
    const month = String(newRefDate.getMonth() + 1).padStart(2, "0")
    const day = String(newRefDate.getDate()).padStart(2, "0")
    const dateStr = `${year}-${month}-${day}`

    setCurrentWeekReference(dateStr)
    setIsLoadingWeek(true)

    try {
      const res = await getCounselorWeeklyGridAction(dateStr)
      if (res.success && res.data) {
        setData(res.data)
      } else {
        toast.error(res.error || "Gagal memuat jadwal minggu yang dipilih.")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat memuat jadwal.")
    } finally {
      setIsLoadingWeek(false)
    }
  }

  // Toggle Slot Availability
  const handleToggleSlot = async (slotIndex: number, date: string) => {
    const cellKey = `${slotIndex}_${date}`
    const cell = data.grid[slotIndex]?.[date]

    if (!cell || !cell.canToggle) {
      if (cell?.toggleDisabledReason) {
        toast.warning(cell.toggleDisabledReason)
      }
      return
    }

    setTogglingKeys((prev) => new Set(prev).add(cellKey))

    // Optimistic UI updates
    const previousGrid = { ...data.grid }
    const currentStatus = cell.status
    const willBeAvailable = currentStatus === "unopened" || currentStatus === "cancelled" || cell.isLeave

    const updatedCell: GridSlotCell = {
      ...cell,
      status: willBeAvailable ? "available" : "cancelled",
      isLeave: false,
      leaveReason: null,
    }

    const nextGrid = {
      ...data.grid,
      [slotIndex]: {
        ...data.grid[slotIndex],
        [date]: updatedCell,
      },
    }

    // Recalculate local commitment count
    let localActiveCount = 0
    for (const s of data.fixedSlots) {
      for (const d of data.weekDates) {
        const c = s.slotIndex === slotIndex && d.date === date ? updatedCell : nextGrid[s.slotIndex]?.[d.date]
        if (c && !c.isLeave && (c.status === "available" || c.status === "reserved" || c.status === "booked")) {
          localActiveCount++
        }
      }
    }

    const target = data.commitment.target
    const nextCommitment = {
      activeCount: localActiveCount,
      target,
      isMet: localActiveCount >= target,
      remaining: Math.max(0, target - localActiveCount),
      percentage: Math.min(100, Math.round((localActiveCount / target) * 100)),
    }

    setData((prev) => ({
      ...prev,
      grid: nextGrid,
      commitment: nextCommitment,
    }))

    try {
      const res = await toggleSlotAvailabilityAction({ date, slotIndex })
      if (res.success && res.data) {
        toast.success(
          willBeAvailable
            ? `Slot dibuka: ${cell.displayTime} (${date})`
            : `Slot ditutup: ${cell.displayTime} (${date})`
        )
      } else {
        // Revert on failure
        setData((prev) => ({
          ...prev,
          grid: previousGrid,
        }))
        toast.error(res.error || "Gagal mengubah status slot jadwal.")
      }
    } catch {
      setData((prev) => ({
        ...prev,
        grid: previousGrid,
      }))
      toast.error("Terjadi kegagalan saat menghubungi server database.")
    } finally {
      setTogglingKeys((prev) => {
        const next = new Set(prev)
        next.delete(cellKey)
        return next
      })
    }
  }

  // Open Leave Dialog
  const handleOpenLeaveDialog = () => {
    const today = new Date().toISOString().split("T")[0]
    setLeaveStartDate(data.weekDates[0]?.date >= today ? data.weekDates[0]?.date : today)
    setLeaveEndDate(data.weekDates[data.weekDates.length - 1]?.date || today)
    setLeaveReason("")
    setLeaveFormError(null)
    setIsLeaveDialogOpen(true)
  }

  // Submit Leave Request
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveReason.trim() || leaveReason.trim().length < 3) {
      setLeaveFormError("Mohon cantumkan alasan izin/cuti praktik yang jelas (minimal 3 karakter).")
      return
    }

    if (leaveStartDate > leaveEndDate) {
      setLeaveFormError("Tanggal mulai tidak boleh mendahului tanggal selesai.")
      return
    }

    setIsSubmittingLeave(true)
    setLeaveFormError(null)

    try {
      const res = await submitLeaveRequestAction({
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        leaveReason: leaveReason.trim(),
      })

      if (res.success) {
        toast.success(`Pengajuan cuti berhasil diproses (${res.data?.affectedSlots || 0} slot disesuaikan).`)
        setIsLeaveDialogOpen(false)
        // Refresh grid
        const refresh = await getCounselorWeeklyGridAction(currentWeekReference)
        if (refresh.success && refresh.data) {
          setData(refresh.data)
        }
      } else {
        setLeaveFormError(res.error || "Gagal memproses pengajuan cuti.")
        toast.error(res.error || "Gagal mengajukan izin cuti.")
      }
    } catch {
      setLeaveFormError("Terjadi kegagalan jaringan saat mengirim pengajuan cuti.")
      toast.error("Terjadi kegagalan jaringan.")
    } finally {
      setIsSubmittingLeave(false)
    }
  }

  // Cancel slot leave
  const handleCancelSlotLeave = async (scheduleId: string, slotTitle: string) => {
    try {
      const res = await cancelSlotLeaveAction(scheduleId)
      if (res.success) {
        toast.success(`Izin cuti pada slot ${slotTitle} dibatalkan. Slot kini kembali tersedia.`)
        const refresh = await getCounselorWeeklyGridAction(currentWeekReference)
        if (refresh.success && refresh.data) {
          setData(refresh.data)
        }
      } else {
        toast.error(res.error || "Gagal membatalkan cuti slot.")
      }
    } catch {
      toast.error("Terjadi kegagalan jaringan saat membatalkan cuti.")
    }
  }

  const { commitment, weekDates, fixedSlots, grid } = data
  const weekStartDisplay = weekDates[0]?.fullDisplay || ""
  const weekEndDisplay = weekDates[6]?.fullDisplay || ""

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* 1. Header & Headline */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Komitmen Jadwal Praktik
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Portal Mitra
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Kelola ketersediaan 7 slot harian berdurasi 2 jam. Klinik menetapkan komitmen wajib
            pembukaan <strong className="text-foreground">minimal 10 slot per minggu</strong> untuk
            menjaga aksesibilitas layanan bagi klien.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleOpenLeaveDialog}
            className="flex items-center gap-2"
          >
            <CalendarOff className="size-4" data-icon="inline-start" />
            Ajukan Izin / Cuti
          </Button>
          <Button
            variant="default"
            onClick={() => handleNavigateWeek("current")}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="size-4" data-icon="inline-start" />
            Minggu Ini
          </Button>
        </div>
      </div>

      {/* 2. Visual Progress Indicator Card (Quota: Min 10 slots) */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardContent className="p-5 md:p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl font-bold transition-colors",
                  commitment.isMet
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                )}
              >
                {commitment.isMet ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <AlertCircle className="size-5" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    Target Kuota Mingguan: {commitment.activeCount} dari {commitment.target} Slot
                  </h3>
                  {commitment.isMet ? (
                    <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">
                      Kuota Terpenuhi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                      Kurang {commitment.remaining} Slot
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {commitment.isMet
                    ? "Luar biasa! Anda telah memenuhi komitmen ketersediaan sesi untuk minggu ini."
                    : `Silakan klik pada sel jadwal kosong di bawah untuk membuka minimal ${commitment.remaining} slot lagi.`}
                </p>
              </div>
            </div>

            <div className="text-right sm:shrink-0">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {commitment.percentage}%
              </span>
              <span className="text-xs text-muted-foreground block">Tercapai</span>
            </div>
          </div>

          {/* Progress Bar with Semantic Color Transition */}
          <div className="flex flex-col gap-1.5">
            <Progress
              value={commitment.percentage}
              className={cn(
                "h-2.5 rounded-full transition-all",
                commitment.isMet ? "[&>div]:bg-emerald-600" : "[&>div]:bg-amber-500"
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground border-t border-border/60">
            <div className="flex items-start gap-2">
              <Info className="size-4 shrink-0 text-primary mt-0.5" />
              <span>
                <strong>Aturan Batas Waktu Pemesanan (H-4):</strong> Klien hanya dapat memesan slot
                konsultasi dengan jeda waktu minimal 4 jam sebelum jam sesi dimulai.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <span>
                <strong>Proteksi Sesi Terpesan:</strong> Slot yang telah dipesan oleh klien dikunci
                secara permanen dan tidak dapat dimatikan langsung oleh konselor.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Week Navigation & Legend Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/40 p-3 rounded-lg border border-border/60">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateWeek("prev")}
            disabled={isLoadingWeek}
            aria-label="Minggu sebelumnya"
            className="size-8"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2 px-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {weekStartDisplay} – {weekEndDisplay}
            </span>
            {isLoadingWeek && <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateWeek("next")}
            disabled={isLoadingWeek}
            aria-label="Minggu berikutnya"
            className="size-8"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
            <span>Dibuka (Aktif)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-background border border-dashed border-border" />
            <span>Tutup (Klik Buka)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-amber-500/20 border border-amber-500/40" />
            <span>Terpesan (Terkunci)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-rose-500/20 border border-rose-500/40" />
            <span>Izin / Cuti</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-muted/70 opacity-60" />
            <span>Terlewat</span>
          </div>
        </div>
      </div>

      {/* 4. 7x7 Interactive Grid Matrix */}
      <div className="overflow-x-auto border rounded-xl bg-card shadow-xs">
          <table className="w-full border-collapse text-left text-sm min-w-[840px]">
            <thead>
              <tr className="border-b bg-muted/60 text-muted-foreground">
                <th className="p-3 font-semibold w-48 text-xs uppercase tracking-wider border-r">
                  Slot Waktu (2 Jam)
                </th>
                {weekDates.map((day) => (
                  <th
                    key={day.date}
                    className={cn(
                      "p-3 text-center border-r last:border-r-0 transition-colors",
                      day.isToday && "bg-primary/10 text-primary font-bold"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {day.dayName}
                      </span>
                      <span
                        className={cn(
                          "text-base font-bold size-7 rounded-full flex items-center justify-center mt-0.5",
                          day.isToday ? "bg-primary text-primary-foreground shadow-xs" : "text-foreground"
                        )}
                      >
                        {parseInt(day.dayNumber, 10)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{day.monthName}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fixedSlots.map((slot) => {
                return (
                  <tr key={slot.slotIndex} className="border-b last:border-b-0 hover:bg-muted/10 transition-colors">
                    {/* Fixed Slot Header (Left Column) */}
                    <td className="p-3 border-r bg-muted/20 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-xs text-foreground">
                          {slot.label.split("(")[0].trim()}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <Clock className="size-3 text-primary shrink-0" />
                          <span>{slot.displayTime.replace(" WIB", "")}</span>
                        </div>
                        <Badge variant="outline" className="w-fit text-[10px] h-4 px-1 text-muted-foreground font-normal">
                          120 Menit
                        </Badge>
                      </div>
                    </td>

                    {/* 7 Daily Cells */}
                    {weekDates.map((day) => {
                      const cellKey = `${slot.slotIndex}_${day.date}`
                      const cell = grid[slot.slotIndex]?.[day.date]
                      const isToggling = togglingKeys.has(cellKey)

                      if (!cell) {
                        return (
                          <td key={day.date} className="p-2 border-r last:border-r-0 text-center text-xs text-muted-foreground">
                            -
                          </td>
                        )
                      }

                      // Render Cell Based on State
                      if (cell.isLeave) {
                        return (
                          <td
                            key={day.date}
                            className="p-2 border-r last:border-r-0 align-middle bg-rose-500/5 dark:bg-rose-950/20"
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 gap-1 text-center transition-all">
                                  <CalendarOff className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                  <span className="text-xs font-semibold leading-tight">
                                    Izin / Cuti
                                  </span>
                                  {cell.leaveReason && (
                                    <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 line-clamp-1 italic">
                                      {cell.leaveReason}
                                    </span>
                                  )}
                                  {cell.scheduleId && (
                                    <button
                                      type="button"
                                      onClick={() => handleCancelSlotLeave(cell.scheduleId!, slot.label)}
                                      className="text-[10px] underline hover:text-rose-900 dark:hover:text-rose-200 mt-1"
                                    >
                                      Batalkan Cuti
                                    </button>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                <p className="font-semibold">Cuti Konselor</p>
                                <p className="text-muted-foreground">
                                  Alasan: {cell.leaveReason || "Tidak ada keterangan"}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Klien tidak dapat memesan jadwal ini.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        )
                      }

                      if (cell.status === "booked") {
                        return (
                          <td
                            key={day.date}
                            className="p-2 border-r last:border-r-0 align-middle bg-amber-500/5 dark:bg-amber-950/20"
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 gap-1 text-center cursor-not-allowed">
                                  <div className="flex items-center gap-1">
                                    <Lock className="size-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                                    <span className="text-xs font-bold leading-tight">
                                      Terpesan
                                    </span>
                                  </div>
                                  {cell.patientName ? (
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-foreground truncate max-w-[100px]">
                                      <User className="size-3 shrink-0 text-muted-foreground" />
                                      <span className="truncate">{cell.patientName}</span>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-600/30">
                                      {cell.bookingCode || "Terkonfirmasi"}
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                <p className="font-semibold">Sesi Konseling Terjadwal</p>
                                <p className="text-muted-foreground">
                                  Klien: {cell.patientName || "Klien Terkonfirmasi"}
                                </p>
                                <p className="text-amber-600 dark:text-amber-400 text-[11px] mt-1 font-medium">
                                  🔒 Slot terkunci dan tidak dapat dinonaktifkan langsung.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        )
                      }

                      if (cell.status === "reserved") {
                        return (
                          <td
                            key={day.date}
                            className="p-2 border-r last:border-r-0 align-middle bg-blue-500/5"
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 gap-1 text-center cursor-not-allowed">
                                  <Lock className="size-3.5 text-blue-600 shrink-0" />
                                  <span className="text-xs font-bold">Hold Klien</span>
                                  <span className="text-[10px] text-muted-foreground">Transaksi</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p>Sedang dalam hold proses pembayaran klien (15-30 menit).</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        )
                      }

                      if (cell.isPast) {
                        return (
                          <td
                            key={day.date}
                            className="p-2 border-r last:border-r-0 align-middle bg-muted/40 opacity-60"
                          >
                            <div className="flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-border/80 text-muted-foreground gap-1 text-center cursor-not-allowed">
                              <span className="text-xs font-medium">Terlewat</span>
                            </div>
                          </td>
                        )
                      }

                      if (cell.status === "available") {
                        return (
                          <td
                            key={day.date}
                            className="p-2 border-r last:border-r-0 align-middle bg-emerald-500/5 dark:bg-emerald-950/20"
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => handleToggleSlot(slot.slotIndex, day.date)}
                                  disabled={isToggling}
                                  className={cn(
                                    "w-full flex flex-col items-center justify-center p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 gap-1 text-center transition-all",
                                    "hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-700 dark:hover:text-rose-300 group cursor-pointer",
                                    isToggling && "opacity-50 cursor-wait"
                                  )}
                                >
                                  {isToggling ? (
                                    <RefreshCw className="size-4 animate-spin text-emerald-600" />
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-1 group-hover:hidden">
                                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span className="text-xs font-bold">Dibuka</span>
                                      </div>
                                      <div className="hidden group-hover:flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                        <X className="size-3.5 shrink-0" />
                                        <span className="text-xs font-bold">Tutup Slot</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground group-hover:text-rose-600/80">
                                        Siap Dipesan
                                      </span>
                                    </>
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p>Klik untuk menonaktifkan slot ini (Tutup).</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        )
                      }

                      // Unopened or Cancelled
                      return (
                        <td key={day.date} className="p-2 border-r last:border-r-0 align-middle">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleToggleSlot(slot.slotIndex, day.date)}
                                disabled={isToggling}
                                className={cn(
                                  "w-full flex flex-col items-center justify-center p-2.5 rounded-lg border border-dashed border-border bg-background hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300 text-muted-foreground gap-1 text-center transition-all cursor-pointer group",
                                  isToggling && "opacity-50 cursor-wait"
                                )}
                              >
                                {isToggling ? (
                                  <RefreshCw className="size-4 animate-spin text-primary" />
                                ) : (
                                  <>
                                    <div className="flex items-center gap-1 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                      <Plus className="size-3.5 shrink-0" />
                                      <span className="text-xs font-medium">Buka Slot</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/70 group-hover:text-emerald-600/80">
                                      Kosong
                                    </span>
                                  </>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>Klik untuk membuka slot praktik ini (Komitmen +1).</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      {/* 5. Leave Request Dialog */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarOff className="size-5 text-rose-500" />
              Pengajuan Izin / Cuti Praktik
            </DialogTitle>
            <DialogDescription>
              Tandai tanggal di mana Anda tidak dapat melayani sesi konseling. Sistem akan secara
              otomatis menutup slot dan mencegah klien memesan jadwal tersebut.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitLeave} className="flex flex-col gap-4 py-2">
            {leaveFormError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs">{leaveFormError}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="leaveStartDate">Tanggal Mulai</FieldLabel>
                  <Input
                    id="leaveStartDate"
                    type="date"
                    value={leaveStartDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="leaveEndDate">Tanggal Selesai</FieldLabel>
                  <Input
                    id="leaveEndDate"
                    type="date"
                    value={leaveEndDate}
                    min={leaveStartDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="leaveReason">Alasan Cuti / Izin Praktik</FieldLabel>
                <Textarea
                  id="leaveReason"
                  placeholder="Contoh: Keperluan keluarga mendesak, sakit, atau menghadiri konferensi klinis"
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  required
                />
                <FieldDescription>
                  Alasan ini disimpan dalam sistem operasional klinik Solulu untuk transparansi
                  tim dispatcher.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLeaveDialogOpen(false)}
                disabled={isSubmittingLeave}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmittingLeave} className="bg-rose-600 hover:bg-rose-700 text-white">
                {isSubmittingLeave ? "Memproses..." : "Simpan Pengajuan Cuti"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  )
}
