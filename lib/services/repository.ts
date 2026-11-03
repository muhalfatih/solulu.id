import { asc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { services, counselorServiceExclusions } from "@/db/schema"
import { recordAudit } from "@/lib/audit/record"
import type { RoleCarrier } from "@/lib/auth/staff-role"

export type ServiceRecord = typeof services.$inferSelect
export type ServicePatch = Partial<
  Pick<
    typeof services.$inferInsert,
    "basePrice" | "promoPrice" | "allowVoucher" | "overtimeRatePer30Min"
  >
>

/** All Layanan (active and inactive), in display order. Empty array when none exist. */
export async function listAllServices(): Promise<ServiceRecord[]> {
  return db.select().from(services).orderBy(asc(services.sortOrder), asc(services.name))
}

export async function getServiceById(serviceId: string): Promise<ServiceRecord | null> {
  const rows = await db.select().from(services).where(eq(services.id, serviceId)).limit(1)
  return rows[0] ?? null
}

/** Layanan ids that Admin switched off for this counselor. */
export async function getExcludedServiceIds(counselorId: string): Promise<string[]> {
  const rows = await db
    .select({ serviceId: counselorServiceExclusions.serviceId })
    .from(counselorServiceExclusions)
    .where(eq(counselorServiceExclusions.counselorId, counselorId))
  return rows.map((r) => r.serviceId)
}

/** counselorId -> excluded Layanan ids, for catalog-wide queries. */
export async function getExclusionsByCounselor(
  counselorIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (counselorIds.length === 0) return map
  const rows = await db
    .select({
      counselorId: counselorServiceExclusions.counselorId,
      serviceId: counselorServiceExclusions.serviceId,
    })
    .from(counselorServiceExclusions)
    .where(inArray(counselorServiceExclusions.counselorId, counselorIds))
  for (const r of rows) {
    const list = map.get(r.counselorId) ?? []
    list.push(r.serviceId)
    map.set(r.counselorId, list)
  }
  return map
}

export async function updateServiceBySlug(
  slug: string,
  patch: ServicePatch
): Promise<ServiceRecord | null> {
  const rows = await db
    .update(services)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(services.slug, slug))
    .returning()
  return rows[0] ?? null
}

/**
 * Ubah tarif Layanan + catat Jejak Audit (sebelum/sesudah) dalam satu transaksi.
 * Gagal menulis audit membatalkan perubahan tarif.
 */
export async function updateServiceBySlugAudited(
  slug: string,
  patch: ServicePatch,
  actor: RoleCarrier
): Promise<ServiceRecord | null> {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(services).where(eq(services.slug, slug)).limit(1)
    if (!before) return null
    const [after] = await tx
      .update(services)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(services.slug, slug))
      .returning()
    await recordAudit(tx, {
      actor,
      action: "pricing.update",
      entityType: "service",
      entityId: before.id,
      before,
      after,
    })
    return after ?? null
  })
}
