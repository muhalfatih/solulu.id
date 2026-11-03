import { ErrorState } from "@/components/data-table/error-state"
import { requireStaffUser } from "@/lib/auth/staff"
import { OPERATOR_PORTAL_ROLES } from "@/lib/auth/staff-role"
import { parseTableParams, type RawSearchParams } from "@/lib/data-table/search-params"
import { countBookingsPendingWhatsAppDispatch, queryDispatchQueue } from "@/lib/whatsapp/queue"
import { isWaTemplateKey } from "@/lib/whatsapp/templates"
import { DispatchWaClient } from "./DispatchWaClient"
import { dispatchTableConfig } from "./table-config"

const wrap = "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"

/** Server component bersama untuk /admin/dispatch-wa dan /operator/dispatch-wa. */
export async function DispatchWaPage({
  pathname,
  searchParams,
}: {
  pathname: string
  searchParams: Promise<RawSearchParams>
}) {
  const state = parseTableParams(await searchParams, dispatchTableConfig)

  const user = await requireStaffUser(undefined, OPERATOR_PORTAL_ROLES)
  if (!user) {
    return (
      <div className={wrap}>
        <ErrorState title="Akses ditolak" message="Diperlukan role Operator atau Admin untuk membuka Dispatch WhatsApp." />
      </div>
    )
  }

  try {
    const kind = state.filters.kind
    const [page, pendingTotal] = await Promise.all([
      queryDispatchQueue({
        filter: {
          q: state.filters.q,
          kind: kind && isWaTemplateKey(kind) ? kind : undefined,
          sent: state.filters.sent === "pending" || state.filters.sent === "sent" ? state.filters.sent : undefined,
        },
        sort: state.sort,
        limit: state.pageSize,
        offset: (state.page - 1) * state.pageSize,
      }),
      countBookingsPendingWhatsAppDispatch(),
    ])
    return (
      <DispatchWaClient
        rows={page.rows}
        total={page.total}
        pendingTotal={pendingTotal}
        state={state}
        pathname={pathname}
      />
    )
  } catch (err) {
    console.error("[dispatch-wa] gagal memuat antrean", err)
    return (
      <div className={wrap}>
        <ErrorState message="Antrean dispatch tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </div>
    )
  }
}
