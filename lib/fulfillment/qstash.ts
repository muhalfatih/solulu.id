import { fulfillBooking } from "./fulfill"
import { getAppBaseUrl } from "@/lib/url"
import {
  getQstashConfig,
  type IntegrationEnv,
  type QstashConfig,
} from "@/lib/config/integrations"

export interface DispatchFulfillmentOptions {
  fetchFn?: typeof fetch
  directFulfillFn?: typeof fulfillBooking
  env?: IntegrationEnv
}

export interface DispatchFulfillmentResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Publishes an asynchronous fulfillment task to Upstash QStash.
 * Without QStash credentials the dispatch fails explicitly (success=false with
 * an error naming the variable); there is no local "direct execution" path.
 */
export async function dispatchFulfillmentJob(
  bookingId: string,
  options: DispatchFulfillmentOptions = {}
): Promise<DispatchFulfillmentResult> {
  const fetchFn = options.fetchFn ?? fetch

  let qstash: QstashConfig
  try {
    qstash = getQstashConfig(options.env)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Konfigurasi QStash tidak valid."
    console.error(`[QSTASH] Fulfillment booking ${bookingId} tidak dijadwalkan:`, message)
    return { success: false, error: message }
  }

  const qstashToken = qstash.token
  const qstashUrl = qstash.url
  let appBaseUrl = getAppBaseUrl()
  if (appBaseUrl.startsWith("http://localhost") || appBaseUrl.startsWith("http://127.0.0.1")) {
    appBaseUrl = "https://solulu.id"
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
      return { success: false, error: `QStash menolak publikasi: ${errText}` }
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghubungi QStash",
    }
  }
}
