import { NextResponse } from "next/server"
import { fulfillBooking } from "@/lib/fulfillment/fulfill"

/**
 * Asynchronous Fulfillment Worker triggered by Upstash QStash (US-56).
 * Allocates Zoom Pro host, creates Zoom meeting room, and sends confirmation emails.
 */
export async function POST(req: Request) {
  try {
    // 1. Signature / Authorization verification
    const qstashSignature = req.headers.get("upstash-signature")
    const internalSecret = req.headers.get("x-solulu-job-secret")
    const configuredSecret = process.env.CRON_SECRET || process.env.QSTASH_TOKEN

    const isAuthorized =
      Boolean(qstashSignature) ||
      (configuredSecret && internalSecret === configuredSecret) ||
      process.env.NODE_ENV === "test" ||
      process.env.NODE_ENV === "development"

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized fulfillment request" },
        { status: 401 }
      )
    }

    // 2. Parse job payload
    const body = await req.json()
    const { bookingId } = body || {}

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId in job payload" },
        { status: 400 }
      )
    }

    // 3. Execute fulfillment
    const result = await fulfillBooking(bookingId)

    if (!result.success) {
      console.error(
        `[FULFILLMENT WORKER] Fulfillment failed for booking ${bookingId}:`,
        result.error
      )
      // Return 500 to let QStash trigger automatic retry (up to 3 times per spec)
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
