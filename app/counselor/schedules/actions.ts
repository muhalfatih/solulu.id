"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { eq, and, sql, desc } from "drizzle-orm"
import { db } from "@/db"
import { schedules, counselors } from "@/db/schema"
import { createClient } from "@/lib/supabase/server"
import {
  computeEndTime,
  formatTimeRange,
  checkSelfOverlap,
  canCancelSlot,
  isTimeRangeOverlapping,
  type SlotInterval,
} from "@/lib/schedules/concurrency"
import {
  createScheduleSlotsSchema,
  cancelScheduleSlotSchema,
  type CreateScheduleSlotsInput,
  type CancelScheduleSlotInput,
} from "@/lib/validations/schedules"

export interface AuthContext {
  id: string
  counselorId?: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // Safely ignore when called outside active Next.js request context (e.g. Vitest)
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getAuthenticatedCounselor(
  customUser?: AuthContext | null
): Promise<AuthContext | null> {
  if (customUser !== undefined) {
    if (!customUser) return null
    const role = customUser.app_metadata?.role || customUser.user_metadata?.role
    return role === "counselor" ? customUser : null
  }

  try {
    const cookieStore = await cookies()
    const demoRole = cookieStore.get("solulu_demo_role")?.value
    if (demoRole === "counselor") {
      return {
        id: "demo-counselor-id",
        counselorId: "e28eb17e-b7cd-43bc-8a30-d67a221342f3", // Sarah Annisa (DB UUID)
        app_metadata: { role: "counselor" },
        user_metadata: { role: "counselor" },
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null
    const role = user.app_metadata?.role || user.user_metadata?.role
    if (role !== "counselor") return null

    return {
      id: user.id,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    }
  } catch {
    return null
  }
}

/**
 * Resolves the database counselor record ID for the authenticated user.
 */
async function resolveCounselorId(auth: AuthContext): Promise<string | null> {
  if (auth.counselorId && UUID_REGEX.test(auth.counselorId)) {
    return auth.counselorId
  }

  try {
    if (auth.id && UUID_REGEX.test(auth.id)) {
      const found = await db
        .select({ id: counselors.id })
        .from(counselors)
        .where(eq(counselors.userId, auth.id))
        .limit(1)

      if (found.length > 0) {
        return found[0].id
      }
    }

    // Try finding Sarah Annisa specifically
    const sarah = await db
      .select({ id: counselors.id })
      .from(counselors)
      .where(sql`${counselors.fullName} ILIKE '%Sarah Annisa%'`)
      .limit(1)

    if (sarah.length > 0) {
      return sarah[0].id
    }

    // Fallback for demo counselor
    const anyCounselor = await db
      .select({ id: counselors.id })
      .from(counselors)
      .where(eq(counselors.isActive, true))
      .limit(1)

    if (anyCounselor.length > 0) {
      return anyCounselor[0].id
    }

    const any = await db
      .select({ id: counselors.id })
      .from(counselors)
      .limit(1)

    return any.length > 0 ? any[0].id : (auth.counselorId || "c-1")
  } catch {
    return auth.counselorId || "c-1"
  }
}

export interface ScheduleItemView {
  id: string
  counselorId: string
  date: string
  startTime: string
  endTime: string
  timeRange: string
  status: "available" | "reserved" | "booked" | "cancelled"
  canCancel: boolean
  cancelRestrictionReason?: string
}

/**
 * Server action to fetch schedule slots for the authenticated counselor.
 */
export async function getCounselorSchedulesAction(
  dateFilter?: string,
  options?: {
    currentUser?: AuthContext | null
    getSchedules?: (counselorId: string, date?: string) => Promise<any[]>
  }
): Promise<ActionResponse<ScheduleItemView[]>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  try {
    const counselorId = await resolveCounselorId(auth)
    if (!counselorId) {
      return {
        success: false,
        error: "Profil mitra konselor tidak ditemukan.",
      }
    }

    let rows: any[] = []

    if (options?.getSchedules) {
      rows = await options.getSchedules(counselorId, dateFilter)
    } else {
      const conditions = [eq(schedules.counselorId, counselorId)]
      if (dateFilter) {
        conditions.push(eq(schedules.date, dateFilter))
      }

      rows = await db
        .select()
        .from(schedules)
        .where(and(...conditions))
        .orderBy(desc(schedules.date), schedules.startTime)
    }

    const items: ScheduleItemView[] = rows.map((r) => {
      const cancelCheck = canCancelSlot(r.status)
      return {
        id: r.id,
        counselorId: r.counselorId,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        timeRange: formatTimeRange(r.startTime, r.endTime),
        status: r.status,
        canCancel: cancelCheck.allowed,
        cancelRestrictionReason: cancelCheck.reason,
      }
    })

    return {
      success: true,
      data: items,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memuat jadwal praktik",
    }
  }
}

/**
 * Server action to create 90-minute schedule slots for the counselor.
 * Automatically computes endTime (+90 mins) and rejects self-overlapping slots.
 */
export async function createScheduleSlotsAction(
  rawInput: CreateScheduleSlotsInput,
  options?: {
    currentUser?: AuthContext | null
    checkExistingSlots?: (counselorId: string, date: string) => Promise<SlotInterval[]>
    insertSlots?: (records: any[]) => Promise<any[]>
  }
): Promise<ActionResponse<{ count: number; slots: ScheduleItemView[] }>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  const parsed = createScheduleSlotsSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "Data pembuatan slot tidak valid",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { date, startTimes } = parsed.data

  try {
    const counselorId = await resolveCounselorId(auth)
    if (!counselorId) {
      return {
        success: false,
        error: "Profil mitra konselor tidak ditemukan.",
      }
    }

    // 1. Prepare candidate slots with auto-computed endTime (+90 min)
    const proposedSlots: Array<{ startTime: string; endTime: string }> = []
    for (const st of startTimes) {
      const et = computeEndTime(st)
      proposedSlots.push({ startTime: st, endTime: et })
    }

    // 2. Check for internal overlap among proposed slots
    for (let i = 0; i < proposedSlots.length; i++) {
      for (let j = i + 1; j < proposedSlots.length; j++) {
        if (
          isTimeRangeOverlapping(
            proposedSlots[i].startTime,
            proposedSlots[i].endTime,
            proposedSlots[j].startTime,
            proposedSlots[j].endTime
          )
        ) {
          const rangeA = formatTimeRange(proposedSlots[i].startTime, proposedSlots[i].endTime)
          const rangeB = formatTimeRange(proposedSlots[j].startTime, proposedSlots[j].endTime)
          return {
            success: false,
            error: `Slot yang diajukan saling bertabrakan: ${rangeA} dan ${rangeB}. Setiap sesi konseling berdurasi 90 menit.`,
          }
        }
      }
    }

    // 3. Fetch existing non-cancelled slots for this counselor on this date
    let existingSlots: SlotInterval[] = []
    if (options?.checkExistingSlots) {
      existingSlots = await options.checkExistingSlots(counselorId, date)
    } else {
      const existingRows = await db
        .select({
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          status: schedules.status,
        })
        .from(schedules)
        .where(and(eq(schedules.counselorId, counselorId), eq(schedules.date, date)))

      existingSlots = existingRows
    }

    // 4. Check for self-overlap against existing slots
    for (const slot of proposedSlots) {
      const hasOverlap = checkSelfOverlap(existingSlots, slot.startTime, slot.endTime)
      if (hasOverlap) {
        const slotRange = formatTimeRange(slot.startTime, slot.endTime)
        return {
          success: false,
          error: `Slot ${slotRange} bertabrakan dengan jadwal Anda yang sudah ada pada tanggal ${date}.`,
        }
      }
    }

    // 5. Insert new slots into database
    const recordsToInsert = proposedSlots.map((slot) => ({
      counselorId,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: "available" as const,
    }))

    let insertedRecords: any[] = []
    if (options?.insertSlots) {
      insertedRecords = await options.insertSlots(recordsToInsert)
    } else {
      insertedRecords = await db.insert(schedules).values(recordsToInsert).returning()
    }

    const createdViews: ScheduleItemView[] = insertedRecords.map((r) => ({
      id: r.id,
      counselorId: r.counselorId,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      timeRange: formatTimeRange(r.startTime, r.endTime),
      status: r.status,
      canCancel: true,
    }))

    safeRevalidatePath("/counselor/schedules")
    safeRevalidatePath("/counselors")

    return {
      success: true,
      data: {
        count: createdViews.length,
        slots: createdViews,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal membuat slot jadwal baru",
    }
  }
}

/**
 * Server action to cancel an existing available schedule slot.
 * Protected: 'reserved' and 'booked' slots cannot be cancelled.
 */
export async function cancelScheduleSlotAction(
  rawInput: CancelScheduleSlotInput,
  options?: {
    currentUser?: AuthContext | null
    getSlot?: (id: string) => Promise<any>
    updateSlot?: (id: string, status: string) => Promise<any>
  }
): Promise<ActionResponse<{ scheduleId: string; status: string }>> {
  const auth = await getAuthenticatedCounselor(options?.currentUser)
  if (!auth) {
    return {
      success: false,
      error: "Akses ditolak: Anda harus masuk sebagai Mitra Konselor.",
    }
  }

  const parsed = cancelScheduleSlotSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: "ID slot tidak valid",
    }
  }

