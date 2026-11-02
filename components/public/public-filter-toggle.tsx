"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/**
 * Public-site pill filter group (counselor catalog). Built on the radix
 * primitive directly so that the shadcn `toggle` / `toggle-group` files can be
 * reset to the registry version without changing this look.
 */
function PublicFilterGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        "group/toggle-group flex items-center justify-center gap-1",
        className
      )}
      {...props}
    />
  )
}

const ITEM_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all outline-none select-none hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 bg-transparent h-9 px-3 min-w-9"

function PublicFilterItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(ITEM_CLASSES, className)}
      {...props}
    />
  )
}

export { PublicFilterGroup, PublicFilterItem }
