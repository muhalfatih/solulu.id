import Link from "next/link"
import { Heart } from "lucide-react"

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card text-foreground border-t border-border/80 py-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Identity */}
          <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <div className="size-8 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white text-sm">
                S
              </div>
              <span className="font-bold text-base tracking-tight">Solulu</span>
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              Ruang aman untuk cerita. Layanan konseling online yang mudah diakses, terjangkau, dan bebas stigma untuk kesehatan mental Anda.
            </p>
          </div>

            {/* Column 2: Layanan Klien */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-foreground">Layanan Klien</span>
            <Link
              href="/counselors"
              prefetch={true}
              className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Katalog Konselor
            </Link>
            <Link
              href="/pricing"
              prefetch={true}
              className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Biaya &amp; Paket Layanan
            </Link>
            <Link
              href="/cek-sesi"
              prefetch={true}
              className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Cek Tautan Sesi
            </Link>
          </div>

          {/* Column 3: Tentang & Bantuan */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-foreground">Tentang &amp; Bantuan</span>
            <Link
              href="/#tentang"
              className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Kenapa Solulu
            </Link>
            <Link
              href="/#faq"
              className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Tanya Jawab (FAQ)
            </Link>
            <a
              href="https://wa.me/6285144909949?text=Halo%20Solulu!%20Saya%20ingin%20tanya%20tentang%20sesi%20konseling."
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Bantuan WhatsApp
            </a>
          </div>

          {/* Column 4: Kepatuhan & Hukum */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-foreground">Kepatuhan &amp; Hukum</span>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Kebijakan Privasi
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Syarat &amp; Ketentuan
            </Link>
            <span className="text-muted-foreground">Kepatuhan UU Pelindungan Data Pribadi</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground">
          <p>© {currentYear} Solulu. Hak cipta dilindungi undang-undang.</p>
          <p className="flex items-center gap-1.5">
            <span>Dibuat dengan</span>
            <Heart className="size-3.5 text-purple-600 dark:text-purple-400 fill-purple-600/30" />
            <span>untuk kesehatan mental di Indonesia.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
