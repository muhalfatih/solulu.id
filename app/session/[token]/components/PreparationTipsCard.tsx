import { Headphones, Wifi, LockKeyhole, Coffee } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export function PreparationTipsCard() {
  const tips = [
    {
      icon: Headphones,
      title: "Gunakan Headset atau Earphone",
      desc: "Menjamin kejernihan audio kedua pihak dan menjaga isi percakapan tetap privat dari lingkungan sekitar Anda.",
    },
    {
      icon: Wifi,
      title: "Periksa Koneksi Internet",
      desc: "Pastikan koneksi internet stabil (WiFi atau seluler minimal 5 Mbps) untuk kelancaran video Zoom selama 90 menit.",
    },
    {
      icon: LockKeyhole,
      title: "Pilih Ruang Tenang & Privat",
      desc: "Carilah ruangan tertutup yang nyaman di mana Anda leluasa mengekspresikan emosi tanpa rasa khawatir didengar orang lain.",
    },
    {
      icon: Coffee,
      title: "Sediakan Air Minum & Tarik Napas",
      desc: "Duduklah dengan rileks, siapkan segelas air minum, dan luangkan beberapa menit untuk menenangkan pikiran sebelum mulai.",
    },
  ]

  return (
    <Card className="rounded-3xl border border-violet-100 dark:border-border/80 bg-card/95 backdrop-blur-sm shadow-[0_16px_40px_-12px_rgba(124,58,237,0.08)] hover:shadow-[0_20px_50px_-12px_rgba(124,58,237,0.12)] transition-all overflow-hidden gap-0">
      <CardHeader className="p-6 sm:p-7 border-b border-border/40">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
          Panduan Sesi Nyaman
        </span>
        <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Persiapan Sebelum Memulai
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
          Langkah sederhana untuk memastikan pengalaman telekonseling yang nyaman dan optimal.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-7">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tips.map((tip, idx) => {
            const Icon = tip.icon
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 rounded-2xl border border-violet-100/80 dark:border-border/60 bg-violet-50/30 dark:bg-muted/20 p-4 sm:p-5 hover:bg-violet-50/60 dark:hover:bg-muted/40 hover:border-violet-200 dark:hover:border-violet-800/60 transition-all shadow-2xs"
              >
                <div className="size-10 rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Icon className="size-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="font-heading text-xs sm:text-sm font-bold text-foreground leading-snug">
                    {tip.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {tip.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
