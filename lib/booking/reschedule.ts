import {
  canRescheduleAdmin,
  canRescheduleSelf,
  DEFAULT_RESCHEDULE_CUTOFF_HOURS,
  sessionStartAt,
  type BookingStatus,
} from "@/lib/booking-cycle"
import { recordAudit, type AuditExecutor } from "@/lib/audit/record"
import { hasStaffRole, ADMIN_ROLES, type RoleCarrier } from "@/lib/auth/staff-role"

/**
 * Reschedule Mandiri + Reschedule Admin (#28).
 *
 * Aturan ada di Modul Siklus Booking (`canRescheduleSelf` / `canRescheduleAdmin`).
 * Modul ini mengorkestrasi satu transaksi: validasi slot baru, membebaskan slot lama,
 * menyimpan riwayat jadwal, (admin) menulis Jejak Audit, lalu setelah commit menjalankan
 * ulang Pemenuhan Sesi untuk slot baru. Token Sesi tidak pernah berubah.
 */

/** Booking Konselor Bebas (pool) yang belum diklaim/ditugaskan belum punya jadwal maupun konselor. */
export interface LoadedBookingFacts extends Omit<RescheduleBookingFacts, "counselorId" | "scheduleId" | "scheduleDate" | "startTime"> {
  counselorId: string | null
  scheduleId: string | null
  scheduleDate: string | null
  startTime: string | null
}

export interface RescheduleBookingFacts {
  id: string
  accessToken: string
  status: BookingStatus
  counselorId: string
  scheduleId: string
  /** Jatah Reschedule Mandiri yang sudah dipakai. */
  rescheduleCount: number
  adminRescheduleCount: number
  /** "YYYY-MM-DD" (WIB) dan jam mulai slot saat ini. */
  scheduleDate: string
  startTime: string
  timerStartedAt: Date | string | null
}

export interface RescheduleSlot {
  id: string
  counselorId: string
  date: string
  startTime: string
  status: "available" | "reserved" | "booked" | "completed" | string
  isLeave: boolean
  reservedUntil: Date | null
}

export interface RescheduleHistoryRow {
  bookingId: string
  initiatedBy: "client" | "admin"
  actorId: string | null
  fromScheduleId: string
  toScheduleId: string
  fromCounselorId: string
  toCounselorId: string
}

/** Operasi di dalam satu transaksi database. */
export interface RescheduleTx {
  loadBooking(ref: { bookingId?: string; accessToken?: string }): Promise<LoadedBookingFacts | null>
  loadSlot(scheduleId: string): Promise<RescheduleSlot | null>
  /** Atomik: tandai Booked hanya bila masih Available; false bila keduluan. */
  claimSlot(scheduleId: string): Promise<boolean>
  releaseSlot(scheduleId: string): Promise<void>
  updateBooking(bookingId: string, values: RescheduleBookingUpdate): Promise<void>
  insertHistory(row: RescheduleHistoryRow): Promise<void>
  audit: AuditExecutor
}

export interface RescheduleBookingUpdate {
  scheduleId: string
  counselorId: string
  rescheduleCount: number
  adminRescheduleCount: number
  zoomAccountId: null
  zoomAccountNumber: number
  zoomAllocationMode: "standalone"
  zoomMeetingId: null
  zoomJoinUrl: null
  zoomStartUrl: null
  zoomHostKey: null
  breakoutRoomName: null
  operatorAdmittedAt: null
}

export interface RescheduleDeps {
  transaction<T>(fn: (tx: RescheduleTx) => Promise<T>): Promise<T>
  /** Cutoff Reschedule dari Platform Settings (default H-4). */
  getCutoffHours(): Promise<number>
  /** Pemenuhan Sesi / Dispatcher untuk slot baru. */
  fulfill(bookingId: string): Promise<{ success: boolean; error?: string }>
  now?: Date
}

export interface RescheduleResult {
  success: boolean
  bookingId?: string
  error?: string
  /** Reschedule tersimpan tetapi alokasi Zoom perlu dicoba ulang. */
  warning?: string
}

class RescheduleRejected extends Error {}

function reject(message: string): never {
  throw new RescheduleRejected(message)
}

function assertAssigned(b: LoadedBookingFacts): asserts b is LoadedBookingFacts & RescheduleBookingFacts {
  if (!b.scheduleId || !b.counselorId || !b.scheduleDate || !b.startTime) {
    reject("Booking Konselor Bebas belum memiliki konselor dan jadwal, sehingga belum dapat di-reschedule. Tunggu hingga konselor mengambil sesi atau Admin menugaskan konselor.")
  }
}

function validateTargetSlot(slot: RescheduleSlot | null, booking: RescheduleBookingFacts, now: Date, sameCounselorOnly: boolean): asserts slot is RescheduleSlot {
  if (!slot) reject("Slot jadwal baru tidak ditemukan.")
  if (slot.id === booking.scheduleId) reject("Pilih jadwal yang berbeda dari jadwal saat ini.")
  if (sameCounselorOnly && slot.counselorId !== booking.counselorId) {
    reject("Reschedule mandiri hanya dapat memilih slot milik konselor yang sama.")
  }
  if (slot.isLeave || slot.status !== "available") {
    reject("Slot yang dipilih tidak tersedia. Silakan pilih slot lain.")
  }
  if (sessionStartAt(slot.date, slot.startTime).getTime() <= now.getTime()) {
    reject("Slot yang dipilih sudah lewat.")
  }
}

