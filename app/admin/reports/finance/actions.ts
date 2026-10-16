"use server"

import { eq, desc } from "drizzle-orm"
import { db } from "@/db"
import {
  bookings,
  counselors,
  schedules,
  transactions,
  sessionReports,
} from "@/db/schema"
import { getAuthenticatedAdmin, type AdminAuthContext } from "@/app/admin/counselors/actions"
import {
  type FinanceLedgerItem,
  type FinanceReportMetrics,
  type FinanceReportFilters,
  DEFAULT_SLOT_TIMES,
  computeFinanceMetrics,
  applyInMemorFilters,
} from "./utils"

// Re-export types for consumers
export type { FinanceLedgerItem, FinanceReportMetrics, FinanceReportFilters }

/**
 * Server Action: Fetches financial ledger and computed metrics from real database
 */
export async function getFinanceReportDataAction(params?: {
  filters?: FinanceReportFilters
  currentUser?: AdminAuthContext | null
  fetchFn?: () => Promise<FinanceLedgerItem[]>
}) {
  const admin = await getAuthenticatedAdmin(params?.currentUser)
  if (!admin) {
    return {
      success: false as const,
      error: "Akses ditolak: Hanya administrator yang dapat mengakses laporan keuangan.",
      items: [] as FinanceLedgerItem[],
      metrics: computeFinanceMetrics([]),
    }
  }

  // Support dependency injection for unit tests
  if (params?.fetchFn) {
    const rawItems = await params.fetchFn()
    const filtered = applyInMemorFilters(rawItems, params.filters)
    return {
      success: true as const,
      items: filtered,
      metrics: computeFinanceMetrics(filtered),
    }
  }

  try {
    // 1. Query Real DB via Drizzle
    const query = db
      .select({
        id: bookings.id,
        bookingCode: bookings.bookingCode,
        patientName: bookings.patientName,
        patientPhone: bookings.patientPhone,
        patientEmail: bookings.patientEmail,
        counselorId: bookings.counselorId,
        paymentMethod: bookings.paymentMethod,
        manualPaymentStatus: bookings.manualPaymentStatus,
        isExtended: bookings.isExtended,
        extensionMinutes: bookings.extensionMinutes,
        extensionFee: bookings.extensionFee,
        extensionPaymentStatus: bookings.extensionPaymentStatus,
        status: bookings.status,
        isNoShow: bookings.isNoShow,
        createdAt: bookings.createdAt,
        // schedules
        scheduleId: schedules.id,
        scheduleDate: schedules.date,
        slotIndex: schedules.slotIndex,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        // counselors
        counselorName: counselors.fullName,
        counselorTitle: counselors.title,
        counselorType: counselors.counselorType,
        customFeeRate: counselors.customFeeRate,
        // transactions
        transactionId: transactions.id,
        transactionStatus: transactions.status,
        grossAmount: transactions.grossAmount,
        discountAmount: transactions.discountAmount,
        netAmount: transactions.netAmount,
        // sessionReports
        actualDurationMinutes: sessionReports.actualDurationMinutes,
      })
      .from(bookings)
      .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
      .leftJoin(transactions, eq(bookings.id, transactions.bookingId))
      .leftJoin(sessionReports, eq(bookings.id, sessionReports.bookingId))
      .orderBy(desc(bookings.createdAt))

    const rows = await query

    // 2. Map rows to strongly typed FinanceLedgerItem
    const mappedItems: FinanceLedgerItem[] = rows.map((r) => {
      const slotIndex = r.slotIndex || 1
      const defaultTimes = DEFAULT_SLOT_TIMES[slotIndex] || {
        startTime: "08:00:00",
        endTime: "10:00:00",
      }
      const startTime = r.startTime || defaultTimes.startTime
      const endTime = r.endTime || defaultTimes.endTime
      const timeRange = `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`

      const extFee = Number(r.extensionFee) || 0

      // Compute base fee:
      let baseFee = 0
      if (r.grossAmount && Number(r.grossAmount) > 0) {
        baseFee = Math.max(0, Number(r.grossAmount) - extFee)
      } else if (r.customFeeRate && Number(r.customFeeRate) > 0) {
        baseFee = Number(r.customFeeRate)
      } else {
        baseFee = r.counselorType === "psychologist" ? 150000 : 85000
      }

      // Compute total amount:
      let totalAmount = 0
      if (r.netAmount && Number(r.netAmount) > 0) {
        totalAmount = Number(r.netAmount)
      } else {
        totalAmount = baseFee + extFee
      }

      // Determine payment status
      let paymentStatus: FinanceLedgerItem["paymentStatus"] = "PENDING"
      if (r.transactionStatus) {
        paymentStatus = r.transactionStatus as FinanceLedgerItem["paymentStatus"]
      } else if (r.paymentMethod === "manual_bank_transfer") {
        if (r.manualPaymentStatus === "VERIFIED") paymentStatus = "VERIFIED"
        else if (r.manualPaymentStatus === "REJECTED") paymentStatus = "FAILED"
        else paymentStatus = "PENDING"
      } else if (r.status === "completed" || r.status === "confirmed") {
        paymentStatus = "PAID"
      }

      // Compute actual duration in minutes
      const actualDuration =
        r.actualDurationMinutes ??
        (r.isExtended ? 90 + (r.extensionMinutes || 30) : 90)

      return {
        id: r.id,
        bookingCode: r.bookingCode,
        scheduleDate: r.scheduleDate || new Date().toISOString().slice(0, 10),
        slotIndex,
        startTime,
        endTime,
        timeRange,
        patientName: r.patientName,
        patientPhone: r.patientPhone,
        patientEmail: r.patientEmail,
        counselorId: r.counselorId,
        counselorName: r.counselorName || "Mitra Belum Ditugaskan",
        counselorTitle: r.counselorTitle || "S.Psi",
        counselorType: (r.counselorType as "peer" | "psychologist") || "peer",
        actualDurationMinutes: actualDuration,
        baseFee,
        extensionFee: extFee,
        totalAmount,
        paymentMethod: (r.paymentMethod as "xendit" | "manual_bank_transfer") || "xendit",
        paymentStatus,
        bookingStatus: r.status as FinanceLedgerItem["bookingStatus"],
        isExtended: r.isExtended || false,
        extensionMinutes: r.extensionMinutes || 0,
        isNoShow: r.isNoShow || false,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      }
    })

    // 3. Apply filters
    const filteredItems = applyInMemorFilters(mappedItems, params?.filters)
    const metrics = computeFinanceMetrics(filteredItems)

    return {
      success: true as const,
      items: filteredItems,
      metrics,
    }
  } catch (error) {
    console.error("Error fetching admin finance report data:", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Gagal memuat data laporan keuangan",
      items: [] as FinanceLedgerItem[],
      metrics: computeFinanceMetrics([]),
    }
  }
}
