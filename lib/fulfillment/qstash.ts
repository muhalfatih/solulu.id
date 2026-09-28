import { fulfillBooking } from "./fulfill"

export interface DispatchFulfillmentOptions {
  fetchFn?: typeof fetch
  directFulfillFn?: typeof fulfillBooking
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
  const qstashToken = process.env.QSTASH_TOKEN
  const qstashUrl = process.env.QSTASH_URL || "https://qstash.upstash.io/v2"
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://solulu.id"

  // In local development or test without QStash, perform direct execution
  if (!qstashToken || qstashToken === "mock" || process.env.NODE_ENV === "test") {
    console.log(`[QSTASH DEV] Direct fulfillment executed for booking ${bookingId}`)
    const fulfillFn = options.directFulfillFn ?? fulfillBooking
    // Execute asynchronously
    fulfillFn(bookingId).catch((err) =>
      console.error(`[QSTASH DEV] Error fulfilling booking ${bookingId}:`, err)
    )
    return { success: true, messageId: "mock_qstash_msg_id", directExecuted: true }
  }

  const destinationUrl = `${appBaseUrl}/api/jobs/fulfill-booking`
  const publishUrl = `${qstashUrl}/publish/${encodeURIComponent(destinationUrl)}`

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
      // Fallback to direct async fulfillment if QStash fails
      fulfillBooking(bookingId).catch((e) =>
        console.error("Direct fulfillment fallback error:", e)
      )
      return { success: false }
    }

    const data = await response.json()
    return { success: true, messageId: data.messageId }
  } catch (error) {
    console.error("QStash network error:", error)
    // Fallback to direct fulfillment
    fulfillBooking(bookingId).catch((e) =>
      console.error("Direct fulfillment fallback error:", e)
    )
    return { success: false }
  }
}
