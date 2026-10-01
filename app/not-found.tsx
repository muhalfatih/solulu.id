import Link from "next/link"
import { Compass, Home, Search, HeartHandshake, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Icon Badge */}
        <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
          <Compass className="size-8" />
        </div>

        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit mx-auto text-xs font-mono">
            404 • Halaman Tidak Ditemukan
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Wah, Halamannya Nggak Ketemu
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Halaman yang kamu cari mungkin sudah berpindah alamat atau tautannya kurang pas. Yuk, kembali ke halaman utama.
          </p>
        </div>

        {/* Quick Recovery Options */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          <Button asChild className="h-10 text-xs font-semibold gap-2 w-full">
            <Link href="/">
              <Home className="size-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-10 text-xs font-medium gap-2 w-full">
            <Link href="/cek-sesi">
              <Search className="size-4" />
              <span>Cek Tautan Sesi Saya</span>
            </Link>
          </Button>

          <Button asChild variant="ghost" className="h-9 text-xs text-muted-foreground hover:text-foreground gap-2 w-full">
            <Link href="/counselors">
              <HeartHandshake className="size-4" />
              <span>Pilih Konselor</span>
            </Link>
          </Button>
        </div>

        {/* Emergency Hotline Alert */}
        <div className="w-full p-4 rounded-xl border border-border/80 bg-muted/30 text-xs flex flex-col gap-1.5 text-left">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <PhoneCall className="size-3.5 text-primary" />
            Butuh Bantuan Krisis Cepat?
          </span>
          <p className="text-muted-foreground leading-relaxed">
            Jika kamu atau kerabat sedang dalam kondisi darurat mental, hubungi Layanan Kesehatan Jiwa Kemenkes di <strong>119 ext 8</strong> atau Lisa Hotline di <strong>0811-3855-472</strong>.
          </p>
        </div>
      </div>
    </main>
  )
}
