"use server"

import { db } from "@/db"
import { counselorApplications } from "@/db/schema"
import {
  counselorApplicationInputSchema,
  presignedUploadRequestSchema,
  type CounselorApplicationInput,
  type PresignedUploadRequest,
} from "@/lib/validations/counselor-application"
import { generateR2Key, generatePresignedPutUrl } from "@/lib/r2"
import { eq } from "drizzle-orm"

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

/**
 * Server action to obtain a presigned PUT URL for direct R2 document upload.
 * Documents bypass Vercel server memory/bandwidth limits.
 */
export async function getPresignedUploadUrlAction(
  input: PresignedUploadRequest,
  options?: {
    presigner?: typeof generatePresignedPutUrl
  }
): Promise<ActionResponse<{ uploadUrl: string; r2Key: string }>> {
  const parsed = presignedUploadRequestSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Parameter upload berkas tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fileType, fileName, category } = parsed.data
  const r2Key = generateR2Key(`counselor-applications/${category}`, fileName)

  try {
    const presigner = options?.presigner || generatePresignedPutUrl
    const { uploadUrl } = await presigner({
      key: r2Key,
      contentType: fileType,
      expiresIn: 3600, // 1 hour for client to finish upload
    })

    return {
      success: true,
      data: {
        uploadUrl,
        r2Key,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menghasilkan URL upload berkas",
    }
  }
}

/**
 * Server action to submit a prospective counselor's application.
 */
export async function submitCounselorApplicationAction(
  input: CounselorApplicationInput,
  options?: {
    insertFn?: (data: any) => Promise<any>
    findExistingFn?: (email: string) => Promise<any>
  }
): Promise<ActionResponse<{ applicationId: string }>> {
  const parsed = counselorApplicationInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: "Data formulir aplikasi tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const data = parsed.data

  try {
    // 1. Check if application already exists for this email
    const findExisting =
      options?.findExistingFn ||
      (async (email: string) => {
        const existing = await db
          .select()
          .from(counselorApplications)
          .where(eq(counselorApplications.email, email))
          .limit(1)
        return existing[0] || null
      })

    const existing = await findExisting(data.email)
    if (existing && existing.status === "pending") {
      return {
        success: false,
        error: "Aplikasi dengan alamat email ini sedang dalam proses verifikasi admin.",
      }
    }

    if (existing && existing.status === "approved") {
      return {
        success: false,
        error: "Akun mitra konselor dengan email ini sudah terdaftar dan aktif.",
      }
    }

    // 2. Insert new counselor application record
    const insertFn =
      options?.insertFn ||
      (async (record: any) => {
        const [inserted] = await db
          .insert(counselorApplications)
          .values(record)
          .returning()
        return inserted
      })

    const newRecord = await insertFn({
      fullName: data.fullName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      counselorType: data.counselorType,
      bio: data.bio.trim(),
      cvR2Key: data.cvR2Key,
      ktpR2Key: data.ktpR2Key,
      diplomaR2Key: data.diplomaR2Key,
      strR2Key: data.strR2Key || null,
      status: "pending",
      agreedToTermsAt: new Date(),
    })

    return {
      success: true,
      data: {
        applicationId: newRecord.id,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menyimpan aplikasi mitra konselor",
    }
  }
}
