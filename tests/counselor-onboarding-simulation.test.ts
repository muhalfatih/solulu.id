import { describe, it, expect, vi } from "vitest"
import { submitCounselorApplicationAction, getPresignedUploadUrlAction } from "@/app/apply/actions"
import {
  getCounselorApplicationsAction,
  getApplicationDocumentUrlAction,
  reviewCounselorApplicationAction,
} from "@/app/admin/counselors/applications/actions"
import { evaluateRbac } from "@/lib/supabase/rbac"
import { updateCounselorPasswordAction } from "@/app/counselor/actions"

describe("End-to-End Simulation: Counselor Onboarding Pipeline (/apply -> Admin -> /counselor)", () => {
  const adminUser = {
    id: "admin-super-01",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  }

  // State mock DB storage across the simulation lifecycle
  let mockDbApplications: any[] = []
  let mockDbCounselors: any[] = []
  let mockAuthUsers: any[] = []
  let mockSentEmails: any[] = []

  const testApplicant = {
    fullName: "Dewi Sartika, M.Psi.",
    email: "dewi.sartika@solulu.id",
    phone: "081298765432",
    counselorType: "psychologist" as const,
    bio: "Psikolog klinis dengan pengalaman 6 tahun menangani kecemasan, trauma, dan stres kerja.",
    cvR2Key: "counselor-applications/cv/dewi-cv.pdf",
    ktpR2Key: "counselor-applications/ktp/dewi-ktp.jpg",
    diplomaR2Key: "counselor-applications/diploma/dewi-ijazah.pdf",
    strR2Key: "counselor-applications/str/dewi-str.pdf",
    agreeToTerms: true as const,
  }

  // --- STAGE 1: Public Registration at /apply ---
  describe("Tahap 1: Registrasi Publik Calon Konselor di /apply", () => {
    it("1.1 Menghasilkan Presigned PUT URL untuk upload berkas R2 secara direct", async () => {
      const presignerMock = vi.fn().mockResolvedValue({
        uploadUrl: "https://r2.storage.solulu.id/counselor-applications/cv/dewi-cv.pdf?signed=1",
        key: "counselor-applications/cv/dewi-cv.pdf",
      })

      const res = await getPresignedUploadUrlAction(
        {
          fileType: "application/pdf",
          fileName: "dewi-cv.pdf",
          category: "cv",
        },
        { presigner: presignerMock }
      )

      expect(res.success).toBe(true)
      expect(res.data?.uploadUrl).toContain("counselor-applications/cv/")
      expect(res.data?.r2Key).toBeDefined()
    })

    it("1.2 Menerima formulir pendaftaran dan menyimpan ke database dengan status pending", async () => {
      const mockInsert = vi.fn().mockImplementation(async (record) => {
        const row = {
          id: "11111111-2222-4333-8444-555555555555",
          ...record,
          createdAt: new Date(),
        }
        mockDbApplications.push(row)
        return row
      })

      const mockFindExisting = vi.fn().mockImplementation(async (email) => {
        return mockDbApplications.find((a) => a.email === email) || null
      })

      const res = await submitCounselorApplicationAction(testApplicant, {
        insertFn: mockInsert,
        findExistingFn: mockFindExisting,
      })

      expect(res.success).toBe(true)
      expect(res.data?.applicationId).toBe("11111111-2222-4333-8444-555555555555")
      expect(mockDbApplications.length).toBe(1)
      expect(mockDbApplications[0].status).toBe("pending")
      expect(mockDbApplications[0].email).toBe("dewi.sartika@solulu.id")
    })

    it("1.3 Mencegah duplikasi pendaftaran saat aplikasi sebelumnya masih berstatus pending", async () => {
      const mockFindExisting = vi.fn().mockImplementation(async (email) => {
        return mockDbApplications.find((a) => a.email === email) || null
      })

      const duplicateRes = await submitCounselorApplicationAction(testApplicant, {
        findExistingFn: mockFindExisting,
      })

      expect(duplicateRes.success).toBe(false)
      expect(duplicateRes.error).toContain("sedang dalam proses verifikasi")
    })
  })

  // --- STAGE 2: Admin Review & Verification ---
  describe("Tahap 2: Tinjauan Dokumen & Verifikasi di Dashboard Admin", () => {
    it("2.1 Admin melihat daftar aplikasi konselor baru di /admin/counselors/applications", async () => {
      const res = await getCounselorApplicationsAction({
        currentUser: adminUser,
        fetchApplicationsFn: async () => mockDbApplications,
      })

      expect(res.success).toBe(true)
      expect(res.data).toBeDefined()
      expect(res.data?.length).toBe(1)
      expect(res.data?.[0].fullName).toBe("Dewi Sartika, M.Psi.")
      expect(res.data?.[0].status).toBe("pending")
    })

    it("2.2 Admin membuka dokumen STR dan Ijazah dengan Presigned GET URL (15 menit)", async () => {
      const mockPresigner = vi.fn().mockResolvedValue("https://r2.storage.solulu.id/dewi-str.pdf?token=exp900")

      const res = await getApplicationDocumentUrlAction(
        {
          applicationId: "11111111-2222-4333-8444-555555555555",
          documentType: "str",
        },
        {
          currentUser: adminUser,
          fetchApplicationFn: async () => mockDbApplications[0],
          presigner: mockPresigner,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.expiresInSeconds).toBe(900)
      expect(res.data?.url).toContain("token=exp900")
    })
  })

  // --- STAGE 3: Approval, Direct Credential Issuance & Email Dispatch ---
  describe("Tahap 3: Persetujuan, Pembuatan Akun Auth & Pengiriman Kredensial", () => {
    it("3.1 Menyetujui aplikasi, menetapkan kata sandi, membuat user Auth, dan mengirim email Resend", async () => {
      const mockCreateUser = vi.fn().mockImplementation(async (params) => {
        const newUser = {
          id: "auth-dewi-uid-888",
          email: params.email,
          user_metadata: params.user_metadata,
          app_metadata: params.app_metadata,
        }
        mockAuthUsers.push(newUser)
        return { data: { user: newUser }, error: null }
      })

      const mockInsertCounselor = vi.fn().mockImplementation(async (record) => {
        const row = {
          id: "counselor-dewi-db-999",
          ...record,
        }
        mockDbCounselors.push(row)
        return row
      })

      const mockUpdateApplication = vi.fn().mockImplementation(async (id, update) => {
        const idx = mockDbApplications.findIndex((a) => a.id === id)
        if (idx >= 0) {
          mockDbApplications[idx] = { ...mockDbApplications[idx], ...update }
        }
        return mockDbApplications[idx]
      })

      const mockSendEmail = vi.fn().mockImplementation(async (payload) => {
        mockSentEmails.push(payload)
        return { success: true, id: "email-resend-msg-101" }
      })

      const res = await reviewCounselorApplicationAction(
        {
          applicationId: "11111111-2222-4333-8444-555555555555",
          status: "approved",
          title: "M.Psi., Psikolog",
          initialPassword: "DewiSolulu2026!",
        },
        {
          currentUser: adminUser,
          fetchApplicationFn: async () => mockDbApplications[0],
          createUserFn: mockCreateUser,
          insertCounselorFn: mockInsertCounselor,
          updateApplicationFn: mockUpdateApplication,
          sendEmailFn: mockSendEmail,
        }
      )

      expect(res.success).toBe(true)
      // Status aplikasi berubah jadi approved
      expect(mockDbApplications[0].status).toBe("approved")

      // User Auth terbuat dengan role counselor
      expect(mockAuthUsers.length).toBe(1)
      expect(mockAuthUsers[0].id).toBe("auth-dewi-uid-888")
      expect(mockAuthUsers[0].user_metadata.role).toBe("counselor")

      // Record mitra konselor masuk ke tabel counselors
      expect(mockDbCounselors.length).toBe(1)
      expect(mockDbCounselors[0].userId).toBe("auth-dewi-uid-888")
      expect(mockDbCounselors[0].isActive).toBe(true)

      // Kredensial login dikirimkan ke email pelamar via Resend
      expect(mockSentEmails.length).toBe(1)
      expect(mockSentEmails[0].counselorEmail).toBe("dewi.sartika@solulu.id")
      expect(mockSentEmails[0].temporaryPassword).toBe("DewiSolulu2026!")

      // Action mengembalikan kredensial agar admin bisa menyalin ke WhatsApp
      expect(res.credentials).toBeDefined()
      expect(res.credentials?.email).toBe("dewi.sartika@solulu.id")
      expect(res.credentials?.password).toBe("DewiSolulu2026!")
      expect(res.credentials?.phone).toBe("081298765432")
    })
  })

  // --- STAGE 4: Login & RBAC Routing Enforcement ---
  describe("Tahap 4: Login & Akses Portal Konselor (/counselor)", () => {
    it("4.1 RBAC mengizinkan konselor yang berhasil login untuk mengakses /counselor/dashboard", () => {
      const activeCounselorUser = {
        id: "auth-dewi-uid-888",
        app_metadata: { role: "counselor" },
        user_metadata: { role: "counselor" },
      }

      const decision = evaluateRbac(activeCounselorUser, "/counselor/dashboard")
      expect(decision.type).toBe("allow")
    })

    it("4.2 RBAC menolak konselor mengakses rute admin dan mengarahkan ke dashboard konselor", () => {
      const activeCounselorUser = {
        id: "auth-dewi-uid-888",
        user_metadata: { role: "counselor" },
      }

      const decision = evaluateRbac(activeCounselorUser, "/admin/counselors")
      expect(decision.type).toBe("redirect")
      if (decision.type === "redirect") {
        expect(decision.destination).toBe("/counselor/dashboard")
      }
    })

    it("4.3 RBAC mengarahkan pengguna tanpa otentikasi ke halaman /login", () => {
      const unauthenticatedDecision = evaluateRbac(null, "/counselor/dashboard")
      expect(unauthenticatedDecision.type).toBe("redirect")
      if (unauthenticatedDecision.type === "redirect") {
        expect(unauthenticatedDecision.destination).toContain("/login?redirect=")
      }
    })
  })

  // --- STAGE 5: Password Change in Counselor Profile ---
  describe("Tahap 5: Pembaruan Kata Sandi di Halaman Profil Konselor", () => {
    it("5.1 Konselor dapat memperbarui kata sandi sementara menjadi kata sandi permanen", async () => {
      const counselorAuthContext = {
        id: "auth-dewi-uid-888",
        counselorId: "counselor-dewi-db-999",
        user_metadata: { role: "counselor" },
      }

      let updatedPasswordValue = ""
      const mockUpdateAuthUser = vi.fn().mockImplementation(async (id, attrs) => {
        updatedPasswordValue = attrs.password
        return { data: { id }, error: null }
      })

      const res = await updateCounselorPasswordAction("DewiPermanenSandi2026#", {
        currentUser: counselorAuthContext,
        updateUserFn: mockUpdateAuthUser,
      })

      expect(res.success).toBe(true)
      expect(res.data?.updated).toBe(true)
      expect(updatedPasswordValue).toBe("DewiPermanenSandi2026#")
    })

    it("5.2 Menolak pembaruan kata sandi jika kurang dari 8 karakter", async () => {
      const counselorAuthContext = {
        id: "auth-dewi-uid-888",
        user_metadata: { role: "counselor" },
      }

      const res = await updateCounselorPasswordAction("pendek", {
        currentUser: counselorAuthContext,
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("minimal 8 karakter")
    })
  })
})
