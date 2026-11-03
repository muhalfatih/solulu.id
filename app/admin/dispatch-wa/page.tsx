import type { RawSearchParams } from "@/lib/data-table/search-params"
import { DispatchWaPage } from "./dispatch-page"

export const metadata = {
  title: "Dispatch WhatsApp | Solulu Admin",
  description: "Antrean Booking yang perlu dikirimi pesan WhatsApp dengan template yang sudah dirender.",
}

export const dynamic = "force-dynamic"

export default function AdminDispatchWaPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return <DispatchWaPage pathname="/admin/dispatch-wa" searchParams={searchParams} />
}
