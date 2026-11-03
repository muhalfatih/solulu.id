/**
 * Booking Cepat Admin (#30): Admin membuat booking untuk klien yang menghubungi lewat WhatsApp.
 *
 * Memakai jalur checkout yang sama dengan klien (`executeCreateGuestBooking`) dengan
 * `source: "booking_cepat"`, lalu selesai lewat Pemenuhan Sesi (`fulfillSession`).
 * Tiga cara bayar:
 *  1. xendit      : tautan Xendit, slot ditahan (default 60 menit, Platform Settings);
 *  2. transfer    : Admin mengunggah bukti transfer, langsung dianggap terverifikasi;
 *  3. manual_zero : Booking Manual Rp 0 dengan alasan wajib.
 * Jejak Audit dan pelunasan oleh Admin ditulis di transaksi yang sama dengan pembuatan booking.
 */
import { eq } from "drizzle-orm"
import { bookings, transactions } from "@/db/schema"
import { recordAudit, type AuditExecutor } from "@/lib/audit/record"
import { requireStaffUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, type RoleCarrier } from "@/lib/auth/staff-role"
import { BOOKING_CEPAT_HOLD_MINUTES, isHoldExpired } from "@/lib/booking-cycle"
import { formatDateId } from "@/lib/format/datetime"
import { fulfillSession } from "@/lib/fulfillment/fulfill"
import { getPlatformSettings } from "@/lib/settings/platform"
import { bookingCepatSchema, type BookingCepatInput, type BookingCepatWay } from "@/lib/validations/booking-cepat"
import { buildWaUrl, renderTemplate } from "@/lib/whatsapp/templates"
import {
  executeCreateGuestBooking,
  type BookingDependencies,
  type CheckoutCreatedContext,
  type CheckoutTx,
} from "./checkout"

/**
 * Pesan WhatsApp berisi tautan pembayaran, dirender dengan mekanisme template #31
 * (`renderTemplate` + `buildWaUrl`). `link_sesi` di sini berarti tautan pembayaran.
 * Template yang dapat diedit Superadmin untuk pesan ini adalah tindak lanjut.
 */
export const BOOKING_CEPAT_PAYMENT_MESSAGE =
  "Halo {{nama_klien}}, berikut tautan pembayaran sesi konseling Solulu Anda bersama {{nama_konselor}} pada {{tanggal}}, {{slot}}. Mohon selesaikan pembayaran sebelum slot dilepas: {{link_sesi}}"

export interface BookingCepatDeps {
  checkout?: typeof executeCreateGuestBooking
  checkoutDeps?: BookingDependencies
  fulfill?: typeof fulfillSession
  getHoldMinutes?: () => Promise<number>
  /** Info tampilan slot/konselor untuk pesan WhatsApp (dimuat dari DB oleh pemanggil). */
  describeSession?: (input: { scheduleId: string; counselorId: string }) => Promise<SessionBlurb | null>
  now?: () => Date
}

export interface SessionBlurb {
  counselorName: string
  date: string
  startTime: string
  endTime: string
}

export interface BookingCepatResult {
  bookingId: string
  accessToken: string
  way: BookingCepatWay
  netAmount: number
  /** Hanya cara Xendit. */
  paymentUrl?: string
  holdExpiresAt?: string
  waUrl?: string | null
  /** Hanya transfer / Rp 0: Pemenuhan Sesi sudah dijalankan. */
  fulfilled?: boolean
  fulfillError?: string
}

export type BookingCepatResponse =
  | { success: true; data: BookingCepatResult }
  | { success: false; error: string }

/** Hold Booking Cepat sudah lewat? Memakai aturan Siklus Booking (60 menit default, dapat dikonfigurasi). */
export function isBookingCepatHoldExpired(startedAt: Date | string, now: Date, holdMinutes?: number): boolean {
  return isHoldExpired(startedAt, "booking_cepat", now, holdMinutes)
}

/** Ringkasan audit tanpa data rahasia. */
function auditSnapshot(input: BookingCepatInput, ctx: CheckoutCreatedContext, holdMinutes: number) {
  const base = {
    source: "booking_cepat",
    way: input.payment.way,
    counselorId: ctx.counselorId,
    scheduleId: ctx.scheduleId,
    serviceId: ctx.serviceId,
    grossAmount: ctx.grossAmount,
    netAmount: ctx.netAmount,
    transactionId: ctx.transactionId,
    holdMinutes,
  }
  if (input.payment.way === "manual_zero") return { ...base, netAmount: 0, reason: input.payment.reason }
  if (input.payment.way === "transfer") {
    return { ...base, proofR2Key: input.payment.proofR2Key, referenceNumber: input.payment.referenceNumber ?? null }
  }
  return base
}

/**
 * Hook di dalam transaksi pembuatan booking: pelunasan oleh Admin (transfer / Rp 0)
 * dan baris Jejak Audit. Kegagalan melempar sehingga seluruh booking di-rollback.
 */
