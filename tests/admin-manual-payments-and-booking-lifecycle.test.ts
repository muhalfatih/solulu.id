import { describe, it, expect, vi } from "vitest"
import {
  getManualPaymentsQueueAdminAction,
  confirmManualPaymentAdminAction,
  rejectManualPaymentAdminAction,
  type ManualPaymentQueueItem,
} from "../app/admin/manual-payments/actions"
import {
  getBookingsAdminAction,
  markBookingNoShowAction,
  markBookingFollowedUpAction,
  generateWhatsAppReportUrl,
  type AdminBookingItem,
} from "../app/admin/bookings/actions"

describe("Ticket 08: Admin Manual Payments and Booking Lifecycle", () => {
  const adminUser = {
    id: "admin-uuid-1",
    app_metadata: { role: "admin" },
    user_metadata: { role: "admin" },
  }

  const unauthorizedUser = {
    id: "user-uuid-1",
    app_metadata: { role: "counselor" },
    user_metadata: { role: "counselor" },
  }

  // ===========================================================================
  // 1. Manual Payments Queue Filtering & R2 Presigned Slips
  // ===========================================================================
  describe("1. Manual Payments Queue Filtering & R2 Presigned Slips", () => {
    it("blocks unauthorized non-admin users from accessing the manual payments queue", async () => {
      const res = await getManualPaymentsQueueAdminAction({
        currentUser: unauthorizedUser,
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })

    it("fetches pending queue and generates 15-minute presigned R2 URLs for bank slips", async () => {
      const mockPresigner = vi.fn().mockImplementation(async ({ key, expiresIn }) => {
        expect(expiresIn).toBe(900)
        return `https://presigned.r2.cloudflarestorage.com/solulu-private/${key}?token=mockToken`
      })

      const mockQueue: ManualPaymentQueueItem[] = [
        {
          id: "b-1",
          bookingCode: "SL-1001",
          patientName: "Ahmad Fauzi",
          patientPhone: "081234567890",
          patientEmail: "ahmad@example.com",
          counselorId: "c-1",
          counselorName: "Dimas Pratama, S.Psi.",
          counselorType: "Konselor Sebaya",
          scheduleDate: "2026-10-20",
          timeRange: "08:00 - 10:00",
          slotIndex: 1,
          paymentType: "initial",
          nominalAmount: 150000,
          paymentMethod: "manual_bank_transfer",
          manualPaymentStatus: "PENDING",
          extensionPaymentStatus: "NONE",
          slipR2Key: "manual-proofs/b-1-slip.jpg",
          slipUrl: await mockPresigner({ key: "manual-proofs/b-1-slip.jpg", expiresIn: 900 }),
          referenceNumber: "BCA-102938",
          adminNotes: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "b-2",
          bookingCode: "SL-1002",
          patientName: "Citra Lestari",
          patientPhone: "081987654321",
          patientEmail: "citra@example.com",
          counselorId: "c-2",
          counselorName: "Dr. Sarah Annisa, M.Psi.",
          counselorType: "Psikolog Klinis",
          scheduleDate: "2026-10-20",
          timeRange: "10:00 - 12:00",
          slotIndex: 2,
          paymentType: "extension",
          nominalAmount: 50000,
          paymentMethod: "manual_bank_transfer",
          manualPaymentStatus: "VERIFIED",
          extensionPaymentStatus: "PENDING",
          slipR2Key: "extension-proofs/b-2-ext.png",
          slipUrl: await mockPresigner({ key: "extension-proofs/b-2-ext.png", expiresIn: 900 }),
          referenceNumber: null,
          adminNotes: null,
          createdAt: new Date().toISOString(),
        },
      ]

      const res = await getManualPaymentsQueueAdminAction({
        currentUser: adminUser,
        fetchFn: async () => mockQueue,
        presigner: mockPresigner,
      })

      expect(res.success).toBe(true)
      expect(res.data).toHaveLength(2)

      const initialItem = res.data.find((i) => i.paymentType === "initial")
      expect(initialItem).toBeDefined()
      expect(initialItem?.bookingCode).toBe("SL-1001")
      expect(initialItem?.nominalAmount).toBe(150000)
      expect(initialItem?.slipUrl).toContain("b-1-slip.jpg")

      const extensionItem = res.data.find((i) => i.paymentType === "extension")
      expect(extensionItem).toBeDefined()
      expect(extensionItem?.bookingCode).toBe("SL-1002")
      expect(extensionItem?.nominalAmount).toBe(50000)
      expect(extensionItem?.slipUrl).toContain("b-2-ext.png")
    })
  })

  // ===========================================================================
  // 2. Action: "Konfirmasi Lunas" (Initial Booking & Extension)
  // ===========================================================================
  describe("2. Action 'Konfirmasi Lunas' & Dynamic Zoom Allocation", () => {
    it("confirms initial booking payment, sets manualPaymentStatus to VERIFIED, status to confirmed, and allocates Zoom", async () => {
      const mockConfirmPaymentFn = vi.fn().mockResolvedValue({
        success: true,
        bookingId: "b-101",
        zoomRoom: "Akun Zoom Pro 1",
        zoomJoinUrl: "https://zoom.us/j/1234567890",
        zoomStartUrl: "https://zoom.us/s/1234567890",
      })

      const mockUpdateBookingFn = vi.fn().mockResolvedValue({
        id: "b-101",
        manualPaymentStatus: "VERIFIED",
        status: "confirmed",
      })

      const res = await confirmManualPaymentAdminAction(
        {
          bookingId: "b-101",
          paymentType: "initial",
          paymentMethod: "Transfer Bank BCA (Manual)",
          referenceNumber: "BCA-REF-9921",
          adminNotes: "Lunas diverifikasi via m-BCA klinik",
        },
        {
          currentUser: adminUser,
          confirmPaymentFn: mockConfirmPaymentFn,
          updateBookingFn: mockUpdateBookingFn,
        }
      )

      expect(res.success).toBe(true)
      expect(res.message).toContain("Lunas")
      expect(res.zoomRoom).toBe("Akun Zoom Pro 1")
      expect(res.zoomJoinUrl).toBe("https://zoom.us/j/1234567890")

      // Verify Zoom allocation fulfillment was called
      expect(mockConfirmPaymentFn).toHaveBeenCalledWith({
        bookingId: "b-101",
        paymentMethod: "Transfer Bank BCA (Manual)",
        referenceNumber: "BCA-REF-9921",
        adminNotes: "Lunas diverifikasi via m-BCA klinik",
      })

      // Verify booking updated to confirmed & verified
      expect(mockUpdateBookingFn).toHaveBeenCalledWith("b-101", {
        manualPaymentStatus: "VERIFIED",
        status: "confirmed",
      })
    })

    it("confirms extension payment, updating extensionPaymentStatus to PAID", async () => {
      const mockUpdateBookingFn = vi.fn().mockResolvedValue({
        id: "b-102",
        extensionPaymentStatus: "PAID",
      })

      const res = await confirmManualPaymentAdminAction(
        {
          bookingId: "b-102",
          paymentType: "extension",
        },
        {
          currentUser: adminUser,
          updateBookingFn: mockUpdateBookingFn,
        }
      )

      expect(res.success).toBe(true)
      expect(res.message).toContain("perpanjangan sesi berhasil dikonfirmasi Lunas")
      expect(mockUpdateBookingFn).toHaveBeenCalledWith("b-102", {
        extensionPaymentStatus: "PAID",
      })
    })
  })

  // ===========================================================================
  // 3. Action: "Tolak" (Initial Booking & Extension)
  // ===========================================================================
  describe("3. Action 'Tolak' & Slot Release", () => {
    it("rejects initial booking payment, rolls back slot to available, and marks status cancelled", async () => {
      const mockRejectFn = vi.fn().mockResolvedValue({
        id: "b-201",
        manualPaymentStatus: "REJECTED",
        status: "cancelled",
      })

      const res = await rejectManualPaymentAdminAction(
        {
          bookingId: "b-201",
          paymentType: "initial",
          reason: "Nominal transfer tidak sesuai / kurang",
          adminNotes: "Hanya transfer Rp 50.000 dari tarif Rp 150.000",
        },
        {
          currentUser: adminUser,
          rejectFn: mockRejectFn,
        }
      )

      expect(res.success).toBe(true)
      expect(res.message).toContain("ditolak")
      expect(mockRejectFn).toHaveBeenCalledWith(
        "b-201",
        "Nominal transfer tidak sesuai / kurang",
        "Hanya transfer Rp 50.000 dari tarif Rp 150.000"
      )
    })

    it("rejects extension payment, updating extensionPaymentStatus to REJECTED", async () => {
      const mockRejectFn = vi.fn().mockResolvedValue({
        id: "b-202",
        extensionPaymentStatus: "REJECTED",
      })

      const res = await rejectManualPaymentAdminAction(
        {
          bookingId: "b-202",
          paymentType: "extension",
          reason: "Bukti transfer tidak terbaca / buram",
        },
        {
          currentUser: adminUser,
          rejectFn: mockRejectFn,
        }
      )

      expect(res.success).toBe(true)
      expect(res.message).toContain("ditolak")
      expect(mockRejectFn).toHaveBeenCalledWith(
        "b-202",
        "Bukti transfer tidak terbaca / buram",
        undefined
      )
    })
  })

  // ===========================================================================
  // 4. Route `/admin/bookings` Filters & Listing
  // ===========================================================================
  describe("4. Route /admin/bookings Filtering Logic", () => {
    const mockBookings: AdminBookingItem[] = [
      {
        id: "b-1",
        bookingCode: "SL-0101",
        accessToken: "token-0101",
        patientName: "Budi Santoso",
        patientPhone: "081234567801",
        patientEmail: "budi@test.com",
        gender: "Laki-laki",
        age: 26,
        domicile: "Jakarta",
        initialNotes: "Stres skripsi",
        counselorId: "counselor-1",
        counselorName: "Dimas Pratama",
        counselorTitle: "S.Psi.",
        counselorType: "Konselor Sebaya",
        scheduleDate: "2026-10-21",
        slotIndex: 1, // Slot 1
        startTime: "08:00",
        endTime: "10:00",
        timeRange: "08:00 - 10:00",
        zoomMeetingId: "9001",
        zoomJoinUrl: "https://zoom.us/j/9001",
        zoomStartUrl: "https://zoom.us/s/9001",
        zoomHostKey: "123456",
        status: "confirmed",
        paymentMethod: "xendit",
        manualPaymentStatus: "NONE",
        isExtended: false,
        extensionFee: 0,
        isNoShow: false,
        noShowMarkedAt: null,
        isFollowedUp: false,
        followedUpAt: null,
        hasSessionReport: false,
        sessionReportId: null,
        createdAt: new Date().toISOString(),
      },
      {
        id: "b-2",
        bookingCode: "SL-0202",
        accessToken: "token-0202",
        patientName: "Dewi Anggraini",
        patientPhone: "081234567802",
        patientEmail: "dewi@test.com",
        gender: "Perempuan",
        age: 29,
        domicile: "Bandung",
        initialNotes: "Kecemasan kerja",
        counselorId: "counselor-2",
        counselorName: "Dr. Sarah Annisa",
        counselorTitle: "M.Psi., Psikolog",
        counselorType: "Psikolog Klinis",
        scheduleDate: "2026-10-21",
        slotIndex: 3, // Slot 3
        startTime: "12:00",
        endTime: "14:00",
        timeRange: "12:00 - 14:00",
        zoomMeetingId: "9002",
        zoomJoinUrl: "https://zoom.us/j/9002",
        zoomStartUrl: "https://zoom.us/s/9002",
        zoomHostKey: "654321",
        status: "completed",
        paymentMethod: "manual_bank_transfer",
        manualPaymentStatus: "VERIFIED",
        isExtended: true,
        extensionFee: 50000,
        isNoShow: false,
        noShowMarkedAt: null,
        isFollowedUp: true,
        followedUpAt: new Date().toISOString(),
        hasSessionReport: true,
        sessionReportId: "rep-02",
        createdAt: new Date().toISOString(),
      },
    ]

    it("filters bookings by slot index", async () => {
      const res = await getBookingsAdminAction(
        { slotIndex: 1 },
        {
          currentUser: adminUser,
          fetchFn: async () => ({
            bookings: mockBookings.filter((b) => b.slotIndex === 1),
            counselors: [],
          }),
        }
      )

      expect(res.success).toBe(true)
      expect(res.bookings).toHaveLength(1)
      expect(res.bookings[0].bookingCode).toBe("SL-0101")
      expect(res.bookings[0].slotIndex).toBe(1)
    })

    it("filters bookings by status (e.g. completed)", async () => {
      const res = await getBookingsAdminAction(
        { status: "completed" },
        {
          currentUser: adminUser,
          fetchFn: async () => ({
            bookings: mockBookings.filter((b) => b.status === "completed"),
            counselors: [],
          }),
        }
      )

      expect(res.success).toBe(true)
      expect(res.bookings).toHaveLength(1)
      expect(res.bookings[0].bookingCode).toBe("SL-0202")
      expect(res.bookings[0].status).toBe("completed")
    })

    it("filters bookings by counselor ID", async () => {
      const res = await getBookingsAdminAction(
        { counselorId: "counselor-2" },
        {
          currentUser: adminUser,
          fetchFn: async () => ({
            bookings: mockBookings.filter((b) => b.counselorId === "counselor-2"),
            counselors: [],
          }),
        }
      )

      expect(res.success).toBe(true)
      expect(res.bookings).toHaveLength(1)
      expect(res.bookings[0].counselorName).toBe("Dr. Sarah Annisa")
    })
  })

  // ===========================================================================
  // 5. Action: "Tandai No-Show" (30 Minutes Timeout)
  // ===========================================================================
  describe("5. Action 'Tandai No-Show' Lifecycle Mutation", () => {
    it("flags booking as No-Show with is_no_show: true and status: completed", async () => {
      const mockUpdateFn = vi.fn().mockResolvedValue({
        id: "b-301",
        isNoShow: true,
        status: "completed",
      })

      const res = await markBookingNoShowAction(
        { bookingId: "b-301" },
        {
          currentUser: adminUser,
          updateFn: mockUpdateFn,
        }
      )

      expect(res.success).toBe(true)
      expect(res.message).toContain("No-Show")

      expect(mockUpdateFn).toHaveBeenCalledWith("b-301", {
        isNoShow: true,
        noShowMarkedAt: expect.any(Date),
        status: "completed",
      })
    })

    it("blocks non-admin from marking No-Show", async () => {
      const res = await markBookingNoShowAction(
        { bookingId: "b-301" },
        {
          currentUser: unauthorizedUser,
        }
      )

      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
    })
  })

  // ===========================================================================
  // 6. Action: "Kirim WA Laporan" & Pre-filled wa.me Link
  // ===========================================================================
  describe("6. Action 'Kirim WA Laporan' Link & Lifecycle Mutation", () => {
    it("generates a valid pre-filled wa.me message with client's session report link", async () => {
      const waUrl = await generateWhatsAppReportUrl({
        patientName: "Budi Santoso",
        patientPhone: "081234567890",
        accessToken: "access-token-xyz-123",
      })

      expect(waUrl).toContain("https://wa.me/6281234567890")
      expect(waUrl).toContain("Budi%20Santoso")
      expect(decodeURIComponent(waUrl)).toContain("/session/access-token-xyz-123")
      expect(decodeURIComponent(waUrl)).toContain("laporan sesi konseling Solulu")
    })

    it("updates is_followed_up: true and followed_up_at: NOW() when WA report link is sent", async () => {
      const mockUpdateFn = vi.fn().mockResolvedValue({
        id: "b-401",
        isFollowedUp: true,
      })

      const res = await markBookingFollowedUpAction(
        { bookingId: "b-401" },
        {
          currentUser: adminUser,
          updateFn: mockUpdateFn,
        }
      )

      expect(res.success).toBe(true)
      expect(res.message).toContain("berhasil dicatat")

      expect(mockUpdateFn).toHaveBeenCalledWith("b-401", {
        isFollowedUp: true,
        followedUpAt: expect.any(Date),
      })
    })
  })
})
