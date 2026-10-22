"use client"

import * as React from "react"
import {
  Clock,
  CreditCard,
  Building2,
  Copy,
  Check,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { submitExtensionPaymentAction } from "@/lib/session/actions"
import { formatRupiah, type SessionBookingData, type SessionPlatformSettings } from "@/lib/session/types"

interface ExtensionPaymentCardProps {
  booking: SessionBookingData
  platformSettings?: SessionPlatformSettings
  onPaymentSuccess?: (updatedStatus: "PENDING" | "PAID") => void
}

export function ExtensionPaymentCard({
  booking,
  platformSettings,
  onPaymentSuccess,
}: ExtensionPaymentCardProps) {
  const [method, setMethod] = React.useState<"xendit" | "manual_bank_transfer">("manual_bank_transfer")
  const [copiedField, setCopiedField] = React.useState<string | null>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [paymentStatus, setPaymentStatus] = React.useState<"NONE" | "PENDING" | "PAID">(
    booking.extensionPaymentStatus || "NONE"
  )

  const bcaAccount = platformSettings?.bcaAccountNumber || "123-456-7890"
  const bcaName = platformSettings?.bcaAccountName || "Solulu Mental Health"
  const transferNote = `Extend ${booking.bookingCode}`

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast.success(`${fieldName} berhasil disalin!`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error("Gagal menyalin")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (selected.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB")
        return
      }
      setFile(selected)
    }
  }

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error("Silakan pilih file bukti transfer terlebih dahulu")
      return
    }

    setIsUploading(true)
    setIsSubmitting(true)

    try {
      // 1. Upload proof to Cloudflare R2 via /api/upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("prefix", "extensions")

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || "Gagal mengunggah bukti transfer")
      }

      const proofKey = uploadData.data?.r2Key || uploadData.r2Key || `extensions/${Date.now()}_${file.name}`

      // 2. Submit payment action to update database
      const res = await submitExtensionPaymentAction({
        accessToken: booking.accessToken,
        paymentMethod: "manual_bank_transfer",
        proofR2Key: proofKey,
        notes: transferNote,
      })

      if (!res.success) {
        throw new Error(res.error || "Gagal memproses pembayaran perpanjangan")
      }

      setPaymentStatus("PENDING")
      toast.success("Bukti transfer berhasil dikirim!", {
        description: "Admin Solulu akan segera memverifikasi mutasi bank Anda.",
      })
      onPaymentSuccess?.("PENDING")
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengirim bukti transfer")
    } finally {
      setIsUploading(false)
      setIsSubmitting(false)
    }
  }

  const handleSubmitXendit = async () => {
    setIsSubmitting(true)
    try {
      const res = await submitExtensionPaymentAction({
        accessToken: booking.accessToken,
        paymentMethod: "xendit",
      })

      if (!res.success) {
        throw new Error(res.error || "Gagal menyiapkan pembayaran Xendit")
      }

      if (res.data?.paymentUrl) {
        toast.info("Mengarahkan ke gerbang pembayaran aman Xendit...")
        window.open(res.data.paymentUrl, "_blank")
      } else {
        toast.success("Instruksi pembayaran Xendit telah disiapkan")
      }
      setPaymentStatus("PENDING")
      onPaymentSuccess?.("PENDING")
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses pembayaran via Xendit")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      id="card-extension-payment"
      className="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-card to-card shadow-[0_16px_40px_-12px_rgba(245,158,11,0.08)] overflow-hidden print:hidden"
    >
      <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground font-heading">
                  Perpanjangan Sesi (+{booking.extensionMinutes || 30} Menit)
                </CardTitle>
                {paymentStatus === "PAID" ? (
                  <Badge className="rounded-full bg-emerald-600 text-white text-xs px-3 py-0.5">Lunas</Badge>
                ) : paymentStatus === "PENDING" ? (
                  <Badge variant="outline" className="rounded-full border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs bg-amber-500/10 px-3 py-0.5">
                    Menunggu Verifikasi
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="rounded-full text-xs px-3 py-0.5">
                    Belum Lunas
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Sesi konseling melampaui batas 90 menit reguler dan diperpanjang secara klinis.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span className="text-[11px] text-muted-foreground font-medium">Biaya Tambahan:</span>
            <span className="text-lg font-bold text-primary font-mono tabular-nums">
              {formatRupiah(booking.extensionFee)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 flex flex-col gap-5">
        {paymentStatus === "PAID" ? (
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 gap-2">
            <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-sm text-foreground">Biaya Perpanjangan Sesi Lunas</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Terima kasih. Pembayaran biaya perpanjangan sesi Anda telah terverifikasi lunas di sistem klinik.
            </p>
          </div>
        ) : paymentStatus === "PENDING" ? (
          <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertCircle data-icon="inline-start" className="text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-semibold">Bukti Pembayaran Sedang Diverifikasi</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed text-amber-800 dark:text-amber-300 flex flex-col gap-2">
              <span>
                Bukti transfer perpanjangan sesi telah kami terima. Tim admin klinik Solulu sedang memverifikasi
                mutasi bank. Anda tetap dapat melanjutkan sesi atau membaca laporan klinis setelah sesi berakhir.
              </span>
              <span className="text-[11px] opacity-80 font-mono">
                Status: PENDING VERIFICATION • Kode: {booking.bookingCode}
              </span>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Dual Payment Method Toggle */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pilih Metode Pembayaran
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMethod("manual_bank_transfer")}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    method === "manual_bank_transfer"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      method === "manual_bank_transfer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Building2 className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground">Transfer Bank Manual (BCA)</span>
                    <span className="text-[11px] text-muted-foreground">Verifikasi bukti transfer</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("xendit")}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    method === "xendit"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-2xs"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      method === "xendit"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <CreditCard className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground">Otomatis (Xendit QRIS / VA)</span>
                    <span className="text-[11px] text-muted-foreground">Konfirmasi instan otomatis</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Manual Bank Transfer Form */}
            {method === "manual_bank_transfer" ? (
              <form onSubmit={handleSubmitManual} className="flex flex-col gap-4">
                <div className="rounded-xl border border-primary/20 bg-muted/30 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="text-xs font-semibold text-muted-foreground">Rekening Tujuan Klinik:</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      BCA Virtual &amp; Konvensional
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-background border border-border/80">
                      <span className="text-muted-foreground text-[11px]">Nomor Rekening:</span>
                      <div className="flex items-center justify-between gap-1">
                        <strong className="font-mono text-sm text-foreground">{bcaAccount}</strong>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleCopy(bcaAccount, "Nomor Rekening")}
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "Nomor Rekening" ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-background border border-border/80">
                      <span className="text-muted-foreground text-[11px]">Atas Nama:</span>
                      <strong className="text-xs text-foreground truncate">{bcaName}</strong>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-background border border-border/80">
                      <span className="text-muted-foreground text-[11px]">Nominal Transfer:</span>
                      <div className="flex items-center justify-between gap-1">
                        <strong className="font-mono text-xs text-primary">
                          {formatRupiah(booking.extensionFee)}
                        </strong>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleCopy(String(booking.extensionFee), "Nominal")}
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "Nominal" ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-background border border-border/80">
                      <span className="text-muted-foreground text-[11px]">Berita Acara Transfer:</span>
                      <div className="flex items-center justify-between gap-1">
                        <strong className="font-mono text-xs text-foreground truncate">{transferNote}</strong>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleCopy(transferNote, "Berita Transfer")}
                          className="size-6 text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "Berita Transfer" ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload Box */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="upload-extension-proof" className="text-xs font-semibold text-foreground">
                    Unggah Bukti Transfer Bank (JPG, PNG, PDF maks. 5MB):
                  </label>
                  <div className="relative flex flex-col items-center justify-center p-5 border-2 border-dashed border-border hover:border-primary/50 rounded-xl bg-background/50 hover:bg-muted/20 transition-all text-center">
                    <input
                      id="upload-extension-proof"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={isSubmitting}
                    />
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Upload className="size-5" />
                      </div>
                      {file ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-semibold text-foreground max-w-xs truncate">
                            {file.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {(file.size / 1024).toFixed(0)} KB • Klik untuk mengganti
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-xs font-medium text-foreground">
                            Klik atau seret struk transfer ke sini
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Format JPG, PNG, atau PDF
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!file || isSubmitting}
                  className="w-full text-xs h-10 font-semibold gap-2 mt-1"
                  id="btn-submit-manual-extension"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                      <span>Mengunggah &amp; Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Check data-icon="inline-start" className="size-4" />
                      <span>Kirim Bukti Pembayaran Extend</span>
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Automated Xendit Gateway */
              <div className="flex flex-col gap-4 p-4 rounded-xl border border-border/80 bg-background">
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-foreground">Pembayaran Instan via Xendit</span>
                  <p className="text-muted-foreground leading-relaxed">
                    Selesaikan pelunasan biaya perpanjangan sesi melalui QRIS (GoPay, OVO, Dana, ShopeePay, BCA Mobile)
                    atau Virtual Account bank otomatis tanpa perlu mengunggah struk manual.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleSubmitXendit}
                  disabled={isSubmitting}
                  className="w-full text-xs h-10 font-semibold gap-2"
                  id="btn-submit-xendit-extension"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                      <span>Mempersiapkan Xendit...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard data-icon="inline-start" className="size-4" />
                      <span>Bayar via Xendit Sekarang</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/10 border-t border-border/60 p-3.5 sm:p-4 text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-primary" />
          Pelunasan Terbuka Hingga Sesi Berakhir
        </span>
        <span className="font-mono text-[10px]">Toleransi Grace Period 5m Diterapkan</span>
      </CardFooter>
    </Card>
  )
}
