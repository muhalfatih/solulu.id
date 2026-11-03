import { describe, it, expect, vi, beforeEach } from "vitest"
import fs from "fs"
import path from "path"
import { auditLogs, type NewAuditLog } from "../db/schema"
import {
  AuditWriteError,
  buildAuditRow,
  recordAudit,
  sanitizeAuditPayload,
  type AuditExecutor,
} from "../lib/audit/record"
import { listAuditLogs } from "../lib/audit/list"
import { auditTableConfig, parseAuditRange } from "../lib/audit/query"
import { parseTableParams } from "../lib/data-table/search-params"
import { evaluateRbac } from "../lib/supabase/rbac"

const superadmin = { id: "sa-1", app_metadata: { role: "superadmin" } }

function fakeExecutor(failWith?: Error) {
  const rows: NewAuditLog[] = []
  const executor: AuditExecutor = {
    insert: (table) => {
      expect(table).toBe(auditLogs)
      return {
        values: async (row) => {
          if (failWith) throw failWith
          rows.push(row)
        },
      }
    },
  }
  return { rows, executor }
}

describe("recordAudit (#24)", () => {
  it("writes actor, role, action, entity, ip and before/after", async () => {
    const { rows, executor } = fakeExecutor()
    await recordAudit(executor, {
      actor: superadmin,
      action: "pricing.update",
      entityType: "service",
      entityId: "svc-1",
      before: { basePrice: "85000.00" },
      after: { basePrice: "90000.00" },
      ip: "203.0.113.7",
    })
    expect(rows).toEqual([
      {
        actorId: "sa-1",
        actorRole: "superadmin",
        action: "pricing.update",
        entityType: "service",
        entityId: "svc-1",
        ip: "203.0.113.7",
        before: { basePrice: "85000.00" },
        after: { basePrice: "90000.00" },
      },
    ])
  })

  it("takes the role from app_metadata only, never user_metadata", () => {
    const row = buildAuditRow({
      actor: { id: "u", app_metadata: {}, user_metadata: { role: "superadmin" } },
      action: "settings.update",
      entityType: "platform_settings",
    })
    expect(row.actorRole).toBeNull()
  })

  it("redacts secrets and serialises dates", () => {
    const out = sanitizeAuditPayload({
      name: "Zoom A",
      clientSecretEncrypted: "abc",
      nested: { apiKey: "k", at: new Date("2026-11-01T00:00:00Z") },
    })
    expect(out).toEqual({
      name: "Zoom A",
      clientSecretEncrypted: "[REDACTED]",
      nested: { apiKey: "[REDACTED]", at: "2026-11-01T00:00:00.000Z" },
    })
  })

  it("propagates a write failure so the surrounding transaction rolls back", async () => {
    const { executor } = fakeExecutor(new Error("db down"))
    await expect(
      recordAudit(executor, { actor: superadmin, action: "voucher.create", entityType: "voucher" })
    ).rejects.toBeInstanceOf(AuditWriteError)
  })
})

describe("audit read access (RBAC)", () => {
  const state = parseTableParams({}, auditTableConfig)

  it.each(["admin", "operator", "counselor"])("%s cannot read audit data", async (role) => {
    const res = await listAuditLogs(state, { id: "x", app_metadata: { role } })
    expect(res).toBeNull()
  })

  it("anonymous and user_metadata-only roles cannot read audit data", async () => {
    expect(await listAuditLogs(state, null)).toBeNull()
    expect(await listAuditLogs(state, { id: "x", user_metadata: { role: "superadmin" } })).toBeNull()
  })

  it("only Superadmin may open /admin/audit", () => {
    const dest = (role: string) =>
      evaluateRbac({ id: "x", app_metadata: { role } }, "/admin/audit")
    expect(dest("superadmin")).toEqual({ type: "allow" })
    expect(dest("admin")).toEqual({ type: "redirect", destination: "/unauthorized" })
    expect(dest("operator")).toEqual({ type: "redirect", destination: "/operator" })
    expect(dest("counselor")).toEqual({ type: "redirect", destination: "/counselor/dashboard" })
    expect(evaluateRbac(null, "/admin/audit").type).toBe("redirect")
    // Admin tetap bisa membuka halaman admin lain.
    expect(evaluateRbac({ id: "x", app_metadata: { role: "admin" } }, "/admin/bookings")).toEqual({
      type: "allow",
    })
  })
})

describe("audit filters", () => {
  it("accepts only known actions/entities and normalises the date range to WIB", () => {
    const s = parseTableParams(
      { action: "pricing.update", entity: "nope", from: "2026-11-01", to: "2026-11-02" },
      auditTableConfig
    )
    expect(s.filters).toEqual({ action: "pricing.update", from: "2026-11-01", to: "2026-11-02" })
    const range = parseAuditRange(s.filters)
    expect(range.from?.toISOString()).toBe("2026-10-31T17:00:00.000Z")
    expect(range.toExclusive?.toISOString()).toBe("2026-11-02T17:00:00.000Z")
  })

  it("ignores malformed dates", () => {
    expect(parseAuditRange({ from: "bukan-tanggal", to: "2026-13-99x" })).toEqual({})
  })
})

