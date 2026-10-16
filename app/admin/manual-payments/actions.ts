"use server"

import { revalidatePath } from "next/cache"
import { eq, or, and, desc } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, transactions, zoomAccounts } from "@/db/schema"
import { getAuthenticatedAdmin, AdminAuthContext } from "@/app/admin/counselors/actions"
import { generatePresignedGetUrl } from "@/lib/r2"
import {
  confirmManualPayment,
  type ConfirmManualPaymentInput,
  type ManualPaymentDependencies,
} from "@/lib/fulfillment/manual"

function safeRevalidatePaths(...paths: string[]) {
  try {
    for (const p of paths) {
      revalidatePath(p)
    }
  } catch {
    // Safe fallback in test environments
  }
}

export interface ManualPaymentQueueItem {
  id: string
  bookingCode: string
  patientName: string
  patientPhone: string
  patientEmail: string
  counselorId: string
  counselorName: string
  counselorType: string
  scheduleDate: string
  timeRange: string
  slotIndex: number
  paymentType: "initial" | "extension"
  nominalAmount: number
  paymentMethod: string
  manualPaymentStatus: string
  extensionPaymentStatus: string
  slipR2Key: string | null
  slipUrl: string | null
  referenceNumber: string | null
  adminNotes: string | null
  createdAt: string
}

export interface ConfirmPaymentAdminInput {
  bookingId: string
  paymentType: "initial" | "extension"
  paymentMethod?: string
  referenceNumber?: string
  adminNotes?: string
}

export interface RejectPaymentAdminInput {
  bookingId: string
  paymentType: "initial" | "extension"
  reason: string
  adminNotes?: string
}

/**
 * Fetches the manual payment verification queue from PostgreSQL real DB.
 * Filters initial bookings and extensions where payment status is PENDING.
 */
