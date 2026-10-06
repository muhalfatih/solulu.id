import { describe, it, expect, vi } from "vitest"
import { getPublicR2Url } from "@/lib/r2"
import {
  createSpecializationAction,
  updateSpecializationAction,
  toggleSpecializationAction,
} from "@/app/admin/specializations/actions"
import { DEMO_SESSIONS } from "@/lib/session/types"

describe("Revision Features: R2 Domain, Specializations, and Payment Waiting Room", () => {
  describe("1. R2 Custom Domain URL Resolution", () => {
    it("formats public R2 URLs with https://cdn.solulu.id by default", () => {
      const url = getPublicR2Url("avatars/counselor-1.webp")
      expect(url).toBe("https://cdn.solulu.id/avatars/counselor-1.webp")
    })

    it("sanitizes leading and trailing slashes correctly", () => {
      const url = getPublicR2Url("/gallery/event-123.jpg")
      expect(url).toBe("https://cdn.solulu.id/gallery/event-123.jpg")
    })
  })

  describe("2. Specializations Admin Actions", () => {
    const adminUser = {
      id: "admin-uuid",
      email: "admin@solulu.id",
      user_metadata: { role: "admin" },
    }

    const nonAdminUser = {
      id: "user-uuid",
      email: "counselor@solulu.id",
      user_metadata: { role: "counselor" },
    }

    it("rejects non-admin access for creating specializations", async () => {
      const res = await createSpecializationAction(
        { name: "Krisis Eksistensial" },
        { currentUser: nonAdminUser }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("validates specialization name length", async () => {
      const res = await createSpecializationAction(
        { name: "A" },
        { currentUser: adminUser }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("minimal 2 karakter")
    })
  })

  describe("3. Payment Verification Waiting Room in Session Portal", () => {
    it("has demo-session-pending in DEMO_SESSIONS with status pending_payment", () => {
      const demoPending = DEMO_SESSIONS["demo-session-pending"]
      expect(demoPending).toBeDefined()
      expect(demoPending.booking.status).toBe("pending_payment")
      expect(demoPending.transaction).toBeDefined()
      expect(demoPending.transaction?.status).toBe("PENDING")
      expect(demoPending.booking.zoomJoinUrl).toBeNull()
    })

    it("confirmed demo sessions have status confirmed and active zoom links", () => {
      const demoUpcoming = DEMO_SESSIONS["demo-session-upcoming"]
      expect(demoUpcoming.booking.status).toBe("confirmed")
      expect(demoUpcoming.booking.zoomJoinUrl).toBeTruthy()
    })
  })
})
