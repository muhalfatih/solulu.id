import * as React from "react"
import Link from "next/link"
import { MessageSquare, PhoneCall, LifeBuoy, HeartPulse, Search } from "lucide-react"
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
      <Card className="border-border/80 shadow-xs bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <LifeBuoy className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold tracking-tight">
              Bantuan & Kendala Teknis
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Tim operasional Solulu siap mendampingi jika terjadi masalah sambungan atau kendala Zoom.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Mengalami kesulitan mikrofon, kamera, atau akses ruangan?
          </p>
          <Button
            asChild
            variant="outline"
            size="sm"
            id="btn-whatsapp-support"
            className="border-border/80 hover:bg-muted text-xs h-9 shrink-0"
          >
            <a href={helpDeskUrl} target="_blank" rel="noopener noreferrer">
              <MessageSquare data-icon="inline-start" />
              <span>Hubungi Tim Solulu via WhatsApp</span>
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Emergency Crisis Hotline (US-6 & Grounding Sanctuary) */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <HeartPulse className="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">
              Butuh Dukungan Darurat Krisis?
            </span>
            <span className="text-muted-foreground">
              Layanan Hotline Kemenkes SEJIWA (119 Ext 8) beroperasi 24 jam setiap hari untuk bantuan segera.
            </span>
          </div>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground h-8 shrink-0 self-end sm:self-center"
        >
          <a href="tel:119">
            <PhoneCall data-icon="inline-start" />
            <span>Panggil 119 Ext 8</span>
          </a>
        </Button>
      </div>

      {/* Self-Service Session Recovery Hint */}
      <div className="text-center text-[11px] text-muted-foreground pb-4">
        Kehilangan tautan sesi ini di masa mendatang? Pulihkan mandiri kapan saja di{" "}
        <Link href="/cek-sesi" className="underline underline-offset-3 hover:text-foreground">
          halaman Cek Sesi
        </Link>
        .
      </div>
    </div>
  )
}
