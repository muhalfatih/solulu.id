import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, transactions } from "@/db/schema"

export interface BookingCepatRow {
  bookingId: string
  bookingCode: string
  patientName: string
  patientPhone: string
  counselorName: string
  scheduleDate: string
  timeRange: string
  status: string
  paymentLabel: string
  netAmount: number
  /** Hanya saat menunggu bayar: batas hold slot. */
  holdUntil: Date | null
  createdAt: Date
}

const SORT = {
  createdAt: bookings.createdAt,
  patientName: bookings.patientName,
  scheduleDate: schedules.date,
  status: bookings.status,
} as const

export async function listBookingCepat(query: {
  q?: string
  status?: string
  sort: { key: string; dir: "asc" | "desc" }
  limit: number
  offset: number
}): Promise<{ rows: BookingCepatRow[]; total: number }> {
  const conds = [eq(bookings.source, "booking_cepat")]
  if (query.status) conds.push(sql`${bookings.status} = ${query.status}`)
  if (query.q) {
    const like = `%${query.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    conds.push(
      or(ilike(bookings.patientName, like), ilike(bookings.bookingCode, like), ilike(bookings.patientPhone, like))!
    )
  }
  const where = and(...conds)
  const sortCol = SORT[query.sort.key as keyof typeof SORT] ?? bookings.createdAt
  const dir = query.sort.dir === "asc" ? asc : desc

  const [rows, [count]] = await Promise.all([
    db
      .select({
        bookingId: bookings.id,
        bookingCode: bookings.bookingCode,
        patientName: bookings.patientName,
        patientPhone: bookings.patientPhone,
        counselorName: counselors.fullName,
        scheduleDate: schedules.date,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        reservedUntil: schedules.reservedUntil,
        scheduleStatus: schedules.status,
        status: bookings.status,
        paymentProvider: transactions.paymentProvider,
        netAmount: transactions.netAmount,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
      .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(transactions, eq(transactions.bookingId, bookings.id))
      .where(where)
      .orderBy(dir(sortCol))
      .limit(query.limit)
      .offset(query.offset),
    db.select({ total: sql<number>`count(*)::int` }).from(bookings).leftJoin(schedules, eq(bookings.scheduleId, schedules.id)).where(where),
  ])

  return {
    total: count?.total ?? 0,
    rows: rows.map((r) => ({
      bookingId: r.bookingId,
      bookingCode: r.bookingCode,
      patientName: r.patientName,
      patientPhone: r.patientPhone,
      counselorName: r.counselorName ?? "-",
      scheduleDate: r.scheduleDate ? String(r.scheduleDate) : "",
      timeRange: r.startTime && r.endTime ? `${r.startTime.slice(0, 5)} - ${r.endTime.slice(0, 5)}` : "",
      status: r.status,
      paymentLabel:
        r.paymentProvider === "admin_bypass" ? "Manual Rp 0" : r.paymentProvider === "manual" ? "Transfer" : "Xendit",
      netAmount: Number(r.netAmount ?? 0),
      holdUntil: r.status === "pending_payment" && r.scheduleStatus === "reserved" ? r.reservedUntil : null,
      createdAt: r.createdAt,
    })),
  }
}
