"use server"

import { type CreatePoolBookingInput } from "@/lib/validations/booking"
import {
  executeCreatePoolBooking,
  type PoolCheckoutData,
  type PoolCheckoutResult,
} from "@/lib/booking/pool-checkout"

/** Checkout Konselor Bebas: membuat booking pool, hold, dan invoice Xendit. */
export async function createPoolBookingAction(
  input: CreatePoolBookingInput
): Promise<PoolCheckoutResult<PoolCheckoutData>> {
  return executeCreatePoolBooking(input)
}
