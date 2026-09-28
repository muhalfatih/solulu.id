"use server"

import { eq } from "drizzle-orm"
import { db } from "@/db"
import {
  bookings,
  counselors,
  schedules,
  transactions,
} from "@/db/schema"
import { formatTimeRange } from "@/lib/schedules/concurrency"
import { formatIndonesianDate } from "@/lib/session/time"
import {
  DEMO_SESSIONS,
  formatRupiah,
  type ActionResponse,
  type SessionPageData,
} from "./types"

export interface SessionDataDependencies {
  findBookingByAccessToken?: (token: string) => Promise<any>
}

/**
 * Fetches all necessary session and counselor details for /session/[token]
 */
export async function getSessionByTokenAction(
  accessToken: string,
  deps?: SessionDataDependencies
): Promise<ActionResponse<SessionPageData>> {
  try {
    if (!accessToken || typeof accessToken !== "string" || accessToken.trim().length === 0) {
      return {
        success: false,
        error: "Token sesi tidak valid atau kosong",
      }
    }

    const cleanToken = accessToken.trim()

    // 1. Dependency injection for unit testing
    if (deps?.findBookingByAccessToken) {
      const customRes = await deps.findBookingByAccessToken(cleanToken)
      if (!customRes) {
        return {
          success: false,
          error: "Sesi konseling dengan tautan ini tidak ditemukan",
        }
      }
      return { success: true, data: customRes }
    }

    // 2. Demo fallback
    if (DEMO_SESSIONS[cleanToken]) {
      return {
        success: true,
        data: DEMO_SESSIONS[cleanToken],
      }
    }

    // 3. Database query
    const rows = await db
      .select({
        booking: bookings,
        counselor: counselors,
        schedule: schedules,
        transaction: transactions,
      })
      .from(bookings)
      .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(transactions, eq(bookings.id, transactions.bookingId))
      .where(eq(bookings.accessToken, cleanToken))
      .limit(1)

    if (rows.length === 0) {
      return {
        success: false,
        error: "Sesi konseling dengan tautan ini tidak ditemukan",
      }
    }

    const item = rows[0]
    const netAmount = item.transaction ? Number(item.transaction.netAmount) : 0

    const sessionData: SessionPageData = {
      booking: {
        id: item.booking.id,
        accessToken: item.booking.accessToken,
        patientName: item.booking.patientName,
        patientEmail: item.booking.patientEmail,
        patientPhone: item.booking.patientPhone,
        initialNotes: item.booking.initialNotes,
        status: item.booking.status as any,
        zoomJoinUrl: item.booking.zoomJoinUrl,
        zoomMeetingId: item.booking.zoomMeetingId,
        createdAt: item.booking.createdAt,
      },
      counselor: {
        id: item.counselor.id,
        fullName: item.counselor.fullName,
        title: item.counselor.title,
        counselorType: item.counselor.counselorType as any,
        counselorTypeDisplay:
          item.counselor.counselorType === "psychologist"
            ? "Psikolog Klinis"
            : "Konselor Sebaya",
        bio: item.counselor.bio,
        specializations: item.counselor.specializations || [],
        avatarR2Url: item.counselor.avatarR2Url,
      },
      schedule: {
        id: item.schedule.id,
        date: item.schedule.date,
        startTime: item.schedule.startTime,
        endTime: item.schedule.endTime,
        timeRange: formatTimeRange(item.schedule.startTime, item.schedule.endTime),
        formattedDate: formatIndonesianDate(item.schedule.date),
      },
      transaction: item.transaction
        ? {
            id: item.transaction.id,
            paymentProvider: item.transaction.paymentProvider,
            paymentMethod: item.transaction.paymentMethod,
            referenceNumber: item.transaction.referenceNumber,
            grossAmount: Number(item.transaction.grossAmount),
            discountAmount: Number(item.transaction.discountAmount),
            netAmount,
            netAmountFormatted: formatRupiah(netAmount),
            status: item.transaction.status,
          }
        : null,
    }

    return {
      success: true,
      data: sessionData,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memuat informasi sesi konseling",
    }
  }
}
