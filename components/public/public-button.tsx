import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  resolvePublicButton,
  type PublicButtonSize,
  type PublicButtonVariant,
} from "./public-button-styles"

type PublicButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "size"
> & {
  variant?: PublicButtonVariant
  size?: PublicButtonSize
}

/**
 * Registry `Button` plus the public-site looks (`public`, `public-secondary`,
 * `public-white` variants and `pill*` sizes), so that `components/ui/button.tsx`
 * can later be reset to the shadcn registry version.
 */
export function PublicButton({
  variant,
  size,
  className,
  ...props
}: PublicButtonProps) {
  const resolved = resolvePublicButton(variant, size)
  return (
    <Button
      variant={resolved.variant}
      size={resolved.size}
      className={cn(resolved.className, className)}
      {...props}
    />
  )
}
