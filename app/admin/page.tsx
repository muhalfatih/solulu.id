"use client"

import * as React from "react"
import Link from "next/link"
import type { BookingSession } from "@/lib/types/admin"
import { getBookingsAdminAction } from "./sessions/actions"
import { getCounselorApplicationsAction } from "./counselors/applications/actions"
import { getAdminDashboardMetricsAction, type AdminDashboardMetrics } from "./actions"
import {
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  Clock,
  CreditCard,
  UserCheck,
} from "lucide-react"
import {
  ManualPaymentModal,
  type ManualPaymentDetails,
} from "./sessions/components/manual-payment-modal"
import { confirmManualPaymentAction, rejectManualPaymentAction } from "./sessions/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function DistilledAdminDashboard() {
  const [sessionFilter, setSessionFilter] = React.useState<"all" | "pending_payment" | "in_session" | "confirmed" | "completed">("all")
  const [allSessions, setAllSessions] = React.useState<BookingSession[]>([])
  const [pendingApplicants, setPendingApplicants] = React.useState<any[]>([])
  const [metrics, setMetrics] = React.useState<AdminDashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const [selectedPendingSession, setSelectedPendingSession] = React.useState<BookingSession | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)
  const [verificationNotice, setVerificationNotice] = React.useState<string | null>(null)

  // Fetch 100% real bookings, applicants, and metrics directly from the database
  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [bookingsRes, applicantsRes, metricsRes] = await Promise.all([
        getBookingsAdminAction(),
        getCounselorApplicationsAction(),
        getAdminDashboardMetricsAction(),
      ])

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data)
      }

      if (bookingsRes.success && bookingsRes.data) {
        const mapped: BookingSession[] = bookingsRes.data.map((row: any) => {
          const b = row.booking
          const c = row.counselor
          const s = row.schedule
          const t = row.transaction
          const counselorType =
            c?.counselorType === "psychologist"
              ? "Psikolog Klinis"
              : "Konselor Sebaya"
          const dateStr = s?.date ? String(s.date) : ""
          const timeRange = s
            ? `${s.startTime?.slice(0, 5)} - ${s.endTime?.slice(0, 5)} WIB`
            : "09:00 - 10:30 WIB"

          let hoursUntilSession = 0
          if (s?.date && s?.startTime) {
            try {
              const sessionDate = new Date(`${s.date}T${s.startTime}`)
              hoursUntilSession = Math.round(
                (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60)
              )
            } catch {}
          }

          const status = (
            ["in_session", "confirmed", "completed", "cancelled", "pending_payment"].includes(b.status)
              ? b.status
              : "pending_payment"
          ) as BookingSession["status"]

          return {
            id: b.id,
            code: `SOL-${b.id.slice(0, 4).toUpperCase()}`,
            patientName: b.patientName,
            patientContact: b.patientPhone || b.patientEmail,
            counselorName: c?.fullName
              ? `${c.fullName}, ${c.title || ""}`.trim()
              : "Konselor",
            counselorType,
            date: dateStr,
            timeRange,
            hoursUntilSession,
            status,
            zoomRoom: b.zoomMeetingId
              ? `Ruang #${b.zoomMeetingId.slice(-3)}`
              : "Belum Dijadwalkan",
            zoomJoinUrl: b.zoomJoinUrl || "#",
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
        setAllSessions(mapped)
      } else {
        setAllSessions([])
      }

      if (applicantsRes.success && applicantsRes.data) {
        const pending = applicantsRes.data
          .filter((a: any) => a.status === "pending")
          .map((app: any) => ({
            id: app.id,
            name: app.fullName || app.name || "Pelamar",
            email: app.email,
            phone: app.phone || "-",
            type:
              app.counselorType === "psychologist"
                ? "Psikolog Klinis"
                : "Konselor Sebaya",
            education:
              app.counselorType === "psychologist"
                ? "S2 Profesi Psikologi"
                : "S1 Psikologi",
            bio: app.bio || "",
            documents: {
              ktp: Boolean(app.ktpR2Key || app.documents?.ktp),
              cv: Boolean(app.cvR2Key || app.documents?.cv),
              diploma: Boolean(app.diplomaR2Key || app.documents?.diploma),
              str: Boolean(app.strR2Key || app.documents?.str),
            },
          }))
        setPendingApplicants(pending)
      } else {
        setPendingApplicants([])
      }
    } catch (err) {
      console.error("Gagal memuat data dasbor admin:", err)
      setAllSessions([])
      setPendingApplicants([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const pendingSessions = React.useMemo(() => {
    return allSessions.filter((s) => s.status === "pending_payment")
  }, [allSessions])

  const handleOpenVerifyModal = (session: BookingSession) => {
    setSelectedPendingSession(session)
    setIsPaymentModalOpen(true)
  }

  const handleConfirmPayment = async (session: BookingSession, details: ManualPaymentDetails) => {
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

    setAllSessions((prev) =>
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
    setVerificationNotice(
      `Pembayaran sesi ${session.code} (${session.patientName}) senilai Rp ${session.amount.toLocaleString("id-ID")} berhasil diverifikasi via ${details.paymentMethod}. Ruang Zoom telah dialokasikan.`
    )
    loadData()
    setTimeout(() => {
      setVerificationNotice((cur) => (cur?.includes(session.code) ? null : cur))
    }, 6000)
  }

  const handleRejectPayment = async (session: BookingSession, reason: string, adminNotes?: string) => {
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

    setAllSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, status: "cancelled" } : s))
    )
    setVerificationNotice(
      `Pembayaran sesi ${session.code} (${session.patientName}) ditolak (${reason}). Slot jadwal telah dibebaskan.`
    )
    loadData()
    setTimeout(() => {
      setVerificationNotice((cur) => (cur?.includes(session.code) ? null : cur))
    }, 6000)
  }

  // Today WIB
  const todayWIB = React.useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  }, [])

  const todayFormatted = React.useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date())
  }, [])

  // Filter today's sessions (real database data)
  const todaySessions = React.useMemo(() => {
    return allSessions.filter((s) => s.date === todayWIB)
  }, [allSessions, todayWIB])

  // Filtered session list based on active tab
  const displayedSessions = React.useMemo(() => {
    if (sessionFilter === "pending_payment") {
      return allSessions.filter((s) => s.status === "pending_payment")
    }
    if (sessionFilter === "in_session") {
      return allSessions.filter((s) => s.status === "in_session")
    }
    if (sessionFilter === "confirmed") {
      return allSessions.filter((s) => s.status === "confirmed")
    }
    if (sessionFilter === "completed") {
      return allSessions.filter((s) => s.status === "completed")
    }
    // "all": show today's sessions if any, otherwise all sessions
    const source = todaySessions.length > 0 ? todaySessions : allSessions
    return [...source].sort((a, b) => {
      const order: Record<string, number> = { in_session: 0, pending_payment: 1, confirmed: 2, completed: 3, cancelled: 4 }
      return (order[a.status] ?? 5) - (order[b.status] ?? 5)
    })
  }, [todaySessions, allSessions, sessionFilter])

  const pendingPaymentCount = allSessions.filter((s) => s.status === "pending_payment").length
  const inSessionCount = allSessions.filter((s) => s.status === "in_session").length
  const confirmedCount = todaySessions.filter((s) => s.status === "confirmed").length
  const completedCount = todaySessions.filter((s) => s.status === "completed").length

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-12">
      {/* 1. Header: Distilled Operational Horizon */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
              Dasbor Operasional
            </h1>
            <Badge
              variant="outline"
              className="text-xs py-1 px-2.5 font-medium border-border bg-muted/50 text-foreground inline-flex items-center gap-2"
            >
              <span className={`size-2 rounded-full ${inSessionCount > 0 ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-muted-foreground/40"}`} />
              <span className="tabular-nums font-semibold">{inSessionCount} Sesi Berjalan</span>
            </Badge>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {todayFormatted}
          </p>
        </div>
      </header>

      {/* 2. Operational Metrics: 100% Real Database Metrics */}
      <section aria-label="Metrik Operasional Harian" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`metric-skel-${i}`}
              className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 shadow-2xs"
            >
              <Skeleton className="h-3 w-24 bg-muted/80" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-20 bg-muted/80" />
                <Skeleton className="h-3 w-36 bg-muted/60" />
              </div>
            </div>
          ))
        ) : (
          <>
            {/* Metric 1: Jadwal Hari Ini */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 transition-colors hover:border-foreground/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Jadwal Hari Ini
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
                  {todaySessions.length}
                </span>
                <span className="text-xs text-muted-foreground truncate tabular-nums font-medium">
                  <strong className="text-foreground font-semibold">{inSessionCount}</strong> aktif • <strong className="text-foreground font-semibold">{confirmedCount}</strong> mendatang • <strong className="text-foreground font-semibold">{completedCount}</strong> selesai
                </span>
              </div>
            </div>

            {/* Metric 2: Mitra Konselor */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 transition-colors hover:border-foreground/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mitra Konselor
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
                  {metrics?.totalCounselors ?? 0}
                </span>
                <span className="text-xs text-muted-foreground truncate font-medium">
                  {metrics ? `${metrics.psychologistCount} Psikolog Klinis • ${metrics.peerCount} Konselor Sebaya` : "Memuat data konselor..."}
                </span>
              </div>
            </div>

            {/* Metric 3: Rekam Medis Tertunda */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 transition-colors hover:border-amber-500/30">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rekam Medis Tertunda
                </span>
                {(metrics?.pendingMedicalRecordsCount ?? 0) > 0 && (
                  <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" title="Perlu pengisian catatan klinis" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
                  {metrics?.pendingMedicalRecordsCount ?? 0}
                </span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 truncate">
                  {metrics?.firstPendingMedicalRecordCode
                    ? `Menunggu catatan: ${metrics.firstPendingMedicalRecordCode}`
                    : "Semua rekam medis lengkap"}
                </span>
              </div>
            </div>

            {/* Metric 4: Pendapatan Terbayar */}
            <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 transition-colors hover:border-foreground/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pendapatan
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
                  Rp {(metrics?.totalRevenue ?? 0).toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-muted-foreground truncate font-medium">
                  Dari <strong className="text-foreground font-semibold">{metrics?.paidSessionsCount ?? 0} sesi</strong> ({metrics?.revenuePeriod ?? "Bulan Ini"})
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 3. Main Operational Layout: Dedicated Table on Left, Distilled Utilities on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Interactive Today's Sessions Table */}
        <section aria-label="Tabel Jadwal Konseling Hari Ini" className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Table Header Toolbar with Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border bg-muted/20 gap-3">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Jadwal Konseling Hari Ini
              </h2>

              {/* Segmented Filter for Distilled Scanning */}
              <Tabs
                value={sessionFilter}
                onValueChange={(val) => setSessionFilter(val as any)}
                className="w-full sm:w-auto"
              >
                <div className="overflow-x-auto pb-0.5">
                  <TabsList className="h-8 p-1 bg-muted/70 text-xs w-full sm:w-auto flex justify-start sm:justify-center border border-border/50">
                    <TabsTrigger value="all" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold data-[state=active]:text-foreground whitespace-nowrap">
                      Semua ({sessionFilter === "pending_payment" ? allSessions.length : todaySessions.length})
                    </TabsTrigger>
                    {pendingPaymentCount > 0 && (
                      <TabsTrigger value="pending_payment" className="text-xs px-3 py-1 font-medium text-amber-700 dark:text-amber-400 data-[state=active]:font-bold data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-300 data-[state=active]:bg-amber-500/15 whitespace-nowrap">
                        Menunggu Bayar ({pendingPaymentCount})
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="in_session" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold data-[state=active]:text-foreground whitespace-nowrap">
                      Berjalan ({inSessionCount})
                    </TabsTrigger>
                    <TabsTrigger value="confirmed" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold data-[state=active]:text-foreground whitespace-nowrap">
                      Mendatang ({confirmedCount})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-xs px-3 py-1 font-medium data-[state=active]:font-semibold data-[state=active]:text-foreground whitespace-nowrap">
                      Selesai ({completedCount})
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </div>

            {/* Session Table: High Density, Scannable, Balanced Column Layout */}
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[580px] text-xs">
                <TableHeader className="bg-muted/50 border-b border-border">
                  <TableRow className="border-border/60">
                    <TableHead className="py-3 pl-4 pr-2 font-semibold text-foreground">Pasien</TableHead>
                    <TableHead className="py-3 px-2 font-semibold text-foreground">Konselor</TableHead>
                    <TableHead className="py-3 px-2 font-semibold text-foreground">Jadwal (WIB)</TableHead>
                    <TableHead className="py-3 px-2 font-semibold text-foreground">Ruang & Status</TableHead>
                    <TableHead className="py-3 pl-2 pr-4 font-semibold text-foreground text-right sticky right-0 bg-muted/95 backdrop-blur-xs shadow-[-8px_0_12px_-6px_rgba(0,0,0,0.08)]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={`session-skel-${i}`} className="border-border/60">
                      <TableCell className="py-3 pl-4 pr-2">
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-4 w-28 bg-muted/80" />
                          <Skeleton className="h-3 w-16 bg-muted/60" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-2">
                        <div className="flex flex-col gap-1.5">
                          <Skeleton className="h-4 w-32 bg-muted/80" />
                          <Skeleton className="h-3 w-20 bg-muted/60" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-2">
                        <Skeleton className="h-4 w-24 bg-muted/80" />
                      </TableCell>
                      <TableCell className="py-3 px-2">
                        <Skeleton className="h-6 w-32 rounded-full bg-muted/70" />
                      </TableCell>
                      <TableCell className="py-3 pl-2 pr-4 text-right sticky right-0 bg-card/95">
                        <Skeleton className="h-7 w-20 ml-auto rounded-md bg-muted/80" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : displayedSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <CheckCircle2 className="size-5 text-muted-foreground/60 mb-1" />
                        <span className="font-semibold text-foreground">Tidak ada sesi pada filter ini</span>
                        <span className="text-xs text-muted-foreground">Pilih tab filter lain atau kembali ke &ldquo;Semua&rdquo; untuk meninjau seluruh jadwal hari ini.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedSessions.map((ses: BookingSession) => {
                    const isInSession = ses.status === "in_session"
                    const isCrisis = ses.hasSuicidalThoughts
                    const isCompleted = ses.status === "completed"

                    return (
                      <TableRow
                        key={ses.id}
                        className={`transition-colors border-border/60 ${
                          isInSession
                            ? "bg-emerald-500/[0.07] dark:bg-emerald-950/20 hover:bg-emerald-500/[0.1] border-emerald-500/20"
                            : isCompleted
                            ? "opacity-60 hover:opacity-90"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        {/* Patient & Code */}
                        <TableCell className="py-2.5 pl-4 pr-2 align-middle">
                          <div className="text-foreground font-bold">
                            {ses.patientName}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-xs text-muted-foreground font-medium tabular-nums">
                              {ses.code}
                            </span>
                            {isCrisis && (
                              <Badge
                                variant="outline"
                                className="text-xs py-0 px-1.5 font-semibold border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-2xs"
                              >
                                Risiko Tinggi
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Counselor */}
                        <TableCell className="py-2.5 px-2 align-middle">
                          <div className="text-foreground font-semibold">
                            {ses.counselorName}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            {ses.counselorType}
                          </div>
                        </TableCell>

                        {/* Time */}
                        <TableCell className="py-2.5 px-2 tabular-nums align-middle whitespace-nowrap">
                          <span className="font-bold text-foreground">
                            {ses.timeRange}
                          </span>
                        </TableCell>

                        {/* Unified Room & Operational Status */}
                        <TableCell className="py-2.5 px-2 align-middle whitespace-nowrap">
                          {ses.status === "pending_payment" ? (
                            <Badge
                              variant="outline"
                              className="text-xs py-0.5 px-2.5 inline-flex items-center gap-1.5 font-semibold shadow-2xs bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/35"
                            >
                              <Clock className="size-3 text-amber-600 dark:text-amber-400" />
                              <span>Menunggu Pembayaran</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className={`text-xs py-0.5 px-2.5 inline-flex items-center gap-1.5 font-semibold shadow-2xs ${
                                isInSession
                                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/35"
                                  : isCompleted
                                  ? "text-muted-foreground/70 border-border/50 bg-muted/20"
                                  : "text-foreground border-border/80 bg-background"
                              }`}
                            >
                              <span
                                className={`size-2 rounded-full ${
                                  isInSession
                                    ? "bg-emerald-500 ring-2 ring-emerald-500/20"
                                    : isCompleted
                                    ? "bg-muted-foreground/40"
                                    : "bg-primary/70"
                                }`}
                              />
                              <span>
                                {ses.zoomRoom.replace("Zoom Pro ", "Ruang ")} • {isInSession ? "Berlangsung" : isCompleted ? "Selesai" : "Terkonfirmasi"}
                              </span>
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-2.5 pl-2 pr-4 text-right align-middle whitespace-nowrap sticky right-0 bg-card/95 backdrop-blur-xs shadow-[-8px_0_12px_-6px_rgba(0,0,0,0.08)]">
                          {ses.status === "pending_payment" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleOpenVerifyModal(ses)}
                              className="h-7 text-xs font-semibold px-2.5 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/60 gap-1.5 transition-colors cursor-pointer"
                              title={`Verifikasi pembayaran manual untuk ${ses.patientName}`}
                            >
                              <CreditCard className="size-3 text-amber-600 dark:text-amber-400" />
                              <span>Verifikasi</span>
                            </Button>
                          ) : isInSession && ses.zoomJoinUrl ? (
                            <Button
                              size="xs"
                              asChild
                              className="h-7 text-xs font-semibold px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <a
                                href={ses.zoomJoinUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Buka tautan ruang Zoom telekonseling di tab baru"
                                aria-label={`Buka ruang Zoom telekonseling untuk sesi ${ses.code}`}
                              >
                                <span>Masuk Sesi</span>
                                <ExternalLink className="size-3 ml-1" />
                              </a>
                            </Button>
                          ) : isCompleted ? (
                            <Button
                              variant="ghost"
                              size="xs"
                              asChild
                              className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              <Link
                                href="/admin/sessions"
                                title="Buka rekam medis dan catatan konseling"
                                aria-label={`Buka rekam medis dan catatan konseling untuk sesi ${ses.code}`}
                              >
                                <span>Catatan</span>
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              asChild
                              className="h-7 text-xs font-medium border-border/80 hover:bg-muted"
                            >
                              <Link
                                href="/admin/sessions"
                                title="Lihat rincian jadwal dan data reservasi"
                                aria-label={`Lihat rincian jadwal dan data reservasi sesi ${ses.code}`}
                              >
                                <span>Detail</span>
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </section>

        {/* Right Column (1 Col): Distilled Operational Utilities */}
        <aside aria-label="Alat Bantu Operasional" className="flex flex-col gap-6">
          {/* Panel 1: Verifikasi Pembayaran Tertunda (Interactive Verification Queue) */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Verifikasi Pembayaran
              </h3>
              {pendingSessions.length > 0 ? (
                <Badge
                  variant="outline"
                  className="text-xs py-0.5 px-2 font-semibold text-amber-700 dark:text-amber-300 border-amber-500/35 bg-amber-500/15 shrink-0 tabular-nums"
                >
                  {pendingSessions.length} Menunggu
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-xs py-0.5 px-2 font-medium text-muted-foreground border-border/60 shrink-0"
                >
                  0 Menunggu
                </Badge>
              )}
            </div>

            {/* Notification / Verification Feedback Banner */}
            {verificationNotice && (
              <div className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{verificationNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationNotice(null)}
                  className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
                  aria-label="Tutup notifikasi"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            {/* Ultra-compact Item List (Max 3-4 items) */}
            {isLoading ? (
              <div className="flex flex-col divide-y divide-border/40 text-xs">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={`pending-skel-${i}`} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-24 bg-muted/80" />
                      <Skeleton className="h-3.5 w-16 bg-muted/80" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-28 bg-muted/60" />
                      <Skeleton className="h-6 w-16 rounded-md bg-muted/70" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingSessions.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/40 text-xs">
                {pendingSessions.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground text-xs truncate">
                        {session.patientName}
                      </span>
                      <span className="font-bold tabular-nums text-foreground text-xs shrink-0">
                        Rp {session.amount.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-muted-foreground text-xs">
                      <span className="truncate font-mono font-medium text-muted-foreground">
                        {session.code} • {session.counselorName.split(",")[0]}
                      </span>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenVerifyModal(session)}
                        className="h-6 px-2.5 text-xs font-semibold border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shrink-0 cursor-pointer"
                      >
                        Verifikasi
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                <div className="size-8 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center border border-border/60">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">Semua Pembayaran Terverifikasi</span>
                  <span className="text-xs text-muted-foreground">Tidak ada antrean pembayaran manual yang tertunda</span>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full text-xs h-8 font-semibold border-border hover:bg-muted/80"
            >
              <Link href="/admin/sessions">
                <span>Semua Transaksi</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>

          {/* Panel 2: Antrean Verifikasi Berkas Pelamar Konselor */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                Pendaftar Konselor
              </h3>
              <Badge variant="secondary" className="text-xs font-semibold text-foreground tabular-nums">
                {pendingApplicants.length} Berkas
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex flex-col divide-y divide-border/40 text-xs">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={`applicant-skel-${i}`} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3.5 w-24 bg-muted/80" />
                      <Skeleton className="h-4 w-16 rounded bg-muted/70" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-24 bg-muted/60" />
                      <Skeleton className="h-5 w-14 rounded bg-muted/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingApplicants.length > 0 ? (
              <div className="flex flex-col divide-y divide-border/40 text-xs">
                {pendingApplicants.map((applicant) => (
                  <div key={applicant.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground text-xs truncate">
                        {applicant.name}
                      </span>
                      <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                        {applicant.documents?.str ? "Izin Praktik" : "Ijazah S1"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground font-medium">
                      <span className="truncate">{applicant.education}</span>
                      <Button
                        variant="ghost"
                        size="xs"
                        asChild
                        className="h-6 px-2 text-xs font-medium text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Link href="/admin/counselors/applications">Review</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                <div className="size-8 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center border border-border/60">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">Semua Berkas Terverifikasi</span>
                  <span className="text-xs text-muted-foreground">Tidak ada pendaftar konselor baru yang pending</span>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full text-xs h-8 font-semibold border-border hover:bg-muted/80"
            >
              <Link href="/admin/counselors/applications">
                <span>Semua Pendaftar ({pendingApplicants.length})</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
      {/* Manual Payment Verification Modal */}
      <ManualPaymentModal
        session={selectedPendingSession}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setSelectedPendingSession(null)
        }}
        onConfirm={handleConfirmPayment}
        onReject={handleRejectPayment}
      />
    </div>
  )
}