describe("append-only guarantees", () => {
  const root = path.resolve(__dirname, "..")

  function walk(dir: string, out: string[] = []): string[] {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git", "tests", "drizzle"].includes(e.name)) continue
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p, out)
      else if (/\.(ts|tsx)$/.test(e.name)) out.push(p)
    }
    return out
  }

  it("no application code updates or deletes audit_logs", () => {
    const offenders = ["app", "lib", "components", "scripts"]
      .filter((d) => fs.existsSync(path.join(root, d)))
      .flatMap((d) => walk(path.join(root, d)))
      .filter((f) =>
        /\.(update|delete)\(\s*auditLogs\b|DELETE\s+FROM\s+audit_logs|UPDATE\s+audit_logs|TRUNCATE\s+audit_logs/i.test(
          fs.readFileSync(f, "utf8")
        )
      )
    expect(offenders).toEqual([])
  })

  it("the migration installs triggers that reject UPDATE, DELETE and TRUNCATE", () => {
    const file = fs.readdirSync(path.join(root, "drizzle")).find((f) => /audit/.test(f) && f.endsWith(".sql"))
    expect(file).toBeDefined()
    const sql = fs.readFileSync(path.join(root, "drizzle", file!), "utf8")
    expect(sql).toMatch(/BEFORE UPDATE OR DELETE ON "?audit_logs"?/i)
    expect(sql).toMatch(/BEFORE TRUNCATE ON "?audit_logs"?/i)
    expect(sql).toMatch(/RAISE EXCEPTION/i)
  })
})

// --- Satu transaksi: aksi gagal tidak meninggalkan baris audit -------------------------------

const committed: Array<{ table: string; row: unknown }> = []

vi.mock("@/db", async () => {
  const schema = await import("../db/schema")
  const names = new Map<unknown, string>([
    [schema.vouchers, "vouchers"],
    [schema.auditLogs, "audit_logs"],
  ])
  const tx = (buffer: Array<{ table: string; row: unknown }>, failAudit: () => boolean) => ({
    insert: (table: unknown) => ({
      values: (row: any) => {
        const name = names.get(table) ?? "other"
        const run = async () => {
          if (name === "audit_logs" && failAudit()) throw new Error("audit insert failed")
          buffer.push({ table: name, row })
          return [{ id: "v-1", ...row }]
        }
        const p: any = run()
        p.returning = async () => p
        return p
      },
    }),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }),
  })
  return {
    db: {
      transaction: async (cb: (t: any) => Promise<unknown>) => {
        const buffer: Array<{ table: string; row: unknown }> = []
        const result = await cb(tx(buffer, () => (globalThis as any).__failAudit === true))
        committed.push(...buffer) // commit only when the callback resolves
        return result
      },
    },
  }
})

describe("audit and action share one transaction", () => {
  beforeEach(() => {
    committed.length = 0
    ;(globalThis as any).__failAudit = false
  })

  it("commits the voucher row together with its audit row", async () => {
    const { createVoucherAdminAction } = await import("../app/admin/pricing/actions")
    const res = await createVoucherAdminAction(
      { code: "hemat10", discountType: "fixed", discountValue: 10000, quota: 5 },
      { currentUser: superadmin }
    )
    expect(res.success).toBe(true)
    expect(committed.map((c) => c.table)).toEqual(["vouchers", "audit_logs"])
    expect((committed[1].row as NewAuditLog).action).toBe("voucher.create")
    expect((committed[1].row as NewAuditLog).actorRole).toBe("superadmin")
  })

  it("leaves neither row when the audit write fails", async () => {
    ;(globalThis as any).__failAudit = true
    const { createVoucherAdminAction } = await import("../app/admin/pricing/actions")
    const res = await createVoucherAdminAction(
      { code: "hemat10", discountType: "fixed", discountValue: 10000, quota: 5 },
      { currentUser: superadmin }
    )
    expect(res.success).toBe(false)
    expect(committed).toEqual([])
  })

  it("does not touch the database when the actor is not Superadmin", async () => {
    const { createVoucherAdminAction } = await import("../app/admin/pricing/actions")
    const res = await createVoucherAdminAction(
      { code: "x", discountType: "fixed", discountValue: 1, quota: 1 },
      { currentUser: { id: "a", app_metadata: { role: "admin" } } }
    )
    expect(res.success).toBe(false)
    expect(committed).toEqual([])
  })
})
