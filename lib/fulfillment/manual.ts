import { eq } from "drizzle-orm"
import { db } from "@/db"
import { bookings, transactions } from "@/db/schema"
import {
  fulfillSession,
  type FulfillSessionDependencies,
  type FulfillSessionResult,
} from "./fulfill"

export interface ConfirmManualPaymentInput {
  bookingId: string
  paymentMethod: string
  referenceNumber: string
  adminNotes?: string
}

export type ManualPaymentDependencies = FulfillSessionDependencies

export interface ConfirmManualPaymentResult {
  success: boolean
  bookingId: string
  zoomRoom?: string
  zoomJoinUrl?: string | null
  zoomStartUrl?: string | null
  error?: string
}

/**
 * Path B: Admin Manual Bank Transfer Verification (US-42).
 * Verifies transaction, marks transaction PAID, and delegates technical
 * host allocation, Zoom meeting creation, and notifications to the deep Session Fulfillment module.
 */
export async function confirmManualPayment(
  input: ConfirmManualPaymentInput,
  deps: ManualPaymentDependencies = {}
): Promise<ConfirmManualPaymentResult> {
  try {
    const { bookingId, paymentMethod, referenceNumber, adminNotes } = input

    if (!bookingId || !paymentMethod || !referenceNumber) {
      return {
        success: false,
        bookingId: bookingId || "",
        error: "ID Pemesanan, metode pembayaran, dan nomor referensi wajib diisi.",
      }
    }

    // 1. Transaction verification check
    if (deps.fetchBookingData) {
      const data = await deps.fetchBookingData(bookingId)
      if (data?.transaction?.status === "PAID") {
        return {
          success: false,
          bookingId,
          error: "Transaksi untuk pemesanan ini telah berstatus LUNAS sebelumnya.",
        }
      }
    } else {
      const txRows = await db
        .select({ id: transactions.id, status: transactions.status })
        .from(transactions)
        .where(eq(transactions.bookingId, bookingId))
        .limit(1)

      if (txRows.length > 0 && txRows[0].status === "PAID") {
        return {
          success: false,
          bookingId,
          error: "Transaksi untuk pemesanan ini telah berstatus LUNAS sebelumnya.",
        }
      }

      if (txRows.length > 0) {
        await db
          .update(transactions)
          .set({
            status: "PAID",
            paymentProvider: "manual",
            paymentMethod,
            referenceNumber,
            adminNotes: adminNotes || null,
            paidAt: new Date(),
          })
          .where(eq(transactions.id, txRows[0].id))
      }
    }

    // 2. Delegate technical fulfillment to the deep Session Fulfillment module
    const fulfillmentResult = await fulfillSession(bookingId, deps)

    if (!fulfillmentResult.success) {
      return {
        success: false,
        bookingId,
        error:
          fulfillmentResult.error ||
          "Gagal mengalokasikan akun Zoom Pro (kapasitas penuh).",
      }
    }

    // 3. Mark manualPaymentStatus as VERIFIED on booking
    if (!deps.fetchBookingData) {
      await db
        .update(bookings)
        .set({ manualPaymentStatus: "VERIFIED" })
        .where(eq(bookings.id, bookingId))
    }

    return {
      success: true,
      bookingId,
      zoomRoom: fulfillmentResult.zoomRoom,
      zoomJoinUrl: fulfillmentResult.zoomJoinUrl,
      zoomStartUrl: fulfillmentResult.zoomStartUrl,
    }
  } catch (error: any) {
    return {
      success: false,
      bookingId: input?.bookingId || "",
      error: error?.message || "Gagal memverifikasi pembayaran manual.",
    }
  }
}

