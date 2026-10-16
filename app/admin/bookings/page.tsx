import * as React from "react"
import { getBookingsAdminAction } from "./actions"
import { BookingsClient } from "./BookingsClient"

export const metadata = {
  title: "Pengawasan Booking & Siklus Hidup | Solulu Admin",
  description: "Manajemen siklus hidup pemesanan konseling, filter slot, No-Show, dan WhatsApp laporan.",
}

export default async function AdminBookingsPage() {
  const res = await getBookingsAdminAction()
  const bookings = res.success && res.bookings ? res.bookings : []
  const counselors = res.success && res.counselors ? res.counselors : []

  return (
    <BookingsClient
      initialBookings={bookings}
      counselorOptions={counselors}
    />
  )
}
