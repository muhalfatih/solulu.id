"use server"

import { eq, desc } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, transactions } from "@/db/schema"
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
    const rows = await db
      .select({
        booking: bookings,
        counselor: counselors,
        schedule: schedules,
        transaction: transactions,
      })
      .from(bookings)
      .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
      .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(transactions, eq(transactions.bookingId, bookings.id))
      .orderBy(desc(bookings.createdAt))

    return {
      success: true,
      data: rows,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengambil data sesi booking.",
    }
  }
}
