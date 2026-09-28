"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  Clock,
  Calendar,
  Lock,
  ArrowRight,
  ArrowLeft,
  Tag,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Loader2,
  Smartphone,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { ThemeToggle } from "@/components/theme-toggle"
import { indonesianPhoneRegex } from "@/lib/validations/booking"
import {
  validateVoucherAction,
  createGuestBookingAction,
  type BookingContextData,
} from "./actions"

interface BookingClientProps {
  initialData: BookingContextData
  screeningId?: string
  initialError?: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function BookingClient({
  initialData,
  screeningId,
  initialError,
}: BookingClientProps) {
  const router = useRouter()
  const { counselor, schedule, pricing, screening } = initialData

  // Patient Identity state
  const [patientName, setPatientName] = React.useState("")
  const [patientEmail, setPatientEmail] = React.useState("")
  const [patientEmailConfirm, setPatientEmailConfirm] = React.useState("")
  const [patientPhone, setPatientPhone] = React.useState("")
  const [initialNotes, setInitialNotes] = React.useState("")

  // Form field errors
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [serverError, setServerError] = React.useState<string | null>(
    initialError ? "Pembayaran sebelumnya belum berhasil. Silakan coba kembali." : null
  )

  // Voucher state
  const [voucherCodeInput, setVoucherCodeInput] = React.useState("")
  const [isValidatingVoucher, setIsValidatingVoucher] = React.useState(false)
  const [appliedVoucher, setAppliedVoucher] = React.useState<{
    code: string
    discountAmount: number
    discountFormatted: string
    netAmount: number
    message: string
  } | null>(null)
  const [voucherError, setVoucherError] = React.useState<string | null>(null)

  // Payment method state
  const [paymentProvider, setPaymentProvider] = React.useState<"xendit" | "manual">("xendit")
  const [manualBank, setManualBank] = React.useState<string>("Bank BCA")

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Pricing calculations
  const grossAmount = pricing.grossAmount
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0
  const netAmount = Math.max(0, grossAmount - discountAmount)
  const netAmountFormatted = formatRupiah(netAmount)

  // Validate voucher handler
  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCodeInput.trim()) {
      setVoucherError("Masukkan kode voucher terlebih dahulu")
      return
    }

    setIsValidatingVoucher(true)
    setVoucherError(null)

