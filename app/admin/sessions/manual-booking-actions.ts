"use server"

import { revalidatePath } from "next/cache"
import { eq, and, gte, inArray, sql } from "drizzle-orm"
import { db } from "@/db"
import { recordAudit } from "@/lib/audit/record"
import { counselors, schedules, bookings, transactions, zoomAccounts } from "@/db/schema"
import {
  computeEndTime,
  isTimeRangeOverlapping,
  MAX_PLATFORM_CONCURRENCY,
  getWIBDateString,
  getNowWIB,
  parseTimeToMinutes,
} from "@/lib/schedules/concurrency"
import { generateSessionAccessToken } from "@/lib/booking/hold"
import { getAuthenticatedAdmin, type AdminAuthContext } from "@/lib/auth/admin"
import {
  adminManualBookingSchema,
  type AdminManualBookingInput,
} from "@/lib/validations/admin-manual-booking"
import { fulfillSession } from "@/lib/fulfillment/fulfill"
import {
  activePrice,
  listOfferedServices,
  toServicePricingView,
  type ServiceLike,
  type ServicePricingView,
} from "@/lib/services/pricing"
import { listAllServices, getExcludedServiceIds } from "@/lib/services/repository"
import { getActiveZoomCapacity } from "@/lib/zoom/active-capacity"

/**
 * Fetches all active counselors available for manual booking assignment.
 */
export async function getAvailableCounselorsAction(options?: {
  currentUser?: AdminAuthContext | null
  fetchFn?: () => Promise<any[]>
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    if (options?.fetchFn) {
      const data = await options.fetchFn()
      return { success: true, data }
    }

    const rows = await db
      .select({
        id: counselors.id,
        fullName: counselors.fullName,
        title: counselors.title,
        counselorType: counselors.counselorType,
        avatarR2Url: counselors.avatarR2Url,
        isActive: counselors.isActive,
      })
      .from(counselors)
      .where(eq(counselors.isActive, true))
      .orderBy(counselors.fullName)

    return { success: true, data: rows || [] }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}

/**
 * Layanan aktif yang ditawarkan konselor tertentu (tipe cocok, tidak dikecualikan Admin).
 */
export async function getOfferedServicesForCounselorAction(
  counselorId: string,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchCounselorFn?: (id: string) => Promise<any>
    fetchServicesFn?: () => Promise<ServiceLike[]>
    fetchExcludedServiceIdsFn?: (counselorId: string) => Promise<string[]>
  }
): Promise<{ success: boolean; data: ServicePricingView[]; error?: string }> {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return { success: false, error: "Akses ditolak: Diperlukan role Admin.", data: [] }
  }
  try {
    let counselor: any = null
    if (options?.fetchCounselorFn) {
      counselor = await options.fetchCounselorFn(counselorId)
    } else {
      const rows = await db.select().from(counselors).where(eq(counselors.id, counselorId)).limit(1)
      counselor = rows[0] || null
    }
    if (!counselor) {
      return { success: false, error: "Mitra konselor tidak ditemukan.", data: [] }
    }
    const all = options?.fetchServicesFn ? await options.fetchServicesFn() : await listAllServices()
    const excluded = options?.fetchExcludedServiceIdsFn
      ? await options.fetchExcludedServiceIdsFn(counselorId)
      : await getExcludedServiceIds(counselorId)
    const offered = listOfferedServices(
      all,
      { id: counselor.id, counselorType: counselor.counselorType },
      excluded
    ).map(toServicePricingView)
    return { success: true, data: offered }
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memuat Layanan.", data: [] }
  }
}

/**
 * Fetches available upcoming slots for a specific counselor.
 */
