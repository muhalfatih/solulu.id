import { describe, it, expect } from "vitest"
import sitemap from "../app/sitemap"
import robots from "../app/robots"
import { metadata as privacyMetadata } from "../app/privacy/page"
import { metadata as termsMetadata } from "../app/terms/page"
import { metadata as pricingMetadata } from "../app/pricing/page"
import { metadata as homeMetadata } from "../app/page"

describe("Issue #13: Public Surfaces, SEO, Legal Pages & Branded Errors", () => {
  describe("1. Dynamic Sitemap Generation", () => {
    it("generates sitemap containing all essential public routes with priority", () => {
      const site = sitemap()
      expect(Array.isArray(site)).toBe(true)

      const urls = site.map((item) => item.url)
      expect(urls.some((u) => u === "https://solulu.id" || u === "https://solulu.id/" || u.endsWith("/"))).toBe(true)
      expect(urls.some((u) => u.endsWith("/counselors"))).toBe(true)
      expect(urls.some((u) => u.endsWith("/screening"))).toBe(true)
      expect(urls.some((u) => u.endsWith("/pricing"))).toBe(true)
      expect(urls.some((u) => u.endsWith("/cek-sesi"))).toBe(true)
      expect(urls.some((u) => u.endsWith("/apply"))).toBe(false)
      expect(urls.some((u) => u.endsWith("/privacy"))).toBe(true)
      expect(urls.some((u) => u.endsWith("/terms"))).toBe(true)

      // Ensure priorities are valid numbers between 0.1 and 1.0
      site.forEach((item) => {
        expect(item.priority).toBeGreaterThanOrEqual(0.1)
        expect(item.priority).toBeLessThanOrEqual(1.0)
      })
    })
  })

  describe("2. Robots.txt Configuration", () => {
    it("permits public routes and explicitly disallows protected internal routes", () => {
      const rob = robots()
      expect(rob.sitemap).toContain("/sitemap.xml")

      const rules = Array.isArray(rob.rules) ? rob.rules[0] : rob.rules
      expect(rules.allow).toContain("/")
      expect(rules.allow).toContain("/counselors")
      expect(rules.allow).toContain("/screening")
      expect(rules.allow).toContain("/pricing")
      expect(rules.allow).toContain("/cek-sesi")

      expect(rules.disallow).toContain("/admin/")
      expect(rules.disallow).toContain("/counselor/")
      expect(rules.disallow).toContain("/session/")
      expect(rules.disallow).toContain("/api/")
      expect(rules.disallow).toContain("/apply")
    })
  })

  describe("3. Legal Pages & SEO Metadata Integrity", () => {
    it("has compliant metadata for Privacy Policy mentioning UU PDP No. 27/2022", () => {
      expect(privacyMetadata.title).toContain("Kebijakan Privasi")
      expect(privacyMetadata.description).toContain("UU PDP No. 27/2022")
    })

    it("has compliant metadata for Terms of Service mentioning H-12 rule", () => {
      expect(termsMetadata.title).toContain("Syarat & Ketentuan")
      expect(termsMetadata.description).toContain("H-12")
    })

    it("has compliant metadata for Pricing Page mentioning 90-minute sessions", () => {
      expect(pricingMetadata.title).toContain("Biaya")
      expect(pricingMetadata.description).toContain("90 menit")
    })

    it("has compelling sanctuary landing metadata", () => {
      expect(homeMetadata.title).toContain("Solulu")
      expect(homeMetadata.description.toLowerCase()).toContain("konseling")
    })
  })
})
