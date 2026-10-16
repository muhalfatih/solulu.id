import { describe, it, expect, vi } from "vitest"
import { sessionReportSchema } from "../lib/validations/counselor"
import {
  getSessionReportAction,
  submitSessionReportAction,
} from "../app/counselor/actions"
import {
  getSessionByTokenAction,
  getClientSessionReportAction,
} from "../lib/session/actions"
import type { CounselorAuthContext, SessionReportDetailView } from "../lib/counselor/types"

describe("Ticket 05: Counselor Session Reports and Privacy Guard", () => {
  const owningCounselorAuth: CounselorAuthContext = {
    id: "user-counselor-1",
    counselorId: "c-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  const otherCounselorAuth: CounselorAuthContext = {
    id: "user-counselor-2",
    counselorId: "c-2",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  const adminAuth: CounselorAuthContext = {
    id: "user-admin-1",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  }

  // ===========================================================================
  // 1. Zod Validation Rules
  // ===========================================================================
  describe("1. Clinical Report Zod Validation", () => {
    it("enforces mandatory Permasalahan Utama (Main Issue)", () => {
      const invalidEmptyMainIssue = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        mainIssue: "", // empty
        summary: "Klien melaporkan kecemasan tinggi saat menghadapi evaluasi kerja bulanan.",
      })
      expect(invalidEmptyMainIssue.success).toBe(false)
      if (!invalidEmptyMainIssue.success) {
        expect(invalidEmptyMainIssue.error.flatten().fieldErrors.mainIssue?.[0]).toContain("wajib diisi")
      }

      const invalidShortMainIssue = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        mainIssue: "ab", // < 3 chars
        summary: "Klien melaporkan kecemasan tinggi saat menghadapi evaluasi kerja bulanan.",
      })
      expect(invalidShortMainIssue.success).toBe(false)
    })

    it("enforces mandatory Ringkasan Dinamika Sesi (min 20 characters)", () => {
      const invalidShortSummary = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        mainIssue: "Regulasi Emosi & Stres",
        summary: "Sesi berjalan.", // < 20 chars
      })
      expect(invalidShortSummary.success).toBe(false)
      if (!invalidShortSummary.success) {
        expect(invalidShortSummary.error.flatten().fieldErrors.summary?.[0]).toContain("20 karakter")
      }
    })

    it("permits Saran / Tindak Lanjut (actionPlan) to be optional, but enforces min 20 chars if provided", () => {
      // Omitted or null actionPlan -> VALID (optional)
      const validWithoutActionPlan = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        mainIssue: "Kecemasan Sosial",
        summary: "Klien menceritakan ketakutan berlebih saat presentasi di depan publik.",
        actionPlan: null,
      })
      expect(validWithoutActionPlan.success).toBe(true)

      // Provided but too short -> INVALID
      const invalidShortActionPlan = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        mainIssue: "Kecemasan Sosial",
        summary: "Klien menceritakan ketakutan berlebih saat presentasi di depan publik.",
        actionPlan: "Latihan napas", // < 20 chars
      })
      expect(invalidShortActionPlan.success).toBe(false)

      // Provided with >= 20 chars -> VALID
      const validWithActionPlan = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        mainIssue: "Kecemasan Sosial",
        summary: "Klien menceritakan ketakutan berlebih saat presentasi di depan publik.",
        actionPlan: "Praktik teknik pernapasan diafragma 4-7-8 setiap pagi sebelum beraktivitas.",
      })
      expect(validWithActionPlan.success).toBe(true)
    })

    it("accepts strictly confidential Catatan Internal Konselor and attachment R2 keys", () => {
      const fullReport = sessionReportSchema.safeParse({
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        mainIssue: "Burnout & Dinamika Relasi Keluarga",
        summary: "Eksplorasi riwayat konflik batas emosional dengan keluarga dan tekanan pekerjaan.",
        actionPlan: "Menuliskan daily mood tracker dan menetapkan boundaries komunikasi malam hari.",
        internalNotes: "Observasi: Klien menunjukkan afek tumpul saat membicarakan figur otoritas keluarga.",
        followUpRecommendation: "Saran sesi lanjutan 2 minggu ke depan.",
        attachmentR2Keys: ["reports/b-1/zoom_attendance_proof.png"],
      })
      expect(fullReport.success).toBe(true)
      if (fullReport.success) {
        expect(fullReport.data.internalNotes).toContain("Observasi")
        expect(fullReport.data.attachmentR2Keys).toHaveLength(1)
      }
    })
  })

  // ===========================================================================
  // 2. Report Submission & Booking Status Transition
  // ===========================================================================
  describe("2. Server Action: submitSessionReportAction", () => {
    it("submits report with mainIssue, internalNotes, and transitions booking to completed", async () => {
      const mockBooking = {
        id: "b-test-101",
        counselorId: "c-1",
        status: "confirmed",
      }

      let savedPayload: any = null
      const mockSaveReport = vi.fn(async (data: any) => {
        savedPayload = data
        return { id: "report-uuid-999" }
      })

      const res = await submitSessionReportAction(
        {
          bookingId: "123e4567-e89b-12d3-a456-426614174000",
          mainIssue: "Regulasi Stres & Burnout",
          summary: "Klien mendiskusikan beban kerja berlebih dan keletihan emosional selama sebulan terakhir.",
          actionPlan: "Membatasi screen time 1 jam sebelum tidur dan berjalan santai 15 menit setiap sore.",
          internalNotes: "Catatan Rahasia Konselor: Evaluasi awal menunjukkan gejala burnout sedang tanpa ide bunuh diri.",
          followUpRecommendation: "Sesi konseling tindak lanjut 1 minggu lagi.",
          attachmentR2Keys: ["attendance/proof_session_101.jpg"],
        },
        {
          currentUser: owningCounselorAuth,
          getBooking: async () => mockBooking,
          saveReport: mockSaveReport,
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.reportId).toBe("report-uuid-999")
      expect(mockSaveReport).toHaveBeenCalled()
      expect(savedPayload.mainIssue).toBe("Regulasi Stres & Burnout")
      expect(savedPayload.internalNotes).toContain("Catatan Rahasia Konselor")
      expect(savedPayload.attachmentR2Keys).toEqual(["attendance/proof_session_101.jpg"])
    })

    it("enforces RLS: rejects submitting report for another counselor's booking", async () => {
      const otherBooking = {
        id: "b-test-202",
        counselorId: "c-other",
        status: "confirmed",
      }

      const res = await submitSessionReportAction(
        {
          bookingId: "123e4567-e89b-12d3-a456-426614174000",
          mainIssue: "Masalah Lain",
          summary: "Eksplorasi masalah klien yang ditangani konselor lain.",
        },
        {
          currentUser: owningCounselorAuth, // c-1
          getBooking: async () => otherBooking, // c-other
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("konselor lain")
    })
  })

  // ===========================================================================
  // 3. Strict Confidentiality Guard (ZERO LEAKAGE)
  // ===========================================================================
  describe("3. Strict Confidentiality Guard: internal_notes Privacy Guard", () => {
    it("ensures client session query NEVER returns internal_notes or attachmentR2Keys", async () => {
      const mockDbResponse = {
        booking: {
          id: "b-client-1",
          accessToken: "valid-client-token",
          patientName: "Siti Rahma",
          patientEmail: "siti@example.com",
          patientPhone: "08123456789",
          initialNotes: "Keluhan insomnia.",
          status: "completed" as const,
          zoomJoinUrl: null,
          zoomMeetingId: null,
          createdAt: new Date(),
        },
        counselor: {
          id: "c-1",
          fullName: "Sarah Annisa, M.Psi.",
          title: "Psikolog Klinis",
          counselorType: "psychologist" as const,
          counselorTypeDisplay: "Psikolog Klinis",
          bio: "Praktisi psikolog klinis dewasa.",
          specializations: ["Kecemasan", "Insomnia"],
          avatarR2Url: null,
        },
        schedule: {
          id: "s-1",
          date: "2026-10-16",
          startTime: "10:00:00",
          endTime: "11:30:00",
          timeRange: "10:00 – 11:30 WIB",
          formattedDate: "Jumat, 16 Oktober 2026",
        },
        transaction: null,
        report: {
          id: "rep-1",
          mainIssue: "Insomnia & Gejala Somatisasi Cemas",
          summary: "Klien melaporkan gangguan tidur akibat overthinking pekerjaan kantor.",
          actionPlan: "Sleep hygiene protocol dan latihan pernapasan diafragma 4-7-8.",
          followUpRecommendation: "Evaluasi 2 minggu ke depan.",
          createdAt: new Date().toISOString(),
          // In the database or raw report, internal notes and attachments exist:
          // BUT must NEVER be exposed to client
        },
      }

      const res = await getSessionByTokenAction("valid-client-token", {
        findBookingByAccessToken: async () => mockDbResponse,
      })

      expect(res.success).toBe(true)
      expect(res.data?.booking.status).toBe("completed")
      expect(res.data?.report).toBeDefined()
      expect(res.data?.report?.mainIssue).toBe("Insomnia & Gejala Somatisasi Cemas")
      expect(res.data?.report?.summary).toContain("gangguan tidur")

      // STRICT ASSERTION: internalNotes and attachmentR2Keys MUST NOT exist in client payload
      expect((res.data?.report as any).internalNotes).toBeUndefined()
      expect((res.data?.report as any).attachmentR2Keys).toBeUndefined()
      expect("internalNotes" in (res.data?.report || {})).toBe(false)
      expect("attachmentR2Keys" in (res.data?.report || {})).toBe(false)
    })

    it("ensures getClientSessionReportAction strictly excludes internal_notes from client payload", async () => {
      const mockRawReportWithConfidentialData = {
        id: "rep-client-99",
        mainIssue: "Quarter-life Crisis",
        summary: "Klien mengeksplorasi ketakutan akan masa depan karir dan ekspektasi sosial.",
        actionPlan: "Menyusun peta prioritas nilai hidup (values assessment).",
        followUpRecommendation: "Sesi konseling lanjutan 1 bulan lagi.",
        createdAt: new Date().toISOString(),
        // Raw confidential data present in backend
        internalNotes: "RAHASIA: Observasi defensif klien mengenai figur ayah.",
        attachmentR2Keys: ["proof/zoom_meeting_99.png"],
      }

      const res = await getClientSessionReportAction("token-client-99", "08123456789", {
        findReport: async () => ({
          report: mockRawReportWithConfidentialData,
          patientName: "Budi Santoso",
          counselorName: "Sarah Annisa, M.Psi.",
        }),
      })

      expect(res.success).toBe(true)
      expect(res.data?.report.mainIssue).toBe("Quarter-life Crisis")
      expect(res.data?.report.summary).toContain("ketakutan akan masa depan")

      // STRICT ASSERTION: Confidential internal notes and photo proofs are EXCLUDED
      expect((res.data?.report as any).internalNotes).toBeUndefined()
      expect((res.data?.report as any).attachmentR2Keys).toBeUndefined()
      expect("internalNotes" in (res.data?.report || {})).toBe(false)
      expect("attachmentR2Keys" in (res.data?.report || {})).toBe(false)
    })

    it("ensures Admin payload via getSessionReportAction EXCLUDES internal_notes (Admin Privacy Guard)", async () => {
      const mockReportData: SessionReportDetailView = {
        id: "rep-counselor-1",
        bookingId: "b-1",
        counselorId: "c-1",
        mainIssue: "Stres Kerja Akut",
        summary: "Klien mengalami keletihan mental akibat deadline proyek.",
        actionPlan: "Teknik relaksasi otot progresif.",
        internalNotes: "CATATAN SANGAT RAHASIA: Klien menceritakan dinamika internal yang sensitif.",
        followUpRecommendation: "Tidak perlu rujukan psikiatri saat ini.",
        attachmentR2Keys: ["r2/proof.png"],
        createdAt: new Date().toISOString(),
        booking: {
          id: "b-1",
          patientName: "Ahmad",
          patientEmail: "ahmad@example.com",
          patientPhone: "0811111111",
          date: "2026-10-16",
          timeRange: "10:00 – 11:30 WIB",
          initialNotes: "Stres",
          srqScore: 5,
          hasSuicidalThoughts: false,
          bypassedRecommendation: false,
        },
      }

      // 1. Owning counselor can view their own internal notes:
      const counselorRes = await getSessionReportAction("b-1", {
        currentUser: owningCounselorAuth,
        getReportData: async () => mockReportData,
      })
      expect(counselorRes.success).toBe(true)
      expect(counselorRes.data?.internalNotes).toContain("CATATAN SANGAT RAHASIA")

      // 2. Admin viewing the report has internalNotes EXCLUDED:
      const adminRes = await getSessionReportAction("b-1", {
        currentUser: adminAuth,
        getReportData: async () => mockReportData,
      })
      expect(adminRes.success).toBe(true)
      expect(adminRes.data?.summary).toBe("Klien mengalami keletihan mental akibat deadline proyek.")
      expect(adminRes.data?.internalNotes).toBeUndefined()

      // 3. Another counselor is blocked with RLS error:
      const otherCounselorRes = await getSessionReportAction("b-1", {
        currentUser: otherCounselorAuth,
        getReportData: async () => mockReportData,
      })
      expect(otherCounselorRes.success).toBe(false)
      expect(otherCounselorRes.error).toContain("catatan sesi Anda sendiri (RLS)")
    })
  })
})
