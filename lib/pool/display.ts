import { getSlotByIndex } from "@/lib/schedules/slots"

/** Label tampilan untuk booking Konselor Bebas yang belum diklaim / ditugaskan. */
export const NO_COUNSELOR_LABEL = "Belum ada konselor"

export interface PoolSlotDisplay {
  date: string
  slotIndex: number
  /** "HH:mm" */
  startTime: string
  /** "HH:mm" */
  endTime: string
}

/** Slot yang dipesan booking pool (dari pool_date + pool_slot_index); null bila bukan booking pool. */
export function poolSlotDisplay(booking: {
  poolDate: string | null
  poolSlotIndex: number | null
}): PoolSlotDisplay | null {
  if (!booking.poolDate || !booking.poolSlotIndex) return null
  const slot = getSlotByIndex(booking.poolSlotIndex)
  if (!slot) return null
  return {
    date: String(booking.poolDate),
    slotIndex: slot.slotIndex,
    startTime: slot.startTime.slice(0, 5),
    endTime: slot.endTime.slice(0, 5),
  }
}

export interface SessionScheduleLike {
  id: string
  date: string
  startTime: string
  endTime: string
}

/**
 * Jadwal sesi untuk /session/[token]: baris jadwal konselor bila ada, kalau tidak
 * slot pool (booking Konselor Bebas belum diklaim, id kosong). Null bila keduanya tidak ada.
 */
export function resolveSessionSchedule(
  schedule: SessionScheduleLike | null,
  booking: { poolDate: string | null; poolSlotIndex: number | null }
): SessionScheduleLike | null {
  if (schedule) return schedule
  const pool = poolSlotDisplay(booking)
  if (!pool) return null
  return { id: "", date: pool.date, startTime: `${pool.startTime}:00`, endTime: `${pool.endTime}:00` }
}

/** Booking pool yang jam sesinya sudah lewat (masih tanpa konselor). Murni. */
export function isPoolSessionOverdue(
  booking: { poolDate: string | null; poolSlotIndex: number | null },
  now: Date
): boolean {
  const pool = poolSlotDisplay(booking)
  if (!pool) return false
  return now.getTime() >= new Date(`${pool.date}T${pool.startTime}:00+07:00`).getTime()
}
