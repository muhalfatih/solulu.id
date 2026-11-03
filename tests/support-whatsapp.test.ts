import { describe, expect, it } from "vitest"
import { getSupportWhatsappNumber, getSupportWhatsappUrl } from "@/lib/config/support"

describe("support whatsapp config", () => {
  it("returns null when unset or invalid (no fabricated number)", () => {
    expect(getSupportWhatsappNumber("")).toBeNull()
    expect(getSupportWhatsappNumber("abc")).toBeNull()
    expect(getSupportWhatsappUrl("hi", "")).toBeNull()
  })
  it("builds a wa.me url from a configured number", () => {
    expect(getSupportWhatsappNumber("+62 812-0000-1111")).toBe("6281200001111")
    expect(getSupportWhatsappUrl("Halo Solulu", "6281200001111")).toBe(
      "https://wa.me/6281200001111?text=Halo%20Solulu"
    )
  })
})
