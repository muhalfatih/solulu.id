import type { TableConfig, TableState } from "@/lib/data-table/search-params"
import { activePrice, type ServiceLike } from "@/lib/services/pricing"

/** Tabel Layanan: sort/filter/halaman di URL (pola #23). Jumlah Layanan kecil, jadi dipaginasi di memori. */
export const LAYANAN_PATH = "/admin/layanan"

export const layananTableConfig: TableConfig = {
  sortable: ["sortOrder", "name", "price"],
  defaultSort: { key: "sortOrder", dir: "asc" },
  filters: { q: "text", status: ["active", "inactive"], type: ["peer", "psychologist"] },
  pageSize: 10,
  maxPageSize: 50,
}

export function queryServices<T extends ServiceLike>(
  all: readonly T[],
  state: TableState
): { rows: T[]; total: number } {
  const { q, status, type } = state.filters
  const needle = q?.toLowerCase()
  const filtered = all.filter((s) => {
    if (needle && !`${s.name} ${s.slug}`.toLowerCase().includes(needle)) return false
    if (status === "active" && !s.isActive) return false
    if (status === "inactive" && s.isActive) return false
    if (type && !s.allowedCounselorTypes.includes(type as "peer" | "psychologist")) return false
    return true
  })
  const dir = state.sort.dir === "desc" ? -1 : 1
  const keyOf = (s: T) =>
    state.sort.key === "name"
      ? s.name.toLowerCase()
      : state.sort.key === "price"
        ? activePrice(s)
        : s.sortOrder
  const sorted = [...filtered].sort((a, b) => {
    const ka = keyOf(a)
    const kb = keyOf(b)
    if (ka < kb) return -dir
    if (ka > kb) return dir
    return a.name.localeCompare(b.name)
  })
  const start = (state.page - 1) * state.pageSize
  return { rows: sorted.slice(start, start + state.pageSize), total: sorted.length }
}
