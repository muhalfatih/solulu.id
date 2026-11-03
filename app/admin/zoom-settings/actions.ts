"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { eq, and, inArray } from "drizzle-orm"
import { db } from "@/db"
import { zoomAccounts, bookings, schedules, counselors } from "@/db/schema"
import { encrypt, decrypt } from "@/lib/encryption"
import {
  checkZoomSafetyLock,
  canAddZoomAccount,
  type SafetyLockResult,
  type CanAddAccountResult,
} from "@/lib/zoom/safety-lock"
import {
  verifyZoomCredentials,
  getZoomAccessToken,
  type ZoomAccountRecord,
} from "@/lib/zoom/client"

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

import { requireStaffUser } from "@/lib/auth/staff"
import { recordAudit } from "@/lib/audit/record"
import { ADMIN_ROLES, SUPERADMIN_ONLY, getStaffRole } from "@/lib/auth/staff-role"

export interface AuthContext {
  id: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

async function getAuthenticatedAdmin(
  customUser?: AuthContext | null
): Promise<AuthContext | null> {
  return requireStaffUser(customUser, ADMIN_ROLES)
}

async function getAuthenticatedSuperadmin(
  customUser?: AuthContext | null
): Promise<AuthContext | null> {
  return requireStaffUser(customUser, SUPERADMIN_ONLY)
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
  const superadmin = await getAuthenticatedSuperadmin(options.currentUser)
  if (!superadmin) {
    return {
      success: false,
      error: "Akses ditolak: Hanya peran Superadmin yang berwenang menambah akun Zoom.",
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

  // Enforce platform limit: Max 4 Zoom accounts
  const canAdd = options.canAddCheck
    ? await options.canAddCheck()
    : await canAddZoomAccount()

  if (!canAdd.allowed) {
    return {
      success: false,
      error:
        canAdd.error ||
        "Batas platform tercapai: Solulu dibatasi maksimal 4 akun Zoom.",
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

  try {
    const inserted = await db.transaction(async (tx) => {
      const [row] = await tx.insert(zoomAccounts).values(payload).returning()
      await recordAudit(tx, {
        actor: superadmin,
        action: "zoom_account.create",
        entityType: "zoom_account",
        entityId: row.id,
        before: null,
        after: row,
      })
      return row
    })
    return { success: true, data: inserted }
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return {
        success: false,
        error: `Email "${email}" sudah terdaftar pada akun Zoom lain. Gunakan email berbeda atau perbarui akun yang sudah ada.`,
      }
    }
    return {
      success: false,
      error: `Gagal menyimpan akun Zoom: ${err?.message || "Kesalahan database"}`,
    }
  }
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
  const superadmin = await getAuthenticatedSuperadmin(options.currentUser)
  if (!superadmin) {
    return {
      success: false,
      error: "Akses ditolak: Hanya peran Superadmin yang berwenang memperbarui akun Zoom.",
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

  try {
    const updated = await db.transaction(async (tx) => {
      const [before] = await tx.select().from(zoomAccounts).where(eq(zoomAccounts.id, id)).limit(1)
      const [row] = await tx
        .update(zoomAccounts)
        .set(dataToUpdate)
        .where(eq(zoomAccounts.id, id))
        .returning()
      await recordAudit(tx, {
        actor: superadmin,
        action: "zoom_account.update",
        entityType: "zoom_account",
        entityId: id,
        before,
        after: row,
      })
      return row
    })

    return { success: true, data: updated }
  } catch (err: any) {
    if (err?.code === "23505" || err?.message?.includes("unique")) {
      return {
        success: false,
        error: "Email sudah terdaftar pada akun Zoom lain.",
      }
    }
    return {
      success: false,
      error: `Gagal memperbarui akun Zoom: ${err?.message || "Kesalahan database"}`,
    }
  }
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
  const superadmin = await getAuthenticatedSuperadmin(options.currentUser)
  if (!superadmin) {
    return {
      success: false,
      error: "Akses ditolak: Hanya peran Superadmin yang berwenang menghapus akun Zoom.",
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

  await db.transaction(async (tx) => {
    const [before] = await tx.select().from(zoomAccounts).where(eq(zoomAccounts.id, id)).limit(1)
    await tx.delete(zoomAccounts).where(eq(zoomAccounts.id, id))
    await recordAudit(tx, {
      actor: superadmin,
      action: "zoom_account.delete",
      entityType: "zoom_account",
      entityId: id,
      before,
      after: null,
    })
  })
  return { success: true }
}

export interface TestConnectionOptions {
  currentUser?: AuthContext | null
  getAccount?: (id: string) => Promise<any>
  verifyFn?: typeof verifyZoomCredentials
  getTokenFn?: typeof getZoomAccessToken
}

export async function handleTestZoomConnection(
  id: string,
  options: TestConnectionOptions = {}
): Promise<ActionResult> {
  const superadmin = await getAuthenticatedSuperadmin(options.currentUser)
  if (!superadmin) {
    return {
      success: false,
      error: "Akses ditolak: Hanya peran Superadmin yang berwenang menguji koneksi Zoom.",
    }
  }

  let account: any
  if (options.getAccount) {
    account = await options.getAccount(id)
  } else {
    const [row] = await db
      .select()
      .from(zoomAccounts)
      .where(eq(zoomAccounts.id, id))
    account = row
  }

  if (!account) {
    return {
      success: false,
      error: "Akun Zoom tidak ditemukan.",
    }
  }

  let decryptedSecret = ""
  try {
    decryptedSecret = decrypt(account.clientSecretEncrypted)
  } catch {
    return {
      success: false,
      error: "Gagal mendekripsi clientSecret akun Zoom.",
    }
  }

  const verifyFn = options.verifyFn ?? verifyZoomCredentials
  const verifyResult = await verifyFn({
    accountId: account.accountId,
    clientId: account.clientId,
    clientSecret: decryptedSecret,
  })

  if (!verifyResult.valid) {
    return {
      success: false,
      error: verifyResult.error || "Koneksi ke Zoom gagal.",
    }
  }

  // Pre-fetch & cache token to DB
  try {
    const getTokenFn = options.getTokenFn ?? getZoomAccessToken
    await getTokenFn(account)
  } catch (err: any) {
    return {
      success: false,
      error: `Kredensial valid, namun gagal menyimpan token: ${err.message}`,
    }
  }

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

export async function testZoomConnectionAction(
  id: string
): Promise<ActionResult> {
  const result = await handleTestZoomConnection(id)
  if (result.success) {
    revalidatePath("/admin/zoom-settings")
  }
  return result
}

export async function getZoomAccountsAction(options?: {
  currentUser?: AuthContext | null
}): Promise<{
  success: boolean
  accounts?: ZoomAccountView[]
  isSuperadmin?: boolean
  error?: string
}> {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error:
        "Akses ditolak: Diperlukan role Admin atau Superadmin untuk melihat pengaturan Zoom.",
    }
  }

  const role = getStaffRole(admin)
  const userIsSuperadmin = role === "superadmin"

  const rows = await db
    .select()
    .from(zoomAccounts)
    .orderBy(zoomAccounts.accountNumber)

  const accounts: ZoomAccountView[] = await Promise.all(
    rows.map(async (acc) => {
      let rawSecret = ""
      if (userIsSuperadmin) {
        try {
          rawSecret = decrypt(acc.clientSecretEncrypted)
        } catch {
          rawSecret = "error_decrypting"
        }
      }

      const masked = "••••••••••••"

      const safetyLock = await checkZoomSafetyLock(acc.id)

      return {
        id: acc.id,
        accountNumber: acc.accountNumber ?? 1,
        name: acc.name,
        email: acc.email,
        accountId: acc.accountId,
        clientId: acc.clientId,
        maskedClientSecret: masked,
        decryptedSecret: userIsSuperadmin && rawSecret ? rawSecret : undefined,
        tokenExpiresAt: acc.tokenExpiresAt ? acc.tokenExpiresAt.toISOString() : null,
        hostKey: acc.hostKey || null,
        isActive: acc.isActive,
        createdAt: acc.createdAt.toISOString(),
        safetyLock,
      }
    })
  )

  return { success: true, accounts, isSuperadmin: userIsSuperadmin }
}

export async function revealZoomClientSecretAction(
  accountId: string,
  options?: { currentUser?: AuthContext | null }
): Promise<{ success: boolean; secret?: string; error?: string }> {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return { success: false, error: "Akses ditolak: Silakan login terlebih dahulu." }
  }

  const role = getStaffRole(admin)
  if (role !== "superadmin") {
    return {
      success: false,
      error: "Akses ditolak: Hanya peran Superadmin yang berwenang melihat Client Secret akun Zoom.",
    }
  }

  const [acc] = await db
    .select({ clientSecretEncrypted: zoomAccounts.clientSecretEncrypted })
    .from(zoomAccounts)
    .where(eq(zoomAccounts.id, accountId))
    .limit(1)

  if (!acc) {
    return { success: false, error: "Akun Zoom tidak ditemukan." }
  }

  try {
    const decrypted = decrypt(acc.clientSecretEncrypted)
    return { success: true, secret: decrypted }
  } catch (err: any) {
    return { success: false, error: "Gagal mendekripsi Client Secret: " + err.message }
  }
}


export interface TimelineSessionView {
  bookingId: string
  patientName: string
  counselorName: string
  date: string
  startTime: string
  endTime: string
  status: string
  zoomAccountId: string | null
}

export interface GetTimelineSessionsOptions {
  currentUser?: AuthContext | null
  querySessions?: (dateStr: string) => Promise<TimelineSessionView[]>
}

export async function handleGetTimelineSessions(
  dateStr: string,
  options: GetTimelineSessionsOptions = {}
): Promise<{
  success: boolean
  sessions?: TimelineSessionView[]
  error?: string
}> {
  const admin = await getAuthenticatedAdmin(options.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk melihat jadwal timeline.",
    }
  }

  if (options.querySessions) {
    const sessions = await options.querySessions(dateStr)
    return { success: true, sessions }
  }

  const rows = await db
    .select({
      bookingId: bookings.id,
      patientName: bookings.patientName,
      counselorName: counselors.fullName,
      date: schedules.date,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      status: bookings.status,
      zoomAccountId: bookings.zoomAccountId,
    })
    .from(bookings)
    .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
    .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
    .where(
      and(
        eq(schedules.date, dateStr),
        inArray(bookings.status, ["confirmed", "pending_payment"])
      )
    )

  const sessions: TimelineSessionView[] = rows.map((r) => ({
    bookingId: r.bookingId,
    patientName: r.patientName,
    counselorName: r.counselorName ?? "Konselor Solulu",
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    status: r.status,
    zoomAccountId: r.zoomAccountId,
  }))

  return { success: true, sessions }
}

export async function getTimelineSessionsAction(
  dateStr: string
): Promise<{
  success: boolean
  sessions?: TimelineSessionView[]
  error?: string
}> {
  return handleGetTimelineSessions(dateStr)
}

export async function getZoomTelemetryAction(): Promise<{
  success: boolean
  activeCount: number
  totalConfigured: number
  statusText: string
}> {
  try {
    const rows = await db
      .select({
        id: zoomAccounts.id,
        isActive: zoomAccounts.isActive,
      })
      .from(zoomAccounts)

    const activeCount = rows.filter((r) => r.isActive).length
    const totalConfigured = rows.length

    return {
      success: true,
      activeCount,
      totalConfigured,
      statusText: `${activeCount}/2 Siap`,
    }
  } catch {
    return {
      success: true,
      activeCount: 1,
      totalConfigured: 1,
      statusText: "1/2 Siap",
    }
  }
}

