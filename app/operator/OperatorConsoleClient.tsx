"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Copy,
  Check,
  Users,
  Video,
  Calendar,
  Clock,
  RefreshCw,
  MessageSquare,
  Split,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Phone,
  UserCheck,
  Sparkles,
  Layers,
  BookOpen,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"

import type {
  OperatorMatrixResponse,
  OperatorSlotData,
  OperatorParticipantSession,
} from "@/lib/operator/types"
import {
  formatBreakoutRoomName,
  generateBatchBreakoutNames,
  generateWaitingRoomChatTemplate,
  getTodayWibDateString,
} from "@/lib/operator/dispatcher"
import {
  getOperatorSlotMatrixAction,
  admitParticipantAction,
  unadmitParticipantAction,
} from "./actions"

interface OperatorConsoleClientProps {
  initialData: OperatorMatrixResponse
}

export function OperatorConsoleClient({ initialData }: OperatorConsoleClientProps) {
  const router = useRouter()
  const [data, setData] = React.useState<OperatorMatrixResponse>(initialData)
  const [selectedDate, setSelectedDate] = React.useState<string>(initialData.date)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [admittingIds, setAdmittingIds] = React.useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)

  // Expanded slots state: by default, slots with sessions or active slot are expanded
  const [expandedSlots, setExpandedSlots] = React.useState<Record<number, boolean>>(() => {
    const initialExpanded: Record<number, boolean> = {}
    initialData.slots.forEach((s) => {
      // Expand if it has sessions or is current
      initialExpanded[s.slotIndex] = s.sessionCount > 0 || s.isCurrent
    })
    return initialExpanded
  })

  // Modal states
  const [activeChatModal, setActiveChatModal] = React.useState<{
    isOpen: boolean
    patientName?: string
    bookingCode?: string
    counselorName?: string
  }>({ isOpen: false })

  const [activeBatchModal, setActiveBatchModal] = React.useState<{
    isOpen: boolean
    slotIndex: number
    slotLabel: string
    sessions: OperatorParticipantSession[]
  }>({
    isOpen: false,
    slotIndex: 1,
    slotLabel: "",
    sessions: [],
  })

  const [isSopGuideOpen, setIsSopGuideOpen] = React.useState<boolean>(false)

  // Handle Date Change
  const handleDateChange = async (newDate: string) => {
    if (!newDate || newDate === selectedDate) return
    setIsLoading(true)
    setSelectedDate(newDate)
    try {
      const result = await getOperatorSlotMatrixAction(newDate)
      setData(result)
      // Update expanded slots for new date
      const nextExpanded: Record<number, boolean> = {}
      result.slots.forEach((s) => {
        nextExpanded[s.slotIndex] = s.sessionCount > 0 || s.isCurrent
      })
      setExpandedSlots(nextExpanded)
      toast.success(`Memuat matriks slot tanggal ${result.formattedDate}`)
    } catch {
      toast.error("Gagal memuat jadwal tanggal terpilih")
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh current data
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const result = await getOperatorSlotMatrixAction(selectedDate)
      setData(result)
      toast.success("Matriks slot diperbarui")
    } catch {
      toast.error("Gagal memperbarui data")
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle slot expansion
  const toggleSlot = (slotIndex: number) => {
    setExpandedSlots((prev) => ({
      ...prev,
      [slotIndex]: !prev[slotIndex],
    }))
  }

  // 1-Click Clipboard Copy with Feedback
  const handleCopy = (text: string, key: string, label: string = "Teks") => {
    if (!navigator?.clipboard) {
      toast.error("Clipboard browser tidak tersedia")
      return
    }
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} disalin ke clipboard!`)
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr))
    }, 2000)
  }

  // Admit participant action
  const handleAdmit = async (bookingId: string) => {
    setAdmittingIds((prev) => new Set(prev).add(bookingId))

    // Optimistic UI update
    const previousData = data
    setData((curr) => {
      const nowIso = new Date().toISOString()
      const nextSlots = curr.slots.map((slot) => ({
        ...slot,
        sessions: slot.sessions.map((s) =>
          s.bookingId === bookingId ? { ...s, operatorAdmittedAt: nowIso } : s
        ),
      }))

      let admitted = 0
      let pending = 0
      nextSlots.forEach((slot) => {
        slot.sessions.forEach((s) => {
          if (s.operatorAdmittedAt) admitted++
          else if (s.zoomAllocationMode === "breakout_room") pending++
        })
      })

      return {
        ...curr,
        summary: {
          ...curr.summary,
          totalAdmitted: admitted,
          totalPendingAdmit: pending,
        },
        slots: nextSlots,
      }
    })

    try {
      const res = await admitParticipantAction({ bookingId })
      if (!res.success) {
        throw new Error(res.error || "Gagal admit peserta")
      }
      toast.success("Peserta berhasil ditandai masuk (Admitted)")
      router.refresh()
    } catch (err: any) {
      // Revert optimistic update
      setData(previousData)
      toast.error(err.message || "Gagal melakukan aksi admit")
    } finally {
      setAdmittingIds((prev) => {
        const next = new Set(prev)
        next.delete(bookingId)
        return next
      })
    }
  }

  // Undo admit action
  const handleUnadmit = async (bookingId: string) => {
    setAdmittingIds((prev) => new Set(prev).add(bookingId))

    try {
      const res = await unadmitParticipantAction({ bookingId })
      if (!res.success) {
        throw new Error(res.error || "Gagal membatalkan admit")
      }

      setData((curr) => {
        const nextSlots = curr.slots.map((slot) => ({
          ...slot,
          sessions: slot.sessions.map((s) =>
            s.bookingId === bookingId ? { ...s, operatorAdmittedAt: null } : s
          ),
        }))

        let admitted = 0
        let pending = 0
        nextSlots.forEach((slot) => {
          slot.sessions.forEach((s) => {
            if (s.operatorAdmittedAt) admitted++
            else if (s.zoomAllocationMode === "breakout_room") pending++
          })
        })

        return {
          ...curr,
          summary: {
            ...curr.summary,
            totalAdmitted: admitted,
            totalPendingAdmit: pending,
          },
          slots: nextSlots,
        }
      })

      toast.info("Status admit dibatalkan")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan status admit")
    } finally {
      setAdmittingIds((prev) => {
        const next = new Set(prev)
        next.delete(bookingId)
        return next
      })
    }
  }

  const todayWib = getTodayWibDateString()
  const isToday = selectedDate === todayWib

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
        {/* =========================================================================
            1. TOP BAR: DATE NAVIGATION & ACTION CONTROLS
           ========================================================================= */}
        <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:p-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Matriks Slot & Dispatcher Zoom
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.formattedDate} &bull; 7 Slot Tetap (08.00–22.00 WIB)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Selector Shortcuts */}
            <div className="flex items-center rounded-lg border bg-muted/50 p-1">
              <Button
                variant={isToday ? "default" : "ghost"}
                size="sm"
                onClick={() => handleDateChange(todayWib)}
                className="h-8 text-xs font-medium"
              >
                Hari Ini
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() - 1)
                  handleDateChange(d.toISOString().split("T")[0])
                }}
                className="h-8 text-xs font-medium"
              >
                H-1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() + 1)
                  handleDateChange(d.toISOString().split("T")[0])
                }}
                className="h-8 text-xs font-medium"
              >
                H+1
              </Button>
            </div>

            {/* Custom Date Picker Input */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Pilih tanggal matriks"
            />

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-9 gap-1.5 text-xs"
              title="Perbarui data matriks"
            >
              <RefreshCw
                className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
                data-icon="inline-start"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* SOP Guide Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSopGuideOpen(true)}
              className="h-9 gap-1.5 text-xs"
            >
              <BookOpen className="size-3.5 text-primary" data-icon="inline-start" />
              <span>Panduan SOP</span>
            </Button>
          </div>
        </div>

        {/* =========================================================================
            2. OPERATIONAL SUMMARY KPI CARDS
           ========================================================================= */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {/* Card 1: Total Sesi Hari Ini */}
          <Card className="shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-medium">
                <span>Total Sesi Terjadwal</span>
                <Users className="size-4 text-muted-foreground" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">
                {data.summary.totalSessions}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">
                Pada tanggal {selectedDate}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Slot Aktif Saat Ini */}
          <Card className="shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-medium">
                <span>Slot Aktif Sekarang</span>
                <Clock className="size-4 text-emerald-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-foreground">
                {data.summary.currentSlotIndex ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Slot {data.summary.currentSlotIndex}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-lg">Off-Slot</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">
                {data.summary.currentSlotIndex
                  ? `${data.slots[data.summary.currentSlotIndex - 1]?.displayTime}`
                  : "Di luar jam operasional (08–22 WIB)"}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Slot Mode Breakout */}
          <Card className="shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-medium">
                <span>Slot Mode Breakout</span>
                <Layers className="size-4 text-amber-500" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">
                {data.summary.breakoutSlotsCount}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  / 7 slot
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">
                {data.summary.breakoutSlotsCount > 0
                  ? "Butuh pemanduan Host di Zoom 4"
                  : "Semua slot Standalone"}
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Status Kehadiran Klien */}
          <Card className="shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-medium">
                <span>Kehadiran (Admit)</span>
                <UserCheck className="size-4 text-primary" />
              </CardDescription>
              <CardTitle className="text-2xl font-bold">
                {data.summary.totalAdmitted}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  / {data.summary.totalSessions} masuk
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-xs text-muted-foreground">
                {data.summary.totalPendingAdmit > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {data.summary.totalPendingAdmit} peserta belum diadmit
                  </span>
                ) : data.summary.totalSessions > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Semua peserta telah masuk
                  </span>
                ) : (
                  "Tidak ada antrean"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* =========================================================================
            3. QUICK TOOLS STRIP (GLOBAL CHAT TEMPLATE & NOTICES)
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">SOP Waiting Room:</strong> Peserta di Zoom 4 wajib memiliki nama tampilan <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">[Kode Booking] - [Nama Klien]</code> sebelum di-admit ke Breakout Room.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setActiveChatModal({
                  isOpen: true,
                })
              }
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <MessageSquare className="size-3.5" data-icon="inline-start" />
              <span>Salin Template Chat (Umum)</span>
            </Button>
          </div>
        </div>

        {/* =========================================================================
            4. 7 FIXED SLOTS MATRIX ACCORDION / CARDS
           ========================================================================= */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Daftar 7 Slot Harian
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Standalone (≤4 Sesi)</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Breakout (&gt;4 Sesi)</span>
              </span>
            </div>
          </div>

          {data.slots.map((slot) => {
            const isExpanded = Boolean(expandedSlots[slot.slotIndex])
            const isBreakout = slot.mode === "breakout_room"
            const breakoutSessions = slot.sessions.filter(
              (s) => s.zoomAllocationMode === "breakout_room"
            )

            return (
              <Card
                key={slot.slotIndex}
                className={`transition-all overflow-hidden border ${
                  slot.isCurrent
                    ? "ring-2 ring-primary border-primary shadow-sm"
                    : "shadow-xs"
                }`}
              >
                {/* Slot Card Header */}
                <div
                  className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer select-none transition-colors ${
                    slot.isCurrent
                      ? "bg-primary/5"
                      : isBreakout
                        ? "bg-amber-50/50 dark:bg-amber-950/10"
                        : "bg-card hover:bg-muted/30"
                  }`}
                  onClick={() => toggleSlot(slot.slotIndex)}
                >
                  {/* Left: Slot Title, Time, & Live Badge */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-md bg-muted font-bold text-xs">
                      #{slot.slotIndex}
                    </span>

                    <span className="font-semibold text-base text-foreground">
                      {slot.displayTime}
                    </span>

                    {/* Active slot pulse */}
                    {slot.isCurrent && (
                      <Badge className="bg-emerald-600 text-white font-medium gap-1 text-[11px] py-0.5">
                        <span className="size-1.5 rounded-full bg-white animate-ping" />
                        Aktif Sekarang
                      </Badge>
                    )}

                    {slot.isPast && !slot.isCurrent && (
                      <Badge variant="outline" className="text-muted-foreground text-[11px]">
                        Slot Selesai
                      </Badge>
                    )}

                    {/* Mode Badge: Standalone Mode vs Zoom 4 Breakout Mode */}
                    {isBreakout ? (
                      <Badge
                        variant="default"
                        className="bg-amber-600 hover:bg-amber-600 text-white gap-1.5 text-xs py-0.5 font-medium shadow-2xs"
                      >
                        <Split className="size-3.5" />
                        <span>Zoom 4 Breakout Mode</span>
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border gap-1.5 text-xs py-0.5 font-medium"
                      >
                        <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Standalone Mode (Zoom 1-4)</span>
                      </Badge>
                    )}
                  </div>

                  {/* Right: Quota Count, Batch Copy & Toggle */}
                  <div
                    className="flex items-center gap-2 sm:gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Live session quota indicator */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <span className="font-bold text-foreground">
                          {slot.sessionCount}
                        </span>
                        <span className="text-muted-foreground">
                          / {slot.maxQuota} Sesi
                        </span>
                      </div>
                      <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            isBreakout ? "bg-amber-500" : "bg-primary"
                          }`}
                          style={{
                            width: `${Math.min(
                              (slot.sessionCount / slot.maxQuota) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Batch Copy Button: Copies all room names for this slot */}
                    {slot.sessionCount > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const targetSessions =
                                isBreakout && breakoutSessions.length > 0
                                  ? breakoutSessions
                                  : slot.sessions
                              const batchString = generateBatchBreakoutNames(targetSessions)
                              handleCopy(
                                batchString,
                                `batch-${slot.slotIndex}`,
                                `Batch ${targetSessions.length} nama breakout slot ${slot.slotIndex}`
                              )
                            }}
                            className="h-8 gap-1.5 text-xs font-medium"
                          >
                            {copiedKey === `batch-${slot.slotIndex}` ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5 text-muted-foreground" />
                            )}
                            <span className="hidden md:inline">
                              Salin Batch Nama Breakout
                            </span>
                            <span className="md:hidden">Salin Batch</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Salin seluruh nama ruang breakout slot ini sekaligus
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Expand/Collapse Chevron */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSlot(slot.slotIndex)}
                      className="size-8 p-0"
                      aria-label={isExpanded ? "Tutup detail slot" : "Buka detail slot"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Slot Card Body (Sessions Table) */}
                {isExpanded && (
                  <div className="border-t bg-card">
                    {slot.sessionCount === 0 ? (
                      <div className="p-6">
                        <Empty className="py-8">
                          <EmptyMedia variant="icon">
                            <Clock className="size-5 text-muted-foreground" />
                          </EmptyMedia>
                          <EmptyHeader>
                            <EmptyTitle className="text-base">
                              Tidak Ada Sesi Terjadwal
                            </EmptyTitle>
                            <EmptyDescription>
                              Belum ada klien yang terkonfirmasi pada slot {slot.displayTime}. Kuota tersisa {slot.maxQuota} sesi.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs">
                              <TableHead className="w-28 font-semibold">
                                Kode Sesi
                              </TableHead>
                              <TableHead className="min-w-[140px] font-semibold">
                                Pasien / Klien
                              </TableHead>
                              <TableHead className="min-w-[150px] font-semibold">
                                Mitra Konselor
                              </TableHead>
                              <TableHead className="min-w-[160px] font-semibold">
                                Alokasi Zoom
                              </TableHead>
                              <TableHead className="min-w-[220px] font-semibold">
                                Nama Ruang Breakout
                              </TableHead>
                              <TableHead className="min-w-[140px] text-center font-semibold">
                                Status Kehadiran
                              </TableHead>
                              <TableHead className="w-32 text-right font-semibold">
                                Aksi Operator
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {slot.sessions.map((session, sIdx) => {
                              const isAdmitted = Boolean(
                                session.operatorAdmittedAt
                              )
                              const isSessionBreakout =
                                session.zoomAllocationMode === "breakout_room"
                              const isAdmitting = admittingIds.has(
                                session.bookingId
                              )
                              const copyKey = `room-${session.bookingId}`
                              const isCopied = copiedKey === copyKey

                              const admittedTimeStr = session.operatorAdmittedAt
                                ? new Date(
                                    session.operatorAdmittedAt
                                  ).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  }) + " WIB"
                                : null

                              return (
                                <TableRow
                                  key={session.bookingId}
                                  className={`text-xs transition-colors ${
                                    isAdmitted
                                      ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                                      : "hover:bg-muted/30"
                                  }`}
                                >
                                  {/* 1. Booking Code */}
                                  <TableCell className="font-mono font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-foreground">
                                        {session.bookingCode}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCopy(
                                            session.bookingCode,
                                            `code-${session.bookingId}`,
                                            "Kode Booking"
                                          )
                                        }
                                        className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                                        title="Salin Kode Booking"
                                      >
                                        {copiedKey ===
                                        `code-${session.bookingId}` ? (
                                          <Check className="size-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="size-3" />
                                        )}
                                      </button>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block">
                                      Urutan #{sIdx + 1}
                                    </span>
                                  </TableCell>

                                  {/* 2. Client Name & Quick WA Link */}
                                  <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold text-foreground text-sm">
                                        {session.patientName}
                                      </span>
                                      {session.patientPhone && (
                                        <a
                                          href={`https://wa.me/${session.patientPhone.replace(
                                            /\D/g,
                                            ""
                                          )}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-emerald-600 transition-colors"
                                          title="Buka WhatsApp Klien"
                                        >
                                          <Phone className="size-3 text-emerald-500" />
                                          <span>{session.patientPhone}</span>
                                        </a>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* 3. Counselor */}
                                  <TableCell>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-medium text-foreground">
                                        {session.counselorName}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] py-0 px-1 font-normal text-muted-foreground"
                                        >
                                          {session.counselorTitle ||
                                            (session.counselorType ===
                                            "psychologist"
                                              ? "Psikolog"
                                              : "Sebaya")}
                                        </Badge>
                                      </div>
                                    </div>
                                  </TableCell>

                                  {/* 4. Zoom Allocation */}
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      {isSessionBreakout ? (
                                        <Badge
                                          variant="default"
                                          className="bg-amber-600 text-white font-medium text-[11px] gap-1 py-0.5 w-fit"
                                        >
                                          <Split className="size-3" />
                                          <span>Zoom 4 (Breakout)</span>
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="secondary"
                                          className="text-[11px] font-medium gap-1 py-0.5 w-fit"
                                        >
                                          <Video className="size-3 text-emerald-500" />
                                          <span>
                                            Zoom {session.zoomAccountNumber} (Mandiri)
                                          </span>
                                        </Badge>
                                      )}

                                      {/* Zoom Join Url link for operator if needed */}
                                      {session.zoomJoinUrl && (
                                        <a
                                          href={session.zoomJoinUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                          <span>Masuk Ruang Meeting</span>
                                        </a>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* 5. Breakout Room Name + 1-Click Copy */}
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <code className="rounded bg-muted px-2 py-1 font-mono text-xs font-semibold text-foreground border">
                                        {session.breakoutRoomName}
                                      </code>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleCopy(
                                                session.breakoutRoomName,
                                                copyKey,
                                                `Nama Ruang ${session.breakoutRoomName}`
                                              )
                                            }
                                            className="size-7 p-0 shrink-0"
                                            aria-label={`Salin nama ruang breakout ${session.breakoutRoomName}`}
                                          >
                                            {isCopied ? (
                                              <Check className="size-3.5 text-emerald-600" />
                                            ) : (
                                              <Copy className="size-3.5 text-muted-foreground" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          1-Click Salin: {session.breakoutRoomName}
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </TableCell>

                                  {/* 6. Attendance Status */}
                                  <TableCell className="text-center">
                                    {isAdmitted ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <Badge
                                          variant="outline"
                                          className="border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 gap-1 font-medium text-[11px] py-0.5"
                                        >
                                          <UserCheck className="size-3" />
                                          <span>{isSessionBreakout ? "Telah Masuk" : "Klien Masuk (Auto)"}</span>
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                          {admittedTimeStr}
                                        </span>
                                      </div>
                                    ) : isSessionBreakout ? (
                                      <Badge
                                        variant="outline"
                                        className="text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/10 text-[11px] py-0.5 font-medium"
                                      >
                                        Menunggu Admit
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="secondary"
                                        className="text-muted-foreground border-dashed text-[11px] py-0.5 bg-muted/40 font-normal"
                                      >
                                        Sesi Private (Timer)
                                      </Badge>
                                    )}
                                  </TableCell>

                                  {/* 7. Operator Actions */}
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Individual Chat Template guidance */}
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              setActiveChatModal({
                                                isOpen: true,
                                                patientName: session.patientName,
                                                bookingCode: session.bookingCode,
                                                counselorName: session.counselorName,
                                              })
                                            }
                                            className="size-7 p-0 text-muted-foreground hover:text-foreground"
                                            aria-label={`Template chat rename untuk ${session.patientName}`}
                                          >
                                            <MessageSquare className="size-3.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Template Chat Rename Waiting Room
                                        </TooltipContent>
                                      </Tooltip>

                                      {/* Admit or Undo Button: Breakout Room only */}
                                      {isSessionBreakout ? (
                                        isAdmitted ? (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleUnadmit(session.bookingId)
                                            }
                                            disabled={isAdmitting}
                                            className="h-7 text-[11px] text-muted-foreground hover:text-destructive px-2"
                                          >
                                            Batal
                                          </Button>
                                        ) : (
                                          <Button
                                            type="button"
                                            variant="default"
                                            size="sm"
                                            onClick={() =>
                                              handleAdmit(session.bookingId)
                                            }
                                            disabled={isAdmitting}
                                            className="h-7 text-xs font-semibold px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                          >
                                            {isAdmitting ? (
                                              <RefreshCw className="size-3 animate-spin" />
                                            ) : (
                                              <UserCheck className="size-3" />
                                            )}
                                            <span>Admit</span>
                                          </Button>
                                        )
                                      ) : (
                                        <span
                                          className="text-[10px] text-muted-foreground font-medium px-2 py-1 rounded bg-muted/50 border border-border/60"
                                          title="Sesi Zoom private otomatis ditandai hadir saat konselor memulai timer."
                                        >
                                          {isAdmitted ? "Auto-Admit Konselor" : "Private (Konselor)"}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* =========================================================================
            5. WAITING ROOM CHAT TEMPLATE MODAL
           ========================================================================= */}
        <Dialog
          open={activeChatModal.isOpen}
          onOpenChange={(open) =>
            setActiveChatModal((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                <span>Pesan Panduan Waiting Room Zoom</span>
              </DialogTitle>
              <DialogDescription>
                Salin teks panduan ini ke private chat Zoom atau WhatsApp untuk mengarahkan klien yang belum mengganti nama tampilannya.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2">
              <div className="rounded-lg border bg-muted/60 p-3.5 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap select-all">
                {generateWaitingRoomChatTemplate({
                  patientName: activeChatModal.patientName,
                  bookingCode: activeChatModal.bookingCode,
                  counselorName: activeChatModal.counselorName,
                })}
              </div>

              {activeChatModal.patientName && (
                <p className="text-[11px] text-muted-foreground">
                  Format otomatis disesuaikan untuk klien:{" "}
                  <strong>{activeChatModal.patientName}</strong> (
                  {activeChatModal.bookingCode})
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setActiveChatModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                Tutup
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const templateText = generateWaitingRoomChatTemplate({
                    patientName: activeChatModal.patientName,
                    bookingCode: activeChatModal.bookingCode,
                    counselorName: activeChatModal.counselorName,
                  })
                  handleCopy(templateText, "modal-chat", "Pesan template chat")
                }}
                className="gap-1.5"
              >
                {copiedKey === "modal-chat" ? (
                  <Check className="size-3.5 text-white" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>Salin Pesan ke Clipboard</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* =========================================================================
            6. OPERATOR SOP MASTER REFERENCE MODAL
           ========================================================================= */}
        <Dialog open={isSopGuideOpen} onOpenChange={setIsSopGuideOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <span>Master SOP: Dispatcher 4 Akun Zoom & Breakout Rooms</span>
              </DialogTitle>
              <DialogDescription>
                Pedoman operasional klinik Solulu untuk pengelolaan 7 slot harian dan koordinasi ruang rapat.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 text-xs leading-relaxed py-2">
              <div className="rounded-lg border bg-muted/40 p-3.5 flex flex-col gap-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  1. Standalone Mode (Total Sesi per Slot &le; 4)
                </h4>
                <p className="text-muted-foreground">
                  - Sesi 1 s/d 3 menggunakan Akun Zoom 1, 2, dan 3 secara mandiri.
                  <br />
                  - Sesi 4 (jika total slot &le; 4) menggunakan Akun Zoom 4 secara mandiri.
                  <br />
                  - Fitur <strong>Join Before Host</strong> aktif. Mitra konselor memegang 6-digit Host Key untuk mengklaim kontrol host tanpa bantuan operator.
                  <br />
                  - Operator hanya melakukan monitoring pasif.
                </p>
              </div>

              <div className="rounded-lg border bg-amber-500/10 border-amber-500/20 p-3.5 flex flex-col gap-2">
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Split className="size-4 text-amber-600" />
                  2. Breakout Mode (Total Sesi per Slot &gt; 4)
                </h4>
                <p className="text-muted-foreground">
                  - Sesi 1 s/d 3 tetap berjalan mandiri di Akun Zoom 1, 2, dan 3.
                  <br />
                  - <strong>Sesi 4 hingga 10 dialokasikan ke Akun Zoom 4</strong> dalam mode Breakout Room terpandu.
                  <br />
                  - <strong>Operator bertindak sebagai Host di Zoom 4:</strong>
                  <br />
                  &nbsp;&nbsp;a. Membuka rapat utama Zoom 4 sebelum slot dimulai.
                  <br />
                  &nbsp;&nbsp;b. Membuat Breakout Room privat dengan menekan tombol <strong>Salin Batch Nama Breakout</strong>. Format: <code className="font-mono bg-muted px-1">[Kode Booking] - [Nama Konselor]</code>.
                  <br />
                  &nbsp;&nbsp;c. Menjaga <em>Waiting Room</em>: Jika klien masuk dengan nama bawaan ponsel, kirim Template Chat Rename.
                  <br />
                  &nbsp;&nbsp;d. Setelah nama sesuai, <strong>Admit 1-on-1</strong> dan pindahkan peserta langsung ke Breakout Room konselornya agar privasi antar klien terjaga.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/40 p-3.5 flex flex-col gap-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <AlertCircle className="size-4 text-primary" />
                  3. Batasan Hak Akses & Privasi Medis
                </h4>
                <p className="text-muted-foreground">
                  Operator klinik <strong>dilarang keras</strong> mengakses catatan rekam medis klinis (*session reports*) maupun transaksi finansial. Konsol ini sepenuhnya terisolasi pada koordinasi logistik dan status kehadiran peserta.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsSopGuideOpen(false)}
              >
                Saya Mengerti
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
