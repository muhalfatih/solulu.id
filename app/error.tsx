"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCcw, Home, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Log unexpected runtime errors for telemetry
    console.error("Solulu runtime error:", error)
  }, [error])

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-xs">
          <AlertTriangle className="size-8" />
        </div>

        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit mx-auto text-xs font-mono text-destructive border-destructive/20 bg-destructive/5">
            500 • Kendala Teknis
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ada Sedikit Kendala
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sistem kami sempat mengalami gangguan saat memuat halaman ini. Jangan khawatir, kamu bisa coba muat ulang atau kembali ke beranda.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="h-10 text-xs font-semibold gap-2 w-full cursor-pointer"
          >
            <RefreshCcw className="size-3.5" />
            <span>Muat Ulang Halaman</span>
          </Button>

          <Button asChild variant="outline" className="h-10 text-xs font-medium gap-2 w-full">
            <Link href="/">
              <Home className="size-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>
          </Button>

          <Button asChild variant="ghost" className="h-9 text-xs text-muted-foreground hover:text-foreground gap-2 w-full">
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
              <MessageSquare className="size-3.5" />
              <span>Hubungi Bantuan di WhatsApp</span>
            </a>
          </Button>
        </div>
      </div>
    </main>
  )
}
