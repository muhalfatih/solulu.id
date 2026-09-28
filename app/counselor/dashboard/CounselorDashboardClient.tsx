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
import { completeSessionAndOpenReportAction } from "@/app/counselor/actions"
import type { CounselorUpcomingSessionView } from "@/lib/counselor/types"

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
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Sesi Terkonfirmasi</CardDescription>
            <CardTitle className="text-2xl font-bold">{confirmedCount} Sesi</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Siap dilaksanakan via Zoom S2S</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Selesai / Laporan</CardDescription>
            <CardTitle className="text-2xl font-bold">{completedCount} Sesi</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">Catatan klinis terarsip privat</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Perhatian Klinis (SRQ-20)</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {highRiskCount} Pasien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium">
              Indikasi ide bunuh diri / skor tinggi
            </span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Standar Durasi</CardDescription>
            <CardTitle className="text-2xl font-bold">90 Menit</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Jeda istirahat & proteksi jadwal
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Session List */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base font-semibold tracking-tight">Daftar Klien Terjadwal</h2>

          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({sessions.length})
            </button>
            <button
              onClick={() => setFilter("confirmed")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === "confirmed"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Terkonfirmasi ({confirmedCount})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === "completed"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Selesai ({completedCount})
            </button>
          </div>
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
                  className="border border-border/80 shadow-xs hover:border-border transition-colors"
                >
                  <CardContent className="p-5 flex flex-col gap-4">
                    {/* Header Row: Patient & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {session.patientName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-base tracking-tight text-foreground">
                            {session.patientName}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="size-3 text-muted-foreground" />
                              {session.patientPhone}
                            </span>
                            <span>•</span>
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
                            className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1"
                          >
                            <CheckCircle2 className="size-3" />
                            Terkonfirmasi
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-muted text-muted-foreground border-border gap-1"
                          >
                            <ClipboardList className="size-3" />
                            Selesai
                          </Badge>
                        )}
                        {session.hasReport ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                          >
                            Catatan Sesi Tersimpan
                          </Badge>
                        ) : isCompleted ? (
                          <Badge
                            variant="outline"
                            className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          >
                            Laporan Belum Diisi
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {/* Clinical Alert & Triage Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {session.srqScore !== null && (
                        <span className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/60 text-muted-foreground font-medium">
                          Skor SRQ-20: <strong className="text-foreground">{session.srqScore}/20</strong>
                        </span>
                      )}

                      {session.hasSuicidalThoughts && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/30 text-destructive font-semibold">
                          <ShieldAlert className="size-3.5" />
                          <span>Peringatan Klinis: Indikasi Ide Bunuh Diri (Q-17 Ya)</span>
                        </span>
                      )}

                      {session.bypassedRecommendation && (
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium">
                          Pilihan Mandiri Klien (Bypass Rekomendasi)
                        </span>
                      )}
                    </div>

                    {/* Schedule Time & Patient Notes */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/30 p-3 rounded-xl border border-border/60">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Clock className="size-3.5 text-primary" />
                          {session.timeRange}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="size-3.5" />
                          {session.date}
                        </span>
                      </div>

                      {session.initialNotes && (
                        <div className="text-xs text-muted-foreground max-w-xl truncate">
                          <span className="font-semibold text-foreground">Keluhan: </span>
                          <span>{session.initialNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40 flex-wrap">
                      <div className="flex items-center gap-2">
                        {session.zoomStartUrl && isConfirmed && (
                          <Button
                            asChild
                            variant="default"
                            size="sm"
                            className="gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            id={`btn-zoom-${session.id}`}
                          >
                            <a href={session.zoomStartUrl} target="_blank" rel="noopener noreferrer">
                              <Video className="size-3.5" />
                              <span>Mulai Zoom</span>
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
                            className="gap-2 text-xs h-9 border-primary/30 text-primary hover:bg-primary/10"
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
                                <CheckCircle2 className="size-3.5" />
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
                            className="gap-2 text-xs h-9"
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
