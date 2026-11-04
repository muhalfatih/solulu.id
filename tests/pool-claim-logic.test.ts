import { describe, it, expect } from "vitest"
import {
  canClaim,
  isPoolOfferable,
  keepsPoolReserve,
  isPastClaimCutoff,
  deriveStage,
  CLAIM_CUTOFF_HOURS,
} from "@/lib/booking-cycle"

const sessionStart = new Date("2026-11-10T10:00:00+07:00")
const base = {
  status: "confirmed" as const,
  alreadyClaimed: false,
  sessionStart,
  now: new Date("2026-11-09T10:00:00+07:00"),
  counselor: { typeAllowed: true, slotFree: true, onLeave: false },
}

describe("isPoolOfferable (ADR-0011)", () => {
  it("offers only while pool bookings < eligible free counselors", () => {
    expect(isPoolOfferable({ poolBookings: 0, eligibleCounselors: 1 })).toBe(true)
    expect(isPoolOfferable({ poolBookings: 1, eligibleCounselors: 2 })).toBe(true)
  })
  it("hides the option when the guarantee is not met", () => {
    expect(isPoolOfferable({ poolBookings: 0, eligibleCounselors: 0 })).toBe(false)
    expect(isPoolOfferable({ poolBookings: 2, eligibleCounselors: 2 })).toBe(false)
    expect(isPoolOfferable({ poolBookings: 3, eligibleCounselors: 2 })).toBe(false)
  })
})

describe("keepsPoolReserve (ADR-0011 guarantee on other paths)", () => {
  it("lets a slot be used when enough eligible counselors remain for every pool booking", () => {
    expect(keepsPoolReserve({ poolBookings: 0, eligibleCounselorsAfter: 0 })).toBe(true)
    expect(keepsPoolReserve({ poolBookings: 1, eligibleCounselorsAfter: 1 })).toBe(true)
    expect(keepsPoolReserve({ poolBookings: 2, eligibleCounselorsAfter: 3 })).toBe(true)
  })
  it("blocks using the last eligible free slot a paid pool booking depends on", () => {
    expect(keepsPoolReserve({ poolBookings: 1, eligibleCounselorsAfter: 0 })).toBe(false)
    expect(keepsPoolReserve({ poolBookings: 3, eligibleCounselorsAfter: 2 })).toBe(false)
  })
})

describe("canClaim", () => {
  it("allows an eligible counselor before the cutoff", () => {
    expect(canClaim(base).allowed).toBe(true)
  })
  it("closes at H-4 hours", () => {
    expect(CLAIM_CUTOFF_HOURS).toBe(4)
    const at = (h: number) => new Date(sessionStart.getTime() - h * 3600_000)
    expect(canClaim({ ...base, now: at(4.01) }).allowed).toBe(true)
    expect(canClaim({ ...base, now: at(4) }).allowed).toBe(false)
    expect(canClaim({ ...base, now: at(1) }).reason).toMatch(/H-4/)
    expect(isPastClaimCutoff(sessionStart, at(3))).toBe(true)
  })
  it("rejects when already taken, not confirmed, wrong type, busy slot, or on leave", () => {
    expect(canClaim({ ...base, alreadyClaimed: true }).reason).toMatch(/sudah diambil/i)
    expect(canClaim({ ...base, status: "pending_payment" }).allowed).toBe(false)
    expect(canClaim({ ...base, counselor: { ...base.counselor, typeAllowed: false } }).allowed).toBe(false)
    expect(canClaim({ ...base, counselor: { ...base.counselor, slotFree: false } }).allowed).toBe(false)
    expect(canClaim({ ...base, counselor: { ...base.counselor, onLeave: true } }).allowed).toBe(false)
  })
})

describe("deriveStage with pool bookings", () => {
  it("is Terkonfirmasi until a counselor is assigned", () => {
    const i = { status: "confirmed" as const, rescheduleCount: 0, hasReport: false }
    expect(deriveStage({ ...i, counselorAssigned: false })).toBe("terkonfirmasi")
    expect(deriveStage({ ...i, counselorAssigned: true })).toBe("ditugaskan")
  })
})
