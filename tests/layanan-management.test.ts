import { describe, it, expect, vi, beforeEach } from "vitest"
import fs from "fs"
import path from "path"
import {
  validateServiceInput,
  slugifyServiceName,
  uniqueSlug,
  type ServiceFormInput,
} from "../lib/services/validation"
import { listOfferedServices, type ServiceLike } from "../lib/services/pricing"

// --- fake transactional store (isolasi DB; kontrak skema asli dipakai untuk nama tabel) -----

type Op = { table: string; kind: "insert" | "update" | "delete"; row?: any }
const state = {
  ops: [] as Op[],
  services: [] as any[],
  exclusions: [] as any[],
  failAudit: false,
}

vi.mock("@/db", async () => {
  const schema = await import("../db/schema")
  const nameOf = (t: unknown) =>
    t === schema.services
      ? "services"
      : t === schema.auditLogs
        ? "audit_logs"
        : t === schema.counselorServiceExclusions
          ? "exclusions"
          : "other"
  const rowsOf = (name: string) =>
    name === "services" ? state.services : name === "exclusions" ? state.exclusions : []
  const makeTx = (buffer: Op[]) => ({
    select: () => ({
      from: (table: unknown) => {
        const rows = rowsOf(nameOf(table))
        const p: any = Promise.resolve(rows)
        p.where = () => {
          const q: any = Promise.resolve(rows)
          q.limit = async () => rows.slice(0, 1)
          return q
        }
        return p
      },
    }),
    insert: (table: unknown) => ({
      values: (row: any) => {
        const name = nameOf(table)
        if (name === "audit_logs" && state.failAudit) throw new Error("audit insert failed")
        const stored = { id: `id-${buffer.length + 1}`, ...row }
        buffer.push({ table: name, kind: "insert", row: stored })
        const p: any = Promise.resolve(undefined)
        p.returning = async () => [stored]
        return p
      },
    }),
    update: (table: unknown) => ({
      set: (values: any) => ({
        where: () => ({
          returning: async () => {
            const name = nameOf(table)
            const next = { ...rowsOf(name)[0], ...values }
            buffer.push({ table: name, kind: "update", row: next })
            return [next]
          },
        }),
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        buffer.push({ table: nameOf(table), kind: "delete" })
      },
    }),
  })
  return {
    db: {
      transaction: async (cb: (t: any) => Promise<unknown>) => {
        const buffer: Op[] = []
        const result = await cb(makeTx(buffer))
        state.ops.push(...buffer) // commit hanya bila callback selesai
        return result
      },
    },
  }
})

const superadmin = { id: "sa-1", app_metadata: { role: "superadmin" } }
const admin = { id: "ad-1", app_metadata: { role: "admin" } }
const counselor = { id: "c-1", app_metadata: { role: "counselor" } }

const preNikah: ServiceFormInput = {
  name: "Konseling Pra-Nikah",
  description: "Persiapan pernikahan",
  basePrice: 200000,
  promoPrice: null,
  allowVoucher: false,
  overtimeRatePer30Min: 50000,
  basePayoutPercent: 75,
  overtimePayoutPercent: 80,
  allowedCounselorTypes: ["psychologist", "peer"],
}

const auditRows = () => state.ops.filter((o) => o.table === "audit_logs").map((o) => o.row)

beforeEach(() => {
  state.ops = []
  state.failAudit = false
  state.services = [
    {
      id: "svc-1",
      name: "Psikolog Klinis",
      slug: "psikolog-klinis",
      isActive: true,
      basePrice: "150000.00",
    },
  ]
  state.exclusions = []
})

describe("validateServiceInput", () => {
  it("accepts a complete Layanan and normalizes numbers to strings", () => {
    const r = validateServiceInput(preNikah)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.values.basePrice).toBe("200000")
      expect(r.values.promoPrice).toBeNull()
      expect(r.values.allowedCounselorTypes).toEqual(["psychologist", "peer"])
    }
  })

  it.each([
    [{ name: "ab" }, "Nama"],
    [{ basePrice: 0 }, "Tarif dasar"],
    [{ promoPrice: 200000 }, "promo"],
    [{ overtimeRatePer30Min: -1 }, "overtime"],
    [{ basePayoutPercent: 101 }, "Bagi Hasil"],
    [{ overtimePayoutPercent: 50.5 }, "Bagi Hasil"],
    [{ allowedCounselorTypes: [] }, "Tipe Konselor"],
    [{ allowedCounselorTypes: ["dokter"] }, "Tipe Konselor"],
  ])("rejects invalid input %j", (patch, fragment) => {
    const r = validateServiceInput({ ...preNikah, ...patch })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain(fragment)
  })

  it("builds unique slugs", () => {
    expect(slugifyServiceName("Konseling Pra-Nikah")).toBe("konseling-pra-nikah")
    expect(uniqueSlug("a", new Set(["a", "a-2"]))).toBe("a-3")
    expect(uniqueSlug("", new Set())).toBe("layanan")
  })
})

