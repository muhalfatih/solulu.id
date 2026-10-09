"use server"

import { eq, desc } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, transactions, zoomAccounts } from "@/db/schema"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/app/admin/counselors/actions"
import {
  confirmManualPayment,
  type ConfirmManualPaymentInput,
  type ManualPaymentDependencies,
  type ConfirmManualPaymentResult,
} from "@/lib/fulfillment/manual"

/**
 * Admin Server Action to verify and confirm manual bank transfer payments.
 * Triggers dynamic Zoom host allocation, updates transaction/booking/schedule,
 * and sends confirmation emails to patient and counselor.
 */
export async function confirmManualPaymentAction(
  input: ConfirmManualPaymentInput,
  deps?: ManualPaymentDependencies
): Promise<ConfirmManualPaymentResult> {
  return confirmManualPayment(input, deps)
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
        })
        .from(bookings)
        .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
        .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .leftJoin(transactions, eq(transactions.bookingId, bookings.id))
        .leftJoin(zoomAccounts, eq(bookings.zoomAccountId, zoomAccounts.id))
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
      // 1. Cancel booking
      await tx
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, input.bookingId))

      // 2. Release schedule slot back to available
      await tx
        .update(schedules)
        .set({ status: "available", reservedUntil: null })
        .where(eq(schedules.id, booking.scheduleId))

      // 3. Mark transaction as FAILED with rejection reason
      await tx
        .update(transactions)
        .set({
          status: "FAILED",
          adminNotes: `Ditolak Admin: ${input.reason}. ${input.adminNotes || ""}`.trim(),
        })
        .where(eq(transactions.bookingId, input.bookingId))
    })

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
