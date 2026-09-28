"use client"

import * as React from "react"
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Video,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { BookingSession } from "../../mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ManualPaymentDetails {
  paymentMethod: string
  referenceNumber: string
  adminNotes: string
}

interface ManualPaymentModalProps {
  session: BookingSession | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (session: BookingSession, details: ManualPaymentDetails) => void
}

const PAYMENT_METHODS = [
  "Transfer Bank BCA (Manual)",
  "Transfer Bank Mandiri (Manual)",
  "Transfer Bank BRI (Manual)",
  "Transfer Bank BNI (Manual)",
  "QRIS Statis Toko / Kasir",
  "Tunai / Subsidi Layanan",
]

export function ManualPaymentModal({
  session,
  isOpen,
  onClose,
  onConfirm,
}: ManualPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = React.useState(PAYMENT_METHODS[0])
  const [referenceNumber, setReferenceNumber] = React.useState("")
  const [adminNotes, setAdminNotes] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Reset form when session changes
  React.useEffect(() => {
    if (session) {
      setPaymentMethod(PAYMENT_METHODS[0])
      setReferenceNumber(`REF-${Math.floor(100000 + Math.random() * 900000)}`)
      setAdminNotes("Transfer manual telah diverifikasi di mutasi bank oleh Admin.")
      setIsProcessing(false)
    }
  }, [session])

  if (!isOpen || !session) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate backend worker execution (Zoom room creation + Resend email delivery)
    setTimeout(() => {
      onConfirm(session, {
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        adminNotes: adminNotes.trim(),
      })
      setIsProcessing(false)
      onClose()
    }, 900)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-payment-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-foreground animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard className="size-4" />
            </div>
            <div className="flex flex-col">
              <h2 id="manual-payment-title" className="text-base font-semibold tracking-tight text-foreground">
                Konfirmasi Pembayaran Manual
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tandai sesi lunas dan terbitkan tiket ruang Zoom otomatis ke pasien.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            disabled={isProcessing}
            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Ringkasan Sesi & Tagihan */}
        <div className="rounded-xl border border-border bg-muted/25 p-3.5 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-mono font-medium">{session.code}</span>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-mono py-0 px-2">
              Menunggu Pembayaran
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[11px] text-muted-foreground block">Nama Pasien</span>
              <span className="font-semibold text-foreground">{session.patientName}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Mitra Konselor</span>
              <span className="font-semibold text-foreground">{session.counselorName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div>
              <span className="text-[11px] text-muted-foreground block">Jadwal Sesi</span>
              <span className="text-foreground">{session.date}, {session.timeRange}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Nominal Tagihan</span>
              <span className="text-base font-bold text-foreground tabular-nums">
                Rp {session.amount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Metode Pembayaran */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-method" className="text-xs font-medium text-foreground">
              Metode Pembayaran yang Diterima <span className="text-destructive">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method" size="sm" className="h-8 w-full text-xs bg-background">
                <SelectValue placeholder="Pilih metode transfer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Nomor Bukti / Mutasi Bank */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ref-number" className="text-xs font-medium text-foreground">
              Nomor Referensi Transfer / ID Mutasi
            </Label>
            <Input
              id="ref-number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Contoh: BCA-982173 / WA-0812..."
              className="h-8 text-xs bg-background font-mono"
            />
          </div>

          {/* Catatan Admin Internal */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-notes" className="text-xs font-medium text-foreground">
              Catatan Internal Operator (Opsional)
            </Label>
            <Input
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Catatan verifikasi manual..."
              className="h-8 text-xs bg-background"
            />
          </div>

          {/* Concurrency Guard Status */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 leading-snug">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Pemeriksaan Kuota Host Zoom Lolos
              </span>
              <span className="text-[11px] text-muted-foreground">
                Tersedia 1 akun Zoom Pro bebas bentrok. Ruang meeting dan email tiket akses pasien akan dibuat otomatis seketika.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
              className="h-8 text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isProcessing}
              className="h-8 text-xs font-medium gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
                  <span>Memproses Alokasi Zoom & Tiket...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" data-icon="inline-start" />
                  <span>Konfirmasi & Terbitkan Sesi</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
