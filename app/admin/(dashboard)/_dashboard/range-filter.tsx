"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RANGE_OPTIONS, type RangeKey } from "@/lib/admin-metrics/range"

/** Filter rentang disimpan di URL (`?period=`) agar bisa dibagikan dan di-bookmark. */
export function RangeFilter({ value }: { value: RangeKey }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      aria-label="Rentang waktu"
      aria-busy={pending}
      className="flex-wrap"
      onValueChange={(next) => {
        if (!next) return
        const query = new URLSearchParams(params.toString())
        query.set("period", next)
        startTransition(() => router.replace(`${pathname}?${query.toString()}`, { scroll: false }))
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
