import { db } from "@/db"
import { zoomAccounts } from "@/db/schema"
import { eq } from "drizzle-orm"

export interface GetActiveZoomCapacityOptions {
  fetchActiveAccounts?: () => Promise<Array<{ id: string; name: string; isActive: boolean }>>
}

/**
 * Returns the effective real-time concurrency limit based on active Zoom accounts.
 *
 * Rules:
 * - Master SOP & ADR-0005: Platform operates on a 4-Zoom Pro accounts pool.
 * - Caps active count at 4 accounts.
 */
export async function getActiveZoomCapacity(
  options?: GetActiveZoomCapacityOptions
): Promise<number> {
  // Fail closed: a DB error propagates so callers fail clearly instead of
  // proceeding on invented capacity.
  let rows: Array<{ id: string; name: string; isActive: boolean }> = []
  if (options?.fetchActiveAccounts) {
    rows = await options.fetchActiveAccounts()
  } else {
    rows = await db
      .select({
        id: zoomAccounts.id,
        name: zoomAccounts.name,
        isActive: zoomAccounts.isActive,
      })
      .from(zoomAccounts)
      .where(eq(zoomAccounts.isActive, true))
  }

  const activeCount = rows.filter((r) => r.isActive).length
  return Math.min(Math.max(activeCount, 0), 4)
}
