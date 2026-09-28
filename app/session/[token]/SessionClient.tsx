"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldCheck, ArrowLeft, HeartPulse, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SessionCountdownCard } from "./components/SessionCountdownCard"
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

  const handleRefresh = async () => {
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
  }

  return (
    <div className="theme-public min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-600">
      {/* Top Navigation Header */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              Solulu
            </Link>
            <span className="hidden sm:inline-block text-xs text-muted-foreground border-l border-border/80 pl-3">
              Ruang Sesi Privat Pasien
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Crisis Hotline Quick Action */}
            <a
              href="tel:119"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/70 px-2.5 py-1 rounded-full border border-border/60 transition-colors"
            >
              <HeartPulse className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Hotline 119 Ext 8 (SEJIWA)</span>
            </a>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Welcome Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-medium text-foreground">
              Selamat datang, <span className="font-semibold">{data.booking.patientName}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Koneksi Tamu Aman • Tanpa Wajib Login</span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Action Column (Left/Center, 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <SessionCountdownCard
              booking={data.booking}
              schedule={data.schedule}
              patientName={data.booking.patientName}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />

            <PreparationTipsCard />
          </div>

          {/* Sidebar Info Column (Right, 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <CounselorDetailsCard
              counselor={data.counselor}
              booking={data.booking}
            />

            <SupportHotlineCard
              accessToken={data.booking.accessToken}
            />
          </div>
        </div>
      </main>

      {/* Grounding Footer */}
      <footer className="border-t border-border/60 py-6 mt-auto bg-muted/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Solulu. Layanan Telekonseling Privat Berbasis Web.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground underline underline-offset-3">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-foreground underline underline-offset-3">
              Syarat & Ketentuan
            </Link>
            <Link href="/cek-sesi" className="hover:text-foreground underline underline-offset-3">
              Cek Sesi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
