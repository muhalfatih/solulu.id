import { describe, it, expect, beforeEach } from "vitest"
import {
  getPlatformSettingsAction,
  updatePlatformSettingsAction,
} from "../app/admin/settings/actions"
import {
  getZoomAccountsAction,
  revealZoomClientSecretAction,
} from "../app/admin/zoom-settings/actions"
import {
  getPlatformSettings,
  updatePlatformSettings,
  type AuthContext,
} from "../lib/settings/platform"
import { evaluateRbac, isSuperadmin, isAdminOrSuperadmin } from "../lib/supabase/rbac"
import { db } from "../db"
import { platformSettings, zoomAccounts } from "../db/schema"
import { eq } from "drizzle-orm"

describe("Ticket 10: Superadmin System Settings and Zoom Manager", () => {
  const superadminUser: AuthContext = {
    id: "superadmin-uuid-001",
    app_metadata: { role: "superadmin" },
    user_metadata: { role: "superadmin" },
  }

  const adminUser: AuthContext = {
    id: "admin-uuid-002",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  }

  const counselorUser: AuthContext = {
    id: "counselor-uuid-003",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  describe("1. RBAC & Superadmin Identity Helper", () => {
    it("recognizes superadmin role and permits admin route access", () => {
      expect(isSuperadmin(superadminUser)).toBe(true)
      expect(isSuperadmin(adminUser)).toBe(false)
      expect(isSuperadmin(counselorUser)).toBe(false)
      expect(isSuperadmin(null)).toBe(false)

      expect(isAdminOrSuperadmin(superadminUser)).toBe(true)
      expect(isAdminOrSuperadmin(adminUser)).toBe(true)
      expect(isAdminOrSuperadmin(counselorUser)).toBe(false)

      const decision = evaluateRbac(superadminUser, "/admin/settings")
      expect(decision).toEqual({ type: "allow" })

      const zoomDecision = evaluateRbac(superadminUser, "/admin/zoom")
      expect(zoomDecision).toEqual({ type: "allow" })
    })

    it("redirects superadmin from counselor routes to /admin/dashboard", () => {
      const decision = evaluateRbac(superadminUser, "/counselor/dashboard")
      expect(decision).toEqual({
        type: "redirect",
        destination: "/admin/dashboard",
      })
    })
  })

  describe("2. System Parameter Mutation & Superadmin Enforcement", () => {
    beforeEach(async () => {
      // Reset settings to default values for clean testing
      await updatePlatformSettings(
        {
          bookingCutoffHours: 4,
          rescheduleCutoffHours: 4,
          paymentHoldMinutes: 15,
          maxSlotQuota: 10,
          noShowTimeoutMinutes: 30,
          minCounselorWeeklySlots: 10,
          basePrice: "150000",
          counselorExtendFeePer30Min: "35000",
          psychologistExtendFeePer30Min: "50000",
          isManualPaymentEnabled: true,
          manualPaymentInstructions:
            "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.",
          isScreeningRequired: false,
        },
        { currentUser: superadminUser }
      )
    })

    it("allows Superadmin to update all operational parameters", async () => {
      const result = await updatePlatformSettingsAction(
        {
          bookingCutoffHours: 6,
          rescheduleCutoffHours: 8,
          paymentHoldMinutes: 20,
          maxSlotQuota: 12,
          noShowTimeoutMinutes: 45,
          minCounselorWeeklySlots: 15,
        },
        { currentUser: superadminUser }
      )

      expect(result.success).toBe(true)
      expect(result.settings?.bookingCutoffHours).toBe(6)
      expect(result.settings?.rescheduleCutoffHours).toBe(8)
      expect(result.settings?.paymentHoldMinutes).toBe(20)
      expect(result.settings?.maxSlotQuota).toBe(12)
      expect(result.settings?.noShowTimeoutMinutes).toBe(45)
      expect(result.settings?.minCounselorWeeklySlots).toBe(15)

      // Verify persisted in PostgreSQL
      const persisted = await getPlatformSettings()
      expect(persisted.bookingCutoffHours).toBe(6)
      expect(persisted.rescheduleCutoffHours).toBe(8)
      expect(persisted.paymentHoldMinutes).toBe(20)
      expect(persisted.maxSlotQuota).toBe(12)
    })

    it("blocks Admin (non-superadmin) from updating platform settings", async () => {
      const result = await updatePlatformSettingsAction(
        {
          bookingCutoffHours: 2,
        },
        { currentUser: adminUser }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("Hanya peran Superadmin")
    })

    it("blocks Counselor from updating platform settings", async () => {
      const result = await updatePlatformSettingsAction(
        {
          bookingCutoffHours: 2,
        },
        { currentUser: counselorUser }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("Hanya peran Superadmin")
    })

    it("validates boundary constraints for parameters", async () => {
      // Cutoff out of range (< 1)
      const invalidCutoff = await updatePlatformSettingsAction(
        { bookingCutoffHours: 0 },
        { currentUser: superadminUser }
      )
      expect(invalidCutoff.success).toBe(false)
      expect(invalidCutoff.error).toContain("antara 1 hingga 72 jam")

      // Hold minutes out of range (> 60)
      const invalidHold = await updatePlatformSettingsAction(
        { paymentHoldMinutes: 99 },
        { currentUser: superadminUser }
      )
      expect(invalidHold.success).toBe(false)
      expect(invalidHold.error).toContain("antara 5 hingga 60 menit")

      // Quota out of range (< 1)
      const invalidQuota = await updatePlatformSettingsAction(
        { maxSlotQuota: 0 },
        { currentUser: superadminUser }
      )
      expect(invalidQuota.success).toBe(false)
      expect(invalidQuota.error).toContain("antara 1 hingga 50 sesi")
    })
  })

  describe("3. Extend Session Fees Configuration (Per 30 Menit)", () => {
    it("allows Superadmin to update extend fees for Sebaya and Psikolog Klinis", async () => {
      const result = await updatePlatformSettingsAction(
        {
          counselorExtendFeePer30Min: "40000",
          psychologistExtendFeePer30Min: "60000",
        },
        { currentUser: superadminUser }
      )

      expect(result.success).toBe(true)
      expect(result.settings?.counselorExtendFeePer30Min).toBe("40000")
      expect(result.settings?.psychologistExtendFeePer30Min).toBe("60000")

      // Verify PostgreSQL read
      const settings = await getPlatformSettings()
      expect(settings.counselorExtendFeePer30Min).toBe("40000")
      expect(settings.psychologistExtendFeePer30Min).toBe("60000")
    })

    it("rejects negative extend fees", async () => {
      const result = await updatePlatformSettingsAction(
        {
          counselorExtendFeePer30Min: "-10000",
        },
        { currentUser: superadminUser }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("tidak boleh negatif")
    })
  })

  describe("4. Manual Bank Transfer Settings", () => {
    it("allows Superadmin to toggle manual transfer and update clinic account info", async () => {
      const newInstructions =
        "Transfer ke Rekening Mandiri: 987-654-3210 a.n. PT Solulu Sehat Jiwa. Harap lampirkan bukti transfer."

      const result = await updatePlatformSettingsAction(
        {
          isManualPaymentEnabled: false,
          manualPaymentInstructions: newInstructions,
        },
        { currentUser: superadminUser }
      )

      expect(result.success).toBe(true)
      expect(result.settings?.isManualPaymentEnabled).toBe(false)
      expect(result.settings?.manualPaymentInstructions).toBe(newInstructions)

      // Verify persistent read
      const settings = await getPlatformSettings()
      expect(settings.isManualPaymentEnabled).toBe(false)
      expect(settings.manualPaymentInstructions).toBe(newInstructions)
    })
  })

  describe("5. Zoom Manager & 4 Zoom Pro Accounts Overview", () => {
    it("lists all 4 Zoom Pro accounts with account numbers, active status, and 6-digit Host Keys", async () => {
      const res = await getZoomAccountsAction({ currentUser: superadminUser })

      expect(res.success).toBe(true)
      expect(res.accounts).toBeDefined()
      expect(res.accounts!.length).toBeGreaterThanOrEqual(2)

      const account1 = res.accounts?.find((a) => a.accountNumber === 1 || a.name.includes("1"))
      expect(account1).toBeDefined()
      expect(account1?.email).toBeDefined()
      expect(account1?.isActive).toBe(true)
      expect(account1?.hostKey).toBeDefined()
      expect(account1?.hostKey).toMatch(/^\d{6}$/)
    })

    it("protects Client Secret: hidden from regular Admin, viewable only by Superadmin", async () => {
      // 1. Regular Admin views Zoom accounts
      const adminView = await getZoomAccountsAction({ currentUser: adminUser })
      expect(adminView.success).toBe(true)
      expect(adminView.isSuperadmin).toBe(false)

      const sampleAccount = adminView.accounts?.[0]
      expect(sampleAccount).toBeDefined()
      expect(sampleAccount?.maskedClientSecret).toBe("••••••••••••")
      expect(sampleAccount?.decryptedSecret).toBeUndefined()

      // Regular Admin attempts to reveal secret
      const adminReveal = await revealZoomClientSecretAction(sampleAccount!.id, {
        currentUser: adminUser,
      })
      expect(adminReveal.success).toBe(false)
      expect(adminReveal.error).toContain("Hanya peran Superadmin")

      // 2. Superadmin views Zoom accounts
      const superView = await getZoomAccountsAction({ currentUser: superadminUser })
      expect(superView.success).toBe(true)
      expect(superView.isSuperadmin).toBe(true)
      expect(superView.accounts?.[0]?.decryptedSecret).toBeDefined()

      // Superadmin reveals secret
      const superReveal = await revealZoomClientSecretAction(sampleAccount!.id, {
        currentUser: superadminUser,
      })
      expect(superReveal.success).toBe(true)
      expect(superReveal.secret).toBeDefined()
    })
  })
})
