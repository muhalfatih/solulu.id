"use server"

import {
  type ValidateVoucherInput,
  type CreateGuestBookingInput,
} from "@/lib/validations/booking"
import { type VoucherRecord } from "@/lib/booking/voucher"
import {
  type ActionResponse,
  type BookingContextData,
  type BookingDependencies,
  executeValidateVoucher,
  executeGetBookingContext,
  executeCreateGuestBooking,
  executeGetBookingByToken,
} from "@/lib/booking/checkout"

export type { ActionResponse, BookingContextData, BookingDependencies }

/**
 * 1. Validate voucher code interactively
 */
export async function validateVoucherAction(
  input: ValidateVoucherInput,
  deps?: {
    getPricing?: (type: "peer" | "psychologist") => Promise<any>
    getVoucher?: (code: string) => Promise<VoucherRecord | null>
    now?: () => Date
  }
): Promise<ActionResponse<{
  code: string
  discountType: string
  discountValue: number
  discountAmount: number
  netAmount: number
  discountFormatted: string
  netAmountFormatted: string
  message: string
}>> {
  return executeValidateVoucher(input, deps)
}

/**
 * 2. Get booking context (counselor, schedule, pricing, screening)
 */
export async function getBookingContextAction(
  params: {
    scheduleId: string
    counselorId: string
    screeningId?: string | null
  },
  deps?: BookingDependencies
): Promise<ActionResponse<BookingContextData>> {
  return executeGetBookingContext(params, deps)
}

/**
 * 3. Create guest patient booking (Atomic Hold, Voucher, Xendit/Manual Payment)
 */
export async function createGuestBookingAction(
  input: CreateGuestBookingInput,
  deps?: BookingDependencies
): Promise<ActionResponse<{
  bookingId: string
  accessToken: string
  paymentProvider: "xendit" | "manual"
  paymentUrl?: string
  redirectUrl?: string
  referenceNumber: string
  netAmount: number
  netAmountFormatted: string
}>> {
  return executeCreateGuestBooking(input, deps)
}

/**
 * 4. Get booking status and details by access token for success or manual-pending pages
 */
export async function getBookingByTokenAction(
  accessToken: string,
  deps?: {
    getBookingWithDetails?: (token: string) => Promise<any>
  }
): Promise<ActionResponse<{
  booking: {
    id: string
    accessToken: string
    patientName: string
    patientEmail: string
    patientPhone: string
    initialNotes: string | null
    status: string
    createdAt: Date | string
  }
  counselor: {
    id: string
    fullName: string
    title: string
    counselorType: string
    counselorTypeDisplay: string
    avatarR2Url: string | null
  }
  schedule: {
    id: string
    date: string
    startTime: string
    endTime: string
    timeRange: string
  }
  transaction: {
    id: string
    paymentProvider: string
    paymentMethod: string | null
    referenceNumber: string | null
    grossAmount: number
    discountAmount: number
    netAmount: number
    netAmountFormatted: string
    status: string
  } | null
}>> {
  return executeGetBookingByToken(accessToken, deps)
}
