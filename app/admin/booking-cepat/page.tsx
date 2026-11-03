import { getAuthenticatedAdmin } from "@/app/admin/counselors/actions"
import { ErrorState } from "@/components/data-table/error-state"
import { parseTableParams, type RawSearchParams } from "@/lib/data-table/search-params"
import { listBookingCepat } from "@/lib/booking/booking-cepat-list"
import { getAvailableCounselorsAction } from "@/app/admin/sessions/manual-booking-actions"
import { BookingCepatClient } from "./BookingCepatClient"
import { BOOKING_CEPAT_PATH, bookingCepatTableConfig } from "./table-config"

export const metadata = {
  title: "Booking Cepat | Solulu Admin",
  description: "Buat booking untuk klien yang menghubungi lewat WhatsApp: tautan Xendit, bukti transfer, atau Rp 0.",
}

export const dynamic = "force-dynamic"

const wrap = "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"

export default async function BookingCepatPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const state = parseTableParams(await searchParams, bookingCepatTableConfig)

  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    return (
      <div className={wrap}>
        <ErrorState title="Akses ditolak" message="Diperlukan role Admin untuk Booking Cepat." />
      </div>
    )
  }

  let data: { list: Awaited<ReturnType<typeof listBookingCepat>>; counselors: { id: string; fullName: string }[] }
  try {
    const [list, counselorRes] = await Promise.all([
      listBookingCepat({
        q: state.filters.q,
        status: state.filters.status,
        sort: state.sort,
        limit: state.pageSize,
        offset: (state.page - 1) * state.pageSize,
      }),
      getAvailableCounselorsAction(),
    ])
    const counselors = (counselorRes.success ? (counselorRes.data ?? []) : []).map(
      (c: { id: string; fullName: string }) => ({ id: c.id, fullName: c.fullName })
    )
    data = { list, counselors }
  } catch (err) {
    console.error("[booking-cepat] gagal memuat halaman", err)
    return (
      <div className={wrap}>
        <ErrorState message="Halaman Booking Cepat tidak dapat dimuat saat ini. Muat ulang atau coba lagi nanti." />
      </div>
    )
  }

  return (
    <BookingCepatClient
      rows={data.list.rows}
      total={data.list.total}
      counselors={data.counselors}
      state={state}
      pathname={BOOKING_CEPAT_PATH}
    />
  )
}
