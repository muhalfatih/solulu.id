"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { zoomAccounts } from "@/db/schema"
import { encrypt, decrypt } from "@/lib/encryption"
import {
  checkZoomSafetyLock,
  canAddZoomAccount,
  type SafetyLockResult,
  type CanAddAccountResult,
} from "@/lib/zoom/safety-lock"
import { createClient } from "@/lib/supabase/server"

import {
  zoomAccountInputSchema,
  zoomAccountUpdateSchema,
  type ZoomAccountInput,
  type ZoomAccountUpdateInput,
  type ActionResult,
  type ZoomAccountView,
} from "./schema";

// =============================================================================
// AUTH & CONTEXT HELPERS
// =============================================================================

export interface AuthContext {
  id: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

async function getAuthenticatedAdmin(
  customUser?: AuthContext | null
): Promise<AuthContext | null> {
  if (customUser !== undefined) {
    if (!customUser) return null
    const role = customUser.app_metadata?.role || customUser.user_metadata?.role
    return role === "admin" ? customUser : null
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null
    const role = user.app_metadata?.role || user.user_metadata?.role
    if (role !== "admin") return null

    return {
      id: user.id,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    }
  } catch {
    return null
  }
}

// =============================================================================
// SEAM 3 CORE HANDLERS (PURE / TESTABLE)
// =============================================================================

export interface SaveOptions {
  currentUser?: AuthContext | null
  canAddCheck?: () => Promise<CanAddAccountResult>
  insertAccount?: (data: typeof zoomAccounts.$inferInsert) => Promise<any>
}

export async function handleSaveZoomAccount(
  rawInput: ZoomAccountInput,
  options: SaveOptions = {}
): Promise<ActionResult> {
  const admin = await getAuthenticatedAdmin(options.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk mengelola akun Zoom.",
    }
  }

  const parsed = zoomAccountInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data input tidak valid.",
    }
  }

  const { name, email, accountId, clientId, clientSecret } = parsed.data

  // Enforce platform limit: Max 2 Zoom accounts
  const canAdd = options.canAddCheck
    ? await options.canAddCheck()
    : await canAddZoomAccount()

  if (!canAdd.allowed) {
    return {
      success: false,
      error:
        canAdd.error ||
        "Batas platform tercapai: Solulu dibatasi maksimal 2 akun Zoom.",
    }
  }

  // Encrypt clientSecret with AES-256-GCM
  const clientSecretEncrypted = encrypt(clientSecret)

  const payload: typeof zoomAccounts.$inferInsert = {
    name,
    email,
    accountId,
    clientId,
    clientSecretEncrypted,
    isActive: true,
  }

  if (options.insertAccount) {
    const result = await options.insertAccount(payload)
    return { success: true, data: result }
  }

  const [inserted] = await db.insert(zoomAccounts).values(payload).returning()
  return { success: true, data: inserted }
}

export interface UpdateOptions {
  currentUser?: AuthContext | null
  safetyLockCheck?: (id: string) => Promise<SafetyLockResult>
  updateAccount?: (
    id: string,
    data: Partial<typeof zoomAccounts.$inferInsert>
  ) => Promise<any>
}

export async function handleUpdateZoomAccount(
  id: string,
  rawInput: ZoomAccountUpdateInput,
  options: UpdateOptions = {}
): Promise<ActionResult> {
  const admin = await getAuthenticatedAdmin(options.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk mengelola akun Zoom.",
    }
  }

  const parsed = zoomAccountUpdateSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data input tidak valid.",
    }
  }

  // SAFETY LOCK CHECK: Edit is strictly blocked if there are upcoming active sessions
  const safetyLock = options.safetyLockCheck
    ? await options.safetyLockCheck(id)
    : await checkZoomSafetyLock(id)

  if (safetyLock.isLocked) {
    return {
      success: false,
      isLocked: true,
      upcomingSessionCount: safetyLock.upcomingSessionCount,
      error: safetyLock.reason,
    }
  }

  const dataToUpdate: Partial<typeof zoomAccounts.$inferInsert> = {
    ...parsed.data,
    updatedAt: new Date(),
  }

  if (parsed.data.clientSecret) {
    dataToUpdate.clientSecretEncrypted = encrypt(parsed.data.clientSecret)
    delete (dataToUpdate as any).clientSecret
  }

  if (options.updateAccount) {
    const result = await options.updateAccount(id, dataToUpdate)
    return { success: true, data: result }
  }

  const [updated] = await db
    .update(zoomAccounts)
    .set(dataToUpdate)
    .where(eq(zoomAccounts.id, id))
    .returning()

  return { success: true, data: updated }
}

