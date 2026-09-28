import type { Metadata } from "next"
import CekSesiClient from "./CekSesiClient"

export const metadata: Metadata = {
  title: "Cek & Pulihkan Tautan Sesi | Solulu",
  description:
    "Lupa atau kehilangan tautan ruang telekonseling Anda? Masukkan email dan nomor WhatsApp terdaftar untuk memulihkan tautan sesi privat Anda secara aman.",
}

export default function CekSesiPage() {
  return <CekSesiClient />
}
