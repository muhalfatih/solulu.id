import { describe, it, expect, vi } from "vitest"
import {
  executeCreatePoolBooking,
  listPoolSlotOptions,
  POOL_UNAVAILABLE_MESSAGE,
  type CreatePoolBookingParams,
  type PoolCheckoutDeps,
} from "@/lib/booking/pool-checkout"
import { fulfillSession } from "@/lib/fulfillment/fulfill"
import { sendPoolPendingEmail } from "@/lib/fulfillment/pool-emails"
import { isPoolHoldExpired, planPoolHoldExpiry } from "@/lib/cron/cleanup"
import { mapBookingRow } from "@/app/admin/bookings/map-row"
import { NO_COUNSELOR_LABEL, poolSlotDisplay } from "@/lib/pool/display"
import type { ServiceLike } from "@/lib/services/pricing"

// 2026-11-03 08:00 WIB; slot 4 (14.00) on 11-10 is well past the lead time.
const NOW = new Date("2026-11-03T08:00:00+07:00")
const DATE = "2026-11-10"

const service: ServiceLike = {
  id: "svc-1",
  name: "Sesi Konseling",
  slug: "sesi",
  description: null,
  basePrice: "100000",
  promoPrice: "80000",
  allowVoucher: true,
  overtimeRatePer30Min: "35000",
  basePayoutPercent: 70,
  overtimePayoutPercent: 70,
  allowedCounselorTypes: ["peer", "psychologist"],
  isActive: true,
  sortOrder: 1,
}

const patient = {
  patientName: "Budi Santoso",
  patientEmail: "budi@example.com",
  patientEmailConfirm: "budi@example.com",
  patientPhone: "08123456789",
  paymentProvider: "xendit" as const,
}

function deps(over: Partial<PoolCheckoutDeps> = {}) {
  const created: CreatePoolBookingParams[] = []
  const d: PoolCheckoutDeps = {
    now: () => NOW,
    getService: async () => service,
    getOffer: async () => ({ offerable: true, poolBookings: 0, eligibleCounselors: 2 }),
    checkExistingPendingHold: async () => false,
    getSlotLoad: async () => 0,
    getZoomCapacity: async () => 10,
    getVoucher: async () => null,
    createPoolBooking: async (p) => {
      created.push(p)
      return { bookingId: "b-pool", transactionId: "t-pool" }
    },
    createInvoice: vi.fn(async () => ({ id: "inv-1", invoiceUrl: "https://checkout.xendit.test/inv-1" })) as never,
    ...over,
  }
  return { d, created }
}

describe("Konselor Bebas offer visibility (ADR-0011)", () => {
  it("lists only slots where the guarantee holds", async () => {
    const offerable = new Set([2, 5])
    const options = await listPoolSlotOptions(
      { date: DATE, serviceId: "svc-1" },
      {
        now: () => NOW,
        getOffer: async ({ slotIndex }) => ({
          offerable: offerable.has(slotIndex),
          poolBookings: 0,
          eligibleCounselors: 1,
        }),
      }
    )
    expect(options.map((o) => o.slotIndex)).toEqual([2, 5])
    expect(options[0].timeRange).toContain("10:00")
  })

  it("hides every slot when no counselor is guaranteed", async () => {
    const options = await listPoolSlotOptions(
      { date: DATE, serviceId: "svc-1" },
      { now: () => NOW, getOffer: async () => ({ offerable: false, poolBookings: 1, eligibleCounselors: 1 }) }
    )
    expect(options).toEqual([])
  })

  it("never offers slots already inside the booking lead time", async () => {
    const getOffer = vi.fn(async () => ({ offerable: true, poolBookings: 0, eligibleCounselors: 3 }))
    const options = await listPoolSlotOptions(
      { date: "2026-11-03", serviceId: "svc-1" },
      { now: () => new Date("2026-11-03T13:00:00+07:00"), getOffer }
    )
    // 13:00 + 4h lead => only slots starting 17:00 or later (slot 6 at 18:00, slot 7 at 20:00).
    expect(options.map((o) => o.slotIndex)).toEqual([6, 7])
  })
})

