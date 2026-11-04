import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const sql = fs.readFileSync(
  path.resolve(__dirname, "../drizzle/0006_services_layanan.sql"),
  "utf8"
)

const journal = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../drizzle/meta/_journal.json"), "utf8")
) as { entries: { tag: string }[] }

describe("Migration 0005: Layanan from the two old pricing tiers (#20)", () => {
  it("is registered in the drizzle journal", () => {
    expect(journal.entries.map((e) => e.tag)).toContain("0006_services_layanan")
  })

  it("seeds Partner Cerita from the peer tier with Bagi Hasil 70/80 and overtime Rp35.000", () => {
    const peer = sql.slice(sql.indexOf("'Partner Cerita'"), sql.indexOf("'Psikolog Klinis'"))
    expect(peer).toContain("'partner-cerita'")
    expect(peer).toContain("pp.\"counselor_type\" = 'peer'")
    expect(peer).toContain("35000, 70, 80")
    expect(peer).toContain("ARRAY['peer']")
  })

  it("seeds Psikolog Klinis from the psychologist tier with Bagi Hasil 80/85 and overtime Rp60.000", () => {
    const psy = sql.slice(sql.indexOf("'Psikolog Klinis'"))
    expect(psy).toContain("'psikolog-klinis'")
    expect(psy).toContain("pp.\"counselor_type\" = 'psychologist'")
    expect(psy).toContain("60000, 80, 85")
    expect(psy).toContain("ARRAY['psychologist']")
  })

  it("only carries a promo price over when the old tier had the sale switched on", () => {
    expect(sql).toContain('pp."is_sale_active" AND pp."promo_price" IS NOT NULL')
  })

  it("is idempotent for the seed rows", () => {
    expect(sql.match(/ON CONFLICT \("slug"\) DO NOTHING/g)?.length).toBe(2)
  })

  it("backfills existing bookings before locking the new columns NOT NULL", () => {
    const addCol = sql.indexOf('ADD COLUMN "service_id" uuid;')
    const backfillService = sql.indexOf('SET "service_id" = s."id"')
    const backfillSnapshot = sql.indexOf('SET "base_price_snapshot"')
    const lockService = sql.indexOf('ALTER COLUMN "service_id" SET NOT NULL')
    const lockSnapshot = sql.indexOf('ALTER COLUMN "base_price_snapshot" SET NOT NULL')
    expect(addCol).toBeGreaterThan(-1)
    expect(backfillService).toBeGreaterThan(addCol)
    expect(backfillSnapshot).toBeGreaterThan(backfillService)
    expect(lockService).toBeGreaterThan(backfillSnapshot)
    expect(lockSnapshot).toBeGreaterThan(lockService)
  })

  it("snapshots the original payment gross, ignoring extension transactions", () => {
    expect(sql).toContain("COALESCE(t.\"admin_notes\", '') <> 'EXTENSION'")
  })

  it("does not drop the old tables or columns (non-destructive)", () => {
    expect(sql).not.toMatch(/DROP TABLE|DROP COLUMN/i)
  })
})
