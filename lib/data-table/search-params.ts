/**
 * State tabel sisi-server (ADR-0012 / #23): halaman, urutan, dan filter hidup di
 * search params URL sehingga bisa dibagikan dan di-bookmark. Modul ini murni
 * (tanpa React/DB) agar mudah diuji.
 */

export type SortDir = "asc" | "desc"

export interface TableConfig {
  sortable: readonly string[]
  defaultSort: { key: string; dir: SortDir }
  /** Nama param -> daftar nilai yang diizinkan, atau "text" untuk teks bebas. */
  filters: Record<string, readonly string[] | "text">
  pageSize: number
  maxPageSize: number
}

export interface TableState {
  page: number
  pageSize: number
  sort: { key: string; dir: SortDir }
  filters: Record<string, string>
}

export type RawSearchParams = Record<string, string | string[] | undefined>

const MAX_TEXT = 100

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function positiveInt(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const n = Number(value)
  return n >= 1 ? n : null
}

export function parseTableParams(raw: RawSearchParams, config: TableConfig): TableState {
  const page = positiveInt(first(raw.page)) ?? 1
  const requestedSize = positiveInt(first(raw.pageSize)) ?? config.pageSize
  const pageSize = Math.min(requestedSize, config.maxPageSize)

  const sortKey = first(raw.sort)
  const sortDir = first(raw.dir)
  const sort: TableState["sort"] =
    sortKey !== undefined && config.sortable.includes(sortKey)
      ? { key: sortKey, dir: sortDir === "desc" ? "desc" : "asc" }
      : config.defaultSort

  const filters: Record<string, string> = {}
  for (const [name, rule] of Object.entries(config.filters)) {
    const value = first(raw[name])?.trim()
    if (!value || value === "all") continue
    if (rule === "text") {
      filters[name] = value.slice(0, MAX_TEXT)
    } else if (rule.includes(value)) {
      filters[name] = value
    }
  }

  return { page, pageSize, sort, filters }
}

export interface TablePatch {
  page?: number
  sort?: { key: string; dir: SortDir }
  /** Nilai null/""/"all" menghapus filter. Mengubah filter/urutan kembali ke halaman 1. */
  filters?: Record<string, string | null>
}

export function buildTableHref(
  pathname: string,
  current: TableState,
  config: TableConfig,
  patch: TablePatch | Record<string, string | null> = {}
): string {
  // Bentuk ringkas: { status: "x" } diperlakukan sebagai patch filter.
  const structured = patch as TablePatch
  const filterPatch: Record<string, string | null> = {}
  let page = structured.page
  let sortPatch = structured.sort
  for (const [k, v] of Object.entries(patch)) {
    if (k === "page" || k === "sort") continue
    if (k === "filters") Object.assign(filterPatch, v as Record<string, string | null>)
    else if (k in config.filters) filterPatch[k] = v as string | null
  }

  const filters = { ...current.filters }
  const filterChanged = Object.keys(filterPatch).length > 0
  for (const [name, v] of Object.entries(filterPatch)) {
    if (v === null || v === "" || v === "all") delete filters[name]
    else filters[name] = v
  }

  const sort = sortPatch ?? current.sort
  page = page ?? (filterChanged || sortPatch ? 1 : current.page)

  const qs = new URLSearchParams()
  for (const name of Object.keys(config.filters)) {
    if (filters[name]) qs.set(name, filters[name])
  }
  if (sort.key !== config.defaultSort.key || sort.dir !== config.defaultSort.dir) {
    qs.set("sort", sort.key)
    qs.set("dir", sort.dir)
  }
  if (page > 1) qs.set("page", String(page))
  if (current.pageSize !== config.pageSize) qs.set("pageSize", String(current.pageSize))

  const s = qs.toString()
  return s ? `${pathname}?${s}` : pathname
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}
