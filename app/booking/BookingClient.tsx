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
  Heart,
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
import { PublicShell } from "@/components/public/public-shell"
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
  isScreeningRequired?: boolean
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
  isScreeningRequired = false,
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
    <PublicShell>
      <div className="relative flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Calming Ambient Breathing Aura */}
        <div
          className="absolute -top-20 sm:-top-28 left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] md:w-[850px] h-[300px] sm:h-[450px] bg-gradient-to-b from-purple-400/15 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/20 dark:via-purple-950/10"
          aria-hidden="true"
        />

        {/* Back Link Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/counselors"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" data-icon="inline-start" />
            <span>Kembali ke Katalog Konselor</span>
          </Link>
        </div>

        {/* Empathetic Page Header */}
        <div className="mb-8 flex flex-col gap-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-purple-300 text-xs font-semibold shadow-2xs w-fit">
            <Heart className="size-3.5 fill-primary/30 text-primary dark:text-purple-300" aria-hidden="true" />
            <span>Konfirmasi &amp; Reservasi Sesi Privat</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.2]">
            Satu Langkah Lagi Menuju Sesi Tenang
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl font-normal text-pretty">
            Ruang telekonseling 90 menit privat bersama mitra konselor pilihan Anda. Bebas registrasi akun, tanpa instalasi aplikasi khusus, dan dijamin 100% rahasia.
          </p>
        </div>

        {/* Banner Slot Hold Guarantee */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div className="leading-relaxed">
              <span className="font-semibold text-foreground">Privasi Terjaga &amp; Bebas Akun:</span>{" "}
              <span className="text-muted-foreground">Slot 90 menit Anda dikunci sementara selama 17 menit saat menyelesaikan transaksi.</span>
            </div>
          </div>
          <Badge variant="outline" className="bg-background/90 text-xs font-medium border-emerald-500/30 px-3 py-1 rounded-full shrink-0">
            <Clock className="size-3 mr-1 text-emerald-600 dark:text-emerald-400" />
            <span>Hold 17 Menit</span>
          </Badge>
        </div>

        {/* Global Server Error */}
        {serverError && (
          <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/30">
            <AlertCircle className="size-4" />
            <AlertTitle className="font-semibold">Pemberitahuan</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm leading-relaxed">{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmitBooking}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Form Details & Payment */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Step 1: Identitas Pasien Tamu */}
              <Card className="rounded-2xl border border-border/80 shadow-xs bg-card hover:shadow-sm transition-all overflow-hidden gap-0">
                <CardHeader className="p-6 sm:p-7 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                      <span className="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        1
                      </span>
                      <span>Identitas Pasien (Guest Checkout)</span>
                    </CardTitle>
                    <Badge variant="secondary" className="rounded-full text-[11px] px-2.5 py-0.5 font-medium">
                      Tanpa Registrasi
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                    Tautan ruang sesi Zoom dan konfirmasi akan dikirimkan langsung ke kontak yang Anda masukkan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-7 flex flex-col gap-5">
                  <FieldGroup>
                    <Field data-invalid={!!errors.patientName}>
                      <FieldLabel htmlFor="patientName" className="text-xs sm:text-sm font-semibold text-foreground">
                        Nama Lengkap / Panggilan
                      </FieldLabel>
                      <Input
                        id="patientName"
                        placeholder="Contoh: Budi Santoso"
                        value={patientName}
                        onChange={(e) => {
                          setPatientName(e.target.value)
                          if (errors.patientName) setErrors((prev) => ({ ...prev, patientName: "" }))
                        }}
                        className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/25"
                        aria-invalid={!!errors.patientName}
                      />
                      {errors.patientName ? (
                        <FieldError errors={[{ message: errors.patientName }]} />
                      ) : (
                        <FieldDescription className="text-xs text-muted-foreground">
                          Boleh menggunakan nama panggilan yang membuat Anda merasa nyaman.
                        </FieldDescription>
                      )}
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field data-invalid={!!errors.patientEmail}>
                        <FieldLabel htmlFor="patientEmail" className="text-xs sm:text-sm font-semibold text-foreground">
                          Alamat Email
                        </FieldLabel>
                        <Input
                          id="patientEmail"
                          type="email"
                          placeholder="nama@email.com"
                          value={patientEmail}
                          onChange={(e) => {
                            setPatientEmail(e.target.value)
                            if (errors.patientEmail) setErrors((prev) => ({ ...prev, patientEmail: "" }))
                          }}
                          className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/25"
                          aria-invalid={!!errors.patientEmail}
                        />
                        {errors.patientEmail && (
                          <FieldError errors={[{ message: errors.patientEmail }]} />
                        )}
                      </Field>

                      <Field data-invalid={!!errors.patientEmailConfirm}>
                        <FieldLabel htmlFor="patientEmailConfirm" className="text-xs sm:text-sm font-semibold text-foreground">
                          Konfirmasi Email
                        </FieldLabel>
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
                          className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/25"
                          aria-invalid={!!errors.patientEmailConfirm}
                        />
                        {errors.patientEmailConfirm && (
                          <FieldError errors={[{ message: errors.patientEmailConfirm }]} />
                        )}
                      </Field>
                    </div>

                    <Field data-invalid={!!errors.patientPhone}>
                      <FieldLabel htmlFor="patientPhone" className="text-xs sm:text-sm font-semibold text-foreground">
                        Nomor WhatsApp Aktif
                      </FieldLabel>
                      <Input
                        id="patientPhone"
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={patientPhone}
                        onChange={(e) => {
                          setPatientPhone(e.target.value)
                          if (errors.patientPhone) setErrors((prev) => ({ ...prev, patientPhone: "" }))
                        }}
                        className="h-11 rounded-xl text-sm border-border/80 focus-visible:ring-2 focus-visible:ring-primary/25"
                        aria-invalid={!!errors.patientPhone}
                      />
                      {errors.patientPhone ? (
                        <FieldError errors={[{ message: errors.patientPhone }]} />
                      ) : (
                        <FieldDescription className="text-xs text-muted-foreground">
                          Digunakan oleh konselor atau tim bantuan jika ada kendala koneksi mendadak.
                        </FieldDescription>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="initialNotes" className="text-xs sm:text-sm font-semibold text-foreground">
                        <span>Catatan Awal untuk Konselor</span>
                        <span className="text-muted-foreground font-normal text-xs ml-1">(Opsional)</span>
                      </FieldLabel>
                      <Textarea
                        id="initialNotes"
                        rows={3}
                        placeholder="Ceritakan secara singkat hal yang ingin Anda diskusikan atau kecemasan yang sedang dirasakan..."
                        value={initialNotes}
                        onChange={(e) => setInitialNotes(e.target.value)}
                        className="rounded-xl border-border/80 text-sm focus-visible:ring-2 focus-visible:ring-primary/25 resize-none p-3.5 leading-relaxed"
                      />
                      <FieldDescription className="text-xs text-muted-foreground">
                        Informasi ini membantu konselor mempersiapkan pendekatan klinis sebelum sesi dimulai.
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>

              {/* Step 2: Metode Pembayaran (Dual-Path) */}
              <Card className="rounded-2xl border border-border/80 shadow-xs bg-card hover:shadow-sm transition-all overflow-hidden gap-0">
                <CardHeader className="p-6 sm:p-7 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                      <span className="size-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>Pilihan Metode Pembayaran</span>
                    </CardTitle>
                    <Badge variant="outline" className="rounded-full text-[11px] px-2.5 py-0.5 font-medium border-border/80">
                      Aman &amp; Terenkripsi
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                    Pilih pembayaran instan otomatis melalui gateway atau transfer langsung ke rekening platform.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-7 flex flex-col gap-4">
                  <RadioGroup
                    value={paymentProvider}
                    onValueChange={(val) => setPaymentProvider(val as "xendit" | "manual")}
                    className="flex flex-col gap-3.5"
                  >
                    {/* Path A: Xendit */}
                    <label
                      htmlFor="pay-xendit"
                      className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        paymentProvider === "xendit"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-2xs"
                          : "border-border/80 hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      <RadioGroupItem value="xendit" id="pay-xendit" className="mt-0.5" />
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-semibold text-sm sm:text-base text-foreground">
                            Pembayaran Otomatis (Xendit Gateway)
                          </span>
                          <Badge variant="secondary" className="rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-none px-2.5 py-0.5">
                            Verifikasi Instan
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          QRIS (GoPay, OVO, ShopeePay, DANA) &amp; Virtual Account (BCA, Mandiri, BRI, BNI). Ruang Zoom langsung aktif otomatis tanpa konfirmasi manual.
                        </p>
                      </div>
                    </label>

                    {/* Path B: Manual Bank Transfer */}
                    <label
                      htmlFor="pay-manual"
                      className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                        paymentProvider === "manual"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-2xs"
                          : "border-border/80 hover:bg-muted/40 hover:border-border"
                      }`}
                    >
                      <RadioGroupItem value="manual" id="pay-manual" className="mt-0.5" />
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-semibold text-sm sm:text-base text-foreground">
                            Transfer Bank Manual
                          </span>
                          <Badge variant="outline" className="rounded-full text-[10px] sm:text-xs font-medium border-border/80 px-2.5 py-0.5">
                            Verifikasi Admin
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          Transfer langsung ke rekening resmi platform (BCA, Mandiri, BRI). Pengecekan mutasi dilakukan oleh Tim Solulu via WhatsApp.
                        </p>
                      </div>
                    </label>
                  </RadioGroup>

                  {/* Manual Bank Choice (if manual selected) */}
                  {paymentProvider === "manual" && (
                    <div className="mt-2 p-4 sm:p-5 rounded-xl bg-muted/30 border border-border/60 flex flex-col gap-3">
                      <span className="text-xs sm:text-sm font-semibold text-foreground">
                        Pilih Rekening Tujuan Transfer:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {["Bank BCA", "Bank Mandiri", "Bank BRI"].map((bank) => (
                          <Button
                            key={bank}
                            type="button"
                            variant={manualBank === bank ? "public" : "outline"}
                            size="pill-sm"
                            onClick={() => setManualBank(bank)}
                            className="h-9 text-xs sm:text-sm font-medium justify-center cursor-pointer"
                          >
                            {manualBank === bank && (
                              <Check className="size-3.5 mr-1" data-icon="inline-start" />
                            )}
                            <span>{bank}</span>
                          </Button>
                        ))}
                      </div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed mt-0.5">
                        Nomor rekening lengkap dan petunjuk transfer akan ditampilkan setelah Anda menekan tombol konfirmasi di samping.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary & Voucher */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
              {/* Order Summary Card */}
              <Card className="rounded-2xl border border-border/80 shadow-xs bg-card hover:shadow-sm transition-all overflow-hidden gap-0">
                <CardHeader className="p-6 sm:p-7 border-b border-border/40">
                  <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    Ringkasan Sesi Konseling
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                    Rincian jadwal 90 menit dan estimasi biaya sesi privat Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-7 flex flex-col gap-5 text-xs sm:text-sm">
                  {/* Counselor Mini Profile */}
                  <div className="flex items-start gap-3.5 p-4 rounded-xl bg-muted/30 border border-border/60">
                    <Avatar className="size-12 rounded-xl border border-border/80 shrink-0">
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
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {counselor.fullName}
                        </span>
                        <Badge variant="outline" className="rounded-full text-[10px] font-medium border-primary/20 text-primary bg-primary/5 py-0">
                          {counselor.counselorTypeDisplay}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-1">{counselor.title}</span>
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-primary" />
                        <span>Tanggal Sesi:</span>
                      </span>
                      <span className="font-semibold text-foreground">{schedule.date}</span>
                    </div>

                    <div className="flex items-center justify-between py-2.5 border-b border-border/40">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" />
                        <span>Waktu &amp; Durasi:</span>
                      </span>
                      <div className="text-right">
                        <div className="font-semibold text-foreground">{schedule.timeRange}</div>
                        <div className="text-[11px] text-muted-foreground">90 Menit Penuh</div>
                      </div>
                    </div>

                    {screening ? (
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2.5">
                        <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-foreground">Skrining SRQ-20 Terlampir:</span> Skor {screening.totalScore}/20 telah tersimpan untuk referensi klinis konselor.
                        </div>
                      </div>
                    ) : isScreeningRequired ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col gap-2.5">
                        <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                          <AlertCircle className="size-4 shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold">Skrining SRQ-20 Diwajibkan</span>
                            <span className="text-[11px] leading-relaxed text-muted-foreground">
                              Sebelum melanjutkan pembayaran, silakan lengkapi kuesioner skrining mandiri 20 butir agar konselor memahami kebutuhan sesi Anda.
                            </span>
                          </div>
                        </div>
                        <Button asChild variant="public" size="pill-sm" className="w-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white">
                          <Link href={`/screening?counselorId=${counselor.id}&scheduleId=${schedule.id}`}>
                            <span>Isi Skrining SRQ-20 Sekarang</span>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-center justify-between gap-2">
                        <span>Ingin memberi konteks emosional ke konselor?</span>
                        <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-primary font-medium">
                          <Link href={`/screening?counselorId=${counselor.id}&scheduleId=${schedule.id}`}>
                            Isi Skrining (Opsional)
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Voucher Section */}
                  <div className="pt-3 border-t border-border/40 flex flex-col gap-2.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Tag className="size-3.5 text-primary" />
                      <span>Kupon Potongan Harga</span>
                    </span>

                    {!appliedVoucher ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ketik kode kupon"
                            value={voucherCodeInput}
                            onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                            className="h-9 rounded-xl text-xs sm:text-sm font-mono tracking-wider uppercase border-border/80"
                            disabled={isValidatingVoucher || !pricing.allowVoucher}
                          />
                          <Button
                            type="button"
                            variant="public-secondary"
                            size="pill-sm"
                            onClick={handleApplyVoucher}
                            disabled={isValidatingVoucher || !voucherCodeInput.trim() || !pricing.allowVoucher}
                            className="h-9 px-4 text-xs font-semibold shrink-0 cursor-pointer"
                          >
                            {isValidatingVoucher ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <span>Terapkan</span>
                            )}
                          </Button>
                        </div>
                        {!pricing.allowVoucher && (
                          <span className="text-[11px] text-muted-foreground">
                            Voucher tidak dapat digunakan untuk tipe konselor ini.
                          </span>
                        )}
                        {voucherError && (
                          <span className="text-xs text-destructive font-medium">
                            {voucherError}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                        <div className="flex items-center gap-2.5">
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
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2.5 rounded-full cursor-pointer"
                        >
                          Hapus
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="pt-2 border-t border-border/40 flex flex-col gap-2 text-xs sm:text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tarif Konseling (90 Menit):</span>
                      <span className={pricing.isSaleActive ? "line-through" : "text-foreground font-medium"}>
                        {formatRupiah(pricing.basePrice)}
                      </span>
                    </div>

                    {pricing.isSaleActive && pricing.promoPrice && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                        <span>Potongan Promosi:</span>
                        <span>- {formatRupiah(pricing.basePrice - pricing.promoPrice)}</span>
                      </div>
                    )}

                    {appliedVoucher && (
                      <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                        <span>Potongan Kupon ({appliedVoucher.code}):</span>
                        <span>- {appliedVoucher.discountFormatted}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-3 border-t border-border/60">
                      <span className="text-sm sm:text-base font-bold text-foreground">Total Biaya:</span>
                      <span className="text-xl sm:text-2xl font-bold font-heading text-primary dark:text-purple-300 tabular-nums">
                        {netAmountFormatted}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 sm:p-7 border-t border-border/40 bg-muted/10 flex flex-col gap-3.5">
                  <Button
                    type="submit"
                    variant="public"
                    size="pill-lg"
                    disabled={isSubmitting || (isScreeningRequired && !screening)}
                    className="w-full h-12 sm:h-13 text-sm sm:text-base font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg active:scale-[0.99] transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                        <span>Mengunci Slot &amp; Menyiapkan Pembayaran...</span>
                      </>
                    ) : isScreeningRequired && !screening ? (
                      <span>Lengkapi Skrining Terlebih Dahulu</span>
                    ) : paymentProvider === "xendit" ? (
                      <>
                        <span>Lanjut ke Pembayaran Otomatis</span>
                        <ArrowRight className="size-4" data-icon="inline-end" />
                      </>
                    ) : (
                      <>
                        <span>Konfirmasi Pemesanan &amp; Dapatkan Rekening</span>
                        <ArrowRight className="size-4" data-icon="inline-end" />
                      </>
                    )}
                  </Button>

                  {isScreeningRequired && !screening && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 text-center font-medium">
                      Mohon selesaikan pengisian skrining SRQ-20 di atas untuk membuka tombol pembayaran.
                    </span>
                  )}

                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground text-center">
                    <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Enkripsi privasi standar SSL 256-bit. Ruang Zoom privat tanpa rekaman.</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </PublicShell>
  )
}
