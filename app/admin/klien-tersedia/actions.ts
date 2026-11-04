"use server"

import { revalidatePath } from "next/cache"
import { requireStaffUser } from "@/lib/auth/staff"
import { fulfillSession } from "@/lib/fulfillment/fulfill"
import { assignSessionCore, type PoolActionResult } from "@/lib/pool/actions"
import {
  createPoolStore,
  listAssignableCounselors,
  listPoolQueue,
  type PoolQueueItem,
} from "@/lib/pool/store"

export interface AdminPoolItem extends PoolQueueItem {
  candidates: { id: string; fullName: string }[]
}

export async function getPoolQueueAdminAction(): Promise<
  { success: true; data: AdminPoolItem[] } | { success: false; error: string }
> {
  const admin = await requireStaffUser(undefined, ["admin", "superadmin"])
  if (!admin) return { success: false, error: "Akses ditolak." }
  try {
    const queue = await listPoolQueue()
    const data = await Promise.all(
      queue.map(async (q) => ({ ...q, candidates: await listAssignableCounselors(q.bookingId) }))
    )
    return { success: true, data }
  } catch {
    return { success: false, error: "Antrean belum dapat dimuat." }
  }
}

export async function assignPoolBookingAction(bookingId: string, counselorId: string): Promise<PoolActionResult> {
  const res = await assignSessionCore(bookingId, counselorId, {
    store: createPoolStore(),
    onAssigned: async (id) => {
      await fulfillSession(id)
    },
  })
  try {
    revalidatePath("/admin/klien-tersedia")
  } catch {}
  return res
}
