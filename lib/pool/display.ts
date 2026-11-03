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
