import { describe, it, expect } from "vitest"
import { getSessionByTokenAction } from "@/lib/session/actions"
import { DEMO_SESSIONS, type SessionPageData } from "@/lib/session/types"

describe("Session Data Fetching Action (Issue #8)", () => {
  const mockSessionData: SessionPageData = {
    booking: {
      id: "b-test-1",
      accessToken: "valid-test-token-1234567890123456",
      patientName: "Ahmad Fauzi",
      patientEmail: "ahmad.fauzi@example.com",
      patientPhone: "08123456789",
      initialNotes: "Keluhan kecemasan menjelang ujian akhir",
      status: "confirmed",
      zoomJoinUrl: "https://zoom.us/j/123456789",
      zoomMeetingId: "123 456 789",
      createdAt: new Date().toISOString(),
    },
    counselor: {
      id: "c-test-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      bio: "Praktisi psikologi klinis dengan fokus pada kecemasan.",
      specializations: ["Kecemasan", "Stres"],
      avatarR2Url: null,
    },
    schedule: {
      id: "s-test-1",
      date: "2026-09-28",
      startTime: "19:00:00",
      endTime: "20:30:00",
      timeRange: "19:00 – 20:30 WIB",
      formattedDate: "Senin, 28 September 2026",
    },
    transaction: {
      id: "t-test-1",
      paymentProvider: "xendit",
      paymentMethod: "QRIS",
      referenceNumber: "INV-1234",
      grossAmount: 180000,
      discountAmount: 0,
      netAmount: 180000,
      netAmountFormatted: "Rp 180.000",
      status: "PAID",
    },
  }

  it("returns full session data when valid token is provided via dependencies", async () => {
    const res = await getSessionByTokenAction("valid-test-token-1234567890123456", {
      findBookingByAccessToken: async (token) => {
        if (token === "valid-test-token-1234567890123456") return mockSessionData
        return null
      },
    })

    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(res.data?.booking.accessToken).toBe("valid-test-token-1234567890123456")
    expect(res.data?.booking.patientName).toBe("Ahmad Fauzi")
    expect(res.data?.counselor.fullName).toBe("Sarah Annisa, M.Psi., Psikolog")
    expect(res.data?.counselor.specializations).toContain("Kecemasan")
    expect(res.data?.booking.zoomJoinUrl).toBe("https://zoom.us/j/123456789")
  })

  it("returns error when token is empty or whitespace", async () => {
    const resEmpty = await getSessionByTokenAction("")
    expect(resEmpty.success).toBe(false)
    expect(resEmpty.error).toContain("Token sesi tidak valid")

    const resSpaces = await getSessionByTokenAction("   ")
    expect(resSpaces.success).toBe(false)
  })

  it("returns error when booking is not found", async () => {
    const res = await getSessionByTokenAction("non-existent-token", {
      findBookingByAccessToken: async () => null,
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain("tidak ditemukan")
  })

  it("resolves built-in demo tokens for testing and preview", async () => {
    const resUpcoming = await getSessionByTokenAction("demo-session-upcoming")
    expect(resUpcoming.success).toBe(true)
    expect(resUpcoming.data?.booking.accessToken).toBe("demo-session-upcoming")
    expect(resUpcoming.data?.counselor.fullName).toBe("Sarah Annisa, M.Psi., Psikolog")

    const resPendingZoom = await getSessionByTokenAction("demo-session-pending-zoom")
    expect(resPendingZoom.success).toBe(true)
    expect(resPendingZoom.data?.booking.zoomJoinUrl).toBeNull()
  })
})
