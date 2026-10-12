import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type SessionOperationalStatus =
  | "in_session"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"

export interface SessionStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: SessionOperationalStatus
  roomName?: string
}

/**
 * Standardized Session Status Badge for Admin views.
 * Replaces ad-hoc hardcoded badge classes with uniform tokens and icons.
 */
export function SessionStatusBadge({
  status,
  roomName,
  className,
  ...props
}: SessionStatusBadgeProps) {
  if (status === "pending_payment") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 border-amber-500/35 bg-amber-500/15 shadow-2xs",
          className
        )}
        {...props}
      >
        <Clock className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>Menunggu Pembayaran</span>
      </Badge>
    )
  }

  if (status === "in_session") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-200 border-emerald-500/35 bg-emerald-500/15 shadow-2xs",
          className
        )}
        {...props}
      >
        <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
        <span>{roomName ? `${roomName} • Berlangsung` : "Sedang Berlangsung"}</span>
      </Badge>
    )
  }

  if (status === "confirmed") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold text-foreground border-border/80 bg-background shadow-2xs",
          className
        )}
        {...props}
      >
        <span className="size-2 rounded-full bg-primary/70 shrink-0" />
        <span>{roomName ? `${roomName} • Terkonfirmasi` : "Terkonfirmasi"}</span>
      </Badge>
    )
  }

  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-muted-foreground/70 border-border/50 bg-muted/20",
          className
        )}
        {...props}
      >
        <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
        <span>{roomName ? `${roomName} • Selesai` : "Selesai"}</span>
      </Badge>
    )
  }

  if (status === "cancelled") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-destructive border-destructive/30 bg-destructive/10",
          className
        )}
        {...props}
      >
        <XCircle className="size-3 text-destructive shrink-0" />
        <span>Dibatalkan</span>
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={cn("inline-flex items-center gap-1.5", className)} {...props}>
      <span>{status}</span>
    </Badge>
  )
}
