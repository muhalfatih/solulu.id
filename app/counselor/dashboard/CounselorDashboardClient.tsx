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
} from "lucide-react"
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
import { completeSessionAndOpenReportAction } from "@/app/counselor/actions"
import type { CounselorUpcomingSessionView } from "@/lib/counselor/types"

import { cn } from "@/lib/utils"

interface CounselorDashboardClientProps {
  initialSessions: CounselorUpcomingSessionView[]
}

export function CounselorDashboardClient({ initialSessions }: CounselorDashboardClientProps) {
  const router = useRouter()
  const [sessions, setSessions] = React.useState<CounselorUpcomingSessionView[]>(initialSessions)
  const [filter, setFilter] = React.useState<"all" | "confirmed" | "completed">("all")
  const [completingId, setCompletingId] = React.useState<string | null>(null)
  const [confirmSession, setConfirmSession] = React.useState<CounselorUpcomingSessionView | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const isToday = React.useCallback((dateStr: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dateStr === today || dateStr.startsWith(today)
  }, [])

  const filteredSessions = React.useMemo(() => {
    if (filter === "all") return sessions
    return sessions.filter((s) => s.status === filter)
  }, [sessions, filter])

  const confirmedCount = sessions.filter((s) => s.status === "confirmed").length
  const completedCount = sessions.filter((s) => s.status === "completed").length
  const highRiskCount = sessions.filter((s) => s.hasSuicidalThoughts).length

  const handleCompleteAndReport = async (bookingId: string) => {
    setCompletingId(bookingId)
    setErrorMessage(null)
    try {
      const res = await completeSessionAndOpenReportAction(bookingId)
      if (res.success && res.data?.redirectUrl) {
        // Update local state to completed
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
    <div className="flex flex-col gap-6">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-1 pb-5 border-b border-border/60">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sesi Konseling Mendatang</h1>
          <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border/70 font-medium">
            7 Hari Ke Depan
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Sesi konseling terjadwal dan ringkasan klinis pasien.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium"
        >
          {errorMessage}
        </div>
      )}

      {/* Grid Overview Cards - 3 Pure Dynamic Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sesi Terkonfirmasi
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {confirmedCount} Sesi
            </span>
            <span className="text-xs text-muted-foreground">Siap dilaksanakan via Zoom S2S</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Selesai / Laporan
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
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

        <div
          className={cn(
            "p-4 rounded-xl border shadow-xs flex flex-col justify-between gap-3 transition-colors",
            highRiskCount > 0
              ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
              : "border-border/80 bg-card"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Perhatian Klinis (SRQ)
            </span>
            <div className="size-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="size-4" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400 tabular-nums">
              {highRiskCount} Pasien
            </span>
            <span className="text-xs text-amber-700/80 dark:text-amber-400/80">
              {highRiskCount > 0 ? "Indikasi ide bunuh diri / skor tinggi" : "Tidak ada pasien risiko tinggi"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Session List */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold tracking-tight">Daftar Klien Terjadwal</h2>

          <Tabs value={filter} onValueChange={(val) => setFilter(val as "all" | "confirmed" | "completed")}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-2.5">
                Semua ({sessions.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="text-xs px-2.5">
                Terkonfirmasi ({confirmedCount})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-2.5">
                Selesai ({completedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredSessions.length === 0 ? (
          <Card className="border border-dashed border-border/80 bg-muted/20">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Calendar className="size-6" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <p className="text-sm font-semibold">Belum Ada Sesi pada Kategori Ini</p>
                <p className="text-xs text-muted-foreground">
                  Pastikan Anda telah membuka slot jadwal praktik agar pasien dapat memesan sesi konseling.
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
              const isConfirmed = session.status === "confirmed"
              const isCompleted = session.status === "completed"
              const isSessionToday = isToday(session.date)

              return (
                <Card
                  key={session.id}
                  id={`session-card-${session.id}`}
                  className={cn(
                    "border border-border/80 shadow-xs hover:border-foreground/20 hover:shadow-xs transition-all",
                    isSessionToday && isConfirmed && "border-primary/40 ring-1 ring-primary/10"
                  )}
                >
                  <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
                    {/* Top Row: Time/Date & Status Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {isSessionToday && (
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
                        {isConfirmed && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-0.5 px-2.5 font-medium"
                          >
                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                            Terkonfirmasi
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs gap-1.5 py-0.5 px-2.5 font-medium",
                              session.hasReport
                                ? "bg-muted text-muted-foreground border-border/70"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            )}
                          >
                            <ClipboardList className="size-3.5" aria-hidden="true" />
                            <span>{session.hasReport ? "Selesai • Laporan Tersimpan" : "Selesai • Perlu Laporan"}</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Patient Identity & Contact */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20"
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
                      <div>
                        {session.zoomStartUrl && isConfirmed && (
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            id={`btn-zoom-${session.id}`}
                          >
                            <a
                              href={session.zoomStartUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Mulai Sesi Zoom di tab baru"
                            >
                              <Video className="size-3.5" aria-hidden="true" />
                              <span>Mulai Sesi Zoom</span>
                              <span className="sr-only">(buka di tab baru)</span>
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isConfirmed && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs h-9 border-border hover:bg-muted font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs h-9 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            id={`btn-report-${session.id}`}
                          >
                            <Link href={`/counselor/reports/${session.id}`}>
                              <FileEdit className="size-3.5" aria-hidden="true" />
                              <span>{session.hasReport ? "Lihat / Edit Catatan Sesi" : "Tulis Catatan Sesi"}</span>
                              <ArrowRight className="size-3" aria-hidden="true" />
                            </Link>
                          </Button>
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
    </div>
  )
}
