import { describe, it, expect } from "vitest"
import {
  validateTemplateBody,
  renderTemplate,
  buildWaUrl,
  normalizeWaPhone,
  type WaTemplateValues,
} from "@/lib/whatsapp/templates"
import { resolveDispatchKind } from "@/lib/whatsapp/dispatch-kind"

const values: WaTemplateValues = {
  nama_klien: "Dimas",
  tanggal: "5 Nov 2026",
  slot: "10:00 - 12:00 WIB",
  link_sesi: "https://solulu.id/session/abc",
  nama_konselor: "Sari",
}

describe("Ticket 31: Template Pesan WhatsApp", () => {
  it("replaces every known placeholder, including repeats and spaced tokens", () => {
    const out = renderTemplate(
      "Halo {{nama_klien}}, {{ tanggal }} {{slot}} bersama {{nama_konselor}}: {{link_sesi}} ({{nama_klien}})",
      values
    )
    expect(out).toBe(
      "Halo Dimas, 5 Nov 2026 10:00 - 12:00 WIB bersama Sari: https://solulu.id/session/abc (Dimas)"
    )
  })

  it("accepts a body with only known placeholders", () => {
    expect(validateTemplateBody("Halo {{nama_klien}}")).toEqual({ ok: true })
  })

  it("rejects unknown placeholders on save and names them", () => {
    const r = validateTemplateBody("Halo {{nama_klien}} {{nomor_hp}} {{ harga }}")
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.unknown).toEqual(["nomor_hp", "harga"])
      expect(r.error).toContain("{{nomor_hp}}")
    }
  })

  it("rejects empty and over-long bodies", () => {
    expect(validateTemplateBody("   ").ok).toBe(false)
    expect(validateTemplateBody("x".repeat(1001)).ok).toBe(false)
  })

  it("builds a wa.me url with international number and encoded text", () => {
    expect(buildWaUrl("0812-3456-7890", "Halo & salam")).toBe(
      "https://wa.me/6281234567890?text=Halo%20%26%20salam"
    )
    expect(normalizeWaPhone("+62 812 3456 7890")).toBe("6281234567890")
    expect(buildWaUrl("12", "x")).toBeNull()
  })
})

describe("Ticket 31: dispatch queue kind", () => {
  const today = "2026-11-05"
  it("confirmed upcoming booking needs the session link", () => {
    expect(
      resolveDispatchKind({ status: "confirmed", scheduleDate: "2026-11-05", hasReport: false }, today)
    ).toBe("dispatch_link_sesi")
  })
  it("confirmed past booking is not queued", () => {
    expect(
      resolveDispatchKind({ status: "confirmed", scheduleDate: "2026-11-04", hasReport: false }, today)
    ).toBeNull()
  })
  it("completed booking needs the report message only when a report exists", () => {
    expect(
      resolveDispatchKind({ status: "completed", scheduleDate: "2026-11-01", hasReport: true }, today)
    ).toBe("laporan_siap")
    expect(
      resolveDispatchKind({ status: "completed", scheduleDate: "2026-11-01", hasReport: false }, today)
    ).toBeNull()
  })
  it("other statuses are never queued", () => {
    for (const status of ["pending_payment", "cancelled", "no_show", "expired"]) {
      expect(resolveDispatchKind({ status, scheduleDate: "2026-11-06", hasReport: true }, today)).toBeNull()
    }
  })
})
