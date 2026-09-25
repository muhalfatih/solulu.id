"use client"

import * as React from "react"
import Link from "next/link"
import {
  ShieldCheck,
  KeyRound,
  Mail,
  ArrowRight,
  Sparkles,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Radio,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function VariantBFocused({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
  onQuickFill,
}: LoginVariantProps) {
  const [activeTab, setActiveTab] = React.useState<"password" | "magic-link">("password")
  const [magicLinkSent, setMagicLinkSent] = React.useState(false)

  const handleMagicLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setMagicLinkSent(true)
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 bg-radial from-background via-background to-muted/40 font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Background Ambient Aura */}
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"
      />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          <span>Kembali ke Beranda Solulu</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/prototype/admin"
            className="text-[11px] text-muted-foreground hover:text-foreground hidden sm:inline"
          >
            Pratinjau Admin
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Center Focused Card Container */}
      <main className="w-full max-w-md my-auto z-10 flex flex-col gap-4">
        {/* Live Infrastructure Telemetry Pill */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border text-[11px] text-muted-foreground shadow-2xs">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span className="font-medium text-foreground">Infrastruktur Siap</span>
            <span className="text-muted-foreground/60">•</span>
            <span>2 Ruang Zoom Terenkripsi</span>
          </div>
        </div>

        <Card className="border-border/80 shadow-xl bg-card/95 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 shadow-xs">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">
              Masuk Portal Solulu
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Portal operasional khusus psikolog, konselor sebaya, dan admin.
            </CardDescription>
          </CardHeader>

          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as "password" | "magic-link")
              setMagicLinkSent(false)
            }}
            className="w-full px-6 pt-2"
          >
            <TabsList className="grid grid-cols-2 w-full h-8 p-0.5 bg-muted/70">
              <TabsTrigger value="password" className="text-xs font-medium">
                Kata Sandi
              </TabsTrigger>
              <TabsTrigger value="magic-link" className="text-xs font-medium">
                Tautan Cepat
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Password Login */}
            <TabsContent value="password" className="mt-4 focus-visible:outline-none">
              <form onSubmit={onSubmit}>
                <CardContent className="p-0 space-y-4">
                  {error && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2"
                    >
                      <Lock className="size-4 shrink-0" aria-hidden="true" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email-variant-b" className="text-xs font-medium">
                      Alamat Email
                    </Label>
                    <Input
                      id="email-variant-b"
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
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password-variant-b" className="text-xs font-medium">
                      Kata Sandi
                    </Label>
                    <Input
                      id="password-variant-b"
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

                <CardFooter className="p-0 pt-6 flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full text-xs font-medium h-9 shadow-xs"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">Memproses…</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <KeyRound className="size-3.5" aria-hidden="true" />
                        <span>Masuk ke Akun</span>
                      </span>
                    )}
                  </Button>

                  {/* Quick role fill buttons */}
                  {onQuickFill && (
                    <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                      <span>Uji coba akun demo:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onQuickFill("counselor")}
                          className="hover:text-primary transition-colors cursor-pointer underline font-medium"
                        >
                          Konselor
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => onQuickFill("admin")}
                          className="hover:text-primary transition-colors cursor-pointer underline font-medium"
                        >
                          Admin
                        </button>
                      </div>
                    </div>
                  )}
                </CardFooter>
              </form>
            </TabsContent>

            {/* TAB 2: Magic Link */}
            <TabsContent value="magic-link" className="mt-4 focus-visible:outline-none">
              {!magicLinkSent ? (
                <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="magic-email" className="text-xs font-medium">
                      Alamat Email Terdaftar
                    </Label>
                    <Input
                      id="magic-email"
                      name="magic-email"
                      type="email"
                      placeholder="nama@solulu.id…"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      spellCheck={false}
                      className="text-xs h-9 bg-background focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Kami akan mengirimkan tautan masuk instan ke kotak masuk email Anda tanpa kata sandi.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full text-xs font-medium h-9 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Mail className="size-3.5 mr-1.5" aria-hidden="true" />
                    <span>Kirim Tautan Masuk Cepat</span>
                  </Button>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center flex flex-col items-center gap-2 text-xs">
                  <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="font-semibold text-foreground">Tautan Terkirim</span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Periksa kotak masuk email <span className="font-mono text-foreground font-medium">{email}</span> untuk masuk langsung ke ruang sesi.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setMagicLinkSent(false)}
                    className="text-[11px] mt-1"
                  >
                    Kirim ulang tautan
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="p-6 pt-4 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Pasien konsultasi tidak perlu mendaftar akun. Masuk ke ruang konseling langsung dari tautan invoice.
            </p>
          </div>
        </Card>

        {/* Security & Regulatory Seals */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Enkripsi TLS 1.3</span>
          </span>
          <span>•</span>
          <span>Privasi Pasien (ADR-0001)</span>
          <span>•</span>
          <span>Hotline Sejiwa 119</span>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full max-w-4xl text-center text-xs text-muted-foreground z-10 py-2">
        <span className="tabular-nums">Solulu Telekonseling © 2026</span>
      </footer>
    </div>
  )
}
