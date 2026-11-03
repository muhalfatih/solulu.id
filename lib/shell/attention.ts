import { and, count, eq, isNotNull, lt, or, sql } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselorApplications, counselors } from "@/db/schema"
import { CLAIM_CUTOFF_HOURS } from "@/lib/booking-cycle"
import { countUnclaimedNearCutoff } from "@/lib/pool/store"
import type { PortalKey, AttentionCounts } from "@/lib/shell/nav"

/**
 * Real counts for the sidebar's "Perlu Tindakan" shortcuts. A query that fails
 * yields null for that key, so the shortcut is hidden instead of showing a
 * made-up number.
 */
export async function getAttentionCounts(portal: PortalKey): Promise<AttentionCounts> {
  if (portal !== "admin") return {}

  const safe = async (run: () => Promise<number>): Promise<number | null> => {
    try {
      return await run()
    } catch {
      return null
    }
  }

  const [transfer, applications, credentials, pool] = await Promise.all([
    safe(async () => {
      const [row] = await db
        .select({ n: count() })
        .from(bookings)
        .where(or(eq(bookings.manualPaymentStatus, "PENDING"), eq(bookings.extensionPaymentStatus, "PENDING")))
      return row?.n ?? 0
    }),
    safe(async () => {
      const [row] = await db
        .select({ n: count() })
        .from(counselorApplications)
        .where(eq(counselorApplications.status, "pending"))
      return row?.n ?? 0
    }),
    safe(async () => {
      const horizon = sql`(current_date + interval '60 days')::date`
      const [row] = await db
        .select({ n: count() })
        .from(counselors)
        .where(
          and(
            eq(counselors.isActive, true),
            or(
              and(isNotNull(counselors.strExpiresAt), lt(counselors.strExpiresAt, horizon)),
              and(isNotNull(counselors.sippExpiresAt), lt(counselors.sippExpiresAt, horizon))
            )
          )
        )
      return row?.n ?? 0
    }),
    // Booking pool belum diklaim yang sesinya dimulai dalam 4 jam sebelum Cutoff H-4 (sampai sesi mulai).
    safe(() => countUnclaimedNearCutoff(CLAIM_CUTOFF_HOURS * 2)),
  ])

  return { transfer, applications, credentials, pool }
}
