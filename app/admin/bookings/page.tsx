import { getAuthenticatedAdmin } from "@/lib/auth/admin"
import { ErrorState } from "@/components/data-table/error-state"
import { parseTableParams, type RawSearchParams } from "@/lib/data-table/search-params"
import { BookingsClient } from "./BookingsClient"
import { listBookingsPage } from "./list-query"
import { bookingsTableConfig } from "./table-config"

export const metadata = {
  title: "Pengawasan Booking & Siklus Hidup | Solulu Admin",
  description: "Manajemen siklus hidup pemesanan konseling, filter slot, No-Show, dan WhatsApp laporan.",
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const state = parseTableParams(await searchParams, bookingsTableConfig)

  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <ErrorState title="Akses ditolak" message="Diperlukan role Admin untuk melihat daftar Booking." />
      </div>
    )
  }

  let data: Awaited<ReturnType<typeof listBookingsPage>>
  try {
    data = await listBookingsPage(state)
  } catch (err) {
    console.error("[admin/bookings] gagal memuat daftar Booking", err)
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <ErrorState message="Daftar Booking tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </div>
    )
  }

  return (
    <BookingsClient
      bookings={data.bookings}
      total={data.total}
      kpis={data.kpis}
      counselorOptions={data.counselors}
      state={state}
    />
  )
}
