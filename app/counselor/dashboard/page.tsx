import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  Video,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  ExternalLink,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CounselorDashboardPage() {
  const upcomingSessions = [
    {
      id: "b-101",
      patientName: "Dimas Arya",
      timeRange: "19:00 – 20:30 WIB",
      date: "Hari ini, 28 Sep 2026",
      status: "confirmed",
      srqScore: 8,
      initialNotes: "Sering cemas saat presentasi kerja dan insomnia 2 minggu terakhir.",
      zoomStartUrl: "https://zoom.us/s/982341234?tk=counselor-demo",
    },
    {
      id: "b-102",
      patientName: "Adinda Putri",
      timeRange: "13:30 – 15:00 WIB",
      date: "Besok, 29 Sep 2026",
      status: "confirmed",
      srqScore: 5,
      initialNotes: "Butuh ruang bercerita mengenai adaptasi lingkungan kerja baru.",
      zoomStartUrl: "https://zoom.us/s/982341235?tk=counselor-demo",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Sesi Konseling Mendatang</h1>
            <Badge variant="outline" className="text-xs">
              7 Hari Ke Depan
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Daftar sesi terkonfirmasi dengan ringkasan skrining klinis informatif SRQ-20 dan catatan awal pasien.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="gap-2 text-xs h-9">
            <Link href="/counselor/schedules">
              <Calendar className="size-3.5" />
              <span>Buka Jadwal Praktik</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Sesi Terkonfirmasi Hari Ini</CardDescription>
            <CardTitle className="text-2xl font-bold">1 Sesi</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-muted-foreground">19:00 – 20:30 WIB (90 Menit)</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Slot Praktik Tersedia Minggu Ini</CardDescription>
            <CardTitle className="text-2xl font-bold">6 Slot</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/counselor/schedules" className="text-xs text-primary hover:underline font-medium">
              Tambah atau atur jam praktik →
            </Link>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Standar Durasi Sesi</CardDescription>
            <CardTitle className="text-2xl font-bold">90 Menit</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Proteksi jeda istirahat otomatis
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions Section */}
      <div className="flex flex-col gap-4 pt-2">
        <h2 className="text-base font-semibold tracking-tight">Daftar Klien Terjadwal</h2>

        <div className="flex flex-col gap-3">
          {upcomingSessions.map((session) => (
            <Card key={session.id} className="border border-border/80 shadow-xs">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base tracking-tight text-foreground">
                      {session.patientName}
                    </span>
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                      Terkonfirmasi
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Skor SRQ-20: <strong className="text-foreground">{session.srqScore}/20</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Clock className="size-3.5 text-primary" />
                      {session.timeRange}
                    </span>
                    <span>•</span>
                    <span>{session.date}</span>
                  </div>

                  {session.initialNotes && (
                    <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60 max-w-2xl leading-relaxed">
                      <strong className="text-foreground font-medium">Catatan Pasien:</strong> {session.initialNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="gap-2 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <a href={session.zoomStartUrl} target="_blank" rel="noopener noreferrer">
                      <Video className="size-3.5" />
                      <span>Mulai Zoom</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
