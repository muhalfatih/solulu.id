"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"

export interface VariantOption {
  key: string
  name: string
  description?: string
}

interface PrototypeSwitcherProps {
  variants: VariantOption[]
  defaultVariant?: string
}

function SwitcherInner({ variants, defaultVariant = "A" }: PrototypeSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentKey = searchParams.get("variant") || defaultVariant
  const currentIndex = Math.max(
    0,
    variants.findIndex((v) => v.key.toUpperCase() === currentKey.toUpperCase())
  )
  const currentVariant = variants[currentIndex] || variants[0]

  const setVariant = React.useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("variant", key)
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const handlePrev = React.useCallback(() => {
    const nextIdx = (currentIndex - 1 + variants.length) % variants.length
    setVariant(variants[nextIdx].key)
  }, [currentIndex, variants, setVariant])

  const handleNext = React.useCallback(() => {
    const nextIdx = (currentIndex + 1) % variants.length
    setVariant(variants[nextIdx].key)
  }, [currentIndex, variants, setVariant])

  // Keyboard navigation: Left / Right arrows
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handlePrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlePrev, handleNext])

  return (
    <aside aria-label="Prototype Variant Switcher" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900/95 text-neutral-100 rounded-full shadow-2xl border border-neutral-700/80 backdrop-blur-md">
        <div className="flex items-center gap-1.5 pl-1 pr-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 border-r border-neutral-700">
          <Eye className="w-3.5 h-3.5" />
          <span>Prototype</span>
        </div>

        <button
          onClick={handlePrev}
          title="Varian Sebelumnya (Tekan Panah Kiri)"
          className="p-1 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {variants.map((v) => {
            const isActive = v.key.toUpperCase() === currentVariant.key.toUpperCase()
            return (
              <button
                key={v.key}
                onClick={() => setVariant(v.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500 text-neutral-950 font-semibold shadow-sm"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <span>{v.key}: {v.name}</span>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleNext}
          title="Varian Selanjutnya (Tekan Panah Kanan)"
          className="p-1 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex text-[11px] text-neutral-400 pl-2 border-l border-neutral-700">
          Gunakan <kbd className="mx-1 px-1 bg-neutral-800 border border-neutral-600 rounded text-[10px]">←</kbd> <kbd className="mr-1 px-1 bg-neutral-800 border border-neutral-600 rounded text-[10px]">→</kbd>
        </div>
      </div>
    </aside>
  )
}

export function PrototypeSwitcher(props: PrototypeSwitcherProps) {
  return (
    <React.Suspense fallback={null}>
      <SwitcherInner {...props} />
    </React.Suspense>
  )
}
