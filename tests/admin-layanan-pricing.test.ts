import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import {
  getPlatformPricingAction,
  updateRolePricingAction,
} from "../app/admin/pricing/actions"
import { formatRupiah } from "../lib/utils"
import type { ServiceRecord, ServicePatch } from "../lib/services/repository"

const adminUser = {
  id: "admin-test-id",
  app_metadata: { role: "admin" },
  user_metadata: { role: "admin" },
}

function makeRecord(overrides: Partial<ServiceRecord>): ServiceRecord {
  return {
    id: "svc",
    name: "Layanan",
    slug: "layanan",
    description: null,
    basePrice: "85000.00",
    promoPrice: null,
    allowVoucher: true,
    overtimeRatePer30Min: "35000.00",
    basePayoutPercent: 70,
    overtimePayoutPercent: 80,
    allowedCounselorTypes: ["peer"],
    isActive: true,
    sortOrder: 0,
    createdAt: new Date("2026-11-01T00:00:00Z"),
    updatedAt: new Date("2026-11-01T00:00:00Z"),
    ...overrides,
  }
}

const seedServices = [
  makeRecord({
    id: "svc-sebaya",
    name: "Partner Cerita",
    slug: "partner-cerita",
    basePrice: "85000.00",
    promoPrice: "49000.00",
    overtimeRatePer30Min: "35000.00",
  }),
  makeRecord({
    id: "svc-psikolog",
    name: "Psikolog Klinis",
    slug: "psikolog-klinis",
    basePrice: "150000.00",
    promoPrice: null,
    overtimeRatePer30Min: "60000.00",
    allowedCounselorTypes: ["psychologist"],
  }),
]

describe("Admin pricing surface reads and writes Layanan (ADR-0010)", () => {
  it("exposes the two seed Layanan, including overtime rate, via getPlatformPricingAction", async () => {
    const res = await getPlatformPricingAction({ listServicesFn: async () => seedServices })
    expect(res.success).toBe(true)
    expect(res.data.peer).toMatchObject({
      basePrice: 85000,
      promoPrice: 49000,
      isSaleActive: true,
      overtimeRatePer30Min: 35000,
    })
    expect(res.data.psychologist).toMatchObject({
      basePrice: 150000,
      isSaleActive: false,
      overtimeRatePer30Min: 60000,
    })
  })

  it("returns null (empty state) for a seed Layanan that does not exist", async () => {
    const res = await getPlatformPricingAction({ listServicesFn: async () => [] })
    expect(res.data.peer).toBeNull()
    expect(res.data.psychologist).toBeNull()
  })

  it("updates the Layanan row (price, promo, voucher, overtime) for the chosen role", async () => {
    let seenSlug = ""
    let seenPatch: ServicePatch | null = null
    const res = await updateRolePricingAction(
      "psikolog",
      {
        regularPrice: 160000,
        salePrice: 135000,
        isSaleActive: true,
        allowVoucher: false,
        overtimeRatePer30Min: 65000,
      },
      {
        currentUser: adminUser,
        updateServiceFn: async (slug, patch) => {
          seenSlug = slug
          seenPatch = patch
          return makeRecord({
            id: "svc-psikolog",
            slug,
            basePrice: patch.basePrice as string,
            promoPrice: (patch.promoPrice as string | null) ?? null,
            allowVoucher: patch.allowVoucher as boolean,
            overtimeRatePer30Min: patch.overtimeRatePer30Min as string,
            allowedCounselorTypes: ["psychologist"],
          })
        },
      }
    )

    expect(res.success).toBe(true)
    expect(seenSlug).toBe("psikolog-klinis")
    expect(seenPatch).toMatchObject({
      basePrice: "160000",
      promoPrice: "135000",
      allowVoucher: false,
      overtimeRatePer30Min: "65000",
    })
    expect(res.data?.overtimeRatePer30Min).toBe(65000)
    expect(res.message).toContain("Psikolog Klinis")
  })

  it("clears the promo price when the sale is switched off", async () => {
    let seenPatch: ServicePatch | null = null
    await updateRolePricingAction(
      "sebaya",
      { regularPrice: 90000, salePrice: 0, isSaleActive: false, allowVoucher: true },
      {
        currentUser: adminUser,
        updateServiceFn: async (_slug, patch) => {
          seenPatch = patch
          return makeRecord({ slug: "partner-cerita", basePrice: "90000.00" })
        },
      }
    )
    expect(seenPatch).toMatchObject({ promoPrice: null })
  })

  it("rejects a promo price that is not below the base price", async () => {
    const res = await updateRolePricingAction(
      "sebaya",
      { regularPrice: 90000, salePrice: 95000, isSaleActive: true, allowVoucher: true },
      { currentUser: adminUser, updateServiceFn: async () => makeRecord({}) }
    )
    expect(res.success).toBe(false)
    expect(res.error).toContain("promo")
  })

  it("blocks non-admin users from updating pricing", async () => {
    const res = await updateRolePricingAction(
      "psikolog",
      { regularPrice: 170000, salePrice: 140000, isSaleActive: true, allowVoucher: true },
      {
        currentUser: { id: "counselor-test-id", app_metadata: { role: "counselor" } },
        updateServiceFn: async () => makeRecord({}),
      }
    )
    expect(res.success).toBe(false)
    expect(res.error).toContain("Akses ditolak")
  })

  it("formats pricing amounts correctly for public landing and pricing pages", () => {
    expect(formatRupiah(85000)).toMatch(/Rp\s*85\.000/)
    expect(formatRupiah(49000)).toMatch(/Rp\s*49\.000/)
  })
})

describe("Old pricing tier table is no longer read by application code (#20)", () => {
  const root = path.resolve(__dirname, "..")

  function collect(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) collect(full, out)
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
    }
    return out
  }

  const files = ["app", "lib", "components"].flatMap((d) => collect(path.join(root, d)))

  it("has no import or query of platformPricing outside the schema definition", () => {
    const offenders = files.filter((f) => /\bplatformPricing\b/.test(fs.readFileSync(f, "utf8")))
    expect(offenders.map((f) => path.relative(root, f))).toEqual([])
  })

  it("has no raw SQL against platform_pricing", () => {
    const offenders = files.filter((f) => /platform_pricing/.test(fs.readFileSync(f, "utf8")))
    expect(offenders.map((f) => path.relative(root, f))).toEqual([])
  })

  it("has no per-type overtime rate read from platform settings", () => {
    const offenders = files.filter((f) => {
      const src = fs.readFileSync(f, "utf8")
      return /counselorExtendFeePer30Min|psychologistExtendFeePer30Min/.test(src)
    })
    expect(offenders.map((f) => path.relative(root, f))).toEqual([])
  })
})
