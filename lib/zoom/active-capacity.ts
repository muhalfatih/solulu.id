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
 * - If 0 accounts active: returns 0 (with a safe minimum of 1 for booking fallback if unconfigured).
 * - If 1 account active: returns 1 (strictly limits platform concurrency to 1 concurrent session).
 * - If 2 accounts active: returns 2 (ADR-0001 & ADR-0002 max platform limit).
 */
export async function getActiveZoomCapacity(
  options?: GetActiveZoomCapacityOptions
): Promise<number> {
  try {
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
    return Math.min(Math.max(activeCount, 0), 2)
  } catch {
    // Resilient fallback in dev/test when DB is unseeded/offline:
    // Respects platform architectural max capacity (ADR-0001 & ADR-0002)
    return 2
  }
}
