"use client"

import * as React from "react"
import {
  Clock,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  RefreshCw,
  MessageCircle,
  Building2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { OFFICIAL_BANK_ACCOUNTS } from "@/lib/booking/hold"
import type {
  SessionBookingData,
  SessionScheduleData,
  SessionCounselorData,
  SessionTransactionData,
} from "@/lib/session/types"

interface PaymentVerificationWaitingCardProps {
  booking: SessionBookingData
  schedule: SessionScheduleData
  counselor: SessionCounselorData
  transaction: SessionTransactionData | null
  patientName: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function PaymentVerificationWaitingCard({
  booking,
  schedule,
  counselor,
  transaction,
  patientName,
  onRefresh,
  isRefreshing = false,
}: PaymentVerificationWaitingCardProps) {
  const [copiedAccount, setCopiedAccount] = React.useState<string | null>(null)
  const [copiedAmount, setCopiedAmount] = React.useState(false)
  const [copiedRef, setCopiedRef] = React.useState(false)

  const referenceNumber = transaction?.referenceNumber || `SOL-${booking.accessToken.slice(0, 8).toUpperCase()}`
  const amountFormatted = transaction?.netAmountFormatted || "Rp 0"

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

  const waMessage = `Halo Admin Solulu, saya telah melakukan pembayaran untuk pemesanan konseling:
- Nama Klien: ${patientName}
- Kode Referensi: ${referenceNumber}
- Konselor: ${counselor.fullName}
- Jadwal: ${schedule.formattedDate} (${schedule.timeRange})
- Nominal: ${amountFormatted}

Berikut saya lampirkan bukti transfer. Mohon bantuannya untuk verifikasi sesi. Terima kasih!`

  const whatsappUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(waMessage)}`

  return (
    <Card className="rounded-2xl border border-amber-500/30 bg-card shadow-xs overflow-hidden gap-0">
      {/* Top Accent Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 animate-pulse" />

      {/* Header */}
      <CardHeader className="p-6 sm:p-7 border-b border-border/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status Pemesanan
            </span>
            <Badge className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-medium px-2.5 py-0.5 text-xs shadow-2xs">
              <span className="size-2 rounded-full bg-amber-500 animate-ping inline-block mr-1.5" />
              Menunggu Verifikasi Pembayaran
            </Badge>
          </div>
          <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Ruang Tunggu Konfirmasi Sesi
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
            {schedule.formattedDate} • {schedule.timeRange} (Durasi 90 Menit Penuh)
          </CardDescription>
        </div>

        {/* Live Status Indicator Pill */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs h-8 px-3 gap-1.5 font-medium border-border/80 shadow-2xs"
          >
            <RefreshCw className={`size-3 text-muted-foreground ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>{isRefreshing ? "Memeriksa..." : "Cek Status"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-7 flex flex-col gap-6">
        {/* Verification Stepper Progress */}
        <div className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Tahapan Konfirmasi Sesi Konseling
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Langkah 2 dari 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {/* Step 1: Pesanan Terdaftar */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card/60 border border-emerald-500/20">
              <div className="size-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">1. Pesanan Terdaftar</span>
                <span className="text-[11px] text-muted-foreground">Slot jadwal konselor telah diamankan</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Selesai ✓</span>
              </div>
            </div>

            {/* Step 2: Verifikasi Pembayaran (ACTIVE) */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="size-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Clock className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">2. Verifikasi Pembayaran</span>
                <span className="text-[11px] text-muted-foreground">Sedang diproses oleh tim admin</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                  Sedang Menunggu Verifikasi
                </span>
              </div>
            </div>

            {/* Step 3: Ruang Sesi Zoom Dibuka */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-card/40 border border-border/40 opacity-75">
              <div className="size-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">3. Ruang Sesi Dibuka</span>
                <span className="text-[11px] text-muted-foreground">Tautan Zoom privat & persiapan telekonseling</span>
                <span className="text-[10px] text-muted-foreground">Otomatis Aktif Setelah Lunas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-foreground">Detail Pembayaran & Bukti Transfer</span>
              <p className="text-[11px] text-muted-foreground">
                Jika Anda telah mentransfer secara manual, silakan salin kode referensi dan kirimkan bukti transfer.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Total Tagihan</span>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {amountFormatted}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(String(transaction?.netAmount || 0), "amount")}
                className="size-7 text-muted-foreground hover:text-foreground"
                title="Salin Nominal"
              >
                {copiedAmount ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          </div>

          {/* Reference Number */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-muted-foreground font-medium">Nomor Referensi Pemesanan:</span>
              <span className="text-xs font-mono font-bold text-foreground tracking-wider">{referenceNumber}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(referenceNumber, "ref")}
              className="text-xs h-7 px-2.5 gap-1 text-muted-foreground hover:text-foreground"
            >
              {copiedRef ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copiedRef ? "Tersalin" : "Salin"}</span>
            </Button>
          </div>

          {/* Official Bank Accounts */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-foreground">Rekening Resmi Solulu (Transfer Manual):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {OFFICIAL_BANK_ACCOUNTS.map((bank) => (
                <div
                  key={bank.id}
                  className="p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Building2 className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-foreground">{bank.bankName}</span>
                      <span className="text-xs font-mono font-medium text-muted-foreground">{bank.accountNumber}</span>
                      <span className="text-[10px] text-muted-foreground/80">{bank.accountHolder}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(bank.accountNumber, "account", bank.id)}
                    className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    {copiedAccount === bank.id ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span className="text-[11px]">{copiedAccount === bank.id ? "Tersalin" : "Salin"}</span>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="p-6 sm:p-7 border-t border-border/40 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
          <span>Halaman ini otomatis mengecek status verifikasi secara berkala.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              className="w-full sm:w-auto text-xs h-9 px-4 font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <MessageCircle className="size-3.5" />
              <span>Konfirmasi via WhatsApp Admin</span>
            </Button>
          </a>
        </div>
      </CardFooter>
    </Card>
  )
}
