import { describe, it, expect, vi, beforeEach } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { NextRequest } from "next/server"

// Third-party boundaries only (Next request scope + Supabase session): the browser
// presents demo cookies and Supabase reports no signed-in user.
const cookieJar = vi.hoisted(() => ({
  values: {} as Record<string, string>,
}))
const supabaseSession = vi.hoisted(() => ({
  user: null as null | {
    id: string
    app_metadata?: Record<string, unknown>
    user_metadata?: Record<string, unknown>
  },
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name in cookieJar.values ? { name, value: cookieJar.values[name] } : undefined,
    getAll: () => Object.entries(cookieJar.values).map(([name, value]) => ({ name, value })),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: async () => new Headers(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: supabaseSession.user }, error: null }) },
  }),
}))

import { getStaffRole, hasStaffRole } from "@/lib/auth/staff-role"
import { requireStaffUser } from "@/lib/auth/staff"
import { evaluateRbac } from "@/lib/supabase/rbac"
import { handleRbacProxy } from "@/lib/supabase/proxy"
import { getAuthenticatedAdmin } from "@/app/admin/counselors/actions"
import { getAuthenticatedOperator } from "@/app/operator/actions"
import { getAuthenticatedCounselor } from "@/lib/counselor/auth"
import { updatePlatformSettingsAction } from "@/app/admin/settings/actions"
import {
  updateRolePricingAction,
  createVoucherAdminAction,
  toggleVoucherStatusAction,
  deleteVoucherAdminAction,
  getVouchersAdminAction,
} from "@/app/admin/pricing/actions"

const DEMO_COOKIES = {
  solulu_demo_role: "superadmin",
  solulu_demo_counselor_id: "11111111-1111-4111-8111-111111111111",
}

beforeEach(() => {
  cookieJar.values = {}
  supabaseSession.user = null
  vi.unstubAllEnvs()
})

describe("single role checker (app_metadata.role only)", () => {
  it("reads the staff role from app_metadata", () => {
    expect(getStaffRole({ id: "u", app_metadata: { role: "superadmin" } })).toBe("superadmin")
    expect(getStaffRole({ id: "u", app_metadata: { role: "operator" } })).toBe("operator")
  })

  it("ignores user_metadata, which end users can edit themselves", () => {
    expect(getStaffRole({ id: "u", user_metadata: { role: "superadmin" } })).toBeNull()
    expect(
      getStaffRole({ id: "u", app_metadata: { role: "authenticated" }, user_metadata: { role: "admin" } })
    ).toBeNull()
  })

  it("returns null for anonymous users and unknown roles", () => {
    expect(getStaffRole(null)).toBeNull()
    expect(getStaffRole({ id: "u", app_metadata: { role: "patient" } })).toBeNull()
    expect(hasStaffRole(null, ["admin"])).toBe(false)
    expect(hasStaffRole({ id: "u", app_metadata: { role: "admin" } }, ["admin", "superadmin"])).toBe(true)
    expect(hasStaffRole({ id: "u", app_metadata: { role: "admin" } }, ["superadmin"])).toBe(false)
  })

  it("evaluateRbac does not grant portal access from user_metadata", () => {
    const forged = { id: "u", user_metadata: { role: "superadmin" } }
    expect(evaluateRbac(forged, "/admin/settings")).toEqual({
      type: "redirect",
      destination: "/unauthorized",
    })
  })
})