export interface DeleteOptions {
  currentUser?: AuthContext | null
  safetyLockCheck?: (id: string) => Promise<SafetyLockResult>
  deleteAccount?: (id: string) => Promise<any>
}

export async function handleDeleteZoomAccount(
  id: string,
  options: DeleteOptions = {}
): Promise<ActionResult> {
  const admin = await getAuthenticatedAdmin(options.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk mengelola akun Zoom.",
    }
  }

  // SAFETY LOCK CHECK: Delete is strictly blocked if there are upcoming active sessions
  const safetyLock = options.safetyLockCheck
    ? await options.safetyLockCheck(id)
    : await checkZoomSafetyLock(id)

  if (safetyLock.isLocked) {
    return {
      success: false,
      isLocked: true,
      upcomingSessionCount: safetyLock.upcomingSessionCount,
      error: safetyLock.reason,
    }
  }

  if (options.deleteAccount) {
    await options.deleteAccount(id)
    return { success: true }
  }

  await db.delete(zoomAccounts).where(eq(zoomAccounts.id, id))
  return { success: true }
}

// =============================================================================
// NEXT.JS SERVER ACTIONS (CALLED BY UI)
// =============================================================================

export async function saveZoomAccountAction(
  input: ZoomAccountInput
): Promise<ActionResult> {
  const result = await handleSaveZoomAccount(input)
  if (result.success) {
    revalidatePath("/admin/zoom-settings")
  }
  return result
}

export async function updateZoomAccountAction(
  id: string,
  input: ZoomAccountUpdateInput
): Promise<ActionResult> {
  const result = await handleUpdateZoomAccount(id, input)
  if (result.success) {
    revalidatePath("/admin/zoom-settings")
  }
  return result
}

export async function deleteZoomAccountAction(
  id: string
): Promise<ActionResult> {
  const result = await handleDeleteZoomAccount(id)
  if (result.success) {
    revalidatePath("/admin/zoom-settings")
  }
  return result
}

export async function getZoomAccountsAction(): Promise<{
  success: boolean
  accounts?: ZoomAccountView[]
  error?: string
}> {
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    return {
      success: false,
      error:
        "Akses ditolak: Diperlukan role Admin untuk melihat pengaturan Zoom.",
    }
  }

  const rows = await db.select().from(zoomAccounts)

  const accounts: ZoomAccountView[] = await Promise.all(
    rows.map(async (acc) => {
      let rawSecret = ""
      try {
        rawSecret = decrypt(acc.clientSecretEncrypted)
      } catch {
        rawSecret = "error_decrypting"
      }

      const masked =
        rawSecret.length > 8
          ? `${rawSecret.slice(0, 4)}••••••••${rawSecret.slice(-4)}`
          : "••••••••••••"

      const safetyLock = await checkZoomSafetyLock(acc.id)

      return {
        id: acc.id,
        name: acc.name,
        email: acc.email,
        accountId: acc.accountId,
        clientId: acc.clientId,
        maskedClientSecret: masked,
        decryptedSecret: rawSecret,
        isActive: acc.isActive,
        createdAt: acc.createdAt.toISOString(),
        safetyLock,
      }
    })
  )

  return { success: true, accounts }
}
