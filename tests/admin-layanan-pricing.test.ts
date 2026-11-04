import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { formatRupiah } from "../lib/utils"

describe("Pricing formatting", () => {
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
