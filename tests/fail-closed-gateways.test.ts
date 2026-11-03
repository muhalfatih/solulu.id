import { describe, it, expect, vi, afterEach } from "vitest"
import { createXenditInvoice, getXenditInvoice } from "@/lib/xendit"
import {
  sendPatientConfirmationEmail,
  sendCounselorNotificationEmail,
  sendCounselorWelcomeCredentialsEmail,
} from "@/lib/fulfillment/emails"
import { dispatchFulfillmentJob } from "@/lib/fulfillment/qstash"
import { handleCronRequest } from "@/lib/cron/handler"
import { getR2Client } from "@/lib/r2"
import { POST as xenditWebhookHandler } from "@/app/api/webhooks/xendit/route"
import { executeCreateGuestBooking } from "@/lib/booking/checkout"

const prod = { NODE_ENV: "production" }

const invoiceParams = {
  externalId: "txn_1",
  amount: 150000,
  payerEmail: "klien@contoh.id",
  description: "Konseling",
  successRedirectUrl: "https://solulu.id/ok",
  failureRedirectUrl: "https://solulu.id/fail",
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("Xendit gateway fails closed", () => {
  it("refuses to create an invoice without a Xendit key and never calls the network", async () => {
    const fetchFn = vi.fn()
    await expect(createXenditInvoice(invoiceParams, { env: prod, fetchFn })).rejects.toThrow(
      /XENDIT_SECRET_KEY/
    )
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it("rejects the legacy mock key as a placeholder", async () => {
    const fetchFn = vi.fn()
    await expect(
      createXenditInvoice(invoiceParams, { env: { ...prod, XENDIT_SECRET_KEY: "mock" }, fetchFn })
    ).rejects.toThrow(/XENDIT_SECRET_KEY/)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it("creates a real invoice through the injected transport when the key is configured", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "inv_real_1",
        external_id: "txn_1",
        status: "PENDING",
        invoice_url: "https://checkout.xendit.co/web/inv_real_1",
        expiry_date: "2026-11-02T10:00:00.000Z",
        amount: 150000,
      }),
    })
    const invoice = await createXenditInvoice(invoiceParams, {
      env: { ...prod, XENDIT_SECRET_KEY: "xnd_production_key" },
      fetchFn: fetchFn as unknown as typeof fetch,
    })
    expect(invoice.id).toBe("inv_real_1")
    expect(invoice.invoiceUrl).toBe("https://checkout.xendit.co/web/inv_real_1")
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it("never fabricates a PAID invoice for a mock_inv_ id", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    const result = await getXenditInvoice("mock_inv_abc", {
      env: { ...prod, XENDIT_SECRET_KEY: "xnd_production_key" },
      fetchFn: fetchFn as unknown as typeof fetch,
    })
    expect(result).toBeNull()
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it("checkout without a Xendit key fails with a clear message and creates no booking", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("XENDIT_SECRET_KEY", "")
    const reserve = vi.fn()
    const result = await executeCreateGuestBooking(
      {
        counselorId: "11111111-1111-4111-8111-111111111111",
        scheduleId: "22222222-2222-4222-8222-222222222222",
        patientName: "Budi Santoso",
        patientEmail: "budi@contoh.id",
        patientEmailConfirm: "budi@contoh.id",
        patientPhone: "081234567890",
        paymentProvider: "xendit",
      },
      { reserveSlotAndCreateBooking: reserve as never }
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain("XENDIT_SECRET_KEY")
    expect(reserve).not.toHaveBeenCalled()
  })
})

describe("Email senders report failure instead of fake success", () => {
  const patient = {
    patientEmail: "klien@contoh.id",
    patientName: "Klien",
    counselorName: "Konselor",
    date: "Senin, 2 November 2026",
    timeRange: "10:00 - 11:30 WIB",
    accessToken: "tok",
  }
  const counselor = {
    counselorEmail: "k@solulu.id",
    counselorName: "Konselor",
    patientName: "Klien",
    date: "Senin, 2 November 2026",
    timeRange: "10:00 - 11:30 WIB",
  }
  const welcome = {
    counselorEmail: "k@solulu.id",
    counselorName: "Konselor",
    temporaryPassword: "Pw123456!",
    counselorType: "psychologist" as const,
  }

  it.each([
    ["patient", () => sendPatientConfirmationEmail(patient, { env: prod, fetchFn: vi.fn() as never })],
    ["counselor", () => sendCounselorNotificationEmail(counselor, { env: prod, fetchFn: vi.fn() as never })],
    ["welcome", () => sendCounselorWelcomeCredentialsEmail(welcome, { env: prod, fetchFn: vi.fn() as never })],
  ])("%s email without RESEND_API_KEY returns success=false naming the variable", async (_n, send) => {
    const result = await send()
    expect(result.success).toBe(false)
    expect(result.id).toBeUndefined()
    expect(result.error).toContain("RESEND_API_KEY")
  })

  it("does not call the network when the key is the legacy 'mock' placeholder", async () => {
    const fetchFn = vi.fn()
    const result = await sendPatientConfirmationEmail(patient, {
      env: { ...prod, RESEND_API_KEY: "mock" },
      fetchFn: fetchFn as never,
    })
    expect(result.success).toBe(false)
    expect(fetchFn).not.toHaveBeenCalled()
  })
})

describe("QStash dispatcher reports failure when unconfigured", () => {
  it("returns success=false naming QSTASH_TOKEN and never runs a local fulfillment path", async () => {
    const fetchFn = vi.fn()
    const directFulfillFn = vi.fn()
    const res = await dispatchFulfillmentJob("booking-1", {
      env: prod,
      fetchFn: fetchFn as never,
      directFulfillFn: directFulfillFn as never,
    })
    expect(res.success).toBe(false)
    expect(res).not.toHaveProperty("directExecuted")
    expect(res.messageId).toBeUndefined()
    expect(res.error).toContain("QSTASH_TOKEN")
    expect(fetchFn).not.toHaveBeenCalled()
    expect(directFulfillFn).not.toHaveBeenCalled()
  })
})

describe("Cron endpoint rejects when the secret is not configured", () => {
  const req = (token: string) =>
    new Request("http://localhost:3000/api/cron/cleanup-slots", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })

  it("returns 500 when CRON_SECRET is missing, even for the legacy mock token", async () => {
    const cleanupFn = vi.fn()
    const res = await handleCronRequest(req("mock-cron-secret"), {
      env: prod,
      cleanupFn: cleanupFn as never,
    })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toContain("CRON_SECRET")
    expect(cleanupFn).not.toHaveBeenCalled()
  })

  it("returns 500 when CRON_SECRET is a placeholder", async () => {
    const res = await handleCronRequest(req("mock"), { env: { ...prod, CRON_SECRET: "mock" } })
    expect(res.status).toBe(500)
  })

  it("returns 500 even under NODE_ENV=test when no secret is configured", async () => {
    const res = await handleCronRequest(req("test-cron-secret"), { env: { NODE_ENV: "test" } })
    expect(res.status).toBe(500)
  })

  it("rejects mock-cron-secret with 401 when a real secret is configured", async () => {
    const res = await handleCronRequest(req("mock-cron-secret"), {
      env: { ...prod, CRON_SECRET: "a-real-secret-value" },
    })
    expect(res.status).toBe(401)
  })
})

describe("Xendit webhook rejects when its token is not configured", () => {
  const webhook = (token: string) =>
    new Request("http://localhost:3000/api/webhooks/xendit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-callback-token": token },
      body: JSON.stringify({ id: "inv_1", status: "PAID" }),
    })

  it("returns 500 without XENDIT_CALLBACK_TOKEN and does not accept the mock token", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("XENDIT_CALLBACK_TOKEN", "")
    const res = await xenditWebhookHandler(webhook("mock-callback-token"))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toContain("XENDIT_CALLBACK_TOKEN")
  })

  it("returns 403 for a wrong token when configured", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("XENDIT_CALLBACK_TOKEN", "real-callback-token")
    const res = await xenditWebhookHandler(webhook("mock-callback-token"))
    expect(res.status).toBe(403)
  })
})

describe("R2 client fails closed", () => {
  it("throws naming R2_ACCESS_KEY_ID when credentials are missing", () => {
    expect(() => getR2Client(undefined, prod)).toThrow(/R2_ACCESS_KEY_ID/)
  })

  it("builds a client when credentials and endpoint are configured", () => {
    const client = getR2Client(undefined, {
      ...prod,
      R2_ACCESS_KEY_ID: "ak",
      R2_SECRET_ACCESS_KEY: "sk",
      R2_ACCOUNT_ID: "acc",
    })
    expect(client).toBeDefined()
  })
})
