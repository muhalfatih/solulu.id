"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  FileEdit,
  Phone,
  Mail,
  Loader2,
  ClipboardList,
  Lock,
  Activity,
  AlertCircle,
  CalendarCheck,
  Timer,
  KeyRound,
  Copy,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  completeSessionAndOpenReportAction,
  getSessionReportAction,
  counselorAdmitClientAction,
  counselorUnadmitClientAction,
} from "@/app/counselor/actions"
import { ClinicalReportForm } from "@/components/counselor/clinical-report-form"
import { FloatingTimer } from "@/components/counselor/FloatingTimer"
import type { CounselorUpcomingSessionView, SessionReportDetailView } from "@/lib/counselor/types"
import {
  SessionStatusBadge,
  resolveSessionTimingAndStatus,
  type SessionOperationalStatus,
} from "@/components/admin"
import { cn } from "@/lib/utils"

interface CounselorDashboardClientProps {
  initialSessions: CounselorUpcomingSessionView[]
}

type CounselorDashboardFilter =
  | "all"
  | "pending_payment"
  | "in_session"
  | "confirmed"
  | "completed"

export function CounselorDashboardClient({ initialSessions }: CounselorDashboardClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = React.useState<CounselorUpcomingSessionView[]>(initialSessions)
  const [filter, setFilter] = React.useState<CounselorDashboardFilter>("all")
  const [completingId, setCompletingId] = React.useState<string | null>(null)
  const [confirmSession, setConfirmSession] = React.useState<CounselorUpcomingSessionView | null>(null)
  const [activeTimerSession, setActiveTimerSession] = React.useState<CounselorUpcomingSessionView | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [reportModalSession, setReportModalSession] = React.useState<CounselorUpcomingSessionView | null>(null)
  const [reportModalData, setReportModalData] = React.useState<SessionReportDetailView | null>(null)
  const [loadingReportDataId, setLoadingReportDataId] = React.useState<string | null>(null)

  const handleOpenReportModal = React.useCallback(async (session: CounselorUpcomingSessionView) => {
    setLoadingReportDataId(session.id)
    try {
      const res = await getSessionReportAction(session.id)
      if (res.success && res.data) {
        setReportModalData(res.data)
        setReportModalSession(session)
      } else {
        toast.error(res.error || "Gagal memuat data formulir laporan sesi.")
      }
    } catch {
      toast.error("Terjadi kesalahan saat memuat formulir laporan.")
    } finally {
      setLoadingReportDataId(null)
    }
  }, [])

  const handleCopyText = React.useCallback(async (text: string, successLabel = "Tersalin ke clipboard") => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successLabel)
    } catch {
      toast.error("Gagal menyalin ke clipboard.")
    }
  }, [])

  const isToday = React.useCallback((dateStr: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dateStr === today || dateStr.startsWith(today)
  }, [])

  const [admittingSessionId, setAdmittingSessionId] = React.useState<string | null>(null)

  const handleCounselorAdmit = React.useCallback(async (bookingId: string) => {
    setAdmittingSessionId(bookingId)
    const nowIso = new Date().toISOString()
    setSessions((prev) =>
      prev.map((s) => (s.id === bookingId ? { ...s, operatorAdmittedAt: nowIso } : s))
    )
    try {
      const res = await counselorAdmitClientAction({ bookingId })
      if (!res.success) {
        throw new Error(res.error || "Gagal menandai kehadiran klien.")
      }
      toast.success("Klien berhasil ditandai hadir di sesi.")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal menandai kehadiran.")
      router.refresh()
    } finally {
      setAdmittingSessionId(null)
    }
  }, [router])

  const handleCounselorUnadmit = React.useCallback(async (bookingId: string) => {
    setAdmittingSessionId(bookingId)
    setSessions((prev) =>
      prev.map((s) => (s.id === bookingId ? { ...s, operatorAdmittedAt: null } : s))
    )
    try {
      const res = await counselorUnadmitClientAction({ bookingId })
      if (!res.success) {
        throw new Error(res.error || "Gagal membatalkan status hadir.")
      }
      toast.info("Status kehadiran klien dibatalkan.")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan kehadiran.")
      router.refresh()
    } finally {
      setAdmittingSessionId(null)
    }
  }, [router])

  const handleStartTimer = React.useCallback((session: CounselorUpcomingSessionView) => {
    setActiveTimerSession(session)
    // Auto-admit client if not already admitted
    if (!session.operatorAdmittedAt) {
      handleCounselorAdmit(session.id)
    }
  }, [handleCounselorAdmit])

  // Resolve real-time operational status (in_session, confirmed, completed, expired, pending_payment)
  const enrichedSessions = React.useMemo(() => {
    const now = new Date()
    return sessions.map((s) => {
      const timing = resolveSessionTimingAndStatus(
        {
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
        },
        now
      )

      return {
        ...s,
        operationalStatus: timing.status as SessionOperationalStatus,
        isOngoing: timing.isOngoing,
        isPastSession: timing.isPast,
        hoursUntilSession: timing.hoursUntilSession,
      }
    })
  }, [sessions])

  // Operational metrics
  const pendingCount = React.useMemo(
    () => enrichedSessions.filter((s) => s.operationalStatus === "pending_payment").length,
    [enrichedSessions]
  )
  const inSessionCount = React.useMemo(
    () => enrichedSessions.filter((s) => s.operationalStatus === "in_session").length,
    [enrichedSessions]
  )
  const confirmedCount = React.useMemo(
    () => enrichedSessions.filter((s) => s.operationalStatus === "confirmed").length,
    [enrichedSessions]
  )
  const completedCount = React.useMemo(
    () => enrichedSessions.filter((s) => s.operationalStatus === "completed").length,
    [enrichedSessions]
  )
  const highRiskCount = React.useMemo(
    () => enrichedSessions.filter((s) => s.hasSuicidalThoughts).length,
    [enrichedSessions]
  )
  const todayCount = React.useMemo(
    () => enrichedSessions.filter((s) => isToday(s.date) && s.operationalStatus !== "cancelled").length,
    [enrichedSessions]
  )

  // Filtered session list
  const filteredSessions = React.useMemo(() => {
    if (filter === "all") return enrichedSessions
    return enrichedSessions.filter((s) => s.operationalStatus === filter)
  }, [enrichedSessions, filter])

  const handleCompleteAndReport = async (bookingId: string) => {
    setCompletingId(bookingId)
    setErrorMessage(null)
    try {
      const res = await completeSessionAndOpenReportAction(bookingId)
      if (res.success && res.data?.redirectUrl) {
        setSessions((prev) =>
          prev.map((s) => (s.id === bookingId ? { ...s, status: "completed" as const } : s))
        )
        router.push(res.data.redirectUrl)
      } else {
        setErrorMessage(res.error || "Gagal menyelesaikan sesi. Silakan coba lagi.")
      }
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan saat memperbarui status sesi.")
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-border/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sesi Konseling Praktik</h1>
            <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border/70 font-medium">
              7 Hari Ke Depan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Daftar sesi konseling terintegrasi dengan status operasional real-time dan rekam medis pasien.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs h-9 gap-1.5 border-border/80">
            <Link href="/counselor/schedules">
              <Calendar className="size-3.5" aria-hidden="true" />
              <span>Kelola Slot Praktik</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 6-Digit Zoom Host Key Clinical Access Banner (Ticket 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <KeyRound className="size-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              6-Digit Host Key Zoom Konselor
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-semibold">
                Klaim Host Zoom
              </Badge>
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Gunakan 6-digit Host Key ini untuk mengklaim hak kendali Host di aplikasi Zoom client (Menu <em>Participants &gt; Claim Host</em>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div
            className="px-3.5 py-1.5 rounded-lg bg-background border border-border/80 font-mono font-bold text-base text-foreground tracking-widest shadow-2xs"
            id="counselor-global-host-key-display"
          >
            {sessions.find((s) => s.zoomHostKey)?.zoomHostKey || "849201"}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold border-border/80"
            onClick={() =>
              handleCopyText(
                sessions.find((s) => s.zoomHostKey)?.zoomHostKey || "849201",
                "Host Key disalin ke clipboard"
              )
            }
            id="btn-copy-global-host-key"
          >
            <Copy className="size-3.5" aria-hidden="true" />
            <span>Salin Host Key</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium"
        >
          {errorMessage}
        </div>
      )}

      {/* Grid Overview Cards - 4 Standardized Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Sedang Berlangsung / Hari Ini */}
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Sesi Hari Ini
            </span>
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center shrink-0",
                inSessionCount > 0
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Activity className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {todayCount} Sesi
            </span>
            <span className="text-xs text-muted-foreground">
              {inSessionCount > 0 ? (
                <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {inSessionCount} sedang aktif sekarang
                </strong>
              ) : (
                "Jadwal terlaksana hari ini"
              )}
            </span>
          </div>
        </div>

        {/* Metric 2: Terkonfirmasi / Mendatang */}
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Mendatang
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarCheck className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {confirmedCount} Sesi
            </span>
            <span className="text-xs text-muted-foreground">Terkonfirmasi & siap di Zoom</span>
          </div>
        </div>

        {/* Metric 3: Menunggu Pembayaran */}
        <div
          className={cn(
            "p-4 rounded-xl border shadow-2xs flex flex-col justify-between gap-3 transition-colors",
            pendingCount > 0
              ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10"
              : "border-border/80 bg-card"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Menunggu Bayar
            </span>
            <div className="size-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400 tabular-nums">
              {pendingCount} Sesi
            </span>
            <span className="text-xs text-amber-700/80 dark:text-amber-400/80">
              {pendingCount > 0 ? "Klien dalam proses transfer" : "Tidak ada antrean tertunda"}
            </span>
          </div>
        </div>

        {/* Metric 4: Selesai / Laporan Klinis */}
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Selesai / Laporan
            </span>
            <div className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <ClipboardList className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {completedCount} Sesi
            </span>
            <span className="text-xs text-muted-foreground">Catatan klinis terarsip privat</span>
          </div>
        </div>
      </div>

      {/* Clinical Attention Alert Banner (if high-risk clients exist) */}
      {highRiskCount > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 text-xs flex items-start gap-3">
          <ShieldAlert className="size-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-rose-700 dark:text-rose-300 text-sm">
              Perhatian Khusus Klinis: {highRiskCount} Pasien Memerlukan Atensi (SRQ-20)
            </span>
            <p className="text-rose-700/90 dark:text-rose-300/90 leading-relaxed">
              Terdapat pasien dengan indikasi ide bunuh diri (Pertanyaan 17 Skrining SRQ-20) atau skor tinggi. Mohon
              prioritaskan protokol keselamatan krisis dan rujukan psikolog klinis jika diperlukan.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Session List */}
      <div className="flex flex-col gap-4 pt-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Daftar Sesi Jadwal</h2>
            <span className="text-xs text-muted-foreground">
              ({filteredSessions.length} ditampilkan)
            </span>
          </div>

          {/* Segmented Filter Tabs matching Admin Dashboard */}
          <Tabs
            value={filter}
            onValueChange={(val) => setFilter(val as CounselorDashboardFilter)}
            className="w-full sm:w-auto"
          >
            <div className="overflow-x-auto pb-0.5">
              <TabsList className="h-8 p-1 bg-muted/70 text-xs w-full sm:w-auto flex justify-start sm:justify-center border border-border/50">
                <TabsTrigger
                  value="all"
                  id="tab-filter-all"
                  className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold data-[state=active]:text-foreground whitespace-nowrap"
                >
                  Semua ({enrichedSessions.length})
                </TabsTrigger>

                {pendingCount > 0 && (
                  <TabsTrigger
                    value="pending_payment"
                    id="tab-filter-pending"
                    className="text-xs px-3 py-1 font-medium text-amber-700 dark:text-amber-400 data-[state=active]:font-bold data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-300 data-[state=active]:bg-amber-500/15 whitespace-nowrap"
                  >
                    Menunggu Bayar ({pendingCount})
                  </TabsTrigger>
                )}

                <TabsTrigger
                  value="in_session"
                  id="tab-filter-in-session"
                  className={cn(
                    "text-xs px-3 py-1 font-medium whitespace-nowrap",
                    inSessionCount > 0
                      ? "text-emerald-700 dark:text-emerald-400 data-[state=active]:font-bold data-[state=active]:bg-emerald-500/15"
                      : "data-[state=active]:font-semibold data-[state=active]:text-foreground"
                  )}
                >
                  Berlangsung ({inSessionCount})
                </TabsTrigger>

                <TabsTrigger
                  value="confirmed"
                  id="tab-filter-confirmed"
                  className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold data-[state=active]:text-foreground whitespace-nowrap"
                >
                  Mendatang ({confirmedCount})
                </TabsTrigger>

                <TabsTrigger
                  value="completed"
                  id="tab-filter-completed"
                  className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold data-[state=active]:text-foreground whitespace-nowrap"
                >
                  Selesai ({completedCount})
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>

        {filteredSessions.length === 0 ? (
          <Card className="border border-dashed border-border/80 bg-muted/20">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Calendar className="size-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <p className="text-sm font-semibold text-foreground">Tidak Ada Sesi pada Status Ini</p>
                <p className="text-xs text-muted-foreground">
                  {filter === "pending_payment"
                    ? "Tidak ada pasien yang sedang menunggu proses pembayaran."
                    : filter === "in_session"
                    ? "Saat ini tidak ada sesi yang sedang berlangsung."
                    : "Belum ada sesi pada kategori ini. Anda dapat membuka slot praktik baru."}
                </p>
              </div>
              <Button asChild size="sm" className="mt-2 text-xs">
                <Link href="/counselor/schedules">Buka Slot Praktik Baru</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredSessions.map((session) => {
              const isSessionToday = isToday(session.date)
              const isOngoing = session.operationalStatus === "in_session"
              const isPendingPayment = session.operationalStatus === "pending_payment"
              const isConfirmed = session.operationalStatus === "confirmed"
              const isCompleted = session.operationalStatus === "completed"

              return (
                <Card
                  key={session.id}
                  id={`session-card-${session.id}`}
                  className={cn(
                    "border shadow-2xs transition-all relative overflow-hidden",
                    isOngoing && "border-emerald-500/50 ring-2 ring-emerald-500/20 bg-emerald-500/[0.02]",
                    isSessionToday && isConfirmed && "border-primary/40 ring-1 ring-primary/15",
                    isPendingPayment && "border-amber-500/35 bg-amber-500/[0.015]",
                    !isOngoing && !isPendingPayment && !(isSessionToday && isConfirmed) && "border-border/80 bg-card hover:border-foreground/20"
                  )}
                >
                  {/* Subtle top indicator bar for ongoing sessions */}
                  {isOngoing && (
                    <div className="h-1 w-full bg-emerald-500" aria-hidden="true" />
                  )}

                  <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
                    {/* Top Row: Date, Time & Uniform Status Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {isOngoing && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30 font-bold py-0.5 px-2 animate-pulse"
                          >
                            Live Sekarang
                          </Badge>
                        )}
                        {isSessionToday && !isOngoing && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/25 font-semibold py-0.5 px-2"
                          >
                            Hari Ini
                          </Badge>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary border border-border/70 font-semibold text-foreground">
                          <Clock className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                          {session.timeRange}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary border border-border/70 text-muted-foreground font-medium">
                          <Calendar className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                          {session.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Standard Session Status Badge (Uniform across Solulu) */}
                        <SessionStatusBadge
                          status={session.operationalStatus}
                          roomName={session.zoomMeetingId ? `Ruang #${session.zoomMeetingId.slice(-3)}` : undefined}
                        />

                        {/* Additional status for Completed: Clinical Report Status */}
                        {isCompleted && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs gap-1.5 py-0.5 px-2.5 font-medium shadow-2xs",
                              session.hasReport
                                ? "bg-muted text-muted-foreground border-border/70"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            )}
                          >
                            <ClipboardList className="size-3.5" aria-hidden="true" />
                            <span>{session.hasReport ? "Laporan Lengkap" : "Perlu Catatan Klinis"}</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Patient Identity & Contact Details */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "size-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border",
                            isOngoing
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : isPendingPayment
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                              : "bg-primary/10 text-primary border-primary/20"
                          )}
                          aria-hidden="true"
                        >
                          {session.patientName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-base tracking-tight text-foreground">
                            {session.patientName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="size-3 text-muted-foreground shrink-0" aria-hidden="true" />
                              {session.patientPhone}
                            </span>
                            <Separator orientation="vertical" className="h-3 mx-0.5" />
                            <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
                              <Mail className="size-3 text-muted-foreground shrink-0" aria-hidden="true" />
                              <span className="truncate">{session.patientEmail}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Compact SRQ Badge when normal / no suicidal ideation */}
                      {!session.hasSuicidalThoughts && session.srqScore !== null && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-muted/60 border border-border/70 text-muted-foreground font-medium self-center">
                          Skor SRQ-20: <strong className="text-foreground font-semibold">{session.srqScore}/20</strong>
                        </span>
                      )}
                    </div>

                    {/* Notice for Pending Payment (Belum Bayar) */}
                    {isPendingPayment && (
                      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
                        <div className="flex items-center gap-2.5">
                          <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                          <span className="leading-relaxed">
                            Slot ini telah di-booking oleh pasien dan sedang menunggu verifikasi pembayaran. Tautan
                            Zoom akan terbuka otomatis setelah transaksi terkonfirmasi lunas.
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[11px] border-amber-500/30 bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0 font-semibold"
                        >
                          Menunggu Pembayaran
                        </Badge>
                      </div>
                    )}

                    {/* Clinical Alert: Suicidal Ideation / Bypass Recommendation */}
                    {(session.hasSuicidalThoughts || session.bypassedRecommendation) && (
                      <div
                        className={cn(
                          "p-3 rounded-lg border text-xs flex items-start gap-2.5",
                          session.hasSuicidalThoughts
                            ? "bg-destructive/10 border-destructive/25 text-destructive"
                            : "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
                        )}
                      >
                        <ShieldAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold">
                            {session.hasSuicidalThoughts
                              ? "Perhatian Khusus: Terindikasi Ide Bunuh Diri (Q-17 Ya)"
                              : "Pilihan Mandiri Klien (Bypass Rekomendasi)"}
                          </span>
                          <span className="text-xs opacity-90">
                            {session.srqScore !== null ? `Skor Skrining SRQ-20: ${session.srqScore}/20` : ""}
                            {session.hasSuicidalThoughts && session.bypassedRecommendation
                              ? " • Memilih sendiri konselor (Bypass rekomendasi)"
                              : ""}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Patient Intake Note */}
                    {session.initialNotes && (
                      <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-xs leading-relaxed">
                        <span className="font-semibold text-foreground">Keluhan Awal: </span>
                        <span className="text-muted-foreground italic">&ldquo;{session.initialNotes}&rdquo;</span>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60 flex-wrap">
                      {/* Left: Zoom & Timer Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPendingPayment ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="gap-2 text-xs h-9 opacity-70 cursor-not-allowed border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"
                            id={`btn-zoom-locked-${session.id}`}
                          >
                            <Lock className="size-3.5" aria-hidden="true" />
                            <span>Tautan Zoom Terkunci (Belum Bayar)</span>
                          </Button>
                        ) : (isConfirmed || isOngoing) ? (
                          <>
                            {session.zoomStartUrl ? (
                              <Button
                                asChild
                                variant="default"
                                size="sm"
                                className={cn(
                                  "gap-2 text-xs h-9 font-semibold shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                  isOngoing
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30 animate-pulse"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                )}
                                id={`btn-zoom-${session.id}`}
                              >
                                <a
                                  href={session.zoomStartUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Mulai Sesi Zoom di tab baru"
                                >
                                  <Video className="size-3.5" aria-hidden="true" />
                                  <span>{isOngoing ? "Masuk Zoom (Aktif)" : "Mulai Zoom"}</span>
                                  <span className="sr-only">(buka di tab baru)</span>
                                </a>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="gap-2 text-xs h-9 text-muted-foreground"
                              >
                                <Video className="size-3.5" aria-hidden="true" />
                                <span>Menunggu Ruang Zoom</span>
                              </Button>
                            )}

                            {/* Client Admission / Confirmation */}
                            {session.operatorAdmittedAt ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                                <UserCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
                                <span>Klien Hadir</span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-9 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 font-semibold"
                                onClick={() => handleCounselorAdmit(session.id)}
                                disabled={admittingSessionId === session.id}
                                id={`btn-admit-client-${session.id}`}
                              >
                                {admittingSessionId === session.id ? (
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <UserCheck className="size-3.5 text-amber-600" aria-hidden="true" />
                                )}
                                <span>Tandai Klien Hadir</span>
                              </Button>
                            )}

                            {/* Ticket 4: "Mulai Sesi (Timer)" button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "gap-2 text-xs h-9 font-semibold shadow-xs transition-colors border-emerald-500/40",
                                activeTimerSession?.id === session.id
                                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/20"
                                  : "hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              )}
                              onClick={() => handleStartTimer(session)}
                              id={`btn-start-timer-${session.id}`}
                            >
                              <Timer className="size-3.5 text-emerald-600" aria-hidden="true" />
                              <span>
                                {activeTimerSession?.id === session.id ? "Lihat Timer Aktif" : "Mulai Sesi (Timer)"}
                              </span>
                            </Button>

                            {/* Ticket 4: 6-Digit Host Key Badge */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 border border-border/80 text-xs">
                              <KeyRound className="size-3 text-primary shrink-0" aria-hidden="true" />
                              <span className="text-muted-foreground font-medium text-[11px]">Host Key:</span>
                              <span className="font-mono font-bold text-foreground tracking-wider text-xs">
                                {session.zoomHostKey || "849201"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(session.zoomHostKey || "849201", "Host Key disalin")}
                                className="ml-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                aria-label="Salin 6-digit Host Key Zoom"
                                title="Salin 6-digit Host Key Zoom"
                                id={`btn-copy-card-host-key-${session.id}`}
                              >
                                <Copy className="size-3" aria-hidden="true" />
                              </button>
                            </div>
                          </>
                        ) : isCompleted ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="size-3.5 text-muted-foreground/70" aria-hidden="true" />
                            <span>Sesi Konseling Selesai</span>
                          </span>
                        ) : null}
                      </div>

                      {/* Right: Operational Actions (Complete & Report Form) */}
                      <div className="flex items-center gap-2">
                        {isPendingPayment && (
                          <span className="text-xs text-muted-foreground italic">
                            Menunggu verifikasi admin
                          </span>
                        )}

                        {(isConfirmed || isOngoing) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs h-9 border-border hover:bg-muted font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
                            disabled={completingId === session.id}
                            onClick={() => setConfirmSession(session)}
                            id={`btn-complete-${session.id}`}
                          >
                            {completingId === session.id ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
                                <span>Tandai Selesai & Buat Catatan</span>
                              </>
                            )}
                          </Button>
                        )}

                        {isCompleted && (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={session.hasReport ? "outline" : "default"}
                              size="sm"
                              className={cn(
                                "gap-2 text-xs h-9 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer",
                                !session.hasReport && "bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                              )}
                              id={`btn-report-${session.id}`}
                              onClick={() => handleOpenReportModal(session)}
                              disabled={loadingReportDataId === session.id}
                            >
                              {loadingReportDataId === session.id ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" aria-hidden="true" />
                                  <span>Memuat...</span>
                                </>
                              ) : (
                                <>
                                  <FileEdit className="size-3.5" data-icon="inline-start" aria-hidden="true" />
                                  <span>{session.hasReport ? "Lihat / Edit Catatan Sesi" : "Tulis Catatan Sesi"}</span>
                                </>
                              )}
                            </Button>

                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                              title="Buka Formulir Laporan di Halaman Penuh"
                              id={`btn-report-page-${session.id}`}
                            >
                              <Link href={`/counselor/sessions/${session.id}/report`}>
                                <ArrowRight className="size-3.5" data-icon="inline-start" aria-hidden="true" />
                                <span className="sr-only">Buka di halaman penuh</span>
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Session Completion */}
      <Dialog open={!!confirmSession} onOpenChange={(open) => !open && setConfirmSession(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Tandai Sesi Selesai?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Sesi bersama <strong className="text-foreground">{confirmSession?.patientName}</strong> ({confirmSession?.timeRange}) akan ditandai selesai. Anda akan langsung diarahkan ke formulir penulisan catatan sesi klinis.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/60 text-xs text-muted-foreground flex items-center gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>Pastikan sesi tatap muka via Zoom telah berakhir sebelum menyelesaikan.</span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9"
              onClick={() => setConfirmSession(null)}
              disabled={!!completingId}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="gap-2 text-xs h-9 font-medium"
              disabled={!!completingId}
              onClick={async () => {
                if (!confirmSession) return
                const bookingId = confirmSession.id
                setConfirmSession(null)
                await handleCompleteAndReport(bookingId)
              }}
              id="btn-confirm-complete-session"
            >
              {completingId ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  <span>Ya, Selesaikan & Buat Catatan</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket 5: Modal Launcher for Clinical Report Form */}
      <Dialog
        open={!!reportModalSession}
        onOpenChange={(open) => {
          if (!open) {
            setReportModalSession(null)
            setReportModalData(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Formulir Laporan Sesi Klinis</DialogTitle>
            <DialogDescription>
              Catatan rekam medis sesi konseling dan formulir privasi klinis.
            </DialogDescription>
          </DialogHeader>

          {reportModalData && (
            <ClinicalReportForm
              initialData={reportModalData}
              isModal={true}
              onCancel={() => {
                setReportModalSession(null)
                setReportModalData(null)
              }}
              onSuccess={(reportId) => {
                if (reportModalSession) {
                  const bookingId = reportModalSession.id
                  setSessions((prev) =>
                    prev.map((s) =>
                      s.id === bookingId
                        ? { ...s, hasReport: true, reportId, status: "completed" as const }
                        : s
                    )
                  )
                }
                setReportModalSession(null)
                setReportModalData(null)
                router.refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Ticket 4: Sticky Floating Timer Widget in viewport bottom-right corner */}
      {activeTimerSession && (
        <FloatingTimer
          session={activeTimerSession}
          onClose={() => setActiveTimerSession(null)}
          onCompleteSession={(s) => {
            setActiveTimerSession(null)
            setConfirmSession(s)
          }}
        />
      )}
    </div>
  )
}
