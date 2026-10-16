import { describe, it, expect } from "vitest"
import { getFinanceReportDataAction } from "../app/admin/reports/finance/actions"
import {
  computeFinanceMetrics,
  generateFinanceCsv,
  applyInMemorFilters,
  type FinanceLedgerItem,
  type FinanceReportFilters,
} from "../app/admin/reports/finance/utils"

describe("Ticket 09: Admin Financial Ledger and Decoupled Payroll", () => {
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

  const sampleLedgerItems: FinanceLedgerItem[] = [
    {
      id: "b-001",
      bookingCode: "SL-1001",
      scheduleDate: "2026-10-20",
      slotIndex: 1,
      startTime: "08:00:00",
      endTime: "10:00:00",
      timeRange: "08:00 - 10:00",
      patientName: "Ahmad Fauzi",
      patientPhone: "081234567890",
      patientEmail: "ahmad@example.com",
      counselorId: "c-001",
      counselorName: "Dimas Pratama, S.Psi.",
      counselorTitle: "S.Psi",
      counselorType: "peer",
      actualDurationMinutes: 90,
      baseFee: 85000,
      extensionFee: 0,
      totalAmount: 85000,
      paymentMethod: "xendit",
      paymentStatus: "PAID",
      bookingStatus: "completed",
      isExtended: false,
      extensionMinutes: 0,
      isNoShow: false,
      createdAt: "2026-10-19T08:00:00Z",
    },
    {
      id: "b-002",
      bookingCode: "SL-1002",
      scheduleDate: "2026-10-20",
      slotIndex: 2,
      startTime: "10:00:00",
      endTime: "12:00:00",
      timeRange: "10:00 - 12:00",
      patientName: "Citra Lestari",
      patientPhone: "081987654321",
      patientEmail: "citra@example.com",
      counselorId: "c-002",
      counselorName: "Dr. Sarah Annisa, M.Psi.",
      counselorTitle: "M.Psi., Psikolog",
      counselorType: "psychologist",
      actualDurationMinutes: 120,
      baseFee: 150000,
      extensionFee: 50000,
      totalAmount: 200000,
      paymentMethod: "manual_bank_transfer",
      paymentStatus: "VERIFIED",
      bookingStatus: "completed",
      isExtended: true,
      extensionMinutes: 30,
      isNoShow: false,
      createdAt: "2026-10-19T09:00:00Z",
    },
    {
      id: "b-003",
      bookingCode: "SL-1003",
      scheduleDate: "2026-10-21",
      slotIndex: 3,
      startTime: "12:00:00",
      endTime: "14:00:00",
      timeRange: "12:00 - 14:00",
      patientName: "Budi Santoso",
      patientPhone: "081345678901",
      patientEmail: "budi@example.com",
      counselorId: "c-001",
      counselorName: "Dimas Pratama, S.Psi.",
      counselorTitle: "S.Psi",
      counselorType: "peer",
      actualDurationMinutes: 120,
      baseFee: 85000,
      extensionFee: 35000,
      totalAmount: 120000,
      paymentMethod: "xendit",
      paymentStatus: "PAID",
      bookingStatus: "confirmed",
      isExtended: true,
      extensionMinutes: 30,
      isNoShow: false,
      createdAt: "2026-10-20T08:00:00Z",
    },
    {
      id: "b-004",
      bookingCode: "SL-1004",
      scheduleDate: "2026-10-22",
      slotIndex: 4,
      startTime: "14:00:00",
      endTime: "16:00:00",
      timeRange: "14:00 - 16:00",
      patientName: "Eka Wulandari",
      patientPhone: "081567890123",
      patientEmail: "eka@example.com",
      counselorId: "c-002",
      counselorName: "Dr. Sarah Annisa, M.Psi.",
      counselorTitle: "M.Psi., Psikolog",
      counselorType: "psychologist",
      actualDurationMinutes: 30,
      baseFee: 150000,
      extensionFee: 0,
      totalAmount: 150000,
      paymentMethod: "manual_bank_transfer",
      paymentStatus: "VERIFIED",
      bookingStatus: "completed",
      isExtended: false,
      extensionMinutes: 0,
      isNoShow: true,
      createdAt: "2026-10-21T10:00:00Z",
    },
    {
      id: "b-005",
      bookingCode: "SL-1005",
      scheduleDate: "2026-10-23",
      slotIndex: 5,
      startTime: "16:00:00",
      endTime: "18:00:00",
      timeRange: "16:00 - 18:00",
      patientName: "Farhan Hakim",
      patientPhone: "081678901234",
      patientEmail: "farhan@example.com",
      counselorId: "c-001",
      counselorName: "Dimas Pratama, S.Psi.",
      counselorTitle: "S.Psi",
      counselorType: "peer",
      actualDurationMinutes: 90,
      baseFee: 85000,
      extensionFee: 0,
      totalAmount: 85000,
      paymentMethod: "xendit",
      paymentStatus: "PENDING",
      bookingStatus: "pending_payment",
      isExtended: false,
      extensionMinutes: 0,
      isNoShow: false,
      createdAt: "2026-10-22T11:00:00Z",
    },
  ]

  // ===========================================================================
  // 1. Authorization
  // ===========================================================================
  describe("1. Admin Access Control", () => {
    it("blocks non-admin users from accessing financial reports", async () => {
      const res = await getFinanceReportDataAction({
        currentUser: unauthorizedUser,
      })
      expect(res.success).toBe(false)
      expect(res.error).toContain("Akses ditolak")
      expect(res.items).toHaveLength(0)
    })

    it("allows authenticated admin users to retrieve financial reports", async () => {
      const res = await getFinanceReportDataAction({
        currentUser: adminUser,
        fetchFn: async () => sampleLedgerItems,
      })
      expect(res.success).toBe(true)
      expect(res.items).toHaveLength(5)
    })
  })

  // ===========================================================================
  // 2. Metrics Calculation
  // ===========================================================================
  describe("2. Top Metrics Calculation (Base, Extend, Revenue, Channels)", () => {
    it("computes total scheduled sessions and completed sessions accurately", () => {
      const metrics = computeFinanceMetrics(sampleLedgerItems)
      expect(metrics.totalScheduledSessions).toBe(5)
      expect(metrics.completedSessionsCount).toBe(3) // b-001, b-002, b-004
    })

    it("accurately aggregates gross revenue across base fee and extend fees", () => {
      const metrics = computeFinanceMetrics(sampleLedgerItems)
      // Paid/verified/confirmed/completed items:
      // b-001: 85000 (base: 85000, ext: 0)
      // b-002: 200000 (base: 150000, ext: 50000)
      // b-003: 120000 (base: 85000, ext: 35000)
      // b-004: 150000 (base: 150000, ext: 0)
      // b-005: pending_payment (excluded from gross revenue)
      const expectedBase = 85000 + 150000 + 85000 + 150000 // 470000
      const expectedExt = 50000 + 35000 // 85000
      const expectedGross = expectedBase + expectedExt // 555000

      expect(metrics.baseRevenue).toBe(expectedBase)
      expect(metrics.totalExtensionRevenue).toBe(expectedExt)
      expect(metrics.totalGrossRevenue).toBe(expectedGross)
    })

    it("computes extended sessions count and extend revenue correctly", () => {
      const metrics = computeFinanceMetrics(sampleLedgerItems)
      expect(metrics.extendedSessionsCount).toBe(2) // b-002 and b-003
      expect(metrics.totalExtensionRevenue).toBe(85000)
    })

    it("computes payment channels breakdown (Xendit vs Manual Bank Transfer)", () => {
      const metrics = computeFinanceMetrics(sampleLedgerItems)
      // Xendit revenue items: b-001 (85k), b-003 (120k) => 2 tx, 205k
      expect(metrics.paymentChannels.xendit.count).toBe(2)
      expect(metrics.paymentChannels.xendit.revenue).toBe(205000)

      // Manual items: b-002 (200k), b-004 (150k) => 2 tx, 350k
      expect(metrics.paymentChannels.manual.count).toBe(2)
      expect(metrics.paymentChannels.manual.revenue).toBe(350000)
    })

    it("handles empty items array gracefully without crashing", () => {
      const metrics = computeFinanceMetrics([])
      expect(metrics.totalScheduledSessions).toBe(0)
      expect(metrics.completedSessionsCount).toBe(0)
      expect(metrics.totalGrossRevenue).toBe(0)
      expect(metrics.baseRevenue).toBe(0)
      expect(metrics.totalExtensionRevenue).toBe(0)
      expect(metrics.extendedSessionsCount).toBe(0)
      expect(metrics.paymentChannels.xendit.count).toBe(0)
      expect(metrics.paymentChannels.manual.count).toBe(0)
    })
  })

  // ===========================================================================
  // 3. Filtering Logic
  // ===========================================================================
  describe("3. Filtering Logic (Date, Counselor Type, Payment Method, Status, Search)", () => {
    it("filters items by date range", () => {
      const filters: FinanceReportFilters = {
        startDate: "2026-10-21",
        endDate: "2026-10-22",
      }
      const filtered = applyInMemorFilters(sampleLedgerItems, filters)
      expect(filtered).toHaveLength(2)
      expect(filtered.map((i) => i.bookingCode)).toEqual(["SL-1003", "SL-1004"])
    })

    it("filters items by counselor type (Peer vs Psychologist)", () => {
      const peerFiltered = applyInMemorFilters(sampleLedgerItems, {
        counselorType: "peer",
      })
      expect(peerFiltered).toHaveLength(3)
      expect(peerFiltered.every((i) => i.counselorType === "peer")).toBe(true)

      const psychFiltered = applyInMemorFilters(sampleLedgerItems, {
        counselorType: "psychologist",
      })
      expect(psychFiltered).toHaveLength(2)
      expect(psychFiltered.every((i) => i.counselorType === "psychologist")).toBe(true)
    })

    it("filters items by payment method (Xendit vs Manual)", () => {
      const manualFiltered = applyInMemorFilters(sampleLedgerItems, {
        paymentMethod: "manual_bank_transfer",
      })
      expect(manualFiltered).toHaveLength(2)
      expect(manualFiltered.every((i) => i.paymentMethod === "manual_bank_transfer")).toBe(true)

      const xenditFiltered = applyInMemorFilters(sampleLedgerItems, {
        paymentMethod: "xendit",
      })
      expect(xenditFiltered).toHaveLength(3)
      expect(xenditFiltered.every((i) => i.paymentMethod === "xendit")).toBe(true)
    })

    it("filters items by search query across booking code, patient name, and counselor", () => {
      const searchCode = applyInMemorFilters(sampleLedgerItems, { search: "SL-1002" })
      expect(searchCode).toHaveLength(1)
      expect(searchCode[0].patientName).toBe("Citra Lestari")

      const searchCounselor = applyInMemorFilters(sampleLedgerItems, {
        search: "Sarah Annisa",
      })
      expect(searchCounselor).toHaveLength(2)

      const searchPhone = applyInMemorFilters(sampleLedgerItems, { search: "081234567890" })
      expect(searchPhone).toHaveLength(1)
      expect(searchPhone[0].bookingCode).toBe("SL-1001")
    })

    it("filters items by session status including No-Show", () => {
      const completed = applyInMemorFilters(sampleLedgerItems, { status: "completed" })
      expect(completed).toHaveLength(3)

      const noShow = applyInMemorFilters(sampleLedgerItems, { status: "no_show" })
      expect(noShow).toHaveLength(1)
      expect(noShow[0].bookingCode).toBe("SL-1004")
      expect(noShow[0].isNoShow).toBe(true)
    })
  })

  // ===========================================================================
  // 4. CSV Export Formatting
  // ===========================================================================
  describe("4. CSV Export Formatting for Decoupled Payroll", () => {
    it("generates correct RFC 4180 CSV headers and data rows", () => {
      const csv = generateFinanceCsv(sampleLedgerItems)
      const lines = csv.split("\r\n")

      // Header row
      expect(lines[0]).toBe(
        "Kode Booking,Tanggal Sesi,Slot,Jam Mulai,Jam Selesai,Nama Klien,No WhatsApp Klien,Mitra Konselor,Tipe Konselor,Durasi Riil (Menit),Biaya Sesi Dasar (Rp),Biaya Extend (Rp),Total Pembayaran (Rp),Metode Bayar,Status Pembayaran,Status Sesi,Tanggal Dibuat"
      )

      // Total rows: 1 header + 5 data rows
      expect(lines).toHaveLength(6)
    })

    it("correctly escapes commas in counselor names or titles", () => {
      const csv = generateFinanceCsv(sampleLedgerItems)
      // "Dimas Pratama, S.Psi." contains a comma, so it must be enclosed in quotes
      expect(csv).toContain('"Dimas Pratama, S.Psi."')
      expect(csv).toContain('"Dr. Sarah Annisa, M.Psi."')
    })

    it("maps counselor types and payment channels to clear Indonesian descriptions", () => {
      const csv = generateFinanceCsv(sampleLedgerItems)
      expect(csv).toContain("Konselor Sebaya")
      expect(csv).toContain("Psikolog Klinis")
      expect(csv).toContain("Xendit Gateway")
      expect(csv).toContain("Transfer Manual")
    })

    it("displays No-Show status properly in CSV export", () => {
      const csv = generateFinanceCsv(sampleLedgerItems)
      expect(csv).toContain("SL-1004,2026-10-22,Slot 4,14:00:00,16:00:00,Eka Wulandari,081567890123")
      expect(csv).toContain("No-Show")
    })

    it("formats zero-extend sessions with 0 in the extend fee column", () => {
      const csv = generateFinanceCsv([sampleLedgerItems[0]])
      const dataLine = csv.split("\r\n")[1]
      // 85000, 0, 85000
      expect(dataLine).toContain("85000,0,85000")
    })
  })
})