describe("Superadmin creates and edits Layanan, every change is audited", () => {
  it("creates Konseling Pra-Nikah as active and writes one audit row in the same transaction", async () => {
    const { createServiceAction } = await import("../app/admin/layanan/actions")
    const res = await createServiceAction(preNikah, { currentUser: superadmin })
    expect(res.success).toBe(true)
    expect(state.ops.map((o) => o.table)).toEqual(["services", "audit_logs"])
    expect(state.ops[0].row).toMatchObject({
      slug: "konseling-pra-nikah",
      isActive: true,
      basePayoutPercent: 75,
    })
    expect(auditRows()).toHaveLength(1)
    expect(auditRows()[0]).toMatchObject({
      action: "service.create",
      entityType: "service",
      actorRole: "superadmin",
    })
  })

  it("rolls the Layanan back when the audit write fails", async () => {
    state.failAudit = true
    const { createServiceAction } = await import("../app/admin/layanan/actions")
    const res = await createServiceAction(preNikah, { currentUser: superadmin })
    expect(res.success).toBe(false)
    expect(state.ops).toEqual([])
  })

  it("updates a Layanan and audits before/after", async () => {
    const { updateServiceAction } = await import("../app/admin/layanan/actions")
    const res = await updateServiceAction("svc-1", { ...preNikah, basePrice: 175000 }, { currentUser: superadmin })
    expect(res.success).toBe(true)
    expect(auditRows()[0]).toMatchObject({ action: "service.update", entityId: "svc-1" })
    expect((auditRows()[0] as any).before).toMatchObject({ basePrice: "150000.00" })
    expect((auditRows()[0] as any).after).toMatchObject({ basePrice: "175000" })
  })

  it("deactivates instead of deleting, with an audit row", async () => {
    const { setServiceActiveAction } = await import("../app/admin/layanan/actions")
    const res = await setServiceActiveAction("svc-1", false, { currentUser: superadmin })
    expect(res.success).toBe(true)
    expect(state.ops.some((o) => o.kind === "delete")).toBe(false)
    expect(state.ops.find((o) => o.table === "services")?.row).toMatchObject({ isActive: false })
    expect(auditRows()[0]).toMatchObject({ action: "service.toggle" })
  })

  it("returns a validation error without touching the database", async () => {
    const { createServiceAction } = await import("../app/admin/layanan/actions")
    const res = await createServiceAction({ ...preNikah, basePrice: -5 }, { currentUser: superadmin })
    expect(res.success).toBe(false)
    expect(state.ops).toEqual([])
  })
})

describe("Admin is read-only for Layanan but may exclude a Layanan per counselor", () => {
  it("rejects Admin, counselor and anonymous on every Layanan mutation", async () => {
    const actions = await import("../app/admin/layanan/actions")
    for (const user of [admin, counselor, null]) {
      const opts = { currentUser: user }
      const results = await Promise.all([
        actions.createServiceAction(preNikah, opts),
        actions.updateServiceAction("svc-1", preNikah, opts),
        actions.setServiceActiveAction("svc-1", false, opts),
      ])
      for (const r of results) {
        expect(r.success).toBe(false)
        if (!r.success) expect(r.error).toContain("Akses ditolak")
      }
    }
    expect(state.ops).toEqual([])
  })

  it("lets Admin exclude a Layanan for a counselor and audits it", async () => {
    const { setCounselorServiceExcludedAction } = await import("../app/admin/layanan/actions")
    const res = await setCounselorServiceExcludedAction("cn-1", "svc-1", true, { currentUser: admin })
    expect(res.success).toBe(true)
    expect(state.ops.find((o) => o.table === "exclusions")).toMatchObject({
      kind: "insert",
      row: { counselorId: "cn-1", serviceId: "svc-1" },
    })
    expect(auditRows()[0]).toMatchObject({
      action: "counselor_service.exclusion",
      entityType: "counselor",
      entityId: "cn-1",
      actorRole: "admin",
    })
  })

  it("removes an existing exclusion", async () => {
    state.exclusions = [{ id: "e1", counselorId: "cn-1", serviceId: "svc-1" }]
    const { setCounselorServiceExcludedAction } = await import("../app/admin/layanan/actions")
    const res = await setCounselorServiceExcludedAction("cn-1", "svc-1", false, { currentUser: admin })
    expect(res.success).toBe(true)
    expect(state.ops.find((o) => o.table === "exclusions")?.kind).toBe("delete")
  })

  it("rejects counselors and anonymous for exclusions", async () => {
    const { setCounselorServiceExcludedAction } = await import("../app/admin/layanan/actions")
    for (const user of [counselor, null]) {
      const res = await setCounselorServiceExcludedAction("cn-1", "svc-1", true, { currentUser: user })
      expect(res.success).toBe(false)
    }
    expect(state.ops).toEqual([])
  })
})

