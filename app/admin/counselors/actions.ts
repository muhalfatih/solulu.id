"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq, desc, sql } from "drizzle-orm"
import { db } from "@/db"
import { counselors, schedules, bookings } from "@/db/schema"
import { generatePresignedPutUrl, generateR2Key, getPublicR2Url, getR2Config } from "@/lib/r2"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  createCounselorAdminSchema,
  updateCounselorAdminSchema,
  type CreateCounselorAdminInput,
  type UpdateCounselorAdminInput,
} from "@/lib/validations/counselor-admin"

export interface AdminAuthContext {
  id: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

export async function getAuthenticatedAdmin(
  customUser?: AdminAuthContext | null
): Promise<AdminAuthContext | null> {
  if (customUser !== undefined) {
    if (!customUser) return null
    const role = customUser.app_metadata?.role || customUser.user_metadata?.role
    return role === "admin" ? customUser : null
  }

  try {
    const cookieStore = await cookies()
    const demoRole = cookieStore.get("solulu_demo_role")?.value
    if (demoRole === "admin") {
      return {
        id: "demo-admin-id",
        app_metadata: { role: "admin" },
        user_metadata: { role: "admin" },
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null
    const role = user.app_metadata?.role || user.user_metadata?.role
    return role === "admin" ? user : null
  } catch {
    return null
  }
}

/**
 * Fetches all counselors for the admin directory, including total sessions and active slot counts.
 */
export async function getCounselorsAdminAction(options?: {
  currentUser?: AdminAuthContext | null
  fetchFn?: () => Promise<any[]>
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk melihat daftar konselor.",
    }
  }

  try {
    if (options?.fetchFn) {
      const data = await options.fetchFn()
      return { success: true, data }
    }

    // Query counselors with schedule/booking stats
    const rows = await db
      .select({
        id: counselors.id,
        userId: counselors.userId,
        fullName: counselors.fullName,
        title: counselors.title,
        counselorType: counselors.counselorType,
        bio: counselors.bio,
        specializations: counselors.specializations,
        avatarR2Url: counselors.avatarR2Url,
        isActive: counselors.isActive,
        createdAt: counselors.createdAt,
      })
      .from(counselors)
      .orderBy(desc(counselors.createdAt))

    // Augment with counts
    const augmented = await Promise.all(
      rows.map(async (c) => {
        try {
          const [activeSlots] = await db
            .select({ count: sql<number>`count(*)` })
            .from(schedules)
            .where(
              sql`${schedules.counselorId} = ${c.id} AND ${schedules.status} = 'available' AND ${schedules.date} >= CURRENT_DATE`
            )

          const [completedSessions] = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(
              sql`${bookings.counselorId} = ${c.id} AND ${bookings.status} IN ('confirmed', 'completed')`
            )

          return {
            ...c,
            activeSlotsCount: Number(activeSlots?.count || 0),
            completedSessionsCount: Number(completedSessions?.count || 0),
          }
        } catch {
          return {
            ...c,
            activeSlotsCount: 0,
            completedSessionsCount: 0,
          }
        }
      })
    )

    return { success: true, data: augmented }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memuat daftar mitra konselor.",
    }
  }
}

/**
 * Fetches single counselor by ID for editing.
 */
export async function getCounselorByIdAction(
  counselorId: string,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchFn?: (id: string) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    if (options?.fetchFn) {
      const data = await options.fetchFn(counselorId)
      return { success: true, data }
    }

    const rows = await db
      .select()
      .from(counselors)
      .where(eq(counselors.id, counselorId))
      .limit(1)

    if (!rows.length) {
      return { success: false, error: "Mitra konselor tidak ditemukan." }
    }

    return { success: true, data: rows[0] }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil data konselor.",
    }
  }
}

/**
 * Generates presigned PUT URL for direct public avatar upload to Cloudflare R2.
 */
