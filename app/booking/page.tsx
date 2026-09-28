import * as React from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Calendar, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import { getBookingContextAction } from "./actions"
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/60">
          <CardHeader className="text-center">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="size-6" />
            </div>
            <CardTitle className="text-xl">Slot Jadwal Belum Dipilih</CardTitle>
            <CardDescription>
              Silakan pilih mitra konselor dan slot waktu yang tersedia terlebih dahulu melalui katalog konselor kami.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild className="gap-2">
              <Link href="/counselors">
                <ArrowLeft className="size-4" data-icon="inline-start" />
                <span>Buka Katalog Konselor</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const contextRes = await getBookingContextAction({
    scheduleId,
    counselorId,
    screeningId,
  })

  if (!contextRes.success || !contextRes.data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/60">
          <CardHeader className="text-center">
            <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
              <Calendar className="size-6" />
            </div>
            <CardTitle className="text-xl">Slot Tidak Tersedia</CardTitle>
            <CardDescription>
              {contextRes.error ||
                "Slot waktu yang Anda pilih telah dipesan atau sedang dalam proses transaksi oleh pasien lain."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild className="gap-2">
              <Link href="/counselors">
                <ArrowLeft className="size-4" data-icon="inline-start" />
                <span>Pilih Jadwal Lain di Katalog</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <BookingClient
      initialData={contextRes.data}
      screeningId={screeningId}
      initialError={error}
    />
  )
}
