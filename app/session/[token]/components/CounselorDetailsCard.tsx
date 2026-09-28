"use client"

import * as React from "react"
import { Copy, Check, UserCheck, ShieldCheck, HeartHandshake } from "lucide-react"
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
    <Card className="border-border/80 shadow-xs bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mitra Konselor Anda
          </span>
          <Badge
            variant={counselor.counselorType === "psychologist" ? "default" : "secondary"}
            className="text-[11px] font-normal"
          >
            {counselor.counselorTypeDisplay}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Profile Head */}
        <div className="flex items-start gap-4">
          <Avatar className="size-16 rounded-xl border border-border/70 shrink-0">
            {counselor.avatarR2Url && (
              <AvatarImage src={counselor.avatarR2Url} alt={counselor.fullName} />
            )}
            <AvatarFallback className="rounded-xl text-base font-semibold bg-muted text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="font-semibold text-base text-foreground leading-snug truncate">
              {counselor.fullName}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {counselor.title}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              <ShieldCheck className="size-3.5" />
              <span>Praktisi Terverifikasi Solulu</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {counselor.bio && (
          <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
            {counselor.bio}
          </div>
        )}

        {/* Specializations */}
        {counselor.specializations && counselor.specializations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-foreground">Fokus Spesialisasi:</span>
            <div className="flex flex-wrap gap-1.5">
              {counselor.specializations.map((spec, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[11px] font-normal bg-background/50 border-border/70 text-muted-foreground"
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Patient Reference Box */}
        <div className="rounded-lg border border-border/70 p-3 bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pasien Terdaftar:</span>
            <span className="font-medium text-foreground">{booking.patientName}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Token Akses Sesi:</span>
            <div className="flex items-center gap-1.5">
              <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground">
                {booking.accessToken.slice(0, 10)}...{booking.accessToken.slice(-6)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyToken}
                aria-label="Salin token sesi"
                className="size-6 text-muted-foreground hover:text-foreground"
              >
                {copiedToken ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          </div>

          {booking.initialNotes && (
            <div className="pt-2 border-t border-border/60 flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">Catatan Awal Anda:</span>
              <p className="text-xs text-foreground italic bg-muted/30 p-2 rounded">
                &ldquo;{booking.initialNotes}&rdquo;
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/60 px-6 py-3 text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1">
          <HeartHandshake className="size-3.5 text-muted-foreground" /> Ruang Aman Bebas Penghakiman
        </span>
        <span className="font-medium">Konseling 1-on-1</span>
      </CardFooter>
    </Card>
  )
}
