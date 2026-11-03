import * as React from "react"
import type { Metadata } from "next"
import { PortalShell } from "@/components/app-shell/portal-shell"

export const metadata: Metadata = {
  title: "Konsol Operator & Dispatcher Zoom | Solulu",
  description:
    "Konsol operasional klinik Solulu untuk pemantauan 7 slot harian, kontrol dispatcher 4 akun Zoom Pro, dan panduan Breakout Room.",
}

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      portal="operator"
      footer={
        <footer className="mt-auto border-t px-4 py-4 text-center text-xs text-muted-foreground">
          Akses terisolasi: khusus pemantauan sesi dan Breakout Room (tanpa rekam medis dan data finansial)
        </footer>
      }
    >
      {children}
    </PortalShell>
  )
}
