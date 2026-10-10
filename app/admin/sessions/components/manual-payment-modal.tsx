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
  AlertTriangle,
  Ban,
} from "lucide-react"
import type { BookingSession } from "@/lib/types/admin"
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
  onReject?: (session: BookingSession, reason: string, notes: string) => void
}

const PAYMENT_METHODS = [
  "Transfer Bank BCA (Manual)",
  "Transfer Bank Mandiri (Manual)",
  "Transfer Bank BRI (Manual)",
  "Transfer Bank BNI (Manual)",
  "QRIS Statis Toko / Kasir",
  "Tunai / Subsidi Layanan",
]

const REJECTION_REASONS = [
  "Nominal transfer tidak sesuai / kurang",
  "Bukti transfer tidak terbaca / buram",
  "Dana belum masuk di mutasi bank resmi",
  "Indikasi bukti transfer tidak valid / palsu",
  "Klien membatalkan transaksi",
]

export function ManualPaymentModal({
  session,
  isOpen,
  onClose,
  onConfirm,
  onReject,
}: ManualPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = React.useState(PAYMENT_METHODS[0])
  const [referenceNumber, setReferenceNumber] = React.useState("")
  const [adminNotes, setAdminNotes] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Rejection Form State
  const [showRejectView, setShowRejectView] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState(REJECTION_REASONS[0])
  const [rejectionNotes, setRejectionNotes] = React.useState("")
  const [isRejecting, setIsRejecting] = React.useState(false)

  // Reset form when session changes
  React.useEffect(() => {
    if (session) {
      setPaymentMethod(PAYMENT_METHODS[0])
      setReferenceNumber(`REF-${Math.floor(100000 + Math.random() * 900000)}`)
      setAdminNotes("Transfer manual telah diverifikasi di mutasi bank oleh Admin.")
      setShowRejectView(false)
      setRejectionReason(REJECTION_REASONS[0])
      setRejectionNotes("")
      setIsProcessing(false)
      setIsRejecting(false)
    }
  }, [session])

  if (!isOpen || !session) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    setTimeout(() => {
      onConfirm(session, {
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        adminNotes: adminNotes.trim(),
      })
      setIsProcessing(false)
      onClose()
    }, 600)
  }

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsRejecting(true)

    setTimeout(() => {
      if (onReject) {
        onReject(session, rejectionReason, rejectionNotes.trim())
      }
      setIsRejecting(false)
      onClose()
    }, 600)
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
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`size-8 rounded-lg flex items-center justify-center ${showRejectView ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
              {showRejectView ? <Ban className="size-4" /> : <CreditCard className="size-4" />}
            </div>
            <div className="flex flex-col">
              <h2 id="manual-payment-title" className="text-sm font-bold tracking-tight">
                {showRejectView ? "Tolak Pembayaran Manual" : "Verifikasi Pembayaran Manual"}
              </h2>
              <span className="text-[11px] text-muted-foreground font-mono">
                {session.code} • {session.patientName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Patient & Session Snapshot */}
        <div className="rounded-xl border border-border bg-muted/30 p-3.5 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">Layanan Konseling:</span>
            <span className="font-semibold text-foreground">{session.counselorType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Konselor Pendamping:</span>
            <span className="font-medium text-foreground">{session.counselorName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Jadwal Sesi:</span>
            <span className="font-mono text-foreground">{session.date} ({session.timeRange})</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <span className="text-muted-foreground">Total Tagihan Sesi:</span>
            <span className="font-bold text-primary text-sm font-mono">
              Rp {session.amount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {showRejectView ? (
          /* REJECTION FORM VIEW */
          <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4 text-xs animate-in fade-in duration-150">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5 text-destructive text-xs">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 leading-relaxed">
                <span className="font-semibold">Konfirmasi Pembatalan &amp; Penolakan</span>
                <span className="text-[11px] text-muted-foreground">
                  Menolak pembayaran akan membatalkan pesanan (status: cancelled), mengembalikan slot jadwal ke kalender publik, dan menandai transaksi sebagai FAILED.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-foreground">
                Alasan Penolakan <span className="text-destructive">*</span>
              </Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger size="sm" className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Pilih alasan penolakan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {REJECTION_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason} className="text-xs">
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reject-notes" className="text-xs font-medium text-foreground">
                Catatan Penolakan untuk Log Audit (Opsional)
              </Label>
              <Input
                id="reject-notes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Misal: Bukti transfer terpotong, mutasi bank atas nama X tidak ada..."
                className="h-8 text-xs bg-background"
              />
            </div>

            {/* Footer Buttons for Rejection */}
            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowRejectView(false)}
                disabled={isRejecting}
                className="h-8 text-xs cursor-pointer"
              >
                Kembali ke Verifikasi
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                disabled={isRejecting}
                className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
                    <span>Menolak &amp; Melepas Slot...</span>
                  </>
                ) : (
                  <>
                    <Ban className="size-3.5" data-icon="inline-start" />
                    <span>Konfirmasi Tolak Pembayaran</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* APPROVAL / VERIFICATION FORM VIEW */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs animate-in fade-in duration-150">
            {/* Metode Pembayaran Manual */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-foreground">
                Kanal Bank Rekening Solulu <span className="text-destructive">*</span>
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger size="sm" className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Pilih rekening bank..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PAYMENT_METHODS.map((pm) => (
                      <SelectItem key={pm} value={pm} className="text-xs">
                        {pm}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Nomor Referensi Bukti Transfer */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ref-number" className="text-xs font-medium text-foreground">
                Nomor Referensi Mutasi / Bukti Transfer <span className="text-destructive">*</span>
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

            {/* Action Buttons: Tolak vs Batal vs Konfirmasi */}
            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRejectView(true)}
                disabled={isProcessing}
                className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
              >
                <Ban className="size-3.5 mr-1" />
                <span>Tolak Pembayaran</span>
              </Button>

              <div className="flex items-center gap-2">
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
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