    try {
      const res = await validateVoucherAction({
        code: voucherCodeInput.trim(),
        counselorType: counselor.counselorType,
        grossAmount,
      })

      if (res.success && res.data) {
        setAppliedVoucher({
          code: res.data.code,
          discountAmount: res.data.discountAmount,
          discountFormatted: res.data.discountFormatted,
          netAmount: res.data.netAmount,
          message: res.data.message,
        })
        setVoucherError(null)
      } else {
        setAppliedVoucher(null)
        setVoucherError(res.error || "Kode voucher tidak valid")
      }
    } catch (err: any) {
      setVoucherError("Gagal memeriksa voucher. Periksa koneksi Anda.")
    } finally {
      setIsValidatingVoucher(false)
    }
  }

  // Remove applied voucher
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCodeInput("")
    setVoucherError(null)
  }

  // Client-side validation before submission
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}

    if (!patientName.trim() || patientName.trim().length < 2) {
      errs.patientName = "Nama lengkap wajib diisi minimal 2 karakter"
    }

    if (!patientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail.trim())) {
      errs.patientEmail = "Format email tidak valid"
    }

    if (!patientEmailConfirm.trim()) {
      errs.patientEmailConfirm = "Konfirmasi email wajib diisi"
    } else if (patientEmail.trim().toLowerCase() !== patientEmailConfirm.trim().toLowerCase()) {
      errs.patientEmailConfirm = "Konfirmasi email tidak cocok dengan email Anda"
    }

    if (!patientPhone.trim()) {
      errs.patientPhone = "Nomor WhatsApp aktif wajib diisi"
    } else if (!indonesianPhoneRegex.test(patientPhone.trim())) {
      errs.patientPhone = "Nomor WhatsApp harus nomor Indonesia yang valid (cth: 08123456789 atau +628123456789)"
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Handle checkout submit
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await createGuestBookingAction({
        scheduleId: schedule.id,
        counselorId: counselor.id,
        screeningId: screeningId || undefined,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim().toLowerCase(),
        patientEmailConfirm: patientEmailConfirm.trim().toLowerCase(),
        patientPhone: patientPhone.trim(),
        initialNotes: initialNotes.trim() || undefined,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
        paymentProvider,
        paymentMethod: paymentProvider === "manual" ? manualBank : "Xendit Gateway",
      })

      if (!res.success || !res.data) {
        setServerError(res.error || "Gagal memproses pemesanan. Silakan periksa kembali formulir Anda.")
        setIsSubmitting(false)
        return
      }

      // Route according to payment provider
      if (res.data.paymentProvider === "xendit" && res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl
      } else if (res.data.redirectUrl) {
        router.push(res.data.redirectUrl)
      } else {
        router.push(`/booking/success?token=${res.data.accessToken}`)
      }
    } catch (err: any) {
      setServerError("Terjadi kendala jaringan saat memproses pemesanan. Coba lagi dalam beberapa saat.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/counselors"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" data-icon="inline-start" />
            <span>Katalog Konselor</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground tracking-tight">
              Solulu Checkout
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 md:py-8">
        {/* Banner Slot Hold Guarantee */}
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="font-semibold">Privasi Terjaga & Bebas Akun:</span>{" "}
              <span>Slot 90 menit Anda dikunci selama 17 menit saat Anda menyelesaikan transaksi.</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-background/80 text-[11px] font-medium border-emerald-500/30 shrink-0">
            <Clock className="size-3 mr-1 text-emerald-600 dark:text-emerald-400" />
            <span>Hold 17 Menit</span>
          </Badge>
        </div>

        {/* Global Server Error */}
        {serverError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-4" />
            <AlertTitle>Pemberitahuan</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmitBooking}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Form Details & Payment */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Step 1: Identitas Pasien Tamu */}
              <Card className="border-border/60">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        1
                      </span>
                      <span>Identitas Pasien (Guest Checkout)</span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      Tanpa Registrasi
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Tautan ruang sesi Zoom dan konfirmasi akan dikirimkan langsung ke kontak yang Anda masukkan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <FieldGroup>
                    <Field data-invalid={!!errors.patientName}>
                      <FieldLabel htmlFor="patientName">Nama Lengkap / Panggilan</FieldLabel>
                      <Input
                        id="patientName"
                        placeholder="Contoh: Budi Santoso"
                        value={patientName}
                        onChange={(e) => {
                          setPatientName(e.target.value)
                          if (errors.patientName) setErrors((prev) => ({ ...prev, patientName: "" }))
                        }}
                        aria-invalid={!!errors.patientName}
                      />
                      {errors.patientName ? (
                        <FieldError errors={[{ message: errors.patientName }]} />
                      ) : (
                        <FieldDescription>
                          Boleh menggunakan nama panggilan yang membuat Anda merasa nyaman.
                        </FieldDescription>
                      )}
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field data-invalid={!!errors.patientEmail}>
                        <FieldLabel htmlFor="patientEmail">Alamat Email</FieldLabel>
                        <Input
                          id="patientEmail"
                          type="email"
                          placeholder="nama@email.com"
                          value={patientEmail}
                          onChange={(e) => {
                            setPatientEmail(e.target.value)
                            if (errors.patientEmail) setErrors((prev) => ({ ...prev, patientEmail: "" }))
                          }}
                          aria-invalid={!!errors.patientEmail}
                        />
                        {errors.patientEmail && (
                          <FieldError errors={[{ message: errors.patientEmail }]} />
                        )}
                      </Field>

                      <Field data-invalid={!!errors.patientEmailConfirm}>
                        <FieldLabel htmlFor="patientEmailConfirm">Konfirmasi Email</FieldLabel>
                        <Input
                          id="patientEmailConfirm"
                          type="email"
                          placeholder="Ketik ulang email"
                          value={patientEmailConfirm}
                          onChange={(e) => {
                            setPatientEmailConfirm(e.target.value)
                            if (errors.patientEmailConfirm)
                              setErrors((prev) => ({ ...prev, patientEmailConfirm: "" }))
                          }}
                          aria-invalid={!!errors.patientEmailConfirm}
                        />
                        {errors.patientEmailConfirm && (
                          <FieldError errors={[{ message: errors.patientEmailConfirm }]} />
                        )}
                      </Field>
                    </div>

                    <Field data-invalid={!!errors.patientPhone}>
                      <FieldLabel htmlFor="patientPhone">Nomor WhatsApp Aktif</FieldLabel>
                      <Input
                        id="patientPhone"
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={patientPhone}
                        onChange={(e) => {
                          setPatientPhone(e.target.value)
                          if (errors.patientPhone) setErrors((prev) => ({ ...prev, patientPhone: "" }))
                        }}
                        aria-invalid={!!errors.patientPhone}
                      />
                      {errors.patientPhone ? (
                        <FieldError errors={[{ message: errors.patientPhone }]} />
                      ) : (
                        <FieldDescription>
                          Digunakan oleh konselor atau tim bantuan jika ada kendala koneksi mendadak.
                        </FieldDescription>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="initialNotes">
                        <span>Catatan Awal untuk Konselor</span>
                        <span className="text-muted-foreground font-normal text-xs ml-1">(Opsional)</span>
                      </FieldLabel>
                      <Textarea
                        id="initialNotes"
                        rows={3}
                        placeholder="Ceritakan secara singkat hal yang ingin Anda diskusikan atau kecemasan yang sedang dirasakan..."
                        value={initialNotes}
                        onChange={(e) => setInitialNotes(e.target.value)}
                        className="resize-none text-xs"
                      />
                      <FieldDescription>
                        Informasi ini membantu konselor mempersiapkan pendekatan klinis sebelum sesi dimulai.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              {/* Step 2: Metode Pembayaran (Dual-Path) */}
              <Card className="border-border/60">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span className="size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>Pilihan Metode Pembayaran</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      Aman & Terenkripsi
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Pilih pembayaran instan otomatis melalui gateway atau transfer langsung ke rekening platform.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <RadioGroup
                    value={paymentProvider}
                    onValueChange={(val) => setPaymentProvider(val as "xendit" | "manual")}
                    className="flex flex-col gap-3"
                  >
                    {/* Path A: Xendit */}
                    <label
                      htmlFor="pay-xendit"
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        paymentProvider === "xendit"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      <RadioGroupItem value="xendit" id="pay-xendit" className="mt-0.5" />
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">
                            Pembayaran Otomatis (Xendit Gateway)
                          </span>
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-none">
                            Verifikasi Instan
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          QRIS (GoPay, OVO, ShopeePay, DANA) & Virtual Account (BCA, Mandiri, BRI, BNI). Ruang Zoom langsung aktif otomatis.
                        </p>
                      </div>
                    </label>

                    {/* Path B: Manual Bank Transfer */}
                    <label
                      htmlFor="pay-manual"
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        paymentProvider === "manual"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border/60 hover:bg-muted/40"
                      }`}
                    >
                      <RadioGroupItem value="manual" id="pay-manual" className="mt-0.5" />
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">
                            Transfer Bank Manual
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            Verifikasi Admin
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Transfer langsung ke rekening resmi platform (BCA, Mandiri, BRI). Cek mutasi dan aktivasi dilakukan oleh Admin via WhatsApp.
                        </p>
                      </div>
                    </label>
                  </RadioGroup>

                  {/* Manual Bank Choice (if manual selected) */}
                  {paymentProvider === "manual" && (
                    <div className="mt-4 p-3 rounded-xl bg-muted/40 border border-border/60 flex flex-col gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        Pilih Rekening Tujuan Transfer:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {["Bank BCA", "Bank Mandiri", "Bank BRI"].map((bank) => (
                          <Button
                            key={bank}
                            type="button"
                            variant={manualBank === bank ? "default" : "outline"}
                            size="sm"
                            onClick={() => setManualBank(bank)}
                            className="h-8 text-xs font-medium justify-center cursor-pointer"
                          >
                            {manualBank === bank && (
                              <Check className="size-3 mr-1" data-icon="inline-start" />
                            )}
                            <span>{bank}</span>
                          </Button>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Nomor rekening lengkap dan petunjuk transfer akan ditampilkan setelah Anda menekan tombol konfirmasi di bawah.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary & Voucher */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-20">
              {/* Order Summary Card */}
              <Card className="border-border/60 shadow-xs">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold">Ringkasan Sesi Konseling</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col gap-4">
                  {/* Counselor Mini Profile */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/60">
                    <Avatar className="size-11 border border-border/80">
                      {counselor.avatarR2Url ? (
                        <AvatarImage src={counselor.avatarR2Url} alt={counselor.fullName} />
                      ) : null}
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {counselor.fullName
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-foreground">
                          {counselor.fullName}
                        </span>
                        <Badge variant="outline" className="text-[9px] py-0">
                          {counselor.counselorTypeDisplay}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{counselor.title}</span>
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" />
                        <span>Tanggal Sesi:</span>
                      </span>
                      <span className="font-semibold text-foreground">{schedule.date}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        <span>Waktu & Durasi:</span>
                      </span>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{schedule.timeRange}</div>
                        <div className="text-[10px] text-muted-foreground">90 Menit Penuh</div>
                      </div>
                    </div>

                    {screening && (
                      <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground flex items-start gap-2">
                        <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">Skrining SRQ-20 Terlampir:</span> Skor {screening.totalScore}/20 telah disimpan untuk referensi klinis konselor.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Voucher Section */}
                  <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Tag className="size-3.5 text-primary" />
                      <span>Kupon Potongan Harga</span>
                    </span>

                    {!appliedVoucher ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ketik kode kupon"
                            value={voucherCodeInput}
                            onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                            className="h-8 text-xs font-mono tracking-wider uppercase"
                            disabled={isValidatingVoucher || !pricing.allowVoucher}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleApplyVoucher}
                            disabled={isValidatingVoucher || !voucherCodeInput.trim() || !pricing.allowVoucher}
                            className="h-8 text-xs shrink-0 cursor-pointer"
                          >
                            {isValidatingVoucher ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <span>Terapkan</span>
                            )}
                          </Button>
                        </div>
                        {!pricing.allowVoucher && (
                          <span className="text-[10px] text-muted-foreground">
                            Voucher tidak dapat digunakan untuk tipe konselor ini.
                          </span>
                        )}
                        {voucherError && (
                          <span className="text-[11px] text-destructive font-medium">
                            {voucherError}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <span className="font-bold text-foreground font-mono">{appliedVoucher.code}</span>
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                              Hemat {appliedVoucher.discountFormatted}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveVoucher}
                          className="h-6 text-[11px] text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="pt-2 border-t border-border/40 flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tarif Konseling (90 Menit):</span>
                      <span className={pricing.isSaleActive ? "line-through" : "text-foreground font-medium"}>
                        {formatRupiah(pricing.basePrice)}
                      </span>
                    </div>

                    {pricing.isSaleActive && pricing.promoPrice && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                        <span>Potongan Promosi:</span>
                        <span>- {formatRupiah(pricing.basePrice - pricing.promoPrice)}</span>
                      </div>
                    )}

                    {appliedVoucher && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                        <span>Potongan Kupon ({appliedVoucher.code}):</span>
                        <span>- {appliedVoucher.discountFormatted}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-2 border-t border-border/60">
                      <span className="text-sm font-bold text-foreground">Total Biaya:</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {netAmountFormatted}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 flex flex-col gap-3">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full text-xs font-semibold gap-2 h-10 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                        <span>Mengunci Slot & Menyiapkan Pembayaran...</span>
                      </>
                    ) : paymentProvider === "xendit" ? (
                      <>
                        <span>Lanjut ke Pembayaran Otomatis</span>
                        <ArrowRight className="size-4" data-icon="inline-end" />
                      </>
                    ) : (
                      <>
                        <span>Konfirmasi Pemesanan & Dapatkan Rekening</span>
                        <ArrowRight className="size-4" data-icon="inline-end" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
                    <Lock className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Enkripsi privasi standar SSL 256-bit. Ruang Zoom privat.</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
