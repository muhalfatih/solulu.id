import { NextResponse } from "next/server"
import { fulfillBooking } from "@/lib/fulfillment/fulfill"
import { verifyQstashSignature } from "@/lib/fulfillment/qstash-verify"

export interface FulfillJobDeps {
  verify: (input: { signature: string; body: string; url: string }) => Promise<boolean> | boolean
  fulfill: (bookingId: string) => Promise<{
    success: boolean
    error?: string
    zoomJoinUrl?: string | null
    zoomMeetingId?: string | null
  }>
}

const defaultDeps: FulfillJobDeps = {
  verify: (input) => verifyQstashSignature(input),
  fulfill: fulfillBooking,
}

/**
 * Asynchronous Fulfillment Worker triggered by Upstash QStash (US-56).
 * Every request must carry a valid QStash signature; there is no bypass.
 */
export function createFulfillBookingHandler(deps: FulfillJobDeps = defaultDeps) {
  return async function POST(req: Request) {
    try {
      const signature = req.headers.get("upstash-signature")
      const rawBody = await req.text()
      let authorized = false
      if (signature) {
        authorized = await deps.verify({ signature, body: rawBody, url: req.url })
      }
      if (!authorized) {
        return NextResponse.json({ error: "Unauthorized fulfillment request" }, { status: 401 })
      }

      let parsed: { bookingId?: string } | null = null
      try {
        parsed = rawBody ? JSON.parse(rawBody) : null
      } catch {
        parsed = null
      }
      const bookingId = parsed?.bookingId
      if (!bookingId) {
        return NextResponse.json({ error: "Missing bookingId in job payload" }, { status: 400 })
      }

      const result = await deps.fulfill(bookingId)
      if (!result.success) {
        console.error(`[FULFILLMENT WORKER] Fulfillment failed for booking ${bookingId}:`, result.error)
        // 500 lets QStash retry automatically.
        return NextResponse.json(
          { success: false, error: result.error, bookingId },
          { status: 500 }
        )
      }
      return NextResponse.json({
        success: true,
        bookingId,
        zoomJoinUrl: result.zoomJoinUrl,
        zoomMeetingId: result.zoomMeetingId,
      })
    } catch (error: any) {
      console.error("[FULFILLMENT WORKER] Unexpected error:", error)
      return NextResponse.json(
        { error: error?.message || "Internal fulfillment error" },
        { status: 500 }
      )
    }
  }
}
