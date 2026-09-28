"use client"

import * as React from "react"
import Link from "next/link"
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Stethoscope,
  Shield,
  HeartHandshake,
  Video,
  ArrowLeft,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

interface LoginVariantProps {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  error: string | null
  loading: boolean
  onSubmit: (e: React.FormEvent) => void
  onQuickFill?: (role: "admin" | "counselor") => void
}

export function VariantASplit({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
  onQuickFill,
}: LoginVariantProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<"counselor" | "admin">(
    "counselor"
  )

  const handleRoleSelect = (role: "counselor" | "admin") => {
    setSelectedRole(role)
    if (onQuickFill) {
      onQuickFill(role)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* ===================================================================== */}
      {/* LEFT COLUMN: Editorial Clinical Manifesto & Trust Seals (Desktop Only) */}
      {/* ===================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 bg-radial from-card via-card to-muted/40 p-8 sm:p-12 lg:p-16 flex-col justify-between border-r border-border relative overflow-hidden">
        {/* Subtle Ambient glow backdrop */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm shadow-sm">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground">
                Solulu
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Portal Tenaga Ahli & Operasional
              </span>
            </div>
          </div>
          <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5">
            ADR-0001 & ADR-0002
          </Badge>
        </div>

        {/* Central Manifesto */}
        <div className="relative z-10 my-10 lg:my-0 max-w-lg flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit text-xs font-medium gap-1.5 px-2.5 py-1">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              <span>Standar Privasi Layanan Telemedisin</span>
            </Badge>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground text-balance leading-tight">
              Pendampingan psikologis yang bermartabat dan terjaga privasinya.
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground text-pretty leading-relaxed">
              Solulu menyediakan ruang konsultasi aman bagi psikolog klinis dan konselor sebaya untuk melayani pasien tanpa kompromi kerahasiaan.
            </p>
          </div>

          {/* Three Trust Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-border/80 bg-background/80 backdrop-blur-xs flex flex-col gap-1.5 shadow-2xs">
              <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Lock className="size-3.5" aria-hidden="true" />
              </div>
              <span className="font-semibold text-xs text-foreground">Privasi Tanpa Jejak</span>
              <span className="text-[11px] text-muted-foreground leading-snug">
                Data sensitif tidak disimpan permanen di server (ADR-0001).
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-background/80 backdrop-blur-xs flex flex-col gap-1.5 shadow-2xs">
              <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Video className="size-3.5" aria-hidden="true" />
              </div>
              <span className="font-semibold text-xs text-foreground">Ruang Terproteksi</span>
              <span className="text-[11px] text-muted-foreground leading-snug">
                2 Akun Zoom Pro terenkripsi dengan proteksi jadwal (ADR-0002).
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-background/80 backdrop-blur-xs flex flex-col gap-1.5 shadow-2xs">
              <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <HeartHandshake className="size-3.5" aria-hidden="true" />
              </div>
              <span className="font-semibold text-xs text-foreground">Rujukan Sejiwa 119</span>
              <span className="text-[11px] text-muted-foreground leading-snug">
                Protokol krisis darurat terintegrasi standar Kemenkes RI.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note on Left Column */}
        <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/60">
          <span className="tabular-nums">Solulu Telemedisin © 2026</span>
          <span className="text-[11px]">Kepatuhan Etika Profesi HIMPSI</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* RIGHT COLUMN: Dedicated Login Form with Role Switching */}
      {/* ===================================================================== */}
      <div className="w-full lg:w-1/2 p-4 sm:p-8 lg:p-16 flex flex-col justify-between items-center bg-background min-h-screen relative">
        {/* Top bar: Back to Home + Theme Toggle */}
        <header className="w-full max-w-md flex items-center justify-between mb-4 lg:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Beranda Publik</span>
          </Link>
          <ThemeToggle />
        </header>

        {/* Center Card Container */}
        <main className="w-full max-w-md my-auto flex flex-col items-center">
          {/* Mobile Brand Header (Visible only on < lg screens) */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-5">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-xs">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">
                Solulu
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Portal Tenaga Ahli & Operasional
              </span>
            </div>
          </div>

          <Card className="w-full border-border/80 shadow-lg bg-card/90 backdrop-blur-md">
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                  Autentikasi Aman
                </Badge>
                <span className="text-[11px] text-muted-foreground font-mono">
                  v0.0.1
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Masuk ke Portal Operasional
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Silakan pilih peran dan masukkan kredensial resmi Anda.
              </CardDescription>
            </CardHeader>

            {/* Role Quick Selector */}
            <div className="px-6 pb-2">
              <fieldset className="flex items-center gap-2 p-1 rounded-lg bg-muted/60 border border-border/60">
                <legend className="sr-only">Pilih peran akun</legend>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("counselor")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedRole === "counselor"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Stethoscope className="size-3.5 text-primary" aria-hidden="true" />
                  <span>Mitra Konselor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("admin")}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedRole === "admin"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shield className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>Admin Pelayanan</span>
                </button>
              </fieldset>
            </div>

            <form onSubmit={onSubmit}>
              <CardContent className="space-y-4 pt-3">
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2"
                  >
                    <ShieldCheck className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <Label htmlFor="email-variant-a" className="text-xs font-medium">
                    Alamat Email Resmi
                  </Label>
                  <Input
                    id="email-variant-a"
                    name="email"
                    type="email"
                    placeholder="nama@solulu.id…"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    spellCheck={false}
                    disabled={loading}
                    className="text-xs h-9 bg-background focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan email terdaftar pada sistem Solulu.
                  </p>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-variant-a" className="text-xs font-medium">
                      Kata Sandi
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="size-3" aria-hidden="true" />
                          <span>Tutup</span>
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
                      id="password-variant-a"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="text-xs h-9 bg-background pr-10 focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full text-xs font-medium h-9 shadow-xs"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">Memverifikasi data…</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Masuk ke Portal</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  )}
                </Button>

                <div className="text-center text-[11px] text-muted-foreground pt-1 leading-relaxed">
                  Pasien tidak perlu akun login. Sesi dapat diakses langsung melalui tautan aman di invoice pemesanan.
                </div>
              </CardFooter>
            </form>
          </Card>
        </main>

        {/* Bottom helper */}
        <footer className="w-full max-w-md text-center text-[11px] text-muted-foreground pt-6">
          Bantuan teknis operator: <span className="font-mono text-foreground">admin@solulu.id</span>
        </footer>
      </div>
    </div>
  )
}
