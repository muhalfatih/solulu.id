import { describe, it, expect } from "vitest"
import {
  getBreadcrumbTrail,
  ADMIN_NAV_GROUPS,
  COUNSELOR_NAV_ITEMS,
  type NavGroup,
  type NavItem,
} from "@/lib/navigation"

describe("Ticket 1: Core App Shell & Navigation", () => {
  describe("1. Admin Navigation Structure", () => {
    it("contains all mandatory Ticket 1 admin navigation items", () => {
      const allItems = ADMIN_NAV_GROUPS.flatMap((g: NavGroup) => g.items)
      const hrefs = allItems.map((item: NavItem) => item.href)

      // Mandatory items from Ticket 1 acceptance criteria:
      // Dashboard, Counselors Directory, Manual Payments, Financial Reports, Bookings, System Settings, Zoom Accounts
      expect(hrefs).toContain("/admin")
      expect(hrefs).toContain("/admin/counselors")
      expect(hrefs).toContain("/admin/manual-payments")
      expect(hrefs).toContain("/admin/reports/finance")
      expect(hrefs).toContain("/admin/sessions") // bookings route
      expect(hrefs).toContain("/admin/settings")
      expect(hrefs).toContain("/admin/zoom-settings") // zoom route
    })

    it("verifies that each nav item has a label, valid icon, and descriptive title", () => {
      ADMIN_NAV_GROUPS.forEach((group: NavGroup) => {
        expect(group.title).toBeDefined()
        expect(group.items.length).toBeGreaterThan(0)
        group.items.forEach((item: NavItem) => {
          expect(item.label.length).toBeGreaterThan(0)
          expect(item.href.startsWith("/admin")).toBe(true)
          expect(item.icon).toBeDefined()
        })
      })
    })
  })

  describe("2. Counselor Navigation Structure", () => {
    it("contains all mandatory Ticket 1 counselor navigation items", () => {
      const hrefs = COUNSELOR_NAV_ITEMS.map((item: NavItem) => item.href)

      // Mandatory items from Ticket 1 acceptance criteria:
      // Dashboard (Today's Sessions), Weekly Schedule, Counselor Profile
      expect(hrefs).toContain("/counselor/dashboard")
      expect(hrefs).toContain("/counselor/schedules")
      expect(hrefs).toContain("/counselor/profile")
    })

    it("verifies counselor nav items have icons and human-readable labels", () => {
      COUNSELOR_NAV_ITEMS.forEach((item: NavItem) => {
        expect(item.label.length).toBeGreaterThan(0)
        expect(item.href.startsWith("/counselor")).toBe(true)
        expect(item.icon).toBeDefined()
      })
    })
  })

  describe("3. Dynamic Breadcrumb Trail Generation", () => {
    it("generates root breadcrumb for /admin", () => {
      const trail = getBreadcrumbTrail("/admin", "admin")
      expect(trail).toEqual([
        { label: "Admin", href: "/admin", isCurrentPage: true },
      ])
    })

    it("generates 2-level breadcrumbs for /admin/counselors", () => {
      const trail = getBreadcrumbTrail("/admin/counselors", "admin")
      expect(trail).toEqual([
        { label: "Admin", href: "/admin", isCurrentPage: false },
        {
          label: "Direktori Konselor",
          href: "/admin/counselors",
          isCurrentPage: true,
        },
      ])
    })

    it("generates multi-level breadcrumbs for nested routes like /admin/reports/finance", () => {
      const trail = getBreadcrumbTrail("/admin/reports/finance", "admin")
      expect(trail).toEqual([
        { label: "Admin", href: "/admin", isCurrentPage: false },
        { label: "Laporan", href: "/admin/reports", isCurrentPage: false },
        {
          label: "Laporan Keuangan & Sesi",
          href: "/admin/reports/finance",
          isCurrentPage: true,
        },
      ])
    })

    it("handles counselor breadcrumbs for /counselor/dashboard and /counselor/schedules", () => {
      const dashboardTrail = getBreadcrumbTrail("/counselor/dashboard", "counselor")
      expect(dashboardTrail).toEqual([
        { label: "Konselor", href: "/counselor/dashboard", isCurrentPage: false },
        {
          label: "Sesi Hari Ini",
          href: "/counselor/dashboard",
          isCurrentPage: true,
        },
      ])

      const scheduleTrail = getBreadcrumbTrail("/counselor/schedules", "counselor")
      expect(scheduleTrail).toEqual([
        { label: "Konselor", href: "/counselor/dashboard", isCurrentPage: false },
        {
          label: "Jadwal Praktik Mingguan",
          href: "/counselor/schedules",
          isCurrentPage: true,
        },
      ])
    })

    it("replaces uuid or dynamic segments with 'Detail' in breadcrumb labels", () => {
      const trail = getBreadcrumbTrail(
        "/admin/counselors/550e8400-e29b-41d4-a716-446655440000",
        "admin"
      )
      expect(trail.length).toBe(3)
      expect(trail[2].label).toBe("Detail")
      expect(trail[2].isCurrentPage).toBe(true)
    })
  })
})
