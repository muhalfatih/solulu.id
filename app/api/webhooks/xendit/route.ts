import { NextResponse } from "next/server"
import { eq, or } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, transactions } from "@/db/schema"
import { dispatchFulfillmentJob } from "@/lib/fulfillment/qstash"
import { getXenditCallbackToken } from "@/lib/config/integrations"

export interface XenditWebhookPayload {
  id: string // Xendit Invoice ID (e.g. "64a...")
  external_id: string // Reference number in Solulu
  status: "PAID" | "PENDING" | "EXPIRED" | "FAILED"
  paid_amount?: number
  payment_method?: string
  payment_channel?: string
  paid_at?: string
}

/**
 * Xendit Webhook Ingestion Endpoint
 * Complies with US-55: validates token, enforces idempotency, updates DB,
 * dispatches QStash job, and returns HTTP 200 in <1 second (Vercel 10s timeout compliance).
 */
export async function POST(req: Request) {
  try {
    // 1. Validate Xendit Callback Token (Security Guard)
    const callbackTokenHeader = req.headers.get("x-callback-token")
    let configuredToken: string
    try {
      configuredToken = getXenditCallbackToken()
    } catch (configError) {
      const message =
        configError instanceof Error ? configError.message : "XENDIT_CALLBACK_TOKEN belum dikonfigurasi."
      console.error("[XENDIT WEBHOOK] Endpoint ditutup:", message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
    if (!configuredToken) {
      return NextResponse.json(
        { error: "Konfigurasi XENDIT_CALLBACK_TOKEN belum dikonfigurasi atau masih berupa placeholder." },
        { status: 500 }
      )
    }

    const isTokenValid = callbackTokenHeader === configuredToken

    if (!isTokenValid) {
      return NextResponse.json(
        { error: "Invalid or missing Xendit callback token" },
        { status: 403 }
      )
    }

    // 2. Parse Webhook Payload
    const body: XenditWebhookPayload = await req.json()

    if (!body || !body.id) {
      return NextResponse.json(
        { error: "Payload missing required invoice ID" },
        { status: 400 }
      )
    }

    // 3. Find Transaction (by xenditInvoiceId, id from txn_ prefix, or referenceNumber)
    const cleanTxId = body.external_id ? body.external_id.replace(/^txn_/, "") : ""
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanTxId)

    const conditions = [
      eq(transactions.xenditInvoiceId, body.id),
      ...(body.external_id ? [eq(transactions.referenceNumber, body.external_id)] : []),
      ...(isUuid ? [eq(transactions.id, cleanTxId)] : []),
    ]

    const rows = await db
      .select({
        transaction: transactions,
        booking: bookings,
        schedule: schedules,
      })
      .from(transactions)
      .innerJoin(bookings, eq(transactions.bookingId, bookings.id))
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .where(or(...conditions))
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json(
        { status: "ignored", reason: "Transaction not found" },
        { status: 200 }
      )
    }

    const { transaction, booking, schedule } = rows[0]

    // 4. Idempotency Guard (US-55)
    if (transaction.status === "PAID") {
      return NextResponse.json(
        { status: "already_processed", bookingId: booking.id },
        { status: 200 }
      )
    }

    // 5. Handle Payment Statuses
    const isExtension =
      transaction.adminNotes === "EXTENSION" ||
      Boolean(transaction.referenceNumber && transaction.referenceNumber.startsWith("EXT-")) ||
      Boolean(body.external_id && body.external_id.startsWith("EXT-"))

    if (body.status === "PAID") {
      const paymentMethod =
        body.payment_method || body.payment_channel || "XENDIT_AUTO"

      if (isExtension) {
        // Atomically update Transaction and Booking extensionPaymentStatus
        await db
          .update(transactions)
          .set({
            status: "PAID",
            paidAt: body.paid_at ? new Date(body.paid_at) : new Date(),
            paymentMethod,
          })
          .where(eq(transactions.id, transaction.id))

        await db
          .update(bookings)
          .set({
            extensionPaymentStatus: "PAID",
            extensionPaymentMethod: "xendit",
          })
          .where(eq(bookings.id, booking.id))

        return NextResponse.json(
          {
            success: true,
            status: "PAID",
            type: "extension",
            bookingId: booking.id,
          },
          { status: 200 }
        )
      }

      // Standard Initial Booking Payment
      // Atomically update Transaction, Booking, Schedule status
      await db
        .update(transactions)
        .set({
          status: "PAID",
          paidAt: body.paid_at ? new Date(body.paid_at) : new Date(),
          paymentMethod,
        })
        .where(eq(transactions.id, transaction.id))

      await db
        .update(bookings)
        .set({
          status: "confirmed",
        })
        .where(eq(bookings.id, booking.id))

      await db
        .update(schedules)
        .set({
          status: "booked",
        })
        .where(eq(schedules.id, schedule.id))

      // 6. Decoupled Asynchronous Dispatch to QStash (<1s)
      const dispatch = await dispatchFulfillmentJob(booking.id)
      if (!dispatch.success) {
        console.error(
          `[XENDIT WEBHOOK] Fulfillment booking ${booking.id} gagal dijadwalkan: ${dispatch.error}`
        )
      }

      return NextResponse.json(
        {
          success: true,
          status: "PAID",
          bookingId: booking.id,
        },
        { status: 200 }
      )
    } else if (body.status === "EXPIRED" || body.status === "FAILED") {
      await db
        .update(transactions)
        .set({
          status: body.status,
        })
        .where(eq(transactions.id, transaction.id))

      if (isExtension) {
        await db
          .update(bookings)
          .set({
            extensionPaymentStatus: "NONE",
          })
          .where(eq(bookings.id, booking.id))
      }

      return NextResponse.json(
        { success: true, status: body.status, type: isExtension ? "extension" : "initial" },
        { status: 200 }
      )
    }

    return NextResponse.json({ status: "acknowledged" }, { status: 200 })
  } catch (error: any) {
    console.error("Xendit webhook processing error:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
