"use client"

import * as React from "react"
import {
  CheckCircle2,
  FileText,
  Printer,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
  Lock,
  FileCheck,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type {
  SessionBookingData,
  SessionCounselorData,
  SessionScheduleData,
  ClientSessionReportView,
} from "@/lib/session/types"

interface CompletedSessionReportCardProps {
  booking: SessionBookingData
  counselor: SessionCounselorData
  schedule: SessionScheduleData
  report?: ClientSessionReportView | null
  hasReport?: boolean
  onOpenUnlockModal?: () => void
}

export function CompletedSessionReportCard({
  booking,
  counselor,
  schedule,
  report,
  hasReport = false,
  onOpenUnlockModal,
}: CompletedSessionReportCardProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Card
      id="card-session-report"
      className="rounded-3xl border border-violet-100 dark:border-border/80 shadow-[0_16px_40px_-12px_rgba(124,58,237,0.08)] bg-card/95 backdrop-blur-sm overflow-hidden print:border-none print:shadow-none print:rounded-none print:m-0 print:p-0"
    >
      {/* Printable Clinical Header */}
      <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border-b border-border/60 pb-5 print:bg-none print:border-b-2 print:border-foreground/80 print:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 print:hidden">
              <CheckCircle2 className="size-6" />
            </div>
            <div className="flex flex-col">
              {/* Official Clinic Heading for Print */}
              <span className="hidden print:block text-xs font-bold uppercase tracking-widest text-muted-foreground pb-0.5">
                Klinik Telekonseling Solulu Mental Health • Dokumen Resmi
              </span>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold tracking-tight text-foreground print:text-xl font-heading">
                  Laporan Resmi Sesi Konseling
                </CardTitle>
                <Badge
                  variant="outline"
                  className="rounded-full text-[11px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-semibold print:border-foreground/50 print:text-foreground"
                >
                  Completed
                </Badge>
              </div>
              <CardDescription className="text-xs print:text-[11px]">
                Dokumen ringkasan telekonseling klinis untuk arsip pribadi klien.
              </CardDescription>
            </div>
          </div>

          {report && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 text-xs h-9 px-4 font-medium self-start sm:self-auto print:hidden rounded-full border-border/80 hover:bg-muted/60"
              id="btn-print-client-report"
            >
              <Printer className="size-3.5" data-icon="inline-start" />
              <span>Cetak / Simpan sebagai PDF</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 flex flex-col gap-6 print:p-0 print:pt-4">
        {/* Session Meta Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/70 text-xs print:bg-transparent print:border print:border-foreground/30 print:p-3">
          <div className="flex items-center gap-2.5">
            <User className="size-4 text-primary shrink-0 print:hidden" />
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[11px]">Nama Klien:</span>
              <strong className="text-foreground truncate font-medium">{booking.patientName}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="size-4 text-primary shrink-0 print:hidden" />
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[11px]">Jadwal Sesi:</span>
              <strong className="text-foreground truncate font-medium">{schedule.formattedDate}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="size-4 text-primary shrink-0 print:hidden" />
            <div className="flex flex-col min-w-0">
              <span className="text-muted-foreground text-[11px]">Waktu Sesi:</span>
              <strong className="text-foreground truncate font-medium">{schedule.timeRange}</strong>
            </div>
          </div>
        </div>

        {report ? (
          /* UNLOCKED OFFICIAL CLINICAL REPORT */
          <div className="flex flex-col gap-5 print:gap-4">
            {/* Permasalahan Utama (*Main Issue*) */}
            <div
              id="report-main-issue-block"
              className="flex flex-col gap-1.5 p-4 rounded-xl border border-primary/20 bg-primary/5 print:bg-transparent print:border-foreground/30 print:p-3 print:break-inside-avoid"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5 print:text-foreground">
                  <Sparkles className="size-3.5 print:hidden" />
                  Permasalahan Utama (*Main Issue*)
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-background print:border-foreground/30"
                >
                  Fokus Klinis
                </Badge>
              </div>
              <p
                id="report-main-issue-text"
                className="text-base font-semibold text-foreground pt-0.5 leading-snug print:text-sm"
              >
                {report.mainIssue}
              </p>
            </div>

            {/* Ringkasan Dinamika Sesi */}
            <div
              id="report-summary-block"
              className="flex flex-col gap-2 print:gap-1 print:break-inside-avoid"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-foreground">
                Ringkasan Dinamika Sesi
              </span>
              <div
                id="report-summary-text"
                className="p-4 rounded-xl border border-border/80 bg-background text-sm text-foreground leading-relaxed whitespace-pre-line print:border-foreground/30 print:p-3 print:text-xs"
              >
                {report.summary}
              </div>
            </div>

            {/* Saran / Rekomendasi Tindak Lanjut */}
            {report.actionPlan && (
              <div
                id="report-action-plan-block"
                className="flex flex-col gap-2 print:gap-1 print:break-inside-avoid"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-foreground">
                  Saran / Rekomendasi Tindak Lanjut
                </span>
                <div
                  id="report-action-plan-text"
                  className="p-4 rounded-xl border border-border/80 bg-background text-sm text-foreground leading-relaxed whitespace-pre-line print:border-foreground/30 print:p-3 print:text-xs"
                >
                  {report.actionPlan}
                </div>
              </div>
            )}

            {/* Rekomendasi Jadwal Sesi Berikutnya */}
            {report.followUpRecommendation && (
              <div className="flex flex-col gap-2 print:gap-1 print:break-inside-avoid">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-foreground">
                  Rekomendasi Rujukan / Jadwal Berikutnya
                </span>
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs text-foreground leading-relaxed print:border-foreground/30 print:p-2.5">
                  {report.followUpRecommendation}
                </div>
              </div>
            )}

            <Separator className="print:border-foreground/40" />

            {/* Counselor Signature Block */}
            <div className="flex items-center justify-between pt-1 text-xs print:pt-4 print:break-inside-avoid">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-[11px]">Konselor Penanggung Jawab:</span>
                <strong className="text-sm font-semibold text-foreground">{counselor.fullName}</strong>
                <span className="text-muted-foreground text-[11px]">{counselor.title}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium print:border-foreground/30 print:text-foreground">
                <ShieldCheck className="size-3.5" />
                <span>Terverifikasi Klinis</span>
              </div>
            </div>
          </div>
        ) : hasReport ? (
          /* LOCKED REPORT STATE (WHATSAPP VERIFICATION GATE) */
          <div
            id="report-locked-gate"
            className="flex flex-col items-center justify-center p-7 sm:p-8 text-center rounded-2xl border-2 border-primary/25 bg-gradient-to-b from-primary/5 via-background to-background gap-4 shadow-2xs print:hidden"
          >
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Lock className="size-6" />
            </div>

            <div className="flex flex-col gap-1.5 max-w-md">
              <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
                Laporan Sesi Klinis Resmi Siap Diakses
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                Sesi konseling telah selesai dan laporan resmi telah disusun oleh{" "}
                <strong className="text-foreground">{counselor.fullName}</strong>. Demi menjaga
                kerahasiaan medis dan privasi data Anda, silakan verifikasi nomor WhatsApp yang terdaftar
                untuk membuka isi laporan.
              </p>
            </div>

            <Button
              type="button"
              onClick={onOpenUnlockModal}
              id="btn-unlock-report"
              className="text-xs sm:text-sm font-semibold h-10 px-5 gap-2 shadow-xs"
            >
              <FileCheck data-icon="inline-start" className="size-4" />
              <span>Baca &amp; Cetak Laporan (PDF)</span>
            </Button>
          </div>
        ) : (
          /* REPORT NOT READY YET */
          <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-muted/10 gap-3 print:hidden">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="size-5" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <span className="font-semibold text-sm text-foreground">
                Laporan Sesi Sedang Disiapkan
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Konselor Anda ({counselor.fullName}) sedang merangkum catatan dinamika sesi dan saran
                tindak lanjut. Halaman ini akan diperbarui segera setelah laporan siap dibaca.
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/20 border-t border-border/60 p-4 flex items-center justify-between text-xs text-muted-foreground print:bg-transparent print:border-t print:p-2">
        <div className="flex items-center gap-1.5">
          <Lock className="size-3.5 text-muted-foreground/60 print:hidden" />
          <span className="print:text-[10px]">
            Privasi Klien Terjamin • Catatan internal rahasia konselor tidak dipublikasikan
          </span>
        </div>
        <span className="font-mono text-[11px] print:text-[10px]">
          Kode: {booking.bookingCode || booking.accessToken.slice(0, 8)}
        </span>
      </CardFooter>
    </Card>
  )
}