export async function getManualPaymentsQueueAdminAction(options?: {
  currentUser?: AdminAuthContext | null
  fetchFn?: () => Promise<ManualPaymentQueueItem[]>
  presigner?: (params: { key: string; expiresIn?: number }) => Promise<string>
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk mengakses antrean pembayaran.",
      data: [] as ManualPaymentQueueItem[],
    }
  }

  if (options?.fetchFn) {
    try {
      const items = await options.fetchFn()
      return { success: true, data: items }
    } catch (err: any) {
      return { success: false, error: err.message, data: [] }
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
      .where(
        or(
          eq(bookings.manualPaymentStatus, "PENDING"),
          eq(bookings.extensionPaymentStatus, "PENDING"),
          and(
            eq(bookings.paymentMethod, "manual_bank_transfer"),
            eq(bookings.status, "pending_payment")
          )
        )
      )
      .orderBy(desc(bookings.createdAt))

    const presigner = options?.presigner || generatePresignedGetUrl
    const items: ManualPaymentQueueItem[] = []

    for (const r of rows) {
      const b = r.booking
      const c = r.counselor
      const s = r.schedule
      const t = r.transaction

      const counselorTypeLabel =
        c?.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"
      const dateStr = s?.date ? String(s.date) : ""
      const timeRange = s
        ? `${s.startTime?.slice(0, 5)} - ${s.endTime?.slice(0, 5)}`
        : "09:00 - 10:30"
      const slotIndex = s?.slotIndex || 1

      // 1. Initial Booking Pending Transfer Check
      const isInitialPending =
        b.manualPaymentStatus === "PENDING" ||
        (b.paymentMethod === "manual_bank_transfer" && b.status === "pending_payment")

      if (isInitialPending) {
        const slipKey = b.manualPaymentProofR2Key || t?.manualProofR2Key || null
        let slipUrl: string | null = null
        if (slipKey) {
          try {
            slipUrl = await presigner({ key: slipKey, expiresIn: 900 })
          } catch {
            slipUrl = null
          }
        }

        const nominal = t?.netAmount
          ? Number(t.netAmount)
          : c?.customFeeRate
          ? Number(c.customFeeRate)
          : c?.counselorType === "psychologist"
          ? 250000
          : 150000

        items.push({
          id: b.id,
          bookingCode: b.bookingCode,
          patientName: b.patientName,
          patientPhone: b.patientPhone,
          patientEmail: b.patientEmail,
          counselorId: c?.id || "",
          counselorName: c?.fullName || "Belum Ditugaskan",
          counselorType: counselorTypeLabel,
          scheduleDate: dateStr,
          timeRange,
          slotIndex,
          paymentType: "initial",
          nominalAmount: nominal,
          paymentMethod: b.paymentMethod,
          manualPaymentStatus: b.manualPaymentStatus || "PENDING",
          extensionPaymentStatus: b.extensionPaymentStatus,
          slipR2Key: slipKey,
          slipUrl,
          referenceNumber: t?.referenceNumber || null,
          adminNotes: t?.adminNotes || null,
          createdAt: b.createdAt.toISOString(),
        })
      }

      // 2. Extension Session Pending Transfer Check
      const isExtensionPending =
        b.isExtended && b.extensionPaymentStatus === "PENDING"

      if (isExtensionPending) {
        const extSlipKey = b.extensionProofR2Key || null
        let extSlipUrl: string | null = null
        if (extSlipKey) {
          try {
            extSlipUrl = await presigner({ key: extSlipKey, expiresIn: 900 })
          } catch {
            extSlipUrl = null
          }
        }

        const extNominal = Number(b.extensionFee) || (c?.counselorType === "psychologist" ? 50000 : 35000)

        items.push({
          id: b.id,
          bookingCode: b.bookingCode,
          patientName: b.patientName,
          patientPhone: b.patientPhone,
          patientEmail: b.patientEmail,
          counselorId: c?.id || "",
          counselorName: c?.fullName || "Belum Ditugaskan",
          counselorType: counselorTypeLabel,
          scheduleDate: dateStr,
          timeRange,
          slotIndex,
          paymentType: "extension",
          nominalAmount: extNominal,
          paymentMethod: b.extensionPaymentMethod || "manual_bank_transfer",
          manualPaymentStatus: b.manualPaymentStatus || "NONE",
          extensionPaymentStatus: b.extensionPaymentStatus,
          slipR2Key: extSlipKey,
          slipUrl: extSlipUrl,
          referenceNumber: null,
          adminNotes: null,
          createdAt: b.createdAt.toISOString(),
        })
      }
    }

    return {
      success: true,
      data: items,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memuat antrean verifikasi transfer manual.",
      data: [],
    }
  }
}

/**
 * Confirms payment ("Konfirmasi Lunas"):
 * - For Initial Booking: marks manualPaymentStatus: 'VERIFIED', transitions status to 'confirmed',
 *   and triggers Zoom room dynamic host allocation and meeting creation.
 * - For Extension: marks extensionPaymentStatus: 'PAID'.
 */
