import { eq, and, sql } from "drizzle-orm"
import { db } from "@/db"
import {
  counselors,
  schedules,
  platformPricing,
  vouchers,
  bookings,
  transactions,
  screenings,
} from "@/db/schema"
import {
  formatTimeRange,
  countOverlappingActiveSessions,
  MAX_PLATFORM_CONCURRENCY,
} from "@/lib/schedules/concurrency"
import {
  validateVoucherSchema,
  createGuestBookingSchema,
  type ValidateVoucherInput,
  type CreateGuestBookingInput,
} from "@/lib/validations/booking"
import {
  evaluateVoucherEligibility,
  type VoucherRecord,
} from "@/lib/booking/voucher"
import {
  computeHoldExpiry,
  generateSessionAccessToken,
  generateReferenceNumber,
  isHoldExpired,
} from "@/lib/booking/hold"
import { createXenditInvoice, getXenditInvoice } from "@/lib/xendit"
import { dispatchFulfillmentJob } from "@/lib/fulfillment/qstash"
import { getStoreCounselorById } from "@/lib/counselor/registry"

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export const DEMO_COUNSELORS: Record<string, any> = {
  "c-1": {
    id: "c-1",
    fullName: "Sarah Annisa, M.Psi., Psikolog",
    title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
    counselorType: "psychologist",
    bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout).",
    specializations: ["Kecemasan", "Depresi", "Trauma", "Burnout"],
    avatarR2Url: null,
    isActive: true,
  },
  "c-2": {
    id: "c-2",
    fullName: "Rian Hidayat, S.Psi",
    title: "Konselor Sebaya Senior • Tersertifikasi Konseling Pemuda",
    counselorType: "peer",
    bio: "Berpengalaman mendampingi mahasiswa dan pekerja muda dalam menghadapi tekanan perkuliahan, quarter-life crisis, serta dinamika relasi asmara dan keluarga.",
    specializations: ["Stres Kuliah", "Quarter-Life Crisis", "Relasi Asmara", "Karir"],
    avatarR2Url: null,
    isActive: true,
  },
  "c-3": {
    id: "c-3",
    fullName: "Dr. Nadia Larasati, M.Psi",
    title: "Psikolog Klinis Dewasa • No. STR: 1902837482999",
    counselorType: "psychologist",
    bio: "Pendekatan berbasis bukti ilmiah untuk penanganan depresi ringan hingga sedang, pemulihan luka masa kecil, serta peningkatan self-esteem dan penerimaan diri.",
    specializations: ["Depresi Ringan-Sedang", "Insecurity", "Penerimaan Diri", "Regulasi Emosi"],
    avatarR2Url: null,
    isActive: true,
  },
  "c-4": {
    id: "c-4",
    fullName: "Nabila Safitri, S.Psi",
    title: "Konselor Sebaya Remaja • Fasilitator Komunitas Sejiwa",
    counselorType: "peer",
    bio: "Fasilitator pendampingan emosional remaja dan dewasa awal dengan pendekatan empatik, mendengarkan aktif tanpa penghakiman, dan panduan regulasi emosi sehat.",
    specializations: ["Manajemen Emosi", "Keluarga", "Kecemasan Sosial", "Self-Acceptance"],
    avatarR2Url: null,
    isActive: true,
  },
}

export const DEMO_SCHEDULES: Record<string, any> = {
  "s-101": { id: "s-101", counselorId: "c-1", date: "2026-09-29", startTime: "09:00", endTime: "10:30", status: "available" },
  "s-102": { id: "s-102", counselorId: "c-1", date: "2026-09-29", startTime: "19:00", endTime: "20:30", status: "available" },
  "s-103": { id: "s-103", counselorId: "c-1", date: "2026-09-30", startTime: "13:30", endTime: "15:00", status: "available" },
  "s-201": { id: "s-201", counselorId: "c-2", date: "2026-09-29", startTime: "11:00", endTime: "12:30", status: "available" },
  "s-202": { id: "s-202", counselorId: "c-2", date: "2026-09-29", startTime: "15:30", endTime: "17:00", status: "available" },
  "s-203": { id: "s-203", counselorId: "c-2", date: "2026-09-30", startTime: "19:00", endTime: "20:30", status: "available" },
  "s-301": { id: "s-301", counselorId: "c-3", date: "2026-09-29", startTime: "10:00", endTime: "11:30", status: "available" },
  "s-302": { id: "s-302", counselorId: "c-3", date: "2026-09-30", startTime: "14:00", endTime: "15:30", status: "available" },
  "s-401": { id: "s-401", counselorId: "c-4", date: "2026-09-29", startTime: "13:30", endTime: "15:00", status: "available" },
  "s-402": { id: "s-402", counselorId: "c-4", date: "2026-09-30", startTime: "16:00", endTime: "17:30", status: "available" },
}

