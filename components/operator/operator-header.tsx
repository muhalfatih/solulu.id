"use client"

import * as React from "react"
import Link from "next/link"
import { Radio, ArrowLeft, Clock, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function OperatorHeader() {
  const [currentTime, setCurrentTime] = React.useState<string>("")

  React.useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      // WIB = UTC+7
      const utc = now.getTime() + now.getTimezoneOffset() * 60000
      const wib = new Date(utc + 3600000 * 7)
      const timeStr = wib.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      setCurrentTime(`${timeStr} WIB`)
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/operator"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight">Solulu</span>
            <span className="text-xs font-normal text-muted-foreground">
              Mental Health Clinic
            </span>
          </div>
        </Link>

        <div className="hidden h-6 w-px bg-border sm:block" />

        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="outline" className="gap-1.5 font-medium py-1">
            <Radio className="size-3 animate-pulse text-emerald-500" />
            <span>Konsol Operator</span>
          </Badge>
          <span className="text-xs text-muted-foreground">
            Matriks 7 Slot & Dispatcher Zoom
          </span>
        </div>
      </div>

      {/* Clock & Action Links */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live Clock */}
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-mono font-medium text-foreground">
          <Clock className="size-3.5 text-muted-foreground" />
          <span>{currentTime || "--:--:-- WIB"}</span>
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
          </span>
        </div>

        {/* Link back to Admin portal */}
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href="/admin">
            <ArrowLeft className="mr-1 size-3.5" data-icon="inline-start" />
            <span className="hidden md:inline">Portal Admin</span>
            <span className="md:hidden">Admin</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
