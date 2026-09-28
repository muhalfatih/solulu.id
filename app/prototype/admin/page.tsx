"use client"

import * as React from "react"
import Link from "next/link"
import {
  MOCK_APPLICANTS,
  MOCK_SESSIONS,
  BookingSession,
} from "./mock-data"
import {
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  X,
} from "lucide-react"
import {
  ManualPaymentModal,
  type ManualPaymentDetails,
} from "./sessions/components/manual-payment-modal"
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

export default function DistilledAdminDashboard() {
  const [sessionFilter, setSessionFilter] = React.useState<"all" | "in_session" | "confirmed" | "completed">("all")

  // Filter pending applicants for today's review
  const pendingApplicants = MOCK_APPLICANTS.filter((a) => a.status === "pending")

  // Pending payment sessions state for manual verification queue
  const [pendingSessions, setPendingSessions] = React.useState<BookingSession[]>(() => {
    return MOCK_SESSIONS.filter((s) => s.status === "pending_payment")
  })
  const [selectedPendingSession, setSelectedPendingSession] = React.useState<BookingSession | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)
  const [verificationNotice, setVerificationNotice] = React.useState<string | null>(null)

  const handleOpenVerifyModal = (session: BookingSession) => {
    setSelectedPendingSession(session)
    setIsPaymentModalOpen(true)
  }

  const handleConfirmPayment = (session: BookingSession, details: ManualPaymentDetails) => {
    setPendingSessions((prev) => prev.filter((s) => s.id !== session.id))
    setVerificationNotice(
      `Pembayaran sesi ${session.code} (${session.patientName}) senilai Rp ${session.amount.toLocaleString("id-ID")} berhasil diverifikasi via ${details.paymentMethod}.`
    )
    setTimeout(() => {
      setVerificationNotice((cur) => (cur?.includes(session.code) ? null : cur))
    }, 6000)
  }

  // Filter today's sessions (17 Sep 2026)
  const todaySessions = React.useMemo(() => {
    return MOCK_SESSIONS.filter((s) => s.date.includes("17 Sep"))
  }, [])

  // Filtered session list based on active tab
  const displayedSessions = React.useMemo(() => {
    if (sessionFilter === "all") {
      // Sort: in_session first, then confirmed, then completed
      return [...todaySessions].sort((a, b) => {
        const order: Record<string, number> = { in_session: 0, confirmed: 1, completed: 2 }
        return (order[a.status] ?? 3) - (order[b.status] ?? 3)
      })
    }
    return todaySessions.filter((s) => s.status === sessionFilter)
  }, [todaySessions, sessionFilter])

  const inSessionCount = todaySessions.filter((s) => s.status === "in_session").length
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
              <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              <span className="tabular-nums font-semibold">{inSessionCount} Sesi Berjalan</span>
            </Badge>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Kamis, 17 September 2026
          </p>
        </div>
      </header>

      {/* 2. Operational Metrics: Distilled High-Density Essence */}
      <section aria-label="Metrik Operasional Harian" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
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

        {/* Metric 2 */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 transition-colors hover:border-foreground/20">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mitra Konselor
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
              12
            </span>
            <span className="text-xs text-muted-foreground truncate font-medium">
              8 Psikolog Klinis • 4 Konselor Sebaya
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 transition-colors hover:border-amber-500/30">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rekam Medis Tertunda
            </span>
            <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" title="Perlu pengisian catatan klinis" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-bold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
              1
            </span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 truncate">
              Menunggu catatan: <span className="font-mono font-semibold">SL-9279</span>
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-3 transition-colors hover:border-foreground/20">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pendapatan Bulan Ini
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
              Rp 4.850.000
            </span>
            <span className="text-xs text-muted-foreground truncate font-medium">
              Dari <strong className="text-foreground font-semibold">46 sesi</strong> (Sep 2026)
            </span>
          </div>
        </div>
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
                      Semua ({todaySessions.length})
                    </TabsTrigger>
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
            <Table className="w-full min-w-[620px] text-xs">
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow className="border-border/60">
                  <TableHead className="w-[30%] py-3 pl-4 pr-2 font-semibold text-foreground">Pasien</TableHead>
                  <TableHead className="w-[24%] py-3 px-2 font-semibold text-foreground">Konselor</TableHead>
                  <TableHead className="w-[18%] py-3 px-2 font-semibold text-foreground">Jadwal (WIB)</TableHead>
                  <TableHead className="w-[18%] py-3 px-2 font-semibold text-foreground">Ruang & Status</TableHead>
                  <TableHead className="w-[10%] min-w-[80px] py-3 pl-2 pr-4 font-semibold text-foreground text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <CheckCircle2 className="size-5 text-muted-foreground/60 mb-1" />
                        <span className="font-semibold text-foreground">Tidak ada sesi pada filter ini</span>
                        <span className="text-xs text-muted-foreground">Pilih tab filter lain atau kembali ke "Semua" untuk meninjau seluruh jadwal hari ini.</span>
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
                        {/* Patient & Code + Contextual Clinical Indicator */}
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
                                title="Skor skrining mandiri SRQ-20: 12 (Indikasi Risiko Tinggi). Siapkan koordinasi rujukan darurat Hotline 119 ext. 8 jika diperlukan."
                              >
                                SRQ-20: 12 (Risiko Tinggi)
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

                        {/* Unified Room & Operational Status - Single Consolidated Badge */}
                        <TableCell className="py-2.5 px-2 align-middle whitespace-nowrap">
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
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-2.5 pl-2 pr-4 text-right align-middle whitespace-nowrap">
                          {isInSession && ses.zoomJoinUrl ? (
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
                                href="/prototype/admin/sessions"
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
                                href="/prototype/admin/sessions"
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
            {pendingSessions.length > 0 ? (
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
                        className="h-6 px-2.5 text-xs font-semibold border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shrink-0"
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
              <Link href="/prototype/admin/sessions">
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

            <div className="flex flex-col divide-y divide-border/40 text-xs">
              {pendingApplicants.map((applicant) => (
                <div key={applicant.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground text-xs truncate">
                      {applicant.name}
                    </span>
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                      {applicant.documents.str ? "STR" : "Ijazah S1"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground font-medium">
                    <span className="truncate">{applicant.education}</span>
                    <span className="text-muted-foreground shrink-0">{applicant.type}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full text-xs h-8 font-semibold border-border hover:bg-muted/80"
            >
              <Link href="/prototype/admin/counselors">
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
      />
    </div>
  )
}