describe("Pool checkout creation", () => {
  it("creates a pool booking with the Layanan snapshot and a Xendit invoice", async () => {
    const { d, created } = deps()
    const res = await executeCreatePoolBooking({ ...patient, date: DATE, slotIndex: 4, serviceId: "svc-1" }, d)
    expect(res.success).toBe(true)
    expect(res.data?.paymentUrl).toBe("https://checkout.xendit.test/inv-1")
    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({
      date: DATE,
      slotIndex: 4,
      serviceId: "svc-1",
      basePriceSnapshot: 80000,
      netAmount: 80000,
    })
    const invoice = (d.createInvoice as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(invoice.externalId).toBe("txn_t-pool")
    expect(invoice.amount).toBe(80000)
  })

  it("refuses when the guarantee no longer holds, before and during the insert", async () => {
    const hidden = deps({ getOffer: async () => ({ offerable: false, poolBookings: 2, eligibleCounselors: 2 }) })
    const a = await executeCreatePoolBooking({ ...patient, date: DATE, slotIndex: 4, serviceId: "svc-1" }, hidden.d)
    expect(a).toEqual({ success: false, error: POOL_UNAVAILABLE_MESSAGE })
    expect(hidden.created).toHaveLength(0)

    // Lost the race: the atomic insert re-checks the guarantee and returns null.
    const raced = deps({ createPoolBooking: async () => null })
    const b = await executeCreatePoolBooking({ ...patient, date: DATE, slotIndex: 4, serviceId: "svc-1" }, raced.d)
    expect(b.error).toBe(POOL_UNAVAILABLE_MESSAGE)
    expect(raced.d.createInvoice).not.toHaveBeenCalled()
  })

  it("rejects a full Zoom slot, inactive Layanan and an existing hold", async () => {
    const full = deps({ getSlotLoad: async () => 10 })
    expect((await executeCreatePoolBooking({ ...patient, date: DATE, slotIndex: 4, serviceId: "svc-1" }, full.d)).success).toBe(false)

    const inactive = deps({ getService: async () => ({ ...service, isActive: false }) })
    expect((await executeCreatePoolBooking({ ...patient, date: DATE, slotIndex: 4, serviceId: "svc-1" }, inactive.d)).success).toBe(false)

    const held = deps({ checkExistingPendingHold: async () => true })
    expect((await executeCreatePoolBooking({ ...patient, date: DATE, slotIndex: 4, serviceId: "svc-1" }, held.d)).success).toBe(false)
  })
})

describe("Fulfillment of a pool booking without a counselor", () => {
  const unclaimed = {
    booking: {
      id: "b-pool",
      bookingCode: "SL-POOL01",
      accessToken: "tok_pool",
      status: "confirmed",
      patientName: "Budi Santoso",
      patientEmail: "budi@example.com",
      initialNotes: null,
      poolDate: DATE,
      poolSlotIndex: 4,
      zoomJoinUrl: null,
      zoomStartUrl: null,
    },
    counselor: null,
    schedule: null,
  }

  it("holds at confirmed with no Zoom and sends the 'paid, counselor pending' email", async () => {
    const createMeeting = vi.fn()
    const sendPoolPendingEmail = vi.fn(async () => ({ success: true }))
    const sendPatientEmail = vi.fn(async () => ({ success: true }))
    const res = await fulfillSession(
      "b-pool",
      {},
      {
        fetchBookingData: async () => unclaimed,
        zoomClient: { createMeeting: createMeeting as never },
        notifier: { sendPoolPendingEmail, sendPatientEmail },
      }
    )
    expect(res).toMatchObject({ success: true, awaitingCounselor: true })
    expect(createMeeting).not.toHaveBeenCalled()
    expect(sendPatientEmail).not.toHaveBeenCalled()
    expect(sendPoolPendingEmail).toHaveBeenCalledWith(
      expect.objectContaining({ patientEmail: "budi@example.com", accessToken: "tok_pool" })
    )
  })

  it("fails clearly when a booking has neither counselor nor pool slot", async () => {
    const res = await fulfillSession(
      "b-x",
      {},
      { fetchBookingData: async () => ({ booking: { ...unclaimed.booking, poolDate: null, poolSlotIndex: null }, counselor: null, schedule: null }) }
    )
    expect(res.success).toBe(false)
  })

  it("after claim/assign the same call creates Zoom and emails the counselor's name", async () => {
    const sendPatientEmail = vi.fn(async () => ({ success: true }))
    const claimed = {
      booking: { ...unclaimed.booking, counselorId: "c-1" },
      counselor: { id: "c-1", fullName: "Sarah Annisa, M.Psi.", email: "sarah@solulu.id" },
      schedule: { id: "s-1", date: DATE, slotIndex: 4, startTime: "14:00:00", endTime: "16:00:00" },
    }
    const res = await fulfillSession(
      "b-pool",
      {},
      {
        fetchBookingData: async () => claimed,
        getZoomAccount: async () => ({ id: "z1", name: "Zoom 1", accountNumber: 1, hostKey: "1" }),
        zoomClient: {
          getAccessToken: async () => "tok",
          createMeeting: async () => ({ meetingId: "1", joinUrl: "https://zoom.us/j/1", startUrl: "https://zoom.us/s/1" }),
        },
        notifier: { sendPatientEmail, sendCounselorEmail: async () => ({ success: true }) },
      }
    )
    expect(res.success).toBe(true)
    expect(sendPatientEmail).toHaveBeenCalledWith(
      expect.objectContaining({ counselorName: "Sarah Annisa, M.Psi.", accessToken: "tok_pool" })
    )
  })

  it("the pending email posts to Resend with the session link", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ id: "em1" }), { status: 200 }))
    const res = await sendPoolPendingEmail(
      { patientEmail: "budi@example.com", patientName: "<b>Budi</b>", date: "Selasa", timeRange: "14.00 – 16.00 WIB", accessToken: "tok_pool" },
      { fetchFn: fetchFn as never, env: { RESEND_API_KEY: "re_live_key_123", RESEND_FROM_EMAIL: "Solulu <no-reply@solulu.id>" } as never }
    )
    expect(res.success).toBe(true)
    const body = JSON.parse((fetchFn.mock.calls[0] as unknown as [string, { body: string }])[1].body)
    expect(body.to).toEqual(["budi@example.com"])
    expect(body.html).toContain("/session/tok_pool")
    expect(body.html).not.toContain("<b>Budi</b>")
  })
})

