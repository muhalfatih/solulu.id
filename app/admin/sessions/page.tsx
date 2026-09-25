"use client"

import * as React from "react"
import { MOCK_SESSIONS, BookingSession } from "../mock-data"
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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ManualPaymentModal, ManualPaymentDetails } from "./components/manual-payment-modal"
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
  const [sessions, setSessions] = React.useState<BookingSession[]>(MOCK_SESSIONS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [roomFilter, setRoomFilter] = React.useState<string>("all")
  const [counselorFilter, setCounselorFilter] = React.useState<string>("all")
  const [viewMode, setViewMode] = React.useState<"calendar" | "list">("calendar")
  const [calendarPeriod, setCalendarPeriod] = React.useState<"weekly" | "monthly">("weekly")
  const [selectedSession, setSelectedSession] = React.useState<BookingSession | null>(null)
  const [isDrawerClosing, setIsDrawerClosing] = React.useState(false)
  const [manualPaymentSession, setManualPaymentSession] = React.useState<BookingSession | null>(null)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

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
    if (!selectedSession) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // If stacked manual payment modal is open, only close that modal
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
  }, [selectedSession, manualPaymentSession, handleCloseDrawer])

  const handleConfirmManualPayment = (
    session: BookingSession,
    details: ManualPaymentDetails
  ) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== session.id) return s
        return {
          ...s,
          status: "confirmed",
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
      setSelectedSession((prev) =>
        prev
          ? {
              ...prev,
              status: "confirmed",
              zoomRoom: "Zoom Pro 1",
              zoomJoinUrl: `https://zoom.us/j/88${Math.floor(10000000 + Math.random() * 90000000)}`,
              paymentMethod: details.paymentMethod,
              paymentProvider: "manual",
              referenceNumber: details.referenceNumber,
              adminNotes: details.adminNotes,
            }
          : null
      )
    }

    showToast(
      `Pembayaran manual untuk ${session.code} (${session.patientName}) berhasil dikonfirmasi. Ruang Zoom telah dialokasikan dan email tiket telah dikirim.`
    )
  }

  const pendingPaymentCount = sessions.filter((s) => s.status === "pending_payment").length

  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.counselorName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || s.status === statusFilter
    const matchRoom = roomFilter === "all" || s.zoomRoom === roomFilter
    const matchCounselor = counselorFilter === "all" || s.counselorName.toLowerCase().includes(counselorFilter.toLowerCase())
    return matchSearch && matchStatus && matchRoom && matchCounselor
  })

  const handleCopyLink = (code: string) => {
    navigator.clipboard.writeText(`https://solulu.id/session/tok_${code.toLowerCase()}_sample`)
    showToast(`Tautan sesi pasien untuk ${code} berhasil disalin ke papan klip.`)
  }

  const handleResendEmail = (patientName: string) => {
    showToast(`Email konfirmasi jadwal dan tautan sesi berhasil dikirim ulang ke ${patientName}.`)
  }

  // Days for weekly view: Senin 15 Sep - Minggu 21 Sep 2026 (17 Sep is Hari Ini)
  const WEEK_DAYS = [
    { dayName: "Senin", dateNum: 15, isToday: false, dateStr: "15 Sep 2026" },
    { dayName: "Selasa", dateNum: 16, isToday: false, dateStr: "16 Sep 2026" },
    { dayName: "Rabu", dateNum: 17, isToday: true, dateStr: "17 Sep 2026" },
    { dayName: "Kamis", dateNum: 18, isToday: false, dateStr: "18 Sep 2026" },
    { dayName: "Jumat", dateNum: 19, isToday: false, dateStr: "19 Sep 2026" },
    { dayName: "Sabtu", dateNum: 20, isToday: false, dateStr: "20 Sep 2026" },
    { dayName: "Minggu", dateNum: 21, isToday: false, dateStr: "21 Sep 2026" },
  ]

  const TIME_SLOTS = [
    "09:00",
    "11:00",
    "14:00",
    "16:00",
    "17:30",
    "19:00",
    "19:30",
    "21:00",
  ]

  // Monthly dates 1 to 30 for September 2026 (Starts on Tuesday = index 1)
  const MONTH_DATES = Array.from({ length: 30 }, (_, i) => i + 1)

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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Jadwal Konseling Pasien
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Daftar seluruh jadwal konsultasi aktif, tautan temu video, dan riwayat sesi selesai.
          </p>
        </div>

        {/* View Mode Toggle: Kalender vs Daftar */}
        <div className="flex items-center gap-2">
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
              <span>Tampilan Kalender</span>
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
              <span>Tampilan Daftar</span>
            </button>
          </div>

          <Badge variant="outline" className="h-8 text-xs px-3 font-medium hidden sm:inline-flex items-center">
            <span>Durasi:</span>
            <span className="text-foreground font-semibold ml-1.5">90 Menit per Sesi</span>
          </Badge>
        </div>
      </div>

      {/* Policy Notice Strip with Simulation Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-muted/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldAlert className="size-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground font-medium">Aturan Perubahan Jadwal:</strong> Pasien dapat mengajukan perubahan jadwal selambat-lambatnya 12 jam sebelum sesi dimulai agar jadwal konselor tetap tertib.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const target = sessions.find((s) => s.code === "SL-9281")
              if (target) handleOpenSession(target)
            }}
            className="h-8 text-xs font-normal"
          >
            <span>Simulasi: Melewati Batas Ubah</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const target = sessions.find((s) => s.code === "SL-9285")
              if (target) handleOpenSession(target)
            }}
            className="h-8 text-xs font-normal"
          >
            <span>Simulasi: Masih Bisa Ubah</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: CALENDAR VIEW */}
      {/* ========================================================================= */}
      {viewMode === "calendar" && (
        <div className="flex flex-col gap-4">
          {/* Calendar Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
            {/* Left: Navigation & Period Label */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                className="h-8 text-xs font-medium"
                onClick={() => showToast("Kembali ke jadwal minggu berjalan (15 - 21 Sep 2026).")}
              >
                Hari Ini
              </Button>
              <div className="flex items-center h-8 rounded-lg border border-border bg-background p-0.5">
                <Button variant="ghost" size="icon-xs" className="h-7 w-7" aria-label="Periode sebelumnya">
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" className="h-7 w-7" aria-label="Periode berikutnya">
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
              <span className="text-xs font-semibold text-foreground ml-1">
                {calendarPeriod === "weekly" ? "15 - 21 September 2026" : "September 2026"}
              </span>
            </div>

            {/* Center: Quick Filters (Room, Counselor, Status) */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Room Filter */}
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger size="sm" className="h-8 text-xs w-32 bg-background">
                  <SelectValue placeholder="Semua Ruang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Semua Ruang</SelectItem>
                    <SelectItem value="Zoom Pro 1">Ruang Video 1</SelectItem>
                    <SelectItem value="Zoom Pro 2">Ruang Video 2</SelectItem>
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

          {/* PERIOD A: WEEKLY VIEW */}
          {calendarPeriod === "weekly" && (
            <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-xs">
              <div className="min-w-[760px]">
                {/* Header Row: 7 Days */}
                <div className="grid grid-cols-8 border-b border-border bg-muted/30 text-xs">
                  <div className="p-3 text-center text-muted-foreground font-medium border-r border-border/60">
                    Waktu
                  </div>
                  {WEEK_DAYS.map((d) => (
                    <div
                      key={d.dateNum}
                      className={`p-3 text-center border-r border-border/60 last:border-r-0 ${
                        d.isToday ? "bg-primary/5 text-primary font-semibold" : "text-foreground"
                      }`}
                    >
                      <div className="text-[11px] text-muted-foreground">{d.dayName}</div>
                      <div className="text-sm font-bold mt-0.5">{d.dateNum} Sep</div>
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
                    // Check sessions on Wednesday 17 Sep matching this time slot
                    const sessionsAtTime = filteredSessions.filter((s) => s.timeRange.startsWith(time))
                    const isFullyOccupied = time === "19:00" || time === "19:30"

                    return (
                      <div key={time} className="grid grid-cols-8 min-h-[76px] items-stretch">
                        {/* Time Label */}
                        <div className="p-2.5 text-center text-muted-foreground font-mono text-[11px] border-r border-border/60 bg-muted/10 flex flex-col justify-center">
                          <span>{time}</span>
                          <span className="text-[9px] text-muted-foreground/70">WIB</span>
                        </div>

                        {/* 7 Days Columns */}
                        {WEEK_DAYS.map((d) => {
                          const isWednesday = d.dateNum === 17
                          const daySessions = isWednesday ? sessionsAtTime : []

                          return (
                            <div
                              key={d.dateNum}
                              className={`p-1.5 border-r border-border/60 last:border-r-0 relative flex flex-col gap-1.5 justify-center ${
                                d.isToday ? "bg-primary/[0.02]" : ""
                              }`}
                            >
                              {daySessions.map((ses) => {
                                const isLive = ses.status === "in_session"
                                const isCompleted = ses.status === "completed"
                                const isPendingPayment = ses.status === "pending_payment"

                                return (
                                  <button
                                    key={ses.id}
                                    type="button"
                                    onClick={() => handleOpenSession(ses)}
                                    className={`group w-full text-left p-2 rounded-xl border transition-all cursor-pointer shadow-2xs relative ${
                                      isPendingPayment
                                        ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60"
                                        : isLive
                                        ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60"
                                        : isCompleted
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
                                        isPendingPayment
                                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                                          : "bg-muted text-muted-foreground"
                                      }`}>
                                        {isPendingPayment ? "Bayar" : ses.zoomRoom === "Zoom Pro 1" ? "R1" : "R2"}
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

                              {/* Capacity indicator when fully occupied */}
                              {isWednesday && isFullyOccupied && daySessions.length >= 2 && (
                                <span className="text-[9px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded text-center font-medium">
                                  Kapasitas Penuh (2/2)
                                </span>
                              )}
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

              {/* 30 Days Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-border/60 text-xs">
                {/* 1 empty cell for September 2026 offset */}
                <div className="min-h-[90px] p-2 bg-muted/10 opacity-30" />

                {MONTH_DATES.map((dateNum) => {
                  const isToday = dateNum === 17
                  const isTuesday = dateNum === 22
                  const daySessions = isToday
                    ? filteredSessions
                    : isTuesday
                    ? filteredSessions.filter((s) => s.code === "SL-9285")
                    : []

                  return (
                    <div
                      key={dateNum}
                      className={`min-h-[90px] p-2 flex flex-col gap-1 transition-colors ${
                        isToday ? "bg-primary/[0.04]" : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`size-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                            isToday ? "bg-primary text-primary-foreground font-bold" : "text-foreground"
                          }`}
                        >
                          {dateNum}
                        </span>
                        {daySessions.length > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {daySessions.length} sesi
                          </span>
                        )}
                      </div>

                      {/* Mini session pills */}
                      <div className="flex flex-col gap-1 mt-1">
                        {daySessions.slice(0, 2).map((ses) => (
                          <button
                            key={ses.id}
                            type="button"
                            onClick={() => handleOpenSession(ses)}
                            className="text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span
                              className={`size-1.5 rounded-full shrink-0 ${
                                ses.status === "in_session"
                                  ? "bg-emerald-500"
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
                        {daySessions.length > 2 && (
                          <span className="text-[9px] text-muted-foreground pl-1">
                            +{daySessions.length - 2} sesi lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: LIST VIEW (TABLE) */}
      {/* ========================================================================= */}
      {viewMode === "list" && (
        <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
          {/* Integrated Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-border bg-muted/20">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari kode sesi, nama pasien, atau konselor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs bg-card"
                aria-label="Cari jadwal sesi"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
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
                  Menunggu Sesi
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
              </div>

              <span className="text-xs text-muted-foreground tabular-nums">
                {filteredSessions.length} sesi
              </span>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/60">
                  <TableHead className="py-2.5 px-3 font-semibold text-foreground w-[150px]">Sesi & Jadwal</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-foreground w-[210px]">Pasien & Kondisi</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-foreground w-[170px]">Mitra Konselor</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-foreground w-[110px]">Ruang Video</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-foreground w-[140px]">Status</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-foreground w-[150px]">Batas Ubah Jadwal</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-foreground text-right w-[130px] sticky right-0 bg-muted/90 backdrop-blur-xs z-10">
                    Tindakan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((ses) => {
                  const isLive = ses.status === "in_session"
                  const isCompleted = ses.status === "completed"
                  const isLocked = ses.hoursUntilSession > 0 && ses.hoursUntilSession < 12

                  return (
                    <TableRow key={ses.id} className="hover:bg-muted/30 transition-colors border-border/60">
                      <TableCell className="py-3 px-3">
                        <span className="font-semibold text-primary font-mono">{ses.code}</span>
                        <div className="text-foreground font-medium mt-0.5">{ses.timeRange}</div>
                        <div className="text-[11px] text-muted-foreground">{ses.date}</div>
                      </TableCell>

                      <TableCell className="py-3 px-3">
                        <div className="text-foreground font-medium">{ses.patientName}</div>
                        <div className="text-[11px] text-muted-foreground">{ses.patientContact}</div>
                        {ses.hasSuicidalThoughts && (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1 font-medium mt-1">
                            Kondisi Mendesak
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-3">
                        <div className="text-foreground font-medium">{ses.counselorName}</div>
                        <div className="text-[11px] text-muted-foreground">{ses.counselorType}</div>
                      </TableCell>

                      <TableCell className="py-3 px-3">
                        <Badge variant="outline" className="text-xs py-0.5 px-1.5 font-medium">
                          {ses.zoomRoom.replace("Zoom Pro ", "Ruang ")}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 px-3">
                        {ses.status === "pending_payment" ? (
                          <Badge variant="outline" className="text-xs py-0.5 px-1.5 font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
                            <Clock className="size-3" />
                            <span>Menunggu Bayar</span>
                          </Badge>
                        ) : isLive ? (
                          <Badge variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 py-0.5 px-1.5">
                            <span className="size-1.5 rounded-full bg-white animate-pulse" />
                            <span>Sedang Berjalan</span>
                          </Badge>
                        ) : isCompleted ? (
                          <Badge variant="outline" className="text-xs py-0.5 px-1.5 text-muted-foreground">
                            Selesai
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs py-0.5 px-1.5">
                            Menunggu Sesi
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-3">
                        {isCompleted ? (
                          <span className="text-xs text-muted-foreground">Sesi Selesai</span>
                        ) : isLocked ? (
                          <span className="text-xs text-destructive font-medium">Terkunci (&lt;12 jam)</span>
                        ) : (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Bisa Diubah</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-3 text-right sticky right-0 bg-card/90 backdrop-blur-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          {ses.status === "pending_payment" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setManualPaymentSession(ses)}
                              className="h-8 px-2.5 text-xs font-medium border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1 cursor-pointer"
                            >
                              <CreditCard className="size-3" />
                              <span>Konfirmasi</span>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSession(ses)}
                            className="h-8 px-3 text-xs font-normal"
                          >
                            Rincian
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
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
                    <Badge
                      variant={selectedSession.status === "in_session" ? "default" : "secondary"}
                      className="text-xs py-0.5 px-2"
                    >
                      {selectedSession.status === "in_session"
                        ? "Sedang Berjalan"
                        : selectedSession.status === "completed"
                        ? "Selesai"
                        : "Menunggu Sesi"}
                    </Badge>
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
                    <span>{selectedSession.zoomRoom.replace("Zoom Pro ", "Ruang ")}</span>
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
                {selectedSession.status === "pending_payment" ? (
                  <>
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <span className="text-muted-foreground">Status Pembayaran:</span>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
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
                {selectedSession.hoursUntilSession > 0 && selectedSession.hoursUntilSession < 12 ? (
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
              {selectedSession.status === "pending_payment" ? (
                <Button
                  size="sm"
                  onClick={() => setManualPaymentSession(selectedSession)}
                  className="w-full h-9 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer shadow-sm"
                >
                  <CreditCard className="size-3.5 mr-1" />
                  <span>Konfirmasi Pembayaran Manual</span>
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
                disabled={selectedSession.status === "pending_payment"}
                className="w-full h-8 text-xs font-normal"
              >
                <Copy className="size-3.5 mr-1.5" />
                <span>Salin Tautan Sesi Pasien</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResendEmail(selectedSession.patientName)}
                disabled={selectedSession.status === "pending_payment"}
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
      />
    </div>
  )
}
