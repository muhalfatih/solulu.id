import * as React from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PublicShell } from "@/components/public/public-shell"
import { getBookingByTokenAction } from "../actions"
import BookingSuccessClient from "./BookingSuccessClient"

interface BookingSuccessPageProps {
  searchParams: Promise<{
    token?: string
  }>
}

export const metadata = {
  title: "Pemesanan Terkonfirmasi | Solulu",
  description: "Pemesanan sesi telekonseling Anda telah berhasil.",
}

export default async function BookingSuccessPage({ searchParams }: BookingSuccessPageProps) {
  const params = await searchParams
  const token = params.token

  if (!token) {
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
                <AlertCircle className="size-7" />
              </div>
              <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Token Akses Tidak Ditemukan
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1.5 text-pretty">
                Tautan konfirmasi tidak valid atau tidak menyertakan token sesi yang sesuai. Silakan periksa kembali tautan yang Anda buka.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 p-6 sm:p-8">
              <Button asChild variant="public" size="pill" className="w-full flex-1">
                <Link href="/">
                  <ArrowLeft className="size-4" data-icon="inline-start" />
                  <span>Kembali ke Beranda</span>
                </Link>
              </Button>
              <Button asChild variant="public-secondary" size="pill" className="w-full flex-1">
                <Link href="/cek-sesi">
                  <Search className="size-4" data-icon="inline-start" />
                  <span>Cek Sesi Saya</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicShell>
    )
  }

  const bookingRes = await getBookingByTokenAction(token)

  if (!bookingRes.success || !bookingRes.data) {
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
              <div className="size-14 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mb-3 shadow-2xs">
                <AlertCircle className="size-7" />
              </div>
              <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Pemesanan Tidak Ditemukan
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1.5 text-pretty">
                {bookingRes.error || "Data sesi dengan token akses ini tidak ditemukan di sistem kami."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3 p-6 sm:p-8">
              <Button asChild variant="public" size="pill" className="w-full flex-1">
                <Link href="/counselors">
                  <span>Buka Katalog Konselor</span>
                </Link>
              </Button>
              <Button asChild variant="public-secondary" size="pill" className="w-full flex-1">
                <Link href="/cek-sesi">
                  <span>Cek Status Sesi</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PublicShell>
    )
  }

  return <BookingSuccessClient data={bookingRes.data} />
}
