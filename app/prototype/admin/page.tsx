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
  ShieldCheck,
  Users,
  Calendar,
  Lock,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  FileCheck,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

export default function DistilledAdminDashboard() {
  const pendingApplicantsCount = MOCK_APPLICANTS.filter((a) => a.status === "pending").length
  const liveSessions = MOCK_SESSIONS.filter((s) => s.status === "in_session" || s.hoursUntilSession <= 4)
  const highRiskSessions = MOCK_SESSIONS.filter((s) => s.hasSuicidalThoughts || s.srqScore >= 6)

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-10">
      {/* Header: Clean, confident, zero-kicker */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Operasional Hari Ini
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kamis, 17 September 2026 • 2 sesi aktif pada ruang Zoom Pro terenkripsi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs font-medium">
            <Link href="/prototype/admin/sessions">
              <span>Semua Sesi</span>
              <ArrowRight className="size-3 ml-1" />
            </Link>
          </Button>
          <Button size="sm" asChild className="h-8 text-xs font-medium">
            <Link href="/prototype/admin/counselors">
              <span>Verifikasi ({pendingApplicantsCount})</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Critical Triage Notice (Only appears when attention is required) */}
      {highRiskSessions.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                Triage Klinis: {highRiskSessions.length} Sesi Terindikasi Risiko Tinggi (SRQ-20)
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Sesi <span className="font-mono font-medium text-foreground">{highRiskSessions[0].code}</span> ({highRiskSessions[0].patientName}) memiliki skor SRQ {highRiskSessions[0].srqScore}/20 dengan persetujuan tindakan darurat (waiver) aktif.
              </div>
            </div>
          </div>
          <Button variant="outline" size="xs" asChild className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10">
            <a href={highRiskSessions[0].zoomJoinUrl} target="_blank" rel="noreferrer">
              <span>Pantau Ruang</span>
              <ExternalLink className="size-3 ml-1" />
            </a>
          </Button>
        </div>
      )}

      {/* Distilled Metrics Ribbon: No bloated nested boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-card border border-border">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Sesi Hari Ini</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">8</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">2 sedang live</span>
          </div>
          <span className="text-[11px] text-muted-foreground">4 tuntas • 2 terjadwal malam</span>
        </div>

        <div className="flex flex-col gap-1 sm:border-l sm:border-border sm:pl-4">
          <span className="text-xs font-medium text-muted-foreground">Omzet Berjalan (Bulan Ini)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">Rp 4,85 Jt</span>
          </div>
          <span className="text-[11px] text-muted-foreground">46 sesi terselesaikan via Xendit</span>
        </div>

        <div className="flex flex-col gap-1 lg:border-l lg:border-border lg:pl-4">
          <span className="text-xs font-medium text-muted-foreground">Reservasi Hold 15m</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">2</span>
            <span className="text-xs text-muted-foreground">menunggu pembayaran</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Kunci slot otomatis aktif</span>
        </div>

        <div className="flex flex-col gap-1 sm:border-l sm:border-border sm:pl-4">
          <span className="text-xs font-medium text-muted-foreground">Antrean Berkas Mitra</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{pendingApplicantsCount}</span>
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Perlu Audit</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Kualifikasi KTP, STR & Ijazah</span>
        </div>
      </div>

      {/* Main Operational Flow: Clean 2-column layout without nested card fatigue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Realtime Session Triage */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="size-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Jadwal Sesi Mendekati Waktu</h2>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              Menampilkan {liveSessions.length} sesi prioritas
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="py-2.5 px-3 font-medium">Sesi & Pasien</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Mitra Konselor</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Waktu (WIB)</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Ruang Zoom</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium text-right">Akses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveSessions.map((ses) => (
                  <TableRow key={ses.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">{ses.code}</span>
                        {ses.hasSuicidalThoughts && (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1">
                            Waiver
                          </Badge>
                        )}
                      </div>
                      <div className="text-foreground font-medium mt-0.5">{ses.patientName}</div>
                      <div className="text-[11px] text-muted-foreground">SRQ: {ses.srqScore}/20</div>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <div className="text-foreground font-medium">{ses.counselorName}</div>
                      <div className="text-[10px] text-muted-foreground">{ses.counselorType}</div>
                    </TableCell>

                    <TableCell className="py-3 px-3 font-medium tabular-nums text-foreground">
                      {ses.timeRange}
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <Badge
                        variant={ses.status === "in_session" ? "default" : "outline"}
                        className="text-[10px] py-0.5 px-1.5 inline-flex items-center gap-1.5"
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            ses.status === "in_session"
                              ? "bg-emerald-400 animate-pulse"
                              : "bg-muted-foreground"
                          }`}
                        />
                        <span>{ses.zoomRoom}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 px-3 text-right">
                      <Button variant="outline" size="xs" asChild className="h-7 text-xs">
                        <a href={ses.zoomJoinUrl} target="_blank" rel="noreferrer">
                          <span>Zoom</span>
                          <ExternalLink className="size-3 ml-1" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right 1 Col: Infrastructure Guard & Pending Audits */}
        <div className="flex flex-col gap-6">
          {/* Zoom Infrastructure Status */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Status Zoom Pro (2/2)</h3>
              </div>
              <Button variant="ghost" size="xs" asChild className="h-6 text-xs text-muted-foreground hover:text-foreground">
                <Link href="/prototype/admin/zoom">Detail</Link>
              </Button>
            </div>

            <div className="flex flex-col divide-y divide-border text-xs">
              {MOCK_ZOOM_ACCOUNTS.map((acc) => (
                <div key={acc.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{acc.name.replace("Akun ", "")}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{acc.email}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                    <Lock className="size-2.5" />
                    <span>Locked</span>
                  </Badge>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border leading-relaxed">
              Safety lock aktif otomatis untuk menjaga ketersediaan tautan meeting sesi aktif (ADR-0001).
            </div>
          </div>

          {/* Pending Counselor Audits */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Menunggu Verifikasi</h3>
              </div>
              <Badge variant="secondary" className="text-[10px] tabular-nums">
                {pendingApplicantsCount} berkas
              </Badge>
            </div>

            <div className="flex flex-col divide-y divide-border text-xs">
              {MOCK_APPLICANTS.filter((a) => a.status === "pending").map((applicant) => (
                <div key={applicant.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{applicant.name}</span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1">
                      {applicant.type}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate">{applicant.education}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" asChild className="w-full text-xs">
              <Link href="/prototype/admin/counselors">
                <span>Buka Pipeline Verifikasi Dokumen</span>
                <ArrowRight className="size-3 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