async function applyReschedule(
  tx: RescheduleTx,
  booking: RescheduleBookingFacts,
  slot: RescheduleSlot,
  by: { initiatedBy: "client" | "admin"; actorId: string | null }
) {
  if (!(await tx.claimSlot(slot.id))) reject("Slot yang dipilih baru saja diambil. Silakan pilih slot lain.")
  await tx.releaseSlot(booking.scheduleId)
  await tx.updateBooking(booking.id, {
    scheduleId: slot.id,
    counselorId: slot.counselorId,
    rescheduleCount: booking.rescheduleCount + (by.initiatedBy === "client" ? 1 : 0),
    adminRescheduleCount: booking.adminRescheduleCount + (by.initiatedBy === "admin" ? 1 : 0),
    // Link Zoom boleh berubah: kosongkan agar Dispatcher mengalokasikan ulang untuk slot baru.
    zoomAccountId: null,
    zoomAccountNumber: 1,
    zoomAllocationMode: "standalone",
    zoomMeetingId: null,
    zoomJoinUrl: null,
    zoomStartUrl: null,
    zoomHostKey: null,
    breakoutRoomName: null,
    operatorAdmittedAt: null,
  })
  await tx.insertHistory({
    bookingId: booking.id,
    initiatedBy: by.initiatedBy,
    actorId: by.actorId,
    fromScheduleId: booking.scheduleId,
    toScheduleId: slot.id,
    fromCounselorId: booking.counselorId,
    toCounselorId: slot.counselorId,
  })
}

async function redispatch(deps: RescheduleDeps, bookingId: string): Promise<RescheduleResult> {
  try {
    const res = await deps.fulfill(bookingId)
    if (!res.success) {
      return {
        success: true,
        bookingId,
        warning: `Jadwal berhasil diubah, tetapi ruang Zoom baru belum terbentuk: ${res.error ?? "kesalahan tidak diketahui"}. Hubungi Admin.`,
      }
    }
  } catch (err: any) {
    return {
      success: true,
      bookingId,
      warning: `Jadwal berhasil diubah, tetapi ruang Zoom baru belum terbentuk: ${err?.message ?? "kesalahan tidak diketahui"}. Hubungi Admin.`,
    }
  }
  return { success: true, bookingId }
}

function failure(err: unknown): RescheduleResult {
  if (err instanceof RescheduleRejected) return { success: false, error: err.message }
  return { success: false, error: "Gagal mengubah jadwal. Silakan coba lagi." }
}

/** Reschedule Mandiri: maks 1x, sebelum Cutoff Reschedule, hanya slot konselor yang sama. */
export async function rescheduleBySelf(
  input: { accessToken: string; newScheduleId: string },
  deps: RescheduleDeps
): Promise<RescheduleResult> {
  const now = deps.now ?? new Date()
  try {
    const cutoffHours = (await deps.getCutoffHours()) || DEFAULT_RESCHEDULE_CUTOFF_HOURS
    const bookingId = await deps.transaction(async (tx) => {
      const booking = await tx.loadBooking({ accessToken: input.accessToken })
      if (!booking) reject("Sesi konseling tidak ditemukan.")
      assertAssigned(booking)
      const check = canRescheduleSelf({
        status: booking.status,
        selfRescheduleCount: booking.rescheduleCount,
        sessionDate: booking.scheduleDate,
        startTime: booking.startTime,
        timerStartedAt: booking.timerStartedAt,
        now,
        cutoffHours,
      })
      if (!check.allowed) reject(check.reason)
      const slot = await tx.loadSlot(input.newScheduleId)
      validateTargetSlot(slot, booking, now, true)
      await applyReschedule(tx, booking, slot, { initiatedBy: "client", actorId: null })
      return booking.id
    })
    return redispatch(deps, bookingId)
  } catch (err) {
    return failure(err)
  }
}

/** Reschedule Admin: kapan saja, boleh ganti konselor, tidak memakai jatah klien, tercatat di Jejak Audit. */
export async function rescheduleByAdmin(
  input: { bookingId: string; newScheduleId: string; actor: RoleCarrier | null | undefined },
  deps: RescheduleDeps
): Promise<RescheduleResult> {
  if (!hasStaffRole(input.actor, ADMIN_ROLES)) {
    return { success: false, error: "Akses ditolak: Diperlukan role Admin." }
  }
  const now = deps.now ?? new Date()
  try {
    const bookingId = await deps.transaction(async (tx) => {
      const booking = await tx.loadBooking({ bookingId: input.bookingId })
      if (!booking) reject("Data booking tidak ditemukan.")
      assertAssigned(booking)
      const check = canRescheduleAdmin({ status: booking.status, timerStartedAt: booking.timerStartedAt })
      if (!check.allowed) reject(check.reason)
      const slot = await tx.loadSlot(input.newScheduleId)
      validateTargetSlot(slot, booking, now, false)
      await applyReschedule(tx, booking, slot, { initiatedBy: "admin", actorId: input.actor?.id ?? null })
      await recordAudit(tx.audit, {
        actor: input.actor,
        action: "booking.reschedule_admin",
        entityType: "booking",
        entityId: booking.id,
        before: { scheduleId: booking.scheduleId, counselorId: booking.counselorId },
        after: { scheduleId: slot.id, counselorId: slot.counselorId },
      })
      return booking.id
    })
    return redispatch(deps, bookingId)
  } catch (err) {
    return failure(err)
  }
}
