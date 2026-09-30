"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "rounded-2xl border border-border/80 bg-card transition-all duration-200 overflow-hidden shadow-2xs hover:border-purple-500/30 data-[state=open]:border-purple-500/40 data-[state=open]:shadow-xs",
        className
      )}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/trigger flex flex-1 items-center justify-between p-5 sm:p-6 text-left font-heading font-semibold text-sm sm:text-base text-foreground transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-purple-600 rounded-2xl cursor-pointer [&[data-state=open]>svg]:rotate-180 [&[data-state=open]>svg]:text-purple-600 dark:[&[data-state=open]>svg]:text-purple-400",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          className="size-4.5 text-muted-foreground shrink-0 ml-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          aria-hidden="true"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-xs sm:text-sm text-muted-foreground"
      {...props}
    >
      <div className={cn("px-5 sm:px-6 pb-5 sm:pb-6 pt-0 border-t border-border/40 mt-1 leading-relaxed text-pretty", className)}>
        <p className="pt-3.5">{children}</p>
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
