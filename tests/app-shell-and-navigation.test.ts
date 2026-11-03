import { describe, it, expect } from "vitest"
import { getBreadcrumbTrail } from "@/lib/navigation"

describe("Ticket 1: Core App Shell & Navigation", () => {
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
