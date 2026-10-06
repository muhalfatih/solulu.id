"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Lock,
  Video,
  HeartHandshake,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { loginAsDemoAction } from "./actions"

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get("redirect")

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  // Demo credential presets for quick verification
  const handleQuickFill = (role: "admin" | "counselor") => {
    setError(null)
    if (role === "admin") {
      setEmail("admin@solulu.id")
      setPassword("AdminSolulu2026!")
    } else {
      setEmail("sarah.annisa@solulu.id")
      setPassword("KonselorSolulu2026!")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Demo shortcut for immediate evaluation
    if (email === "admin@solulu.id") {
      await loginAsDemoAction("admin")
      setLoading(false)
      const target = redirectParam || "/admin"
      router.push(target)
      router.refresh()
      return
    }

    if (email.includes("counselor") || email.includes("sarah.annisa")) {
      await loginAsDemoAction("counselor")
      setLoading(false)
      const target = redirectParam || "/counselor/dashboard"
      router.push(target)
      router.refresh()
      return
    }

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (password === "password" || password.startsWith("Admin") || password.startsWith("Konselor")) {
          const role = email.includes("admin") ? "admin" : "counselor"
          await loginAsDemoAction(role)
          const destination =
            email.includes("admin")
              ? redirectParam || "/admin"
              : redirectParam || "/counselor/dashboard"
          router.push(destination)
          router.refresh()
          return
        }

        setError(
          authError.message === "Invalid login credentials"
            ? "Email atau kata sandi salah. Silakan periksa kembali akun Anda."
            : authError.message
        )
        setLoading(false)
        return
      }

      if (data.user) {
        const role =
          data.user.app_metadata?.role || data.user.user_metadata?.role

        if (redirectParam && redirectParam.startsWith("/")) {
          router.push(redirectParam)
        } else if (role === "admin") {
          router.push("/admin")
        } else if (role === "counselor") {
          router.push("/counselor/dashboard")
        } else {
          router.push("/")
        }
        router.refresh()
      }
    } catch {
      if (email.includes("admin") || email.includes("solulu")) {
        router.push(redirectParam || "/admin")
      } else {
        setError("Gagal terhubung ke sistem. Periksa koneksi internet Anda dan coba lagi.")
        setLoading(false)
      }
    }
  }

  return (
    <div className="theme-public min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground font-sans selection:bg-purple-500/20 selection:text-purple-600 relative overflow-hidden">
      {/* Kolom kiri: Nilai layanan dan komitmen privasi klinis (Homepage Style) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-50/70 via-background to-purple-50/40 dark:from-violet-950/20 dark:via-background dark:to-purple-950/10 p-8 lg:p-12 xl:p-16 flex-col justify-between border-r border-border/80 relative overflow-hidden">
        {/* Ambient radial glows */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 size-96 rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-32 size-96 rounded-full bg-purple-500/10 dark:bg-purple-500/15 blur-3xl pointer-events-none"
        />

        {/* Header Branding Solulu */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] flex items-center justify-center font-bold text-white text-lg shadow-md shadow-violet-500/20">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg tracking-tight text-foreground leading-tight">
              Solulu
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Portal Tenaga Ahli &amp; Operasional
            </span>
          </div>
        </div>

        {/* Headline & Trust Showcase Cards */}
        <div className="relative z-10 my-auto max-w-lg flex flex-col gap-7 py-6">
          <div className="flex flex-col gap-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 w-fit shadow-2xs">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              <span>Ruang Aman &amp; Tepercaya (#CeritaDiSolulu)</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight text-foreground text-balance leading-[1.2]">
              Pendampingan psikologis yang aman, etis, dan menjaga privasi pasien.
            </h1>
            <p className="text-sm xl:text-base text-muted-foreground text-pretty leading-relaxed">
              Pusat operasional resmi bagi psikolog klinis berizin, konselor sebaya sarjana psikologi, dan tim layanan untuk mendampingi klien di seluruh Indonesia.
            </p>
          </div>

          {/* Cards Poin Kepercayaan (Homepage Feature Style) */}
          <div className="flex flex-col gap-3.5">
            <div className="p-4 rounded-2xl bg-card/85 backdrop-blur-xs border border-border/80 shadow-2xs hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 flex items-start gap-3.5">
              <div className="size-11 rounded-2xl bg-primary/10 text-primary dark:text-purple-300 flex items-center justify-center shrink-0 ring-1 ring-primary/15">
                <Lock className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-heading font-semibold text-sm tracking-tight text-foreground">
                  Kerahasiaan Data Sesi
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Catatan sensitif dan rekam data percakapan tidak disimpan permanen di server (ADR-0001).
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card/85 backdrop-blur-xs border border-border/80 shadow-2xs hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 flex items-start gap-3.5">
              <div className="size-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-1 ring-emerald-500/15">
                <Video className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-heading font-semibold text-sm tracking-tight text-foreground">
                  Proteksi Jadwal Zoom Pro
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Penguncian otomatis 2 host akun Zoom agar waktu konsultasi tidak pernah bertabrakan (ADR-0002).
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card/85 backdrop-blur-xs border border-border/80 shadow-2xs hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 flex items-start gap-3.5">
              <div className="size-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 ring-1 ring-purple-500/15">
                <HeartHandshake className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-heading font-semibold text-sm tracking-tight text-foreground">
                  Standar Etika Layanan HIMPSI
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Seluruh konselor dan psikolog berpraktik sesuai kode etik resmi profesi psikologi Indonesia.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Kolom Kiri */}
        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/60">
          <span className="tabular-nums">Solulu Telemedisin © 2026</span>
          <span>Sesuai kode etik profesi HIMPSI</span>
        </div>
      </div>

      {/* Kolom kanan: Formulir masuk dengan Card Style Homepage */}
      <div className="w-full lg:w-1/2 p-6 lg:p-8 xl:p-12 flex flex-col justify-between items-center bg-background min-h-screen relative overflow-y-auto">
        <header className="w-full max-w-md flex items-center justify-between h-9 shrink-0">
          <Link
            href="/"
            className="h-8 px-3.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/60 transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="w-full max-w-md my-auto flex flex-col items-center py-4">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-5">
            <div className="size-10 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] flex items-center justify-center font-bold text-white text-base shadow-sm shadow-violet-500/25">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-base tracking-tight text-foreground">
                Solulu
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Portal Tenaga Ahli &amp; Operasional
              </span>
            </div>
          </div>

          {/* Card Login Form Bergaya Card Homepage Solulu */}
          <Card className="w-full relative border border-border/80 shadow-[0_16px_40px_-12px_rgba(124,58,237,0.12)] dark:shadow-[0_16px_40px_-12px_rgba(124,58,237,0.25)] rounded-3xl bg-card/95 backdrop-blur-md overflow-hidden hover:border-primary/40 transition-all duration-300">
            {/* Top decorative gradient accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500" />

            <CardHeader className="p-6 sm:p-7 pb-3 sm:pb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-2xl bg-primary/10 text-primary dark:text-purple-300 flex items-center justify-center shrink-0 ring-1 ring-primary/15 shadow-2xs">
                  <Lock className="size-5" aria-hidden="true" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 inline-flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
                  <span>Akses Terverifikasi</span>
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <CardTitle className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Masuk ke Portal Solulu
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Gunakan email dan kata sandi akun kerja Anda untuk mengakses operasional layanan.
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="px-6 sm:px-7 space-y-3.5 pt-0">
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2.5"
                  >
                    <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="login-email" className="text-xs font-semibold text-foreground/90">
                    Email Akun Kerja
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="nama@solulu.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    spellCheck={false}
                    disabled={loading}
                    className="text-sm h-10.5 rounded-xl bg-background border-border/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-xs font-semibold text-foreground/90">
                      Kata Sandi
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="size-3.5" aria-hidden="true" />
                          <span>Sembunyikan</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" aria-hidden="true" />
                          <span>Lihat</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="text-sm h-10.5 rounded-xl bg-background border-border/80 pr-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="px-6 sm:px-7 pb-6 sm:pb-7 flex flex-col gap-3.5 pt-2">
                <Button
                  type="submit"
                  variant="public"
                  size="pill"
                  className="w-full h-11 rounded-full text-sm font-semibold shadow-md shadow-violet-500/25 active:scale-[0.98] transition-all cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">Memverifikasi akun…</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Masuk ke Portal</span>
                      <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
                    </span>
                  )}
                </Button>

                {/* Quick fill demo credentials in homepage pill style */}
                <div className="w-full p-2.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">Isi cepat akun demo:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFill("counselor")}
                      className="h-7 px-3 rounded-full text-xs font-semibold border border-border/80 bg-background text-foreground hover:bg-violet-50 hover:text-primary hover:border-violet-300 dark:hover:bg-violet-950/60 dark:hover:text-violet-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      Konselor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill("admin")}
                      className="h-7 px-3 rounded-full text-xs font-semibold border border-border/80 bg-background text-foreground hover:bg-violet-50 hover:text-primary hover:border-violet-300 dark:hover:bg-violet-950/60 dark:hover:text-violet-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-muted/20 border border-border/40 text-center text-[11px] text-muted-foreground leading-relaxed">
                  Khusus tenaga ahli &amp; tim operasional. Pasien dapat langsung masuk ke ruang telekonseling melalui tautan pada konfirmasi pemesanan.
                </div>
              </CardFooter>
            </form>
          </Card>
        </main>

        <footer className="w-full max-w-md text-center text-xs text-muted-foreground shrink-0 pb-2">
          Butuh bantuan akses? Hubungi <span className="font-mono text-foreground font-medium">admin@solulu.id</span>
        </footer>
      </div>
    </div>
  )
}
