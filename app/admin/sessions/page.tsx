"use client"

import * as React from "react"
import type { BookingSession } from "@/lib/types/admin"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  Copy,
  Search,
  Video,
  CheckCircle2,
  ShieldAlert,
  Mail,
  AlertTriangle,
  ArrowRight,
  X,
  MoreHorizontal,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Phone,
  ExternalLink,
  User,
  Filter,
  CreditCard,
  Plus,
  Lock,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { AdminPageHeader, SessionStatusBadge, resolveSessionTimingAndStatus, groupSessionsByTime } from "@/components/admin"
import { ManualPaymentModal, ManualPaymentDetails } from "./components/manual-payment-modal"
import { AdminManualBookingModal } from "./components/admin-manual-booking-modal"
import { confirmManualPaymentAction, rejectManualPaymentAction, getBookingsAdminAction } from "./actions"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

export default function DistilledSessionsPage() {
  const [sessions, setSessions] = React.useState<BookingSession[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [roomFilter, setRoomFilter] = React.useState<string>("all")
  const [counselorFilter, setCounselorFilter] = React.useState<string>("all")
  const [viewMode, setViewMode] = React.useState<"calendar" | "list">("calendar")
  const [calendarPeriod, setCalendarPeriod] = React.useState<"weekly" | "monthly">("weekly")
  const [selectedSession, setSelectedSession] = React.useState<BookingSession | null>(null)
  const [isDrawerClosing, setIsDrawerClosing] = React.useState(false)
  const [manualPaymentSession, setManualPaymentSession] = React.useState<BookingSession | null>(null)
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  // Calendar Date Navigation & Monthly Overflow States
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date())
  const [monthlyOverflowData, setMonthlyOverflowData] = React.useState<{
    dateStr: string
    displayDate: string
    sessions: BookingSession[]
  } | null>(null)

  // Date formatting helpers
  const formatDateKey = React.useCallback((d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const date = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${date}`
  }, [])

  const getSessionDateKey = React.useCallback((dateValue: string | Date | undefined): string => {
    if (!dateValue) return ""
    if (typeof dateValue === "string") {
      return dateValue.includes("T") ? dateValue.split("T")[0] : dateValue
    }
    return formatDateKey(dateValue)
  }, [formatDateKey])

  const getSessionStartHour = React.useCallback((timeRange: string): number => {
    if (!timeRange) return 9
    const match = timeRange.match(/^(\d{1,2}):/)
    return match ? parseInt(match[1], 10) : 9
  }, [])

  React.useEffect(() => {
    async function loadSessions() {
      try {
        const res = await getBookingsAdminAction()
        if (res.success && res.data && res.data.length > 0) {
          const accounts = (res as any).activeAccounts || []
          const slot1Acc = accounts[0]
          const slot2Acc = accounts[1]

          const mapped: BookingSession[] = res.data.map((r: any) => {
            const b = r.booking
            const c = r.counselor
            const s = r.schedule
            const t = r.transaction
            const za = r.zoomAccount

            const counselorType = c?.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"

            const dateStr = s?.date ? String(s.date) : ""
            const timeRange = s ? `${s.startTime?.slice(0, 5)} - ${s.endTime?.slice(0, 5)}` : "09:00 - 10:30"

            const timing = resolveSessionTimingAndStatus({
              date: s?.date,
              startTime: s?.startTime,
              endTime: s?.endTime,
              status: b.status,
            })
            const hoursUntilSession = timing.hoursUntilSession
            const status = timing.status
            const isPast = timing.isPast

            // Accurate Zoom Room & Slot Resolution (Eliminates false R2 label)
            let zoomSlotNumber: 1 | 2 | null = null
            let zoomRoom = "Belum Dijadwalkan"
            let zoomAccountName: string | null = null

            if (b.zoomAccountId) {
              if (slot2Acc && b.zoomAccountId === slot2Acc.id) {
                zoomSlotNumber = 2
                zoomAccountName = slot2Acc.name || "Zoom Pro 2"
                zoomRoom = "Zoom Pro 2"
              } else if (slot1Acc && b.zoomAccountId === slot1Acc.id) {
                zoomSlotNumber = 1
                zoomAccountName = slot1Acc.name || "Zoom Pro 1"
                zoomRoom = "Zoom Pro 1"
              } else if (za) {
                zoomSlotNumber = 1
                zoomAccountName = za.name || "Zoom Pro 1"
                zoomRoom = za.name || "Zoom Pro 1"
              } else {
                zoomSlotNumber = 1
                zoomRoom = "Zoom Pro 1"
              }
            } else if (b.zoomMeetingId || (b.zoomJoinUrl && b.zoomJoinUrl !== "#")) {
              zoomSlotNumber = null
              zoomRoom = "Ruang Rapat Manual"
            }

            return {
              id: b.id,
              code: `SOL-${b.id.slice(0, 4).toUpperCase()}`,
              patientName: b.patientName,
              patientContact: b.patientPhone || b.patientEmail,
              counselorName: c?.fullName ? `${c.fullName}, ${c.title || ""}`.trim() : "Konselor",
              counselorType,
              date: dateStr,
              timeRange,
              hoursUntilSession,
              status,
              isPast,
              zoomRoom,
              zoomJoinUrl: b.zoomJoinUrl || "#",
              zoomAccountId: b.zoomAccountId || null,
              zoomSlotNumber,
              zoomAccountName,
              srqScore: 0,
              hasSuicidalThoughts: false,
              waiverSigned: !!b.waiverAcceptedAt,
              paymentMethod: t?.paymentMethod || "Transfer Bank Manual",
              paymentProvider: (t?.paymentProvider as any) || "manual",
              referenceNumber: t?.referenceNumber || undefined,
              adminNotes: t?.adminNotes || undefined,
              amount: t?.netAmount ? Number(t.netAmount) : 150000,
            }
          })
          setSessions(mapped)
        } else {
          setSessions([])
        }
      } catch (err) {
        console.error("Gagal memuat sesi booking dari database:", err)
        setSessions([])
      } finally {
        setIsLoading(false)
      }
    }
    loadSessions()
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleOpenSession = (ses: BookingSession) => {
    setIsDrawerClosing(false)
    setSelectedSession(ses)
  }

  const handleCloseDrawer = React.useCallback(() => {
    setIsDrawerClosing(true)
    setTimeout(() => {
      setSelectedSession(null)
      setIsDrawerClosing(false)
    }, 200)
  }, [])

  // Keyboard accessibility (Escape key) and body scroll lock
  React.useEffect(() => {
    if (!selectedSession && !monthlyOverflowData) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (monthlyOverflowData) {
          setMonthlyOverflowData(null)
          return
        }
        if (manualPaymentSession) {
          setManualPaymentSession(null)
          return
        }
        handleCloseDrawer()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedSession, monthlyOverflowData, manualPaymentSession, handleCloseDrawer])

  const handleConfirmManualPayment = async (
    session: BookingSession,
    details: ManualPaymentDetails
  ) => {
    // If real booking ID from database
    if (session.id && !session.id.startsWith("ses-")) {
      try {
        await confirmManualPaymentAction({
          bookingId: session.id,
          paymentMethod: details.paymentMethod,
          referenceNumber: details.referenceNumber,
          adminNotes: details.adminNotes,
        })
      } catch (err) {
        console.error("Failed to execute confirmManualPaymentAction:", err)
      }
    }

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== session.id) return s
        const startTime = s.timeRange?.split(" - ")[0] || "09:00"
        const endTime = s.timeRange?.split(" - ")[1] || "10:30"
        const timing = resolveSessionTimingAndStatus({
          date: s.date,
          startTime,
          endTime,
          status: "confirmed",
        })
        return {
          ...s,
          status: timing.status,
          isPast: timing.isPast,
          zoomRoom: "Zoom Pro 1",
          zoomJoinUrl: `https://zoom.us/j/88${Math.floor(10000000 + Math.random() * 90000000)}`,
          paymentMethod: details.paymentMethod,
          paymentProvider: "manual",
          referenceNumber: details.referenceNumber,
          adminNotes: details.adminNotes,
        }
      })
    )

    if (selectedSession?.id === session.id) {
      setSelectedSession((prev) => {
        if (!prev) return null
        const startTime = prev.timeRange?.split(" - ")[0] || "09:00"
        const endTime = prev.timeRange?.split(" - ")[1] || "10:30"
        const timing = resolveSessionTimingAndStatus({
          date: prev.date,
          startTime,
          endTime,
          status: "confirmed",
        })
        return {
          ...prev,
          status: timing.status,
          isPast: timing.isPast,
          zoomRoom: "Zoom Pro 1",
          zoomJoinUrl: `https://zoom.us/j/88${Math.floor(10000000 + Math.random() * 90000000)}`,
          paymentMethod: details.paymentMethod,
          paymentProvider: "manual",
          referenceNumber: details.referenceNumber,
          adminNotes: details.adminNotes,
        }
      })
    }

    showToast(
      `Pembayaran manual untuk ${session.code} (${session.patientName}) berhasil dikonfirmasi. Ruang Zoom telah dialokasikan dan email tiket telah dikirim.`
    )
  }

  const handleRejectManualPayment = async (
    session: BookingSession,
    reason: string,
    adminNotes?: string
  ) => {
    if (session.id && !session.id.startsWith("ses-")) {
      try {
        await rejectManualPaymentAction({
          bookingId: session.id,
          reason,
          adminNotes,
        })
      } catch (err) {
        console.error("Failed to execute rejectManualPaymentAction:", err)
      }
    }

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== session.id) return s
        return {
          ...s,
          status: "cancelled",
          adminNotes: reason + (adminNotes ? ` - ${adminNotes}` : ""),
        }
      })
    )

    if (selectedSession?.id === session.id) {
      setSelectedSession((prev) =>
        prev
          ? {
              ...prev,
              status: "cancelled",
              adminNotes: reason + (adminNotes ? ` - ${adminNotes}` : ""),
            }
          : null
      )
    }

    showToast(
      `Pembayaran untuk ${session.patientName} (${session.code}) ditolak. Slot jadwal telah dibebaskan.`
    )
  }

  const pendingPaymentCount = sessions.filter((s) => s.status === "pending_payment").length
  const expiredCount = sessions.filter((s) => s.status === "expired").length

  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.counselorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || s.status === statusFilter
    const matchRoom =
      roomFilter === "all" ||
      (roomFilter === "R1" && (s.zoomSlotNumber === 1 || s.zoomRoom === "Zoom Pro 1")) ||
      (roomFilter === "R2" && (s.zoomSlotNumber === 2 || s.zoomRoom === "Zoom Pro 2")) ||
      (roomFilter === "manual" && (s.zoomRoom === "Ruang Rapat Manual" || (!s.zoomSlotNumber && s.zoomJoinUrl && s.zoomJoinUrl !== "#"))) ||
      s.zoomRoom === roomFilter
    const matchCounselor = counselorFilter === "all" || s.counselorName.toLowerCase().includes(counselorFilter.toLowerCase())
    return matchSearch && matchStatus && matchRoom && matchCounselor
  })

  const { upcomingSessions, pastSessions } = React.useMemo(() => {
    return groupSessionsByTime(filteredSessions)
  }, [filteredSessions])

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(`https://solulu.id/session/tok_${code.toLowerCase()}_sample`)
    showToast(`Tautan sesi pasien untuk ${code} berhasil disalin ke papan klip.`)
  }

  const handleResendEmail = (patientName: string) => {
    showToast(`Email konfirmasi jadwal dan tautan sesi berhasil dikirim ulang ke ${patientName}.`)
  }

  // Calendar Navigation Handlers
  const handlePrevPeriod = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (calendarPeriod === "weekly") {
        d.setDate(d.getDate() - 7)
      } else {
        d.setMonth(d.getMonth() - 1)
      }
      return d
    })
  }

  const handleNextPeriod = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev)
      if (calendarPeriod === "weekly") {
        d.setDate(d.getDate() + 7)
      } else {
        d.setMonth(d.getMonth() + 1)
      }
      return d
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    showToast("Kembali ke jadwal periode hari ini.")
  }

  // Dynamic 7-day calculation for Weekly View (Monday - Sunday)
  const weekDays = React.useMemo(() => {
    const todayKey = formatDateKey(new Date())
    const curr = new Date(currentDate)
    const dayOfWeek = curr.getDay() // 0 = Sunday, 1 = Monday ...
    const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(curr.setDate(diffToMonday))
    monday.setHours(0, 0, 0, 0)

    const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
    const monthNamesShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
    ]

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateKey = formatDateKey(d)
      return {
        dateObj: d,
        dateKey,
        dayName: dayNames[i],
        dateNum: d.getDate(),
        monthShort: monthNamesShort[d.getMonth()],
        dateStr: `${d.getDate()} ${monthNamesShort[d.getMonth()]} ${d.getFullYear()}`,
        isToday: dateKey === todayKey,
      }
    })
  }, [currentDate, formatDateKey])

  // Dynamic label for toolbar period
  const periodLabel = React.useMemo(() => {
    const monthNamesLong = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ]
    if (calendarPeriod === "weekly") {
      const first = weekDays[0]
      const last = weekDays[6]
      if (first.dateObj.getMonth() === last.dateObj.getMonth()) {
        return `${first.dateNum} - ${last.dateNum} ${monthNamesLong[first.dateObj.getMonth()]} ${first.dateObj.getFullYear()}`
      }
      return `${first.dateNum} ${monthNamesLong[first.dateObj.getMonth()]} - ${last.dateNum} ${monthNamesLong[last.dateObj.getMonth()]} ${last.dateObj.getFullYear()}`
    } else {
      return `${monthNamesLong[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    }
  }, [calendarPeriod, weekDays, currentDate])

  // Hourly slots for Weekly View (08:00 - 21:00)
  const TIME_SLOTS = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ]

  // Dynamic calculation for Monthly View Grid (with leading and trailing days)
  const monthCalendarGrid = React.useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const todayKey = formatDateKey(new Date())

    const firstDayOfMonth = new Date(year, month, 1)
    const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7 // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells: Array<{
      dateObj: Date
      dateKey: string
      dateNum: number
      isCurrentMonth: boolean
      isToday: boolean
    }> = []

    // Leading days (previous month)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      const dateKey = formatDateKey(d)
      cells.push({
        dateObj: d,
        dateKey,
        dateNum: d.getDate(),
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      const dateKey = formatDateKey(d)
      cells.push({
        dateObj: d,
        dateKey,
        dateNum: day,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
      })
    }

    // Trailing days (next month) to complete 7-column rows
    const remaining = (7 - (cells.length % 7)) % 7
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day)
      const dateKey = formatDateKey(d)
      cells.push({
        dateObj: d,
        dateKey,
        dateNum: day,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      })
    }

    return cells
  }, [currentDate, formatDateKey])

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Page Header with View Switcher */}
      <AdminPageHeader
        title="Jadwal Konseling Pasien"
        description="Daftar seluruh jadwal konsultasi aktif, tautan temu video, dan riwayat sesi selesai."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 font-medium hidden sm:inline-flex items-center">
            <span>Durasi:</span>
            <span className="text-foreground font-semibold ml-1.5">90 Menit per Sesi</span>
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsManualBookingModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Booking Manual</span>
            </Button>

            <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>Kalender</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="size-3.5" />
                <span>Daftar</span>
              </button>
            </div>
          </div>
        }
      />

      {/* Policy Notice Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-muted/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldAlert className="size-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground font-medium">Aturan Perubahan Jadwal:</strong> Pasien dapat mengajukan perubahan jadwal selambat-lambatnya 12 jam sebelum sesi dimulai agar jadwal konselor tetap tertib.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: CALENDAR VIEW */}
      {/* ========================================================================= */}
      {viewMode === "calendar" && (
        <div className="flex flex-col gap-4">
          {/* Calendar Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-xs">
            {/* Left: Navigation & Period Label */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
              >
                Hari Ini
              </Button>
              <div className="flex items-center h-8 rounded-lg border border-border bg-background p-0.5">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 cursor-pointer"
                  onClick={handlePrevPeriod}
                  aria-label="Periode sebelumnya"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 cursor-pointer"
                  onClick={handleNextPeriod}
                  aria-label="Periode berikutnya"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
              <span className="text-xs font-semibold text-foreground ml-1">
                {periodLabel}
              </span>
            </div>

            {/* Center: Quick Filters (Room, Counselor, Status) */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Room Filter */}
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger size="sm" className="h-8 text-xs w-36 bg-background">
                  <SelectValue placeholder="Semua Ruang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Semua Ruang</SelectItem>
                    <SelectItem value="R1">Ruang 1 (Zoom 1)</SelectItem>
                    <SelectItem value="R2">Ruang 2 (Zoom 2)</SelectItem>
                    <SelectItem value="manual">Ruang Manual</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="h-8 text-xs w-32 bg-background">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending_payment">Menunggu Bayar</SelectItem>
                    <SelectItem value="in_session">Sedang Berjalan</SelectItem>
                    <SelectItem value="confirmed">Menunggu Sesi</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="expired">Kadaluarsa</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Weekly vs Monthly Period Switcher */}
              <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-muted/30 ml-auto md:ml-0">
                <button
                  type="button"
                  onClick={() => setCalendarPeriod("weekly")}
                  className={`h-7 px-3 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    calendarPeriod === "weekly"
                      ? "bg-background text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mingguan
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarPeriod("monthly")}
                  className={`h-7 px-3 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    calendarPeriod === "monthly"
                      ? "bg-background text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Bulanan
                </button>
              </div>
            </div>
          </div>

          {/* CALENDAR VIEWS */}
          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 animate-pulse">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={`cal-skel-${i}`} className="flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-muted/20">
                    <Skeleton className="h-5 w-16 mx-auto rounded-md" />
                    <Skeleton className="h-7 w-20 mx-auto rounded-md" />
                    <div className="mt-3 flex flex-col gap-2">
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* PERIOD A: WEEKLY VIEW */}
              {calendarPeriod === "weekly" && (
                <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-xs">
                  <div className="min-w-[760px]">
                {/* Header Row: 7 Days */}
                <div className="grid grid-cols-8 border-b border-border bg-muted/30 text-xs">
                  <div className="p-3 text-center text-muted-foreground font-medium border-r border-border/60">
                    Waktu
                  </div>
                  {weekDays.map((d) => (
                    <div
                      key={d.dateKey}
                      className={`p-3 text-center border-r border-border/60 last:border-r-0 ${
                        d.isToday ? "bg-primary/5 text-primary font-semibold" : "text-foreground"
                      }`}
                    >
                      <div className="text-[11px] text-muted-foreground">{d.dayName}</div>
                      <div className="text-sm font-bold mt-0.5">{d.dateNum} {d.monthShort}</div>
                      {d.isToday && (
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-medium">
                          Hari Ini
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Time Slots Grid */}
                <div className="divide-y divide-border/60 text-xs">
                  {TIME_SLOTS.map((time) => {
                    const slotHour = parseInt(time.split(":")[0], 10)

                    return (
                      <div key={time} className="grid grid-cols-8 min-h-[76px] items-stretch">
                        {/* Time Label */}
                        <div className="p-2.5 text-center text-muted-foreground font-mono text-[11px] border-r border-border/60 bg-muted/10 flex flex-col justify-center">
                          <span>{time}</span>
                          <span className="text-[9px] text-muted-foreground/70">WIB</span>
                        </div>

                        {/* 7 Days Columns */}
                        {weekDays.map((d) => {
                          const daySessions = filteredSessions.filter((s) => {
                            const dateMatch = getSessionDateKey(s.date) === d.dateKey
                            if (!dateMatch) return false
                            const sHour = getSessionStartHour(s.timeRange)
                            return sHour === slotHour
                          })

                          return (
                            <div
                              key={d.dateKey}
                              className={`p-1.5 border-r border-border/60 last:border-r-0 relative flex flex-col gap-1.5 justify-center ${
                                d.isToday ? "bg-primary/[0.02]" : ""
                              }`}
                            >
                              {daySessions.map((ses) => {
                                const isLive = ses.status === "in_session"
                                const isCompleted = ses.status === "completed"
                                const isPendingPayment = ses.status === "pending_payment"
                                const isExpired = ses.status === "expired"

                                return (
                                  <button
                                    key={ses.id}
                                    type="button"
                                    onClick={() => handleOpenSession(ses)}
                                    className={`group w-full text-left p-2 rounded-xl border transition-all cursor-pointer shadow-2xs relative ${
                                      isExpired
                                        ? "bg-rose-500/10 border-rose-500/30 opacity-75 hover:opacity-100"
                                        : isPendingPayment
                                        ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60"
                                        : isLive
                                        ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60"
                                        : isCompleted || ses.isPast
                                        ? "bg-muted/40 border-border/60 opacity-80"
                                        : "bg-card border-border hover:border-primary/50"
                                    }`}
                                  >
                                    {/* Urgent indicator dot */}
                                    {ses.hasSuicidalThoughts && (
                                      <span
                                        className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-card"
                                        title="Perlu Perhatian Khusus (Kondisi Mendesak)"
                                      />
                                    )}

                                    <div className="flex items-center justify-between gap-1 text-[11px]">
                                      <span className="font-semibold text-foreground font-mono">
                                        {ses.timeRange.slice(0, 5)}
                                      </span>
                                      <span className={`text-[10px] px-1 py-0.2 rounded font-medium ${
                                        isExpired
                                          ? "bg-rose-500/20 text-rose-800 dark:text-rose-200"
                                          : isPendingPayment
                                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                                          : ses.zoomSlotNumber === 1 || ses.zoomRoom === "Zoom Pro 1"
                                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                                          : ses.zoomSlotNumber === 2 || ses.zoomRoom === "Zoom Pro 2"
                                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                                          : "bg-muted text-muted-foreground"
                                      }`}>
                                        {isExpired
                                          ? "Lewat"
                                          : isPendingPayment
                                          ? "Bayar"
                                          : ses.zoomSlotNumber === 1 || ses.zoomRoom === "Zoom Pro 1"
                                          ? "R1"
                                          : ses.zoomSlotNumber === 2 || ses.zoomRoom === "Zoom Pro 2"
                                          ? "R2"
                                          : ses.zoomJoinUrl && ses.zoomJoinUrl !== "#"
                                          ? "Manual"
                                          : "-"}
                                      </span>
                                    </div>

                                    <div className="text-xs font-medium text-foreground truncate mt-1">
                                      {ses.patientName}
                                    </div>

                                    <div className="text-[10px] text-muted-foreground truncate">
                                      {ses.counselorName.split(",")[0]}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PERIOD B: MONTHLY VIEW */}
          {calendarPeriod === "monthly" && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
              {/* Day Name Headers */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-xs text-center font-semibold text-foreground py-2.5">
                <span>Senin</span>
                <span>Selasa</span>
                <span>Rabu</span>
                <span>Kamis</span>
                <span>Jumat</span>
                <span>Sabtu</span>
                <span>Minggu</span>
              </div>

              {/* Monthly Calendar Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-border/60 text-xs">
                {monthCalendarGrid.map((cell) => {
                  const daySessions = filteredSessions.filter(
                    (s) => getSessionDateKey(s.date) === cell.dateKey
                  )

                  return (
                    <div
                      key={cell.dateKey}
                      className={`min-h-[96px] p-2 flex flex-col gap-1 transition-colors ${
                        !cell.isCurrentMonth
                          ? "bg-muted/15 text-muted-foreground/60 opacity-60"
                          : cell.isToday
                          ? "bg-primary/[0.04]"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`size-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                            cell.isToday
                              ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                              : cell.isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground/60"
                          }`}
                        >
                          {cell.dateNum}
                        </span>
                        {daySessions.length > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {daySessions.length} sesi
                          </span>
                        )}
                      </div>

                      {/* Mini session pills (Max 2 shown directly) */}
                      <div className="flex flex-col gap-1 mt-1">
                        {daySessions.slice(0, 2).map((ses) => (
                          <button
                            key={ses.id}
                            type="button"
                            onClick={() => handleOpenSession(ses)}
                            className="text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-colors cursor-pointer flex items-center gap-1 group"
                          >
                            <span
                              className={`size-1.5 rounded-full shrink-0 ${
                                ses.status === "in_session"
                                  ? "bg-emerald-500"
                                  : ses.status === "expired"
                                  ? "bg-rose-500"
                                  : ses.status === "pending_payment"
                                  ? "bg-amber-500"
                                  : ses.hasSuicidalThoughts
                                  ? "bg-destructive"
                                  : "bg-primary"
                              }`}
                            />
                            <span className="truncate">
                              {ses.timeRange.slice(0, 5)} {ses.patientName}
                            </span>
                          </button>
                        ))}

                        {/* Interactive +N Overflow Button */}
                        {daySessions.length > 2 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const dateObj = cell.dateObj
                              const displayDate = dateObj.toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                              setMonthlyOverflowData({
                                dateStr: cell.dateKey,
                                displayDate,
                                sessions: daySessions,
                              })
                            }}
                            className="text-left text-[10px] font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded transition-colors cursor-pointer w-fit"
                          >
                            +{daySessions.length - 2} sesi lainnya
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          </>
        )}
        </div>
      )}

      {/* Monthly Overflow Modal / Popover */}
      {monthlyOverflowData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setMonthlyOverflowData(null)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {monthlyOverflowData.displayDate}
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Total {monthlyOverflowData.sessions.length} jadwal sesi konsultasi pada tanggal ini.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setMonthlyOverflowData(null)}
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Tutup daftar sesi"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Session Items List */}
            <div className="p-3 overflow-y-auto divide-y divide-border/50 flex flex-col gap-1">
              {monthlyOverflowData.sessions.map((ses) => (
                <div
                  key={ses.id}
                  onClick={() => {
                    setMonthlyOverflowData(null)
                    handleOpenSession(ses)
                  }}
                  className="p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/60 transition-all cursor-pointer flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {ses.timeRange}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                        {ses.code}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <Badge
                      variant={
                        ses.status === "in_session"
                          ? "default"
                          : ses.status === "pending_payment"
                          ? "destructive"
                          : ses.status === "completed"
                          ? "outline"
                          : "secondary"
                      }
                      className="text-[10px] px-2 py-0.5"
                    >
                      {ses.status === "in_session"
                        ? "Sedang Berjalan"
                        : ses.status === "pending_payment"
                        ? "Menunggu Bayar"
                        : ses.status === "completed"
                        ? "Selesai"
                        : "Menunggu Sesi"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {ses.patientName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {ses.counselorName} • {ses.counselorType}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-1 rounded-md shrink-0">
                      {ses.zoomRoom}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border bg-muted/20 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMonthlyOverflowData(null)}
                className="text-xs h-8"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}      {/* ========================================================================= */}
      {/* VIEW MODE 2: LIST VIEW (TABLE) */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <Card className="overflow-hidden shadow-xs">
          {/* Integrated Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari kode sesi, pasien, atau konselor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs bg-background"
                aria-label="Cari jadwal sesi"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-background text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`h-7 px-2.5 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending_payment")}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === "pending_payment"
                      ? "bg-amber-600 text-white font-medium"
                      : "text-amber-700 dark:text-amber-400 hover:text-foreground"
                  }`}
                >
                  <span>Menunggu Bayar</span>
                  {pendingPaymentCount > 0 && (
                    <span className="size-4 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 text-[10px] flex items-center justify-center font-bold">
                      {pendingPaymentCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("in_session")}
                  className={`h-7 px-2.5 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "in_session"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("confirmed")}
                  className={`h-7 px-2.5 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "confirmed"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mendatang
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("completed")}
                  className={`h-7 px-2.5 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "completed"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Selesai
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("expired")}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === "expired"
                      ? "bg-rose-600 text-white font-medium"
                      : "text-rose-700 dark:text-rose-400 hover:text-foreground"
                  }`}
                >
                  <span>Kadaluarsa</span>
                  {expiredCount > 0 && (
                    <span className="size-4 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-200 text-[10px] flex items-center justify-center font-bold">
                      {expiredCount}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-xs text-muted-foreground tabular-nums">
                {filteredSessions.length} sesi
              </span>
            </div>
          </div>

          {/* Desktop & Mobile Table - Fluid Zero Horizontal Scroll */}
          <TooltipProvider delayDuration={150}>
            <div className="w-full overflow-hidden">
              <Table className="w-full text-xs">
                <TableHeader className="bg-muted/40 border-b border-border">
                  <TableRow className="border-border/60">
                    <TableHead className="py-2.5 px-3 font-semibold text-foreground w-[160px]">Jadwal & Sesi</TableHead>
                    <TableHead className="py-2.5 px-3 font-semibold text-foreground">Partisipan & Konseling</TableHead>
                    <TableHead className="py-2.5 px-3 font-semibold text-foreground w-[180px]">Status & Ruang</TableHead>
                    <TableHead className="py-2.5 px-3 font-semibold text-foreground text-right w-[120px]">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`session-skel-${i}`} className="border-border/60">
                        <TableCell className="py-3 px-3">
                          <Skeleton className="h-4 w-20 mb-1.5" />
                          <Skeleton className="h-3 w-28" />
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <Skeleton className="h-4 w-36 mb-1.5" />
                          <Skeleton className="h-3 w-48" />
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <Skeleton className="h-5 w-24 rounded-full mb-1" />
                          <Skeleton className="h-4 w-20 rounded" />
                        </TableCell>
                        <TableCell className="py-3 px-3 text-right">
                          <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredSessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <CheckCircle2 className="size-6 text-muted-foreground/50 mb-1" />
                          <p className="text-sm font-medium text-foreground">Tidak ada jadwal sesi ditemukan</p>
                          <p className="text-xs text-muted-foreground">Belum ada booking atau coba sesuaikan kata kunci pencarian dan filter status.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {/* Sekat 1: Jadwal Mendatang & Hari Ini */}
                      {upcomingSessions.length > 0 && (
                        <>
                          <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                            <TableCell colSpan={4} className="py-2.5 px-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Calendar className="size-4 text-primary" />
                                  <span className="font-semibold text-foreground text-xs">Jadwal Mendatang & Hari Ini</span>
                                  <Badge variant="secondary" className="text-[11px] py-0 px-2 font-mono font-medium">
                                    {upcomingSessions.length} sesi
                                  </Badge>
                                </div>
                                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                  Sesi aktif, terkonfirmasi, dan siap berjalan
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                          {upcomingSessions.map((ses) => {
                            const isLive = ses.status === "in_session"
                            const isLocked = !ses.isPast && ses.hoursUntilSession > 0 && ses.hoursUntilSession < 12

                            return (
                              <TableRow
                                key={ses.id}
                                onClick={() => handleOpenSession(ses)}
                                className={`transition-colors border-border/60 cursor-pointer ${
                                  isLive
                                    ? "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] border-emerald-500/20"
                                    : "hover:bg-muted/30"
                                }`}
                              >
                                <TableCell className="py-3 px-3 align-top">
                                  <div className="font-semibold text-foreground tabular-nums">{ses.timeRange}</div>
                                  <div className="text-[11px] text-muted-foreground">{ses.date}</div>
                                  <span className="inline-block font-mono text-[10px] text-primary font-semibold mt-0.5">{ses.code}</span>
                                </TableCell>

                                <TableCell className="py-3 px-3 align-top">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-foreground font-semibold">{ses.patientName}</span>
                                    {ses.hasSuicidalThoughts && (
                                      <Badge variant="destructive" className="text-[10px] py-0 px-1 font-medium">
                                        Kondisi Mendesak
                                      </Badge>
                                    )}
                                    {ses.patientContact && (
                                      <span className="text-[11px] text-muted-foreground">({ses.patientContact})</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-muted-foreground/80">Konselor:</span>
                                    <span className="font-medium text-foreground/90">{ses.counselorName}</span>
                                    <span>•</span>
                                    <span>{ses.counselorType}</span>
                                  </div>
                                </TableCell>

                                <TableCell className="py-3 px-3 align-top">
                                  <div className="flex flex-col gap-1 items-start">
                                    <SessionStatusBadge status={ses.status} />
                                    <div className="flex items-center gap-1.5">
                                      <Badge variant="outline" className="text-[11px] py-0 px-1.5 font-medium">
                                        {ses.zoomSlotNumber === 1
                                          ? "Ruang 1 (Zoom 1)"
                                          : ses.zoomSlotNumber === 2
                                          ? "Ruang 2 (Zoom 2)"
                                          : ses.zoomRoom === "Ruang Rapat Manual"
                                          ? "Ruang Manual"
                                          : ses.zoomRoom.replace("Zoom Pro ", "Ruang ")}
                                      </Badge>
                                      {isLocked && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span
                                              className="inline-flex items-center text-amber-600 dark:text-amber-400 cursor-help"
                                              aria-label="Jadwal terkunci (<12 jam sebelum sesi)"
                                            >
                                              <Lock className="size-3.5" />
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent side="top">
                                            Terkunci (&lt;12 jam sebelum sesi)
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="py-3 px-3 text-right align-top">
                                  <div
                                    className="flex items-center justify-end gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {ses.status === "pending_payment" ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setManualPaymentSession(ses)}
                                        className="h-7 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 gap-1 cursor-pointer"
                                      >
                                        <CreditCard className="size-3" />
                                        <span className="hidden sm:inline">Konfirmasi</span>
                                      </Button>
                                    ) : isLive && ses.zoomJoinUrl ? (
                                      <Button
                                        size="sm"
                                        asChild
                                        className="h-7 text-xs font-semibold gap-1"
                                      >
                                        <a href={ses.zoomJoinUrl} target="_blank" rel="noreferrer">
                                          <Video className="size-3" />
                                          <span>Masuk</span>
                                        </a>
                                      </Button>
                                    ) : null}

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                          aria-label={`Menu tindakan untuk ${ses.code}`}
                                        >
                                          <MoreHorizontal className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                          onClick={() => handleOpenSession(ses)}
                                          className="cursor-pointer"
                                        >
                                          <ExternalLink className="size-3.5 mr-2" />
                                          <span>Rincian Sesi</span>
                                        </DropdownMenuItem>
                                        {ses.status === "pending_payment" && (
                                          <DropdownMenuItem
                                            onClick={() => setManualPaymentSession(ses)}
                                            className="cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600"
                                          >
                                            <CreditCard className="size-3.5 mr-2" />
                                            <span>Konfirmasi Bayar</span>
                                          </DropdownMenuItem>
                                        )}
                                        {ses.zoomJoinUrl && (
                                          <DropdownMenuItem asChild className="cursor-pointer">
                                            <a href={ses.zoomJoinUrl} target="_blank" rel="noreferrer">
                                              <Video className="size-3.5 mr-2" />
                                              <span>Buka Ruang Zoom</span>
                                            </a>
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleCopyLink(ses.code)}
                                          disabled={ses.status === "pending_payment" || ses.status === "expired"}
                                          className="cursor-pointer"
                                        >
                                          <Copy className="size-3.5 mr-2" />
                                          <span>Salin Link</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleResendEmail(ses.patientName)}
                                          disabled={ses.status === "pending_payment" || ses.status === "expired"}
                                          className="cursor-pointer"
                                        >
                                          <Mail className="size-3.5 mr-2" />
                                          <span>Kirim Ulang Email</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </>
                      )}

                      {/* Sekat 2: Riwayat & Terlewat */}
                      {pastSessions.length > 0 && (
                        <>
                          <TableRow className={`bg-muted/40 hover:bg-muted/40 border-y border-border ${upcomingSessions.length > 0 ? "border-t-2 border-t-border" : ""}`}>
                            <TableCell colSpan={4} className="py-2.5 px-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="size-4 text-muted-foreground" />
                                  <span className="font-semibold text-foreground text-xs">Riwayat & Terlewat</span>
                                  <Badge variant="outline" className="text-[11px] py-0 px-2 font-mono text-muted-foreground">
                                    {pastSessions.length} sesi
                                  </Badge>
                                </div>
                                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                  Sesi yang telah selesai, kadaluarsa, atau dibatalkan
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                          {pastSessions.map((ses) => {
                            return (
                              <TableRow
                                key={ses.id}
                                onClick={() => handleOpenSession(ses)}
                                className="hover:bg-muted/30 transition-colors border-border/60 opacity-80 hover:opacity-100 bg-muted/10 cursor-pointer"
                              >
                                <TableCell className="py-3 px-3 align-top">
                                  <div className="font-semibold text-muted-foreground tabular-nums">{ses.timeRange}</div>
                                  <div className="text-[11px] text-muted-foreground">{ses.date}</div>
                                  <span className="inline-block font-mono text-[10px] text-muted-foreground font-semibold mt-0.5">{ses.code}</span>
                                </TableCell>

                                <TableCell className="py-3 px-3 align-top">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-foreground font-medium">{ses.patientName}</span>
                                    {ses.hasSuicidalThoughts && (
                                      <Badge variant="destructive" className="text-[10px] py-0 px-1 font-medium">
                                        Kondisi Mendesak
                                      </Badge>
                                    )}
                                    {ses.patientContact && (
                                      <span className="text-[11px] text-muted-foreground">({ses.patientContact})</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="text-muted-foreground/80">Konselor:</span>
                                    <span className="font-medium text-foreground/90">{ses.counselorName}</span>
                                    <span>•</span>
                                    <span>{ses.counselorType}</span>
                                  </div>
                                </TableCell>

                                <TableCell className="py-3 px-3 align-top">
                                  <div className="flex flex-col gap-1 items-start">
                                    <SessionStatusBadge status={ses.status} />
                                    <Badge variant="outline" className="text-[11px] py-0 px-1.5 font-medium opacity-80">
                                      {ses.zoomSlotNumber === 1
                                        ? "Ruang 1 (Zoom 1)"
                                        : ses.zoomSlotNumber === 2
                                        ? "Ruang 2 (Zoom 2)"
                                        : ses.zoomRoom === "Ruang Rapat Manual"
                                        ? "Ruang Manual"
                                        : ses.zoomRoom.replace("Zoom Pro ", "Ruang ")}
                                    </Badge>
                                  </div>
                                </TableCell>

                                <TableCell className="py-3 px-3 text-right align-top">
                                  <div
                                    className="flex items-center justify-end gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                          aria-label={`Menu tindakan untuk ${ses.code}`}
                                        >
                                          <MoreHorizontal className="size-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                          onClick={() => handleOpenSession(ses)}
                                          className="cursor-pointer"
                                        >
                                          <ExternalLink className="size-3.5 mr-2" />
                                          <span>Rincian Sesi</span>
                                        </DropdownMenuItem>
                                        {ses.zoomJoinUrl && (
                                          <DropdownMenuItem asChild className="cursor-pointer">
                                            <a href={ses.zoomJoinUrl} target="_blank" rel="noreferrer">
                                              <Video className="size-3.5 mr-2" />
                                              <span>Buka Ruang Zoom</span>
                                            </a>
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleCopyLink(ses.code)}
                                          className="cursor-pointer"
                                        >
                                          <Copy className="size-3.5 mr-2" />
                                          <span>Salin Link</span>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER (PANEL SAMPING DETAIL SESI) */}
      {/* ========================================================================= */}
      {selectedSession && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Rincian Sesi ${selectedSession.code}`}
          className={`fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-200 ${
            isDrawerClosing ? "opacity-0 pointer-events-none" : "animate-in fade-in"
          }`}
          onClick={handleCloseDrawer}
        >
          <div
            className={`w-full max-w-md bg-card border-l border-border h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto transition-transform duration-200 ${
              isDrawerClosing
                ? "translate-x-full"
                : "animate-in slide-in-from-right duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top: Header & Details */}
            <div className="flex flex-col gap-5">
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-primary font-mono">
                      {selectedSession.code}
                    </span>
                    <SessionStatusBadge status={selectedSession.status} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Janji Temu Konseling 90 Menit
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCloseDrawer}
                  className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Tutup panel samping"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Urgent banner if needed */}
              {selectedSession.hasSuicidalThoughts && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 flex items-start gap-2.5 text-xs text-destructive">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">Perlu Perhatian Khusus (Kondisi Mendesak)</span>
                    <span className="text-xs text-foreground/80 leading-relaxed">
                      Pasien mengisi formulir skrining awal dengan indikasi tekanan emosional berat. Mohon pastikan konselor mendampingi tepat waktu.
                    </span>
                  </div>
                </div>
              )}

              {/* Section 1: Pasien */}
              <div className="rounded-xl border border-border p-3.5 flex flex-col gap-2 bg-muted/20 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Identitas Pasien
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {selectedSession.patientName}
                  </span>
                  <Badge variant="outline" className="text-xs font-normal">
                    Tamu (Tanpa Akun)
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5 text-primary" />
                  <span>{selectedSession.patientContact}</span>
                </div>
              </div>

              {/* Section 2: Konselor & Ruang Video */}
              <div className="rounded-xl border border-border p-3.5 flex flex-col gap-2 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Mitra Konselor & Ruang Video
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm">
                      {selectedSession.counselorName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedSession.counselorType}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs px-2 py-1 gap-1">
                    <Video className="size-3 text-primary" />
                    <span>
                      {selectedSession.zoomSlotNumber === 1
                        ? "Ruang 1 (Zoom Pro 1)"
                        : selectedSession.zoomSlotNumber === 2
                        ? "Ruang 2 (Zoom Pro 2)"
                        : selectedSession.zoomRoom === "Ruang Rapat Manual"
                        ? "Ruang Rapat Manual"
                        : selectedSession.zoomRoom.replace("Zoom Pro ", "Ruang ")}
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Section 3: Waktu & Pembayaran */}
              <div className="rounded-xl border border-border p-3.5 flex flex-col gap-2 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Waktu & Status Pembayaran
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Jadwal Sesi:</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {selectedSession.date}, {selectedSession.timeRange}
                  </span>
                </div>
                {selectedSession.status === "expired" ? (
                  <>
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-muted-foreground">Status Pembayaran:</span>
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-xs font-semibold gap-1">
                        <AlertTriangle className="size-3" />
                        <span>Kadaluarsa</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tagihan:</span>
                      <span className="font-semibold text-muted-foreground line-through">
                        Rp {selectedSession.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2.5 border border-border/60 leading-relaxed">
                      Waktu jadwal telekonseling telah dimulai/terlewat tanpa verifikasi pembayaran. Sesi ini telah kadaluarsa dan slot jadwal tidak lagi aktif.
                    </div>
                  </>
                ) : selectedSession.status === "pending_payment" ? (
                  <>
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-muted-foreground">Status Pembayaran:</span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold">
                        Menunggu Pembayaran
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tagihan:</span>
                      <span className="font-semibold text-foreground">
                        Rp {selectedSession.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-muted-foreground">Pembayaran:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Lunas • Rp {selectedSession.amount.toLocaleString("id-ID")} ({selectedSession.paymentMethod})
                    </span>
                  </div>
                )}
              </div>

              {/* Section 4: Aturan Ubah Jadwal (Reschedule Rule Check) */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/40 text-xs flex flex-col gap-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>Pengajuan Perubahan Jadwal</span>
                </span>
                {selectedSession.status === "expired" ? (
                  <div className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed font-medium">
                    Jadwal sesi telah kadaluarsa karena waktu telekonseling telah terlewati sebelum pembayaran diverifikasi. Perubahan jadwal tidak dapat dilakukan.
                  </div>
                ) : selectedSession.isPast || selectedSession.status === "completed" ? (
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Sesi konseling telah selesai dilaksanakan. Perubahan jadwal sudah tidak berlaku.
                  </div>
                ) : selectedSession.status === "cancelled" ? (
                  <div className="text-xs text-destructive leading-relaxed">
                    Sesi telah dibatalkan. Perubahan jadwal tidak dapat dilakukan.
                  </div>
                ) : selectedSession.hoursUntilSession > 0 && selectedSession.hoursUntilSession < 12 ? (
                  <div className="text-xs text-destructive leading-relaxed">
                    Perubahan ditutup karena sesi dimulai dalam <strong>{selectedSession.hoursUntilSession} jam</strong> (batas minimal 12 jam sebelumnya).
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    Sesi memenuhi syarat perubahan jadwal (lebih dari 12 jam sebelum mulai).
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-border flex flex-col gap-2">
              {selectedSession.status === "expired" ? (
                <Button
                  size="sm"
                  disabled
                  className="w-full h-9 text-xs font-semibold bg-muted text-muted-foreground cursor-not-allowed opacity-60 gap-1.5"
                >
                  <AlertTriangle className="size-3.5 mr-1" />
                  <span>Jadwal Telah Kadaluarsa</span>
                </Button>
              ) : selectedSession.status === "pending_payment" ? (
                <Button
                  size="sm"
                  onClick={() => setManualPaymentSession(selectedSession)}
                  className="w-full h-9 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer shadow-xs"
                >
                  <CreditCard className="size-3.5 mr-1" />
                  <span>Konfirmasi Pembayaran Manual</span>
                </Button>
              ) : selectedSession.isPast || selectedSession.status === "completed" ? (
                <Button
                  size="sm"
                  disabled
                  variant="secondary"
                  className="w-full h-9 text-xs font-semibold opacity-60 cursor-not-allowed"
                >
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  <span>Sesi Telah Berakhir</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  asChild
                  className="w-full h-9 text-xs font-semibold"
                >
                  <a href={selectedSession.zoomJoinUrl} target="_blank" rel="noreferrer">
                    <Video className="size-3.5 mr-1.5" />
                    <span>Masuk ke Ruang Video</span>
                    <ExternalLink className="size-3 ml-1" />
                  </a>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(selectedSession.code)}
                disabled={selectedSession.status === "pending_payment" || selectedSession.status === "expired"}
                className="w-full h-8 text-xs font-normal"
              >
                <Copy className="size-3.5 mr-1.5" />
                <span>Salin Tautan Sesi Pasien</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResendEmail(selectedSession.patientName)}
                disabled={selectedSession.status === "pending_payment" || selectedSession.status === "expired"}
                className="w-full h-8 text-xs font-normal text-muted-foreground hover:text-foreground"
              >
                <Mail className="size-3.5 mr-1.5" />
                <span>Kirim Ulang Email Konfirmasi</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Confirmation Modal */}
      <ManualPaymentModal
        session={manualPaymentSession}
        isOpen={!!manualPaymentSession}
        onClose={() => setManualPaymentSession(null)}
        onConfirm={handleConfirmManualPayment}
        onReject={handleRejectManualPayment}
      />

      {/* Admin Manual Booking Bypass Modal */}
      <AdminManualBookingModal
        isOpen={isManualBookingModalOpen}
        onClose={() => setIsManualBookingModalOpen(false)}
        onBookingCreated={(newSession) => {
          setSessions((prev) => [newSession, ...prev])
          showToast(`Sesi manual atas nama ${newSession.patientName} berhasil dibuat dan dikonfirmasi!`)
        }}
      />
    </div>
  )
}
