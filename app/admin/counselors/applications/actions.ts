"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq, desc } from "drizzle-orm"
import { db } from "@/db"
import { counselorApplications, counselors } from "@/db/schema"
import { generatePresignedGetUrl } from "@/lib/r2"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  reviewApplicationInputSchema,
  type ReviewApplicationInput,
} from "@/lib/validations/counselor-application"

export interface AdminAuthContext {
  id: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

async function getAuthenticatedAdmin(
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
 * Lists counselor applications with optional status filter.
 */
export async function getCounselorApplicationsAction(
  options?: {
    currentUser?: AdminAuthContext | null
    fetchApplicationsFn?: () => Promise<any[]>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk mengakses berkas aplikasi.",
    }
  }

  try {
    const fetchApplications =
      options?.fetchApplicationsFn ||
      (async () => {
        return db
          .select()
          .from(counselorApplications)
          .orderBy(desc(counselorApplications.createdAt))
      })

    const applications = await fetchApplications()
    return {
      success: true,
      data: applications,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil daftar aplikasi konselor.",
    }
  }
}

/**
 * Generates a 15-minute presigned GET URL for viewing private applicant documents (CV, KTP, Ijazah, STR).
 */
export async function getApplicationDocumentUrlAction(
  input: {
    applicationId: string
    documentType: "cv" | "ktp" | "diploma" | "str"
  },
  options?: {
    currentUser?: AdminAuthContext | null
    fetchApplicationFn?: (id: string) => Promise<any>
    presigner?: typeof generatePresignedGetUrl
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
    const fetchApplication =
      options?.fetchApplicationFn ||
      (async (id: string) => {
        const rows = await db
          .select()
          .from(counselorApplications)
          .where(eq(counselorApplications.id, id))
          .limit(1)
        return rows[0] || null
      })

    const application = await fetchApplication(input.applicationId)
    if (!application) {
      return {
        success: false,
        error: "Data aplikasi tidak ditemukan.",
      }
    }

    let r2Key: string | null = null
    switch (input.documentType) {
      case "cv":
        r2Key = application.cvR2Key
        break
      case "ktp":
        r2Key = application.ktpR2Key
        break
      case "diploma":
        r2Key = application.diplomaR2Key
        break
      case "str":
        r2Key = application.strR2Key
        break
    }

    if (!r2Key) {
      return {
        success: false,
        error: `Dokumen ${input.documentType.toUpperCase()} tidak tersedia untuk aplikasi ini.`,
      }
    }

    const presigner = options?.presigner || generatePresignedGetUrl
    const url = await presigner({
      key: r2Key,
      expiresIn: 900, // 15 minutes as per Solulu PRD spec
    })

    return {
      success: true,
      data: {
        url,
        expiresInSeconds: 900,
        documentType: input.documentType,
        applicantName: application.fullName,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menghasilkan tautan dokumen.",
    }
  }
}

/**
 * Reviews a counselor application: Approve or Reject.
 * On approval: triggers Supabase Auth invitation email, creates counselor table record, updates application status.
 * Gracefully handles Supabase Auth 4/hour rate limits.
 */
export async function reviewCounselorApplicationAction(
  input: ReviewApplicationInput,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchApplicationFn?: (id: string) => Promise<any>
    inviteUserFn?: (email: string, metadata: any) => Promise<{ data: any; error: any }>
    insertCounselorFn?: (record: any) => Promise<any>
    updateApplicationFn?: (id: string, update: any) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  const parsed = reviewApplicationInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Parameter review aplikasi tidak valid.",
    }
  }

  const { applicationId, status, rejectionReason, title } = parsed.data

  try {
    const fetchApplication =
      options?.fetchApplicationFn ||
      (async (id: string) => {
        const rows = await db
          .select()
          .from(counselorApplications)
          .where(eq(counselorApplications.id, id))
          .limit(1)
        return rows[0] || null
      })

    const application = await fetchApplication(applicationId)
    if (!application) {
      return {
        success: false,
        error: "Aplikasi mitra konselor tidak ditemukan.",
      }
    }

    if (application.status !== "pending") {
      return {
        success: false,
        error: `Aplikasi ini sudah berstatus ${application.status}.`,
      }
    }

    const updateApplication =
      options?.updateApplicationFn ||
      (async (id: string, update: any) => {
        const [updated] = await db
          .update(counselorApplications)
          .set(update)
          .where(eq(counselorApplications.id, id))
          .returning()
        return updated
      })

    // Handle Rejection
    if (status === "rejected") {
      await updateApplication(applicationId, {
        status: "rejected",
        rejectionReason: rejectionReason?.trim() || null,
      })

      try {
        revalidatePath("/admin/counselors/applications")
        revalidatePath("/admin/counselors")
      } catch {
        // Outside Next request lifecycle (e.g. unit tests)
      }

      return {
        success: true,
        message: `Aplikasi atas nama ${application.fullName} telah ditolak.`,
      }
    }

    // Handle Approval
    const inviteUser =
      options?.inviteUserFn ||
      (async (email: string, metadata: any) => {
        const supabaseAdmin = createAdminClient()
        return supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: metadata,
        })
      })

    const inviteResult = await inviteUser(application.email, {
      role: "counselor",
      full_name: application.fullName,
      counselor_type: application.counselorType,
    })

    if (inviteResult.error) {
      const err = inviteResult.error
      const errorMsg = (err.message || "").toLowerCase()
      const isRateLimit =
        err.status === 429 ||
        errorMsg.includes("rate limit") ||
        errorMsg.includes("over_email_send_rate_limit") ||
        errorMsg.includes("too many requests")

      if (isRateLimit) {
        return {
          success: false,
          error:
            "Batas pengiriman email Supabase (4 undangan per jam) telah tercapai. Harap tunggu beberapa saat sebelum menyetujui akun ini.",
          isRateLimit: true,
        }
      }

      return {
        success: false,
        error: `Gagal mengirim undangan akun konselor: ${err.message}`,
      }
    }

    const authUserId = inviteResult.data?.user?.id
    if (!authUserId) {
      return {
        success: false,
        error: "Gagal memperoleh ID pengguna dari layanan autentikasi Supabase.",
      }
    }

    // Create record in counselors table
    const defaultTitle =
      application.counselorType === "psychologist"
        ? "M.Psi., Psikolog"
        : "S.Psi"

    const insertCounselor =
      options?.insertCounselorFn ||
      (async (record: any) => {
        const [counselor] = await db
          .insert(counselors)
          .values(record)
          .returning()
        return counselor
      })

    const newCounselor = await insertCounselor({
      userId: authUserId,
      fullName: application.fullName,
      title: title?.trim() || defaultTitle,
      counselorType: application.counselorType,
      bio: application.bio,
      isActive: true,
    })

    // Update application status to approved
    await updateApplication(applicationId, {
      status: "approved",
    })

    try {
      revalidatePath("/admin/counselors/applications")
      revalidatePath("/admin/counselors")
    } catch {
      // Outside Next request lifecycle (e.g. unit tests)
    }

    return {
      success: true,
      message: `Aplikasi ${application.fullName} berhasil disetujui. Undangan aktivasi telah dikirimkan ke ${application.email}.`,
      counselorId: newCounselor?.id,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Terjadi kesalahan saat memproses review aplikasi.",
    }
  }
}