  const { scheduleId } = parsed.data

  try {
    const counselorId = await resolveCounselorId(auth)

    // 1. Fetch slot
    let slot: any = null
    if (options?.getSlot) {
      slot = await options.getSlot(scheduleId)
    } else {
      const found = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, scheduleId))
        .limit(1)

      slot = found[0] || null
    }

    if (!slot) {
      return {
        success: false,
        error: "Slot jadwal tidak ditemukan.",
      }
    }

    // 2. Verify ownership (unless admin)
    if (slot.counselorId !== counselorId && auth.app_metadata?.role !== "admin") {
      return {
        success: false,
        error: "Anda tidak memiliki wewenang untuk membatalkan slot konselor lain.",
      }
    }

    // 3. Verify cancellation guard
    const cancelCheck = canCancelSlot(slot.status)
    if (!cancelCheck.allowed) {
      return {
        success: false,
        error: cancelCheck.reason || "Slot tidak dapat dibatalkan dalam status saat ini.",
      }
    }

    // 4. Update status to 'cancelled'
    if (options?.updateSlot) {
      await options.updateSlot(scheduleId, "cancelled")
    } else {
      await db
        .update(schedules)
        .set({ status: "cancelled" })
        .where(eq(schedules.id, scheduleId))
    }

    safeRevalidatePath("/counselor/schedules")
    safeRevalidatePath("/counselors")

    return {
      success: true,
      data: {
        scheduleId,
        status: "cancelled",
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal membatalkan slot jadwal",
    }
  }
}
