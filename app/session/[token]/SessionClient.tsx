"use client"

import * as React from "react"
import Link from "next/link"
import { ShieldCheck, ArrowLeft, Clock, Lock, BadgeCheck, Sparkles } from "lucide-react"
import { PublicShell } from "@/components/public/public-shell"
import { SessionCountdownCard } from "./components/SessionCountdownCard"
import { PaymentVerificationWaitingCard } from "./components/PaymentVerificationWaitingCard"
import { CancelledBookingNoticeCard } from "./components/CancelledBookingNoticeCard"
import { CompletedSessionReportCard } from "./components/CompletedSessionReportCard"
import { ZoomDisplayNameBanner } from "./components/ZoomDisplayNameBanner"
import { ExtensionPaymentCard } from "./components/ExtensionPaymentCard"
import { WhatsAppReportGateModal } from "./components/WhatsAppReportGateModal"
import { CounselorDetailsCard } from "./components/CounselorDetailsCard"
import { PreparationTipsCard } from "./components/PreparationTipsCard"
import { SupportHotlineCard } from "./components/SupportHotlineCard"
import { getSessionByTokenAction } from "@/lib/session/actions"
import type { SessionPageData, ClientSessionReportView } from "@/lib/session/types"

interface SessionClientProps {
  initialData: SessionPageData
}

