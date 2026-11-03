import { sql } from "drizzle-orm"
import { bookings, counselors, schedules, sessionReports } from "@/db/schema"
import {
  canMarkNoShow,
  deriveStage,
  sessionStartAt,
  stageLabel,
} from "@/lib/booking-cycle"
import { NO_COUNSELOR_LABEL, poolSlotDisplay } from "@/lib/pool/display"
import type { AdminBookingItem } from "./actions"

export interface BookingJoinRow {
  booking: typeof bookings.$inferSelect
  counselor: typeof counselors.$inferSelect | null
  schedule: typeof schedules.$inferSelect | null
  report: typeof sessionReports.$inferSelect | null
  /** Honor sesi ini sudah masuk Periode Payroll yang ditutup (tahap "Payroll Ditutup"). */
  payrollClosed?: boolean
}

/** Kolom select untuk `BookingJoinRow.payrollClosed`. */
export const payrollClosedColumn = sql<boolean>`exists (
  select 1 from counselor_honors h
  join payroll_periods p on p.id = h.base_period_id
  where h.booking_id = ${bookings.id} and p.status = 'closed'
)`

/** Memetakan satu baris join Booking ke bentuk yang ditampilkan di tabel admin. */
export function mapBookingRow(r: BookingJoinRow): AdminBookingItem {
  const b = r.booking
  const c = r.counselor
  const s = r.schedule
  const rep = r.report

  const counselorTypeLabel =
    c?.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"
  // Booking Konselor Bebas yang belum diklaim: tidak ada baris jadwal, slot ada di pool_date/pool_slot_index.
  const pool = s ? null : poolSlotDisplay(b)
  const dateStr = s?.date ? String(s.date) : (pool?.date ?? "")
  const timeRange = s
    ? `${s.startTime?.slice(0, 5)} - ${s.endTime?.slice(0, 5)}`
    : pool
      ? `${pool.startTime} - ${pool.endTime}`
      : ""

  const stage = deriveStage({
    status: b.status,
    counselorAssigned: Boolean(b.counselorId),
    rescheduleCount: b.rescheduleCount + b.adminRescheduleCount,
    timerStartedAt: rep?.timerStartedAt ?? null,
    hasReport: Boolean(rep?.submittedAt),
    payrollClosed: Boolean(r.payrollClosed),
  })
  const noShowCheck =
    dateStr && (s?.startTime || pool)
      ? canMarkNoShow({
          status: b.status,
          sessionStart: sessionStartAt(dateStr, s?.startTime ?? pool!.startTime),
          timerStartedAt: rep?.timerStartedAt ?? null,
        })
      : { allowed: false }

  return {
    id: b.id,
    bookingCode: b.bookingCode,
    accessToken: b.accessToken,
    patientName: b.patientName,
    patientPhone: b.patientPhone,
    patientEmail: b.patientEmail,
    gender: b.gender,
    age: b.age,
    domicile: b.domicile,
    initialNotes: b.initialNotes,
    counselorId: c?.id || "",
    counselorName: c?.fullName || NO_COUNSELOR_LABEL,
    counselorTitle: c?.title || "",
    counselorType: counselorTypeLabel,
    scheduleDate: dateStr,
    slotIndex: s?.slotIndex || pool?.slotIndex || 1,
    startTime: s?.startTime ? s.startTime.slice(0, 5) : (pool?.startTime ?? ""),
    endTime: s?.endTime ? s.endTime.slice(0, 5) : (pool?.endTime ?? ""),
    timeRange,
    zoomMeetingId: b.zoomMeetingId,
    zoomJoinUrl: b.zoomJoinUrl,
    zoomStartUrl: b.zoomStartUrl,
    zoomHostKey: b.zoomHostKey,
    status: b.status,
    stage,
    stageLabel: stageLabel(stage),
    canMarkNoShow: noShowCheck.allowed,
    paymentMethod: b.paymentMethod,
    manualPaymentStatus: b.manualPaymentStatus || "NONE",
    isExtended: b.isExtended,
    extensionFee: Number(b.extensionFee) || 0,
    noShowMarkedAt: b.noShowMarkedAt ? b.noShowMarkedAt.toISOString() : null,
    isFollowedUp: b.isFollowedUp,
    followedUpAt: b.followedUpAt ? b.followedUpAt.toISOString() : null,
    hasSessionReport: Boolean(rep?.id),
    sessionReportId: rep?.id || null,
    reportDetails: rep?.id
      ? {
          id: rep.id,
          mainIssue: rep.mainIssue,
          summary: rep.summary || "",
          actionPlan: rep.actionPlan || null,
          followUpRecommendation: rep.followUpRecommendation || null,
          actualDurationMinutes: rep.actualDurationMinutes || null,
          createdAt: rep.createdAt ? rep.createdAt.toISOString() : b.createdAt.toISOString(),
        }
      : null,
    createdAt: b.createdAt.toISOString(),
  }
}
