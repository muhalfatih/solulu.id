import { eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { platformSettings } from "@/db/schema"

export interface PlatformSettingsData {
  isScreeningRequired: boolean
}

// In-memory cache for ultra-fast reads & resilience
let cachedSettings: PlatformSettingsData = {
  isScreeningRequired: false,
}

let isTableInitialized = false
let isDbAvailable = true

async function ensureSettingsTable(): Promise<void> {
  if (isTableInitialized) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id text PRIMARY KEY DEFAULT 'default',
        is_screening_required boolean NOT NULL DEFAULT false,
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `)
    isTableInitialized = true
    isDbAvailable = true
  } catch (error) {
    isTableInitialized = true
    isDbAvailable = false
    // If permission or pooler restricts DDL, continue with runtime query/memory fallback
    console.warn("[settings] Table auto-ensure skipped:", error)
  }
}

/**
 * Get current platform settings.
 * Defaults to `isScreeningRequired: false` (screening is optional).
 */
export async function getPlatformSettings(): Promise<PlatformSettingsData> {
  if (!isDbAvailable) return cachedSettings
  try {
    await ensureSettingsTable()
    if (!isDbAvailable) return cachedSettings
    const rows = await db
      .select({
        isScreeningRequired: platformSettings.isScreeningRequired,
      })
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"))
      .limit(1)

    if (rows.length > 0) {
      cachedSettings = {
        isScreeningRequired: Boolean(rows[0].isScreeningRequired),
      }
    }
  } catch (error) {
    isDbAvailable = false
    console.warn("[settings] Failed to read platform_settings from DB, using fallback:", error)
  }

  return cachedSettings
}

/**
 * Update platform settings.
 */
export async function updatePlatformSettings(
  data: Partial<PlatformSettingsData>
): Promise<PlatformSettingsData> {
  try {
    await ensureSettingsTable()

    const newRequired = data.isScreeningRequired !== undefined 
      ? data.isScreeningRequired 
      : cachedSettings.isScreeningRequired

    await db
      .insert(platformSettings)
      .values({
        id: "default",
        isScreeningRequired: newRequired,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: platformSettings.id,
        set: {
          isScreeningRequired: newRequired,
          updatedAt: new Date(),
        },
      })

    cachedSettings.isScreeningRequired = newRequired
  } catch (error) {
    console.error("[settings] Failed to persist platform_settings to DB, updating in-memory:", error)
    if (data.isScreeningRequired !== undefined) {
      cachedSettings.isScreeningRequired = data.isScreeningRequired
    }
  }

  return cachedSettings
}
