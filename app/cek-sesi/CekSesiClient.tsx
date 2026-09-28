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
  ArrowLeft,
  HeartPulse,
  MessageCircle,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Header Navigation */}
      <header className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              Solulu
            </Link>
            <span className="hidden sm:inline-block text-xs text-muted-foreground border-l border-border/80 pl-3">
              Pusat Pemulihan Sesi
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        <Card className="border-border/80 shadow-sm relative overflow-hidden bg-card">
          <div className="h-1.5 w-full bg-primary/20" />

          <CardHeader className="text-center pb-4 pt-6">
            <div className="size-11 rounded-full bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary mb-2">
              <Search className="size-5" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight">
              Cek & Pulihkan Tautan Sesi
            </CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs sm:text-sm">
              Kehilangan atau belum menerima tautan ruang Zoom telekonseling Anda? Masukkan data
              pendaftaran untuk mengirimkan kembali tautan langsung ke email Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6 pt-2">
            {/* Status Notifications */}
            {status.type === "success" && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100">
                <CheckCircle2
                  data-icon="inline-start"
                  className="text-emerald-600 dark:text-emerald-400 size-4"
                />
                <AlertTitle className="font-semibold text-sm">
                  Permintaan Berhasil Dikirim
                </AlertTitle>
                <AlertDescription className="text-xs leading-relaxed flex flex-col gap-2 mt-1">
                  <span>{status.message}</span>
                  <span className="text-[11px] text-muted-foreground/90">
                    💡 <em>Tips:</em> Jika email tidak muncul dalam 3–5 menit, pastikan mengecek
                    folder <strong>Spam</strong> atau <strong>Promosi</strong>.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {status.type === "rate_limited" && (
              <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
                <AlertCircle
                  data-icon="inline-start"
                  className="text-amber-600 dark:text-amber-400 size-4"
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
                      size="sm"
                      className="border-amber-500/40 hover:bg-amber-500/20 text-xs h-8"
                    >
                      <a href={waSupportUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle data-icon="inline-start" />
                        Bantuan Langsung WhatsApp
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {status.type === "error" && (
              <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                <AlertCircle
                  data-icon="inline-start"
                  className="text-destructive size-4"
                />
                <AlertTitle className="font-semibold text-sm">Gagal Memproses</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  {status.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <FieldGroup>
                <Field data-invalid={Boolean(fieldErrors.email)}>
                  <FieldLabel htmlFor="patientEmail">Email Pendaftaran</FieldLabel>
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
                      className="pl-9"
                    />
                    <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {fieldErrors.email ? (
                    <FieldError>{fieldErrors.email}</FieldError>
                  ) : (
                    <FieldDescription>
                      Alamat email yang Anda masukkan saat checkout sesi konseling.
                    </FieldDescription>
                  )}
                </Field>

                <Field data-invalid={Boolean(fieldErrors.phone)}>
                  <FieldLabel htmlFor="patientPhone">Nomor WhatsApp</FieldLabel>
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
                      className="pl-9"
                    />
                    <Phone className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {fieldErrors.phone ? (
                    <FieldError>{fieldErrors.phone}</FieldError>
                  ) : (
                    <FieldDescription>
                      Nomor telepon aktif untuk memverifikasi kepemilikan sesi.
                    </FieldDescription>
                  )}
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                id="btn-recover-submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                    <span>Memeriksa Data Sesi...</span>
                  </>
                ) : (
                  <>
                    <Search data-icon="inline-start" />
                    <span>Kirim Ulang Tautan Sesi</span>
                  </>
                )}
              </Button>
            </form>

            {/* Privacy Protection Callout (US-20) */}
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3.5 flex items-start gap-3">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Perlindungan Privasi Pasien</span>
                <span>
                  Demi menjaga kerahasiaan identitas dan rekam medis pasien, sistem tidak pernah
                  menampilkan konfirmasi status publik di layar. Tautan sesi hanya dikirimkan ke
                  alamat email yang terdaftar pada sistem.
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/60 bg-muted/15 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="text-center sm:text-left">
              Butuh bantuan mendesak?{" "}
              <a
                href={waSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline font-medium"
              >
                Chat Tim Bantuan
              </a>
            </span>
            <Link
              href="/counselors"
              className="hover:text-foreground underline underline-offset-3"
            >
              Pesan Sesi Baru
            </Link>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 mt-auto bg-muted/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Solulu. Layanan Telekonseling Privat Berbasis Web.</p>
          <div className="flex items-center gap-4">
            <a
              href="tel:119"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <HeartPulse className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Hotline 119 Ext 8 (SEJIWA)
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