describe("demo cookies grant no access to any portal", () => {
  const portals = ["/admin/dashboard", "/admin/settings", "/operator", "/counselor/dashboard"]

  it.each(["superadmin", "admin", "operator", "counselor"])(
    "proxy redirects anonymous browser carrying solulu_demo_role=%s to /login",
    async (role) => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
      for (const portal of portals) {
        const request = new NextRequest(`http://localhost:3000${portal}`, {
          headers: {
            cookie: `solulu_demo_role=${role}; solulu_demo_counselor_id=${DEMO_COOKIES.solulu_demo_counselor_id}`,
          },
        })
        const response = await handleRbacProxy(request)
        expect(response.status).toBeGreaterThanOrEqual(300)
        expect(response.status).toBeLessThan(400)
        expect(response.headers.get("location")).toContain("/login")
      }
    }
  )

  it("server action auth helpers resolve no user from demo cookies", async () => {
    cookieJar.values = { ...DEMO_COOKIES }
    expect(await getAuthenticatedAdmin()).toBeNull()
    expect(await getAuthenticatedOperator()).toBeNull()
    expect(await getAuthenticatedCounselor()).toBeNull()
    expect(await getAuthenticatedCounselor(undefined, { allowAdmin: true })).toBeNull()
    expect(await requireStaffUser(undefined, ["superadmin"])).toBeNull()
  })

  it("settings changes stay denied while only a demo cookie is present", async () => {
    cookieJar.values = { ...DEMO_COOKIES }
    const result = await updatePlatformSettingsAction({ bookingCutoffHours: 2 })
    expect(result.success).toBe(false)
    expect(result.error).toContain("Superadmin")
  })

  it("a real Supabase session still works regardless of the cookie", async () => {
    cookieJar.values = { solulu_demo_role: "counselor" }
    supabaseSession.user = { id: "real-admin", app_metadata: { role: "admin" } }
    const admin = await getAuthenticatedAdmin()
    expect(admin?.id).toBe("real-admin")
    expect(await getAuthenticatedCounselor()).toBeNull()
  })
})

describe("tarif and voucher changes are Superadmin-only (Admin is read-only)", () => {
  const admin = { id: "a1", app_metadata: { role: "admin" } }
  const superadmin = { id: "s1", app_metadata: { role: "superadmin" } }
  const pricing = { regularPrice: 100000, salePrice: 90000, isSaleActive: false, allowVoucher: true }

  it("denies updateRolePricingAction for Admin", async () => {
    const result = await updateRolePricingAction("sebaya", pricing, { currentUser: admin })
    expect(result.success).toBe(false)
    expect(result.error).toContain("Superadmin")
  })

  it("allows updateRolePricingAction for Superadmin", async () => {
    const result = await updateRolePricingAction("sebaya", pricing, { currentUser: superadmin })
    expect(result.success).toBe(true)
  })

  it("denies voucher mutations for Admin before touching the database", async () => {
    const voucher = { code: "HEMAT", discountType: "fixed" as const, discountValue: 1000, quota: 5 }
    for (const result of [
      await createVoucherAdminAction(voucher, { currentUser: admin }),
      await toggleVoucherStatusAction("v1", false, { currentUser: admin }),
      await deleteVoucherAdminAction("v1", { currentUser: admin }),
    ]) {
      expect(result.success).toBe(false)
      expect(result.error).toContain("Superadmin")
    }
  })

  it("keeps voucher listing readable for Admin", async () => {
    const result = await getVouchersAdminAction({ currentUser: admin })
    // Not an authorization failure (a DB failure is acceptable offline).
    expect(result.error ?? "").not.toContain("Akses ditolak")
  })
})

describe("no demo or hardcoded-identity path remains in production code", () => {
  const ROOT = path.resolve(__dirname, "..")
  const SCAN_DIRS = ["app", "lib", "components", "db", "hooks"]
  const FORBIDDEN = [
    "solulu_demo_role",
    "solulu_demo_counselor_id",
    "loginAsDemoAction",
    "switchDemoCounselorAction",
    "mock-cron-secret",
    "mock-callback-token",
    "%Sarah Annisa%",
  ]

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".next" || entry === "migrations") continue
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) walk(full, out)
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
    }
    return out
  }

  it("contains none of the forbidden identifiers", () => {
    const files = [...SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d))), path.join(ROOT, "proxy.ts")]
    const hits: string[] = []
    for (const file of files) {
      const source = readFileSync(file, "utf8")
      for (const needle of FORBIDDEN) {
        if (source.includes(needle)) hits.push(`${path.relative(ROOT, file)} -> ${needle}`)
      }
    }
    expect(hits).toEqual([])
  })
})
