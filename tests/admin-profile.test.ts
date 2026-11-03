import { describe, it, expect, vi } from "vitest"
import {
  getAdminProfileDataAction,
  updateAdminContactAction,
  updateAdminPasswordAction,
} from "../app/admin/profile/actions"

describe("Admin Profile Server Actions", () => {
  const superadminAuth = {
    id: "superadmin-user-1",
    app_metadata: { role: "superadmin" },
    email: "superadmin@solulu.id",
    user_metadata: { role: "superadmin", phone: "0812-9999-8888" },
  }

  const adminAuth = {
    id: "admin-user-1",
    app_metadata: { role: "admin" },
    email: "admin@solulu.id",
    user_metadata: { role: "admin", phone: "0812-3456-7890" },
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
      const updateUserFn = vi.fn().mockResolvedValue({ error: null })
      const res = await updateAdminContactAction(
        { phone: "0812-9876-5432", notifyUrgent: true, notifyCounselor: false, notifySession: true },
        { currentUser: adminAuth as any, updateUserFn }
      )
      expect(res.success).toBe(true)
      expect(res.message).toContain("berhasil disimpan")
      expect(updateUserFn).toHaveBeenCalledWith(
        "admin-user-1",
        expect.objectContaining({ user_metadata: expect.objectContaining({ phone: "0812-9876-5432" }) })
      )
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
      const updateUserFn = vi.fn().mockResolvedValue({ error: null })
      const res = await updateAdminPasswordAction("NewValidPassword2026!", {
        currentUser: adminAuth as any,
        updateUserFn,
      })
      expect(res.success).toBe(true)
      expect(updateUserFn).toHaveBeenCalledWith("admin-user-1", { password: "NewValidPassword2026!" })
      expect(res.message).toContain("berhasil diperbarui")
    })
  })
})
