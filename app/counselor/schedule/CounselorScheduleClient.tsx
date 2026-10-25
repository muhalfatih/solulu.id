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
  X,
  User,
  Save,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
  saveCounselorTemplateAction,
  toggleScheduleModeAction,
  toggleSlotAvailabilityAction,
  submitLeaveRequestAction,
  cancelSlotLeaveAction,
  type CounselorWeeklyGridData,
  type CounselorTemplateData,
} from "./actions"
import { TEMPLATE_DAYS } from "@/lib/schedules/slots"
import type { GridSlotCell } from "@/lib/schedules/commitment"

interface CounselorScheduleClientProps {
  initialData: CounselorWeeklyGridData
  initialTemplateData?: CounselorTemplateData | null
}

export default function CounselorScheduleClient({
  initialData,
  initialTemplateData,
}: CounselorScheduleClientProps) {
  // Weekly grid data state
  const [data, setData] = React.useState<CounselorWeeklyGridData>(initialData)
  const [currentWeekReference, setCurrentWeekReference] = React.useState<string>(
    initialData.weekDates[0]?.date || new Date().toISOString().split("T")[0]
  )
  const [isLoadingWeek, setIsLoadingWeek] = React.useState<boolean>(false)
  const [togglingKeys, setTogglingKeys] = React.useState<Set<string>>(new Set())

  // Tab State
  const [activeTab, setActiveTab] = React.useState<string>("weekly-calendar")

  // Schedule Mode: manual | automatic
  const [scheduleMode, setScheduleMode] = React.useState<"manual" | "automatic">(
    initialTemplateData?.scheduleMode || initialData.scheduleMode || "manual"
  )
  const [isTogglingMode, setIsTogglingMode] = React.useState<boolean>(false)

  // Template Matrix State (7 days x 7 fixed slots)
  const [templateMatrix, setTemplateMatrix] = React.useState<Record<number, Record<number, boolean>>>(() => {
    if (initialTemplateData?.matrix) {
      return initialTemplateData.matrix
    }
    const defaultMatrix: Record<number, Record<number, boolean>> = {}
    for (let d = 1; d <= 7; d++) {
      defaultMatrix[d] = {}
      for (let s = 1; s <= 7; s++) {
        defaultMatrix[d][s] = false
      }
    }
    return defaultMatrix
  })

  // Track saved state to detect unsaved changes and allow reset
  const [savedMatrix, setSavedMatrix] = React.useState<Record<number, Record<number, boolean>>>(templateMatrix)
  const [isSavingTemplate, setIsSavingTemplate] = React.useState<boolean>(false)

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

  // Active slots count in blueprint template
  const templateActiveCount = React.useMemo(() => {
    let count = 0
    for (let d = 1; d <= 7; d++) {
      for (let s = 1; s <= 7; s++) {
        if (templateMatrix[d]?.[s]) {
          count++
        }
      }
    }
    return count
  }, [templateMatrix])

  // Check if there are unsaved blueprint modifications
  const hasUnsavedChanges = React.useMemo(() => {
    for (let d = 1; d <= 7; d++) {
      for (let s = 1; s <= 7; s++) {
        if (Boolean(templateMatrix[d]?.[s]) !== Boolean(savedMatrix[d]?.[s])) {
          return true
        }
      }
    }
    return false
  }, [templateMatrix, savedMatrix])

  // Navigate weekly calendar
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
        if (res.data.scheduleMode) {
          setScheduleMode(res.data.scheduleMode)
        }
      } else {
        toast.error(res.error || "Gagal memuat jadwal minggu yang dipilih.")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat memuat jadwal.")
    } finally {
      setIsLoadingWeek(false)
    }
  }

  // Toggle Weekly Calendar Slot Availability (Ad-hoc override)
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

  // Toggle Template Cell Optimistically
  const handleToggleTemplateCell = (
    dayOfWeek: number,
    slotIndex: number,
    dayName: string,
    displayTime: string
  ) => {
    const current = Boolean(templateMatrix[dayOfWeek]?.[slotIndex])
    const next = !current

    setTemplateMatrix((prev) => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [slotIndex]: next,
      },
    }))

    if (next) {
      toast.success(`Slot ${dayName} (${displayTime}) diaktifkan`, {
        duration: 1500,
      })
    } else {
      toast.info(`Slot ${dayName} (${displayTime}) dinonaktifkan`, {
        duration: 1500,
      })
    }
  }

  // Reset Template to last saved state
  const handleResetTemplate = () => {
    setTemplateMatrix(savedMatrix)
    toast.info("Perubahan template dikembalikan ke cetak biru tersimpan.")
  }

  // Quick Preset: Weekday Evenings (Senin-Jumat, 19.00-22.00 = 10 slots)
  const handleSelectWeekdayEvenings = () => {
    setTemplateMatrix((prev) => {
      const next = { ...prev }
      for (let d = 1; d <= 5; d++) {
        next[d] = {
          ...next[d],
          6: true,
          7: true,
        }
      }
      return next
    })
    toast.success("Preset diterapkan: Hari Kerja Malam (Senin–Jumat, 10 slot).")
  }

  // Quick Preset: Weekends (Sabtu-Minggu, 5 slots each = 10 slots)
  const handleSelectWeekends = () => {
    setTemplateMatrix((prev) => {
      const next = { ...prev }
      for (let d = 6; d <= 7; d++) {
        next[d] = {
          ...next[d],
          1: true,
          2: true,
          3: true,
          4: true,
          5: true,
        }
      }
      return next
    })
    toast.success("Preset diterapkan: Akhir Pekan Pagi & Siang (Sabtu–Minggu, 10 slot).")
  }

  // Clear all template cells
  const handleClearAllTemplate = () => {
    setTemplateMatrix((prev) => {
      const next: Record<number, Record<number, boolean>> = {}
      for (let d = 1; d <= 7; d++) {
        next[d] = {}
        for (let s = 1; s <= 7; s++) {
          next[d][s] = false
        }
      }
      return next
    })
    toast.info("Semua pilihan slot pada template dikosongkan.")
  }

  // Save Blueprint Template Action
  const handleSaveTemplate = async () => {
    if (scheduleMode === "automatic" && templateActiveCount < 10) {
      toast.error(
        `Mode otomatis membutuhkan minimal 10 slot aktif. Anda saat ini baru memilih ${templateActiveCount} slot.`
      )
      return
    }

    setIsSavingTemplate(true)
    try {
      const slotsPayload: Array<{ dayOfWeek: number; slotIndex: number; isActive: boolean }> = []
      for (let d = 1; d <= 7; d++) {
        for (let s = 1; s <= 7; s++) {
          slotsPayload.push({
            dayOfWeek: d,
            slotIndex: s,
            isActive: Boolean(templateMatrix[d]?.[s]),
          })
        }
      }

      const res = await saveCounselorTemplateAction({
        scheduleMode,
        slots: slotsPayload,
      })

      if (res.success && res.data) {
        setSavedMatrix({ ...templateMatrix })
        setScheduleMode(res.data.scheduleMode)
        setData((prev) => ({
          ...prev,
          scheduleMode: res.data?.scheduleMode,
        }))

        if (res.data.scheduleMode === "automatic") {
          toast.success("Cetak biru template mingguan berhasil disimpan!", {
            description: "Jadwal fisik 4 minggu ke depan telah otomatis disinkronkan ke kalender.",
          })
          // Refresh weekly calendar grid to reflect newly materialized slots
          const refreshRes = await getCounselorWeeklyGridAction(currentWeekReference)
          if (refreshRes.success && refreshRes.data) {
            setData(refreshRes.data)
          }
        } else {
          toast.success("Cetak biru template mingguan berhasil disimpan.")
        }
      } else {
        toast.error(res.error || "Gagal menyimpan template jadwal.")
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menyimpan template.")
    } finally {
      setIsSavingTemplate(false)
    }
  }

  // Toggle Schedule Mode Switch (Manual vs Automatic)
  const handleToggleScheduleMode = async (targetMode: "manual" | "automatic") => {
    if (targetMode === "automatic" && templateActiveCount < 10) {
      toast.warning(
        `Mode otomatis membutuhkan komitmen minimal 10 slot aktif. Anda saat ini memilih ${templateActiveCount} slot. Silakan pilih minimal ${
          10 - templateActiveCount
        } slot lagi sebelum mengaktifkan mode otomatis.`
      )
      return
    }

    setIsTogglingMode(true)
    try {
      // If there are unsaved blueprint modifications, save matrix and mode concurrently
      if (hasUnsavedChanges) {
        const slotsPayload: Array<{ dayOfWeek: number; slotIndex: number; isActive: boolean }> = []
        for (let d = 1; d <= 7; d++) {
          for (let s = 1; s <= 7; s++) {
            slotsPayload.push({
              dayOfWeek: d,
              slotIndex: s,
              isActive: Boolean(templateMatrix[d]?.[s]),
            })
          }
        }
        const res = await saveCounselorTemplateAction({
          scheduleMode: targetMode,
          slots: slotsPayload,
        })
        if (res.success && res.data) {
          setSavedMatrix({ ...templateMatrix })
          setScheduleMode(res.data.scheduleMode)
          setData((prev) => ({
            ...prev,
            scheduleMode: res.data?.scheduleMode,
          }))
          if (res.data.scheduleMode === "automatic") {
            toast.success("Mode otomatis berhasil diaktifkan!", {
              description: "Template disimpan dan kalender 4 minggu ke depan telah disinkronkan.",
            })
            const refreshRes = await getCounselorWeeklyGridAction(currentWeekReference)
            if (refreshRes.success && refreshRes.data) {
              setData(refreshRes.data)
            }
          } else {
            toast.success("Mode jadwal diubah ke manual. Slot kalender tetap dipertahankan.")
          }
        } else {
          toast.error(res.error || "Gagal mengubah mode jadwal.")
        }
      } else {
        const res = await toggleScheduleModeAction({ scheduleMode: targetMode })
        if (res.success && res.data) {
          setScheduleMode(res.data.scheduleMode)
          setData((prev) => ({
            ...prev,
            scheduleMode: res.data?.scheduleMode,
          }))
          if (res.data.scheduleMode === "automatic") {
            toast.success("Mode otomatis berhasil diaktifkan!", {
              description: "Kalender 4 minggu ke depan telah otomatis disinkronkan.",
            })
            const refreshRes = await getCounselorWeeklyGridAction(currentWeekReference)
            if (refreshRes.success && refreshRes.data) {
              setData(refreshRes.data)
            }
          } else {
            toast.success("Mode jadwal diubah ke manual. Slot fisik kalender tetap dipertahankan.")
          }
        } else {
          toast.error(res.error || "Gagal mengubah mode jadwal.")
        }
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat mengubah mode jadwal.")
    } finally {
      setIsTogglingMode(false)
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-20">
        {/* 1. Page Header */}
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
              Kelola jadwal praktik 7 slot harian tetap (08.00–22.00 WIB). Pilih antara pengisian manual
              mingguan atau otomatisasi pola rutin melalui cetak biru template.
            </p>
          </div>
        </div>

        {/* 2. Main Tabs System: Kalender Mingguan vs Template Otomatis */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col gap-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
            <TabsList className="grid grid-cols-2 w-full sm:w-[460px]">
              <TabsTrigger value="weekly-calendar" className="flex items-center gap-2">
                <CalendarIcon className="size-4" data-icon="inline-start" />
                <span>Kalender Mingguan</span>
                {scheduleMode === "automatic" && (
                  <span
                    className="size-2 rounded-full bg-emerald-500 animate-pulse ml-1"
                    title="Mode Otomatis Aktif"
                  />
                )}
              </TabsTrigger>
              <TabsTrigger value="auto-template" className="flex items-center gap-2">
                <Sparkles className="size-4" data-icon="inline-start" />
                <span>Template Otomatis</span>
                <Badge
                  variant={templateActiveCount >= 10 ? "secondary" : "outline"}
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 font-mono ml-1 font-medium",
                    templateActiveCount >= 10
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  )}
                >
                  {templateActiveCount}/10
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Quick Context Actions per Tab */}
            {activeTab === "weekly-calendar" ? (
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
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={handleResetTemplate}
                  disabled={!hasUnsavedChanges || isSavingTemplate}
                  className="flex items-center gap-1.5"
                >
                  <RotateCcw className="size-3.5" data-icon="inline-start" />
                  Reset
                </Button>
                <Button
                  variant="default"
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate || (scheduleMode === "automatic" && templateActiveCount < 10)}
                  className={cn(
                    "flex items-center gap-1.5",
                    scheduleMode === "automatic" && templateActiveCount >= 10 && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  {isSavingTemplate ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" data-icon="inline-start" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" data-icon="inline-start" />
                      Simpan Template
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: KALENDER MINGGUAN (AKTIF)                                          */}
          {/* ========================================================================= */}
          <TabsContent value="weekly-calendar" className="flex flex-col gap-6 m-0">
            {/* Automatic Mode Status Banner / Guide */}
            {scheduleMode === "automatic" ? (
              <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-xs overflow-hidden">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="size-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <Sparkles className="size-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          Sinkronisasi Template Otomatis Aktif
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px]"
                        >
                          Rolling 4 Minggu
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                        Slot kalender ini terisi secara otomatis dari cetak biru template rutin. Perubahan atau
                        klik slot pada kalender minggu ini berfungsi sebagai{" "}
                        <strong className="text-foreground">penyesuaian khusus (override)</strong> untuk minggu
                        berjalan dan tidak akan mengubah cetak biru template utama Anda.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("auto-template")}
                    className="shrink-0 text-xs h-8 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  >
                    Ubah Template Rutin
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/80 bg-muted/20 shadow-xs overflow-hidden">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="size-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <Clock className="size-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          Mode Pengisian Jadwal Manual
                        </span>
                        <Badge variant="outline" className="text-[11px]">
                          Manual Aktif
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                        Anda saat ini mengelola ketersediaan slot secara mandiri dari minggu ke minggu. Ingin
                        kalender Anda otomatis terisi 4 minggu ke depan tanpa repot?
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("auto-template")}
                    className="shrink-0 text-xs h-8"
                  >
                    Buka Template Otomatis
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Weekly Quota Commitment Progress Card */}
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <CardContent className="p-5 md:p-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl font-bold transition-colors shrink-0",
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
                          Target Kuota Minggu Ini: {commitment.activeCount} dari {commitment.target} Slot
                        </h3>
                        {commitment.isMet ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs"
                          >
                            Kuota Terpenuhi
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs"
                          >
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

            {/* Week Navigation & Legend Bar */}
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

            {/* Weekly 7x7 Interactive Matrix */}
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
                        {/* Fixed Slot Header */}
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

                          // Leave State
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

                          // Booked State
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

                          // Reserved Hold State
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

                          // Past Slot State
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

                          // Available (Opened) State
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

                          // Unopened or Cancelled State
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
          </TabsContent>

          {/* ========================================================================= */}
          {/* TAB 2: TEMPLATE OTOMATIS (RUTIN)                                          */}
          {/* ========================================================================= */}
          <TabsContent value="auto-template" className="flex flex-col gap-6 m-0">
            {/* Template Header & Explanatory Subtitle */}
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-foreground">
                Cetak Biru Template Mingguan (7 Hari × 7 Slot)
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
                Tentukan pola ketersediaan rutin Anda untuk hari Senin hingga Minggu pada 7 Slot Harian Tetap
                (08.00–22.00 WIB). Saat Mode Otomatis diaktifkan, sistem secara rutin mereplikasi cetak biru ini
                ke kalender fisik untuk 4 minggu ke depan.
              </p>
            </div>

            {/* Quota Commitment & Automation Switch Card */}
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <CardContent className="p-5 md:p-6 flex flex-col gap-5">
                {/* Switch Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl font-bold transition-colors shrink-0",
                        scheduleMode === "automatic"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {scheduleMode === "automatic" ? (
                        <Sparkles className="size-5" />
                      ) : (
                        <Clock className="size-5" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">
                          Mode Pengisian Otomatis (Rolling 4 Minggu)
                        </h3>
                        <Badge
                          variant={scheduleMode === "automatic" ? "secondary" : "outline"}
                          className={cn(
                            "text-xs font-medium",
                            scheduleMode === "automatic"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "text-muted-foreground"
                          )}
                        >
                          {scheduleMode === "automatic" ? "Otomatis Aktif" : "Manual (Nonaktif)"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {scheduleMode === "automatic"
                          ? "Sistem secara otomatis mengisi slot praktik di kalender fisik untuk 4 minggu ke depan berdasarkan cetak biru ini."
                          : "Aktifkan agar ketersediaan praktik Anda terisi secara otomatis tanpa perlu membuka slot mingguan secara manual."}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0 bg-muted/40 px-3.5 py-2 rounded-lg border border-border/60">
                    <label
                      htmlFor="schedule-mode-switch"
                      className="text-xs font-medium cursor-pointer text-foreground select-none"
                    >
                      {scheduleMode === "automatic" ? "Mode Otomatis" : "Mode Manual"}
                    </label>
                    <Switch
                      id="schedule-mode-switch"
                      checked={scheduleMode === "automatic"}
                      onCheckedChange={(checked) => handleToggleScheduleMode(checked ? "automatic" : "manual")}
                      disabled={isTogglingMode || isSavingTemplate}
                      aria-label="Toggle Mode Otomatis"
                    />
                  </div>
                </div>

                {/* Quota Progress (10 Slots Minimal Target) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl font-bold transition-colors shrink-0",
                        templateActiveCount >= 10
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {templateActiveCount >= 10 ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        <AlertCircle className="size-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-foreground">
                          Target Kuota Komitmen: {templateActiveCount} dari 10 Slot Terpilih
                        </h4>
                        {templateActiveCount >= 10 ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs"
                          >
                            Komitmen Terpenuhi
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs"
                          >
                            Kurang {10 - templateActiveCount} Slot
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {templateActiveCount >= 10
                          ? "Hebat! Cetak biru rutin Anda telah memenuhi standar komitmen minimal platform (≥ 10 slot)."
                          : `Pilih minimal ${10 - templateActiveCount} slot lagi untuk memenuhi syarat pengaktifan mode otomatis.`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                      {Math.min(100, Math.round((templateActiveCount / 10) * 100))}%
                    </span>
                    <span className="text-xs text-muted-foreground block">Komitmen Target</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1.5">
                  <Progress
                    value={Math.min(100, Math.round((templateActiveCount / 10) * 100))}
                    className={cn(
                      "h-2.5 rounded-full transition-all",
                      templateActiveCount >= 10 ? "[&>div]:bg-emerald-600" : "[&>div]:bg-amber-500"
                    )}
                  />
                </div>

                {/* Warning Alert if Automatic Mode is Active but Slot Count < 10 */}
                {scheduleMode === "automatic" && templateActiveCount < 10 && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertCircle className="size-4" />
                    <AlertTitle className="text-xs font-semibold">Komitmen Belum Terpenuhi</AlertTitle>
                    <AlertDescription className="text-xs">
                      Mode otomatis aktif membutuhkan minimal 10 slot rutin per minggu. Tombol Simpan dinonaktifkan
                      hingga Anda memilih minimal {10 - templateActiveCount} slot lagi atau menonaktifkan mode otomatis.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Clarification Guidelines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground border-t border-border/60">
                  <div className="flex items-start gap-2">
                    <Info className="size-4 shrink-0 text-primary mt-0.5" />
                    <span>
                      <strong>Pola Mingguan Generik:</strong> Template berlaku setiap minggu (Senin s/d Minggu)
                      pada 7 slot waktu tetap tanpa terikat tanggal kalender tertentu.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                    <span>
                      <strong>Proteksi Pemesanan & Cuti:</strong> Perubahan template tidak akan pernah menghapus
                      sesi klien yang sudah terpesan (status <em>booked/reserved</em>) dan tanggal cuti tetap dihormati.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions & Legend Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border border-border/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-foreground">Preset Cepat:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectWeekdayEvenings}
                  className="text-xs h-7 px-2.5"
                >
                  Hari Kerja Malam (Sen–Jum 19.00–22.00)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectWeekends}
                  className="text-xs h-7 px-2.5"
                >
                  Akhir Pekan (Sab–Min Pagi & Siang)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllTemplate}
                  disabled={templateActiveCount === 0}
                  className="text-xs h-7 px-2.5 text-muted-foreground hover:text-destructive"
                >
                  Kosongkan Semua
                </Button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm bg-emerald-500/20 border border-emerald-500/40" />
                  <span>Slot Rutin Aktif</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm bg-background border border-dashed border-border" />
                  <span>Nonaktif (Klik Buka)</span>
                </div>
              </div>
            </div>

            {/* The 7x7 Interactive Blueprint Matrix */}
            <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="p-3.5 text-xs font-semibold text-muted-foreground w-44 sticky left-0 bg-muted/90 backdrop-blur-xs z-10 border-r border-border">
                        Slot Waktu (WIB)
                      </th>
                      {TEMPLATE_DAYS.map((day) => {
                        let dayActiveCount = 0
                        for (let s = 1; s <= 7; s++) {
                          if (templateMatrix[day.dayOfWeek]?.[s]) dayActiveCount++
                        }
                        return (
                          <th key={day.dayOfWeek} className="p-3.5 text-center border-r border-border/60 last:border-r-0">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                                {day.dayName}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1.5 py-0 h-4 font-mono font-normal",
                                  dayActiveCount > 0
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : "text-muted-foreground"
                                )}
                              >
                                {dayActiveCount} slot
                              </Badge>
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {fixedSlots.map((slot) => (
                      <tr key={slot.slotIndex} className="hover:bg-muted/15 transition-colors">
                        <td className="p-3.5 text-xs sticky left-0 bg-card/95 backdrop-blur-xs z-10 border-r border-border font-medium text-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">Slot {slot.slotIndex}</span>
                            <span className="font-mono text-muted-foreground text-[11px]">{slot.displayTime}</span>
                          </div>
                        </td>
                        {TEMPLATE_DAYS.map((day) => {
                          const isActive = Boolean(templateMatrix[day.dayOfWeek]?.[slot.slotIndex])
                          return (
                            <td key={day.dayOfWeek} className="p-2 border-r border-border/40 last:border-r-0">
                              <button
                                type="button"
                                onClick={() => handleToggleTemplateCell(day.dayOfWeek, slot.slotIndex, day.dayName, slot.displayTime)}
                                aria-pressed={isActive}
                                className={cn(
                                  "w-full h-16 rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 select-none",
                                  isActive
                                    ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-xs hover:bg-emerald-500/25 hover:border-emerald-500/60"
                                    : "bg-background/60 border border-dashed border-border/80 text-muted-foreground hover:bg-muted/50 hover:border-foreground/30 hover:text-foreground"
                                )}
                              >
                                {isActive ? (
                                  <>
                                    <div className="flex items-center gap-1 font-semibold">
                                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>Aktif</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                                      {slot.startTime}–{slot.endTime}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Plus className="size-3 shrink-0" />
                                      <span className="text-[11px]">Buka</span>
                                    </div>
                                    <span className="font-mono text-[10px] text-muted-foreground/70">
                                      Tutup
                                    </span>
                                  </>
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="sticky bottom-4 z-20 bg-background/95 backdrop-blur-md p-4 rounded-xl border border-border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {hasUnsavedChanges ? (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Perubahan template belum disimpan</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span>Template tersimpan di sistem</span>
                  </div>
                )}
                <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                <span className="text-xs text-muted-foreground">
                  Total: <strong className="text-foreground">{templateActiveCount}</strong> slot aktif
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetTemplate}
                  disabled={!hasUnsavedChanges || isSavingTemplate}
                  className="flex items-center gap-1.5"
                >
                  <RotateCcw className="size-3.5" data-icon="inline-start" />
                  Reset Perubahan
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleSaveTemplate}
                        disabled={isSavingTemplate || (scheduleMode === "automatic" && templateActiveCount < 10)}
                        className={cn(
                          "flex items-center gap-2 min-w-[140px]",
                          scheduleMode === "automatic" && templateActiveCount >= 10 && "bg-emerald-600 hover:bg-emerald-700 text-white"
                        )}
                      >
                        {isSavingTemplate ? (
                          <>
                            <RefreshCw className="size-3.5 animate-spin" data-icon="inline-start" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="size-3.5" data-icon="inline-start" />
                            Simpan Template
                          </>
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {scheduleMode === "automatic" && templateActiveCount < 10 && (
                    <TooltipContent>
                      <p className="text-xs">Mode otomatis aktif membutuhkan minimal 10 slot terpilih.</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 3. Leave Request Dialog (Global) */}
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
