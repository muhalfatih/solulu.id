import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { bookings, services } from "@/db/schema"
import { planOvertimeCorrection, type OvertimeCorrectionPlan } from "@/lib/session/overtime"

/**
 * Menerapkan koreksi blok Perpanjangan Sesi dari Laporan Sesi ke booking milik konselor.
 * Tarif diambil dari Layanan yang dibeli klien (ADR-0010).
 */
export async function applyOvertimeCorrection(
  bookingId: string,
  counselorId: string,
  blocks: number,
  dbConn: typeof db = db
): Promise<OvertimeCorrectionPlan> {
  const rows = await dbConn
    .select({ booking: bookings, service: services })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.counselorId, counselorId)))
    .limit(1)

  if (!rows.length) {
    return { ok: false, error: "Sesi konseling tidak ditemukan atau bukan milik Anda." }
  }

  const { booking, service } = rows[0]
  const plan = planOvertimeCorrection({
    current: booking,
    blocks,
    ratePer30Min: service.overtimeRatePer30Min,
  })

  if (plan.ok && plan.update) {
    await dbConn.update(bookings).set(plan.update).where(eq(bookings.id, bookingId))
  }
  return plan
}
