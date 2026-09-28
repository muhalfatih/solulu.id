import type { Metadata } from "next"
import { ApplyFormClient } from "./ApplyFormClient"

export const metadata: Metadata = {
  title: "Pendaftaran Mitra Konselor & Psikolog | Solulu",
  description:
    "Bergabunglah sebagai mitra konselor sebaya atau psikolog klinis berlisensi di platform kesehatan mental Solulu. Unggah kredensial Anda dengan aman secara langsung.",
}

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-background py-8">
      <ApplyFormClient />
    </main>
  )
}
