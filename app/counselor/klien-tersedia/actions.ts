"use server"

import { revalidatePath } from "next/cache"
import { getAuthenticatedCounselor, resolveCounselorId } from "@/lib/counselor/auth"
import { fulfillSession } from "@/lib/fulfillment/fulfill"
import { claimSessionCore, type PoolActionResult } from "@/lib/pool/actions"
import { createPoolStore, listPoolQueue, type PoolQueueItem } from "@/lib/pool/store"

export async function getAvailableClientsAction(): Promise<
  { success: true; data: PoolQueueItem[] } | { success: false; error: string }
> {
  const auth = await getAuthenticatedCounselor()
  if (!auth) return { success: false, error: "Akses ditolak. Silakan login sebagai Mitra Konselor." }
  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) return { success: false, error: "Profil konselor tidak ditemukan." }
  try {
    return { success: true, data: await listPoolQueue({ counselorId }) }
  } catch {
    return { success: false, error: "Antrean belum dapat dimuat." }
  }
}

export async function claimSessionAction(bookingId: string): Promise<PoolActionResult> {
  const res = await claimSessionCore(bookingId, {
    store: createPoolStore(),
    onAssigned: async (id) => {
      await fulfillSession(id)
    },
  })
  try {
    revalidatePath("/counselor/klien-tersedia")
    revalidatePath("/counselor/dashboard")
  } catch {}
  return res
}
