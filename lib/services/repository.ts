import { and, asc, eq, inArray } from "drizzle-orm"
import { uniqueSlug } from "@/lib/services/validation"
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

export type ServiceInsertValues = Omit<
  typeof services.$inferInsert,
  "id" | "slug" | "createdAt" | "updatedAt" | "isActive"
>
export type ServiceUpdateValues = Partial<ServiceInsertValues>

/** Buat Layanan baru (aktif) + Jejak Audit dalam satu transaksi. Slug dibuat unik di dalam transaksi. */
export async function createServiceAudited(
  values: ServiceInsertValues,
  slugBase: string,
  actor: RoleCarrier
): Promise<ServiceRecord> {
  return db.transaction(async (tx) => {
    const existing = await tx.select({ slug: services.slug }).from(services)
    const slug = uniqueSlug(slugBase, new Set(existing.map((r) => r.slug)))
    const [row] = await tx
      .insert(services)
      .values({ ...values, slug, isActive: true })
      .returning()
    await recordAudit(tx, {
      actor,
      action: "service.create",
      entityType: "service",
      entityId: row.id,
      before: null,
      after: row,
    })
    return row
  })
}

/** Ubah tarif/promo/voucher/overtime/Bagi Hasil/Tipe Konselor Layanan + audit. Slug tidak berubah. */
export async function updateServiceByIdAudited(
  serviceId: string,
  values: ServiceUpdateValues,
  actor: RoleCarrier
): Promise<ServiceRecord | null> {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(services).where(eq(services.id, serviceId)).limit(1)
    if (!before) return null
    const [after] = await tx
      .update(services)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(services.id, serviceId))
      .returning()
    await recordAudit(tx, {
      actor,
      action: "service.update",
      entityType: "service",
      entityId: serviceId,
      before,
      after,
    })
    return after ?? null
  })
}

/** Aktif/nonaktifkan Layanan (tidak pernah dihapus) + audit. */
export async function setServiceActiveAudited(
  serviceId: string,
  isActive: boolean,
  actor: RoleCarrier
): Promise<ServiceRecord | null> {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(services).where(eq(services.id, serviceId)).limit(1)
    if (!before) return null
    const [after] = await tx
      .update(services)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(services.id, serviceId))
      .returning()
    await recordAudit(tx, {
      actor,
      action: "service.toggle",
      entityType: "service",
      entityId: serviceId,
      before: { isActive: before.isActive },
      after: { isActive: after?.isActive ?? isActive },
    })
    return after ?? null
  })
}

/** Matikan/nyalakan satu Layanan untuk satu konselor + audit. Idempoten. */
export async function setCounselorServiceExclusionAudited(
  counselorId: string,
  serviceId: string,
  excluded: boolean,
  actor: RoleCarrier
): Promise<void> {
  await db.transaction(async (tx) => {
    const where = and(
      eq(counselorServiceExclusions.counselorId, counselorId),
      eq(counselorServiceExclusions.serviceId, serviceId)
    )
    const current = await tx
      .select({ id: counselorServiceExclusions.id })
      .from(counselorServiceExclusions)
      .where(where)
    const wasExcluded = current.length > 0
    if (excluded && !wasExcluded) {
      await tx.insert(counselorServiceExclusions).values({ counselorId, serviceId })
    } else if (!excluded && wasExcluded) {
      await tx.delete(counselorServiceExclusions).where(where)
    }
    await recordAudit(tx, {
      actor,
      action: "counselor_service.exclusion",
      entityType: "counselor",
      entityId: counselorId,
      before: { serviceId, excluded: wasExcluded },
      after: { serviceId, excluded },
    })
  })
}
