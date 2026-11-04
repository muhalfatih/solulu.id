/**
 * Antrean Dispatch WhatsApp (#31): Booking yang perlu dikirimi pesan.
 *
 * Dipakai bersama oleh halaman Dispatch WhatsApp, dashboard Operator (#34), dan
 * Perlu Tindakan Booking. Aturan keanggotaan antrean ada di `dispatch-kind.ts`
 * (versi pure); ekspresi SQL di bawah ini harus tetap sama dengannya.
 */
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/db"
import { bookings, counselors, schedules, sessionReports } from "@/db/schema"
import { getTodayWibDateString } from "@/lib/operator/dispatcher"
import type { WaTemplateKey } from "./templates"

export interface DispatchQueueRow {
  bookingId: string
  bookingCode: string
  patientName: string
  patientPhone: string
  counselorName: string
  scheduleDate: string
  timeRange: string
  slotIndex: number
  kind: WaTemplateKey
  /** Null = belum dikirim. */
  lastSentAt: Date | null
}

export interface DispatchQueueFilter {
  /** Hanya yang belum dikirim ("pending") atau sudah ("sent"); kosong = semua. */
  sent?: "pending" | "sent"
  kind?: WaTemplateKey
  q?: string
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** Kind template yang berlaku untuk baris Booking (join schedules + laporan). NULL = tidak masuk antrean. */
function kindExpr(today: string): SQL<WaTemplateKey | null> {
  return sql<WaTemplateKey | null>`(case
    when ${bookings.status} = 'confirmed' and ${schedules.date} >= ${today} then 'dispatch_link_sesi'
    when ${bookings.status} = 'completed' and ${sessionReports.submittedAt} is not null then 'laporan_siap'
    else null end)`
}

function lastSentExpr(today: string): SQL<Date | null> {
  return sql<Date | null>`(select max(d.sent_at) from whatsapp_dispatches d
    where d.booking_id = ${bookings.id} and d.template_key = ${kindExpr(today)})`
}

function conditions(filter: DispatchQueueFilter, today: string): SQL {
  const kind = kindExpr(today)
  const parts: SQL[] = [sql`${kind} is not null`]
  if (filter.kind) parts.push(sql`${kind} = ${filter.kind}`)
  if (filter.sent === "pending") parts.push(sql`${lastSentExpr(today)} is null`)
  if (filter.sent === "sent") parts.push(sql`${lastSentExpr(today)} is not null`)
  if (filter.q) {
    const like = `%${escapeLike(filter.q)}%`
    parts.push(
      or(
        ilike(bookings.bookingCode, like),
        ilike(bookings.patientName, like),
        ilike(bookings.patientPhone, like),
        ilike(counselors.fullName, like)
      )!
    )
  }
  return and(...parts)!
}

export interface DispatchQueuePage {
  rows: DispatchQueueRow[]
  total: number
}

export interface DispatchQueueQuery {
  filter?: DispatchQueueFilter
  sort?: { key: string; dir: "asc" | "desc" }
  limit: number
  offset: number
  /** Tanggal WIB (YYYY-MM-DD); diinjeksi agar bisa diuji. */
  today?: string
}

const SORT_COLUMNS = {
  scheduleDate: schedules.date,
  patientName: bookings.patientName,
  bookingCode: bookings.bookingCode,
  counselorName: counselors.fullName,
} as const

/** Satu halaman antrean beserta total (setelah filter). */
export async function queryDispatchQueue(query: DispatchQueueQuery): Promise<DispatchQueuePage> {
  const today = query.today ?? getTodayWibDateString()
  const where = conditions(query.filter ?? {}, today)
  const sortCol = SORT_COLUMNS[(query.sort?.key ?? "scheduleDate") as keyof typeof SORT_COLUMNS] ?? schedules.date
  const dir = query.sort?.dir === "desc" ? desc : asc

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
        slotIndex: schedules.slotIndex,
        kind: kindExpr(today),
        lastSentAt: lastSentExpr(today),
      })
      .from(bookings)
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
      .where(where)
      .orderBy(dir(sortCol), asc(schedules.startTime), asc(bookings.bookingCode))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(bookings)
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
      .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
      .where(where),
  ])

  return {
    total: count?.total ?? 0,
    rows: rows.flatMap((r) =>
      r.kind
        ? [
            {
              bookingId: r.bookingId,
              bookingCode: r.bookingCode,
              patientName: r.patientName,
              patientPhone: r.patientPhone,
              counselorName: r.counselorName,
              scheduleDate: String(r.scheduleDate),
              timeRange: `${r.startTime.slice(0, 5)} - ${r.endTime.slice(0, 5)}`,
              slotIndex: r.slotIndex,
              kind: r.kind,
              lastSentAt: r.lastSentAt ? new Date(r.lastSentAt) : null,
            },
          ]
        : []
    ),
  }
}

/** Booking yang masih menunggu pesan WhatsApp (belum ada "Sudah Dikirim"), untuk Operator dashboard & Perlu Tindakan. */
export async function listBookingsPendingWhatsAppDispatch(
  opts: { limit?: number; today?: string } = {}
): Promise<DispatchQueueRow[]> {
  const page = await queryDispatchQueue({
    filter: { sent: "pending" },
    limit: opts.limit ?? 50,
    offset: 0,
    today: opts.today,
  })
  return page.rows
}

export async function countBookingsPendingWhatsAppDispatch(opts: { today?: string } = {}): Promise<number> {
  const page = await queryDispatchQueue({
    filter: { sent: "pending" },
    limit: 1,
    offset: 0,
    today: opts.today,
  })
  return page.total
}

/** Dipakai action kirim: Booking + data pesan untuk satu template, tanpa filter antrean. */
export interface DispatchBookingData {
  bookingId: string
  status: string
  patientName: string
  patientPhone: string
  accessToken: string
  counselorName: string
  scheduleDate: string
  startTime: string
  endTime: string
  hasReport: boolean
}

export async function loadDispatchBookingData(bookingId: string): Promise<DispatchBookingData | null> {
  const [r] = await db
    .select({
      bookingId: bookings.id,
      status: bookings.status,
      patientName: bookings.patientName,
      patientPhone: bookings.patientPhone,
      accessToken: bookings.accessToken,
      counselorName: counselors.fullName,
      scheduleDate: schedules.date,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      reportSubmittedAt: sessionReports.submittedAt,
    })
    .from(bookings)
    .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
    .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
    .leftJoin(sessionReports, eq(sessionReports.bookingId, bookings.id))
    .where(eq(bookings.id, bookingId))
    .limit(1)
  if (!r) return null
  return {
    bookingId: r.bookingId,
    status: r.status,
    patientName: r.patientName,
    patientPhone: r.patientPhone,
    accessToken: r.accessToken,
    counselorName: r.counselorName,
    scheduleDate: String(r.scheduleDate),
    startTime: r.startTime,
    endTime: r.endTime,
    hasReport: r.reportSubmittedAt !== null,
  }
}
