import * as React from "react"
import Link from "next/link"
import { MessageSquare, LifeBuoy, HeartPulse, Search } from "lucide-react"
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
      <Card className="rounded-2xl border border-border/80 shadow-xs bg-card hover:shadow-sm transition-all overflow-hidden gap-0">
        <CardHeader className="p-6 sm:p-7 border-b border-border/40">
          <div className="flex items-center gap-2">
            <LifeBuoy className="size-4 text-primary" />
            <CardTitle className="text-lg sm:text-xl font-bold tracking-tight font-heading text-foreground">
              Bantuan &amp; Kendala Teknis
            </CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
            Tim operasional Solulu siap mendampingi jika terjadi masalah sambungan atau kendala Zoom.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Mengalami kesulitan mikrofon, kamera, atau akses ruangan?
          </p>
          <Button
            asChild
            variant="public-secondary"
            size="pill-sm"
            id="btn-whatsapp-support"
            className="shrink-0 h-9 px-4 text-xs font-semibold"
          >
            <a href={helpDeskUrl} target="_blank" rel="noopener noreferrer">
              <MessageSquare data-icon="inline-start" />
              <span>Hubungi Tim Solulu via WhatsApp</span>
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Crisis Notice (ADR-0003 & Grounding Sanctuary) */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm">
        <HeartPulse className="size-4.5 text-destructive mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5 leading-relaxed">
          <span className="font-semibold text-foreground">
            Pemberitahuan Krisis Medis
          </span>
          <span className="text-muted-foreground text-xs leading-relaxed">
            Solulu bukan layanan gawat darurat. Jika Anda sedang mengalami krisis yang mengancam nyawa atau membutuhkan bantuan segera, hubungi Instalasi Gawat Darurat (IGD) rumah sakit terdekat.
          </span>
        </div>
      </div>

      {/* Self-Service Session Recovery Hint */}
      <div className="text-center text-xs text-muted-foreground pb-2">
        Kehilangan tautan sesi ini di masa mendatang? Pulihkan mandiri kapan saja di{" "}
        <Link href="/cek-sesi" className="underline underline-offset-3 hover:text-foreground font-medium text-primary">
          halaman Cek Sesi
        </Link>
        .
      </div>
    </div>
  )
}
