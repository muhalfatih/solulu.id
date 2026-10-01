import type { Metadata } from "next"
import CekSesiClient from "./CekSesiClient"

export const metadata: Metadata = {
  title: "Cek & Temukan Tautan Sesi | Solulu",
  description:
    "Lupa atau belum menerima tautan Zoom sesi konselingmu? Masukkan email dan nomor WhatsApp yang kamu pakai saat mendaftar untuk mendapatkan tautan sesimu kembali secara aman.",
}

export default function CekSesiPage() {
  return <CekSesiClient />
}
