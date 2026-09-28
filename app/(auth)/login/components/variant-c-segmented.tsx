"use client"

import * as React from "react"
import Link from "next/link"
import {
  Stethoscope,
  Shield,
  CheckCircle2,
  AlertCircle,
  Video,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  Lock,
  Calendar,
  Sparkles,
  Info,
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
import { Separator } from "@/components/ui/separator"
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

export function VariantCSegmented({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
  onQuickFill,
}: LoginVariantProps) {
  const [role, setRole] = React.useState<"counselor" | "admin">("counselor")

  const handleRoleChange = (newRole: "counselor" | "admin") => {
    setRole(newRole)
    if (onQuickFill) {
      onQuickFill(newRole)
    }
  }

  const isCounselor = role === "counselor"

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Bar Navigation */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xs shadow-xs">
            S
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-foreground">
              Solulu
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Akses Terpadu
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl my-auto py-8 flex flex-col items-center gap-8">
        {/* Segmented Persona Switcher Bar */}
        <div className="w-full max-w-md flex flex-col items-center gap-2.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            Tentukan Jenis Akses Kerja Anda
          </span>
          <div className="w-full grid grid-cols-2 p-1 rounded-xl bg-muted/70 border border-border">
            <button
              type="button"
              onClick={() => handleRoleChange("counselor")}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isCounselor
                  ? "bg-card text-foreground shadow-sm font-semibold border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Stethoscope className="size-4 text-primary shrink-0" aria-hidden="true" />
              <span>Mitra Konselor</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("admin")}
              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !isCounselor
                  ? "bg-card text-foreground shadow-sm font-semibold border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>Operator & Admin</span>
            </button>
          </div>
        </div>

        {/* Dynamic Dual-Column Presentation based on selected role */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Column 1: Contextual Workspace Brief (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs shadow-xs">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={isCounselor ? "default" : "secondary"}
                  className="text-xs px-2.5 py-0.5"
                >
                  {isCounselor ? "Ruang Praktik Klinis" : "Konsol Operasional"}
                </Badge>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {isCounselor ? "Peran: Konselor" : "Peran: Administrator"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {isCounselor
                    ? "Selamat bertugas, Rekan Psikolog & Konselor."
                    : "Pusat Kontrol Layanan & Tata Kelola Solulu."}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isCounselor
                    ? "Portal ini menghubungkan Anda dengan jadwal sesi telekonseling 90 menit, dokumen skrining awal SRQ-20, serta tautan ruang Zoom aman."
                    : "Kelola reservasi harian, proteksi jadwal 2 host Zoom Pro, audit dokumen pendaftar konselor, serta rujukan protokol krisis 119."}
                </p>
              </div>

              <Separator />

              {/* Dynamic Checklist / Status Cards */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isCounselor ? "Kesiapan Praktik Anda" : "Status Sistem Saat Ini"}
                </span>

                {isCounselor ? (
                  <>
                    <div className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">Status Izin Praktik (STR/SIP)</span>
                        <span className="text-[11px] text-muted-foreground">
                          Berkas legalitas Anda aktif dan terverifikasi untuk praktik daring.
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-start gap-2.5 text-xs">
                      <Calendar className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">Jadwal Sesi Hari Ini</span>
                        <span className="text-[11px] text-muted-foreground">
                          8 Sesi terjadwal dengan perlindungan privasi tanpa rekaman.
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-start gap-2.5 text-xs">
                      <Video className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">2 Ruang Zoom Pro Siap</span>
                        <span className="text-[11px] text-muted-foreground">
                          Kunci proteksi jadwal aktif mencegah tumpang tindih waktu (ADR-0002).
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-start gap-2.5 text-xs">
                      <FileCheck2 className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">2 Berkas Mitra Baru</span>
                        <span className="text-[11px] text-muted-foreground">
                          Menunggu evaluasi kelayakan STR & ijazah profesi.
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Support Info */}
            <div className="pt-4 mt-6 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Info className="size-3.5 text-primary" aria-hidden="true" />
                <span>Bantuan Cepat: admin@solulu.id</span>
              </span>
              <span className="font-mono text-[10px]">ADR-0001 & ADR-0002</span>
            </div>
          </div>

          {/* Column 2: Dedicated Authentication Card (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <Card className="border-border/80 shadow-lg bg-card/90">
              <CardHeader className="space-y-1.5 pb-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    Formulir Masuk {isCounselor ? "Konselor" : "Administrator"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    Sesi Terenkripsi
                  </span>
                </div>
                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                  {isCounselor ? "Masuk ke Ruang Konselor" : "Autentikasi Administrator"}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Gunakan email resmi yang telah didaftarkan pada sistem operasional.
                </CardDescription>
              </CardHeader>

              <form onSubmit={onSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2"
                    >
                      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email-variant-c" className="text-xs font-medium">
                      Email Akun {isCounselor ? "Mitra Konselor" : "Operator"}
                    </Label>
                    <Input
                      id="email-variant-c"
                      name="email"
                      type="email"
                      placeholder={isCounselor ? "sarah.annisa@solulu.id…" : "admin@solulu.id…"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      spellCheck={false}
                      disabled={loading}
                      className="text-xs h-9 bg-background focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-variant-c" className="text-xs font-medium">
                        Kata Sandi
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Minimal 8 karakter
                      </span>
                    </div>
                    <Input
                      id="password-variant-c"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="text-xs h-9 bg-background focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full text-xs font-medium h-9 shadow-xs"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">Memverifikasi kredensial…</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock className="size-3.5" aria-hidden="true" />
                        <span>Masuk sebagai {isCounselor ? "Konselor" : "Admin"}</span>
                      </span>
                    )}
                  </Button>

                  <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                    <span>Pasien tidak memerlukan akun login.</span>
                    <Link href="/" className="hover:text-foreground underline">
                      Halaman Tamu
                    </Link>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center text-[11px] text-muted-foreground py-3 border-t border-border/60">
        Hak Cipta © 2026 Solulu Telemedisin Indonesia • Akses Terbatas untuk Pengguna Berwenang
      </footer>
    </div>
  )
}
