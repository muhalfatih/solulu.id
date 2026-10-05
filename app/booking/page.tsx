import * as React from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Calendar, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import { PublicShell } from "@/components/public/public-shell"
import { getBookingContextAction } from "./actions"
import { getPlatformSettings } from "@/lib/settings/platform"
import BookingClient from "./BookingClient"

interface BookingPageProps {
  searchParams: Promise<{
    scheduleId?: string
    counselorId?: string
    screeningId?: string
    error?: string
  }>
}

export const metadata = {
  title: "Pemesanan Sesi Konseling | Solulu",
  description:
    "Formulir pemesanan sesi telekonseling privat 90 menit tanpa akun di Solulu.",
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const params = await searchParams
  const { scheduleId, counselorId, screeningId, error } = params

  if (!scheduleId || !counselorId) {
    return (
      <PublicShell>
        <div className="relative flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center justify-center">
          {/* Calming Ambient Breathing Aura */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[300px] bg-gradient-to-b from-purple-400/15 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/20 dark:via-purple-950/10"
            aria-hidden="true"
          />

          <Card className="w-full border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden gap-0">
            <CardHeader className="text-center p-6 sm:p-8 border-b border-border/40 flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center mb-3 shadow-2xs">
                <AlertCircle className="size-7" />
              </div>
              <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Slot Jadwal Belum Dipilih
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1.5 text-pretty">
                Silakan pilih mitra konselor dan slot waktu 90 menit yang tersedia terlebih dahulu melalui katalog konselor kami.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 flex justify-center">
              <Button asChild variant="public" size="pill" className="w-full">
                <Link href="/counselors">
                  <ArrowLeft className="size-4" data-icon="inline-start" />
                  <span>Buka Katalog Konselor</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicShell>
    )
  }

  const contextRes = await getBookingContextAction({
    scheduleId,
    counselorId,
    screeningId,
  })

  if (!contextRes.success || !contextRes.data) {
    return (
      <PublicShell>
        <div className="relative flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center justify-center">
          {/* Calming Ambient Breathing Aura */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[300px] bg-gradient-to-b from-purple-400/15 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/20 dark:via-purple-950/10"
            aria-hidden="true"
          />

          <Card className="w-full border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden gap-0">
            <CardHeader className="text-center p-6 sm:p-8 border-b border-border/40 flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 shadow-2xs">
                <Calendar className="size-7" />
              </div>
              <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Slot Tidak Tersedia
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1.5 text-pretty">
                {contextRes.error ||
                  "Slot waktu yang Anda pilih telah dipesan atau sedang dalam proses transaksi oleh pasien lain."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 flex justify-center">
              <Button asChild variant="public" size="pill" className="w-full">
                <Link href="/counselors">
                  <ArrowLeft className="size-4" data-icon="inline-start" />
                  <span>Pilih Jadwal Lain di Katalog</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicShell>
    )
  }

  const settings = await getPlatformSettings()

  return (
    <BookingClient
      initialData={contextRes.data}
      screeningId={screeningId}
      initialError={error}
      isScreeningRequired={settings.isScreeningRequired}
    />
  )
}
