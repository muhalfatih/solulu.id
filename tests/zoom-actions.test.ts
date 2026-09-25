import { describe, it, expect, vi } from "vitest"
import {
  handleSaveZoomAccount,
  handleUpdateZoomAccount,
  handleDeleteZoomAccount,
} from "../app/admin/zoom-settings/actions"
import { zoomAccountInputSchema } from "../app/admin/zoom-settings/schema"
import { encrypt, decrypt } from "../lib/encryption"

describe("Seam 3: Zoom Server Actions & RBAC (app/admin/zoom-settings/actions.ts)", () => {
  const adminUser = {
    id: "admin-1",
    app_metadata: { role: "admin" },
  }

  const counselorUser = {
    id: "counselor-1",
    app_metadata: { role: "counselor" },
  }

  describe("Validation schema (zoomAccountInputSchema)", () => {
    it("validates a correct zoom account payload", () => {
      const valid = zoomAccountInputSchema.safeParse({
        name: "Akun Zoom Pro 1",
        email: "zoom1@solulu.id",
        accountId: "zm_acc_123",
        clientId: "zm_cli_456",
        clientSecret: "zm_sec_789",
      })
      expect(valid.success).toBe(true)
    })

    it("rejects invalid email or empty strings", () => {
      const invalid = zoomAccountInputSchema.safeParse({
        name: "",
        email: "not-an-email",
        accountId: "",
        clientId: "",
        clientSecret: "",
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe("handleSaveZoomAccount", () => {
    it("blocks non-admin users from adding accounts", async () => {
      const result = await handleSaveZoomAccount(
        {
          name: "Akun Zoom Pro 1",
          email: "zoom1@solulu.id",
          accountId: "zm_acc_123",
          clientId: "zm_cli_456",
          clientSecret: "zm_sec_789",
        },
        { currentUser: counselorUser }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("Akses ditolak: Diperlukan role Admin")
    })

    it("blocks adding when max 2 accounts limit is reached", async () => {
      const mockCanAdd = vi.fn().mockResolvedValue({
        allowed: false,
        currentCount: 2,
        error:
          "Batas platform tercapai: Solulu dibatasi maksimal 2 akun Zoom Pro aktif.",
      })

      const result = await handleSaveZoomAccount(
        {
          name: "Akun Zoom Pro 3",
          email: "zoom3@solulu.id",
          accountId: "zm_acc_999",
          clientId: "zm_cli_999",
          clientSecret: "zm_sec_999",
        },
        {
          currentUser: adminUser,
          canAddCheck: mockCanAdd,
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain("maksimal 2 akun Zoom")
    })

    it("encrypts clientSecret with AES-256-GCM before saving to database", async () => {
      let savedRecord: any = null
      const mockInsert = vi.fn().mockImplementation(async (record) => {
        savedRecord = record
        return { id: "zoom-new-id", ...record }
      })

      const result = await handleSaveZoomAccount(
        {
          name: "Akun Zoom Pro 1",
          email: "zoom1@solulu.id",
          accountId: "zm_acc_111",
          clientId: "zm_cli_222",
          clientSecret: "raw_secret_xyz_123",
        },
        {
          currentUser: adminUser,
          canAddCheck: vi
            .fn()
            .mockResolvedValue({ allowed: true, currentCount: 0 }),
          insertAccount: mockInsert,
        }
      )

      expect(result.success).toBe(true)
      expect(savedRecord).toBeDefined()
      expect(savedRecord.clientSecretEncrypted).not.toBe("raw_secret_xyz_123")
      expect(savedRecord.clientSecretEncrypted.split(":").length).toBe(3)

      // Verify that decrypting the stored value restores the raw secret
      const decrypted = decrypt(savedRecord.clientSecretEncrypted)
      expect(decrypted).toBe("raw_secret_xyz_123")
    })
  })

  describe("handleUpdateZoomAccount & Safety Lock", () => {
    it("blocks update when Safety Lock is active", async () => {
      const mockSafetyLock = vi.fn().mockResolvedValue({
        isLocked: true,
        upcomingSessionCount: 3,
        lockedSessions: [{ bookingId: "b-1" }],
        reason:
          "Akun Zoom terkunci: terdapat 3 sesi mendatang yang bergantung pada akun ini.",
      })

      const mockUpdate = vi.fn()

      const result = await handleUpdateZoomAccount(
        "zoom-acc-1",
        { name: "Updated Name" },
        {
          currentUser: adminUser,
          safetyLockCheck: mockSafetyLock,
          updateAccount: mockUpdate,
        }
      )

      expect(result.success).toBe(false)
      expect(result.isLocked).toBe(true)
      expect(result.error).toContain("terdapat 3 sesi mendatang")
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it("allows update when Safety Lock is NOT active", async () => {
      const mockSafetyLock = vi.fn().mockResolvedValue({
        isLocked: false,
        upcomingSessionCount: 0,
        lockedSessions: [],
      })

      const mockUpdate = vi
        .fn()
        .mockResolvedValue({ id: "zoom-acc-1", name: "Safe Name" })

      const result = await handleUpdateZoomAccount(
        "zoom-acc-1",
        { name: "Safe Name" },
        {
          currentUser: adminUser,
          safetyLockCheck: mockSafetyLock,
          updateAccount: mockUpdate,
        }
      )

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe("handleDeleteZoomAccount & Safety Lock", () => {
    it("blocks delete when Safety Lock is active", async () => {
      const mockSafetyLock = vi.fn().mockResolvedValue({
        isLocked: true,
        upcomingSessionCount: 1,
        lockedSessions: [{ bookingId: "b-9" }],
        reason:
          "Akun Zoom terkunci: terdapat 1 sesi mendatang yang bergantung pada akun ini.",
      })

      const mockDelete = vi.fn()

      const result = await handleDeleteZoomAccount("zoom-acc-1", {
        currentUser: adminUser,
        safetyLockCheck: mockSafetyLock,
        deleteAccount: mockDelete,
      })

      expect(result.success).toBe(false)
      expect(result.isLocked).toBe(true)
      expect(result.error).toContain("terdapat 1 sesi mendatang")
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it("allows delete when Safety Lock is NOT active", async () => {
      const mockSafetyLock = vi.fn().mockResolvedValue({
        isLocked: false,
        upcomingSessionCount: 0,
        lockedSessions: [],
      })

      const mockDelete = vi.fn().mockResolvedValue(true)

      const result = await handleDeleteZoomAccount("zoom-acc-1", {
        currentUser: adminUser,
        safetyLockCheck: mockSafetyLock,
        deleteAccount: mockDelete,
      })

      expect(result.success).toBe(true)
      expect(mockDelete).toHaveBeenCalledWith("zoom-acc-1")
    })
  })
})