export const DEMO_BOOKINGS_CACHE = new Map<string, any>()

export interface BookingContextData {
  counselor: {
    id: string
    fullName: string
    title: string
    counselorType: "peer" | "psychologist"
    counselorTypeDisplay: string
    bio: string
    avatarR2Url: string | null
    specializations: string[]
  }
  schedule: {
    id: string
    date: string
    startTime: string
    endTime: string
    timeRange: string
    isAvailable: boolean
  }
  pricing: {
    basePrice: number
    promoPrice: number | null
    isSaleActive: boolean
    allowVoucher: boolean
    grossAmount: number
    grossAmountFormatted: string
    originalPriceFormatted?: string
  }
  screening?: {
    id: string
    totalScore: number
    hasSuicidalThoughts: boolean
    recommendedType: "peer" | "psychologist"
  } | null
}

export interface BookingDependencies {
  getCounselor?: (counselorId: string) => Promise<any>
  getSchedule?: (scheduleId: string) => Promise<any>
  getPricing?: (counselorType: "peer" | "psychologist") => Promise<any>
  getScreening?: (screeningId: string) => Promise<any>
  getVoucher?: (code: string) => Promise<any>
  getActiveSessionsOnDate?: (date: string, excludeScheduleId?: string) => Promise<{ startTime: string; endTime: string }[]>
  reserveSlotAndCreateBooking?: (params: {
    scheduleId: string
    counselorId: string
    screeningId?: string | null
    patientName: string
    patientEmail: string
    patientPhone: string
    initialNotes?: string | null
    accessToken: string
    reservedUntil: Date
    grossAmount: number
    discountAmount: number
    netAmount: number
    voucherId?: string | null
    paymentProvider: string
    paymentMethod?: string | null
    referenceNumber: string
    appUrl: string
  }) => Promise<{ bookingId: string; transactionId: string }>
  createInvoice?: typeof createXenditInvoice
  now?: () => Date
}

/**
 * Validates voucher code against platform pricing policy and quotas.
 */
export async function executeValidateVoucher(
  input: ValidateVoucherInput,
  deps?: {
    getPricing?: (type: "peer" | "psychologist") => Promise<any>
    getVoucher?: (code: string) => Promise<VoucherRecord | null>
    now?: () => Date
  }
): Promise<ActionResponse<{
  code: string
  discountType: string
  discountValue: number
  discountAmount: number
  netAmount: number
  discountFormatted: string
  netAmountFormatted: string
  message: string
}>> {
  try {
    const parseResult = validateVoucherSchema.safeParse(input)
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Input voucher tidak valid",
      }
    }

    const { code, counselorType, grossAmount } = parseResult.data

    let pricingRecord: any
    if (deps?.getPricing) {
      pricingRecord = await deps.getPricing(counselorType)
    } else {
      const records = await db
        .select()
        .from(platformPricing)
        .where(eq(platformPricing.counselorType, counselorType))
        .limit(1)
      pricingRecord = records[0]
    }

    const allowVoucher = pricingRecord ? pricingRecord.allowVoucher : true

    let voucherRecord: VoucherRecord | null = null
    if (deps?.getVoucher) {
      voucherRecord = await deps.getVoucher(code)
    } else {
      const records = await db
        .select()
        .from(vouchers)
        .where(eq(vouchers.code, code))
        .limit(1)
      if (records.length > 0) {
        voucherRecord = {
          id: records[0].id,
          code: records[0].code,
          discountType: records[0].discountType,
          discountValue: records[0].discountValue,
          quota: records[0].quota,
          usedCount: records[0].usedCount,
          expiresAt: records[0].expiresAt,
          isActive: records[0].isActive,
        }
      }
    }

    const evaluation = evaluateVoucherEligibility({
      voucher: voucherRecord,
      allowVoucher,
      grossAmount,
      now: deps?.now ? deps.now() : new Date(),
    })

    if (!evaluation.eligible) {
      return {
        success: false,
        error: evaluation.reason || "Voucher tidak dapat digunakan",
      }
    }

    const discountFormatted = formatRupiah(evaluation.discountAmount)
    const netAmountFormatted = formatRupiah(evaluation.netAmount)

    return {
      success: true,
      data: {
        code,
        discountType: voucherRecord!.discountType,
        discountValue: Number(voucherRecord!.discountValue),
        discountAmount: evaluation.discountAmount,
        netAmount: evaluation.netAmount,
        discountFormatted,
        netAmountFormatted,
        message: `Voucher berhasil diterapkan! Hemat ${discountFormatted}`,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat memvalidasi voucher",
    }
  }
}

