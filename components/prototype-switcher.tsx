"use client"
// PROTOTYPE — floating variant switcher. Never rendered in production builds.
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: { key: string; name: string }[]
  current: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const idx = Math.max(0, variants.findIndex((v) => v.key === current))

  const go = React.useCallback(
    (step: number) => {
      const next = variants[(idx + step + variants.length) % variants.length]
      const sp = new URLSearchParams(params.toString())
      sp.set("variant", next.key)
      router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    },
    [idx, variants, params, pathname, router]
  )

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.closest("input, textarea, select, [contenteditable='true'], [role='slider']"))) return
      if (e.key === "ArrowLeft") go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  if (process.env.NODE_ENV === "production") return null

  const v = variants[idx]
  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-neutral-950 px-1.5 py-1.5 text-white shadow-2xl ring-4 ring-fuchsia-500/40">
      <button type="button" onClick={() => go(-1)} aria-label="Varian sebelumnya" className="rounded-full p-1.5 hover:bg-white/15">
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-56 px-2 text-center text-xs font-medium">
        PROTOTYPE · {v.key} <span className="text-white/60">({v.name})</span> · {idx + 1}/{variants.length}
      </span>
      <button type="button" onClick={() => go(1)} aria-label="Varian berikutnya" className="rounded-full p-1.5 hover:bg-white/15">
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
