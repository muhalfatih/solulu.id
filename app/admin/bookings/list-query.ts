import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, sessionReports } from "@/db/schema"
import type { TableState } from "@/lib/data-table/search-params"
import type { AdminBookingItem, BookingCounselorOption } from "./actions"
import { mapBookingRow } from "./map-row"
import { BOOKING_STATUS_VALUES } from "./table-config"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** WHERE untuk filter URL; semua nilai sudah divalidasi oleh parseTableParams. */
export function buildBookingConditions(filters: Record<string, string>): SQL | undefined {
  const conditions: SQL[] = []

  const status = filters.status
  if (status && (BOOKING_STATUS_VALUES as readonly string[]).includes(status)) {
    conditions.push(eq(bookings.status, status as (typeof BOOKING_STATUS_VALUES)[number]))
  }
  if (filters.counselor && UUID.test(filters.counselor)) {
    conditions.push(eq(bookings.counselorId, filters.counselor))
  }
  if (filters.slot) {
    conditions.push(sql`coalesce(${schedules.slotIndex}, ${bookings.poolSlotIndex}) = ${Number(filters.slot)}`)
  }
  if (filters.report === "filled") {
    conditions.push(isNotNull(sessionReports.id))
  } else if (filters.report === "pending") {
    conditions.push(and(isNull(sessionReports.id), eq(bookings.status, "completed"))!)
  }
  if (filters.q) {
    const like = `%${escapeLike(filters.q)}%`
    conditions.push(
      or(
        ilike(bookings.bookingCode, like),
        ilike(bookings.patientName, like),
        ilike(bookings.patientPhone, like),
        ilike(bookings.patientEmail, like),
        ilike(counselors.fullName, like)
      )!
    )
  }

  return conditions.length ? and(...conditions) : undefined
}

const SORT_COLUMNS = {
  createdAt: bookings.createdAt,
  bookingCode: bookings.bookingCode,
  patientName: bookings.patientName,
  counselorName: counselors.fullName,
  scheduleDate: sql`coalesce(${schedules.date}, ${bookings.poolDate})`,
  status: bookings.status,
} as const

export interface BookingKpis {
  total: number
  confirmed: number
  reportsFilled: number
  reportsPending: number
}

export interface BookingsPage {
  bookings: AdminBookingItem[]
  total: number
  kpis: BookingKpis
  counselors: BookingCounselorOption[]
}

/** Satu halaman Booking untuk admin: paginasi, sort, dan filter dikerjakan di SQL. */
export async function listBookingsPage(state: TableState): Promise<BookingsPage> {
  const where = buildBookingConditions(state.filters)
  const sortColumn =
    SORT_COLUMNS[state.sort.key as keyof typeof SORT_COLUMNS] ?? bookings.createdAt
  const direction = state.sort.dir === "asc" ? asc : desc

  const base = () =>
    db
      .select({
        booking: bookings,
        counselor: counselors,
        schedule: schedules,
        report: sessionReports,
      })
      .from(bookings)
      .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
      .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))

  const [rows, [countRow], [kpiRow], counselorRows] = await Promise.all([
    base()
      .where(where)
      .orderBy(direction(sortColumn), desc(bookings.createdAt))
      .limit(state.pageSize)
      .offset((state.page - 1) * state.pageSize),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(bookings)
      .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
      .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
      .where(where),
    db
      .select({
        total: sql<number>`count(*)::int`,
        confirmed: sql<number>`(count(*) filter (where ${bookings.status} = 'confirmed'))::int`,
        reportsFilled: sql<number>`(count(*) filter (where ${sessionReports.id} is not null))::int`,
        reportsPending: sql<number>`(count(*) filter (where ${sessionReports.id} is null and ${bookings.status} = 'completed'))::int`,
      })
      .from(bookings)
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id)),
    db
      .select({
        id: counselors.id,
        fullName: counselors.fullName,
        counselorType: counselors.counselorType,
      })
      .from(counselors)
      .orderBy(counselors.fullName),
  ])

  return {
    bookings: rows.map(mapBookingRow),
    total: countRow?.total ?? 0,
    kpis: {
      total: kpiRow?.total ?? 0,
      confirmed: kpiRow?.confirmed ?? 0,
      reportsFilled: kpiRow?.reportsFilled ?? 0,
      reportsPending: kpiRow?.reportsPending ?? 0,
    },
    counselors: counselorRows.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      counselorType: c.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
    })),
  }
}
