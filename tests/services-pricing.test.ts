import { describe, it, expect } from "vitest"
import {
  activePrice,
  toServicePricingView,
  isServiceOfferedBy,
  listOfferedServices,
  startingFromView,
  startingPricesByCounselorType,
  resolveServiceSelection,
  type ServiceLike,
} from "../lib/services/pricing"

function makeService(overrides: Partial<ServiceLike> = {}): ServiceLike {
  return {
    id: "svc-sebaya",
    name: "Partner Cerita",
    slug: "partner-cerita",
    description: "Pendampingan emosional",
    basePrice: "85000.00",
    promoPrice: null,
    allowVoucher: true,
    overtimeRatePer30Min: "35000.00",
    basePayoutPercent: 70,
    overtimePayoutPercent: 80,
    allowedCounselorTypes: ["peer"],
    isActive: true,
    sortOrder: 1,
    ...overrides,
  }
}

describe("Layanan pricing (ADR-0010)", () => {
  it("uses the base price when there is no promo price", () => {
    expect(activePrice(makeService())).toBe(85000)
  })

  it("uses the promo price when it is set and lower than the base price", () => {
    expect(activePrice(makeService({ promoPrice: "49000.00" }))).toBe(49000)
  })

  it("ignores a promo price that is not below the base price", () => {
    expect(activePrice(makeService({ promoPrice: "90000.00" }))).toBe(85000)
  })

  it("builds a client price view with strike-through original when promo is active", () => {
    const view = toServicePricingView(makeService({ promoPrice: "49000.00" }))
    expect(view.activePrice).toBe(49000)
    expect(view.isPromoActive).toBe(true)
    expect(view.basePrice).toBe(85000)
    expect(view.overtimeRatePer30Min).toBe(35000)
    expect(view.activePriceFormatted).toContain("49.000")
    expect(view.originalPriceFormatted).toContain("85.000")
  })

  it("omits the original price when no promo is active", () => {
    const view = toServicePricingView(makeService())
    expect(view.isPromoActive).toBe(false)
    expect(view.originalPriceFormatted).toBeUndefined()
  })

  describe("which counselors can handle a Layanan", () => {
    const peer = { id: "c-peer", counselorType: "peer" as const }
    const psych = { id: "c-psy", counselorType: "psychologist" as const }

    it("offers a Layanan only to counselors whose type is allowed", () => {
      const clinical = makeService({ id: "svc-psy", allowedCounselorTypes: ["psychologist"] })
      expect(isServiceOfferedBy(clinical, psych, [])).toBe(true)
      expect(isServiceOfferedBy(clinical, peer, [])).toBe(false)
    })

    it("supports a Layanan that allows both counselor types", () => {
      const both = makeService({ allowedCounselorTypes: ["peer", "psychologist"] })
      expect(isServiceOfferedBy(both, peer, [])).toBe(true)
      expect(isServiceOfferedBy(both, psych, [])).toBe(true)
    })

    it("does not offer an inactive Layanan", () => {
      expect(isServiceOfferedBy(makeService({ isActive: false }), peer, [])).toBe(false)
    })

    it("does not offer a Layanan the admin switched off for that counselor", () => {
      expect(isServiceOfferedBy(makeService(), peer, ["svc-sebaya"])).toBe(false)
    })

    it("lists offered services in display order", () => {
      const a = makeService({ id: "a", name: "A", sortOrder: 2, allowedCounselorTypes: ["peer"] })
      const b = makeService({ id: "b", name: "B", sortOrder: 1, allowedCounselorTypes: ["peer"] })
      const c = makeService({ id: "c", name: "C", sortOrder: 0, allowedCounselorTypes: ["psychologist"] })
      expect(listOfferedServices([a, b, c], peer, []).map((s) => s.id)).toEqual(["b", "a"])
    })
  })

  describe("Mulai dari (starting-from) price", () => {
    it("is the cheapest active price among the views", () => {
      const views = [
        toServicePricingView(makeService({ id: "x", basePrice: "150000", promoPrice: null })),
        toServicePricingView(makeService({ id: "y", basePrice: "85000", promoPrice: "49000" })),
      ]
      expect(startingFromView(views)?.serviceId).toBe("y")
    })

    it("is null when there is nothing to offer (empty state, no fallback price)", () => {
      expect(startingFromView([])).toBeNull()
    })
  })

  describe("starting-from price per Tipe Konselor (landing, pricing, screening)", () => {
    const sebaya = makeService({ id: "s", basePrice: "85000", promoPrice: "49000", allowedCounselorTypes: ["peer"] })
    const psikolog = makeService({ id: "p", basePrice: "150000", allowedCounselorTypes: ["psychologist"] })
    const praNikah = makeService({ id: "n", basePrice: "120000", allowedCounselorTypes: ["psychologist"] })

    it("picks the cheapest active Layanan allowed for each type", () => {
      const res = startingPricesByCounselorType([sebaya, psikolog, praNikah])
      expect(res.peer?.serviceId).toBe("s")
      expect(res.peer?.activePrice).toBe(49000)
      expect(res.psychologist?.serviceId).toBe("n")
    })

    it("ignores inactive Layanan and returns null for a type with none", () => {
      const res = startingPricesByCounselorType([sebaya, { ...psikolog, isActive: false }])
      expect(res.psychologist).toBeNull()
      expect(res.peer?.serviceId).toBe("s")
    })
  })

  describe("service selection at checkout", () => {
    const one = [toServicePricingView(makeService({ id: "only" }))]
    const two = [
      toServicePricingView(makeService({ id: "p1" })),
      toServicePricingView(makeService({ id: "p2", name: "Pra-Nikah", slug: "pra-nikah" })),
    ]

    it("auto-selects when the counselor offers exactly one Layanan", () => {
      expect(resolveServiceSelection(one, undefined)?.serviceId).toBe("only")
    })

    it("requires an explicit choice when several are offered", () => {
      expect(resolveServiceSelection(two, undefined)).toBeNull()
      expect(resolveServiceSelection(two, "p2")?.serviceId).toBe("p2")
    })

    it("rejects a requested Layanan the counselor does not offer", () => {
      expect(resolveServiceSelection(two, "zzz")).toBeNull()
    })
  })
})
