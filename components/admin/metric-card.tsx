import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export interface AdminMetricCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode
  value: React.ReactNode
  description?: React.ReactNode
  trendLabel?: React.ReactNode
  badge?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "warning" | "success" | "destructive"
  status?: "default" | "warning" | "success" | "destructive" | "neutral"
  loading?: boolean
  isLoading?: boolean
}

/**
 * Standardized Admin Metric / KPI Card component.
 * Uses Shadcn Card primitive with consistent layout, typography, and tabular figures.
 */
export function AdminMetricCard({
  title,
  value,
  description,
  trendLabel,
  badge,
  icon: Icon,
  variant,
  status,
  loading = false,
  isLoading,
  className,
  ...props
}: AdminMetricCardProps) {
  const isCardLoading = isLoading ?? loading
  const effectiveVariant: "default" | "warning" | "success" | "destructive" =
    variant ??
    (status === "neutral" ? "default" : status === "warning" ? "warning" : status === "success" ? "success" : status === "destructive" ? "destructive" : "default")
  const effectiveDesc = description ?? trendLabel

  if (isCardLoading) {
    return (
      <Card
        size="sm"
        className={cn("flex flex-col justify-between gap-3 shadow-2xs", className)}
        {...props}
      >
        <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between gap-2">
          <Skeleton className="h-3 w-24 bg-muted/80" />
          {Icon && <Skeleton className="size-4 rounded-full bg-muted/60" />}
        </CardHeader>
        <CardContent className="p-4 pt-1 flex flex-col gap-1.5">
          <Skeleton className="h-8 w-24 bg-muted/80" />
          <Skeleton className="h-3 w-36 bg-muted/60" />
        </CardContent>
      </Card>
    )
  }

  const variantStyles = {
    default: "hover:border-foreground/20",
    warning: "hover:border-amber-500/30",
    success: "hover:border-emerald-500/30",
    destructive: "hover:border-destructive/30",
  }

  const valueVariantStyles = {
    default: "text-foreground",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-emerald-600 dark:text-emerald-400",
    destructive: "text-destructive",
  }

  return (
    <Card
      size="sm"
      className={cn(
        "flex flex-col justify-between gap-3 transition-colors shadow-2xs",
        variantStyles[effectiveVariant],
        className
      )}
      {...props}
    >
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {Icon && <Icon className="size-3.5 text-muted-foreground/80" />}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-1 flex flex-col gap-1">
        <div className={cn("text-2xl sm:text-3xl font-bold tracking-tight tabular-nums", valueVariantStyles[effectiveVariant])}>
          {value}
        </div>
        {effectiveDesc && (
          <div className="text-xs text-muted-foreground truncate font-medium">
            {effectiveDesc}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
