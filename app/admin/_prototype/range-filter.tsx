"use client"
// PROTOTYPE — date-range filter kept in the URL (?range=), preserving ?variant=.
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RANGE_OPTIONS, type RangeKey } from "./range-options"

export function RangeFilter({ value }: { value: RangeKey }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      aria-label="Rentang waktu"
      onValueChange={(v) => {
        if (!v) return
        const next = new URLSearchParams(params.toString())
        next.set("range", v)
        router.replace(`${pathname}?${next.toString()}`, { scroll: false })
      }}
    >
      {RANGE_OPTIONS.map((o) => (
        <ToggleGroupItem key={o.key} value={o.key} className="px-3">
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
