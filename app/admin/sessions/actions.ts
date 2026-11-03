"use server"

import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, transactions, zoomAccounts, sessionReports } from "@/db/schema"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/app/admin/counselors/actions"
import {
  confirmManualPayment,
  type ConfirmManualPaymentInput,
  type ManualPaymentDependencies,
  type ConfirmManualPaymentResult,
} from "@/lib/fulfillment/manual"
import { recordAudit } from "@/lib/audit/record"
import { evaluateNoShow, loadNoShowBookingFacts, noShowUpdate } from "@/lib/booking/no-show"

/**
 * Admin Server Action to verify and confirm manual bank transfer payments.
 * Triggers dynamic Zoom host allocation, updates transaction/booking/schedule,
 * and sends confirmation emails to patient and counselor.
 */
/** Booking pool belum punya jadwal; UUID nol tidak cocok dengan baris mana pun. */
const NO_SCHEDULE_ID = "00000000-0000-0000-0000-000000000000"

export async function confirmManualPaymentAction(
  input: ConfirmManualPaymentInput,
  deps?: ManualPaymentDependencies
): Promise<ConfirmManualPaymentResult> {
  const result = await confirmManualPayment(input, deps)

  if (result.success) {
    try {
      revalidatePath("/admin/sessions")
      revalidatePath("/counselors")
      revalidatePath("/booking")
      revalidatePath("/")
      if (input.bookingId) {
        const b = await db
          .select({ accessToken: bookings.accessToken })
          .from(bookings)
          .where(eq(bookings.id, input.bookingId))
          .limit(1)
        if (b.length > 0 && b[0].accessToken) {
          revalidatePath(`/session/${b[0].accessToken}`)
        }
      }
    } catch {
      // Safe outside Next request lifecycle
    }
  }

  return result
}

/**
 * Admin Server Action to fetch all guest booking sessions from real database.
 */
export async function getBookingsAdminAction(options?: {
  currentUser?: AdminAuthContext | null
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const [rows, accounts] = await Promise.all([
      db
        .select({
          booking: bookings,
          counselor: counselors,
          schedule: schedules,
          transaction: transactions,
          zoomAccount: zoomAccounts,
          report: sessionReports,
        })
        .from(bookings)
        .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
        .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .leftJoin(transactions, eq(transactions.bookingId, bookings.id))
        .leftJoin(zoomAccounts, eq(bookings.zoomAccountId, zoomAccounts.id))
        .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
        .orderBy(desc(bookings.createdAt)),
      db
        .select({
          id: zoomAccounts.id,
          name: zoomAccounts.name,
          email: zoomAccounts.email,
          isActive: zoomAccounts.isActive,
        })
        .from(zoomAccounts)
        .orderBy(zoomAccounts.createdAt),
    ])

    return {
      success: true,
      data: rows,
      activeAccounts: accounts,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil data sesi booking.",
    }
  }
}

export interface RejectManualPaymentInput {
  bookingId: string
  reason: string
  adminNotes?: string
}

/**
 * Admin Server Action to reject manual bank transfer payments.
 * Atomically marks booking as cancelled, transaction as FAILED with audit reason,
 * and releases the schedule slot back to available.
 */
export async function rejectManualPaymentAction(
  input: RejectManualPaymentInput,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .limit(1)

    if (!booking) {
      return { success: false, error: "Data pesanan booking tidak ditemukan." }
    }

    await db.transaction(async (tx) => {
      await recordAudit(tx, {
        actor: admin,
        action: "payment.reject",
        entityType: "booking",
        entityId: input.bookingId,
        before: { status: booking.status },
        after: { status: "cancelled", paymentStatus: "FAILED", reason: input.reason },
      })

      // 1. Cancel booking
      await tx
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, input.bookingId))

      // 2. Release schedule slot back to available
      await tx
        .update(schedules)
        .set({ status: "available", reservedUntil: null })
        .where(eq(schedules.id, booking.scheduleId ?? NO_SCHEDULE_ID))

      // 3. Mark transaction as FAILED with rejection reason
      await tx
        .update(transactions)
        .set({
          status: "FAILED",
          adminNotes: `Ditolak Admin: ${input.reason}. ${input.adminNotes || ""}`.trim(),
        })
        .where(eq(transactions.bookingId, input.bookingId))
    })

    try {
      revalidatePath("/admin/sessions")
      revalidatePath("/counselors")
      revalidatePath("/booking")
      revalidatePath("/")
      if (booking.accessToken) {
        revalidatePath(`/session/${booking.accessToken}`)
      }
    } catch {
      // Safe outside Next request lifecycle
    }

    return {
      success: true,
      message: `Pembayaran sesi berhasil ditolak (${input.reason}). Slot jadwal telah dikembalikan ke kalender publik.`,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menolak pembayaran manual.",
    }
  }
}

/**
 * Admin Server Action to mark a booking as No-Show (Spec 0003 - US 42).
 * Writes status 'no_show' (ADR-0008) once the 30 minute tolerance has elapsed
 * (rule owned by lib/booking-cycle), without penalizing the counselor.
 */
export async function markBookingNoShowAction(
  bookingId: string,
  options?: { currentUser?: AdminAuthContext | null }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      return { success: false, error: "Data pesanan booking tidak ditemukan." }
    }

    const facts = await loadNoShowBookingFacts(bookingId)
    const check = facts
      ? evaluateNoShow(facts)
      : { allowed: false, reason: "Jadwal sesi tidak ditemukan." }
    if (!check.allowed) {
      return { success: false, error: check.reason || "No-Show belum dapat ditandai." }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(bookings)
        .set(noShowUpdate())
        .where(eq(bookings.id, bookingId))

      await tx
        .update(schedules)
        .set({ status: "booked" })
        .where(eq(schedules.id, booking.scheduleId ?? NO_SCHEDULE_ID))

      await recordAudit(tx, {
        actor: admin,
        action: "booking.no_show",
        entityType: "booking",
        entityId: bookingId,
        before: { status: booking.status },
        after: { status: "no_show" },
      })
    })

    try {
      revalidatePath("/admin/sessions")
      revalidatePath("/admin/reports/finance")
      if (booking.accessToken) {
        revalidatePath(`/session/${booking.accessToken}`)
      }
    } catch {
      // Safe outside Next request lifecycle
    }

    return {
      success: true,
      message: "Sesi berhasil ditandai sebagai No-Show tanpa penalti pada mitra konselor.",
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menandai sesi sebagai No-Show.",
    }
  }
}
