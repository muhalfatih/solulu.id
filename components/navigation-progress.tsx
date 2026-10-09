"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  // Listen to global link clicks for instant 0ms visual feedback
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Find closest anchor tag
      const target = event.target as HTMLElement | null
      const anchor = target?.closest("a")

      if (!anchor) return

      const href = anchor.getAttribute("href")
      const targetAttr = anchor.getAttribute("target")

      // Only handle internal relative links with same origin and no modifier keys
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        targetAttr !== "_blank" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey
      ) {
        // If clicking the current path, no navigation needed
        const url = new URL(anchor.href, window.location.href)
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash !== ""
        ) {
          return
        }

        setIsNavigating(true)
        setProgress(25)

        const timer = setTimeout(() => {
          setProgress(70)
        }, 150)

        return () => clearTimeout(timer)
      }
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [])

  // When pathname or searchParams change, navigation is complete
  React.useEffect(() => {
    if (isNavigating) {
      setProgress(100)
      const timeout = setTimeout(() => {
        setIsNavigating(false)
        setProgress(0)
      }, 200)
      return () => clearTimeout(timeout)
    }
  }, [pathname, searchParams, isNavigating])

  if (!isNavigating && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[2.5px] bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 shadow-[0_0_8px_rgba(147,51,234,0.6)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: "width, opacity",
        }}
      />
    </div>
  )
}
