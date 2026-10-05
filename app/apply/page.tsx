import type { Metadata } from "next"
import { PublicShell } from "@/components/public/public-shell"
import { ApplyFormClient } from "./ApplyFormClient"

export const metadata: Metadata = {
  title: "Pendaftaran Mitra Konselor & Psikolog (Khusus Undangan) | Solulu",
  description:
    "Portal pendaftaran dan verifikasi berkas mitra konselor & psikolog Solulu.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ApplyPage() {
  return (
    <PublicShell hideWhatsApp>
      <div className="relative overflow-hidden py-10 sm:py-14 lg:py-20 bg-radial-[at_50%_0%] from-purple-100/70 via-background to-background dark:from-purple-950/25 dark:via-background dark:to-background border-b border-border/40 min-h-screen">
        <div
          className="absolute -top-24 sm:-top-32 left-1/2 -translate-x-1/2 w-[340px] sm:w-[580px] md:w-[780px] h-[260px] sm:h-[380px] bg-gradient-to-b from-purple-400/20 via-purple-300/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none animate-calm-breath dark:from-purple-800/25 dark:via-purple-950/15"
          aria-hidden="true"
        />
        <ApplyFormClient />
      </div>
    </PublicShell>
  )
}

