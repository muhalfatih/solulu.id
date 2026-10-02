"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Laptop } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ThemeToggleProps {
  className?: string
  variant?: "segmented" | "icon"
  id?: string
}

export function ThemeToggle({
  className = "",
  variant = "segmented",
  id,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    if (variant === "icon") {
      return (
        <div
          className={cn("size-9 rounded-lg bg-muted/40 animate-pulse", className)}
          aria-hidden="true"
        />
      )
    }

    return (
      <div
        className={cn(
          "w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse",
          className
        )}
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  if (variant === "icon") {
    const nextThemeLabel = isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"

    return (
      <button
        type="button"
        id={id || "btn-public-theme-toggle"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer shrink-0",
          className
        )}
        title={nextThemeLabel}
        aria-label={nextThemeLabel}
      >
        <div className="relative size-4 flex items-center justify-center">
          <Sun
            className={cn(
              "size-4 transition-all duration-300 absolute",
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0"
            )}
          />
          <Moon
            className={cn(
              "size-4 transition-all duration-300 absolute",
              isDark
                ? "rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            )}
          />
        </div>
        <span className="sr-only">{nextThemeLabel}</span>
      </button>
    )
  }

  return (
    <div
      id={id}
      className={cn(
        "inline-flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700/60 rounded-xl text-neutral-600 dark:text-neutral-300 shadow-xs",
        className
      )}
      role="group"
      aria-label="Toggle tema tampilan"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={cn(
          "p-1.5 rounded-lg transition-all cursor-pointer",
          theme === "light"
            ? "bg-white text-purple-600 dark:bg-neutral-700 dark:text-purple-300 shadow-xs font-semibold"
            : "hover:text-neutral-900 dark:hover:text-white"
        )}
        title="Mode Terang"
        aria-label="Mode Terang"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "p-1.5 rounded-lg transition-all cursor-pointer",
          theme === "dark"
            ? "bg-neutral-900 text-purple-400 dark:bg-neutral-700 shadow-xs font-semibold"
            : "hover:text-neutral-900 dark:hover:text-white"
        )}
        title="Mode Gelap"
        aria-label="Mode Gelap"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={cn(
          "p-1.5 rounded-lg transition-all cursor-pointer",
          theme === "system"
            ? "bg-white text-purple-600 dark:bg-neutral-700 dark:text-purple-300 shadow-xs font-semibold"
            : "hover:text-neutral-900 dark:hover:text-white"
        )}
        title="Ikuti Tema Sistem"
        aria-label="System mode"
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