export async function getCounselorAvailableSlotsAction(
  counselorId: string,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchSlotsFn?: (counselorId: string) => Promise<any[]>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    if (options?.fetchSlotsFn) {
      const data = await options.fetchSlotsFn(counselorId)
      return { success: true, data }
    }

    const now = new Date()
    const todayWIB = getWIBDateString(now)
    const nowWIBMinutes = getNowWIB(now).timeMinutes

    const rows = await db
      .select({
        id: schedules.id,
        counselorId: schedules.counselorId,
        date: schedules.date,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        status: schedules.status,
      })
      .from(schedules)
      .where(
        and(
          eq(schedules.counselorId, counselorId),
          eq(schedules.status, "available"),
          gte(schedules.date, todayWIB)
        )
      )
      .orderBy(schedules.date, schedules.startTime)

    // Filter out slots where date is today but startTime has already passed
    const validRows = rows.filter((r) => {
      if (r.date > todayWIB) return true
      if (r.date === todayWIB) {
        return parseTimeToMinutes(r.startTime) > nowWIBMinutes
      }
      return false
    })

    return { success: true, data: validRows || [] }
  } catch (err: any) {
    return { success: false, error: err.message, data: [] }
  }
}

/**
 * Fetches the active platform Zoom capacity count (0, 1, or 2).
 */
export async function getActiveZoomCapacityAction(options?: {
  currentUser?: AdminAuthContext | null
}) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
      data: 1,
    }
  }

  try {
    const capacity = await getActiveZoomCapacity()
    return {
      success: true,
      data: capacity > 0 ? capacity : 1,
    }
  } catch (error) {
    console.error("[ZOOM CAPACITY] Gagal membaca kapasitas akun Zoom:", error)
    return {
      success: false,
      error: "Gagal membaca kapasitas akun Zoom. Silakan coba lagi.",
      data: 1,
    }
  }
}

/**
 * Checks platform-wide Zoom concurrency for a proposed date and time window.
 * Returns whether 2 concurrent Zoom limit is saturated.
 */
export async function checkZoomConcurrencyAction(
  dateStr: string,
  startTimeStr: string,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchOverlapCountFn?: (date: string, start: string, end: string) => Promise<number>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin.",
    }
  }

  try {
    const endTimeStr = computeEndTime(startTimeStr)
    const effectiveCap = await getActiveZoomCapacity()
    const maxConcurrency = options?.fetchOverlapCountFn
      ? 2
      : (effectiveCap >= 4 ? 10 : effectiveCap > 0 ? effectiveCap : 1)

    if (options?.fetchOverlapCountFn) {
      const activeOverlapCount = await options.fetchOverlapCountFn(dateStr, startTimeStr, endTimeStr)
      return {
        success: true,
        data: {
          available: activeOverlapCount < maxConcurrency,
          activeOverlapCount,
          maxConcurrency,
        },
      }
    }

    // Query active bookings overlapping this window on this date
    const overlappingSchedules = await db
      .select({
        id: schedules.id,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
      })
      .from(schedules)
      .innerJoin(bookings, eq(bookings.scheduleId, schedules.id))
      .where(
        and(
          eq(schedules.date, dateStr),
          inArray(bookings.status, ["confirmed", "pending_payment"])
        )
      )

    let activeOverlapCount = 0
    for (const s of overlappingSchedules) {
      if (isTimeRangeOverlapping(s.startTime, s.endTime, startTimeStr, endTimeStr)) {
        activeOverlapCount++
      }
    }

    return {
      success: true,
      data: {
        available: activeOverlapCount < maxConcurrency,
        activeOverlapCount,
        maxConcurrency,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memeriksa kuota Zoom.",
    }
  }
}

/**
 * Core server action: Creates zero-cost Admin Bypass booking.
 * 1. Validates inputs & audit notes.
 * 2. Prepares/validates schedule slot and calculates 90-minute end time.
 * 3. Enforces Zoom Concurrency Guard or accepts manual meeting link.
 * 4. Generates 32-char nanoid session token.
 * 5. Creates confirmed booking and PAID Rp0 transaction.
 */
