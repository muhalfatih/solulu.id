"use client"

import * as React from "react"
import Link from "next/link"
import {
  Clock,
  Building2,
  Copy,
  Check,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { PublicShell } from "@/components/public/public-shell"
import { OFFICIAL_BANK_ACCOUNTS } from "@/lib/booking/hold"

interface ManualPendingClientProps {
  data: {
    booking: {
      id: string
      accessToken: string
      patientName: string
      patientEmail: string
      patientPhone: string
      status: string
    }
    counselor: {
      id: string
      fullName: string
      title: string
      counselorType: string
      counselorTypeDisplay: string
      avatarR2Url: string | null
    }
    schedule: {
      id: string
      date: string
      startTime: string
      endTime: string
      timeRange: string
    }
    transaction: {
      id: string
      paymentProvider: string
      paymentMethod: string | null
      referenceNumber: string | null
      grossAmount: number
      discountAmount: number
      netAmount: number
      netAmountFormatted: string
      status: string
    } | null
  }
}

export default function ManualPendingClient({ data }: ManualPendingClientProps) {
  const { booking, counselor, schedule, transaction } = data
  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null)
  const [copiedAmount, setCopiedAmount] = React.useState(false)
  const [copiedRef, setCopiedRef] = React.useState(false)

  const referenceNumber = transaction?.referenceNumber || "SOL-MANUAL"
  const amountToTransfer = transaction?.netAmount || 0
  const formattedAmount = transaction?.netAmountFormatted || "Rp 0"

  const handleCopy = (text: string, type: "account" | "amount" | "ref", accountId?: string) => {
    navigator.clipboard.writeText(text)
    if (type === "account" && accountId) {
      setCopiedAccount(accountId)
      setTimeout(() => setCopiedAccount(null), 2500)
    } else if (type === "amount") {
      setCopiedAmount(true)
      setTimeout(() => setCopiedAmount(false), 2500)
    } else if (type === "ref") {
      setCopiedRef(true)
      setTimeout(() => setCopiedRef(false), 2500)
    }
  }

  const whatsappSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || "6281234567890"

  const confirmationMessage = `Halo Admin Solulu, saya ingin mengirimkan bukti transfer untuk pemesanan konseling:
- Nama Pasien: ${booking.patientName}
- Kode Referensi: ${referenceNumber}
- Konselor: ${counselor.fullName}
- Jadwal: ${schedule.date} (${schedule.timeRange})
- Nominal: ${formattedAmount}

Mohon bantuannya untuk diverifikasi. Terima kasih.`

  const whatsappUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
    confirmationMessage
  )}`

  return (
    <PublicShell>
      <div className="relative flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 md:py-20 flex flex-col items-center">
        {/* Calming Ambient Breathing Aura */}
        <div
          className="absolute -top-16 sm:-top-24 left-1/2 -translate-x-1/2 w-[340px] sm:w-[580px] md:w-[720px] h-[280px] sm:h-[380px] bg-gradient-to-b from-amber-400/15 via-amber-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-amber-800/20 dark:via-amber-950/10"
          aria-hidden="true"
        />

        {/* Status Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-3.5">
          <div className="size-18 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-8 ring-amber-500/5 shadow-2xs">
            <Clock className="size-9" />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold shadow-2xs">
            <span>Status: Menunggu Pembayaran Transfer</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance leading-[1.2]">
              Menunggu Pembayaran Transfer
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed text-pretty">
              Silakan lakukan transfer ke salah satu rekening resmi platform dan kirimkan bukti pembayaran untuk aktivasi ruang Zoom oleh Admin.
            </p>
          </div>
        </div>

        {/* Highlight Payment Info Card */}
        <Card className="w-full rounded-2xl border border-border/80 shadow-xs bg-muted/20 hover:shadow-sm transition-all mb-6 overflow-hidden gap-0">
          <CardContent className="p-6 sm:p-7 flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reference Number */}
              <div className="p-4 rounded-xl bg-background border border-border/80 flex flex-col gap-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-muted-foreground">
                  Kode Referensi Booking
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-foreground">
                    {referenceNumber}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(referenceNumber, "ref")}
                    className="h-8 px-2.5 rounded-full cursor-pointer text-xs"
                  >
                    {copiedRef ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Amount to transfer */}
              <div className="p-4 rounded-xl bg-background border border-border/80 flex flex-col gap-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-muted-foreground">
                  Total Nominal Transfer
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-bold tabular-nums font-heading text-primary dark:text-purple-300">
                    {formattedAmount}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(String(amountToTransfer), "amount")}
                    className="h-8 px-2.5 rounded-full cursor-pointer text-xs"
                  >
                    {copiedAmount ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center leading-relaxed">
              ⚠️ Cantumkan <span className="font-semibold text-foreground font-mono">{referenceNumber}</span> pada kolom berita transfer untuk mempermudah pengecekan mutasi bank.
            </div>
          </CardContent>
        </Card>

        {/* Official Bank Accounts List */}
        <Card className="w-full rounded-2xl border border-border/80 shadow-xs bg-card hover:shadow-sm transition-all mb-6 overflow-hidden gap-0">
          <CardHeader className="p-6 sm:p-7 border-b border-border/40">
            <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 text-foreground">
              <Building2 className="size-4.5 text-primary" />
              <span>Daftar Rekening Resmi Solulu</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              Transfer dapat dilakukan melalui ATM, Mobile Banking, atau Internet Banking.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-7 flex flex-col gap-3.5">
            {OFFICIAL_BANK_ACCOUNTS.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm sm:text-base text-foreground">{acc.bankName}</span>
                    <Badge variant="outline" className="rounded-full text-[10px] font-medium py-0 px-2">
                      {acc.badge}
                    </Badge>
                  </div>
                  <div className="font-mono text-base font-bold text-foreground tracking-wider">
                    {acc.accountNumber}
                  </div>
                  <span className="text-xs text-muted-foreground">a.n. {acc.accountHolder}</span>
                </div>
                <Button
                  type="button"
                  variant="public-secondary"
                  size="pill-sm"
                  onClick={() => handleCopy(acc.accountNumber, "account", acc.id)}
                  className="h-9 px-3.5 text-xs font-semibold shrink-0 cursor-pointer"
                >
                  {copiedAccount === acc.id ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" data-icon="inline-start" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" data-icon="inline-start" />
                      <span>Salin Rekening</span>
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Step-by-Step Instructions & WhatsApp Confirmation */}
        <Card className="w-full rounded-2xl border border-border/80 shadow-xs bg-card hover:shadow-sm transition-all mb-6 overflow-hidden gap-0">
          <CardHeader className="p-6 sm:p-7 border-b border-border/40">
            <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Langkah Selanjutnya
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
              Selesaikan transfer dan konfirmasi bukti pembayaran ke admin kami.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 sm:p-7 flex flex-col gap-3.5 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                1
              </span>
              <span>Lakukan transfer sejumlah <strong className="text-foreground">{formattedAmount}</strong> ke salah satu rekening resmi di atas.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                2
              </span>
              <span>Kirimkan bukti transfer dan Kode Referensi melalui WhatsApp Tim Solulu.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                3
              </span>
              <span>Admin memverifikasi mutasi bank, dan status pemesanan Anda langsung terkonfirmasi otomatis.</span>
            </div>
          </CardContent>
          <CardFooter className="p-6 sm:p-7 border-t border-border/40 bg-muted/10 flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              variant="public"
              size="pill-lg"
              className="w-full sm:flex-1 h-12 text-sm sm:text-base font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" data-icon="inline-start" />
                <span>Konfirmasi via WhatsApp Sekarang</span>
              </a>
            </Button>
            <Button
              asChild
              variant="public-secondary"
              size="pill-lg"
              className="w-full sm:w-auto h-12 text-sm font-semibold"
            >
              <Link href={`/session/${booking.accessToken}`}>
                <span>Buka Halaman Sesi</span>
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PublicShell>
  )
}

