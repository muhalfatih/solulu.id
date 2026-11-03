import { createHash, createHmac } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import { createFulfillBookingHandler } from "@/lib/fulfillment/job-handler"
import { verifyQstashSignature } from "@/lib/fulfillment/qstash-verify"

const URL_ = "https://solulu.test/api/jobs/fulfill-booking"
const b64 = (v: Buffer | string) => Buffer.from(v).toString("base64url")

function sign(key: string, body: string, over: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = b64(
    JSON.stringify({
      iss: "Upstash",
      sub: URL_,
      exp: now + 300,
      nbf: now - 10,
      body: createHash("sha256").update(body).digest("base64url"),
      ...over,
    })
  )
  const sig = createHmac("sha256", key).update(`${header}.${payload}`).digest("base64url")
  return `${header}.${payload}.${sig}`
}

const keys = { current: "cur-key", next: "next-key" }

describe("verifyQstashSignature", () => {
  const body = JSON.stringify({ bookingId: "b1" })
  it("accepts a valid signature from the current or next key", () => {
    expect(verifyQstashSignature({ signature: sign("cur-key", body), body, url: URL_, keys })).toBe(true)
    expect(verifyQstashSignature({ signature: sign("next-key", body), body, url: URL_, keys })).toBe(true)
  })
  it("rejects arbitrary, wrong-key, tampered-body, expired and wrong-url signatures", () => {
    const v = (signature: string, b = body, url = URL_) =>
      verifyQstashSignature({ signature, body: b, url, keys })
    expect(v("anything")).toBe(false)
    expect(v(sign("other", body))).toBe(false)
    expect(v(sign("cur-key", body), '{"bookingId":"b2"}')).toBe(false)
    expect(v(sign("cur-key", body, { exp: 1 }))).toBe(false)
    expect(v(sign("cur-key", body), body, "https://evil.test/x")).toBe(false)
  })
})

describe("fulfill-booking handler auth", () => {
  const mk = (headers: Record<string, string>, body: unknown = { bookingId: "b1" }) =>
    new Request(URL_, { method: "POST", headers, body: JSON.stringify(body) })

  it("returns 401 when verifier rejects, even with a signature header, and never fulfills", async () => {
    const fulfill = vi.fn()
    const handler = createFulfillBookingHandler({ verify: async () => false, fulfill })
    const res = await handler(mk({ "upstash-signature": "junk" }))
    expect(res.status).toBe(401)
    expect(fulfill).not.toHaveBeenCalled()
  })

  it("returns 401 without a signature header", async () => {
    const handler = createFulfillBookingHandler({ verify: async () => true, fulfill: vi.fn() })
    expect((await handler(mk({}))).status).toBe(401)
  })

  it("fulfills when verified; 400 on missing bookingId", async () => {
    const fulfill = vi.fn(async () => ({ success: true, zoomJoinUrl: "u", zoomMeetingId: "m" }))
    const handler = createFulfillBookingHandler({ verify: async () => true, fulfill })
    const ok = await handler(mk({ "upstash-signature": "s" }))
    expect(ok.status).toBe(200)
    expect(fulfill).toHaveBeenCalledWith("b1")
    expect((await handler(mk({ "upstash-signature": "s" }, {}))).status).toBe(400)
  })
})
