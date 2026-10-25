export interface FinanceLedgerItem {
  id: string
  bookingCode: string
  scheduleDate: string
  slotIndex: number
  startTime: string
  endTime: string
  timeRange: string
  patientName: string
  patientPhone: string
  patientEmail: string
  counselorId: string
  counselorName: string
  counselorTitle: string
  counselorType: "peer" | "psychologist"
  actualDurationMinutes: number
  baseFee: number
  extensionFee: number
  totalAmount: number
  paymentMethod: "xendit" | "manual_bank_transfer"
  paymentStatus: "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "VERIFIED"
  bookingStatus: "pending_payment" | "confirmed" | "completed" | "cancelled"
  isExtended: boolean
  extensionMinutes: number
  extensionPaymentStatus?: "NONE" | "PENDING" | "PAID" | "REJECTED"
  isNoShow: boolean
  createdAt: string
}

export interface FinanceReportMetrics {
  totalScheduledSessions: number
  completedSessionsCount: number
  totalGrossRevenue: number
  baseRevenue: number
  totalExtensionRevenue: number
  extendedSessionsCount: number
  paymentChannels: {
    xendit: {
      count: number
      revenue: number
    }
    manual: {
      count: number
      revenue: number
    }
  }
}

export interface FinanceReportFilters {
  startDate?: string | null
  endDate?: string | null
  counselorType?: "all" | "peer" | "psychologist" | null
  paymentMethod?: "all" | "xendit" | "manual_bank_transfer" | null
  search?: string | null
  status?: string | null
}

export const DEFAULT_SLOT_TIMES: Record<number, { startTime: string; endTime: string }> = {
  1: { startTime: "08:00:00", endTime: "10:00:00" },
  2: { startTime: "10:00:00", endTime: "12:00:00" },
  3: { startTime: "12:00:00", endTime: "14:00:00" },
  4: { startTime: "14:00:00", endTime: "16:00:00" },
  5: { startTime: "16:00:00", endTime: "18:00:00" },
  6: { startTime: "18:00:00", endTime: "20:00:00" },
  7: { startTime: "20:00:00", endTime: "22:00:00" },
}

/**
 * Client-safe Rupiah currency formatter
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Computes top-level financial metrics from ledger items
 */
export function computeFinanceMetrics(items: FinanceLedgerItem[]): FinanceReportMetrics {
  const totalScheduledSessions = items.length
  const completedSessionsCount = items.filter(
    (item) => item.bookingStatus === "completed"
  ).length

  // Revenue is recognized for sessions that are PAID, VERIFIED, or confirmed/completed
  const revenueItems = items.filter(
    (item) =>
      item.paymentStatus === "PAID" ||
      item.paymentStatus === "VERIFIED" ||
      item.bookingStatus === "confirmed" ||
      item.bookingStatus === "completed"
  )

  const baseRevenue = revenueItems.reduce((acc, curr) => acc + curr.baseFee, 0)
  const totalExtensionRevenue = revenueItems.reduce(
    (acc, curr) => {
      const isPaid = curr.extensionPaymentStatus === undefined || curr.extensionPaymentStatus === "PAID"
      return isPaid ? acc + curr.extensionFee : acc
    },
    0
  )
  const totalGrossRevenue = baseRevenue + totalExtensionRevenue
  const extendedSessionsCount = items.filter(
    (item) => item.isExtended || item.extensionFee > 0
  ).length

  const xenditItems = revenueItems.filter((item) => item.paymentMethod === "xendit")
  const manualItems = revenueItems.filter(
    (item) => item.paymentMethod === "manual_bank_transfer"
  )

  return {
    totalScheduledSessions,
    completedSessionsCount,
    totalGrossRevenue,
    baseRevenue,
    totalExtensionRevenue,
    extendedSessionsCount,
    paymentChannels: {
      xendit: {
        count: xenditItems.length,
        revenue: xenditItems.reduce((acc, curr) => acc + curr.totalAmount, 0),
      },
      manual: {
        count: manualItems.length,
        revenue: manualItems.reduce((acc, curr) => acc + curr.totalAmount, 0),
      },
    },
  }
}

