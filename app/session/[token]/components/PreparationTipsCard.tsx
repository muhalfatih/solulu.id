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
    <Card className="border-border/80 shadow-xs bg-card">
      <CardHeader className="pb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Panduan Sesi
        </span>
        <CardTitle className="text-lg font-semibold tracking-tight">
          Persiapan Sebelum Memulai
        </CardTitle>
        <CardDescription>
          Langkah sederhana untuk memastikan pengalaman telekonseling yang nyaman dan optimal.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {tips.map((tip, idx) => {
            const Icon = tip.icon
            return (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs font-semibold text-foreground leading-snug">
                    {tip.title}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
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