export function buildInTransactionHook(
  input: BookingCepatInput,
  actor: RoleCarrier,
  holdMinutes: number,
  now: Date
) {
  return async (tx: CheckoutTx, ctx: CheckoutCreatedContext) => {
    const payment = input.payment
    if (payment.way === "transfer") {
      await tx
        .update(transactions)
        .set({
          paymentProvider: "manual",
          paymentMethod: "Transfer Bank (bukti diunggah Admin)",
          referenceNumber: payment.referenceNumber || ctx.referenceNumber,
          status: "PAID",
          paidAt: now,
          adminNotes: "Booking Cepat: bukti transfer diunggah Admin",
        })
        .where(eq(transactions.id, ctx.transactionId))
      await tx
        .update(bookings)
        .set({
          paymentMethod: "manual_bank_transfer",
          manualPaymentProofR2Key: payment.proofR2Key,
          manualPaymentStatus: "VERIFIED",
        })
        .where(eq(bookings.id, ctx.bookingId))
    } else if (payment.way === "manual_zero") {
      // Tarif pokok aktif Layanan tetap menjadi gross (dan snapshot booking), sehingga Honor Konselor tidak berubah.
      await tx
        .update(transactions)
        .set({
          paymentProvider: "admin_bypass",
          paymentMethod: "Admin Bypass (Rp 0)",
          discountAmount: ctx.grossAmount.toFixed(2),
          netAmount: "0.00",
          status: "PAID",
          paidAt: now,
          adminNotes: payment.reason,
        })
        .where(eq(transactions.id, ctx.transactionId))
      await tx.update(bookings).set({ paymentMethod: "admin_bypass" }).where(eq(bookings.id, ctx.bookingId))
    }

    await recordAudit(tx as unknown as AuditExecutor, {
      actor,
      action: "booking.quick_create",
      entityType: "booking",
      entityId: ctx.bookingId,
      before: null,
      after: auditSnapshot(input, ctx, holdMinutes),
    })
  }
}

export async function createBookingCepat(
  rawInput: unknown,
  deps: BookingCepatDeps = {},
  currentUser?: RoleCarrier | null
): Promise<BookingCepatResponse> {
  const admin = await requireStaffUser(currentUser, ADMIN_ROLES)
  if (!admin) return { success: false, error: "Akses ditolak: diperlukan role Admin untuk Booking Cepat." }

  const parsed = bookingCepatSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Data Booking Cepat tidak valid." }
  }
  const input = parsed.data
  const now = deps.now ? deps.now() : new Date()
  const holdMinutes = deps.getHoldMinutes
    ? await deps.getHoldMinutes()
    : (await getPlatformSettings()).bookingCepatHoldMinutes || BOOKING_CEPAT_HOLD_MINUTES

  const checkout = deps.checkout ?? executeCreateGuestBooking
  const res = await checkout(
    {
      counselorId: input.counselorId,
      scheduleId: input.scheduleId,
      serviceId: input.serviceId,
      patientName: input.patientName,
      patientEmail: input.patientEmail,
      patientEmailConfirm: input.patientEmail,
      patientPhone: input.patientPhone,
      initialNotes: input.initialNotes ?? null,
      paymentProvider: input.payment.way === "xendit" ? "xendit" : "manual",
      paymentMethod: input.payment.way === "xendit" ? "Booking Cepat (tautan Xendit)" : null,
    },
    { now: () => now, ...deps.checkoutDeps },
    {
      source: "booking_cepat",
      holdMinutes,
      inTransaction: buildInTransactionHook(input, admin, holdMinutes, now),
    }
  )
  if (!res.success || !res.data) return { success: false, error: res.error || "Gagal membuat Booking Cepat." }

  const base: BookingCepatResult = {
    bookingId: res.data.bookingId,
    accessToken: res.data.accessToken,
    way: input.payment.way,
    netAmount: input.payment.way === "manual_zero" ? 0 : res.data.netAmount,
  }

  if (input.payment.way === "xendit") {
    const paymentUrl = res.data.paymentUrl
    let waUrl: string | null = null
    const blurb = deps.describeSession
      ? await deps.describeSession({ scheduleId: input.scheduleId, counselorId: input.counselorId })
      : null
    if (paymentUrl && blurb) {
      const text = renderTemplate(BOOKING_CEPAT_PAYMENT_MESSAGE, {
        nama_klien: input.patientName,
        tanggal: formatDateId(blurb.date),
        slot: `${blurb.startTime.slice(0, 5)} - ${blurb.endTime.slice(0, 5)} WIB`,
        link_sesi: paymentUrl,
        nama_konselor: blurb.counselorName,
      })
      waUrl = buildWaUrl(input.patientPhone, text)
    }
    return {
      success: true,
      data: {
        ...base,
        paymentUrl,
        holdExpiresAt: new Date(now.getTime() + holdMinutes * 60_000).toISOString(),
        waUrl,
      },
    }
  }

  // Transfer / Rp 0: sudah lunas di transaksi; jalankan Pemenuhan Sesi.
  const fulfill = deps.fulfill ?? fulfillSession
  const fulfilled = await fulfill(res.data.bookingId, {
    source: input.payment.way === "transfer" ? "manual_bank" : "admin_bypass",
  })
  return {
    success: true,
    data: {
      ...base,
      fulfilled: fulfilled.success,
      fulfillError: fulfilled.success ? undefined : fulfilled.error,
    },
  }
}
