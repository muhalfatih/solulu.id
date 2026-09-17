"use client"

import * as React from "react"
import Link from "next/link"
import {
  MOCK_METRICS,
  MOCK_ZOOM_ACCOUNTS,
  MOCK_APPLICANTS,
  MOCK_SESSIONS,
} from "./mock-data"
import {
  Video,
  ShieldAlert,
  Users,
  Calendar,
  DollarSign,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
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

export default function FreshAdminDashboard() {
  const [applicants, setApplicants] = React.useState(MOCK_APPLICANTS)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const handleApprove = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "approved" as const } : app))
    )
    showToast(`✅ Undangan Supabase Auth terkirim otomatis ke ${name}`)
  }

  const handleReject = (id: string, name: string) => {
    setApplicants((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: "rejected" as const } : app))
    )
    showToast(`❌ Pelamar ${name} ditandai sebagai ditolak`)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-7">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-card border border-primary/40 text-foreground text-xs shadow-md animate-in fade-in flex items-center justify-between">
          <span>{toastMessage}</span>
          <Button variant="ghost" size="xs" onClick={() => setToastMessage(null)}>
            ✕
          </Button>
        </div>
      )}

      {/* Top Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ringkasan Operasional & Monitoring Realtime
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Status kapasitas 2 akun Zoom Pro, pemantauan transaksi hold 15m, dan alur sesi pasien hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/40 border border-border px-3 py-1.5 rounded-xl">
          <Clock className="size-3.5 text-primary" />
          <span>Kamis, 17 September 2026 (WIB)</span>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Metrik utama operasional">
        {MOCK_METRICS.map((stat, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              <div className="p-2 rounded-xl bg-muted text-foreground">
                {i === 0 && <Calendar className="size-4 text-primary" />}
                {i === 1 && <DollarSign className="size-4 text-primary" />}
                {i === 2 && <Lock className="size-4 text-amber-500" />}
                {i === 3 && <Users className="size-4 text-sky-500" />}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex flex-col gap-1">
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {stat.value}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{stat.subtext}</span>
                {stat.trend && (
                  <Badge variant={stat.trendUp ? "default" : "secondary"} className="text-[10px] py-0 px-1.5">
                    {stat.trend}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* 2-Column Split: Left = Live Sessions & Schedule | Right = Zoom Safety Lock & Applicants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Sesi Monitoring */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col gap-4 p-6 shadow-xs">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Video className="size-4 text-primary" />
                  <span>Sesi Hari Ini & Triage Klinis</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Durasi fixed 90 menit • Terhubung otomatis ke Zoom Host & Link Pasien
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold">
                <Link href="/prototype/admin/sessions">
                  <span>Kelola Semua</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardHeader>

            {/* Table of Sessions */}
            <div className="rounded-xl border border-border overflow-hidden">
              <Table className="text-xs">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="py-3 px-3">Kode</TableHead>
                    <TableHead className="py-3 px-3">Pasien & Kontak</TableHead>
                    <TableHead className="py-3 px-3">Mitra Konselor</TableHead>
                    <TableHead className="py-3 px-3">Jadwal (90m)</TableHead>
                    <TableHead className="py-3 px-3">Ruang Zoom</TableHead>
                    <TableHead className="py-3 px-3 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_SESSIONS.map((ses) => (
                    <TableRow key={ses.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="py-3.5 px-3 font-mono font-bold text-primary">
                        {ses.code}
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="font-semibold text-foreground">{ses.patientName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          SRQ: {ses.srqScore}/20
                          {ses.hasSuicidalThoughts && (
                            <span className="ml-1 text-destructive font-bold">
                              [Waiver ✓]
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <div className="text-foreground font-medium">{ses.counselorName}</div>
                        <div className="text-[10px] text-muted-foreground">{ses.counselorType}</div>
                      </TableCell>
                      <TableCell className="py-3.5 px-3 font-medium text-foreground">
                        {ses.timeRange}
                      </TableCell>
                      <TableCell className="py-3.5 px-3">
                        <Badge
                          variant={ses.status === "in_session" ? "default" : "outline"}
                          className="flex items-center gap-1.5 py-0.5 px-2 text-[10px]"
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              ses.status === "in_session" ? "bg-emerald-400 animate-ping" : "bg-muted-foreground"
                            }`}
                          />
                          <span>{ses.zoomRoom}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3.5 px-3 text-right">
                        <Button variant="outline" size="xs" asChild>
                          <a href={ses.zoomJoinUrl} target="_blank" rel="noreferrer">
                            <span>Buka Zoom</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Zoom Safety Lock & Verification Widget */}
        <div className="flex flex-col gap-4">
          {/* Widget: Zoom Safety Lock */}
          <Card className="p-5 flex flex-col gap-3.5 shadow-xs">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-500" />
                <span>Zoom Safety Lock</span>
              </CardTitle>
              <Button variant="ghost" size="xs" asChild>
                <Link href="/prototype/admin/zoom">Detail →</Link>
              </Button>
            </CardHeader>
            <CardDescription className="text-xs leading-relaxed">
              Kredensial akun Zoom dikunci otomatis agar tidak dapat diedit atau dihapus jika
              ada sesi aktif/mendatang yang terikat.
            </CardDescription>

            <div className="flex flex-col gap-2.5 pt-1">
              {MOCK_ZOOM_ACCOUNTS.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-muted/30 border border-border text-xs flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>{acc.name}</span>
                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                      <Lock className="size-3" />
                      <span>LOCKED</span>
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">{acc.email}</div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-300 leading-tight">
                    {acc.safetyLock.reason}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Widget: Pending Counselor Verification */}
          <Card className="p-5 flex flex-col gap-3.5 shadow-xs">
            <CardHeader className="p-0 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="size-4 text-sky-500" />
                <span>Verifikasi Pelamar</span>
              </CardTitle>
              <Button variant="ghost" size="xs" asChild>
                <Link href="/prototype/admin/counselors">Buka Pipeline →</Link>
              </Button>
            </CardHeader>

            <div className="flex flex-col gap-3 pt-1">
              {applicants.map((app) => (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col gap-2 transition-all ${
                    app.status === "approved"
                      ? "bg-primary/10 border-primary/30"
                      : app.status === "rejected"
                      ? "bg-destructive/10 border-destructive/30 opacity-60"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-foreground">{app.name}</div>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 mt-0.5">
                        {app.type}
                      </Badge>
                    </div>
                    {app.status === "approved" && (
                      <Badge variant="default" className="text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Disetujui
                      </Badge>
                    )}
                    {app.status === "rejected" && (
                      <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
                        <XCircle className="size-3" /> Ditolak
                      </Badge>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground line-clamp-2">
                    {app.bio}
                  </div>

                  {app.status === "pending" && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                      <Button
                        size="xs"
                        onClick={() => handleApprove(app.id, app.name)}
                        className="flex-1 text-[11px]"
                      >
                        Setujui & Undang
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleReject(app.id, app.name)}
                        className="text-[11px] text-destructive hover:bg-destructive/10"
                      >
                        Tolak
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
