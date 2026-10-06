"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldCheck, ArrowLeft, RefreshCw, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PublicShell } from "@/components/public/public-shell"
import { SessionCountdownCard } from "./components/SessionCountdownCard"
import { PaymentVerificationWaitingCard } from "./components/PaymentVerificationWaitingCard"
import { CounselorDetailsCard } from "./components/CounselorDetailsCard"
import { PreparationTipsCard } from "./components/PreparationTipsCard"
import { SupportHotlineCard } from "./components/SupportHotlineCard"
import { getSessionByTokenAction } from "@/lib/session/actions"
import type { SessionPageData } from "@/lib/session/types"

interface SessionClientProps {
  initialData: SessionPageData
}

export default function SessionClient({ initialData }: SessionClientProps) {
  const router = useRouter()
  const [data, setData] = React.useState<SessionPageData>(initialData)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await getSessionByTokenAction(data.booking.accessToken)
      if (res.success && res.data) {
        setData(res.data)
      }
    } catch {
      // Keep existing data on error
    } finally {
      setIsRefreshing(false)
    }
  }, [data.booking.accessToken])

  // Auto-polling every 20 seconds if booking is pending payment
  React.useEffect(() => {
    if (data.booking.status !== "pending_payment") return

    const interval = setInterval(() => {
      handleRefresh()
    }, 20000)

    return () => clearInterval(interval)
  }, [data.booking.status, handleRefresh])

  return (
    <PublicShell>
      <div className="relative flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 flex flex-col gap-8">
        {/* Calming Ambient Breathing Aura */}
        <div
          className="absolute -top-20 sm:-top-28 left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] md:w-[850px] h-[300px] sm:h-[450px] bg-gradient-to-b from-purple-400/15 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/20 dark:via-purple-950/10"
          aria-hidden="true"
        />

        {/* Back Link Breadcrumb & Trust Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href="/cek-sesi"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" data-icon="inline-start" />
            <span>Cek Status / Pulihkan Sesi</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium shadow-2xs w-fit">
            <ShieldCheck className="size-3.5" />
            <span>Koneksi Tamu Aman • Tanpa Wajib Login</span>
          </div>
        </div>

        {/* Empathetic Welcome Header */}
        <div className="flex flex-col gap-2.5">
          {data.booking.status === "pending_payment" ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-semibold shadow-2xs w-fit">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Menunggu Verifikasi Pembayaran • Sesi Telah Dipesan</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-purple-300 text-xs font-semibold shadow-2xs w-fit">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ruang Telekonseling Privat • Sesi Terjadwal</span>
            </div>
          )}
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.2]">
            Ruang Sesi Bersama {data.counselor.fullName}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl font-normal text-pretty">
            {data.booking.status === "pending_payment" ? (
              <>
                Halo, <strong className="font-semibold text-foreground">{data.booking.patientName}</strong>. Jadwal sesi Anda telah berhasil dipesan dan sedang menunggu verifikasi pembayaran oleh tim admin Solulu.
              </>
            ) : (
              <>
                Selamat datang, <strong className="font-semibold text-foreground">{data.booking.patientName}</strong>. Ruang aman dan privat ini disiapkan khusus untuk Anda tanpa perlu membuat akun.
              </>
            )}
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main Action Column (Left, 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
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
            ) : (
              <SessionCountdownCard
                booking={data.booking}
                schedule={data.schedule}
                patientName={data.booking.patientName}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            )}

            <PreparationTipsCard />
          </div>

          {/* Sidebar Info Column (Right, 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
            <CounselorDetailsCard
              counselor={data.counselor}
              booking={data.booking}
            />

            <SupportHotlineCard
              accessToken={data.booking.accessToken}
            />
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
