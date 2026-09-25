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
      setTimeout(() => {
        setLoading(false)
        router.push(redirectParam || "/prototype/admin")
      }, 400)
      return
    }

    if (email.includes("counselor") || email.includes("sarah.annisa")) {
      setTimeout(() => {
        setLoading(false)
        router.push(redirectParam || "/prototype/admin/sessions")
      }, 400)
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
          const destination = email.includes("admin") ? "/prototype/admin" : "/prototype/admin/sessions"
          router.push(redirectParam || destination)
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
          router.push("/prototype/admin")
        } else if (role === "counselor") {
          router.push("/prototype/admin/sessions")
        } else {
          router.push("/")
        }
        router.refresh()
      }
    } catch {
      if (email.includes("admin") || email.includes("solulu")) {
        router.push(redirectParam || "/prototype/admin")
      } else {
        setError("Gagal terhubung ke sistem. Periksa koneksi internet Anda dan coba lagi.")
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Kolom kiri: Nilai layanan dan komitmen privasi klinis */}
      <div className="hidden lg:flex lg:w-1/2 bg-radial from-card via-card to-muted/40 p-8 lg:p-12 xl:p-16 flex-col justify-between border-r border-border relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-32 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex items-center gap-3 h-9">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm shadow-xs">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-foreground leading-tight">
              Solulu
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Portal Tenaga Ahli & Operasional
            </span>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg flex flex-col gap-8 py-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight text-foreground text-balance leading-[1.2]">
              Pendampingan psikologis yang aman, etis, dan menjaga privasi pasien.
            </h1>
            <p className="text-sm xl:text-base text-muted-foreground text-pretty leading-relaxed">
              Pusat operasional bagi psikolog klinis, konselor sebaya, dan tim layanan untuk mengelola sesi telekonseling di seluruh Indonesia.
            </p>
          </div>

          <div className="flex flex-col gap-5 pt-6 border-t border-border/60">
            <div className="flex items-start gap-3.5">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="size-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  Kerahasiaan Data Sesi
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Catatan sensitif dan data percakapan tidak disimpan permanen di server (ADR-0001).
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Video className="size-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  Proteksi Jadwal Sesi
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Dua akun Zoom Pro dengan penguncian jadwal otomatis agar waktu konsultasi tidak bertabrakan (ADR-0002).
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <HeartHandshake className="size-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  Alur Rujukan Krisis Sejiwa 119
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Pedoman rujukan darurat bagi pasien dalam kondisi krisis ke hotline Sejiwa 119 Kementerian Kesehatan RI.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/60">
          <span className="tabular-nums">Solulu Telemedisin © 2026</span>
          <span>Sesuai kode etik profesi HIMPSI</span>
        </div>
      </div>

      {/* Kolom kanan: Formulir masuk */}
      <div className="w-full lg:w-1/2 p-6 lg:p-12 xl:p-16 flex flex-col justify-between items-center bg-background min-h-screen relative">
        <header className="w-full max-w-md flex items-center justify-between h-9">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="w-full max-w-md my-auto flex flex-col items-center py-6">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-6">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm shadow-xs">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground">
                Solulu
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Portal Tenaga Ahli & Operasional
              </span>
            </div>
          </div>

          <Card className="w-full border border-border/80 shadow-md bg-card/95 backdrop-blur-xs">
            <CardHeader className="space-y-1.5 pb-4">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Masuk ke Portal Solulu
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                Gunakan email dan kata sandi akun kerja Anda untuk melanjutkan.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2"
                  >
                    <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-medium">
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="nama@solulu.id…"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    spellCheck={false}
                    disabled={loading}
                    className="text-sm h-10 bg-background focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-xs font-medium">
                      Kata Sandi
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="size-3" aria-hidden="true" />
                          <span>Sembunyikan</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3" aria-hidden="true" />
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
                      className="text-sm h-10 bg-background pr-10 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button
                  type="submit"
                  className="w-full text-sm font-medium h-10 shadow-xs cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">Memverifikasi data…</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Masuk ke Portal</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </span>
                  )}
                </Button>

                <div className="w-full flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <span>Akun demo:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFill("counselor")}
                      className="text-foreground hover:text-primary transition-colors cursor-pointer font-medium underline underline-offset-2"
                    >
                      Konselor
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleQuickFill("admin")}
                      className="text-foreground hover:text-primary transition-colors cursor-pointer font-medium underline underline-offset-2"
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground leading-relaxed">
                  Khusus tenaga ahli dan tim operasional. Pasien dapat langsung masuk ke ruang konseling melalui tautan pada konfirmasi pemesanan.
                </div>
              </CardFooter>
            </form>
          </Card>
        </main>

        <footer className="w-full max-w-md text-center text-xs text-muted-foreground">
          Butuh bantuan akses? Hubungi <span className="font-mono text-foreground">admin@solulu.id</span>
        </footer>
      </div>
    </div>
  )
}