export default function SessionClient({ initialData }: SessionClientProps) {
  const [data, setData] = React.useState<SessionPageData>(initialData)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [unlockedReport, setUnlockedReport] = React.useState<ClientSessionReportView | null>(
    initialData.report || null
  )
  const [isUnlockModalOpen, setIsUnlockModalOpen] = React.useState(false)

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await getSessionByTokenAction(data.booking.accessToken)
      if (res.success && res.data) {
        setData(res.data)
        if (res.data.report) {
          setUnlockedReport(res.data.report)
        }
      }
    } catch {
      // Keep existing data on error
    } finally {
      setIsRefreshing(false)
    }
  }, [data.booking.accessToken])

  // Auto-polling every 8 seconds if booking is pending payment (responsive verification sync)
  React.useEffect(() => {
    if (data.booking.status !== "pending_payment") return

    const interval = setInterval(() => {
      handleRefresh()
    }, 8000)

    return () => clearInterval(interval)
  }, [data.booking.status, handleRefresh])

  return (
    <PublicShell>
      <div className="relative flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 flex flex-col gap-8 print:p-0 print:m-0 print:max-w-none">
        {/* Calming Ambient Breathing Aura (Public Landing Page Signature) */}
        <div
          className="absolute -top-24 sm:-top-32 left-1/2 -translate-x-1/2 w-[340px] sm:w-[680px] md:w-[920px] h-[320px] sm:h-[480px] bg-gradient-to-b from-purple-400/20 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/25 dark:via-purple-950/15 print:hidden"
          aria-hidden="true"
        />

        {/* Back Link Breadcrumb & Trust Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <Link
            href="/cek-sesi"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors group px-4 py-1.5 rounded-full bg-violet-50/80 hover:bg-violet-100/80 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 border border-violet-100 dark:border-violet-900/50 w-fit shadow-2xs"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform text-primary" data-icon="inline-start" />
            <span>Cek Status / Pulihkan Sesi</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-purple-300 text-xs font-semibold shadow-2xs w-fit">
            <ShieldCheck className="size-3.5 text-primary dark:text-purple-300" />
            <span>Koneksi Tamu Privat • Tanpa Wajib Akun</span>
          </div>
        </div>

        {/* Empathetic Welcome Header (Solulu.id Landing Page Style) */}
        <div className="flex flex-col gap-4 print:hidden">
          <div className="flex items-center gap-2 flex-wrap">
            {data.booking.status === "pending_payment" ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-semibold shadow-2xs w-fit">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Menunggu Verifikasi Pembayaran • Sesi Telah Dipesan</span>
              </div>
            ) : data.booking.status === "cancelled" ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-semibold shadow-2xs w-fit">
                <span className="size-2 rounded-full bg-rose-500" />
                <span>Pemesanan Dibatalkan / Kedaluwarsa</span>
              </div>
            ) : data.booking.status === "completed" ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold shadow-2xs w-fit">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Sesi Selesai • Laporan Klinis &amp; Rekomendasi</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-purple-300 text-xs font-semibold shadow-2xs w-fit">
                <Sparkles className="size-3.5 text-primary dark:text-purple-300" />
                <span>Ruang Aman &amp; Privat (#CeritaDiSolulu)</span>
              </div>
            )}
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-foreground leading-[1.18] text-balance">
            {data.booking.status === "cancelled" ? (
              "Pemesanan Sesi Dibatalkan"
            ) : data.booking.status === "completed" ? (
              <>
                Laporan Sesi:{" "}
                <span className="text-primary dark:text-purple-300">{data.counselor.fullName}</span>
              </>
            ) : (
              <>
                Ruang Cerita Privatmu Bersama{" "}
                <span className="text-primary dark:text-purple-300">{data.counselor.fullName}</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl font-normal text-pretty">
            {data.booking.status === "pending_payment" ? (
              <>
                Halo, <strong className="font-semibold text-foreground">{data.booking.patientName}</strong>. Jadwal sesi Anda telah berhasil dipesan dan sedang menunggu verifikasi pembayaran oleh tim admin Solulu.
              </>
            ) : data.booking.status === "cancelled" ? (
              <>
                Halo, <strong className="font-semibold text-foreground">{data.booking.patientName}</strong>. Pemesanan sesi konseling ini telah dibatalkan karena batas waktu pembayaran habis atau bukti pembayaran belum sesuai.
              </>
            ) : data.booking.status === "completed" ? (
              <>
                Halo, <strong className="font-semibold text-foreground">{data.booking.patientName}</strong>. Sesi telekonseling Anda telah selesai dilaksanakan. Berikut adalah ringkasan resmi dinamika konseling dan rekomendasi tindak lanjut.
              </>
            ) : (
              <>
                Selamat datang, <strong className="font-semibold text-foreground">{data.booking.patientName}</strong>. Ruang aman dan privat ini disiapkan khusus untuk mendengarkan ceritamu dengan penuh empati, tanpa penghakiman, dan terlindungi kerahasiaan klinis.
              </>
            )}
          </p>

          {/* 4 Pilar Kepercayaan Ruang Sesi (Landing Page Trust Pills) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap pt-1">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-100 dark:border-violet-900/60 shadow-2xs hover:bg-violet-100/60 transition-colors">
              <Clock className="size-3.5 text-primary shrink-0" />
              <span>90 Menit Penuh</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-100 dark:border-violet-900/60 shadow-2xs hover:bg-violet-100/60 transition-colors">
              <Lock className="size-3.5 text-primary shrink-0" />
              <span>100% Rahasia &amp; Privat</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-100 dark:border-violet-900/60 shadow-2xs hover:bg-violet-100/60 transition-colors">
              <BadgeCheck className="size-3.5 text-primary shrink-0" />
              <span>Praktisi Berizin HIMPSI</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-100 dark:border-violet-900/60 shadow-2xs hover:bg-violet-100/60 transition-colors">
              <ShieldCheck className="size-3.5 text-primary shrink-0" />
              <span>Tanpa Wajib Bikin Akun</span>
            </div>
          </div>
        </div>

        {/* Prominent Zoom Display Name Formatting Banner (Confirmed Sessions) */}
        {data.booking.status === "confirmed" && (
          <ZoomDisplayNameBanner
            booking={data.booking}
            counselorName={data.counselor.fullName}
          />
        )}

        {/* Dual Payment Extension Card (When Session Was Extended >90m) */}
        {data.booking.isExtended && Number(data.booking.extensionFee) > 0 && (
          <ExtensionPaymentCard
            booking={data.booking}
            platformSettings={data.platformSettings}
            onPaymentSuccess={(newStatus) => {
              setData((prev) => ({
                ...prev,
                booking: {
                  ...prev.booking,
                  extensionPaymentStatus: newStatus,
                },
              }))
            }}
          />
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start print:block">
          {/* Main Action Column (Left, 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6 print:w-full print:block">
            {data.booking.status === "pending_payment" ? (
              <PaymentVerificationWaitingCard
                booking={data.booking}
                schedule={data.schedule}
                counselor={data.counselor}
                transaction={data.transaction}
                patientName={data.booking.patientName}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            ) : data.booking.status === "cancelled" ? (
              <CancelledBookingNoticeCard
                booking={data.booking}
                schedule={data.schedule}
                counselor={data.counselor}
              />
            ) : data.booking.status === "completed" ? (
              <CompletedSessionReportCard
                booking={data.booking}
                counselor={data.counselor}
                schedule={data.schedule}
                hasReport={data.hasReport ?? Boolean(data.report)}
                report={unlockedReport}
                onOpenUnlockModal={() => setIsUnlockModalOpen(true)}
              />
            ) : (
              <SessionCountdownCard
                booking={data.booking}
                schedule={data.schedule}
                patientName={data.booking.patientName}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            )}

            <div className="print:hidden">
              <PreparationTipsCard />
            </div>
          </div>

          {/* Sidebar Info Column (Right, 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 print:hidden">
            <CounselorDetailsCard
              counselor={data.counselor}
              booking={data.booking}
            />

            <SupportHotlineCard
              accessToken={data.booking.accessToken}
            />
          </div>
        </div>

        {/* WhatsApp Report Gate Modal for Unlocking Medical Reports */}
        <WhatsAppReportGateModal
          open={isUnlockModalOpen}
          onOpenChange={setIsUnlockModalOpen}
          accessToken={data.booking.accessToken}
          onUnlocked={(report) => {
            setUnlockedReport(report)
          }}
        />
      </div>
    </PublicShell>
  )
}
