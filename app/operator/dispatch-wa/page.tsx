import type { RawSearchParams } from "@/lib/data-table/search-params"
import { DispatchWaPage } from "@/app/admin/dispatch-wa/dispatch-page"

export const metadata = {
  title: "Dispatch WhatsApp | Solulu Operator",
}

export const dynamic = "force-dynamic"

export default function OperatorDispatchWaPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return <DispatchWaPage pathname="/operator/dispatch-wa" searchParams={searchParams} />
}
