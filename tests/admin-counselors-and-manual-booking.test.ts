import { describe, it, expect, vi } from "vitest"
import {
  createCounselorAdminSchema,
  updateCounselorAdminSchema,
} from "../lib/validations/counselor-admin"
import { adminManualBookingSchema } from "../lib/validations/admin-manual-booking"
import {
  createCounselorAction,
  updateCounselorAction,
  toggleCounselorActiveAction,
  getCounselorsAdminAction,
} from "../app/admin/counselors/actions"
import {
  createAdminManualBookingAction,
  checkZoomConcurrencyAction,
} from "../app/admin/sessions/manual-booking-actions"
import { computeEndTime } from "../lib/schedules/concurrency"

describe("Spec 0002 & ADR 0004: Admin Counselor Management & Zero-Cost Booking Bypass", () => {
  const adminUser = {
    id: "admin-uuid-1",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  }

  const counselorUser = {
    id: "counselor-uuid-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  // ===========================================================================
  // 1. Zod Validation Tests: Counselor Management
  // ===========================================================================
  describe("1. Counselor Validation Schemas", () => {
    it("accepts valid counselor creation data", () => {
      const valid = createCounselorAdminSchema.safeParse({
        fullName: "Fajar Nugraha, M.Psi., Psikolog",
        title: "Psikolog Klinis Dewasa",
        counselorType: "psychologist",
        email: "fajar@solulu.id",
        password: "securePassword123!",
        bio: "Berpengalaman selama 8 tahun menangani depresi, kecemasan, dan trauma masa kecil.",
        specializations: ["Depresi & Mood", "Kecemasan & Stres"],
        avatarR2Url: "https://cdn.solulu.id/avatars/fajar.jpg",
        isActive: true,
      })
      expect(valid.success).toBe(true)
    })

    it("rejects counselor creation with missing or short fields", () => {
      const invalid = createCounselorAdminSchema.safeParse({
        fullName: "Al", // min 3
        title: "P", // min 2
        counselorType: "invalid-type",
        email: "not-an-email",
        password: "short", // min 8
        bio: "Too short", // min 20
        specializations: [], // min 1
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        const errorFields = invalid.error.issues.map((i) => i.path[0])
        expect(errorFields).toContain("fullName")
        expect(errorFields).toContain("title")
        expect(errorFields).toContain("counselorType")
        expect(errorFields).toContain("email")
        expect(errorFields).toContain("password")
        expect(errorFields).toContain("bio")
        expect(errorFields).toContain("specializations")
      }
    })

    it("accepts valid counselor update data", () => {
      const valid = updateCounselorAdminSchema.safeParse({
        fullName: "Rina Wijaya, S.Psi",
        title: "Konselor Sebaya Senior",
        counselorType: "peer",
        bio: "Fokus pada pendampingan quarter-life crisis, stres perkuliahan, dan dinamika asmara.",
        specializations: ["Quarter-life Crisis", "Karir & Akademik"],
        avatarR2Url: "",
        isActive: false,
      })
      expect(valid.success).toBe(true)
    })
  })

  // ===========================================================================
  // 2. Server Action Tests: Counselor Management
  // ===========================================================================
  describe("2. Counselor Server Actions", () => {
    it("blocks non-admin users from creating counselors", async () => {
      const res = await createCounselorAction(
        {
          fullName: "Fajar Nugraha",
          title: "S.Psi",
          counselorType: "peer",
          email: "fajar@solulu.id",
          password: "password123",
          bio: "Pendamping konseling sebaya dengan pengalaman mendalam.",
          specializations: ["Pengembangan Diri"],
          avatarR2Url: null,
          isActive: true,
        },
        { currentUser: counselorUser }
      )
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("creates counselor via Supabase Auth admin and inserts into db", async () => {
      const mockCreateUser = vi.fn().mockResolvedValue({
        data: { user: { id: "auth-user-999" } },
        error: null,
      })
      const mockInsert = vi.fn().mockImplementation((payload) => ({
        id: "counselor-uuid-999",
        ...payload,
      }))

      const res = await createCounselorAction(
        {
          fullName: "Fajar Nugraha",
          title: "S.Psi",
          counselorType: "peer",
          email: "fajar@solulu.id",
          password: "password123",
          bio: "Pendamping konseling sebaya dengan pengalaman mendalam.",
          specializations: ["Pengembangan Diri"],
          avatarR2Url: null,
          isActive: true,
        },
        {
          currentUser: adminUser,
          createUserFn: mockCreateUser,
          insertCounselorFn: mockInsert,
        }
      )

      expect(res.success).toBe(true)
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "fajar@solulu.id",
          password: "password123",
          email_confirm: true,
        })
      )
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "auth-user-999",
          fullName: "Fajar Nugraha",
          title: "S.Psi",
          counselorType: "peer",
        })
      )
    })

    it("rolls back Supabase user if database insert fails", async () => {
      const mockCreateUser = vi.fn().mockResolvedValue({
        data: { user: { id: "auth-user-to-rollback" } },
        error: null,
      })
      const mockInsert = vi.fn().mockRejectedValue(new Error("Database connection failure"))
      const mockDeleteUser = vi.fn().mockResolvedValue({})

      const res = await createCounselorAction(
        {
          fullName: "Fajar Nugraha",
          title: "S.Psi",
          counselorType: "peer",
          email: "fajar@solulu.id",
          password: "password123",
          bio: "Pendamping konseling sebaya dengan pengalaman mendalam.",
          specializations: ["Pengembangan Diri"],
          avatarR2Url: null,
          isActive: true,
        },
        {
          currentUser: adminUser,
          createUserFn: mockCreateUser,
          insertCounselorFn: mockInsert,
          deleteUserFn: mockDeleteUser,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("Database connection failure")
      expect(mockDeleteUser).toHaveBeenCalledWith("auth-user-to-rollback")
    })

    it("toggles counselor active status", async () => {
      const mockToggle = vi.fn().mockResolvedValue({
        id: "counselor-1",
        isActive: false,
      })

      const res = await toggleCounselorActiveAction("counselor-1", false, {
        currentUser: adminUser,
        toggleFn: mockToggle,
      })

      expect(res.success).toBe(true)
      expect(mockToggle).toHaveBeenCalledWith("counselor-1", false)
      expect(res.message).toContain("Ditangguhkan")
    })
  })

  // ===========================================================================
  // 3. Zod Validation Tests: Admin Manual Booking
  // ===========================================================================
  describe("3. Manual Booking Validation Schema", () => {
    it("validates existing slot booking mode", () => {
      const valid = adminManualBookingSchema.safeParse({
        counselorId: "33333333-3333-3333-3333-333333333333",
        scheduleMode: "existing",
        scheduleId: "44444444-4444-4444-4444-444444444444",
        patientName: "Budi Santoso",
        patientEmail: "budi@gmail.com",
        patientPhone: "081234567890",
        initialNotes: "Keluhan kecemasan menjelang ujian akhir",
        adminNotes: "Beasiswa Mahasiswa Berprestasi semester 7",
        createZoom: true,
        sendConfirmationEmail: true,
      })
      expect(valid.success).toBe(true)
    })

    it("rejects existing slot booking if scheduleId is omitted", () => {
      const invalid = adminManualBookingSchema.safeParse({
        counselorId: "33333333-3333-3333-3333-333333333333",
        scheduleMode: "existing",
        patientName: "Budi Santoso",
        patientEmail: "budi@gmail.com",
        patientPhone: "081234567890",
        adminNotes: "Beasiswa",
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toContain("Pilih salah satu slot jadwal")
      }
    })

    it("validates adhoc schedule mode with date and start time", () => {
      const valid = adminManualBookingSchema.safeParse({
        counselorId: "33333333-3333-3333-3333-333333333333",
        scheduleMode: "adhoc",
        adhocDate: "2026-10-15",
        adhocStartTime: "19:00",
        patientName: "Citra Lestari",
        patientEmail: "citra@gmail.com",
        patientPhone: "+6281987654321",
        adminNotes: "Rujukan khusus pro-bono kasus krisis ringan",
        createZoom: true,
        sendConfirmationEmail: false,
      })
      expect(valid.success).toBe(true)
    })

    it("requires manualMeetingUrl if createZoom is disabled", () => {
      const invalid = adminManualBookingSchema.safeParse({
        counselorId: "33333333-3333-3333-3333-333333333333",
        scheduleMode: "adhoc",
        adhocDate: "2026-10-15",
        adhocStartTime: "19:00",
        patientName: "Citra Lestari",
        patientEmail: "citra@gmail.com",
        patientPhone: "081234567890",
        adminNotes: "Offline payment by cash",
        createZoom: false,
        manualMeetingUrl: "", // missing manual URL
      })
      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toContain("Tautan rapat manual wajib diisi")
      }
    })

    it("rejects booking if mandatory admin audit notes is empty", () => {
      const invalid = adminManualBookingSchema.safeParse({
        counselorId: "33333333-3333-3333-3333-333333333333",
        scheduleMode: "existing",
        scheduleId: "44444444-4444-4444-4444-444444444444",
        patientName: "Budi Santoso",
        patientEmail: "budi@gmail.com",
        patientPhone: "081234567890",
        adminNotes: "", // empty
      })
      expect(invalid.success).toBe(false)
    })
  })

  // ===========================================================================
  // 4. Server Action Tests: Manual Booking & Concurrency
  // ===========================================================================
  describe("4. Manual Booking Execution & Invariants", () => {
    it("computes 90-minute end time for ad-hoc slots", () => {
      expect(computeEndTime("09:00")).toBe("10:30")
      expect(computeEndTime("14:30")).toBe("16:00")
      expect(computeEndTime("19:00")).toBe("20:30")
    })

    it("checks Zoom concurrency and flags saturation when overlap count >= 2", async () => {
      const resUnder = await checkZoomConcurrencyAction("2026-10-15", "19:00", {
        currentUser: adminUser,
        fetchOverlapCountFn: async () => 1,
      })
      expect(resUnder.success).toBe(true)
      expect(resUnder.data?.available).toBe(true)
      expect(resUnder.data?.activeOverlapCount).toBe(1)

      const resSaturated = await checkZoomConcurrencyAction("2026-10-15", "19:00", {
        currentUser: adminUser,
        fetchOverlapCountFn: async () => 2,
      })
      expect(resSaturated.success).toBe(true)
      expect(resSaturated.data?.available).toBe(false)
      expect(resSaturated.data?.activeOverlapCount).toBe(2)
    })

    it("creates confirmed manual booking with Rp0 transaction and 32-char token", async () => {
      let createdSchedule: any = null
      let createdBooking: any = null
      let createdTx: any = null
      let emailDispatched = false

      const res = await createAdminManualBookingAction(
        {
          counselorId: "33333333-3333-3333-3333-333333333333",
          scheduleMode: "adhoc",
          adhocDate: "2026-10-20",
          adhocStartTime: "14:00",
          patientName: "Dewi Sartika",
          patientEmail: "dewi@gmail.com",
          patientPhone: "081298765432",
          initialNotes: "Sering cemas saat presentasi",
          adminNotes: "Program Beasiswa Konseling Pemudi",
          createZoom: true,
          sendConfirmationEmail: true,
        },
        {
          currentUser: adminUser,
          fetchCounselorFn: async () => ({
            id: "33333333-3333-3333-3333-333333333333",
            fullName: "Sarah Annisa, M.Psi., Psikolog",
            counselorType: "psychologist",
          }),
          checkConcurrencyFn: async () => 0, // No overlaps
          createScheduleFn: async (payload) => {
            createdSchedule = { id: "sched-adhoc-1", ...payload }
            return createdSchedule
          },
          insertBookingFn: async (payload) => {
            createdBooking = { id: "booking-manual-1", ...payload }
            return createdBooking
          },
          insertTransactionFn: async (payload) => {
            createdTx = { id: "tx-manual-1", ...payload }
            return createdTx
          },
          sendEmailFn: async () => {
            emailDispatched = true
          },
        }
      )

      expect(res.success).toBe(true)
      expect(res.data?.accessToken).toHaveLength(32)
      expect(res.data?.sessionUrl).toBe(`/session/${res.data?.accessToken}`)

      // Verify schedule duration
      expect(createdSchedule.startTime).toBe("14:00")
      expect(createdSchedule.endTime).toBe("15:30") // +90 mins
      expect(createdSchedule.status).toBe("booked")

      // Verify booking status
      expect(createdBooking.status).toBe("confirmed")
      expect(createdBooking.patientName).toBe("Dewi Sartika")
      expect(createdBooking.zoomJoinUrl).toBeDefined()

      // Financial Transaction Invariants (ADR 0004 & Spec 0002)
      expect(createdTx.paymentProvider).toBe("admin_bypass")
      expect(createdTx.netAmount).toBe("0.00")
      expect(createdTx.status).toBe("PAID")
      expect(createdTx.grossAmount).toBe("130000.00") // Psychologist base
      expect(createdTx.discountAmount).toBe("130000.00")
      expect(createdTx.adminNotes).toBe("Program Beasiswa Konseling Pemudi")

      // Email dispatch
      expect(emailDispatched).toBe(true)
    })

    it("blocks booking when Zoom is saturated and no manual meeting link is provided", async () => {
      const res = await createAdminManualBookingAction(
        {
          counselorId: "33333333-3333-3333-3333-333333333333",
          scheduleMode: "adhoc",
          adhocDate: "2026-10-20",
          adhocStartTime: "14:00",
          patientName: "Dewi Sartika",
          patientEmail: "dewi@gmail.com",
          patientPhone: "081298765432",
          adminNotes: "Program Beasiswa",
          createZoom: true,
          sendConfirmationEmail: false,
        },
        {
          currentUser: adminUser,
          fetchCounselorFn: async () => ({
            id: "33333333-3333-3333-3333-333333333333",
            fullName: "Sarah Annisa",
            counselorType: "peer",
          }),
          checkConcurrencyFn: async () => 2, // Saturated: 2 concurrent sessions
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("Kapasitas 2 Akun Zoom platform telah penuh")
    })

    it("allows booking when Zoom is saturated if graceful fallback manual meeting link is provided", async () => {
      let createdBooking: any = null

      const res = await createAdminManualBookingAction(
        {
          counselorId: "33333333-3333-3333-3333-333333333333",
          scheduleMode: "adhoc",
          adhocDate: "2026-10-20",
          adhocStartTime: "14:00",
          patientName: "Dewi Sartika",
          patientEmail: "dewi@gmail.com",
          patientPhone: "081298765432",
          adminNotes: "Kasus darurat via Google Meet",
          createZoom: false,
          manualMeetingUrl: "https://meet.google.com/abc-defg-hij",
          sendConfirmationEmail: false,
        },
        {
          currentUser: adminUser,
          fetchCounselorFn: async () => ({
            id: "33333333-3333-3333-3333-333333333333",
            fullName: "Sarah Annisa",
            counselorType: "peer",
          }),
          checkConcurrencyFn: async () => 2,
          createScheduleFn: async (payload) => ({ id: "sched-adhoc-2", ...payload }),
          insertBookingFn: async (payload) => {
            createdBooking = { id: "booking-manual-2", ...payload }
            return createdBooking
          },
          insertTransactionFn: async (payload) => ({ id: "tx-manual-2", ...payload }),
        }
      )

      expect(res.success).toBe(true)
      expect(createdBooking.zoomJoinUrl).toBe("https://meet.google.com/abc-defg-hij")
    })
  })
})
