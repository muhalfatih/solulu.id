import type { TableConfig } from "@/lib/data-table/search-params"

export const BOOKING_CEPAT_PATH = "/admin/booking-cepat"

export const bookingCepatTableConfig: TableConfig = {
  sortable: ["createdAt", "patientName", "scheduleDate", "status"],
  defaultSort: { key: "createdAt", dir: "desc" },
  filters: {
    q: "text",
    status: ["pending_payment", "confirmed", "completed", "expired", "cancelled", "no_show"],
  },
  pageSize: 10,
  maxPageSize: 50,
}
