import { describe, it, expect, vi } from "vitest"
import {
  getPlatformPricing,
  updatePlatformPricing,
  DEFAULT_PLATFORM_PRICING,
} from "../lib/pricing/platform-pricing"
import {
  getPlatformPricingAction,
  updateRolePricingAction,
} from "../app/admin/pricing/actions"
import {
  getCounselorsCatalogAction,
  getCounselorByIdAction,
} from "../app/counselors/actions"
import { formatRupiah } from "../lib/booking/checkout"

describe("Platform Pricing Synchronization & Admin Actions", () => {
  it("provides reliable default platform pricing for peer and psychologist", async () => {
    const pricing = await getPlatformPricing()
    expect(pricing).toBeDefined()
    expect(pricing.peer.counselorType).toBe("peer")
    expect(pricing.peer.basePrice).toBeGreaterThan(0)
    expect(pricing.peer.promoPrice).toBeGreaterThan(0)

    expect(pricing.psychologist.counselorType).toBe("psychologist")
    expect(pricing.psychologist.basePrice).toBeGreaterThan(0)
    expect(pricing.psychologist.promoPrice).toBeGreaterThan(0)
  })

  it("updates platform pricing in-memory when database is unavailable", async () => {
    const updatedPeer = await updatePlatformPricing("peer", {
      basePrice: 90000,
      promoPrice: 50000,
      isSaleActive: true,
      allowVoucher: false,
    })

    expect(updatedPeer.basePrice).toBe(90000)
    expect(updatedPeer.promoPrice).toBe(50000)
    expect(updatedPeer.isSaleActive).toBe(true)
    expect(updatedPeer.allowVoucher).toBe(false)

    const currentPricing = await getPlatformPricing()
    expect(currentPricing.peer.basePrice).toBe(90000)
    expect(currentPricing.peer.promoPrice).toBe(50000)
  })

  it("executes getPlatformPricingAction and returns successful envelope", async () => {
    const res = await getPlatformPricingAction()
    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(res.data.peer).toBeDefined()
    expect(res.data.psychologist).toBeDefined()
  })

  it("executes updateRolePricingAction and updates role pricing correctly", async () => {
    const res = await updateRolePricingAction("psikolog", {
      regularPrice: 160000,
      salePrice: 135000,
      isSaleActive: true,
      allowVoucher: true,
    })

    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(res.data?.basePrice).toBe(160000)
    expect(res.data?.promoPrice).toBe(135000)
    expect(res.message).toContain("Psikolog Klinis")

    const current = await getPlatformPricing()
    expect(current.psychologist.basePrice).toBe(160000)
    expect(current.psychologist.promoPrice).toBe(135000)
  })

  it("formats pricing amounts correctly for public landing and pricing pages", () => {
    expect(formatRupiah(85000)).toMatch(/Rp\s*85\.000/)
    expect(formatRupiah(130000)).toMatch(/Rp\s*130\.000/)
    expect(formatRupiah(49000)).toMatch(/Rp\s*49\.000/)
  })

  it("synchronizes pricing across every individual counselor in the catalog", async () => {
    // 1. Set specific platform pricing
    await updatePlatformPricing("peer", {
      basePrice: 80000,
      promoPrice: 55000,
      isSaleActive: true,
      allowVoucher: false,
    })
    await updatePlatformPricing("psychologist", {
      basePrice: 175000,
      promoPrice: 140000,
      isSaleActive: true,
      allowVoucher: true,
    })

    // 2. Fetch all counselors catalog
    const catalogRes = await getCounselorsCatalogAction({ type: "all" })
    expect(catalogRes.success).toBe(true)
    expect(catalogRes.data).toBeDefined()
    expect(catalogRes.data!.length).toBeGreaterThan(0)

    // 3. Verify every counselor receives identical pricing matching their role
    for (const c of catalogRes.data!) {
      if (c.counselorType === "peer") {
        expect(c.pricing.displayPrice).toBe(55000)
        expect(c.pricing.basePrice).toBe(80000)
        expect(c.pricing.displayPriceFormatted).toMatch(/Rp\s*55\.000/)
      } else if (c.counselorType === "psychologist") {
        expect(c.pricing.displayPrice).toBe(140000)
        expect(c.pricing.basePrice).toBe(175000)
        expect(c.pricing.displayPriceFormatted).toMatch(/Rp\s*140\.000/)
      }
    }
  })

  it("synchronizes individual counselor detail view with platform pricing", async () => {
    const detailRes = await getCounselorByIdAction("c-1")
    expect(detailRes.success).toBe(true)
    expect(detailRes.data).toBeDefined()

    const counselor = detailRes.data!
    const current = await getPlatformPricing()
    const expected = current[counselor.counselorType]
    const expectedActive = expected.isSaleActive ? expected.promoPrice : expected.basePrice

    expect(counselor.pricing.displayPrice).toBe(expectedActive)
  })
})
