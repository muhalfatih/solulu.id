import { describe, it, expect } from "vitest"
import {
  getAdminProfileDataAction,
  updateAdminContactAction,
  updateAdminPasswordAction,
} from "../app/admin/profile/actions"

describe("Admin Profile Server Actions", () => {
  const superadminAuth = {
    id: "demo-superadmin-id",
    app_metadata: { role: "superadmin" },
    user_metadata: { role: "superadmin", email: "superadmin@solulu.id", phone: "0812-9999-8888" },
  }

  const adminAuth = {
    id: "demo-admin-id",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin", email: "admin@solulu.id", phone: "0812-3456-7890" },
  }

  const unauthorizedAuth = {
    id: "user-counselor-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  describe("getAdminProfileDataAction", () => {
    it("rejects unauthorized non-admin user", async () => {
      const res = await getAdminProfileDataAction({ currentUser: unauthorizedAuth as any })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("returns profile view for superadmin", async () => {
      const res = await getAdminProfileDataAction({ currentUser: superadminAuth as any })
      expect(res.success).toBe(true)
      expect(res.data?.role).toBe("superadmin")
      expect(res.data?.email).toBe("superadmin@solulu.id")
    })

    it("returns profile view for admin", async () => {
      const res = await getAdminProfileDataAction({ currentUser: adminAuth as any })
      expect(res.success).toBe(true)
      expect(res.data?.role).toBe("admin")
      expect(res.data?.email).toBe("admin@solulu.id")
    })
  })

  describe("updateAdminContactAction", () => {
    it("rejects non-admin user", async () => {
      const res = await updateAdminContactAction(
        { phone: "08123456789", notifyUrgent: true, notifyCounselor: true, notifySession: true },
        { currentUser: unauthorizedAuth as any }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("validates phone number minimum length", async () => {
      const res = await updateAdminContactAction(
        { phone: "123", notifyUrgent: true, notifyCounselor: true, notifySession: true },
        { currentUser: adminAuth as any }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("minimal 8 digit")
    })

    it("successfully updates contact for admin", async () => {
      const res = await updateAdminContactAction(
        { phone: "0812-9876-5432", notifyUrgent: true, notifyCounselor: false, notifySession: true },
        { currentUser: adminAuth as any }
      )
      expect(res.success).toBe(true)
      expect(res.message).toContain("berhasil disimpan")
    })
  })

  describe("updateAdminPasswordAction", () => {
    it("rejects non-admin user", async () => {
      const res = await updateAdminPasswordAction("NewPassword123!", { currentUser: unauthorizedAuth as any })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("validates password minimum length of 8 characters", async () => {
      const res = await updateAdminPasswordAction("short", { currentUser: adminAuth as any })
      expect(res.success).toBe(false)
      expect(res.error).toContain("minimal terdiri dari 8 karakter")
    })

    it("successfully updates password for admin", async () => {
      const res = await updateAdminPasswordAction("NewValidPassword2026!", { currentUser: adminAuth as any })
      expect(res.success).toBe(true)
      expect(res.message).toContain("berhasil diperbarui")
    })
  })
})
