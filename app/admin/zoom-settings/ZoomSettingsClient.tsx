"use client"

import * as React from "react"
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Key,
  Video,
  Zap,
  Copy,
  Check,
  Clock,
  User,
  X,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  saveZoomAccountAction,
  updateZoomAccountAction,
  deleteZoomAccountAction,
  testZoomConnectionAction,
  getTimelineSessionsAction,
  type TimelineSessionView,
} from "./actions"
import type { ZoomAccountView, ZoomAccountInput } from "./schema"

interface ZoomSettingsClientProps {
  initialAccounts: ZoomAccountView[]
}

function getTodayWIB(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    return formatter.format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

function formatIndonesianDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number)
    const d = new Date(year, month - 1, day)
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d)
  } catch {
    return dateStr
  }
}

function parseTimeToDecimal(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(":").map(Number)
  return h + (m || 0) / 60
}

function formatDecimalToTime(dec: number): string {
  const h = Math.floor(dec)
  const m = Math.round((dec - h) * 60)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function ZoomSettingsClient({ initialAccounts }: ZoomSettingsClientProps) {
  const [accounts, setAccounts] = React.useState<ZoomAccountView[]>(initialAccounts)
  const [showSecret, setShowSecret] = React.useState<{ [key: string]: boolean }>({})
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<{ message: string; type: "success" | "error" } | null>(null)

  // Interactive Action States
  const [inspectingAccountId, setInspectingAccountId] = React.useState<string | null>(null)
  const [editingAccount, setEditingAccount] = React.useState<ZoomAccountView | null>(null)
  const [deletingAccount, setDeletingAccount] = React.useState<ZoomAccountView | null>(null)
  const [testingAccountId, setTestingAccountId] = React.useState<string | null>(null)
  const [isAddingOpen, setIsAddingOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)

  // Date Navigation & Dynamic Timeline State
  const initialDate = getTodayWIB()
  const [selectedDate, setSelectedDate] = React.useState<string>(initialDate)
  const [timelineSessions, setTimelineSessions] = React.useState<TimelineSessionView[]>(() => {
    return initialAccounts.flatMap((acc) =>
      acc.safetyLock.lockedSessions
        .filter((s) => s.date === initialDate)
        .map((s) => ({
          bookingId: s.bookingId,
          patientName: s.patientName,
          counselorName: s.counselorName || "Mitra Konselor",
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
          zoomAccountId: acc.id,
        }))
    )
  })
  const [isLoadingTimeline, setIsLoadingTimeline] = React.useState(false)
  const [hoveredSession, setHoveredSession] = React.useState<TimelineSessionView | null>(null)

  // Edit Form State
  const [editForm, setEditForm] = React.useState({
    name: "",
    email: "",
    accountId: "",
    clientId: "",
    clientSecret: "",
  })

  // Add Form State
  const [addForm, setAddForm] = React.useState<ZoomAccountInput>({
    name: "",
    email: "",
    accountId: "",
    clientId: "",
    clientSecret: "",
  })

  // Keep accounts in sync when initialAccounts updates
  React.useEffect(() => {
    setAccounts(initialAccounts)
  }, [initialAccounts])

  // Fetch timeline sessions dynamically whenever selectedDate changes
  React.useEffect(() => {
    let isCancelled = false
    async function loadSessionsForDate() {
      setIsLoadingTimeline(true)
      try {
        const res = await getTimelineSessionsAction(selectedDate)
        if (!isCancelled && res.success && res.sessions) {
          setTimelineSessions(res.sessions)
        }
      } catch {
        // Fallback to accounts in-memory lockedSessions
        if (!isCancelled) {
          const fallback = accounts.flatMap((acc) =>
            acc.safetyLock.lockedSessions
              .filter((s) => s.date === selectedDate)
              .map((s) => ({
                bookingId: s.bookingId,
                patientName: s.patientName,
                counselorName: s.counselorName || "Mitra Konselor",
                date: s.date,
                startTime: s.startTime,
                endTime: s.endTime,
                status: s.status,
                zoomAccountId: acc.id,
              }))
          )
          setTimelineSessions(fallback)
        }
      } finally {
        if (!isCancelled) setIsLoadingTimeline(false)
      }
    }

    loadSessionsForDate()
    return () => {
      isCancelled = true
    }
  }, [selectedDate, accounts])

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4500)
  }

  const toggleSecret = (id: string) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCopy = (text: string, label: string) => {
    if (!text) return
    navigator.clipboard?.writeText?.(text)
    setCopiedKey(label)
    showToast(`${label} disalin ke papan klip!`, "success")
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleOpenEdit = (acc: ZoomAccountView) => {
    setEditingAccount(acc)
    setEditForm({
      name: acc.name,
      email: acc.email,
      accountId: acc.accountId,
      clientId: acc.clientId,
      clientSecret: "",
    })
  }

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return

    setIsPending(true)
    try {
      const payload: {
        name: string
        email: string
        accountId: string
        clientId: string
        clientSecret?: string
      } = {
        name: editForm.name,
        email: editForm.email,
        accountId: editForm.accountId,
        clientId: editForm.clientId,
      }

      if (editForm.clientSecret.trim().length > 0) {
        payload.clientSecret = editForm.clientSecret.trim()
      }

      const res = await updateZoomAccountAction(editingAccount.id, payload)
      if (!res.success) {
        showToast(res.error || "Gagal memperbarui kredensial.", "error")
        setIsPending(false)
        return
      }

      showToast(
        `Kredensial untuk ${editingAccount.name} berhasil diperbarui dan tersimpan dengan enkripsi AES-256-GCM.`,
        "success"
      )
      setEditingAccount(null)
      window.location.reload()
    } catch {
      showToast("Terjadi kendala saat memperbarui kredensial.", "error")
    } finally {
      setIsPending(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const res = await saveZoomAccountAction(addForm)
      if (res.success) {
        showToast("Akun Zoom Pro baru berhasil ditambahkan dengan enkripsi AES-256-GCM!", "success")
        setIsAddingOpen(false)
        setAddForm({
          name: "",
          email: "",
          accountId: "",
          clientId: "",
          clientSecret: "",
        })
        window.location.reload()
      } else {
        showToast(res.error || "Gagal menambahkan akun Zoom.", "error")
      }
    } catch {
      showToast("Terjadi kendala teknis saat menambahkan akun.", "error")
    } finally {
      setIsPending(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return
    setIsPending(true)
    try {
      const res = await deleteZoomAccountAction(deletingAccount.id)
      if (res.success) {
        showToast(`Akun Zoom ${deletingAccount.name} berhasil dihapus.`, "success")
        setDeletingAccount(null)
        window.location.reload()
      } else {
        showToast(res.error || "Gagal menghapus akun Zoom.", "error")
      }
    } catch {
      showToast("Terjadi kendala teknis saat menghapus akun.", "error")
    } finally {
      setIsPending(false)
    }
  }

  const handleTestConnection = async (acc: ZoomAccountView) => {
    setTestingAccountId(acc.id)
    try {
      const res = await testZoomConnectionAction(acc.id)
      if (res.success) {
        showToast(
          `Koneksi ke Zoom berhasil! Token S2S OAuth untuk "${acc.name}" aktif dan dicache dengan TTL 3500s.`,
          "success"
        )
      } else {
        showToast(res.error || "Uji koneksi Zoom gagal. Periksa kembali Account ID, Client ID, dan Client Secret.", "error")
      }
    } catch {
      showToast("Gagal melakukan uji koneksi ke Zoom API.", "error")
    } finally {
      setTestingAccountId(null)
    }
  }

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number)
    const prev = new Date(y, m - 1, d - 1)
    const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(
      prev.getDate()
    ).padStart(2, "0")}`
    setSelectedDate(prevStr)
  }

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split("-").map(Number)
    const next = new Date(y, m - 1, d + 1)
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(
      next.getDate()
    ).padStart(2, "0")}`
    setSelectedDate(nextStr)
  }

  const handleJumpToday = () => {
    setSelectedDate(getTodayWIB())
  }

  const inspectingAccount = accounts.find((a) => a.id === inspectingAccountId)
  const inspectingSessions = inspectingAccount?.safetyLock.lockedSessions || []

  // Dynamic Scale & Overlap Computation for Selected Date
  const baseStartHour = 8
  const baseEndHour = 22

  const room1Account = accounts[0]
  const room2Account = accounts[1]

  const room1Sessions = timelineSessions.filter((s) => s.zoomAccountId === room1Account?.id)
  const room2Sessions = timelineSessions.filter((s) => s.zoomAccountId === room2Account?.id)

  let startHour = baseStartHour
  let endHour = baseEndHour

  if (timelineSessions.length > 0) {
    const minStart = Math.min(...timelineSessions.map((s) => parseTimeToDecimal(s.startTime)))
    const maxEnd = Math.max(...timelineSessions.map((s) => parseTimeToDecimal(s.endTime)))
    startHour = Math.min(baseStartHour, Math.floor(minStart))
    endHour = Math.max(baseEndHour, Math.ceil(maxEnd))
  }

  const totalHours = Math.max(1, endHour - startHour)
  const step = totalHours > 16 ? 2 : 1
  const hourTicks: number[] = []
  for (let h = startHour; h <= endHour; h += step) {
    hourTicks.push(h)
  }

  // Detect Overlap Windows (ADR-0002)
  const overlapWindows: Array<{
    start: number
    end: number
    s1: TimelineSessionView
    s2: TimelineSessionView
  }> = []

  for (const s1 of room1Sessions) {
    for (const s2 of room2Sessions) {
      const s1Start = parseTimeToDecimal(s1.startTime)
      const s1End = parseTimeToDecimal(s1.endTime)
      const s2Start = parseTimeToDecimal(s2.startTime)
      const s2End = parseTimeToDecimal(s2.endTime)
      const overlapStart = Math.max(s1Start, s2Start)
      const overlapEnd = Math.min(s1End, s2End)
      if (overlapStart < overlapEnd) {
        overlapWindows.push({ start: overlapStart, end: overlapEnd, s1, s2 })
      }
    }
  }

  // Chronological list for mobile view
  const chronologicalSessions = [...timelineSessions].sort(
    (a, b) => parseTimeToDecimal(a.startTime) - parseTimeToDecimal(b.startTime)
  )

  const canAddMore = accounts.length < 2
  const isToday = selectedDate === getTodayWIB()

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md ${
            toast.type === "success"
              ? "bg-card border-primary/40 text-foreground"
              : "bg-destructive/15 border-destructive/40 text-destructive-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <Check className="size-4 text-primary shrink-0" />
            ) : (
              <AlertTriangle className="size-4 text-destructive shrink-0" />
            )}
            <span className="leading-relaxed">{toast.message}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setToast(null)}
            className="size-6 text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Pengaturan Akun Zoom Pro
            </h1>
            <Badge variant="outline" className="text-xs font-mono font-medium">
              Pool: {accounts.length}/2 Akun
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Manajemen kredensial 2 akun Zoom Pro terenkripsi <strong>AES-256-GCM</strong> dengan proteksi otomatis{" "}
            <strong>Safety Lock</strong> untuk mencegah pemutusan ruang telekonseling pasien aktif (ADR-0001 & ADR-0002).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => setIsAddingOpen(true)}
            disabled={!canAddMore}
            className="text-xs h-9 font-medium"
            title={
              canAddMore
                ? "Daftarkan akun Zoom Pro baru ke pool alokasi"
                : "Batas platform tercapai: Maksimal 2 akun Zoom Pro aktif"
            }
          >
            <Plus className="size-4 mr-1.5" />
            <span>Tambah Akun Zoom</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Concurrency Timeline (ADR-0002 Auto-Scale + Date Picker) */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
        {/* Timeline Header Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Clock className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                  Peta Alokasi Konkurensi 90-Menit (ADR-0002)
                </h2>
                {isLoadingTimeline && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Sumbu dinamis otomatis menyesuaikan rentang jam sesi aktif ({startHour}:00 – {endHour}:00 WIB)
              </span>
            </div>
          </div>

          {/* Integrated Date Navigation Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleJumpToday}
                className="h-8 text-xs font-normal"
                title="Kembali ke jadwal hari ini"
              >
                Hari Ini
              </Button>
            )}

            <div className="flex items-center gap-1 rounded-xl border border-border bg-background/50 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevDay}
                aria-label="Hari sebelumnya"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </Button>

              {/* Native Date Input with Styled Human Display */}
              <div className="relative flex items-center px-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  aria-label="Pilih tanggal alokasi Zoom"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-foreground hover:bg-muted/50 transition-colors pointer-events-none">
                  <Calendar className="size-3.5 text-primary" />
                  <span className="font-sans">{formatIndonesianDate(selectedDate)}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextDay}
                aria-label="Hari berikutnya"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-muted-foreground px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span>Ruang #1 (Host Utama)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Ruang #2 (Overlap)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Jendela Overlap (2/2 Terisi)</span>
            </div>
          </div>
          <span className="text-[10px] font-mono">
            {timelineSessions.length} Sesi Terjadwal
          </span>
        </div>

        {/* 1. Desktop & Tablet Adaptive View (Horizontal 2-Track Grid) */}
        <div className="hidden md:flex flex-col gap-2 pt-1">
          {/* Dynamic Hour Ticks Axis */}
          <div
            className="grid text-[10px] font-mono text-muted-foreground border-b border-border/60 pb-1 text-center"
            style={{ gridTemplateColumns: `repeat(${hourTicks.length}, minmax(0, 1fr))` }}
          >
            {hourTicks.map((h) => (
              <div key={h} className="truncate">
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Track 1: Ruang #1 (Host Utama) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 font-medium text-foreground text-[11px] truncate">
              Ruang #1:
            </span>
            <div className="relative flex-1 h-9 bg-muted/30 rounded-lg border border-border/60 overflow-hidden">
              {room1Sessions.length > 0 ? (
                room1Sessions.map((ses) => {
                  const sStart = parseTimeToDecimal(ses.startTime)
                  const sEnd = parseTimeToDecimal(ses.endTime)
                  const left = Math.max(0, ((sStart - startHour) / totalHours) * 100)
                  const width = Math.min(100 - left, ((sEnd - sStart) / totalHours) * 100)
                  const isHovered = hoveredSession?.bookingId === ses.bookingId

                  return (
                    <div
                      key={ses.bookingId}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onMouseEnter={() => setHoveredSession(ses)}
                      onMouseLeave={() => setHoveredSession(null)}
                      onClick={() => room1Account && setInspectingAccountId(room1Account.id)}
                      className={`absolute top-1 bottom-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-md px-2 flex items-center justify-between text-[10px] text-foreground font-medium cursor-pointer transition-all ${
                        isHovered ? "ring-2 ring-primary ring-offset-1 z-20" : ""
                      }`}
                      title={`${ses.bookingId.slice(0, 7).toUpperCase()} (${ses.startTime.slice(0, 5)} - ${ses.endTime.slice(0, 5)} WIB): ${ses.patientName}`}
                    >
                      <span className="truncate font-mono">
                        {ses.bookingId.slice(0, 7).toUpperCase()} ({ses.startTime.slice(0, 5)} - {ses.endTime.slice(0, 5)})
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-400 shrink-0 ml-1" />
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex items-center px-3 text-[10px] text-muted-foreground italic">
                  {room1Account ? "Siaga — Belum ada sesi pada tanggal ini" : "Akun Zoom #1 belum dikonfigurasi"}
                </div>
              )}
            </div>
          </div>

          {/* Track 2: Ruang #2 (Penanganan Overlap) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 font-medium text-foreground text-[11px] truncate">
              Ruang #2:
            </span>
            <div className="relative flex-1 h-9 bg-muted/30 rounded-lg border border-border/60 overflow-hidden">
              {room2Sessions.length > 0 ? (
                room2Sessions.map((ses) => {
                  const sStart = parseTimeToDecimal(ses.startTime)
                  const sEnd = parseTimeToDecimal(ses.endTime)
                  const left = Math.max(0, ((sStart - startHour) / totalHours) * 100)
                  const width = Math.min(100 - left, ((sEnd - sStart) / totalHours) * 100)
                  const isHovered = hoveredSession?.bookingId === ses.bookingId

                  return (
                    <div
                      key={ses.bookingId}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onMouseEnter={() => setHoveredSession(ses)}
                      onMouseLeave={() => setHoveredSession(null)}
                      onClick={() => room2Account && setInspectingAccountId(room2Account.id)}
                      className={`absolute top-1 bottom-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-md px-2 flex items-center justify-between text-[10px] text-foreground font-medium cursor-pointer transition-all ${
                        isHovered ? "ring-2 ring-emerald-500 ring-offset-1 z-20" : ""
                      }`}
                      title={`${ses.bookingId.slice(0, 7).toUpperCase()} (${ses.startTime.slice(0, 5)} - ${ses.endTime.slice(0, 5)} WIB): ${ses.patientName}`}
                    >
                      <span className="truncate font-mono">
                        {ses.bookingId.slice(0, 7).toUpperCase()} ({ses.startTime.slice(0, 5)} - {ses.endTime.slice(0, 5)})
                      </span>
                      <span className="size-1.5 rounded-full bg-emerald-400 shrink-0 ml-1" />
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex items-center px-3 text-[10px] text-muted-foreground italic">
                  {room2Account ? "Siaga — Belum ada sesi pada tanggal ini" : "Akun Zoom #2 belum dikonfigurasi"}
                </div>
              )}
            </div>
          </div>

          {/* Hover Details Card (Rich Tooltip in Desktop) */}
          {hoveredSession && (
            <div className="mt-1 p-2.5 rounded-lg bg-card border border-primary/30 flex items-center justify-between gap-3 text-xs animate-in fade-in shadow-xs">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {hoveredSession.bookingId.slice(0, 7).toUpperCase()}
                </Badge>
                <span className="font-medium text-foreground">
                  {hoveredSession.patientName}{" "}
                  <span className="text-muted-foreground font-normal">dengan</span>{" "}
                  {hoveredSession.counselorName}
                </span>
                <span className="text-muted-foreground text-[11px] tabular-nums">
                  {hoveredSession.startTime.slice(0, 5)} - {hoveredSession.endTime.slice(0, 5)} WIB
                </span>
              </div>
              <Badge
                variant={hoveredSession.status === "confirmed" ? "default" : "secondary"}
                className="text-[10px] py-0 px-2 font-normal"
              >
                {hoveredSession.status === "confirmed" ? "Terkonfirmasi" : "Menunggu Pembayaran"}
              </Badge>
            </div>
          )}
        </div>

        {/* 2. Mobile Adaptive View (Chronological Card List) */}
        <div className="flex md:hidden flex-col gap-2.5 pt-1">
          {chronologicalSessions.length > 0 ? (
            chronologicalSessions.map((ses) => {
              const isRoom1 = ses.zoomAccountId === room1Account?.id
              const hasOverlap = overlapWindows.some(
                (w) => w.s1.bookingId === ses.bookingId || w.s2.bookingId === ses.bookingId
              )

              return (
                <div
                  key={ses.bookingId}
                  onClick={() => {
                    if (isRoom1 && room1Account) setInspectingAccountId(room1Account.id)
                    if (!isRoom1 && room2Account) setInspectingAccountId(room2Account.id)
                  }}
                  className={`p-3 rounded-xl border bg-card flex flex-col gap-2 shadow-2xs transition-colors cursor-pointer ${
                    isRoom1 ? "border-l-4 border-l-primary" : "border-l-4 border-l-emerald-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-muted-foreground" />
                      <span className="font-medium text-xs text-foreground tabular-nums">
                        {ses.startTime.slice(0, 5)} - {ses.endTime.slice(0, 5)} WIB
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={isRoom1 ? "default" : "secondary"}
                        className="text-[10px] py-0 px-1.5 font-normal"
                      >
                        {isRoom1 ? "Ruang #1" : "Ruang #2"}
                      </Badge>
                      {hasOverlap && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-500 border-amber-500/40">
                          Overlap
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{ses.patientName}</span>
                      <span className="text-[11px] text-muted-foreground">{ses.counselorName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {ses.bookingId.slice(0, 7).toUpperCase()}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
              Siaga — Belum ada sesi konseling pada tanggal {formatIndonesianDate(selectedDate)}.
            </div>
          )}
        </div>

        {/* Concurrency Overlap Status Banner */}
        <div className="mt-1 flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-foreground">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full shrink-0 ${
                overlapWindows.length > 0 ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            <span>
              {overlapWindows.length > 0 ? (
                <>
                  <strong>Jendela Overlap Terdeteksi:</strong> Sesi berlangsung simultan pada{" "}
                  {overlapWindows
                    .map((w) => `${formatDecimalToTime(w.start)} - ${formatDecimalToTime(w.end)} WIB`)
                    .join(", ")}
                  . Kedua Ruang Zoom Pro aktif. Kapasitas Pool 100%.
                </>
              ) : (
                <>
                  <strong>Kapasitas Pool Normal:</strong> Tidak ada sesi tumpang tindih pada tanggal ini.
                  Pool alokasi Zoom siap menampung reservasi baru.
                </>
              )}
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground font-semibold shrink-0 hidden sm:inline">
            {overlapWindows.length > 0 ? "OVERLAP PROTECTED" : "CAPACITY NORMAL"}
          </span>
        </div>
      </div>

      {/* Empty State: If no Zoom accounts are configured in DB yet */}
      {accounts.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 shadow-xs">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Video className="size-6" />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-base font-bold text-foreground">
              Belum Ada Akun Zoom Pro yang Dikonfigurasi
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Solulu dirancang untuk mengelola tepat 2 akun Zoom Pro dengan enkripsi AES-256-GCM. 
              Sistem membutuhkan setidaknya 1 akun terdaftar untuk mulai melayani sesi konseling pasien.
            </p>
          </div>
          <Button
            onClick={() => setIsAddingOpen(true)}
            size="sm"
            className="text-xs h-9 font-medium mt-1"
          >
            <Plus className="size-4 mr-1.5" />
            <span>Daftarkan Akun Zoom Pro #1</span>
          </Button>
        </div>
      )}

      {/* 2 Zoom Accounts Grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {accounts.map((acc, index) => {
            const isLocked = acc.safetyLock.isLocked
            const boundCount = acc.safetyLock.upcomingSessionCount
            const activeSession = acc.safetyLock.lockedSessions[0]

            return (
              <div
                key={acc.id}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 shadow-xs transition-colors h-full"
              >
                {/* Card Header: Slot & Identity */}
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-base tracking-tight">
                        {acc.name}
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">
                        Slot #{index + 1}
                      </Badge>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{acc.email}</span>
                  </div>

                  {/* Status Indicator */}
                  <Badge
                    variant={isLocked ? "default" : "secondary"}
                    className="flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium shrink-0"
                  >
                    <span
                      className={`size-2 rounded-full ${
                        isLocked ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"
                      }`}
                    />
                    <span>{isLocked ? "Sesi Aktif / Terikat" : "Siaga (Standby)"}</span>
                  </Badge>
                </div>

                {/* Sesi Terjadwal Terdekat */}
                <div className="rounded-xl bg-muted/30 p-3.5 flex flex-col gap-2 min-h-[82px] justify-center">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Video className="size-3.5 text-primary" />
                      <span>Sesi Terikat Terdekat:</span>
                    </span>
                    {activeSession ? (
                      <Badge variant="secondary" className="font-mono text-[11px] font-semibold">
                        {activeSession.bookingId.slice(0, 7).toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Tidak ada sesi aktif</span>
                    )}
                  </div>

                  {activeSession ? (
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="font-medium text-foreground text-sm">
                        {activeSession.patientName}{" "}
                        <span className="text-muted-foreground font-normal">dengan</span>{" "}
                        {activeSession.counselorName || "Mitra Konselor"}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          <span className="tabular-nums">
                            {activeSession.date}, {activeSession.startTime.slice(0, 5)} - {activeSession.endTime.slice(0, 5)} WIB
                          </span>
                        </span>
                        <span className="text-emerald-500 font-medium">
                          • {activeSession.status === "confirmed" ? "Terkonfirmasi" : "Menunggu Pembayaran"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Ruang Zoom siap dialokasikan untuk pemesanan sesi konseling berikutnya.
                    </p>
                  )}
                </div>

                {/* Status Safety Lock */}
                <div
                  className={`rounded-xl p-3.5 flex flex-col gap-2 text-xs border min-h-[88px] justify-between ${
                    isLocked
                      ? "bg-destructive/10 border-destructive/20 text-destructive"
                      : "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {isLocked ? <Lock className="size-4" /> : <ShieldCheck className="size-4" />}
                      <span>
                        {isLocked
                          ? "Safety Lock Aktif (Kredensial Terkunci)"
                          : "Safety Lock Nonaktif (Bebas Diedit)"}
                      </span>
                    </span>

                    {isLocked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectingAccountId(acc.id)}
                        className="h-6 text-[11px] font-medium text-destructive hover:text-destructive hover:bg-destructive/15 px-2"
                        title="Lihat daftar sesi yang mengunci kredensial akun ini"
                      >
                        {boundCount} Sesi Terikat →
                      </Button>
                    )}
                  </div>

                  <p className="text-[11px] text-foreground/80 leading-relaxed">
                    {isLocked
                      ? acc.safetyLock.reason
                      : "Tidak ada sesi aktif atau reservasi mendatang pada akun ini. Anda dapat memperbarui atau menghapus kredensial S2S OAuth secara aman."}
                  </p>
                </div>

                {/* Kredensial S2S OAuth */}
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">
                      Kredensial Server-to-Server OAuth (AES-256-GCM)
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Database Terenkripsi
                    </span>
                  </div>

                  <div className="rounded-xl border border-border divide-y divide-border/60 font-mono text-[11px] bg-background/50">
                    {/* Account ID */}
                    <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground font-sans text-xs min-w-[90px]">Account ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground font-semibold">{acc.accountId}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(acc.accountId, "Account ID")}
                          title="Salin Account ID"
                          aria-label="Salin Account ID"
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Client ID */}
                    <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground font-sans text-xs min-w-[90px]">Client ID</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground font-semibold">{acc.clientId}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(acc.clientId, "Client ID")}
                          title="Salin Client ID"
                          aria-label="Salin Client ID"
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Client Secret */}
                    <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground font-sans text-xs min-w-[90px]">Client Secret</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground font-semibold">
                          {showSecret[acc.id] ? acc.decryptedSecret : acc.maskedClientSecret}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSecret(acc.id)}
                          title={showSecret[acc.id] ? "Sembunyikan Secret" : "Tampilkan Secret"}
                          aria-label={showSecret[acc.id] ? "Sembunyikan Secret" : "Tampilkan Secret"}
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          {showSecret[acc.id] ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(acc.decryptedSecret, "Client Secret")}
                          title="Salin Client Secret"
                          aria-label="Salin Client Secret"
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Buttons */}
                <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs mt-auto">
                  {/* Uji Koneksi Zoom Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={testingAccountId === acc.id}
                    onClick={() => handleTestConnection(acc)}
                    className="h-8 text-xs font-normal"
                    title="Uji koneksi S2S OAuth ke Zoom API dan perbarui cache token"
                  >
                    {testingAccountId === acc.id ? (
                      <Loader2 className="size-3.5 mr-1.5 animate-spin text-primary" />
                    ) : (
                      <Zap className="size-3.5 mr-1.5 text-primary" />
                    )}
                    <span>{testingAccountId === acc.id ? "Menguji..." : "Uji Koneksi"}</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    {/* Ubah Kredensial Button */}
                    {isLocked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectingAccountId(acc.id)}
                        className="h-8 text-xs text-muted-foreground font-normal hover:text-destructive hover:border-destructive/40"
                        title="Kredensial terkunci demi menjaga kelancaran sesi konsultasi pasien (ADR-0002)"
                      >
                        <Lock className="size-3 mr-1.5 text-destructive" />
                        <span>Kredensial Terkunci</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(acc)}
                        className="h-8 text-xs font-medium"
                        title="Ubah kredensial S2S OAuth"
                      >
                        <Key className="size-3.5 mr-1.5 text-muted-foreground" />
                        <span>Ubah</span>
                      </Button>
                    )}

                    {/* Hapus Akun Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLocked}
                      onClick={() => setDeletingAccount(acc)}
                      className={`h-8 text-xs px-2.5 ${
                        isLocked
                          ? "text-muted-foreground opacity-50 cursor-not-allowed"
                          : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                      }`}
                      title={
                        isLocked
                          ? "Akun tidak dapat dihapus selama memiliki sesi terikat"
                          : "Hapus akun Zoom dari pool"
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* If only 1 account exists, show the second slot invitation card */}
          {accounts.length === 1 && (
            <div className="bg-card/50 border border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 h-full">
              <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                <Plus className="size-5" />
              </div>
              <div className="flex flex-col gap-1 max-w-xs">
                <span className="font-bold text-foreground text-sm">
                  Slot Akun Zoom Pro #2 (Tersedia)
                </span>
                <p className="text-xs text-muted-foreground">
                  Daftarkan akun kedua untuk membuka kapasitas 2 sesi simultan (penanganan overlap).
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingOpen(true)}
                className="text-xs h-8"
              >
                <Plus className="size-3.5 mr-1.5" />
                <span>Tambah Akun #2</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Capacity Guard Info: Executive Architectural Note */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2.5 min-w-0">
          <Server className="size-4 text-primary shrink-0" />
          <span>
            Efisiensi Operasional (ADR-0001): Alokasi dibatasi tepat <strong>2 akun Zoom Pro</strong> untuk melayani maksimal 2 sesi konseling bersamaan tanpa biaya lisensi berlebih.
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] shrink-0">
          KAPASITAS POOL: {accounts.length}/2
        </Badge>
      </div>

      {/* Modal 1: Inspeksi Sesi Terikat & Kepatuhan Safety Lock */}
      {inspectingAccount && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-destructive" />
                  <h3 className="font-bold text-foreground text-base">
                    Audit Safety Lock: {inspectingAccount.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Daftar reservasi sesi aktif dan mendatang yang mengunci kredensial akun ini.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInspectingAccountId(null)}
                aria-label="Tutup dialog"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Explanation Alert */}
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-xs text-destructive flex flex-col gap-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <Lock className="size-4 shrink-0" />
                <span>Kredensial Terkunci Demi Kelancaran Sesi Pasien</span>
              </div>
              <p className="text-foreground/90 leading-relaxed text-xs">
                Perubahan kredensial saat sesi telah terjadwal akan membatalkan tautan rapat Zoom pasien.
                Kredensial hanya dapat diperbarui atau dihapus setelah seluruh sesi di bawah ini selesai.
              </p>
            </div>

            {/* Bound Sessions List */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground">
                Sesi Terikat ({inspectingSessions.length} Sesi):
              </span>
              <div className="rounded-xl border border-border divide-y divide-border/60 max-h-56 overflow-y-auto bg-muted/20">
                {inspectingSessions.length > 0 ? (
                  inspectingSessions.map((ses) => (
                    <div key={ses.bookingId} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground font-mono">
                            {ses.bookingId.slice(0, 7).toUpperCase()}
                          </span>
                          <Badge
                            variant={ses.status === "confirmed" ? "outline" : "secondary"}
                            className="text-[10px] py-0 px-1.5"
                          >
                            {ses.status === "confirmed" ? "Terkonfirmasi" : "Menunggu Pembayaran"}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">
                          {ses.patientName} → {ses.counselorName || "Mitra Konselor"}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-medium text-foreground tabular-nums text-[11px]">
                          {ses.date}, {ses.startTime.slice(0, 5)} - {ses.endTime.slice(0, 5)} WIB
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Tidak ada sesi mendatang yang terikat pada akun ini.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="text-muted-foreground text-[11px]">
                Kepatuhan Kebijakan: ADR-0001 (Telekonseling Bebas Biaya Tambahan)
              </span>
              <Button
                size="sm"
                onClick={() => setInspectingAccountId(null)}
                className="h-8 text-xs font-medium"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Kredensial S2S OAuth */}
      {editingAccount && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Key className="size-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">
                    Ubah Kredensial Zoom
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Perbarui data akun untuk {editingAccount.name}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingAccount(null)}
                aria-label="Tutup form edit"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveCredentials} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Nama Akun / Label</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Email Akun Zoom</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Zoom Account ID</label>
                <input
                  type="text"
                  value={editForm.accountId}
                  onChange={(e) => setEditForm({ ...editForm, accountId: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Zoom Client ID</label>
                <input
                  type="text"
                  value={editForm.clientId}
                  onChange={(e) => setEditForm({ ...editForm, clientId: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">
                  Zoom Client Secret{" "}
                  <span className="text-muted-foreground font-normal">(Opsional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Biarkan kosong jika tidak ingin mengubah secret"
                  value={editForm.clientSecret}
                  onChange={(e) => setEditForm({ ...editForm, clientSecret: e.target.value })}
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Jika diisi, secret baru otomatis dienkripsi dengan standar AES-256-GCM.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAccount(null)}
                  className="h-8 text-xs font-normal"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="h-8 text-xs font-medium">
                  {isPending ? "Menyimpan..." : "Simpan Kredensial"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Konfirmasi Hapus Akun Zoom */}
      {deletingAccount && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5 shrink-0" />
                <h3 className="font-bold text-base">Hapus Akun Zoom</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeletingAccount(null)}
                aria-label="Tutup modal konfirmasi"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <p className="text-xs text-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <strong>{deletingAccount.name}</strong> ({deletingAccount.email}) dari pool Zoom Solulu? Tindakan ini akan menghapus kredensial S2S OAuth dari database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingAccount(null)}
                className="h-8 text-xs font-normal"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={handleDeleteAccount}
                className="h-8 text-xs font-medium"
              >
                {isPending ? "Menghapus..." : "Hapus Akun"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Pendaftaran Akun Zoom Baru */}
      {isAddingOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Plus className="size-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">
                    Daftarkan Akun Zoom Pro
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Masukkan kredensial Server-to-Server OAuth dari Zoom App Marketplace.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddingOpen(false)}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateAccount} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Nama Akun / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Akun Zoom Pro 1"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Email Terdaftar di Zoom</label>
                <input
                  type="email"
                  placeholder="e.g. admin.zoom1@solulu.id"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Account ID</label>
                <input
                  type="text"
                  placeholder="zm_acc_..."
                  value={addForm.accountId}
                  onChange={(e) => setAddForm({ ...addForm, accountId: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Client ID</label>
                <input
                  type="text"
                  placeholder="zm_cli_..."
                  value={addForm.clientId}
                  onChange={(e) => setAddForm({ ...addForm, clientId: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Client Secret</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={addForm.clientSecret}
                  onChange={(e) => setAddForm({ ...addForm, clientSecret: e.target.value })}
                  required
                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Client secret otomatis dienkripsi dengan standar AES-256-GCM sebelum disimpan.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingOpen(false)}
                  className="h-8 text-xs font-normal"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="h-8 text-xs font-medium"
                >
                  {isPending ? "Menyimpan..." : "Simpan Akun"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
