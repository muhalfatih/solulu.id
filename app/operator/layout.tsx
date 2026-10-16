import * as React from "react"
import type { Metadata } from "next"
import { OperatorHeader } from "@/components/operator/operator-header"

export const metadata: Metadata = {
  title: "Konsol Operator & Dispatcher Zoom | Solulu",
  description:
    "Konsol operasional klinik Solulu untuk pemantauan 7 slot harian, kontrol dispatcher 4 akun Zoom Pro, dan panduan Breakout Room.",
}

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
      <OperatorHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Solulu Mental Health &copy; {new Date().getFullYear()} — Master SOP Counseling System
          </span>
          <span className="text-[11px] text-muted-foreground/80">
            Akses Terisolasi: Khusus Pemantauan Sesi & Breakout Room (Bebas Rekam Medis & Finansial)
          </span>
        </div>
      </footer>
    </div>
  )
}
