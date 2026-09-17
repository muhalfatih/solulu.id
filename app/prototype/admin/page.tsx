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
  Lock,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  FileCheck,
  CalendarDays,
  CreditCard,
  UserCheck,
} from "lucide-react"
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

export default function LayoutRefinedAdminDashboard() {
  const pendingApplicants = MOCK_APPLICANTS.filter((a) => a.status === "pending")
  const liveSessions = MOCK_SESSIONS.filter((s) => s.status === "in_session" || s.hoursUntilSession <= 4)
  const highRiskSessions = MOCK_SESSIONS.filter((s) => s.hasSuicidalThoughts || s.srqScore >= 6)

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-7 pb-12">
      {/* Header: Confident, balanced baseline alignment */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Operasional Hari Ini
          </h1>
          <p className="text-sm text-muted-foreground">
            Kamis, 17 September 2026 • 2 sesi aktif pada ruang telekonseling terenkripsi
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs font-medium">
            <Link href="/prototype/admin/sessions">
              <span>Semua Jadwal</span>
              <ArrowRight className="size-3 ml-1.5" />
            </Link>
          </Button>
          <Button size="sm" asChild className="h-8 text-xs font-medium">
            <Link href="/prototype/admin/counselors">
              <span>Audit Berkas ({pendingApplicants.length})</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Critical Triage Notice (Conditional, immediate visual priority) */}
      {highRiskSessions.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="size-4.5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span>Triage Klinis: {highRiskSessions.length} Sesi Terindikasi Risiko Tinggi</span>
                <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                  SRQ-20 &gt; 6
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Sesi <span className="font-mono font-medium text-foreground">{highRiskSessions[0].code}</span> ({highRiskSessions[0].patientName}) memiliki skor {highRiskSessions[0].srqScore}/20 dengan persetujuan tindakan darurat (*waiver*) aktif.
              </div>
            </div>
          </div>
          <Button variant="outline" size="xs" asChild className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 h-8 px-3">
            <a href={highRiskSessions[0].zoomJoinUrl} target="_blank" rel="noreferrer">
              <span>Pantau Ruang Konseling</span>
              <ExternalLink className="size-3 ml-1.5" />
            </a>
          </Button>
        </div>
      )}

      {/* Metrics Ribbon: Structured 4-column panel with deliberate rhythmic spacing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        {/* Metric 1 */}
        <div className="flex flex-col gap-1.5 pr-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5 text-primary shrink-0" />
            <span>Sesi Hari Ini</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">8</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">2 live</span>
          </div>
          <span className="text-[11px] text-muted-foreground">4 tuntas • 2 terjadwal malam</span>
        </div>

        {/* Metric 2 */}
        <div className="flex flex-col gap-1.5 sm:border-l sm:border-border sm:pl-5 pr-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CreditCard className="size-3.5 text-primary shrink-0" />
            <span>Omzet Berjalan</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">Rp 4,85 Jt</span>
          </div>
          <span className="text-[11px] text-muted-foreground">46 sesi selesai via Xendit</span>
        </div>

        {/* Metric 3 */}
        <div className="flex flex-col gap-1.5 lg:border-l lg:border-border lg:pl-5 pr-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5 text-primary shrink-0" />
            <span>Reservasi Hold</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">2</span>
            <span className="text-xs text-muted-foreground">menunggu bayar</span>
          </div>
          <span className="text-[11px] text-muted-foreground">Kunci slot 15m otomatis aktif</span>
        </div>

        {/* Metric 4 */}
        <div className="flex flex-col gap-1.5 sm:border-l sm:border-border sm:pl-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <UserCheck className="size-3.5 text-primary shrink-0" />
            <span>Antrean Berkas Mitra</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{pendingApplicants.length}</span>
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Perlu Audit</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Kualifikasi KTP, STR & Ijazah</span>
        </div>
      </div>

      {/* Main Operations Area: Perfectly aligned top baseline between left & right columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Realtime Session Triage Surface */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            {/* Integrated Header Toolbar (aligned with right sidebar card header) */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <Video className="size-4 text-primary shrink-0" />
                <h2 className="text-sm font-semibold text-foreground">
                  Jadwal Sesi Mendekati Waktu
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {liveSessions.length} sesi prioritas
                </span>
                <Button variant="ghost" size="xs" asChild className="h-7 text-xs font-medium">
                  <Link href="/prototype/admin/sessions">
                    <span>Semua Sesi</span>
                    <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Session Table */}
            <Table className="text-xs">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="py-2.5 px-4 font-medium">Sesi & Pasien</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Mitra Konselor</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Waktu (WIB)</TableHead>
                  <TableHead className="py-2.5 px-3 font-medium">Ruang Zoom</TableHead>
                  <TableHead className="py-2.5 px-4 font-medium text-right">Akses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveSessions.map((ses) => (
                  <TableRow key={ses.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">{ses.code}</span>
                        {ses.hasSuicidalThoughts && (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1 font-medium">
                            Waiver
                          </Badge>
                        )}
                      </div>
                      <div className="text-foreground font-medium mt-0.5">{ses.patientName}</div>
                      <div className="text-[11px] text-muted-foreground">SRQ: {ses.srqScore}/20</div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3">
                      <div className="text-foreground font-medium">{ses.counselorName}</div>
                      <div className="text-[10px] text-muted-foreground">{ses.counselorType}</div>
                    </TableCell>

                    <TableCell className="py-3.5 px-3 font-medium tabular-nums text-foreground">
                      {ses.timeRange}
                    </TableCell>

                    <TableCell className="py-3.5 px-3">
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

                    <TableCell className="py-3.5 px-4 text-right">
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

        {/* Right 1 Col: Infrastructure Guard & Verification Queue */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Zoom Infrastructure Status */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Status Ruang Zoom (2/2)</h3>
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

            <div className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/70 leading-relaxed">
              Safety lock aktif otomatis untuk menjaga ketersediaan tautan meeting sesi aktif (ADR-0001).
            </div>
          </div>

          {/* Card 2: Pending Counselor Audits */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Menunggu Verifikasi</h3>
              </div>
              <span className="text-[10px] tabular-nums font-semibold px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground">
                {pendingApplicants.length} berkas
              </span>
            </div>

            <div className="flex flex-col divide-y divide-border text-xs">
              {pendingApplicants.map((applicant) => (
                <div key={applicant.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{applicant.name}</span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal">
                      {applicant.type}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate">{applicant.education}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" asChild className="w-full text-xs h-8">
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