/**
 * Loads counselor, schedule, dynamic pricing, and optional screening context for checkout.
 */
export async function executeGetBookingContext(
  {
    scheduleId,
    counselorId,
    screeningId,
  }: {
    scheduleId: string
    counselorId: string
    screeningId?: string | null
  },
  deps?: BookingDependencies
): Promise<ActionResponse<BookingContextData>> {
  try {
    const now = deps?.now ? deps.now() : new Date()

    let counselor: any
    if (deps?.getCounselor) {
      counselor = await deps.getCounselor(counselorId)
    } else if (DEMO_COUNSELORS[counselorId]) {
      counselor = DEMO_COUNSELORS[counselorId]
    } else {
      try {
        const rows = await db
          .select()
          .from(counselors)
          .where(eq(counselors.id, counselorId))
          .limit(1)
        counselor = rows[0]
      } catch {
        counselor = DEMO_COUNSELORS[counselorId]
      }
    }

    if (!counselor) {
      counselor = getStoreCounselorById(counselorId)
    }

    if (!counselor || !counselor.isActive) {
      return {
        success: false,
        error: "Mitra Konselor tidak ditemukan atau sedang tidak aktif",
      }
    }

    let schedule: any
    if (deps?.getSchedule) {
      schedule = await deps.getSchedule(scheduleId)
    } else if (DEMO_SCHEDULES[scheduleId]) {
      schedule = DEMO_SCHEDULES[scheduleId]
    } else {
      try {
        const rows = await db
          .select()
          .from(schedules)
          .where(eq(schedules.id, scheduleId))
          .limit(1)
        schedule = rows[0]
      } catch {
        schedule = DEMO_SCHEDULES[scheduleId]
      }
    }

    if (!schedule) {
      return {
        success: false,
        error: "Slot jadwal tidak ditemukan",
      }
    }

    const isExpiredHold = schedule.status === "reserved" && isHoldExpired(schedule.reservedUntil, now)
    const isAvailable = schedule.status === "available" || isExpiredHold

    let pricingRow: any
    if (deps?.getPricing) {
      pricingRow = await deps.getPricing(counselor.counselorType)
    } else {
      const rows = await db
        .select()
        .from(platformPricing)
        .where(eq(platformPricing.counselorType, counselor.counselorType))
        .limit(1)
      pricingRow = rows[0]
    }

    const basePrice = pricingRow ? Number(pricingRow.basePrice) : 50000
    const promoPrice = pricingRow?.promoPrice ? Number(pricingRow.promoPrice) : null
    const isSaleActive = pricingRow?.isSaleActive ?? false
    const allowVoucher = pricingRow?.allowVoucher ?? true

    const grossAmount = isSaleActive && promoPrice !== null ? promoPrice : basePrice

    let screening: any = null
    if (screeningId) {
      if (deps?.getScreening) {
        screening = await deps.getScreening(screeningId)
      } else {
        const rows = await db
          .select()
          .from(screenings)
          .where(eq(screenings.id, screeningId))
          .limit(1)
        screening = rows[0]
      }
    }

    const timeRange = formatTimeRange(schedule.startTime, schedule.endTime)

    return {
      success: true,
      data: {
        counselor: {
          id: counselor.id,
          fullName: counselor.fullName,
          title: counselor.title,
          counselorType: counselor.counselorType,
          counselorTypeDisplay:
            counselor.counselorType === "psychologist"
              ? "Psikolog Klinis"
              : "Konselor Sebaya",
          bio: counselor.bio,
          avatarR2Url: counselor.avatarR2Url,
          specializations: counselor.specializations || [],
        },
        schedule: {
          id: schedule.id,
          date: schedule.date,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timeRange,
          isAvailable,
        },
        pricing: {
          basePrice,
          promoPrice,
          isSaleActive,
          allowVoucher,
          grossAmount,
          grossAmountFormatted: formatRupiah(grossAmount),
          originalPriceFormatted: isSaleActive ? formatRupiah(basePrice) : undefined,
        },
        screening: screening
          ? {
              id: screening.id,
              totalScore: screening.totalScore,
              hasSuicidalThoughts: screening.hasSuicidalThoughts,
              recommendedType: screening.recommendedType,
            }
          : null,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memuat detail pemesanan",
    }
  }
}

/**
 * Creates a guest booking with atomic slot reservation and checkout dispatch.
 */
export async function executeCreateGuestBooking(
  input: CreateGuestBookingInput,
  deps?: BookingDependencies
): Promise<ActionResponse<{
  bookingId: string
  accessToken: string
  paymentProvider: "xendit" | "manual"
  paymentUrl?: string
  redirectUrl?: string
  referenceNumber: string
  netAmount: number
  netAmountFormatted: string
}>> {
  try {
    const parseResult = createGuestBookingSchema.safeParse(input)
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Data formulir pemesanan tidak valid",
      }
    }

    const data = parseResult.data
    const now = deps?.now ? deps.now() : new Date()

    let schedule: any
    if (deps?.getSchedule) {
      schedule = await deps.getSchedule(data.scheduleId)
    } else if (DEMO_SCHEDULES[data.scheduleId]) {
      schedule = DEMO_SCHEDULES[data.scheduleId]
    } else {
      try {
        const rows = await db
          .select()
          .from(schedules)
          .where(eq(schedules.id, data.scheduleId))
          .limit(1)
        schedule = rows[0]
      } catch {
        schedule = DEMO_SCHEDULES[data.scheduleId]
      }
    }

    if (!schedule) {
      return { success: false, error: "Slot jadwal tidak ditemukan" }
    }

    if (schedule.status === "booked") {
      return {
        success: false,
        error: "Slot jadwal ini sudah dipesan oleh pasien lain. Silakan pilih waktu lain.",
      }
    }

    if (schedule.status === "cancelled") {
      return {
        success: false,
        error: "Slot jadwal ini telah dibatalkan oleh konselor.",
      }
    }

    if (schedule.status === "reserved" && !isHoldExpired(schedule.reservedUntil, now)) {
      return {
        success: false,
        error: "Slot jadwal ini sedang dalam proses pembayaran oleh pasien lain. Coba beberapa menit lagi.",
      }
    }

    let counselor: any
    if (deps?.getCounselor) {
      counselor = await deps.getCounselor(data.counselorId)
    } else if (DEMO_COUNSELORS[data.counselorId]) {
      counselor = DEMO_COUNSELORS[data.counselorId]
    } else {
      try {
        const rows = await db
          .select()
          .from(counselors)
          .where(eq(counselors.id, data.counselorId))
          .limit(1)
        counselor = rows[0]
      } catch {
        counselor = DEMO_COUNSELORS[data.counselorId]
      }
    }

    if (!counselor) {
      counselor = getStoreCounselorById(data.counselorId)
    }

    if (!counselor || !counselor.isActive) {
      return { success: false, error: "Konselor tidak ditemukan atau sedang tidak aktif" }
    }

    let activeSessionsOnDate: { startTime: string; endTime: string }[] = []
    if (deps?.getActiveSessionsOnDate) {
      activeSessionsOnDate = await deps.getActiveSessionsOnDate(schedule.date, schedule.id)
    } else {
      const activeRows = await db
        .select({
          startTime: schedules.startTime,
          endTime: schedules.endTime,
          status: schedules.status,
          reservedUntil: schedules.reservedUntil,
        })
        .from(schedules)
        .where(
          and(
            eq(schedules.date, schedule.date),
            sql`(${schedules.status} = 'booked' OR (${schedules.status} = 'reserved' AND ${schedules.reservedUntil} > ${now.toISOString()}))`,
            sql`${schedules.id} != ${schedule.id}`
          )
        )
      activeSessionsOnDate = activeRows
    }

    const overlapCount = countOverlappingActiveSessions(
      activeSessionsOnDate,
      schedule.startTime,
      schedule.endTime
    )

    if (overlapCount >= MAX_PLATFORM_CONCURRENCY) {
      return {
        success: false,
        error: "Kapasitas ruang Zoom penuh pada jam ini (maksimal 2 sesi bersamaan). Silakan pilih slot lain.",
      }
    }

    let pricingRow: any
    if (deps?.getPricing) {
      pricingRow = await deps.getPricing(counselor.counselorType)
    } else {
      const rows = await db
        .select()
        .from(platformPricing)
        .where(eq(platformPricing.counselorType, counselor.counselorType))
        .limit(1)
      pricingRow = rows[0]
    }

    const basePrice = pricingRow ? Number(pricingRow.basePrice) : 50000
    const promoPrice = pricingRow?.promoPrice ? Number(pricingRow.promoPrice) : null
    const isSaleActive = pricingRow?.isSaleActive ?? false
    const allowVoucher = pricingRow?.allowVoucher ?? true

    const grossAmount = isSaleActive && promoPrice !== null ? promoPrice : basePrice
    let discountAmount = 0
    let netAmount = grossAmount
    let appliedVoucher: VoucherRecord | null = null

    if (data.voucherCode) {
      let voucherRecord: VoucherRecord | null = null
      if (deps?.getVoucher) {
        voucherRecord = await deps.getVoucher(data.voucherCode)
      } else {
        const rows = await db
          .select()
          .from(vouchers)
          .where(eq(vouchers.code, data.voucherCode))
          .limit(1)
        if (rows.length > 0) {
          voucherRecord = {
            id: rows[0].id,
            code: rows[0].code,
            discountType: rows[0].discountType,
            discountValue: rows[0].discountValue,
            quota: rows[0].quota,
            usedCount: rows[0].usedCount,
            expiresAt: rows[0].expiresAt,
            isActive: rows[0].isActive,
          }
        }
      }

      const evalRes = evaluateVoucherEligibility({
        voucher: voucherRecord,
        allowVoucher,
        grossAmount,
        now,
      })

      if (!evalRes.eligible) {
        return {
          success: false,
          error: evalRes.reason || "Voucher tidak valid",
        }
      }

      discountAmount = evalRes.discountAmount
      netAmount = evalRes.netAmount
      appliedVoucher = evalRes.voucher || null
    }

    const accessToken = generateSessionAccessToken()
    const referenceNumber = generateReferenceNumber(now)
    const reservedUntil = computeHoldExpiry(now)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    let bookingId: string
    let transactionId: string

    if (deps?.reserveSlotAndCreateBooking) {
      const res = await deps.reserveSlotAndCreateBooking({
        scheduleId: schedule.id,
        counselorId: counselor.id,
        screeningId: data.screeningId,
        patientName: data.patientName,
        patientEmail: data.patientEmail,
        patientPhone: data.patientPhone,
        initialNotes: data.initialNotes,
        accessToken,
        reservedUntil,
        grossAmount,
        discountAmount,
        netAmount,
        voucherId: appliedVoucher?.id || null,
        paymentProvider: data.paymentProvider,
        paymentMethod: data.paymentMethod,
        referenceNumber,
        appUrl,
      })
      bookingId = res.bookingId
      transactionId = res.transactionId
    } else if (DEMO_SCHEDULES[schedule.id] || DEMO_COUNSELORS[counselor.id]) {
      bookingId = "demo-b-" + accessToken.slice(0, 8)
      transactionId = "demo-tx-" + accessToken.slice(0, 8)
      DEMO_BOOKINGS_CACHE.set(accessToken, {
        booking: {
          id: bookingId,
          accessToken,
          patientName: data.patientName,
          patientEmail: data.patientEmail,
          patientPhone: data.patientPhone,
          initialNotes: data.initialNotes || null,
          status: "pending_payment",
          createdAt: now,
        },
        counselor: {
          id: counselor.id,
          fullName: counselor.fullName,
          title: counselor.title,
          counselorType: counselor.counselorType,
          counselorTypeDisplay:
            counselor.counselorType === "psychologist"
              ? "Psikolog Klinis"
              : "Konselor Sebaya",
          avatarR2Url: counselor.avatarR2Url,
        },
        schedule: {
          id: schedule.id,
          date: schedule.date,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          timeRange: formatTimeRange(schedule.startTime, schedule.endTime),
        },
        transaction: {
          id: transactionId,
          paymentProvider: data.paymentProvider,
          paymentMethod:
            data.paymentMethod ||
            (data.paymentProvider === "xendit"
              ? "Xendit Gateway"
              : "Transfer Manual"),
          referenceNumber,
          grossAmount,
          discountAmount,
          netAmount,
          netAmountFormatted: formatRupiah(netAmount),
          status: "PENDING",
        },
      })
    } else {
      const txResult = await db.transaction(async (tx) => {
        await tx
          .update(schedules)
          .set({
            status: "reserved",
            reservedUntil,
          })
          .where(eq(schedules.id, schedule.id))

        if (appliedVoucher) {
          await tx
            .update(vouchers)
            .set({
              usedCount: sql`${vouchers.usedCount} + 1`,
            })
            .where(eq(vouchers.id, appliedVoucher.id))
        }

        const [newBooking] = await tx
          .insert(bookings)
          .values({
            accessToken,
            patientName: data.patientName,
            patientEmail: data.patientEmail,
            patientPhone: data.patientPhone,
            initialNotes: data.initialNotes || null,
            scheduleId: schedule.id,
            counselorId: counselor.id,
            screeningId: data.screeningId || null,
            status: "pending_payment",
          })
          .returning({ id: bookings.id })

        const [newTx] = await tx
          .insert(transactions)
          .values({
            bookingId: newBooking.id,
            voucherId: appliedVoucher?.id || null,
            paymentProvider: data.paymentProvider,
            paymentMethod: data.paymentMethod || (data.paymentProvider === "xendit" ? "Xendit Gateway" : "Transfer Manual"),
            referenceNumber,
            grossAmount: String(grossAmount),
            discountAmount: String(discountAmount),
            netAmount: String(netAmount),
            status: "PENDING",
          })
          .returning({ id: transactions.id })

        return {
          bookingId: newBooking.id,
          transactionId: newTx.id,
        }
      })

      bookingId = txResult.bookingId
      transactionId = txResult.transactionId
    }

    const netAmountFormatted = formatRupiah(netAmount)

    if (data.paymentProvider === "xendit") {
      const createInvoiceFn = deps?.createInvoice || createXenditInvoice
      const timeFormatted = formatTimeRange(schedule.startTime, schedule.endTime)

      const invoice = await createInvoiceFn({
        externalId: `txn_${transactionId}`,
        amount: netAmount,
        payerEmail: data.patientEmail,
        description: `Konseling Solulu: ${counselor.fullName} (${schedule.date} ${timeFormatted})`,
        invoiceDuration: 900,
        successRedirectUrl: `${appUrl}/booking/success?token=${accessToken}`,
        failureRedirectUrl: `${appUrl}/booking?counselorId=${counselor.id}&scheduleId=${schedule.id}&error=payment_cancelled`,
      })

      if (!deps?.reserveSlotAndCreateBooking) {
        await db
          .update(transactions)
          .set({
            xenditInvoiceId: invoice.id,
            xenditPaymentUrl: invoice.invoiceUrl,
          })
          .where(eq(transactions.id, transactionId))
      }

      return {
        success: true,
        data: {
          bookingId,
          accessToken,
          paymentProvider: "xendit",
          paymentUrl: invoice.invoiceUrl,
          referenceNumber,
          netAmount,
          netAmountFormatted,
        },
      }
    } else {
      return {
        success: true,
        data: {
          bookingId,
          accessToken,
          paymentProvider: "manual",
          redirectUrl: `/booking/manual-pending?token=${accessToken}`,
          referenceNumber,
          netAmount,
          netAmountFormatted,
        },
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memproses pemesanan",
    }
  }
}

