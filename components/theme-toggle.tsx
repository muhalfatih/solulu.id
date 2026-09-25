"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Laptop } from "lucide-react"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse ${className}`} />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div
      className={`inline-flex items-center p-1 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700/60 rounded-xl text-neutral-600 dark:text-neutral-300 shadow-xs ${className}`}
      role="group"
      aria-label="Toggle tema tampilan"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          theme === "light"
            ? "bg-white text-emerald-600 dark:bg-neutral-700 dark:text-emerald-400 shadow-xs font-semibold"
            : "hover:text-neutral-900 dark:hover:text-white"
        }`}
        title="Mode Terang"
        aria-label="Mode Terang"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-neutral-900 text-emerald-400 dark:bg-neutral-700 shadow-xs font-semibold"
            : "hover:text-neutral-900 dark:hover:text-white"
        }`}
        title="Mode Gelap"
        aria-label="Mode Gelap"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          theme === "system"
            ? "bg-white text-emerald-600 dark:bg-neutral-700 dark:text-emerald-400 shadow-xs font-semibold"
            : "hover:text-neutral-900 dark:hover:text-white"
        }`}
        title="Ikuti Tema Sistem"
        aria-label="System mode"
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
