import { eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { platformPricing } from "@/db/schema"

export interface RolePricing {
  counselorType: "peer" | "psychologist"
  basePrice: number
  promoPrice: number
  isSaleActive: boolean
  allowVoucher: boolean
}

export interface PlatformPricingData {
  peer: RolePricing
  psychologist: RolePricing
}

export const DEFAULT_PLATFORM_PRICING: PlatformPricingData = {
  peer: {
    counselorType: "peer",
    basePrice: 85000,
    promoPrice: 49000,
    isSaleActive: true,
    allowVoucher: false,
  },
  psychologist: {
    counselorType: "psychologist",
    basePrice: 150000,
    promoPrice: 129000,
    isSaleActive: true,
    allowVoucher: true,
  },
}

let cachedPricing: PlatformPricingData = {
  peer: { ...DEFAULT_PLATFORM_PRICING.peer },
  psychologist: { ...DEFAULT_PLATFORM_PRICING.psychologist },
}

let isTableInitialized = false
let isDbAvailable = true

async function ensurePricingTable(): Promise<void> {
  if (isTableInitialized) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_pricing (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        counselor_type text NOT NULL UNIQUE,
        base_price numeric(12, 2) NOT NULL,
        promo_price numeric(12, 2),
        is_sale_active boolean NOT NULL DEFAULT false,
        allow_voucher boolean NOT NULL DEFAULT true,
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `)
    isTableInitialized = true
    isDbAvailable = true
  } catch (error) {
    isTableInitialized = true
    isDbAvailable = false
    console.warn("[pricing] Table auto-ensure skipped:", error)
  }
}

/**
 * Get active platform pricing for peer counselors and clinical psychologists.
 * Resilient to DB latency / outages using cached in-memory fallback.
 */
export async function getPlatformPricing(): Promise<PlatformPricingData> {
  if (!isDbAvailable) return cachedPricing
  try {
    await ensurePricingTable()
    if (!isDbAvailable) return cachedPricing

    const rows = await db
      .select({
        counselorType: platformPricing.counselorType,
        basePrice: platformPricing.basePrice,
        promoPrice: platformPricing.promoPrice,
        isSaleActive: platformPricing.isSaleActive,
        allowVoucher: platformPricing.allowVoucher,
      })
      .from(platformPricing)

    if (rows.length > 0) {
      for (const row of rows) {
        const type = row.counselorType as "peer" | "psychologist"
        if (type === "peer" || type === "psychologist") {
          cachedPricing[type] = {
            counselorType: type,
            basePrice: Number(row.basePrice) || DEFAULT_PLATFORM_PRICING[type].basePrice,
            promoPrice:
              row.promoPrice !== null && row.promoPrice !== undefined
                ? Number(row.promoPrice)
                : DEFAULT_PLATFORM_PRICING[type].promoPrice,
            isSaleActive: Boolean(row.isSaleActive),
            allowVoucher: Boolean(row.allowVoucher),
          }
        }
      }
    }
  } catch (error) {
    isDbAvailable = false
    console.warn("[pricing] Failed to read platform_pricing from DB, using fallback:", error)
  }

  return cachedPricing
}

/**
 * Update pricing configuration for a specific role.
 */
export async function updatePlatformPricing(
  counselorType: "peer" | "psychologist",
  data: Partial<Omit<RolePricing, "counselorType">>
): Promise<RolePricing> {
  const current = cachedPricing[counselorType]
  const updated: RolePricing = {
    counselorType,
    basePrice: data.basePrice !== undefined ? data.basePrice : current.basePrice,
    promoPrice: data.promoPrice !== undefined ? data.promoPrice : current.promoPrice,
    isSaleActive: data.isSaleActive !== undefined ? data.isSaleActive : current.isSaleActive,
    allowVoucher: data.allowVoucher !== undefined ? data.allowVoucher : current.allowVoucher,
  }

  try {
    await ensurePricingTable()

    await db
      .insert(platformPricing)
      .values({
        counselorType,
        basePrice: updated.basePrice.toString(),
        promoPrice: updated.promoPrice.toString(),
        isSaleActive: updated.isSaleActive,
        allowVoucher: updated.allowVoucher,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: platformPricing.counselorType,
        set: {
          basePrice: updated.basePrice.toString(),
          promoPrice: updated.promoPrice.toString(),
          isSaleActive: updated.isSaleActive,
          allowVoucher: updated.allowVoucher,
          updatedAt: new Date(),
        },
      })

    cachedPricing[counselorType] = updated
  } catch (error) {
    console.error("[pricing] Failed to persist platform_pricing to DB, updating in-memory:", error)
    cachedPricing[counselorType] = updated
  }

  return cachedPricing[counselorType]
}
