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
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col items-center">
        {/* Status Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <div className="size-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-8 ring-amber-500/5">
            <Clock className="size-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
              Menunggu Pembayaran Transfer
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Silakan lakukan transfer ke salah satu rekening resmi platform dan kirimkan bukti pembayaran untuk aktivasi ruang Zoom oleh Admin.
            </p>
          </div>
        </div>

        {/* Highlight Payment Info Card */}
        <Card className="w-full border-border/80 rounded-2xl mb-6 bg-muted/20 shadow-xs">
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reference Number */}
              <div className="p-3.5 rounded-xl bg-background border border-border/80 flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Kode Referensi Booking
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold font-mono tracking-tight text-foreground">
                    {referenceNumber}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(referenceNumber, "ref")}
                    className="h-7 text-xs px-2 cursor-pointer"
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
              <div className="p-3.5 rounded-xl bg-background border border-border/80 flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Total Nominal Transfer
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold tabular-nums text-foreground">
                    {formattedAmount}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(String(amountToTransfer), "amount")}
                    className="h-7 text-xs px-2 cursor-pointer"
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

            <div className="text-[11px] text-muted-foreground text-center">
              ⚠️ Cantumkan <span className="font-semibold text-foreground font-mono">{referenceNumber}</span> pada kolom berita transfer untuk mempermudah pengecekan mutasi bank.
            </div>
          </CardContent>
        </Card>

        {/* Official Bank Accounts List */}
        <Card className="w-full border-border/60 mb-6">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <span>Daftar Rekening Resmi Solulu</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Transfer dapat dilakukan melalui ATM, Mobile Banking, atau Internet Banking.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-3">
            {OFFICIAL_BANK_ACCOUNTS.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{acc.bankName}</span>
                    <Badge variant="outline" className="text-[10px] py-0">
                      {acc.badge}
                    </Badge>
                  </div>
                  <div className="font-mono text-sm font-bold text-foreground tracking-wider">
                    {acc.accountNumber}
                  </div>
                  <span className="text-[11px] text-muted-foreground">a.n. {acc.accountHolder}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(acc.accountNumber, "account", acc.id)}
                  className="h-8 text-xs shrink-0 cursor-pointer"
                >
                  {copiedAccount === acc.id ? (
                    <>
                      <Check className="size-3 text-emerald-600" data-icon="inline-start" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" data-icon="inline-start" />
                      <span>Salin Rekening</span>
                    </>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Step-by-Step Instructions & WhatsApp Confirmation */}
        <Card className="w-full border-border/60 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Langkah Selanjutnya:</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <span>Lakukan transfer sejumlah <strong>{formattedAmount}</strong> ke salah satu rekening resmi di atas.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <span>Kirimkan bukti transfer dan Kode Referensi melalui WhatsApp Tim Solulu.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <span>Admin memverifikasi mutasi bank, dan status pemesanan Anda langsung terkonfirmasi.</span>
            </div>
          </CardContent>
          <CardFooter className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Button
              asChild
              variant="public"
              size="pill"
              className="w-full sm:flex-1"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" data-icon="inline-start" />
                <span>Konfirmasi via WhatsApp Sekarang</span>
              </a>
            </Button>
            <Button
              asChild
              variant="public-secondary"
              size="pill"
              className="w-full sm:w-auto"
            >
              <Link href={`/session/${booking.accessToken}`}>
                <span>Buka Halaman Sesi</span>
                <ArrowRight className="size-3.5" data-icon="inline-end" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PublicShell>
  )
}
