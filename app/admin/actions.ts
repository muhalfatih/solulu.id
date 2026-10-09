"use server"

import { eq, desc, and, isNull, sql } from "drizzle-orm"
import { db } from "@/db"
import {
  counselors,
  bookings,
  sessionReports,
  transactions,
  schedules,
} from "@/db/schema"
import { getAuthenticatedAdmin, type AdminAuthContext } from "@/app/admin/counselors/actions"

export interface AdminDashboardMetrics {
  totalCounselors: number
  psychologistCount: number
  peerCount: number
  pendingMedicalRecordsCount: number
  firstPendingMedicalRecordCode: string | null
  totalRevenue: number
  paidSessionsCount: number
  revenuePeriod: string
}

/**
 * Server action to fetch real aggregated metrics for the Admin Dashboard directly from database.
 */
export async function getAdminDashboardMetricsAction(options?: {
  currentUser?: AdminAuthContext | null
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    // 1. Counselors Count & Breakdown
    const counselorRows = await db
      .select({
        id: counselors.id,
        counselorType: counselors.counselorType,
        isActive: counselors.isActive,
      })
      .from(counselors)

    const totalCounselors = counselorRows.length
    const psychologistCount = counselorRows.filter(
      (c) => c.counselorType === "psychologist"
    ).length
    const peerCount = counselorRows.filter((c) => c.counselorType === "peer").length

    // 2. Pending Medical Records (Completed bookings without sessionReports)
    const pendingReportsRows = await db
      .select({
        bookingId: bookings.id,
      })
      .from(bookings)
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
      .where(and(eq(bookings.status, "completed"), isNull(sessionReports.id)))

    const pendingMedicalRecordsCount = pendingReportsRows.length
    const firstPendingMedicalRecordCode =
      pendingReportsRows.length > 0
        ? `SOL-${pendingReportsRows[0].bookingId.slice(0, 4).toUpperCase()}`
        : null

    // 3. Paid Transactions & Revenue
    const paidTransactions = await db
      .select({
        netAmount: transactions.netAmount,
        paidAt: transactions.paidAt,
      })
      .from(transactions)
      .where(eq(transactions.status, "PAID"))

    const totalRevenue = paidTransactions.reduce(
      (sum, row) => sum + (Number(row.netAmount) || 0),
      0
    )
    const paidSessionsCount = paidTransactions.length

    const now = new Date()
    const revenuePeriod = now.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    })

    const metrics: AdminDashboardMetrics = {
      totalCounselors,
      psychologistCount,
      peerCount,
      pendingMedicalRecordsCount,
      firstPendingMedicalRecordCode,
      totalRevenue,
      paidSessionsCount,
      revenuePeriod,
    }

    return {
      success: true,
      data: metrics,
    }
  } catch (err: any) {
    console.error("Error fetching admin dashboard metrics:", err)
    return {
      success: false,
      error: err.message || "Gagal mengambil data metrik dasbor admin.",
    }
  }
}
