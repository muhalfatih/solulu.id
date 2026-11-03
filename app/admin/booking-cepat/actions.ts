"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { counselors, schedules } from "@/db/schema"
import { createBookingCepat } from "@/lib/booking/booking-cepat"

/** Server action Booking Cepat: auth Admin dan validasi ada di `createBookingCepat`. */
export async function createBookingCepatAction(input: unknown) {
  try {
    const res = await createBookingCepat(input, {
      async describeSession({ scheduleId, counselorId }) {
        const [row] = await db
          .select({ date: schedules.date, startTime: schedules.startTime, endTime: schedules.endTime, name: counselors.fullName })
          .from(schedules)
          .innerJoin(counselors, eq(counselors.id, counselorId))
          .where(eq(schedules.id, scheduleId))
          .limit(1)
        return row
          ? { counselorName: row.name, date: String(row.date), startTime: row.startTime, endTime: row.endTime }
          : null
      },
    })
    if (res.success) {
      revalidatePath("/admin/booking-cepat")
      revalidatePath("/admin/bookings")
    }
    return res
  } catch (err) {
    console.error("[booking-cepat] gagal membuat booking", err)
    return { success: false as const, error: "Gagal membuat Booking Cepat. Coba lagi." }
  }
}
