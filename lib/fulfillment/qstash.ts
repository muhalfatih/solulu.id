import { fulfillBooking } from "./fulfill"

export interface DispatchFulfillmentOptions {
  fetchFn?: typeof fetch
  directFulfillFn?: typeof fulfillBooking
  forceRemote?: boolean
  overrideToken?: string
  overrideUrl?: string
}

/**
 * Dispatches an asynchronous fulfillment task to Upstash QStash,
 * with automatic local/dev fallback when QStash credentials are not set.
 */
export async function dispatchFulfillmentJob(
  bookingId: string,
  options: DispatchFulfillmentOptions = {}
): Promise<{ success: boolean; messageId?: string; directExecuted?: boolean }> {
  const fetchFn = options.fetchFn ?? fetch
  const qstashToken = options.overrideToken ?? process.env.QSTASH_TOKEN
  const rawUrl = options.overrideUrl ?? process.env.QSTASH_URL ?? "https://qstash.upstash.io/v2"
  const qstashUrl = rawUrl.endsWith("/v2") ? rawUrl : `${rawUrl.replace(/\/+$/, "")}/v2`
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solulu.id"

  // In local development or test without QStash, perform direct execution
  const shouldUseDirect =
    !options.forceRemote &&
    (!qstashToken || qstashToken === "mock" || process.env.NODE_ENV === "test")

  if (shouldUseDirect) {
    console.log(`[QSTASH DEV] Direct fulfillment executed for booking ${bookingId}`)
    const fulfillFn = options.directFulfillFn ?? fulfillBooking
    // Execute asynchronously
    fulfillFn(bookingId).catch((err) =>
      console.error(`[QSTASH DEV] Error fulfilling booking ${bookingId}:`, err)
    )
    return { success: true, messageId: "mock_qstash_msg_id", directExecuted: true }
  }

  const destinationUrl = `${appBaseUrl}/api/jobs/fulfill-booking`
  const publishUrl = `${qstashUrl}/publish/${destinationUrl}`

  try {
    const response = await fetchFn(publishUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${qstashToken}`,
        "Content-Type": "application/json",
        "Upstash-Retries": "3", // 3x automatic retry per spec (US-56)
      },
      body: JSON.stringify({ bookingId }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("Failed to publish to QStash:", errText)
      const fulfillFn = options.directFulfillFn ?? fulfillBooking
      // Fallback to direct async fulfillment if QStash fails
      fulfillFn(bookingId).catch((e) =>
        console.error("Direct fulfillment fallback error:", e)
      )
      return { success: false }
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId }
  } catch (error) {
    console.error("QStash network error:", error)
    const fulfillFn = options.directFulfillFn ?? fulfillBooking
    // Fallback to direct fulfillment
    fulfillFn(bookingId).catch((e) =>
      console.error("Direct fulfillment fallback error:", e)
    )
    return { success: false }
  }
}
