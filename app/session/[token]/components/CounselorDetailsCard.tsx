"use client"

import * as React from "react"
import { Copy, Check, ShieldCheck, HeartHandshake } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import type { SessionCounselorData, SessionBookingData } from "@/lib/session/types"

interface CounselorDetailsCardProps {
  counselor: SessionCounselorData
  booking: SessionBookingData
}

export function CounselorDetailsCard({ counselor, booking }: CounselorDetailsCardProps) {
  const [copiedToken, setCopiedToken] = React.useState(false)

  const handleCopyToken = () => {
    navigator.clipboard.writeText(booking.accessToken)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  // Get counselor initials
  const initials = counselor.fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="rounded-3xl border border-violet-100 dark:border-border/80 bg-card/95 backdrop-blur-sm shadow-[0_16px_40px_-12px_rgba(124,58,237,0.08)] hover:shadow-[0_20px_50px_-12px_rgba(124,58,237,0.12)] transition-all overflow-hidden gap-0">
      <CardHeader className="p-6 sm:p-7 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Profil Mitra Konselor
          </CardTitle>
          <Badge
            variant={counselor.counselorType === "psychologist" ? "default" : "secondary"}
            className="rounded-full px-3 py-1 text-xs font-semibold shadow-2xs"
          >
            {counselor.counselorTypeDisplay}
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
          Praktisi profesional terverifikasi yang mendampingi ruang sesi Anda.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-7 flex flex-col gap-5 text-xs sm:text-sm">
        {/* Profile Head */}
        <div className="flex items-start gap-4">
          <Avatar className="size-16 rounded-2xl border-2 border-violet-100 dark:border-violet-900/60 shadow-xs shrink-0">
            {counselor.avatarR2Url && (
              <AvatarImage src={counselor.avatarR2Url} alt={counselor.fullName} />
            )}
            <AvatarFallback className="rounded-2xl text-base font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="font-heading font-bold text-base sm:text-lg text-foreground leading-snug truncate">
              {counselor.fullName}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {counselor.title}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              <ShieldCheck className="size-3.5" />
              <span>Praktisi Terverifikasi Solulu</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {counselor.bio && (
          <div className="rounded-2xl bg-violet-50/40 dark:bg-muted/30 border border-violet-100/80 dark:border-border/60 p-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {counselor.bio}
          </div>
        )}

        {/* Specializations */}
        {counselor.specializations && counselor.specializations.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground">Fokus Spesialisasi:</span>
            <div className="flex flex-wrap gap-1.5">
              {counselor.specializations.map((spec, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-100 dark:border-violet-900/60"
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Patient Reference Box */}
        <div className="rounded-2xl border border-violet-100 dark:border-border/60 p-4 bg-violet-50/30 dark:bg-muted/20 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pasien Terdaftar:</span>
            <span className="font-semibold text-foreground">{booking.patientName}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Token Akses Sesi:</span>
            <div className="flex items-center gap-2">
              <code className="font-mono text-xs bg-white dark:bg-card px-2.5 py-1 rounded-full text-foreground border border-violet-100 dark:border-border/60">
                {booking.accessToken.slice(0, 10)}...{booking.accessToken.slice(-6)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyToken}
                aria-label="Salin token sesi"
                className="size-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {copiedToken ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          </div>

          {booking.initialNotes && (
            <div className="pt-2.5 border-t border-violet-100 dark:border-border/60 flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Catatan Awal Anda:</span>
              <p className="text-xs text-foreground italic bg-white/80 dark:bg-card/80 p-3 rounded-xl border border-violet-100 dark:border-border/40">
                &ldquo;{booking.initialNotes}&rdquo;
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/40 p-5 sm:p-6 bg-violet-50/20 dark:bg-muted/10 text-xs text-muted-foreground flex items-center justify-between rounded-b-3xl">
        <span className="flex items-center gap-1.5 font-medium">
          <HeartHandshake className="size-3.5 text-primary" /> Ruang Aman Bebas Penghakiman
        </span>
        <span className="font-semibold text-primary">Konseling 1-on-1</span>
      </CardFooter>
    </Card>
  )
}
