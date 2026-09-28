import * as React from "react"
import { PublicHeader } from "./public-header"
import { PublicFooter } from "./public-footer"
import { FloatingWhatsApp } from "./floating-whatsapp"
import { cn } from "@/lib/utils"

export interface PublicShellProps {
  children: React.ReactNode
  className?: string
  hideFooter?: boolean
  hideWhatsApp?: boolean
}

export function PublicShell({
  children,
  className,
  hideFooter = false,
  hideWhatsApp = false,
}: PublicShellProps) {
  return (
    <div
      className={cn(
        "theme-public min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-600",
        className
      )}
    >
      <PublicHeader />
      <main className="flex-1 flex flex-col">{children}</main>
      {!hideFooter && <PublicFooter />}
      {!hideWhatsApp && <FloatingWhatsApp />}
    </div>
  )
}
