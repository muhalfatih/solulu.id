"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserCheck,
  Shield,
  Stethoscope,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface PrototypeVariantInfo {
  key: string
  name: string
  tagline: string
}

export const LOGIN_VARIANTS: PrototypeVariantInfo[] = [
  {
    key: "A",
    name: "Split Editorial",
    tagline: "Tata letak dua kolom dengan manifesto etika & privasi",
  },
  {
    key: "B",
    name: "Focused Telemetry",
    tagline: "Kartu terpusat dengan bilah telemetri & opsi magic link",
  },
  {
    key: "C",
    name: "Segmented Workspace",
    tagline: "Formulir adaptif berbasis persona Konselor vs Admin",
  },
]

interface PrototypeSwitcherProps {
  currentVariant: string
  variants?: PrototypeVariantInfo[]
  onQuickFill?: (role: "admin" | "counselor") => void
}

export function PrototypeSwitcher({
  currentVariant,
  variants = LOGIN_VARIANTS,
  onQuickFill,
}: PrototypeSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentIndex = Math.max(
    0,
    variants.findIndex((v) => v.key === currentVariant)
  )

  const handleSelectVariant = React.useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("variant", key)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const handlePrev = React.useCallback(() => {
    const prevIndex =
      (currentIndex - 1 + variants.length) % variants.length
    handleSelectVariant(variants[prevIndex].key)
  }, [currentIndex, handleSelectVariant, variants])

  const handleNext = React.useCallback(() => {
    const nextIndex = (currentIndex + 1) % variants.length
    handleSelectVariant(variants[nextIndex].key)
  }, [currentIndex, handleSelectVariant, variants])

  // Keyboard navigation: ArrowLeft / ArrowRight
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when focusing inputs or editable fields
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
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

  const current = variants[currentIndex] || variants[0]

  return (
    <aside
      aria-label="Pengalih prototipe antarmuka"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-card/95 dark:bg-card/90 text-foreground border border-border shadow-2xl backdrop-blur-md transition-all duration-200"
    >
      <div className="flex items-center gap-1 pl-2 pr-1">
        <Sparkles className="size-3.5 text-primary shrink-0" aria-hidden="true" />
        <span className="text-[11px] font-semibold tracking-tight text-foreground hidden sm:inline">
          Prototipe UI
        </span>
      </div>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* Prev button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={handlePrev}
        className="size-7 rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Varian sebelumnya (Panah Kiri)"
        title="Varian sebelumnya (←)"
      >
        <ChevronLeft className="size-3.5" />
      </Button>

      {/* Variant Pills */}
      <div className="flex items-center gap-1">
        {variants.map((v) => {
          const isActive = v.key === current.key
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => handleSelectVariant(v.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
              title={`${v.name}: ${v.tagline}`}
            >
              <span className="font-mono font-bold text-[10px]">{v.key}</span>
              <span className="hidden md:inline">{v.name}</span>
            </button>
          )
        })}
      </div>

      {/* Next button */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={handleNext}
        className="size-7 rounded-full text-muted-foreground hover:text-foreground"
        aria-label="Varian berikutnya (Panah Kanan)"
        title="Varian berikutnya (→)"
      >
        <ChevronRight className="size-3.5" />
      </Button>

      {onQuickFill && (
        <>
          <div className="h-4 w-px bg-border mx-0.5" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="xs"
                className="h-7 px-2.5 rounded-full text-[11px] font-medium border-primary/30 text-primary hover:bg-primary/10"
              >
                <UserCheck className="size-3 mr-1" aria-hidden="true" />
                <span>Isi Akun Demo</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 text-xs">
              <DropdownMenuLabel className="font-normal text-[11px] text-muted-foreground">
                Pilih peran untuk simulasi instan:
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onQuickFill("admin")}
                className="flex items-start gap-2 py-2 cursor-pointer"
              >
                <Shield className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Admin Pelayanan</span>
                  <span className="text-[10px] text-muted-foreground">
                    admin@solulu.id • Portal Operasional
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onQuickFill("counselor")}
                className="flex items-start gap-2 py-2 cursor-pointer"
              >
                <Stethoscope className="size-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Psikolog Klinis</span>
                  <span className="text-[10px] text-muted-foreground">
                    sarah.annisa@solulu.id • Ruang Konseling
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </aside>
  )
}
