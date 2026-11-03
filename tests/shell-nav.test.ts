import { describe, it, expect } from "vitest"
import {
  SHELL_NAV,
  getVisibleNav,
  getActiveHref,
  buildAttentionShortcuts,
  type PortalKey,
} from "@/lib/shell/nav"
import { existsSync } from "node:fs"
import { join } from "node:path"

const PORTALS: PortalKey[] = ["admin", "counselor", "operator"]

const flat = (portal: PortalKey, role: Parameters<typeof getVisibleNav>[1]) =>
  getVisibleNav(portal, role).flatMap((g) => g.items)

describe("Ticket 22: shared portal shell navigation", () => {
  it("has a nav for each of the three portals", () => {
    expect(Object.keys(SHELL_NAV).sort()).toEqual(["admin", "counselor", "operator"])
  })

  it("shows the Sistem group only to superadmin", () => {
    const adminGroups = getVisibleNav("admin", "admin").map((g) => g.title)
    const superGroups = getVisibleNav("admin", "superadmin").map((g) => g.title)
    expect(adminGroups).not.toContain("Sistem")
    expect(superGroups).toContain("Sistem")
    expect(getVisibleNav("admin", null)).toEqual([])
  })

  it("follows the v9 admin IA order for groups", () => {
    const titles = getVisibleNav("admin", "superadmin").map((g) => g.title)
    expect(titles).toEqual(["Ringkasan", "Operasional", "Kemitraan", "Keuangan", "Konten", "Sistem"])
  })

  it("hides items whose page does not exist yet", () => {
    const titles = flat("admin", "superadmin").map((i) => i.title)
    for (const planned of [
      "Booking Cepat",
      "Klien Tersedia",
      "Voucher",
      "Layanan & Tarif",
    ]) {
      expect(titles).not.toContain(planned)
    }
    expect(titles).toContain("Booking")
    expect(titles).toContain("Payroll")
    expect(titles).toContain("Laporan Keuangan")
    expect(titles).toContain("Verifikasi Transfer")
    expect(flat("admin", "admin").map((i) => i.title)).not.toContain("Jejak Audit")
    expect(titles).toContain("Jejak Audit")
  })

  it("every visible item points at an existing page", () => {
    for (const portal of PORTALS) {
      for (const item of flat(portal, "superadmin")) {
        const dir = join(process.cwd(), "app", ...item.url.split("/").filter(Boolean))
        expect(existsSync(join(dir, "page.tsx")), `${item.url} has no page`).toBe(true)
      }
    }
  })

  it("Ticket 31: Dispatch WhatsApp is for admin and operator; Template WA is superadmin only", () => {
    expect(flat("admin", "admin").map((i) => i.url)).toContain("/admin/dispatch-wa")
    expect(flat("operator", "operator").map((i) => i.url)).toContain("/operator/dispatch-wa")
    expect(flat("admin", "admin").map((i) => i.url)).not.toContain("/admin/template-wa")
    expect(flat("admin", "superadmin").map((i) => i.url)).toContain("/admin/template-wa")
  })

  it("never lists a duplicate url within a portal", () => {
    for (const portal of PORTALS) {
      const urls = flat(portal, "superadmin").map((i) => i.url)
      expect(new Set(urls).size).toBe(urls.length)
    }
  })

  it("operator portal offers a way back to admin only for admin roles", () => {
    expect(flat("operator", "operator").map((i) => i.url)).not.toContain("/admin")
    expect(flat("operator", "admin").map((i) => i.url)).toContain("/admin")
  })

  it("counselor nav exposes dashboard, schedule, honor and profile", () => {
    expect(flat("counselor", "counselor").map((i) => i.url)).toEqual([
      "/counselor/dashboard",
      "/counselor/schedule",
      "/counselor/honor",
      "/counselor/profile",
    ])
  })

  describe("getActiveHref", () => {
    const items = flat("admin", "superadmin")
    it("prefers the most specific match", () => {
      expect(getActiveHref("/admin/counselors/applications", items)).toBe("/admin/counselors/applications")
      expect(getActiveHref("/admin/counselors/abc", items)).toBe("/admin/counselors")
    })
    it("matches /admin only exactly", () => {
      expect(getActiveHref("/admin", items)).toBe("/admin")
      expect(getActiveHref("/admin/unknown", items)).toBeNull()
    })
    it("matches an alias to its item", () => {
      expect(getActiveHref("/admin/zoom", items)).toBe("/admin/zoom-settings")
    })
  })

  describe("buildAttentionShortcuts", () => {
    it("hides shortcuts with zero or unknown counts", () => {
      const out = buildAttentionShortcuts("admin", { transfer: 3, applications: 0, credentials: null })
      expect(out).toEqual([
        { key: "transfer", label: "Transfer menunggu", count: 3, href: "/admin/manual-payments" },
      ])
    })
    it("returns nothing for portals without attention items", () => {
      expect(buildAttentionShortcuts("operator", { transfer: 5 })).toEqual([])
      expect(buildAttentionShortcuts("counselor", {})).toEqual([])
    })
  })

  it("old/duplicate URLs and PRD routes redirect permanently in next.config", async () => {
    const mod = await import("../next.config")
    const rules = await mod.default.redirects!()
    const expected: Record<string, string> = {
      "/tiket": "/cek-sesi",
      "/konselor/register": "/apply",
      "/admin/zoom": "/admin/zoom-settings",
      "/admin/pricing": "/admin/settings?tab=fees",
      "/admin/dashboard": "/admin",
      "/admin/operator": "/operator",
      "/counselor/schedules": "/counselor/schedule",
    }
    for (const [src, dest] of Object.entries(expected)) {
      const r = rules.find((x) => x.source === src)
      expect(r, src).toBeDefined()
      expect(r!.destination).toBe(dest)
      expect(r!.permanent).toBe(true)
    }
  })

  it("redirected sources no longer ship their own page files", () => {
    for (const p of [
      "app/admin/zoom/page.tsx",
      "app/admin/pricing/page.tsx",
      "app/counselor/schedules/page.tsx",
      "app/admin/dashboard/route.ts",
      "app/admin/operator/route.ts",
    ]) {
      expect(existsSync(join(process.cwd(), p)), p).toBe(false)
    }
  })
})
