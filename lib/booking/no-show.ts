import { eq } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, sessionReports } from "@/db/schema"
import {
  canMarkNoShow,
  sessionStartAt,
  type BookingStatus,
  type NoShowCheck,
} from "@/lib/booking-cycle"

/** Facts needed to decide whether a booking may be marked No-Show. */
export interface NoShowBookingFacts {
  id: string
  status: BookingStatus
  counselorId: string | null
  scheduleId: string
  accessToken: string | null
  /** "YYYY-MM-DD" in WIB */
  scheduleDate: string
  startTime: string
  timerStartedAt: Date | null
}

export async function loadNoShowBookingFacts(bookingId: string): Promise<NoShowBookingFacts | null> {
  const [row] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      counselorId: bookings.counselorId,
      scheduleId: bookings.scheduleId,
      accessToken: bookings.accessToken,
      scheduleDate: schedules.date,
      startTime: schedules.startTime,
      timerStartedAt: sessionReports.timerStartedAt,
    })
    .from(bookings)
    .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
    .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
    .where(eq(bookings.id, bookingId))
    .limit(1)
  return row ? { ...row, scheduleDate: String(row.scheduleDate) } : null
}

/** Applies the Modul Siklus Booking No-Show rule (30 minute tolerance) to loaded booking facts. */
export function evaluateNoShow(facts: NoShowBookingFacts, now: Date = new Date()): NoShowCheck {
  return canMarkNoShow({
    status: facts.status,
    sessionStart: sessionStartAt(facts.scheduleDate, facts.startTime),
    timerStartedAt: facts.timerStartedAt,
    now,
  })
}

/** The only write needed to record a No-Show: status is the source of truth (ADR-0008). */
export function noShowUpdate(now: Date = new Date()) {
  return { status: "no_show" as const, noShowMarkedAt: now }
}
