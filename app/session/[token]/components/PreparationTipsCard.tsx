import * as React from "react"
import { Headphones, Wifi, LockKeyhole, Coffee, BatteryCharging, Check } from "lucide-react"
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
    <Card className="rounded-2xl border border-border/80 shadow-xs bg-card hover:shadow-sm transition-all overflow-hidden gap-0">
      <CardHeader className="p-6 sm:p-7 border-b border-border/40">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Panduan Sesi
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
                className="flex items-start gap-3.5 rounded-xl border border-border/60 bg-muted/25 p-4 hover:bg-muted/40 hover:border-primary/30 transition-all"
              >
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Icon className="size-4.5" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="font-heading text-xs sm:text-sm font-semibold text-foreground leading-snug">
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