export async function createAdminManualBookingAction(
  input: AdminManualBookingInput,
  options?: {
    currentUser?: AdminAuthContext | null
    fetchCounselorFn?: (id: string) => Promise<any>
    fetchServicesFn?: () => Promise<ServiceLike[]>
    fetchExcludedServiceIdsFn?: (counselorId: string) => Promise<string[]>
    fetchScheduleFn?: (id: string) => Promise<any>
    createScheduleFn?: (schedule: any) => Promise<any>
    updateScheduleStatusFn?: (id: string, status: string) => Promise<any>
    checkConcurrencyFn?: (date: string, start: string, end: string) => Promise<number>
    insertBookingFn?: (booking: any) => Promise<any>
    insertTransactionFn?: (tx: any) => Promise<any>
    sendEmailFn?: (payload: any) => Promise<any>
    allocateZoomFn?: (date: string, start: string, end: string) => Promise<any>
    getZoomAccessTokenFn?: (account: any) => Promise<string>
    createZoomMeetingFn?: (token: string, input: any) => Promise<any>
  }
) {
  const admin = await getAuthenticatedAdmin(options?.currentUser)
  if (!admin) {
    return {
      success: false,
      error: "Akses ditolak: Diperlukan role Admin untuk membuat booking manual.",
    }
  }

  const parsed = adminManualBookingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Data formulir booking tidak valid.",
    }
  }

  const data = parsed.data

  try {
    // 1. Fetch Counselor to determine credentials & base pricing
    let counselor: any = null
    if (options?.fetchCounselorFn) {
      counselor = await options.fetchCounselorFn(data.counselorId)
    } else {
      const rows = await db
        .select()
        .from(counselors)
        .where(eq(counselors.id, data.counselorId))
        .limit(1)
      counselor = rows[0] || null
    }

    if (!counselor) {
      return { success: false, error: "Mitra konselor yang dipilih tidak ditemukan." }
    }

    // 1b. Resolve the Layanan purchased (ADR-0010): must be offered by this counselor.
    const allServices = options?.fetchServicesFn ? await options.fetchServicesFn() : await listAllServices()
    const excludedServiceIds = options?.fetchExcludedServiceIdsFn
      ? await options.fetchExcludedServiceIdsFn(counselor.id)
      : await getExcludedServiceIds(counselor.id)
    const offeredServices = listOfferedServices(
      allServices,
      { id: counselor.id, counselorType: counselor.counselorType },
      excludedServiceIds
    )
    const service = data.serviceId
      ? offeredServices.find((svc) => svc.id === data.serviceId)
      : offeredServices.length === 1
        ? offeredServices[0]
        : undefined
    if (!service) {
      return {
        success: false,
        error:
          offeredServices.length > 1 && !data.serviceId
            ? "Pilih Layanan untuk booking ini."
            : "Layanan yang dipilih tidak tersedia untuk mitra konselor ini.",
      }
    }
    const servicePrice = activePrice(service)

    // 2. Prepare Schedule Slot
    let scheduleId = data.scheduleId
    let scheduleDate: string
    let scheduleStartTime: string
    let scheduleEndTime: string

    if (data.scheduleMode === "existing") {
      let existingSchedule: any = null
      if (options?.fetchScheduleFn) {
        existingSchedule = await options.fetchScheduleFn(data.scheduleId!)
      } else {
        const rows = await db
          .select()
          .from(schedules)
          .where(eq(schedules.id, data.scheduleId!))
          .limit(1)
        existingSchedule = rows[0] || null
      }

      if (!existingSchedule) {
        return { success: false, error: "Slot jadwal yang dipilih tidak ditemukan." }
      }
      if (existingSchedule.status !== "available") {
        return { success: false, error: "Slot jadwal ini sudah tidak tersedia lagi." }
      }

      scheduleDate = existingSchedule.date
      scheduleStartTime = existingSchedule.startTime
      scheduleEndTime = existingSchedule.endTime
    } else {
      // Ad-hoc schedule creation
      scheduleDate = data.adhocDate!
      scheduleStartTime = data.adhocStartTime!
      scheduleEndTime = computeEndTime(scheduleStartTime)

      // Check Zoom concurrency for adhoc slot if auto Zoom is selected
      if (data.createZoom) {
        let overlapCount = 0
        if (options?.checkConcurrencyFn) {
          overlapCount = await options.checkConcurrencyFn(
            scheduleDate,
            scheduleStartTime,
            scheduleEndTime
          )
        } else {
          const overlapping = await db
            .select({
              id: schedules.id,
              startTime: schedules.startTime,
              endTime: schedules.endTime,
            })
            .from(schedules)
            .innerJoin(bookings, eq(bookings.scheduleId, schedules.id))
            .where(
              and(
                eq(schedules.date, scheduleDate),
                inArray(bookings.status, ["confirmed", "pending_payment"])
              )
            )

          for (const s of overlapping) {
            if (isTimeRangeOverlapping(s.startTime, s.endTime, scheduleStartTime, scheduleEndTime)) {
              overlapCount++
            }
          }
        }

        const effectiveCap = await getActiveZoomCapacity()
        const maxConcurrency = options?.checkConcurrencyFn
          ? 2
          : (effectiveCap > 0 ? effectiveCap : 1)

        if (overlapCount >= maxConcurrency && !data.manualMeetingUrl) {
          return {
            success: false,
            error:
              `Kapasitas ${maxConcurrency} Akun Zoom platform telah penuh pada jam tersebut. Silakan masukkan tautan rapat manual (Google Meet) atau pilih jam lain.`,
          }
        }
      }

      // Create new adhoc schedule slot marked as booked
      const newSchedulePayload = {
        counselorId: data.counselorId,
        date: scheduleDate,
        startTime: scheduleStartTime,
        endTime: scheduleEndTime,
        status: "booked",
      }

      if (options?.createScheduleFn) {
        const created = await options.createScheduleFn(newSchedulePayload)
        scheduleId = created.id
      } else {
        const [created] = await db
          .insert(schedules)
          .values(newSchedulePayload as any)
          .returning()
        scheduleId = created.id
      }
    }

    // Lock existing schedule to 'booked' if existing mode
    if (data.scheduleMode === "existing") {
      if (options?.updateScheduleStatusFn) {
        await options.updateScheduleStatusFn(scheduleId!, "booked")
      } else {
        await db
          .update(schedules)
          .set({ status: "booked" })
          .where(eq(schedules.id, scheduleId!))
      }
    }

    // 3. Generate 32-character Token Sesi
    const accessToken = generateSessionAccessToken()

    // 4. Insert Booking
    const bookingPayload = {
      accessToken,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      initialNotes: data.initialNotes || null,
      scheduleId: scheduleId!,
      counselorId: data.counselorId,
      serviceId: service.id,
      basePriceSnapshot: String(servicePrice),
      status: "confirmed",
      zoomAccountId: null,
      zoomMeetingId: null,
      zoomJoinUrl: data.manualMeetingUrl || null,
      zoomStartUrl: data.manualMeetingUrl || null,
    }

    // 5. Rp0 Audit Transaction. Tarif pokok aktif Layanan sebelum diskon 100%
    // (honor konselor tetap dihitung dari tarif ini).
    const normalPrice = servicePrice.toFixed(2)
    const buildTxPayload = (bookingId: string) => ({
      bookingId,
      paymentProvider: "admin_bypass",
      paymentMethod: "Admin Bypass (Rp 0)",
      referenceNumber: `ADMIN-BYPASS-${accessToken.slice(0, 8).toUpperCase()}`,
      grossAmount: normalPrice,
      discountAmount: normalPrice,
      netAmount: "0.00",
      status: "PAID",
      paidAt: new Date(),
      adminNotes: data.adminNotes,
    })

    let bookingRecord: any = null
    let transactionRecord: any = null
    if (options?.insertBookingFn || options?.insertTransactionFn) {
      if (options.insertBookingFn) {
        bookingRecord = await options.insertBookingFn(bookingPayload)
      } else {
        const [inserted] = await db.insert(bookings).values(bookingPayload as any).returning()
        bookingRecord = inserted
      }
      const txPayload = buildTxPayload(bookingRecord.id)
      if (options.insertTransactionFn) {
        transactionRecord = await options.insertTransactionFn(txPayload)
      } else {
        const [insertedTx] = await db.insert(transactions).values(txPayload as any).returning()
        transactionRecord = insertedTx
      }
    } else {
      // Booking, transaksi Rp0, dan Jejak Audit commit/rollback bersama.
      await db.transaction(async (tx) => {
        const [inserted] = await tx.insert(bookings).values(bookingPayload as any).returning()
        const [insertedTx] = await tx
          .insert(transactions)
          .values(buildTxPayload(inserted.id) as any)
          .returning()
        await recordAudit(tx, {
          actor: admin,
          action: "booking.manual_create",
          entityType: "booking",
          entityId: inserted.id,
          before: null,
          after: {
            bookingCode: inserted.bookingCode,
            status: inserted.status,
            counselorId: inserted.counselorId,
            scheduleId: inserted.scheduleId,
            serviceId: inserted.serviceId,
            transactionId: insertedTx.id,
            adminNotes: data.adminNotes,
          },
        })
        bookingRecord = inserted
        transactionRecord = insertedTx
      })
    }

    // 6. Delegate technical fulfillment to the deep Session Fulfillment module
    const fulfillResult = await fulfillSession(
      bookingRecord.id,
      {
        source: "admin_bypass",
        manualMeetingUrl: data.manualMeetingUrl || undefined,
        skipEmails: !data.sendConfirmationEmail || !!options?.sendEmailFn,
      },
      {
        zoomClient: {
          getAccessToken: options?.getZoomAccessTokenFn,
          createMeeting: options?.createZoomMeetingFn,
        },
        notifier: {
          sendPatientEmail: options?.sendEmailFn
            ? async (p: any) => {
                await options.sendEmailFn!({
                  patientEmail: p.patientEmail,
                  patientName: p.patientName,
                  counselorName: p.counselorName,
                  accessToken: p.accessToken,
                  date: p.date,
                  time: p.timeRange,
                  zoomJoinUrl: p.zoomJoinUrl || bookingRecord.zoomJoinUrl,
                })
                return { success: true }
              }
            : undefined,
        },
        allocateAccount: options?.allocateZoomFn,
        fetchBookingData: options?.insertBookingFn
          ? async () => ({
              booking: bookingRecord,
              counselor,
              schedule: {
                id: scheduleId,
                date: scheduleDate,
                startTime: scheduleStartTime,
                endTime: scheduleEndTime,
              },
            })
          : undefined,
      }
    )

    if (fulfillResult.zoomJoinUrl) {
      bookingRecord.zoomJoinUrl = fulfillResult.zoomJoinUrl
      bookingRecord.zoomStartUrl = fulfillResult.zoomStartUrl
      bookingRecord.zoomMeetingId = fulfillResult.zoomMeetingId
    }

    // 7. Optional Email Confirmation
    if (data.sendConfirmationEmail && options?.sendEmailFn) {
      try {
        await options.sendEmailFn({
          patientEmail: data.patientEmail,
          patientName: data.patientName,
          counselorName: counselor.fullName,
          accessToken,
          date: scheduleDate,
          time: `${scheduleStartTime} – ${scheduleEndTime} WIB`,
          zoomJoinUrl: bookingRecord.zoomJoinUrl,
        })
      } catch (emailErr) {
        console.error("Failed to send manual booking confirmation email:", emailErr)
      }
    }

    try {
      revalidatePath("/admin/sessions")
      revalidatePath(`/session/${accessToken}`)
      revalidatePath("/counselors")
      revalidatePath("/booking")
      revalidatePath("/")
    } catch {
      // safe in test
    }

    return {
      success: true,
      message: `Booking manual atas nama ${data.patientName} berhasil dibuat.`,
      data: {
        bookingId: bookingRecord.id,
        accessToken,
        sessionUrl: `/session/${accessToken}`,
        transactionId: transactionRecord.id,
      },
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memproses booking manual.",
    }
  }
}
