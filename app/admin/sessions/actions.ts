"use server"

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
