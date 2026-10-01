"use client"

import * as React from "react"
import Link from "next/link"
import {
  Search,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Lock,
} from "lucide-react"
import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { recoverSessionLinkAction } from "@/lib/session/recovery"

export default function CekSesiClient() {
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string
    phone?: string
  }>({})
  const [status, setStatus] = React.useState<{
    type: "idle" | "success" | "error" | "rate_limited"
    message?: string
  }>({ type: "idle" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setStatus({ type: "idle" })

    // Client-side quick validation
    const errors: { email?: string; phone?: string } = {}
    if (!email.trim()) {
      errors.email = "Email wajib diisi"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Format email tidak valid"
    }

    if (!phone.trim()) {
      errors.phone = "Nomor WhatsApp wajib diisi"
    } else if (phone.replace(/\D/g, "").length < 9) {
      errors.phone = "Nomor WhatsApp minimal 9 digit"
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await recoverSessionLinkAction({
        email: email.trim(),
        phone: phone.trim(),
      })

      if (res.rateLimited) {
        setStatus({
          type: "rate_limited",
          message: res.error || "Batas percobaan pengecekan tercapai (maksimal 3 kali dalam 15 menit).",
        })
      } else if (res.success) {
        setStatus({
          type: "success",
          message: res.message,
        })
      } else {
        setStatus({
          type: "error",
          message: res.error || "Terjadi kesalahan saat memproses permintaan Anda.",
        })
      }
    } catch {
      setStatus({
        type: "error",
        message: "Gagal terhubung ke server. Silakan periksa koneksi internet Anda.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const whatsappSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || "6281234567890"
  const waSupportUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
    `Halo Tim Solulu, saya mengalami kendala saat memulihkan tautan sesi saya untuk email: ${email || "[Email]"}`
  )}`

  return (
    <PublicShell>
      <div className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 flex flex-col gap-8 justify-center">
        {/* 1. Welcoming Hero & Context Header */}
        <section className="flex flex-col items-center text-center gap-3.5 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold shadow-2xs">
            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
            <span>Bantuan Akses Sesi Solulu</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] text-balance">
            Cek &amp; Temukan Tautan Sesi
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-pretty">
            Lupa simpan atau belum menerima tautan ruang Zoom konselingmu? Masukkan email dan nomor WhatsApp yang kamu pakai saat mendaftar, tautan sesi akan langsung kami kirimkan ulang ke emailmu.
          </p>

          {/* Trust Guarantee Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border/70 text-foreground/90 font-medium shadow-2xs">
              <Lock className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>100% Rahasia &amp; Aman</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border/70 text-foreground/90 font-medium shadow-2xs">
              <Mail className="size-3 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Kirim Langsung ke Email</span>
            </span>
          </div>
        </section>

        {/* 2. Interactive Form Card */}
        <Card className="border border-border/80 shadow-xs relative overflow-hidden rounded-2xl bg-card">
          <CardHeader className="text-center pb-4 pt-7 px-6 sm:px-8">
            <div className="size-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 mx-auto flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2 shadow-2xs">
              <Search className="size-5" />
            </div>
            <CardTitle className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Verifikasi Data Sesi
            </CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs sm:text-sm text-muted-foreground text-pretty leading-relaxed pt-1">
              Kami akan mencocokkan email dan nomor WhatsApp dengan jadwal sesi aktifmu di Solulu.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6 pt-2 px-6 sm:px-8">
            {/* Status Notifications */}
            {status.type === "success" && (
              <Alert className="rounded-2xl border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 p-4">
                <CheckCircle2
                  data-icon="inline-start"
                  className="text-emerald-600 dark:text-emerald-400 size-4.5"
                />
                <AlertTitle className="font-semibold text-sm">
                  Permintaan Berhasil Diproses
                </AlertTitle>
                <AlertDescription className="text-xs leading-relaxed flex flex-col gap-2 mt-1">
                  <span>{status.message}</span>
                  <span className="text-[11px] text-muted-foreground/90">
                    💡 <em>Tips:</em> Jika email tidak muncul dalam 3–5 menit, pastikan memeriksa
                    folder <strong>Spam</strong> atau <strong>Promosi</strong> Anda.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {status.type === "rate_limited" && (
              <Alert className="rounded-2xl border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100 p-4">
                <AlertCircle
                  data-icon="inline-start"
                  className="text-amber-600 dark:text-amber-400 size-4.5"
                />
                <AlertTitle className="font-semibold text-sm">
                  Batas Pengecekan Tercapai
                </AlertTitle>
                <AlertDescription className="text-xs leading-relaxed flex flex-col gap-3 mt-1">
                  <span>{status.message}</span>
                  <div className="pt-1">
                    <Button
                      asChild
                      variant="outline"
                      className="border-amber-500/40 hover:bg-amber-500/20 text-xs h-9 px-4 rounded-full font-semibold cursor-pointer"
                    >
                      <a href={waSupportUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle data-icon="inline-start" className="size-3.5" />
                        <span>Bantuan Langsung WhatsApp</span>
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {status.type === "error" && (
              <Alert className="rounded-2xl border-destructive/30 bg-destructive/10 text-destructive p-4">
                <AlertCircle
                  data-icon="inline-start"
                  className="text-destructive size-4.5"
                />
                <AlertTitle className="font-semibold text-sm">Gagal Memproses Data</AlertTitle>
                <AlertDescription className="text-xs mt-1 leading-relaxed">
                  {status.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FieldGroup className="flex flex-col gap-4">
                <Field data-invalid={Boolean(fieldErrors.email)}>
                  <FieldLabel htmlFor="patientEmail" className="text-xs font-semibold text-foreground">
                    Email Saat Mendaftar
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="patientEmail"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (fieldErrors.email) {
                          setFieldErrors((prev) => ({ ...prev, email: undefined }))
                        }
                      }}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(fieldErrors.email)}
                      className="h-11 pl-10 rounded-xl border-border/80 bg-background text-sm focus-visible:ring-purple-500/30 shadow-2xs font-normal"
                    />
                    <Mail className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {fieldErrors.email ? (
                    <FieldError className="text-xs text-destructive mt-1">{fieldErrors.email}</FieldError>
                  ) : (
                    <FieldDescription className="text-xs text-muted-foreground mt-1">
                      Alamat email yang kamu gunakan saat memesan jadwal sesi.
                    </FieldDescription>
                  )}
                </Field>

                <Field data-invalid={Boolean(fieldErrors.phone)}>
                  <FieldLabel htmlFor="patientPhone" className="text-xs font-semibold text-foreground">
                    Nomor WhatsApp Terdaftar
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="patientPhone"
                      type="tel"
                      placeholder="081234567890"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        if (fieldErrors.phone) {
                          setFieldErrors((prev) => ({ ...prev, phone: undefined }))
                        }
                      }}
                      disabled={isSubmitting}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      className="h-11 pl-10 rounded-xl border-border/80 bg-background text-sm focus-visible:ring-purple-500/30 shadow-2xs font-normal"
                    />
                    <Phone className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {fieldErrors.phone ? (
                    <FieldError className="text-xs text-destructive mt-1">{fieldErrors.phone}</FieldError>
                  ) : (
                    <FieldDescription className="text-xs text-muted-foreground mt-1">
                      Nomor telepon aktif untuk memastikan kepemilikan sesi.
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>

              {/* Standard Public Primary Button (h-11, rounded-full, text-sm font-semibold, #7c3aed) */}
              <Button
                type="submit"
                id="btn-recover-submit"
                disabled={isSubmitting}
                variant="public"
                size="pill"
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Mencari Data Sesimu...</span>
                  </>
                ) : (
                  <>
                    <Search className="size-4" />
                    <span>Kirim Ulang Tautan Sesi</span>
                  </>
                )}
              </Button>
            </form>

            {/* Privacy Protection Callout (US-20) */}
            <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 flex items-start gap-3">
              <ShieldCheck className="size-4.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Kerahasiaan Datamu Terjaga</span>
                <span className="text-pretty">
                  Demi menjaga privasi dan kerahasiaan identitasmu, detail sesi tidak kami tampilkan langsung di layar. Tautan sesi hanya dikirimkan ke alamat email yang terdaftar resmi di Solulu.
                </span>
              </div>
            </div>
          </CardContent>

          {/* Card Footer: Support link & Link to Catalog */}
          <CardFooter className="border-t border-border/60 bg-muted/20 px-6 sm:px-8 py-4.5 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="text-center sm:text-left">
              Ada kendala atau butuh bantuan segera?{" "}
              <a
                href={waSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
              >
                Hubungi Kami di WhatsApp
              </a>
            </span>
            <Button
              asChild
              variant="public-secondary"
              size="pill-sm"
            >
              <Link href="/counselors">
                <span>Pesan Sesi Baru</span>
                <ArrowRight className="size-3.5" data-icon="inline-end" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PublicShell>
  )
}

