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
  ExternalLink,
  User,
  Phone,
  Mail,
  Loader2,
  Sparkles,
  ClipboardList,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Sesi Konseling Mendatang</h1>
            <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
              7 Hari Ke Depan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Daftar sesi terkonfirmasi dengan ringkasan skrining klinis informatif SRQ-20 dan catatan awal pasien.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="gap-2 text-xs h-9" id="btn-open-schedules">
            <Link href="/counselor/schedules">
              <Calendar className="size-3.5" />
              <span>Kelola Jadwal Praktik</span>
              <ArrowRight className="size-3.5" />
            </Link>
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

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sesi Terkonfirmasi
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
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
              <ClipboardList className="size-4" />
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
              <ShieldAlert className="size-4" />
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

        <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Standar Durasi
            </span>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              90 Menit
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Jeda istirahat & proteksi jadwal</span>
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
                <Calendar className="size-6" />
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

              return (
                <Card
                  key={session.id}
                  id={`session-card-${session.id}`}
                  className="border border-border/80 shadow-xs hover:border-foreground/20 hover:shadow-xs transition-all"
                >
                  <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
                    {/* Header Row: Patient & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                          {session.patientName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-base tracking-tight text-foreground">
                            {session.patientName}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="size-3 text-muted-foreground" />
                              {session.patientPhone}
                            </span>
                            <Separator orientation="vertical" className="h-3 mx-0.5" />
                            <span className="flex items-center gap-1">
                              <Mail className="size-3 text-muted-foreground" />
                              {session.patientEmail}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isConfirmed && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1.5 py-1 px-2.5 font-medium"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Terkonfirmasi
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-muted text-muted-foreground border-border gap-1.5 py-1 px-2.5 font-medium"
                          >
                            <ClipboardList className="size-3.5" />
                            Selesai
                          </Badge>
                        )}
                        {session.hasReport ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 py-1 px-2.5 font-medium"
                          >
                            Catatan Sesi Tersimpan
                          </Badge>
                        ) : isCompleted ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 py-1 px-2.5 font-medium"
                          >
                            Laporan Belum Diisi
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {/* Clinical Alert & Triage Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {session.srqScore !== null && (
                        <span className="px-2.5 py-1 rounded-lg bg-muted/60 border border-border/70 text-muted-foreground font-medium">
                          Skor SRQ-20: <strong className="text-foreground font-semibold">{session.srqScore}/20</strong>
                        </span>
                      )}

                      {session.hasSuicidalThoughts && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive font-semibold">
                          <ShieldAlert className="size-3.5 shrink-0" />
                          <span>Peringatan Klinis: Indikasi Ide Bunuh Diri (Q-17 Ya)</span>
                        </span>
                      )}

                      {session.bypassedRecommendation && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium">
                          Pilihan Mandiri Klien (Bypass Rekomendasi)
                        </span>
                      )}
                    </div>

                    {/* Schedule Time & Patient Notes */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs pt-1">
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/70 font-semibold text-foreground">
                          <Clock className="size-3.5 text-primary" />
                          {session.timeRange}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/70 text-muted-foreground font-medium">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          {session.date}
                        </span>
                      </div>

                      {session.initialNotes && (
                        <div className="text-xs text-muted-foreground leading-relaxed flex-1 sm:text-right">
                          <span className="font-semibold text-foreground">Keluhan Awal: </span>
                          <span className="italic">&ldquo;{session.initialNotes}&rdquo;</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60 flex-wrap">
                      <div>
                        {session.zoomStartUrl && isConfirmed && (
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                            id={`btn-zoom-${session.id}`}
                          >
                            <a href={session.zoomStartUrl} target="_blank" rel="noopener noreferrer">
                              <Video className="size-3.5" />
                              <span>Mulai Sesi Zoom</span>
                              <ExternalLink className="size-3 opacity-80" />
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isConfirmed && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs h-9 border-border hover:bg-muted font-medium"
                            disabled={completingId === session.id}
                            onClick={() => handleCompleteAndReport(session.id)}
                            id={`btn-complete-${session.id}`}
                          >
                            {completingId === session.id ? (
                              <>
                                <Loader2 className="size-3.5 animate-spin" />
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="size-3.5 text-primary" />
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
                            className="gap-2 text-xs h-9 font-medium"
                            id={`btn-report-${session.id}`}
                          >
                            <Link href={`/counselor/reports/${session.id}`}>
                              <FileEdit className="size-3.5" />
                              <span>{session.hasReport ? "Lihat / Edit Catatan Sesi" : "Tulis Catatan Sesi"}</span>
                              <ArrowRight className="size-3" />
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
    </div>
  )
}
