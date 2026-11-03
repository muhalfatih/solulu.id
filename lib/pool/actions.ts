import { requireStaffUser } from "@/lib/auth/staff"
import { recordAudit } from "@/lib/audit/record"
import { getAuthenticatedCounselor, resolveCounselorId } from "@/lib/counselor/auth"
import type { CounselorAuthContext } from "@/lib/counselor/types"
import type { RoleCarrier } from "@/lib/auth/staff-role"
import { assignPoolBooking, claimPoolBooking, type PoolStore } from "./claim"

export type PoolActionResult = { success: true } | { success: false; error: string }

export interface PoolActionDeps {
  store: PoolStore
  currentUser?: (CounselorAuthContext & RoleCarrier) | null
  now?: Date
  /** Dipanggil setelah klaim/penugasan berhasil (pemenuhan sesi). Kegagalannya tidak membatalkan klaim. */
  onAssigned?: (bookingId: string) => Promise<void>
}

async function afterAssign(deps: PoolActionDeps, bookingId: string) {
  try {
    await deps.onAssigned?.(bookingId)
  } catch (err) {
    console.error("[pool] pemenuhan sesi setelah klaim gagal; admin dapat memicu ulang", err)
  }
}

/** Klaim Sesi: ID konselor selalu dari sesi login. */
export async function claimSessionCore(bookingId: string, deps: PoolActionDeps): Promise<PoolActionResult> {
  const auth = await getAuthenticatedCounselor(deps.currentUser)
  if (!auth) return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) return { success: false, error: "Profil konselor tidak ditemukan." }

  const res = await claimPoolBooking(deps.store, { bookingId, counselorId, now: deps.now })
  if (!res.ok) return { success: false, error: res.error }
  await afterAssign(deps, bookingId)
  return { success: true }
}

/** Penugasan Admin: tercatat di Jejak Audit pada transaksi yang sama. */
export async function assignSessionCore(
  bookingId: string,
  counselorId: string,
  deps: PoolActionDeps
): Promise<PoolActionResult> {
  const admin = await requireStaffUser(deps.currentUser, ["admin", "superadmin"])
  if (!admin) return { success: false, error: "Akses ditolak. Hanya Admin yang dapat menugaskan konselor." }

  const res = await assignPoolBooking(deps.store, {
    bookingId,
    counselorId,
    audit: (tx, before) =>
      recordAudit(tx, {
        actor: admin,
        action: "pool.assign",
        entityType: "booking",
        entityId: bookingId,
        before: { counselorId: before.counselorId },
        after: { counselorId },
      }),
  })
  if (!res.ok) return { success: false, error: res.error }
  await afterAssign(deps, bookingId)
  return { success: true }
}
