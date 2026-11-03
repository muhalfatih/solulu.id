import { auditLogs, type NewAuditLog } from "@/db/schema"
import { getStaffRole, type RoleCarrier } from "@/lib/auth/staff-role"

/**
 * Jejak Audit (#24). Satu-satunya jalur tulis: `recordAudit(tx, entry)` dipanggil
 * di dalam transaksi yang sama dengan aksinya, sehingga aksi yang gagal/rollback
 * tidak meninggalkan baris audit. Modul ini hanya meng-INSERT (append-only).
 */

export const AUDIT_ACTIONS = [
  "settings.update",
  "pricing.update",
  "service.create",
  "service.update",
  "service.toggle",
  "counselor_service.exclusion",
  "voucher.create",
  "voucher.toggle",
  "voucher.delete",
  "zoom_account.create",
  "zoom_account.update",
  "zoom_account.delete",
  "counselor.approval",
  "payment.verify",
  "payment.reject",
  "booking.no_show",
  "booking.manual_create",
  "booking.quick_create",
  "pool.assign",
  "booking.reschedule_admin",
  "counselor_document.download",
  "whatsapp_template.update",
  "payroll.close",
  "specialization.create",
  "specialization.update",
  "specialization.toggle",
  "specialization.delete",
  "gallery.create",
  "gallery.delete",
  "testimonial.create",
  "testimonial.update",
  "testimonial.delete",
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export const AUDIT_ENTITY_TYPES = [
  "platform_settings",
  "service",
  "voucher",
  "zoom_account",
  "counselor",
  "booking",
  "counselor_document",
  "whatsapp_template",
  "payroll_period",
  "specialization",
  "gallery_item",
  "testimonial",
] as const
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number]

/** Hanya kemampuan insert yang dibutuhkan; cocok dengan `db` maupun `tx` Drizzle. */
export interface AuditExecutor {
  insert: (table: typeof auditLogs) => {
    values: (row: NewAuditLog) => PromiseLike<unknown>
  }
}

export interface AuditEntry {
  actor: RoleCarrier | null | undefined
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string | null
  before?: unknown
  after?: unknown
  ip?: string | null
}

const SENSITIVE_KEY = /secret|password|token|api[_-]?key|encrypted|authorization/i

/** Menghapus nilai rahasia dan mengubah Date/undefined menjadi JSON yang aman. */
export function sanitizeAuditPayload(value: unknown): unknown {
  if (value === undefined) return null
  return JSON.parse(
    JSON.stringify(value, (key, v) => (key && SENSITIVE_KEY.test(key) ? "[REDACTED]" : v)) ?? "null"
  )
}

export function buildAuditRow(entry: AuditEntry): NewAuditLog {
  return {
    actorId: entry.actor?.id ?? null,
    actorRole: getStaffRole(entry.actor),
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    ip: entry.ip ?? null,
    before: sanitizeAuditPayload(entry.before),
    after: sanitizeAuditPayload(entry.after),
  }
}

/** Alamat IP klien dari header proxy; kosong di luar konteks request. */
export async function getRequestIp(): Promise<string | null> {
  try {
    const { headers } = await import("next/headers")
    const h = await headers()
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim()
    return forwarded || h.get("x-real-ip") || null
  } catch {
    return null
  }
}

export class AuditWriteError extends Error {
  constructor(cause: unknown) {
    super("Gagal menulis Jejak Audit; aksi dibatalkan.", { cause })
    this.name = "AuditWriteError"
  }
}

/** Menulis satu baris audit. Error dilempar agar transaksi pemanggil di-rollback. */
export async function recordAudit(executor: AuditExecutor, entry: AuditEntry): Promise<void> {
  const row = buildAuditRow({ ...entry, ip: entry.ip ?? (await getRequestIp()) })
  try {
    await executor.insert(auditLogs).values(row)
  } catch (err) {
    throw new AuditWriteError(err)
  }
}
