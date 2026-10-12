import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface AdminPageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
}

/**
 * Standardized Admin Page Header component.
 * Enforces uniform font size, alignment, and spacing rhythm across all admin routes.
 */
export function AdminPageHeader({
  title,
  description,
  badge,
  badgeVariant = "outline",
  icon: Icon,
  actions,
  className,
  children,
  ...props
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          {Icon && (
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon className="size-4" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {badge && (
            <div className="inline-flex items-center shrink-0">
              {typeof badge === "string" ? (
                <Badge variant={badgeVariant} className="text-xs font-mono font-medium">
                  {badge}
                </Badge>
              ) : (
                badge
              )}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs font-medium text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(actions || children) && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
          {children}
        </div>
      )}
    </header>
  )
}
