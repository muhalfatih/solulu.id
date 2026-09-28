import * as React from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/60">
          <CardHeader className="text-center">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="size-6" />
            </div>
            <CardTitle className="text-xl">Token Akses Tidak Ditemukan</CardTitle>
            <CardDescription>
              Tautan konfirmasi tidak valid atau tidak memiliki token sesi yang benar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bookingRes = await getBookingByTokenAction(token)

  if (!bookingRes.success || !bookingRes.data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/60">
          <CardHeader className="text-center">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="size-6" />
            </div>
            <CardTitle className="text-xl">Pemesanan Tidak Ditemukan</CardTitle>
            <CardDescription>
              {bookingRes.error || "Data sesi dengan token akses ini tidak ditemukan di sistem kami."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/counselors">Buka Katalog Konselor</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <BookingSuccessClient data={bookingRes.data} />
}
