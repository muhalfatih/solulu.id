import { FIXED_SLOTS } from "@/lib/operator/types"
import type { TableConfig } from "@/lib/data-table/search-params"

export const BOOKING_STATUS_VALUES = [
  "pending_payment",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
  "expired",
] as const

export const BOOKING_REPORT_VALUES = ["filled", "pending"] as const

export const BOOKING_SORT_KEYS = [
  "createdAt",
  "bookingCode",
  "patientName",
  "counselorName",
  "scheduleDate",
  "status",
] as const

export const BOOKINGS_PATH = "/admin/bookings"

/** Konfigurasi URL state daftar Booking admin (dipakai server page dan toolbar). */
export const bookingsTableConfig: TableConfig = {
  sortable: BOOKING_SORT_KEYS,
  defaultSort: { key: "createdAt", dir: "desc" },
  filters: {
    q: "text",
    status: BOOKING_STATUS_VALUES,
    report: BOOKING_REPORT_VALUES,
    slot: FIXED_SLOTS.map((s) => String(s.slotIndex)),
    counselor: "text",
  },
  pageSize: 10,
  maxPageSize: 50,
}
