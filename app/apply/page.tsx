import type { Metadata } from "next"
import { ApplyFormClient } from "./ApplyFormClient"

export const metadata: Metadata = {
  title: "Pendaftaran Mitra Konselor & Psikolog (Khusus Undangan) | Solulu",
  description:
    "Portal pengisian data dan verifikasi kredensial mitra konselor & psikolog undangan Solulu.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ApplyPage() {
  return (
    <div className="theme-public min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-600">
      <main className="flex-1 py-10 sm:py-14">
        <ApplyFormClient />
      </main>
    </div>
  )
}