export async function confirmManualPaymentAdminAction(
  input: ConfirmPaymentAdminInput,
  options?: {
    currentUser?: AdminAuthContext | null
    confirmPaymentFn?: (
      input: ConfirmManualPaymentInput,
      deps?: ManualPaymentDependencies
    ) => Promise<any>
    updateBookingFn?: (bookingId: string, values: any) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  const { bookingId, paymentType, paymentMethod, referenceNumber, adminNotes } = input

  if (!bookingId) {
    return { success: false, error: "ID Pemesanan wajib disertakan." }
  }

  try {
    if (paymentType === "extension") {
      // Pelunasan Extend Session
      if (options?.updateBookingFn) {
        await options.updateBookingFn(bookingId, {
          extensionPaymentStatus: "PAID",
        })
      } else {
        await db
          .update(bookings)
          .set({
            extensionPaymentStatus: "PAID",
          })
          .where(eq(bookings.id, bookingId))
      }

      safeRevalidatePaths("/admin/manual-payments", "/admin/bookings", "/admin/sessions")

      return {
        success: true,
        message: "Pelunasan perpanjangan sesi berhasil dikonfirmasi Lunas.",
      }
    }

    // Initial Booking Payment Confirmation
    const refNum = referenceNumber?.trim() || `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`
    const channel = paymentMethod || "Transfer Bank BCA (Manual)"

    const confirmFn = options?.confirmPaymentFn || confirmManualPayment
    const result = await confirmFn({
      bookingId,
      paymentMethod: channel,
      referenceNumber: refNum,
      adminNotes: adminNotes || "Transfer bank manual diverifikasi oleh Admin.",
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error || "Gagal mengalokasikan ruang Zoom dan memverifikasi pembayaran.",
      }
    }

    // Persist manualPaymentStatus: 'VERIFIED' and status: 'confirmed'
    if (options?.updateBookingFn) {
      await options.updateBookingFn(bookingId, {
        manualPaymentStatus: "VERIFIED",
        status: "confirmed",
      })
    } else {
      await db
        .update(bookings)
        .set({
          manualPaymentStatus: "VERIFIED",
          status: "confirmed",
        })
        .where(eq(bookings.id, bookingId))
    }

    safeRevalidatePaths("/admin/manual-payments", "/admin/bookings", "/admin/sessions")

    return {
      success: true,
      message: "Pembayaran pemesanan berhasil diverifikasi Lunas! Ruang Zoom dan notifikasi telah diterbitkan.",
      zoomRoom: result.zoomRoom,
      zoomJoinUrl: result.zoomJoinUrl,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengonfirmasi pembayaran manual.",
    }
  }
}

/**
 * Rejects payment ("Tolak"):
 * - For Initial Booking: marks manualPaymentStatus: 'REJECTED', transitions status to 'cancelled',
 *   releases schedule slot back to available, and sets transaction to FAILED.
 * - For Extension: marks extensionPaymentStatus: 'REJECTED'.
 */
export async function rejectManualPaymentAdminAction(
  input: RejectPaymentAdminInput,
  options?: {
    currentUser?: AdminAuthContext | null
    rejectFn?: (bookingId: string, reason: string, notes?: string) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  const { bookingId, paymentType, reason, adminNotes } = input

  if (!bookingId || !reason) {
    return {
      success: false,
      error: "ID Pemesanan dan alasan penolakan wajib diisi.",
    }
  }

  try {
    if (options?.rejectFn) {
      await options.rejectFn(bookingId, reason, adminNotes)
      return {
        success: true,
        message: `Pembayaran ${paymentType === "extension" ? "perpanjangan" : "booking"} berhasil ditolak (${reason}).`,
      }
    }

    if (paymentType === "extension") {
      await db
        .update(bookings)
        .set({
          extensionPaymentStatus: "REJECTED",
        })
        .where(eq(bookings.id, bookingId))

      safeRevalidatePaths("/admin/manual-payments", "/admin/bookings", "/admin/sessions")

      return {
        success: true,
        message: `Pembayaran perpanjangan sesi berhasil ditolak (${reason}).`,
      }
    }

    // Initial Booking Rejection: Atomic rollback
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      return { success: false, error: "Data booking tidak ditemukan." }
    }

    await db.transaction(async (tx) => {
      // 1. Mark booking cancelled & payment rejected
      await tx
        .update(bookings)
        .set({
          manualPaymentStatus: "REJECTED",
          status: "cancelled",
        })
        .where(eq(bookings.id, bookingId))

      // 2. Release schedule slot back to available
      await tx
        .update(schedules)
        .set({
          status: "available",
          reservedUntil: null,
        })
        .where(eq(schedules.id, booking.scheduleId))

      // 3. Mark transaction as FAILED
      await tx
        .update(transactions)
        .set({
          status: "FAILED",
          adminNotes: `Ditolak Admin: ${reason}. ${adminNotes || ""}`.trim(),
        })
        .where(eq(transactions.bookingId, bookingId))
    })

    safeRevalidatePaths("/admin/manual-payments", "/admin/bookings", "/admin/sessions")

    return {
      success: true,
      message: `Pembayaran pemesanan berhasil ditolak (${reason}). Slot jadwal telah dikembalikan ke kalender publik.`,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menolak pembayaran manual.",
    }
  }
}
