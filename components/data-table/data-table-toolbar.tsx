"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildTableHref,
  type TableConfig,
  type TableState,
} from "@/lib/data-table/search-params"

export interface ToolbarSelect {
  /** Nama param URL, harus ada di config.filters. */
  name: string
  placeholder: string
  /** Opsi pertama "all" dibuat otomatis dari allLabel. */
  allLabel: string
  options: { value: string; label: string }[]
}

/** Toolbar filter: setiap perubahan menavigasi ke URL baru (state di URL, bukan di React). */
export function DataTableToolbar({
  pathname,
  state,
  config,
  search,
  selects,
}: {
  pathname: string
  state: TableState
  config: TableConfig
  search?: { name: string; placeholder: string }
  selects: ToolbarSelect[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const navigate = (patch: Record<string, string | null>) =>
    startTransition(() => router.push(buildTableHref(pathname, state, config, patch), { scroll: false }))

  const searchValue = search ? (state.filters[search.name] ?? "") : ""
  const hasFilters = Object.keys(state.filters).length > 0

  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5"
      aria-busy={isPending}
    >
      {search ? (
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const value = new FormData(e.currentTarget).get(search.name)
            navigate({ [search.name]: String(value ?? "").trim() || null })
          }}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              key={searchValue}
              name={search.name}
              defaultValue={searchValue}
              placeholder={search.placeholder}
              aria-label={search.placeholder}
              className="pl-8"
            />
          </div>
        </form>
      ) : null}

      {selects.map((s) => (
        <Select
          key={s.name}
          value={state.filters[s.name] ?? "all"}
          onValueChange={(v) => navigate({ [s.name]: v === "all" ? null : v })}
        >
          <SelectTrigger className="w-full" aria-label={s.placeholder}>
            <SelectValue placeholder={s.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{s.allLabel}</SelectItem>
              {s.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ))}

      {hasFilters ? (
        <Button variant="ghost" onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}>
          Reset filter
        </Button>
      ) : null}
    </div>
  )
}