/**
 * Loads booking, counselor, schedule, and transaction details by access token.
 */
export async function executeGetBookingByToken(
  accessToken: string,
  deps?: {
    getBookingWithDetails?: (token: string) => Promise<any>
  }
): Promise<ActionResponse<{
  booking: {
    id: string
    accessToken: string
    patientName: string
    patientEmail: string
    patientPhone: string
    initialNotes: string | null
    status: string
    createdAt: Date | string
  }
  counselor: {
    id: string
    fullName: string
    title: string
    counselorType: string
    counselorTypeDisplay: string
    avatarR2Url: string | null
  }
  schedule: {
    id: string
    date: string
    startTime: string
    endTime: string
    timeRange: string
  }
  transaction: {
    id: string
    paymentProvider: string
    paymentMethod: string | null
    referenceNumber: string | null
    grossAmount: number
    discountAmount: number
    netAmount: number
    netAmountFormatted: string
    status: string
  } | null
}>> {
  try {
    if (!accessToken || typeof accessToken !== "string") {
      return { success: false, error: "Token akses tidak valid" }
    }

    if (deps?.getBookingWithDetails) {
      const res = await deps.getBookingWithDetails(accessToken)
      if (!res) return { success: false, error: "Data pemesanan tidak ditemukan" }
      return { success: true, data: res }
    }

    const demoCached = DEMO_BOOKINGS_CACHE.get(accessToken)
    if (demoCached) {
      return { success: true, data: demoCached }
    }

    const rows = await db
      .select({
        booking: bookings,
        counselor: counselors,
        schedule: schedules,
        transaction: transactions,
      })
      .from(bookings)
      .innerJoin(counselors, eq(bookings.counselorId, counselors.id))
      .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(transactions, eq(bookings.id, transactions.bookingId))
      .where(eq(bookings.accessToken, accessToken))
      .limit(1)

    if (rows.length === 0) {
      return { success: false, error: "Pemesanan dengan tautan ini tidak ditemukan" }
    }

    const item = rows[0]

    // AUTO-SYNC GUARD FOR PAYMENT GATEWAY (XENDIT):
    // If booking is pending_payment and provider is xendit, check Xendit invoice status directly.
    // If already paid, automatically mark confirmed and trigger fulfillment so it never gets stuck in manual confirmation.
    if (
      item.booking.status === "pending_payment" &&
      item.transaction?.paymentProvider === "xendit" &&
      item.transaction?.xenditInvoiceId
    ) {
      try {
        const xenditInvoice = await getXenditInvoice(item.transaction.xenditInvoiceId)
        if (
          xenditInvoice &&
          (xenditInvoice.status === "PAID" || xenditInvoice.status === "SETTLED")
        ) {
          const paidMethod =
            xenditInvoice.payment_method ||
            xenditInvoice.payment_channel ||
            "XENDIT_AUTO"

          await db
            .update(transactions)
            .set({
              status: "PAID",
              paidAt: xenditInvoice.paid_at ? new Date(xenditInvoice.paid_at) : new Date(),
              paymentMethod: paidMethod,
            })
            .where(eq(transactions.id, item.transaction.id))

          await db
            .update(bookings)
            .set({ status: "confirmed" })
            .where(eq(bookings.id, item.booking.id))

          await db
            .update(schedules)
            .set({ status: "booked" })
            .where(eq(schedules.id, item.schedule.id))

          await dispatchFulfillmentJob(item.booking.id)

          item.booking.status = "confirmed"
          item.transaction.status = "PAID"
          item.transaction.paymentMethod = paidMethod
        }
      } catch (syncErr) {
        console.error("[AUTO_SYNC_XENDIT_ERROR]", syncErr)
      }
    }

    const netAmount = item.transaction ? Number(item.transaction.netAmount) : 0

    return {
      success: true,
      data: {
        booking: {
          id: item.booking.id,
          accessToken: item.booking.accessToken,
          patientName: item.booking.patientName,
          patientEmail: item.booking.patientEmail,
          patientPhone: item.booking.patientPhone,
          initialNotes: item.booking.initialNotes,
          status: item.booking.status,
          createdAt: item.booking.createdAt,
        },
        counselor: {
          id: item.counselor.id,
          fullName: item.counselor.fullName,
          title: item.counselor.title,
          counselorType: item.counselor.counselorType,
          counselorTypeDisplay:
            item.counselor.counselorType === "psychologist"
              ? "Psikolog Klinis"
              : "Konselor Sebaya",
          avatarR2Url: item.counselor.avatarR2Url,
        },
        schedule: {
          id: item.schedule.id,
          date: item.schedule.date,
          startTime: item.schedule.startTime,
          endTime: item.schedule.endTime,
          timeRange: formatTimeRange(item.schedule.startTime, item.schedule.endTime),
        },
        transaction: item.transaction
          ? {
              id: item.transaction.id,
              paymentProvider: item.transaction.paymentProvider,
              paymentMethod: item.transaction.paymentMethod,
              referenceNumber: item.transaction.referenceNumber,
              grossAmount: Number(item.transaction.grossAmount),
              discountAmount: Number(item.transaction.discountAmount),
              netAmount,
              netAmountFormatted: formatRupiah(netAmount),
              status: item.transaction.status,
            }
          : null,
      },
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal memuat status pemesanan",
    }
  }
}
