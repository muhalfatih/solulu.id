import { describe, it, expect, vi } from "vitest"
import {
  counselorApplicationInputSchema,
  presignedUploadRequestSchema,
  reviewApplicationInputSchema,
} from "../lib/validations/counselor-application"
import {
  getPresignedUploadUrlAction,
  submitCounselorApplicationAction,
} from "../app/apply/actions"
import {
  getCounselorApplicationsAction,
  getApplicationDocumentUrlAction,
  reviewCounselorApplicationAction,
} from "../app/admin/counselors/applications/actions"

describe("Issue #4: Counselor Application & Admin Approval Pipeline", () => {
  const adminUser = {
    id: "admin-1",
    app_metadata: { role: "admin" },
  }

  const counselorUser = {
    id: "counselor-1",
    app_metadata: { role: "counselor" },
  }

  describe("1. Validation & Acceptance Criteria (lib/validations/counselor-application.ts)", () => {
    it("validates a peer counselor application without STR requirement", () => {
      const validPeer = counselorApplicationInputSchema.safeParse({
        fullName: "Ahmad Dahlan",
        email: "ahmad@solulu.id",
        phone: "081234567890",
        counselorType: "peer",
        bio: "Konselor sebaya berpengalaman di organisasi kemahasiswaan dan bimbingan konseling.",
        cvR2Key: "counselor-applications/cv/abc-cv.pdf",
        ktpR2Key: "counselor-applications/ktp/abc-ktp.jpg",
        diplomaR2Key: "counselor-applications/diploma/abc-ijazah.pdf",
        strR2Key: null,
        agreeToTerms: true,
      })

      expect(validPeer.success).toBe(true)
    })

    it("requires STR when applicant is a psychologist (counselorType = 'psychologist')", () => {
      const psychologistWithoutStr = counselorApplicationInputSchema.safeParse({
        fullName: "Dr. Siti Aminah, M.Psi.",
        email: "siti@solulu.id",
        phone: "+6281987654321",
        counselorType: "psychologist",
        bio: "Psikolog klinis dengan pengalaman 5 tahun menangani kecemasan dan depresi.",
        cvR2Key: "counselor-applications/cv/def-cv.pdf",
        ktpR2Key: "counselor-applications/ktp/def-ktp.jpg",
        diplomaR2Key: "counselor-applications/diploma/def-ijazah.pdf",
        strR2Key: "", // Missing STR
        agreeToTerms: true,
      })

      expect(psychologistWithoutStr.success).toBe(false)
      if (!psychologistWithoutStr.success) {
        const issues = psychologistWithoutStr.error.issues
        expect(issues.some((i) => i.path.includes("strR2Key"))).toBe(true)
      }

      // With STR provided
      const psychologistWithStr = counselorApplicationInputSchema.safeParse({
        fullName: "Dr. Siti Aminah, M.Psi.",
        email: "siti@solulu.id",
        phone: "+6281987654321",
        counselorType: "psychologist",
        bio: "Psikolog klinis dengan pengalaman 5 tahun menangani kecemasan dan depresi.",
        cvR2Key: "counselor-applications/cv/def-cv.pdf",
        ktpR2Key: "counselor-applications/ktp/def-ktp.jpg",
        diplomaR2Key: "counselor-applications/diploma/def-ijazah.pdf",
        strR2Key: "counselor-applications/str/def-str.pdf",
        agreeToTerms: true,
      })

      expect(psychologistWithStr.success).toBe(true)
    })

    it("rejects invalid Indonesian phone formats and unaccepted terms", () => {
      const invalid = counselorApplicationInputSchema.safeParse({
        fullName: "Al",
        email: "not-an-email",
        phone: "12345",
        counselorType: "peer",
        bio: "too short",
        cvR2Key: "",
        ktpR2Key: "",
        diplomaR2Key: "",
        agreeToTerms: false,
      })

      expect(invalid.success).toBe(false)
    })

    it("validates direct R2 upload mime types and categories", () => {
      const validPdf = presignedUploadRequestSchema.safeParse({
        fileType: "application/pdf",
        fileName: "my-cv.pdf",
        category: "cv",
      })
      expect(validPdf.success).toBe(true)

      const invalidExe = presignedUploadRequestSchema.safeParse({
        fileType: "application/x-msdownload",
        fileName: "malware.exe",
        category: "cv",
      })
      expect(invalidExe.success).toBe(false)
    })
  })

  describe("2. Public Application Actions (app/apply/actions.ts)", () => {
    it("generates presigned PUT URL for direct R2 upload bypassing Vercel server", async () => {
      const mockPresigner = vi.fn().mockResolvedValue({
        uploadUrl: "https://r2.cloudflarestorage.com/solulu-private/test-url",
        key: "counselor-applications/cv/xyz-cv.pdf",
        bucket: "solulu-private",
      })

      const res = await getPresignedUploadUrlAction(
        {
          fileType: "application/pdf",
          fileName: "resume.pdf",
          category: "cv",
        },
        { presigner: mockPresigner }
      )

      expect(res.success).toBe(true)
      expect(res.data?.uploadUrl).toContain("https://r2.cloudflarestorage.com")
      expect(res.data?.r2Key).toContain("counselor-applications/cv/")
      expect(mockPresigner).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: "application/pdf",
          expiresIn: 3600,
        })
      )
    })

    it("records applicant data and agreedToTermsAt timestamp", async () => {
      let insertedRecord: any = null
      const mockInsert = vi.fn().mockImplementation(async (record) => {
        insertedRecord = record
        return { id: "app-1234", ...record }
      })

      const res = await submitCounselorApplicationAction(
        {
          fullName: "Budi Santoso",
          email: "budi@solulu.id",
          phone: "081234567890",
          counselorType: "peer",
          bio: "Pengalaman mendampingi teman sebaya dan mahasiswa dalam mengelola stres akademik.",
          cvR2Key: "counselor-applications/cv/budi-cv.pdf",
          ktpR2Key: "counselor-applications/ktp/budi-ktp.jpg",
          diplomaR2Key: "counselor-applications/diploma/budi-ijazah.pdf",
          agreeToTerms: true,
        },
        {
          insertFn: mockInsert,
          findExistingFn: vi.fn().mockResolvedValue(null),
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.applicationId).toBe("app-1234")
      expect(insertedRecord).toBeDefined()
      expect(insertedRecord.status).toBe("pending")
      expect(insertedRecord.agreedToTermsAt).toBeInstanceOf(Date)
    })

    it("prevents submitting duplicate application while an existing one is pending", async () => {
      const res = await submitCounselorApplicationAction(
        {
          fullName: "Budi Santoso",
          email: "budi@solulu.id",
          phone: "081234567890",
          counselorType: "peer",
          bio: "Pengalaman mendampingi teman sebaya dan mahasiswa dalam mengelola stres akademik.",
          cvR2Key: "counselor-applications/cv/budi-cv.pdf",
          ktpR2Key: "counselor-applications/ktp/budi-ktp.jpg",
          diplomaR2Key: "counselor-applications/diploma/budi-ijazah.pdf",
          agreeToTerms: true,
        },
        {
          findExistingFn: vi.fn().mockResolvedValue({
            id: "existing-app",
            email: "budi@solulu.id",
            status: "pending",
          }),
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("sedang dalam proses verifikasi")
    })
  })

  describe("3. Admin Review & Approval Pipeline (app/admin/counselors/applications/actions.ts)", () => {
    const sampleApplication = {
      id: "11111111-2222-4333-8444-555555555555",
      fullName: "Nurul Hidayah, M.Psi., Psikolog",
      email: "nurul@solulu.id",
      phone: "081398765432",
      counselorType: "psychologist",
      bio: "Spesialisasi dalam cognitive behavioral therapy untuk trauma dan depresi.",
      cvR2Key: "counselor-applications/cv/nurul-cv.pdf",
      ktpR2Key: "counselor-applications/ktp/nurul-ktp.jpg",
      diplomaR2Key: "counselor-applications/diploma/nurul-ijazah.pdf",
      strR2Key: "counselor-applications/str/nurul-str.pdf",
      status: "pending",
      rejectionReason: null,
      agreedToTermsAt: new Date("2026-09-20T10:00:00Z"),
      createdAt: new Date("2026-09-20T10:00:00Z"),
    }

    it("enforces admin role RBAC protection for all admin application endpoints", async () => {
      const listRes = await getCounselorApplicationsAction({
        currentUser: counselorUser,
      })
      expect(listRes.success).toBe(false)
      expect(listRes.error).toContain("Diperlukan role Admin")

      const docRes = await getApplicationDocumentUrlAction(
        {
          applicationId: sampleApplication.id,
          documentType: "cv",
        },
        { currentUser: counselorUser }
      )
      expect(docRes.success).toBe(false)
      expect(docRes.error).toContain("Diperlukan role Admin")

      const reviewRes = await reviewCounselorApplicationAction(
        {
          applicationId: sampleApplication.id,
          status: "approved",
        },
        { currentUser: counselorUser }
      )
      expect(reviewRes.success).toBe(false)
      expect(reviewRes.error).toContain("Diperlukan role Admin")
    })

    it("generates presigned GET URL with 15-minute (900s) expiry for reviewing private documents", async () => {
      const mockPresigner = vi.fn().mockResolvedValue("https://r2.storage/solulu-private/nurul-cv.pdf?signed=1")

      const res = await getApplicationDocumentUrlAction(
        {
          applicationId: sampleApplication.id,
          documentType: "cv",
        },
        {
          currentUser: adminUser,
          fetchApplicationFn: vi.fn().mockResolvedValue(sampleApplication),
          presigner: mockPresigner,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.url).toContain("nurul-cv.pdf")
      expect(res.data?.fileName).toBe("nurul-cv.pdf")
      expect(res.data?.r2Key).toBe("counselor-applications/cv/nurul-cv.pdf")
      expect(res.data?.expiresInSeconds).toBe(900)
      expect(mockPresigner).toHaveBeenCalledWith({
        key: "counselor-applications/cv/nurul-cv.pdf",
        expiresIn: 900,
      })
    })

    it("handles mock applicant IDs with fallback mock records in demo mode", async () => {
      const mockPresigner = vi.fn().mockResolvedValue("https://r2.storage/solulu-private/mock-ktp.jpg?signed=1")

      const res = await getApplicationDocumentUrlAction(
        {
          applicationId: "app-1",
          documentType: "ktp",
        },
        {
          currentUser: adminUser,
          fetchApplicationFn: vi.fn().mockResolvedValue(null),
          presigner: mockPresigner,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.fileName).toBe("mock-ktp.jpg")
      expect(res.data?.applicantName).toBe("Sarah Annisa, M.Psi., Psikolog")
    })

    it("handles rejection by recording optional rejection reason and updating status", async () => {
      let updatedStatus: any = null
      const mockUpdate = vi.fn().mockImplementation(async (id, update) => {
        updatedStatus = update
        return { ...sampleApplication, ...update }
      })

      const res = await reviewCounselorApplicationAction(
        {
          applicationId: sampleApplication.id,
          status: "rejected",
          rejectionReason: "STR tidak terbaca dan masa berlaku telah kedaluwarsa.",
        },
        {
          currentUser: adminUser,
          fetchApplicationFn: vi.fn().mockResolvedValue(sampleApplication),
          updateApplicationFn: mockUpdate,
        }
      )

      expect(res.success).toBe(true)
      expect(updatedStatus).toBeDefined()
      expect(updatedStatus.status).toBe("rejected")
      expect(updatedStatus.rejectionReason).toBe("STR tidak terbaca dan masa berlaku telah kedaluwarsa.")
    })

    it("handles Supabase Auth 4/hour rate limit error without crashing and shows informative message", async () => {
      const mockInviteRateLimited = vi.fn().mockResolvedValue({
        data: null,
        error: {
          status: 429,
          message: "over_email_send_rate_limit: email rate limit exceeded",
        },
      })

      const res = await reviewCounselorApplicationAction(
        {
          applicationId: sampleApplication.id,
          status: "approved",
        },
        {
          currentUser: adminUser,
          fetchApplicationFn: vi.fn().mockResolvedValue(sampleApplication),
          inviteUserFn: mockInviteRateLimited,
        }
      )

      expect(res.success).toBe(false)
      expect(res.isRateLimit).toBe(true)
      expect(res.error).toContain("Batas pengiriman email Supabase (4 undangan per jam)")
    })

    it("on approval: triggers Supabase invite, creates counselor table record, and updates application status", async () => {
      const mockInviteSuccess = vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "auth-user-counselor-789",
            email: "nurul@solulu.id",
          },
        },
        error: null,
      })

      let insertedCounselor: any = null
      const mockInsertCounselor = vi.fn().mockImplementation(async (record) => {
        insertedCounselor = record
        return { id: "counselor-table-uuid-1", ...record }
      })

      let updatedApplication: any = null
      const mockUpdateApplication = vi.fn().mockImplementation(async (id, update) => {
        updatedApplication = update
        return { ...sampleApplication, ...update }
      })

      const res = await reviewCounselorApplicationAction(
        {
          applicationId: sampleApplication.id,
          status: "approved",
          title: "M.Psi., Psikolog",
        },
        {
          currentUser: adminUser,
          fetchApplicationFn: vi.fn().mockResolvedValue(sampleApplication),
          inviteUserFn: mockInviteSuccess,
          insertCounselorFn: mockInsertCounselor,
          updateApplicationFn: mockUpdateApplication,
        }
      )

      expect(res.success).toBe(true)
      expect(mockInviteSuccess).toHaveBeenCalledWith(
        "nurul@solulu.id",
        expect.objectContaining({
          role: "counselor",
          full_name: "Nurul Hidayah, M.Psi., Psikolog",
          counselor_type: "psychologist",
        })
      )

      // Counselor record in database
      expect(insertedCounselor).toBeDefined()
      expect(insertedCounselor.userId).toBe("auth-user-counselor-789")
      expect(insertedCounselor.fullName).toBe("Nurul Hidayah, M.Psi., Psikolog")
      expect(insertedCounselor.title).toBe("M.Psi., Psikolog")
      expect(insertedCounselor.counselorType).toBe("psychologist")
      expect(insertedCounselor.isActive).toBe(true)

      // Application status updated
      expect(updatedApplication).toBeDefined()
      expect(updatedApplication.status).toBe("approved")
    })

    it("approves application with direct initialPassword, bypasses rate limit, and dispatches welcome email", async () => {
      let createdAuthPayload: any = null
      const mockCreateUser = vi.fn().mockImplementation(async (params) => {
        createdAuthPayload = params
        return {
          data: {
            user: {
              id: "auth-user-direct-101",
              email: params.email,
            },
          },
          error: null,
        }
      })

      let insertedCounselor: any = null
      const mockInsertCounselor = vi.fn().mockImplementation(async (record) => {
        insertedCounselor = record
        return { id: "counselor-table-uuid-2", ...record }
      })

      const mockSendEmail = vi.fn().mockResolvedValue({ success: true, id: "mail-welcome-123" })

      const res = await reviewCounselorApplicationAction(
        {
          applicationId: sampleApplication.id,
          status: "approved",
          title: "M.Psi., Psikolog",
          initialPassword: "KredensialAman2026!",
        },
        {
          currentUser: adminUser,
          fetchApplicationFn: vi.fn().mockResolvedValue(sampleApplication),
          createUserFn: mockCreateUser,
          insertCounselorFn: mockInsertCounselor,
          updateApplicationFn: vi.fn().mockResolvedValue(sampleApplication),
          sendEmailFn: mockSendEmail,
        }
      )

      expect(res.success).toBe(true)
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "nurul@solulu.id",
          password: "KredensialAman2026!",
          email_confirm: true,
          user_metadata: expect.objectContaining({
            role: "counselor",
            full_name: "Nurul Hidayah, M.Psi., Psikolog",
          }),
        })
      )

      expect(insertedCounselor.userId).toBe("auth-user-direct-101")
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          counselorEmail: "nurul@solulu.id",
          temporaryPassword: "KredensialAman2026!",
        })
      )

      expect(res.credentials).toBeDefined()
      expect(res.credentials?.email).toBe("nurul@solulu.id")
      expect(res.credentials?.password).toBe("KredensialAman2026!")
      expect(res.credentials?.phone).toBe(sampleApplication.phone)
    })
  })
})
