"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ScrollRevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade"
  | "scale-up"
  | "slide-left"
  | "slide-right"

interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  variant?: ScrollRevealVariant
  delay?: number
  duration?: number
  distance?: number
  threshold?: number
  rootMargin?: string
  once?: boolean
  as?: React.ElementType
  className?: string
}

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 500,
  threshold = 0.12,
  rootMargin = "0px 0px -40px 0px",
  once = true,
  as: Component = "div",
  className,
  style,
  ...props
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    // Immediately show if user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.unobserve(entry.target)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [once, rootMargin, threshold])

  // Get initial transform class based on variant
  const getInitialClasses = () => {
    switch (variant) {
      case "fade-up":
        return "opacity-0 translate-y-6"
      case "fade-down":
        return "opacity-0 -translate-y-6"
      case "fade":
        return "opacity-0"
      case "scale-up":
        return "opacity-0 scale-95"
      case "slide-left":
        return "opacity-0 -translate-x-6"
      case "slide-right":
        return "opacity-0 translate-x-6"
      default:
        return "opacity-0 translate-y-6"
    }
  }

  const getVisibleClasses = () => {
    switch (variant) {
      case "scale-up":
        return "opacity-100 scale-100"
      case "slide-left":
      case "slide-right":
        return "opacity-100 translate-x-0"
      default:
        return "opacity-100 translate-y-0"
    }
  }

  return (
    <Component
      ref={ref}
      className={cn(
        "transition-all will-change-[opacity,transform]",
        isVisible ? getVisibleClasses() : getInitialClasses(),
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * Utility component to stagger multiple child elements with cascading delays.
 */
interface ScrollRevealGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: ScrollRevealVariant
  staggerDelay?: number
  baseDelay?: number
  duration?: number
  className?: string
  as?: React.ElementType
}

export function ScrollRevealGroup({
  children,
  variant = "fade-up",
  staggerDelay = 80,
  baseDelay = 0,
  duration = 500,
  className,
  as: Component = "div",
  ...props
}: ScrollRevealGroupProps) {
  const childArray = React.Children.toArray(children)

  return (
    <Component className={className} {...props}>
      {childArray.map((child, index) => (
        <ScrollReveal
          key={index}
          variant={variant}
          delay={baseDelay + index * staggerDelay}
          duration={duration}
        >
          {child}
        </ScrollReveal>
      ))}
    </Component>
  )
}