describe("catalog effect of the new rules (pure eligibility)", () => {
  const svc = (over: Partial<ServiceLike>): ServiceLike => ({
    id: "s",
    name: "S",
    slug: "s",
    description: null,
    basePrice: "1",
    promoPrice: null,
    allowVoucher: true,
    overtimeRatePer30Min: "0",
    basePayoutPercent: 70,
    overtimePayoutPercent: 80,
    allowedCounselorTypes: ["psychologist"],
    isActive: true,
    sortOrder: 0,
    ...over,
  })
  const psy = { id: "cn-1", counselorType: "psychologist" as const }

  it("a new active Layanan is offered to matching counselors", () => {
    expect(listOfferedServices([svc({ id: "pra" })], psy, []).map((s) => s.id)).toEqual(["pra"])
  })
  it("a deactivated Layanan leaves the catalog", () => {
    expect(listOfferedServices([svc({ id: "pra", isActive: false })], psy, [])).toEqual([])
  })
  it("a per-counselor exclusion hides that counselor for the Layanan only", () => {
    const all = [svc({ id: "a" }), svc({ id: "b" })]
    expect(listOfferedServices(all, psy, ["a"]).map((s) => s.id)).toEqual(["b"])
  })
})

describe("Layanan & Tarif page is wired in", () => {
  const root = path.resolve(__dirname, "..")
  it("has page, loading and the redirect from the old pricing URL", () => {
    expect(fs.existsSync(path.join(root, "app/admin/layanan/page.tsx"))).toBe(true)
    expect(fs.existsSync(path.join(root, "app/admin/layanan/loading.tsx"))).toBe(true)
    const cfg = fs.readFileSync(path.join(root, "next.config.ts"), "utf8")
    expect(cfg).toMatch(/\/admin\/pricing[^}]*\/admin\/layanan/)
  })
  it("fees tab no longer hardcodes placeholder prices", () => {
    const src = fs.readFileSync(path.join(root, "app/admin/settings/fees-tab.tsx"), "utf8")
    expect(src).not.toMatch(/INITIAL_ROLES|regularPrice: 85000/)
  })
})

describe("queryServices (tabel Layanan)", () => {
  const mk = (id: string, over: Partial<ServiceLike>): ServiceLike => ({
    id,
    name: id,
    slug: id,
    description: null,
    basePrice: "100",
    promoPrice: null,
    allowVoucher: true,
    overtimeRatePer30Min: "0",
    basePayoutPercent: 70,
    overtimePayoutPercent: 80,
    allowedCounselorTypes: ["peer"],
    isActive: true,
    sortOrder: 0,
    ...over,
  })
  const all = [
    mk("Beta", { basePrice: "300", sortOrder: 2 }),
    mk("Alfa", { basePrice: "500", promoPrice: "100", sortOrder: 1, allowedCounselorTypes: ["psychologist"] }),
    mk("Gamma", { isActive: false, sortOrder: 3 }),
  ]
  const st = (over: Partial<import("../lib/data-table/search-params").TableState> = {}) => ({
    page: 1,
    pageSize: 10,
    sort: { key: "sortOrder", dir: "asc" as const },
    filters: {},
    ...over,
  })

  it("sorts by display order by default and by active price", async () => {
    const { queryServices } = await import("../lib/services/list")
    expect(queryServices(all, st()).rows.map((s) => s.id)).toEqual(["Alfa", "Beta", "Gamma"])
    expect(queryServices(all, st({ sort: { key: "price", dir: "asc" } })).rows.map((s) => s.id)).toEqual([
      "Alfa",
      "Gamma",
      "Beta",
    ])
  })

  it("filters by status, type and text, and paginates", async () => {
    const { queryServices } = await import("../lib/services/list")
    expect(queryServices(all, st({ filters: { status: "inactive" } })).rows.map((s) => s.id)).toEqual(["Gamma"])
    expect(queryServices(all, st({ filters: { type: "psychologist" } })).total).toBe(1)
    expect(queryServices(all, st({ filters: { q: "bet" } })).rows.map((s) => s.id)).toEqual(["Beta"])
    const p = queryServices(all, st({ page: 2, pageSize: 2 }))
    expect(p.total).toBe(3)
    expect(p.rows.map((s) => s.id)).toEqual(["Gamma"])
  })
})
