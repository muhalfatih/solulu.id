"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { counselors } from "@/db/schema"
import { getAuthenticatedCounselor, resolveCounselorId } from "@/lib/counselor/auth"
import type { CounselorActionResponse, CounselorAuthContext } from "@/lib/counselor/types"
import { loadHonorSaya, type HonorSayaView, type HonorStore } from "@/lib/finance"
import { drizzleHonorStore } from "@/lib/finance/honor-store"
import { bankAccountSchema, type BankAccount, type BankAccountInput } from "@/lib/validations/bank-account"

const DENIED = "Akses ditolak. Silakan login sebagai Mitra Konselor."

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // Di luar konteks request Next.js (mis. Vitest) revalidate tidak tersedia.
  }
}

/**
 * Honor Saya: honor milik konselor yang sedang login saja. ID konselor selalu
 * diturunkan dari sesi login, tidak pernah dari parameter klien.
 */
export async function getHonorSayaAction(deps?: {
  currentUser?: CounselorAuthContext | null
  store?: HonorStore
  now?: Date
}): Promise<CounselorActionResponse<HonorSayaView>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) return { success: false, error: DENIED }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) return { success: false, error: "Profil konselor tidak ditemukan." }

  try {
    const view = await loadHonorSaya({
      counselorId,
      now: deps?.now ?? new Date(),
      store: deps?.store ?? drizzleHonorStore,
    })
    return { success: true, data: view }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memuat Honor Saya." }
  }
}

export async function getBankAccountAction(deps?: {
  currentUser?: CounselorAuthContext | null
  getBankAccount?: (counselorId: string) => Promise<BankAccount | null>
}): Promise<CounselorActionResponse<BankAccount | null>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) return { success: false, error: DENIED }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) return { success: false, error: "Profil konselor tidak ditemukan." }

  try {
    if (deps?.getBankAccount) return { success: true, data: await deps.getBankAccount(counselorId) }

    const [row] = await db
      .select({
        bankName: counselors.bankName,
        accountNumber: counselors.bankAccountNumber,
        accountHolder: counselors.bankAccountHolder,
      })
      .from(counselors)
      .where(eq(counselors.id, counselorId))
      .limit(1)

    if (!row || !row.bankName || !row.accountNumber || !row.accountHolder) {
      return { success: true, data: null }
    }
    return {
      success: true,
      data: { bankName: row.bankName, accountNumber: row.accountNumber, accountHolder: row.accountHolder },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memuat rekening bank." }
  }
}

export async function updateBankAccountAction(
  rawInput: BankAccountInput,
  deps?: {
    currentUser?: CounselorAuthContext | null
    updateBankAccount?: (counselorId: string, data: BankAccount) => Promise<void>
  }
): Promise<CounselorActionResponse<{ updated: boolean }>> {
  const auth = await getAuthenticatedCounselor(deps?.currentUser)
  if (!auth) return { success: false, error: DENIED }

  const counselorId = await resolveCounselorId(auth)
  if (!counselorId) return { success: false, error: "Profil konselor tidak ditemukan." }

  const parsed = bankAccountSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "Data rekening bank belum valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    if (deps?.updateBankAccount) {
      await deps.updateBankAccount(counselorId, parsed.data)
    } else {
      await db
        .update(counselors)
        .set({
          bankName: parsed.data.bankName,
          bankAccountNumber: parsed.data.accountNumber,
          bankAccountHolder: parsed.data.accountHolder,
        })
        .where(eq(counselors.id, counselorId))
    }
    safeRevalidatePath("/counselor/profile")
    return { success: true, data: { updated: true } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan rekening bank." }
  }
}
