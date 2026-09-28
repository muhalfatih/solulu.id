import { describe, it, expect, vi } from "vitest"
import {
  sessionReportSchema,
  counselorProfileSchema,
  presignedUploadRequestSchema,
} from "../lib/validations/counselor"
import {
  getCounselorUpcomingSessionsAction,
  completeSessionAndOpenReportAction,
  getSessionReportAction,
  submitSessionReportAction,
  getCounselorProfileAction,
  updateCounselorProfileAction,
  getPresignedUploadUrlAction,
  getAttachmentDownloadUrlAction,
} from "../app/counselor/actions"
import type { CounselorAuthContext } from "../lib/counselor/types"

describe("Issue #11: Counselor Dashboard, Session Reports & Profile", () => {
  const counselorAuth: CounselorAuthContext = {
    id: "counselor-user-1",
    counselorId: "c-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  const anotherCounselorAuth: CounselorAuthContext = {
    id: "counselor-user-2",
    counselorId: "c-2",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  const adminAuth: CounselorAuthContext = {
    id: "admin-user-1",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  }

  const patientAuth: CounselorAuthContext = {
    id: "patient-user-1",
    app_metadata: { role: "patient" },
    user_metadata: { role: "patient" },
  }

  // ===========================================================================
  // 1. Zod Validation Tests
  // ===========================================================================
  describe("1. Validation Schemas", () => {
    it("validates sessionReportSchema: enforces minimum 20 characters on summary and actionPlan", () => {
      const invalidShort = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        summary: "Terlalu pendek", // < 20 chars
        actionPlan: "Rencana pendek", // < 20 chars
      })
      expect(invalidShort.success).toBe(false)
      if (!invalidShort.success) {
        expect(invalidShort.error.flatten().fieldErrors.summary?.[0]).toContain("20 karakter")
        expect(invalidShort.error.flatten().fieldErrors.actionPlan?.[0]).toContain("20 karakter")
      }

      const validReport = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        summary: "Klien melaporkan kecemasan tinggi saat menghadapi evaluasi kerja bulanan.",
        actionPlan: "Menerapkan teknik grounding 5-4-3-2-1 dan reframing pikiran otomatis negatif.",
        followUpRecommendation: "Sesi lanjutan 1 minggu ke depan untuk evaluasi journaling cemas.",
        attachmentR2Keys: ["reports/123e4567/chart.pdf"],
      })
      expect(validReport.success).toBe(true)
    })

    it("validates counselorProfileSchema: enforces bio min 20 chars and at least one specialization", () => {
      const invalidProfile = counselorProfileSchema.safeParse({
        title: "P",
        bio: "Singkat saja",
        specializations: [],
        avatarR2Url: "invalid-url",
      })
      expect(invalidProfile.success).toBe(false)

      const validProfile = counselorProfileSchema.safeParse({
        title: "Psikolog Klinis Dewasa",
        bio: "Praktisi psikologi berfokus pada penanganan gangguan kecemasan, depresi, dan dinamika relasi interpersonal.",
        specializations: ["Kecemasan", "Quarter-life Crisis"],
        avatarR2Url: "https://cdn.solulu.id/avatars/counselor-1.webp",
      })
      expect(validProfile.success).toBe(true)
    })

    it("validates presignedUploadRequestSchema", () => {
      const validAvatar = presignedUploadRequestSchema.safeParse({
        type: "avatar",
        fileName: "profile.jpg",
        contentType: "image/jpeg",
      })
      expect(validAvatar.success).toBe(true)

      const validAttachment = presignedUploadRequestSchema.safeParse({
        type: "report_attachment",
        fileName: "clinical_notes.pdf",
        contentType: "application/pdf",
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
      })
      expect(validAttachment.success).toBe(true)
    })
  })

  // ===========================================================================
  // 2. Upcoming Sessions (US-32 & US-33)
  // ===========================================================================
  describe("2. Server Action: getCounselorUpcomingSessionsAction", () => {
    it("rejects unauthenticated or non-counselor access", async () => {
      const unauth = await getCounselorUpcomingSessionsAction({ currentUser: null })
      expect(unauth.success).toBe(false)

      const patient = await getCounselorUpcomingSessionsAction({ currentUser: patientAuth })
      expect(patient.success).toBe(false)
    })

    it("returns upcoming sessions with SRQ-20 score, suicidal thoughts, and Zoom link", async () => {
      const mockSessions = [
        {
          id: "b-101",
          accessToken: "token-101",
          patientName: "Dimas Arya",
          patientEmail: "dimas@example.com",
          patientPhone: "081234567890",
          initialNotes: "Insomnia dan cemas presentasi.",
          date: "2026-09-28",
          startTime: "19:00",
          endTime: "20:30",
          timeRange: "19:00 – 20:30 WIB",
          status: "confirmed" as const,
          zoomStartUrl: "https://zoom.us/s/982341234?tk=demo",
          zoomMeetingId: "982341234",
          srqScore: 9,
          hasSuicidalThoughts: true,
          bypassedRecommendation: false,
          hasReport: false,
          reportId: null,
        },
      ]

      const res = await getCounselorUpcomingSessionsAction({
        currentUser: counselorAuth,
        getSessions: async (counselorId) => {
          expect(counselorId).toBe("c-1")
          return mockSessions
        },
      })

      expect(res.success).toBe(true)
      expect(res.data?.length).toBe(1)
      expect(res.data?.[0].patientName).toBe("Dimas Arya")
      expect(res.data?.[0].srqScore).toBe(9)
      expect(res.data?.[0].hasSuicidalThoughts).toBe(true)
      expect(res.data?.[0].zoomStartUrl).toContain("zoom.us")
    })
  })

  // ===========================================================================
  // 3. Mark Session Completed & Open Report (US-34)
  // ===========================================================================
  describe("3. Server Action: completeSessionAndOpenReportAction", () => {
    it("marks booking as completed and returns report form path", async () => {
      const updateMock = vi.fn()
      const mockBooking = {
        id: "b-101",
        counselorId: "c-1",
        status: "confirmed",
      }

      const res = await completeSessionAndOpenReportAction("b-101", {
        currentUser: counselorAuth,
        getBooking: async () => mockBooking,
        updateBookingStatus: updateMock,
      })

      expect(res.success).toBe(true)
      expect(res.data?.redirectUrl).toBe("/counselor/reports/b-101")
      expect(updateMock).toHaveBeenCalledWith("b-101", "completed")
    })

    it("rejects if counselor tries to complete another counselor's session", async () => {
      const mockBooking = {
        id: "b-999",
        counselorId: "c-other",
        status: "confirmed",
      }

      const res = await completeSessionAndOpenReportAction("b-999", {
        currentUser: counselorAuth,
        getBooking: async () => mockBooking,
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("konselor lain")
    })
  })

  // ===========================================================================
  // 4. Submit Clinical Session Report (US-35 & US-39 RLS)
  // ===========================================================================
  describe("4. Server Action: submitSessionReportAction", () => {
    it("successfully creates a session report and marks booking completed", async () => {
      const saveMock = vi.fn().mockResolvedValue({ id: "rep-101" })
      const mockBooking = {
        id: "b-101",
        counselorId: "c-1",
        status: "confirmed",
      }

      const res = await submitSessionReportAction(
        {
          bookingId: "123e4567-e89b-12d3-a456-426614174000",
          summary: "Klien telah menyelesaikan sesi pertama dengan pembahasan pemicu kecemasan.",
          actionPlan: "Latihan pernapasan diafragma 2x sehari dan restrukturisasi kognitif.",
          followUpRecommendation: "Jadwalkan sesi follow-up minggu depan.",
          attachmentR2Keys: ["reports/b-101/chart.pdf"],
        },
        {
          currentUser: counselorAuth,
          getBooking: async () => mockBooking,
          saveReport: saveMock,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.reportId).toBe("rep-101")
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          counselorId: "c-1",
          summary: expect.stringContaining("pemicu kecemasan"),
          actionPlan: expect.stringContaining("pernapasan diafragma"),
        })
      )
    })

    it("rejects submission when summary or actionPlan is less than 20 chars", async () => {
      const res = await submitSessionReportAction(
        {
          bookingId: "123e4567-e89b-12d3-a456-426614174000",
          summary: "Cemas", // < 20 chars
          actionPlan: "Napas dalam", // < 20 chars
        },
        { currentUser: counselorAuth }
      )

      expect(res.success).toBe(false)
      expect(res.fieldErrors?.summary).toBeDefined()
      expect(res.fieldErrors?.actionPlan).toBeDefined()
    })

    it("enforces RLS: rejects submitting report for another counselor's booking", async () => {
      const mockBooking = {
        id: "b-another",
        counselorId: "c-another",
        status: "confirmed",
      }

      const res = await submitSessionReportAction(
        {
          bookingId: "123e4567-e89b-12d3-a456-426614174000",
          summary: "Ringkasan sesi konseling klinis yang valid dan melebihi 20 karakter.",
          actionPlan: "Rencana aksi konseling klinis yang valid dan melebihi 20 karakter.",
        },
        {
          currentUser: counselorAuth, // counselor c-1
          getBooking: async () => mockBooking, // booking belongs to c-another
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("konselor lain")
    })
  })

  // ===========================================================================
  // 5. Get Session Report Details & RLS Visibility (US-39)
  // ===========================================================================
  describe("5. Server Action: getSessionReportAction & RLS", () => {
    const mockReportDetail = {
      id: "rep-101",
      bookingId: "b-101",
      counselorId: "c-1",
      summary: "Ringkasan sesi lengkap lebih dari 20 karakter.",
      actionPlan: "Rencana aksi lengkap lebih dari 20 karakter.",
      followUpRecommendation: "Follow up minggu depan",
      attachmentR2Keys: ["reports/b-101/notes.pdf"],
      createdAt: "2026-09-28T10:00:00Z",
      booking: {
        id: "b-101",
        patientName: "Dimas Arya",
        patientEmail: "dimas@example.com",
        patientPhone: "081234567890",
        date: "2026-09-28",
        timeRange: "19:00 – 20:30 WIB",
        initialNotes: "Catatan pasien",
        srqScore: 8,
        hasSuicidalThoughts: false,
        bypassedRecommendation: false,
      },
    }

    it("allows the owning counselor to view their own session report", async () => {
      const res = await getSessionReportAction("b-101", {
        currentUser: counselorAuth, // c-1
        getReportData: async () => mockReportDetail,
      })

      expect(res.success).toBe(true)
      expect(res.data?.id).toBe("rep-101")
    })

    it("allows Admin to view any session report (Super Admin access)", async () => {
      const res = await getSessionReportAction("b-101", {
        currentUser: adminAuth, // admin
        getReportData: async () => mockReportDetail,
      })

      expect(res.success).toBe(true)
      expect(res.data?.id).toBe("rep-101")
    })

    it("blocks another counselor from viewing report (RLS protection)", async () => {
      const res = await getSessionReportAction("b-101", {
        currentUser: anotherCounselorAuth, // c-2
        getReportData: async () => mockReportDetail,
      })

      expect(res.success).toBe(false)
      expect(res.error).toContain("RLS")
    })
  })

  // ===========================================================================
  // 6. Counselor Profile (US-36 & US-37)
  // ===========================================================================
  describe("6. Counselor Profile Management", () => {
    it("fetches counselor profile", async () => {
      const mockProfile = {
        id: "c-1",
        userId: "counselor-user-1",
        fullName: "Sarah Annisa, M.Psi., Psikolog",
        title: "Psikolog Klinis Dewasa",
        counselorType: "psychologist" as const,
        bio: "Berpengalaman mendampingi klien dengan stres, kecemasan, dan trauma.",
        specializations: ["Kecemasan", "Trauma"],
        avatarR2Url: "https://cdn.solulu.id/avatars/sarah.webp",
        isActive: true,
      }

      const res = await getCounselorProfileAction({
        currentUser: counselorAuth,
        getProfile: async () => mockProfile,
      })

      expect(res.success).toBe(true)
      expect(res.data?.title).toBe("Psikolog Klinis Dewasa")
    })

    it("updates counselor profile (title, bio, specializations, avatar)", async () => {
      const updateMock = vi.fn()

      const res = await updateCounselorProfileAction(
        {
          title: "Psikolog Klinis Spesialis Trauma & Cemas",
          bio: "Pendekatan berbasis ACT dan CBT untuk mendampingi individu mengatasi krisis emosional.",
          specializations: ["Trauma", "Kecemasan", "ACT"],
          avatarR2Url: "https://cdn.solulu.id/avatars/new-avatar.webp",
        },
        {
          currentUser: counselorAuth,
          updateProfile: updateMock,
        }
      )

      expect(res.success).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(
        "c-1",
        expect.objectContaining({
          title: "Psikolog Klinis Spesialis Trauma & Cemas",
          specializations: ["Trauma", "Kecemasan", "ACT"],
        })
      )
    })
  })

  // ===========================================================================
  // 7. Presigned Upload & Download URLs (R2)
  // ===========================================================================
  describe("7. R2 Presigned URLs for Clinical Attachments & Avatars", () => {
    it("generates presigned PUT url for counselor avatar (public bucket)", async () => {
      const mockPut = vi.fn().mockResolvedValue({
        uploadUrl: "https://r2.mock/upload-avatar",
        key: "avatars/mock.webp",
        bucket: "solulu-public",
      })

      const res = await getPresignedUploadUrlAction(
        {
          type: "avatar",
          fileName: "photo.webp",
          contentType: "image/webp",
        },
        {
          currentUser: counselorAuth,
          generatePutUrl: mockPut as any,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.uploadUrl).toBe("https://r2.mock/upload-avatar")
      expect(res.data?.publicUrl).toContain("cdn.solulu.id")
    })

    it("generates presigned PUT url for private report attachment (private bucket)", async () => {
      const mockPut = vi.fn().mockResolvedValue({
        uploadUrl: "https://r2.mock/upload-report",
        key: "reports/b-101/mock.pdf",
        bucket: "solulu-private",
      })

      const res = await getPresignedUploadUrlAction(
        {
          type: "report_attachment",
          fileName: "clinical_notes.pdf",
          contentType: "application/pdf",
          bookingId: "123e4567-e89b-12d3-a456-426614174000",
        },
        {
          currentUser: counselorAuth,
          generatePutUrl: mockPut as any,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.uploadUrl).toBe("https://r2.mock/upload-report")
      // Should not have a direct publicUrl
      expect(res.data?.publicUrl).toBeUndefined()
    })

    it("generates presigned GET url for viewing private attachments with 15-min TTL", async () => {
      const mockGet = vi.fn().mockResolvedValue("https://r2.mock/download?expires=900")

      const res = await getAttachmentDownloadUrlAction("reports/b-101/notes.pdf", {
        currentUser: counselorAuth,
        generateGetUrl: mockGet as any,
      })

      expect(res.success).toBe(true)
      expect(res.data?.downloadUrl).toContain("expires=900")
      expect(mockGet).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "reports/b-101/notes.pdf",
          expiresIn: 900,
        })
      )
    })
  })
})