export async function getAvatarUploadPresignedUrlAction(
  fileName: string,
  contentType: string,
  options?: {
    currentUser?: AdminAuthContext | null
    presigner?: typeof generatePresignedPutUrl
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const key = generateR2Key("avatars", fileName)
    const presigner = options?.presigner || generatePresignedPutUrl
    const publicBucket = getR2Config().publicBucketName || "solulu-public"

    const { uploadUrl } = await presigner({
      bucket: publicBucket,
      key,
      contentType,
      expiresIn: 3600,
    })

    const publicUrl = getPublicR2Url(key)

    return {
      success: true,
      data: {
        uploadUrl,
        publicUrl,
        key,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menghasilkan URL unggah avatar.",
    }
  }
}

/**
 * Registers a new counselor manually:
 * 1. Creates Supabase Auth user via admin API with email & password.
 * 2. Inserts counselor into database.
 * 3. Rolls back auth user if db insert fails.
 */
export async function createCounselorAction(
  input: CreateCounselorAdminInput,
  options?: {
    currentUser?: AdminAuthContext | null
    createUserFn?: (payload: any) => Promise<{ data: any; error: any }>
    deleteUserFn?: (id: string) => Promise<any>
    insertCounselorFn?: (record: any) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk mendaftarkan konselor.",
    }
  }

  const parsed = createCounselorAdminSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data formulir konselor tidak valid.",
    }
  }

  const data = parsed.data
  let createdAuthUserId: string | null = null

  try {
    // 1. Create Supabase Auth User
    if (options?.createUserFn) {
      const authRes = await options.createUserFn({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.fullName,
          role: "counselor",
        },
        app_metadata: {
          role: "counselor",
        },
      })
      if (authRes.error) {
        return {
          success: false,
          error: `Gagal membuat akun autentikasi: ${authRes.error.message || "Email mungkin sudah terdaftar"}`,
        }
      }
      createdAuthUserId = authRes.data.user.id
    } else {
      const supabaseAdmin = createAdminClient()
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
          full_name: data.fullName,
          role: "counselor",
        },
        app_metadata: {
          role: "counselor",
        },
      })

      if (authError || !authData?.user) {
        return {
          success: false,
          error: `Gagal membuat akun login konselor: ${authError?.message || "Email sudah terdaftar"}`,
        }
      }
      createdAuthUserId = authData.user.id
    }

    // 2. Insert into counselors table
    const recordPayload = {
      userId: createdAuthUserId,
      fullName: data.fullName,
      title: data.title,
      counselorType: data.counselorType,
      bio: data.bio,
      specializations: data.specializations,
      avatarR2Url: data.avatarR2Url || null,
      isActive: data.isActive,
    }

    let insertedRecord: any = null
    if (options?.insertCounselorFn) {
      insertedRecord = await options.insertCounselorFn(recordPayload)
    } else {
      const [inserted] = await db
        .insert(counselors)
        .values(recordPayload as any)
        .returning()
      insertedRecord = inserted
    }

    try {
      revalidatePath("/admin/counselors")
      revalidatePath("/counselors")
    } catch {
      // safe fallback in test environments
    }

    return {
      success: true,
      message: `Mitra Konselor ${data.fullName} berhasil didaftarkan.`,
      data: insertedRecord,
    }
  } catch (err: any) {
    // Rollback Supabase user if created
    if (createdAuthUserId) {
      try {
        if (options?.deleteUserFn) {
          await options.deleteUserFn(createdAuthUserId)
        } else {
          const supabaseAdmin = createAdminClient()
          await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId)
        }
      } catch (rollbackErr) {
        console.error("Failed to rollback auth user creation:", rollbackErr)
      }
    }

    return {
      success: false,
      error: err.message || "Gagal menyimpan data mitra konselor ke database.",
    }
  }
}

/**
 * Updates an existing counselor's profile.
 */
export async function updateCounselorAction(
  counselorId: string,
  input: UpdateCounselorAdminInput,
  options?: {
    currentUser?: AdminAuthContext | null
    updateCounselorFn?: (id: string, record: any) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  const parsed = updateCounselorAdminSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data formulir update tidak valid.",
    }
  }

  const data = parsed.data

  try {
    const updatePayload = {
      fullName: data.fullName,
      title: data.title,
      counselorType: data.counselorType,
      bio: data.bio,
      specializations: data.specializations,
      avatarR2Url: data.avatarR2Url || null,
      isActive: data.isActive,
    }

    let updatedRecord: any = null
    if (options?.updateCounselorFn) {
      updatedRecord = await options.updateCounselorFn(counselorId, updatePayload)
    } else {
      const [updated] = await db
        .update(counselors)
        .set(updatePayload as any)
        .where(eq(counselors.id, counselorId))
        .returning()
      updatedRecord = updated
    }

    try {
      revalidatePath("/admin/counselors")
      revalidatePath(`/admin/counselors/${counselorId}/edit`)
      revalidatePath("/counselors")
    } catch {
      // safe fallback in test
    }

    return {
      success: true,
      message: `Profil konselor ${data.fullName} berhasil diperbarui.`,
      data: updatedRecord,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui profil konselor.",
    }
  }
}

/**
 * Toggles a counselor's active practicing status directly from table row.
 */
export async function toggleCounselorActiveAction(
  counselorId: string,
  newActiveState: boolean,
  options?: {
    currentUser?: AdminAuthContext | null
    toggleFn?: (id: string, state: boolean) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    let updatedRecord: any = null
    if (options?.toggleFn) {
      updatedRecord = await options.toggleFn(counselorId, newActiveState)
    } else {
      const [updated] = await db
        .update(counselors)
        .set({ isActive: newActiveState })
        .where(eq(counselors.id, counselorId))
        .returning()
      updatedRecord = updated
    }

    try {
      revalidatePath("/admin/counselors")
      revalidatePath("/counselors")
    } catch {
      // safe fallback
    }

    return {
      success: true,
      message: `Status praktik konselor berhasil diubah menjadi ${newActiveState ? "Aktif" : "Ditangguhkan"}.`,
      data: updatedRecord,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengubah status praktik konselor.",
    }
  }
}
