import * as React from "react"
import Link from "next/link"
import { MessageSquare, LifeBuoy, HeartPulse } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

interface SupportHotlineCardProps {
  accessToken: string
}

export function SupportHotlineCard({ accessToken }: SupportHotlineCardProps) {
  const whatsappSupportNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || "6281234567890"

  const helpDeskUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
    `Halo Tim Solulu, saya sedang mengakses ruang sesi dan memerlukan bantuan teknis dengan token: ${accessToken}`
  )}`

  return (
    <div className="flex flex-col gap-4">
      {/* Technical Support Card (US-18) */}
      <Card className="rounded-3xl border border-violet-100/90 dark:border-border/80 bg-card/95 backdrop-blur-sm shadow-[0_16px_40px_-12px_rgba(124,58,237,0.06)] hover:shadow-[0_20px_50px_-12px_rgba(124,58,237,0.10)] transition-all overflow-hidden gap-0">
        <CardHeader className="p-6 sm:p-7 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-violet-100 text-primary dark:bg-violet-950/80 dark:text-violet-300 flex items-center justify-center shrink-0">
              <LifeBuoy className="size-4 text-primary" />
            </div>
            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight font-heading text-foreground">
              Bantuan &amp; Kendala Teknis
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
            Tim operasional Solulu siap mendampingi jika terjadi masalah sambungan atau kendala Zoom.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mengalami kesulitan mikrofon, kamera, atau akses ruangan?
          </p>
          <Button
            asChild
            size="pill-sm"
            id="btn-whatsapp-support"
            className="shrink-0 h-10 px-5 text-xs font-semibold rounded-full bg-[#25d366] hover:bg-[#20ba59] text-white shadow-sm shadow-emerald-500/20 active:scale-[0.98] transition-all"
          >
            <a href={helpDeskUrl} target="_blank" rel="noopener noreferrer">
              <MessageSquare data-icon="inline-start" className="size-3.5 mr-1.5" />
              <span>Hubungi Tim Solulu via WhatsApp</span>
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Crisis Notice (ADR-0003 & Grounding Sanctuary) */}
      <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm shadow-2xs">
        <HeartPulse className="size-4.5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5 leading-relaxed">
          <span className="font-semibold text-rose-950 dark:text-rose-200">
            Pemberitahuan Krisis Medis
          </span>
          <span className="text-rose-900/80 dark:text-rose-300/80 text-xs leading-relaxed">
            Solulu bukan layanan gawat darurat. Jika Anda sedang mengalami krisis yang mengancam nyawa atau membutuhkan bantuan segera, hubungi Instalasi Gawat Darurat (IGD) rumah sakit terdekat.
          </span>
        </div>
      </div>

      {/* Self-Service Session Recovery Hint */}
      <div className="text-center text-xs text-muted-foreground pb-2">
        Kehilangan tautan sesi ini di masa mendatang? Pulihkan mandiri kapan saja di{" "}
        <Link href="/cek-sesi" className="underline underline-offset-3 hover:text-foreground font-semibold text-primary">
          halaman Cek Sesi
        </Link>
        .
      </div>
    </div>
  )
}
