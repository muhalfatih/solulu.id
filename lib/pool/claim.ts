/**
 * Klaim Sesi & Penugasan Admin untuk booking Konselor Bebas (ADR-0011).
 * Orkestrasi murni: akses data lewat PoolStore sehingga bisa diuji tanpa DB.
 */
import type { AuditExecutor } from "@/lib/audit/record"
import { canClaim, isPastClaimCutoff, sessionStartAt, type BookingStatus } from "@/lib/booking-cycle"

export interface PoolBooking {
  id: string
  status: BookingStatus
  counselorId: string | null
  /** "YYYY-MM-DD" */
  poolDate: string
  /** "HH:mm[:ss]" */
  startTime: string
}

export interface CounselorSlotContext {
  typeAllowed: boolean
  onLeave: boolean
  /** Baris jadwal kosong konselor di slot booking; null bila tidak ada. */
  freeScheduleId: string | null
}

export interface PoolStore {
  getBooking(bookingId: string): Promise<PoolBooking | null>
  getCounselorContext(counselorId: string, booking: PoolBooking): Promise<CounselorSlotContext>
  /**
   * Atomik: hanya berhasil bila booking masih belum punya konselor DAN baris jadwal
   * masih kosong (UPDATE bersyarat dalam satu transaksi). Mengembalikan true bila
   * pemanggil ini yang menang.
   */
  tryAssign(
    bookingId: string,
    counselorId: string,
    scheduleId: string,
    /** Dijalankan di transaksi yang sama (mis. Jejak Audit); error membatalkan penugasan. */
    inTransaction?: (tx: AuditExecutor) => Promise<void>
  ): Promise<boolean>
}

export type ClaimResult = { ok: true; scheduleId: string } | { ok: false; error: string }

export const ALREADY_TAKEN_MESSAGE = "Sesi ini sudah diambil konselor lain."

export async function claimPoolBooking(
  store: PoolStore,
  input: { bookingId: string; counselorId: string; now?: Date }
): Promise<ClaimResult> {
  const booking = await store.getBooking(input.bookingId)
  if (!booking) return { ok: false, error: "Booking tidak ditemukan." }

  const ctx = await store.getCounselorContext(input.counselorId, booking)
  const check = canClaim({
    status: booking.status,
    alreadyClaimed: booking.counselorId !== null,
    sessionStart: sessionStartAt(booking.poolDate, booking.startTime),
    now: input.now,
    counselor: { typeAllowed: ctx.typeAllowed, slotFree: ctx.freeScheduleId !== null, onLeave: ctx.onLeave },
  })
  if (!check.allowed || !ctx.freeScheduleId) return { ok: false, error: check.reason ?? "Slot tidak tersedia." }

  const won = await store.tryAssign(booking.id, input.counselorId, ctx.freeScheduleId)
  return won ? { ok: true, scheduleId: ctx.freeScheduleId } : { ok: false, error: ALREADY_TAKEN_MESSAGE }
}

/** Admin menugaskan; tetap memakai syarat kelayakan tetapi tanpa batas cutoff. */
export async function assignPoolBooking(
  store: PoolStore,
  input: { bookingId: string; counselorId: string; audit?: (tx: AuditExecutor, before: PoolBooking) => Promise<void> }
): Promise<ClaimResult> {
  const booking = await store.getBooking(input.bookingId)
  if (!booking) return { ok: false, error: "Booking tidak ditemukan." }

  const ctx = await store.getCounselorContext(input.counselorId, booking)
  const check = canClaim({
    status: booking.status,
    alreadyClaimed: booking.counselorId !== null,
    // Admin tidak terikat cutoff: geser "sekarang" jauh sebelum sesi.
    sessionStart: sessionStartAt(booking.poolDate, booking.startTime),
    now: new Date(0),
    counselor: { typeAllowed: ctx.typeAllowed, slotFree: ctx.freeScheduleId !== null, onLeave: ctx.onLeave },
  })
  if (!check.allowed || !ctx.freeScheduleId) return { ok: false, error: check.reason ?? "Slot tidak tersedia." }

  const won = await store.tryAssign(
    booking.id,
    input.counselorId,
    ctx.freeScheduleId,
    input.audit ? (tx) => input.audit!(tx, booking) : undefined
  )
  return won ? { ok: true, scheduleId: ctx.freeScheduleId } : { ok: false, error: ALREADY_TAKEN_MESSAGE }
}

export { isPastClaimCutoff }
