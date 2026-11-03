import type { TableConfig } from "@/lib/data-table/search-params"
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "./record"

export const AUDIT_PATH = "/admin/audit"

export const AUDIT_SORT_KEYS = ["createdAt", "action", "entityType", "actorRole"] as const

/** Filter aktor/aksi/entitas/rentang tanggal; semuanya via search params URL. */
export const auditTableConfig: TableConfig = {
  sortable: AUDIT_SORT_KEYS,
  defaultSort: { key: "createdAt", dir: "desc" },
  filters: {
    actor: "text",
    action: AUDIT_ACTIONS,
    entity: AUDIT_ENTITY_TYPES,
    from: "text",
    to: "text",
  },
  pageSize: 20,
  maxPageSize: 100,
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Rentang [from, to] tanggal WIB (inklusif) menjadi batas waktu UTC; format salah diabaikan. */
export function parseAuditRange(filters: Record<string, string>): { from?: Date; toExclusive?: Date } {
  const out: { from?: Date; toExclusive?: Date } = {}
  if (filters.from && ISO_DATE.test(filters.from)) {
    const d = new Date(`${filters.from}T00:00:00+07:00`)
    if (!Number.isNaN(d.getTime())) out.from = d
  }
  if (filters.to && ISO_DATE.test(filters.to)) {
    const d = new Date(`${filters.to}T00:00:00+07:00`)
    if (!Number.isNaN(d.getTime())) out.toExclusive = new Date(d.getTime() + 24 * 3600 * 1000)
  }
  return out
}