describe("Expired holds, admin display and stage for pool bookings", () => {
  it("expires a pool hold only after the hold window", () => {
    const created = new Date("2026-11-03T08:00:00+07:00")
    expect(isPoolHoldExpired(created, new Date("2026-11-03T08:10:00+07:00"))).toBe(false)
    expect(isPoolHoldExpired(created, new Date("2026-11-03T08:20:00+07:00"))).toBe(true)
  })

  it("plans booking expiry, PENDING transaction expiry and voucher rollback", () => {
    const plan = planPoolHoldExpiry([
      { bookingId: "b1", transactionId: "t1", transactionStatus: "PENDING", voucherId: "v1" },
      { bookingId: "b2", transactionId: "t2", transactionStatus: "EXPIRED", voucherId: "v2" },
      { bookingId: "b3", transactionId: null, transactionStatus: null, voucherId: null },
    ])
    expect(plan.bookingIds).toEqual(["b1", "b2", "b3"])
    expect(plan.transactionIds).toEqual(["t1"])
    expect(plan.voucherIds).toEqual(["v1"])
  })

  it("admin booking row shows the pool slot and 'Belum ada konselor'", () => {
    expect(poolSlotDisplay({ poolDate: DATE, poolSlotIndex: 4 })).toMatchObject({ startTime: "14:00", endTime: "16:00" })
    const row = mapBookingRow({
      booking: {
        id: "b-pool",
        bookingCode: "SL-POOL01",
        accessToken: "t",
        patientName: "Budi",
        patientEmail: "b@x.id",
        patientPhone: "0812",
        status: "confirmed",
        counselorId: null,
        scheduleId: null,
        poolDate: DATE,
        poolSlotIndex: 4,
        rescheduleCount: 0,
        adminRescheduleCount: 0,
        createdAt: NOW,
      } as never,
      counselor: null,
      schedule: null,
      report: null,
    })
    expect(row.counselorName).toBe(NO_COUNSELOR_LABEL)
    expect(row.scheduleDate).toBe(DATE)
    expect(row.timeRange).toBe("14:00 - 16:00")
    expect(row.stage).toBe("terkonfirmasi")
    expect(row.canMarkNoShow).toBe(false)
  })
})
