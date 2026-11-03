import { and, asc, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/db"
import { auditLogs, type AuditLog } from "@/db/schema"
import { requireStaffUser } from "@/lib/auth/staff"
import { SUPERADMIN_ONLY, type RoleCarrier } from "@/lib/auth/staff-role"
import type { TableState } from "@/lib/data-table/search-params"
import { parseAuditRange } from "./query"

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

export function buildAuditConditions(filters: Record<string, string>): SQL | undefined {
  const c: SQL[] = []
  if (filters.action) c.push(eq(auditLogs.action, filters.action))
  if (filters.entity) c.push(eq(auditLogs.entityType, filters.entity))
  if (filters.actor) {
    const like = `%${escapeLike(filters.actor)}%`
    c.push(or(ilike(auditLogs.actorId, like), ilike(auditLogs.actorRole, like))!)
  }
  const { from, toExclusive } = parseAuditRange(filters)
  if (from) c.push(gte(auditLogs.createdAt, from))
  if (toExclusive) c.push(lt(auditLogs.createdAt, toExclusive))
  return c.length ? and(...c) : undefined
}

const SORT = {
  createdAt: auditLogs.createdAt,
  action: auditLogs.action,
  entityType: auditLogs.entityType,
  actorRole: auditLogs.actorRole,
} as const

export interface AuditPage {
  rows: AuditLog[]
  total: number
}

/**
 * Satu-satunya jalur baca Jejak Audit. Hanya Superadmin; peran lain mendapat null
 * tanpa menyentuh database.
 */
export async function listAuditLogs(
  state: TableState,
  currentUser?: RoleCarrier | null
): Promise<AuditPage | null> {
  const superadmin = await requireStaffUser(currentUser, SUPERADMIN_ONLY)
  if (!superadmin) return null

  const where = buildAuditConditions(state.filters)
  const col = SORT[state.sort.key as keyof typeof SORT] ?? auditLogs.createdAt
  const dir = state.sort.dir === "asc" ? asc : desc

  const [rows, [count]] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(where)
      .orderBy(dir(col), desc(auditLogs.createdAt))
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(auditLogs).where(where),
  ])
  return { rows, total: count?.total ?? 0 }
}
