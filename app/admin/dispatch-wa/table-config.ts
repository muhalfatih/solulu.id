import type { TableConfig } from "@/lib/data-table/search-params"
import { WA_TEMPLATE_KEYS } from "@/lib/whatsapp/templates"

export const DISPATCH_SENT_VALUES = ["pending", "sent"] as const

/** Konfigurasi URL state antrean Dispatch WhatsApp (dipakai di portal Admin dan Operator). */
export const dispatchTableConfig: TableConfig = {
  sortable: ["scheduleDate", "patientName", "bookingCode", "counselorName"],
  defaultSort: { key: "scheduleDate", dir: "asc" },
  filters: {
    q: "text",
    kind: WA_TEMPLATE_KEYS,
    sent: DISPATCH_SENT_VALUES,
  },
  pageSize: 10,
  maxPageSize: 50,
}
