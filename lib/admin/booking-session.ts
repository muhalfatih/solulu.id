import type {
  bookings,
  counselors,
  schedules,
  transactions,
  zoomAccounts,
} from "@/db/schema"
import type { BookingSession } from "@/lib/types/admin"
import { resolveSessionTimingAndStatus } from "@/components/admin/session-utils"

/**
 * Satu baris hasil `getBookingsAdminAction`. Seluruh relasi selain booking boleh kosong
 * (left join), dan kekosongan itu diteruskan apa adanya ke layar sebagai null / string kosong
 * agar UI menampilkan Empty State (AGENTS.md Zero-Mock, ADR-0013).
 */
export interface AdminBookingRow {
  booking: typeof bookings.$inferSelect
  counselor: typeof counselors.$inferSelect | null
  schedule: typeof schedules.$inferSelect | null
  transaction: typeof transactions.$inferSelect | null
  zoomAccount: typeof zoomAccounts.$inferSelect | null
  report: { id: string } | null
}

export interface AdminBookingMapOptions {
  /** Akun Zoom terurut menurut createdAt; indeks 0 = Zoom Pro 1, indeks 1 = Zoom Pro 2. */
  zoomAccounts: Array<{ id: string; name: string | null }>
  /** Akhiran untuk rentang waktu, misalnya " WIB". */
  timeRangeSuffix?: string
}

function resolveZoomRoom(
  row: AdminBookingRow,
  accounts: AdminBookingMapOptions["zoomAccounts"]
): Pick<BookingSession, "zoomRoom" | "zoomSlotNumber" | "zoomAccountName"> {
  const { booking: b, zoomAccount: za } = row
  const slot1 = accounts[0]
  const slot2 = accounts[1]

  if (b.zoomAccountId) {
    if (slot2 && b.zoomAccountId === slot2.id) {
      return {
        zoomSlotNumber: 2,
        zoomAccountName: slot2.name || "Zoom Pro 2",
        zoomRoom: "Zoom Pro 2",
      }
    }
    if (slot1 && b.zoomAccountId === slot1.id) {
      return {
        zoomSlotNumber: 1,
        zoomAccountName: slot1.name || "Zoom Pro 1",
        zoomRoom: "Zoom Pro 1",
      }
    }
    if (za) {
      return {
        zoomSlotNumber: 1,
        zoomAccountName: za.name || "Zoom Pro 1",
        zoomRoom: za.name || "Zoom Pro 1",
      }
    }
    return { zoomSlotNumber: 1, zoomAccountName: null, zoomRoom: "Zoom Pro 1" }
  }

  if (b.zoomMeetingId || b.zoomJoinUrl) {
    return { zoomSlotNumber: null, zoomAccountName: null, zoomRoom: "Ruang Rapat Manual" }
  }

  return { zoomSlotNumber: null, zoomAccountName: null, zoomRoom: "Belum Dijadwalkan" }
}

export function mapAdminBookingRow(
  row: AdminBookingRow,
  options: AdminBookingMapOptions,
  referenceNow?: Date
): BookingSession {
  const { booking: b, counselor: c, schedule: s, transaction: t, report } = row

  const timing = resolveSessionTimingAndStatus(
    {
      date: s?.date,
      startTime: s?.startTime,
      endTime: s?.endTime,
      status: b.status,
    },
    referenceNow
  )

  const counselorName = c?.fullName ? `${c.fullName}, ${c.title || ""}`.trim() : ""
  const timeRange = s
    ? `${s.startTime?.slice(0, 5)} - ${s.endTime?.slice(0, 5)}${options.timeRangeSuffix ?? ""}`
    : ""

  return {
    id: b.id,
    code: `SOL-${b.id.slice(0, 4).toUpperCase()}`,
    patientName: b.patientName,
    patientContact: b.patientPhone || b.patientEmail,
    counselorName,
    counselorType: c?.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
    date: s?.date ? String(s.date) : "",
    timeRange,
    hoursUntilSession: timing.hoursUntilSession,
    status: timing.status,
    isPast: timing.isPast,
    ...resolveZoomRoom(row, options.zoomAccounts),
    zoomJoinUrl: b.zoomJoinUrl || null,
    zoomAccountId: b.zoomAccountId || null,
    srqScore: 0,
    hasSuicidalThoughts: false,
    waiverSigned: !!b.waiverAcceptedAt,
    paymentMethod: t?.paymentMethod || null,
    paymentProvider: (t?.paymentProvider as BookingSession["paymentProvider"]) || undefined,
    referenceNumber: t?.referenceNumber || undefined,
    adminNotes: t?.adminNotes || undefined,
    amount: t?.netAmount != null ? Number(t.netAmount) : null,
    hasSessionReport: Boolean(report?.id),
    sessionReportId: report?.id || null,
  }
}