/**
 * Helper to escape CSV value according to RFC 4180
 */
export function escapeCsvValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val).trim()
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Generates RFC 4180 compliant CSV string for external spreadsheet commission calculation
 */
export function generateFinanceCsv(items: FinanceLedgerItem[]): string {
  const headers = [
    "Kode Booking",
    "Tanggal Sesi",
    "Slot",
    "Jam Mulai",
    "Jam Selesai",
    "Nama Klien",
    "No WhatsApp Klien",
    "Mitra Konselor",
    "Tipe Konselor",
    "Durasi Riil (Menit)",
    "Biaya Sesi Dasar (Rp)",
    "Biaya Extend (Rp)",
    "Total Pembayaran (Rp)",
    "Metode Bayar",
    "Status Pembayaran",
    "Status Sesi",
    "Tanggal Dibuat",
  ]

  const rows = items.map((item) => {
    const counselorTypeLabel =
      item.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"
    const paymentMethodLabel =
      item.paymentMethod === "xendit" ? "Xendit Gateway" : "Transfer Manual"

    let sessionStatusLabel = "Menunggu Pembayaran"
    if (item.isNoShow) {
      sessionStatusLabel = "No-Show"
    } else if (item.bookingStatus === "completed") {
      sessionStatusLabel = "Selesai"
    } else if (item.bookingStatus === "confirmed") {
      sessionStatusLabel = "Dikonfirmasi"
    } else if (item.bookingStatus === "cancelled") {
      sessionStatusLabel = "Dibatalkan"
    }

    return [
      escapeCsvValue(item.bookingCode),
      escapeCsvValue(item.scheduleDate),
      escapeCsvValue(`Slot ${item.slotIndex}`),
      escapeCsvValue(item.startTime),
      escapeCsvValue(item.endTime),
      escapeCsvValue(item.patientName),
      escapeCsvValue(item.patientPhone),
      escapeCsvValue(item.counselorName),
      escapeCsvValue(counselorTypeLabel),
      escapeCsvValue(item.actualDurationMinutes),
      escapeCsvValue(item.baseFee),
      escapeCsvValue(item.extensionFee),
      escapeCsvValue(item.totalAmount),
      escapeCsvValue(paymentMethodLabel),
      escapeCsvValue(item.paymentStatus),
      escapeCsvValue(sessionStatusLabel),
      escapeCsvValue(item.createdAt),
    ].join(",")
  })

  return [headers.join(","), ...rows].join("\r\n")
}

/**
 * Filter helper for memory evaluation
 */
export function applyInMemorFilters(
  items: FinanceLedgerItem[],
  filters?: FinanceReportFilters
): FinanceLedgerItem[] {
  if (!filters) return items

  return items.filter((item) => {
    // 1. Date range filter
    if (filters.startDate && item.scheduleDate < filters.startDate) {
      return false
    }
    if (filters.endDate && item.scheduleDate > filters.endDate) {
      return false
    }

    // 2. Counselor type filter
    if (
      filters.counselorType &&
      filters.counselorType !== "all" &&
      item.counselorType !== filters.counselorType
    ) {
      return false
    }

    // 3. Payment method filter
    if (
      filters.paymentMethod &&
      filters.paymentMethod !== "all" &&
      item.paymentMethod !== filters.paymentMethod
    ) {
      return false
    }

    // 4. Session status filter
    if (filters.status && filters.status !== "all") {
      if (filters.status === "no_show" && !item.isNoShow) return false
      if (filters.status !== "no_show" && item.bookingStatus !== filters.status) return false
    }

    // 5. Search keyword filter
    if (filters.search && filters.search.trim().length > 0) {
      const q = filters.search.toLowerCase().trim()
      const matchCode = item.bookingCode.toLowerCase().includes(q)
      const matchClient = item.patientName.toLowerCase().includes(q)
      const matchCounselor = item.counselorName.toLowerCase().includes(q)
      const matchPhone = item.patientPhone.toLowerCase().includes(q)
      if (!matchCode && !matchClient && !matchCounselor && !matchPhone) {
        return false
      }
    }

    return true
  })
}
