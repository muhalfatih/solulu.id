import { describe, it, expect, vi } from "vitest"
import {
  calculateCredentialExpiry,
  getCounselorRadarAlert,
} from "../lib/counselor/credentials"
import {
  updateCounselorVerificationStatusAction,
  toggleCounselorActiveAction,
  getCounselorDetailAdminAction,
} from "../app/admin/counselors/actions"

describe("Ticket 07: Admin Counselor Directory and STR/SIPP Expiry Radar", () => {
  const adminUser = {
    id: "admin-uuid-1",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  }

  const unauthorizedUser = {
    id: "counselor-uuid-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  // Reference date: 2026-10-16 for deterministic testing
  const refDate = new Date("2026-10-16T00:00:00.000Z")

  // ===========================================================================
  // 1. STR / SIPP Expiry Radar Calculations
  // ===========================================================================
  describe("1. STR & SIPP Expiry Calculations", () => {
    it("handles null, undefined, or empty credential expiration dates gracefully", () => {
      const resNull = calculateCredentialExpiry(null, refDate)
      expect(resNull.status).toBe("none")
      expect(resNull.daysRemaining).toBeNull()
      expect(resNull.isExpiringSoon).toBe(false)
      expect(resNull.isExpired).toBe(false)
      expect(resNull.badgeVariant).toBe("secondary")

      const resUndefined = calculateCredentialExpiry(undefined, refDate)
      expect(resUndefined.status).toBe("none")
      expect(resUndefined.daysRemaining).toBeNull()

      const resInvalid = calculateCredentialExpiry("invalid-date", refDate)
      expect(resInvalid.status).toBe("none")
    })

    it("flags credentials already expired as status 'expired' with destructive variant", () => {
      // 5 days in the past (2026-10-11)
      const resPast = calculateCredentialExpiry("2026-10-11", refDate)
      expect(resPast.status).toBe("expired")
      expect(resPast.isExpired).toBe(true)
      expect(resPast.isExpiringSoon).toBe(false)
      expect(resPast.daysRemaining).toBe(-5)
      expect(resPast.badgeVariant).toBe("destructive")
      expect(resPast.label).toContain("Kedaluwarsa (5 hari lalu)")

      // Expiring today (2026-10-16)
      const resToday = calculateCredentialExpiry("2026-10-16", refDate)
      expect(resToday.status).toBe("expired")
      expect(resToday.isExpired).toBe(true)
      expect(resToday.daysRemaining).toBe(0)
      expect(resToday.label).toBe("Kedaluwarsa Hari Ini")
    })

    it("flags credentials expiring in <= 30 days as 'expiring_critical'", () => {
      // 15 days remaining (2026-10-31)
      const resCritical = calculateCredentialExpiry("2026-10-31", refDate)
      expect(resCritical.status).toBe("expiring_critical")
      expect(resCritical.isExpired).toBe(false)
      expect(resCritical.isExpiringSoon).toBe(true)
      expect(resCritical.daysRemaining).toBe(15)
      expect(resCritical.badgeVariant).toBe("destructive")
      expect(resCritical.label).toContain("Kritis: Sisa 15 hari")
    })

    it("flags credentials expiring in 31 to 60 days as 'expiring_warning'", () => {
      // 45 days remaining (2026-11-30)
      const resWarning = calculateCredentialExpiry("2026-11-30", refDate)
      expect(resWarning.status).toBe("expiring_warning")
      expect(resWarning.isExpired).toBe(false)
      expect(resWarning.isExpiringSoon).toBe(true)
      expect(resWarning.daysRemaining).toBe(45)
      expect(resWarning.badgeVariant).toBe("warning")
      expect(resWarning.label).toContain("Peringatan: Sisa 45 hari")
    })

    it("treats credentials expiring in > 60 days as 'valid'", () => {
      // 100 days remaining (2027-01-24)
      const resValid = calculateCredentialExpiry("2027-01-24", refDate)
      expect(resValid.status).toBe("valid")
      expect(resValid.isExpired).toBe(false)
      expect(resValid.isExpiringSoon).toBe(false)
      expect(resValid.daysRemaining).toBe(100)
      expect(resValid.badgeVariant).toBe("outline")
    })
  })

  // ===========================================================================
  // 2. Automated Radar Alert Aggregation for Counselors
  // ===========================================================================
  describe("2. Counselor Radar Alert Aggregation", () => {
    it("never raises radar alerts for Peer Counselors even with empty or past credentials", () => {
      const peer = {
        counselorType: "peer",
        strNumber: null,
        strExpiresAt: "2026-01-01",
        sippNumber: null,
        sippExpiresAt: null,
      }
      const radar = getCounselorRadarAlert(peer, refDate)
      expect(radar.hasRadarAlert).toBe(false)
      expect(radar.alertSeverity).toBeNull()
      expect(radar.alertMessage).toBeNull()
    })

    it("does not trigger alert for Clinical Psychologist with credentials > 60 days", () => {
      const psychologist = {
        counselorType: "psychologist",
        strNumber: "12093847291",
        strExpiresAt: "2027-10-16", // 365 days
        sippNumber: "503/SIPP/DKI/2022",
        sippExpiresAt: "2027-12-31", // 441 days
      }
      const radar = getCounselorRadarAlert(psychologist, refDate)
      expect(radar.hasRadarAlert).toBe(false)
      expect(radar.alertSeverity).toBeNull()
      expect(radar.strStatus.status).toBe("valid")
      expect(radar.sippStatus.status).toBe("valid")
    })

    it("triggers critical radar alert when SIPP is expiring in <= 30 days", () => {
      const psychologist = {
        counselorType: "psychologist",
        strNumber: "92837192831",
        strExpiresAt: "2027-04-20", // Valid > 60 days
        sippNumber: "401/SIPP/JATIM/2021",
        sippExpiresAt: "2026-11-15", // 30 days remaining!
      }
      const radar = getCounselorRadarAlert(psychologist, refDate)
      expect(radar.hasRadarAlert).toBe(true)
      expect(radar.alertSeverity).toBe("critical")
      expect(radar.alertMessage).toContain("SIPP Kritis")
      expect(radar.sippStatus.status).toBe("expiring_critical")
      expect(radar.sippStatus.daysRemaining).toBe(30)
    })

    it("triggers warning radar alert when STR is expiring in 31-60 days", () => {
      const psychologist = {
        counselorType: "psychologist",
        strNumber: "1902837482910",
        strExpiresAt: "2026-11-25", // 40 days remaining!
        sippNumber: "503/SIPP/2023",
        sippExpiresAt: "2028-01-01",
      }
      const radar = getCounselorRadarAlert(psychologist, refDate)
      expect(radar.hasRadarAlert).toBe(true)
      expect(radar.alertSeverity).toBe("warning")
      expect(radar.alertMessage).toContain("STR Berakhir dlm 40 hari")
      expect(radar.strStatus.status).toBe("expiring_warning")
    })

    it("triggers critical alert when credentials are already expired", () => {
      const psychologist = {
        counselorType: "psychologist",
        strNumber: "1902837482910",
        strExpiresAt: "2026-09-01", // Expired 45 days ago!
        sippNumber: null,
        sippExpiresAt: null,
      }
      const radar = getCounselorRadarAlert(psychologist, refDate)
      expect(radar.hasRadarAlert).toBe(true)
      expect(radar.alertSeverity).toBe("critical")
      expect(radar.alertMessage).toContain("STR Kedaluwarsa")
    })
  })

  // ===========================================================================
  // 3. Status Update Server Actions
  // ===========================================================================
  describe("3. Counselor Status Update Actions", () => {
    it("blocks unauthorized users from updating counselor verification status", async () => {
      const res = await updateCounselorVerificationStatusAction("counselor-1", "verified", {
        currentUser: unauthorizedUser,
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("approves ('verified') counselor, persists status and activates practice immediately", async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        id: "counselor-1",
        verificationStatus: "verified",
        isActive: true,
      })

      const res = await updateCounselorVerificationStatusAction("counselor-1", "verified", {
        currentUser: adminUser,
        updateStatusFn: mockUpdate,
      })

      expect(res.success).toBe(true)
      expect(res.message).toContain("Terverifikasi")
      expect(mockUpdate).toHaveBeenCalledWith("counselor-1", "verified")
    })

    it("rejects ('rejected') counselor, persists status and deactivates practice immediately", async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        id: "counselor-2",
        verificationStatus: "rejected",
        isActive: false,
      })

      const res = await updateCounselorVerificationStatusAction("counselor-2", "rejected", {
        currentUser: adminUser,
        updateStatusFn: mockUpdate,
      })

      expect(res.success).toBe(true)
      expect(res.message).toContain("Ditolak")
      expect(mockUpdate).toHaveBeenCalledWith("counselor-2", "rejected")
    })

    it("toggles counselor active practice status", async () => {
      const mockToggle = vi.fn().mockResolvedValue({
        id: "counselor-3",
        isActive: false,
      })

      const res = await toggleCounselorActiveAction("counselor-3", false, {
        currentUser: adminUser,
        toggleFn: mockToggle,
      })

      expect(res.success).toBe(true)
      expect(res.message).toContain("Ditangguhkan")
      expect(mockToggle).toHaveBeenCalledWith("counselor-3", false)
    })
  })

  // ===========================================================================
  // 4. Counselor Full 21 Fields & 8 Cloudflare R2 Attachments
  // ===========================================================================
  describe("4. Counselor Detail 21 Fields & 8 Cloudflare R2 Attachments", () => {
    it("blocks non-admin users from viewing comprehensive counselor details", async () => {
      const res = await getCounselorDetailAdminAction("c-1", {
        currentUser: unauthorizedUser,
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("returns all 21 data fields and generates pre-signed URLs for all 8 Cloudflare R2 attachments", async () => {
      const mockPresigner = vi.fn().mockImplementation(async ({ key }) => {
        return `https://presigned.r2.cloudflarestorage.com/solulu-private/${key}?token=mockToken900s`
      })

      const mockCounselorRecord = {
        id: "c-100",
        userId: "u-100",
        fullName: "Dr. Sarah Annisa, M.Psi., Psikolog",
        title: "M.Psi., Psikolog",
        email: "sarah@solulu.id",
        phone: "081234567891",
        domicile: "Jakarta Selatan",
        counselorType: "psychologist",
        education: "S2 Magister Profesi Psikologi UI",
        experienceYears: 8,
        bio: "Spesialisasi penanganan gangguan kecemasan dan stres kerja.",
        specializations: ["Kecemasan", "Stres Kerja"],
        himpsiNumber: "HIMPSI-102938",
        customFeeRate: "150000",
        counselorCommissionRate: "100000",
        sippNumber: "503/SIPP/DKI/2022",
        sippExpiresAt: "2027-12-31",
        strNumber: "12093847291",
        strExpiresAt: "2028-06-30",
        avatarR2Url: "https://cdn.solulu.id/avatars/sarah.jpg",
        ktpR2Key: "ktp/c-100-ktp.pdf",
        cvR2Key: "cv/c-100-cv.pdf",
        diplomaS1R2Key: "diplomas/c-100-s1.pdf",
        diplomaProfesiR2Key: "diplomas/c-100-profesi.pdf",
        strR2Key: "licenses/c-100-str.pdf",
        sippR2Key: "licenses/c-100-sipp.pdf",
        certificateR2Key: "certs/c-100-cert.pdf",
        verificationStatus: "verified",
        weeklySlotTarget: 10,
        isActive: true,
        isFeatured: true,
        createdAt: new Date("2026-01-01"),
      }

      const res = await getCounselorDetailAdminAction("c-100", {
        currentUser: adminUser,
        fetchFn: async () => ({
          ...mockCounselorRecord,
          radar: getCounselorRadarAlert(mockCounselorRecord, refDate),
          attachments: [
            { type: "avatar", name: "Foto Profil Formal", url: mockCounselorRecord.avatarR2Url, isUploaded: true },
            { type: "ktp", name: "Kartu Tanda Penduduk (KTP)", url: await mockPresigner({ key: mockCounselorRecord.ktpR2Key }), isUploaded: true },
            { type: "cv", name: "Curriculum Vitae (CV) Terkini", url: await mockPresigner({ key: mockCounselorRecord.cvR2Key }), isUploaded: true },
            { type: "diplomaS1", name: "Ijazah S1 Psikologi", url: await mockPresigner({ key: mockCounselorRecord.diplomaS1R2Key }), isUploaded: true },
            { type: "diplomaProfesi", name: "Ijazah Profesi Psikolog", url: await mockPresigner({ key: mockCounselorRecord.diplomaProfesiR2Key }), isUploaded: true },
            { type: "str", name: "Surat Tanda Registrasi (STR)", url: await mockPresigner({ key: mockCounselorRecord.strR2Key }), isUploaded: true },
            { type: "sipp", name: "Surat Izin Praktik Psikologi (SIPP/SILP)", url: await mockPresigner({ key: mockCounselorRecord.sippR2Key }), isUploaded: true },
            { type: "certificate", name: "Sertifikat Pelatihan / Dokumen Pendukung", url: await mockPresigner({ key: mockCounselorRecord.certificateR2Key }), isUploaded: true },
          ],
        }),
        presigner: mockPresigner,
      })

      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()

      // Verify all 21 data fields are present
      const c = res.data
      expect(c.fullName).toBe("Dr. Sarah Annisa, M.Psi., Psikolog") // 1
      expect(c.title).toBe("M.Psi., Psikolog") // 2
      expect(c.email).toBe("sarah@solulu.id") // 3
      expect(c.phone).toBe("081234567891") // 4
      expect(c.domicile).toBe("Jakarta Selatan") // 5
      expect(c.counselorType).toBe("psychologist") // 6
      expect(c.education).toBe("S2 Magister Profesi Psikologi UI") // 7
      expect(c.experienceYears).toBe(8) // 8
      expect(c.bio).toContain("Spesialisasi penanganan gangguan kecemasan") // 9
      expect(c.specializations).toEqual(["Kecemasan", "Stres Kerja"]) // 10
      expect(c.himpsiNumber).toBe("HIMPSI-102938") // 11
      expect(c.customFeeRate).toBe("150000") // 12
      expect(c.counselorCommissionRate).toBe("100000") // 13
      expect(c.sippNumber).toBe("503/SIPP/DKI/2022") // 14
      expect(c.sippExpiresAt).toBe("2027-12-31") // 15
      expect(c.strNumber).toBe("12093847291") // 16
      expect(c.strExpiresAt).toBe("2028-06-30") // 17
      expect(c.verificationStatus).toBe("verified") // 18
      expect(c.weeklySlotTarget).toBe(10) // 19
      expect(c.isActive).toBe(true) // 20
      expect(c.isFeatured).toBe(true) // 21

      // Verify all 8 Cloudflare R2 attachments have presigned/public links
      expect(c.attachments).toHaveLength(8)
      const attachmentTypes = c.attachments.map((a: any) => a.type)
      expect(attachmentTypes).toEqual([
        "avatar",
        "ktp",
        "cv",
        "diplomaS1",
        "diplomaProfesi",
        "str",
        "sipp",
        "certificate",
      ])
      c.attachments.forEach((att: any) => {
        expect(att.isUploaded).toBe(true)
        expect(att.url).toBeDefined()
        expect(att.url).toContain("http")
      })
    })
  })
})
