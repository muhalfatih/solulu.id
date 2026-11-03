import * as React from "react"
import {
  Card as RegistryCard,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader as RegistryCardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Public-site card. The registry card adds vertical padding to the card itself;
 * the public site was designed with the header supplying the top spacing and
 * no bottom padding, so these wrappers keep that rhythm (ADR-0012) while
 * `components/ui/card.tsx` stays identical to the registry. Surface styling
 * (radius, border, shadow) comes from `.theme-public [data-slot="card"]`.
 */
function Card({ className, ...props }: React.ComponentProps<typeof RegistryCard>) {
  return <RegistryCard className={cn("py-0", className)} {...props} />
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<typeof RegistryCardHeader>) {
  return (
    <RegistryCardHeader
      className={cn("pt-(--card-spacing)", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
}
