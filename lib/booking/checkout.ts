import { eq, and, sql } from "drizzle-orm"
import { db } from "@/db"
import {
  counselors,
  schedules,
  vouchers,
  bookings,
  transactions,
  screenings,
} from "@/db/schema"
import {
  formatTimeRange,
  countOverlappingActiveSessions,
  MAX_PLATFORM_CONCURRENCY,
  isSlotBookable,
  getWIBDateString,
  MIN_BOOKING_LEAD_TIME_MINUTES,
} from "@/lib/schedules/concurrency"
import {
  validateVoucherSchema,
  createGuestBookingSchema,
  type ValidateVoucherInput,
  type CreateGuestBookingInput,
} from "@/lib/validations/booking"
import { getActiveZoomCapacity } from "@/lib/zoom/active-capacity"
import { getAppBaseUrl } from "@/lib/url"
import {
  evaluateVoucherEligibility,
  type VoucherRecord,
} from "@/lib/booking/voucher"
import { holdExpiresAt } from "@/lib/booking-cycle"
import {
  computeHoldExpiry,
  generateSessionAccessToken,
  generateReferenceNumber,
  isHoldExpired,
} from "@/lib/booking/hold"
import {
  activePrice,
  listOfferedServices,
  resolveServiceSelection,
  toServicePricingView,
  type ServiceLike,
  type ServicePricingView,
} from "@/lib/services/pricing"
import {
  listAllServices,
  getServiceById,
  getExcludedServiceIds,
} from "@/lib/services/repository"
import { createXenditInvoice, getXenditInvoice } from "@/lib/xendit"
import { getXenditConfig } from "@/lib/config/integrations"
import { dispatchFulfillmentJob } from "@/lib/fulfillment/qstash"
import { poolSlotDisplay } from "@/lib/pool/display"

export interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
import { formatRupiah } from "@/lib/utils"
export { formatRupiah }

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
  /** Layanan aktif yang ditawarkan konselor ini (tipe cocok, tidak dikecualikan Admin). */
  services: ServicePricingView[]
  /** Layanan terpilih; null bila klien masih harus memilih di checkout. */
  selectedServiceId: string | null
  screening?: {
    id: string
    totalScore: number
    hasSuicidalThoughts: boolean
    recommendedType: "peer" | "psychologist"
  } | null
}

/** Eksekutor transaksi (tx Drizzle atau pengganti uji) yang diteruskan ke hook `inTransaction`. */
export type CheckoutTx = Pick<typeof db, "insert" | "update">

export interface CheckoutCreatedContext {
  bookingId: string
  transactionId: string
  scheduleId: string
  counselorId: string
  serviceId: string
  accessToken: string
  referenceNumber: string
  grossAmount: number
  netAmount: number
  reservedUntil: Date
}

/**
 * Opsi jalur checkout. `source: "booking_cepat"` (Admin, dari WhatsApp #30) memakai jalur yang sama
 * dengan klien, kecuali: hold Booking Cepat (default 60 menit), tanpa batas anti-hoarding dan lead time,
 * dan booking diberi `source = booking_cepat`. `inTransaction` berjalan di transaksi yang sama dengan
 * pembuatan booking sehingga Jejak Audit dan pelunasan oleh Admin commit/rollback bersama.
 */
export interface CheckoutOptions {
  source?: "public" | "booking_cepat"
  holdMinutes?: number
  inTransaction?: (tx: CheckoutTx, ctx: CheckoutCreatedContext) => Promise<void>
}

export interface BookingDependencies {
  /** Pengganti `tx` untuk hook `inTransaction` pada jalur DI `reserveSlotAndCreateBooking`. */
  executor?: CheckoutTx
  getCounselor?: (counselorId: string) => Promise<any>
  getSchedule?: (scheduleId: string) => Promise<any>
  getServices?: () => Promise<ServiceLike[]>
  getExcludedServiceIds?: (counselorId: string) => Promise<string[]>
  getScreening?: (screeningId: string) => Promise<any>
  getVoucher?: (code: string) => Promise<any>
  getActiveSessionsOnDate?: (date: string, excludeScheduleId?: string) => Promise<{ startTime: string; endTime: string }[]>
  reserveSlotAndCreateBooking?: (params: {
    scheduleId: string
    counselorId: string
    screeningId?: string | null
    serviceId: string
    /** Tarif pokok aktif Layanan sebelum voucher. */
    basePriceSnapshot: number
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
  checkExistingPendingHold?: (patientEmail: string, patientPhone: string) => Promise<boolean>
  getZoomCapacity?: () => Promise<number>
  now?: () => Date
  leadTimeMinutes?: number
}

/**
 * Layanan yang ditawarkan konselor tertentu (ADR-0010): aktif, tipe cocok,
 * dan tidak dimatikan Admin untuk konselor itu. Mengembalikan [] bila kosong.
 */
async function loadOfferedServices(
  counselor: { id: string; counselorType: "peer" | "psychologist" },
  deps?: Pick<BookingDependencies, "getServices" | "getExcludedServiceIds">
): Promise<ServiceLike[]> {
  const all = deps?.getServices ? await deps.getServices() : await listAllServices()
  const excluded = deps?.getExcludedServiceIds
    ? await deps.getExcludedServiceIds(counselor.id)
    : await getExcludedServiceIds(counselor.id)
  return listOfferedServices(all, counselor, excluded)
}

/**
 * Validates voucher code against the Layanan voucher policy and quotas.
 * The gross amount is always the Layanan's active price, never a client-supplied number.
 */
export async function executeValidateVoucher(
  input: ValidateVoucherInput,
  deps?: {
    getService?: (serviceId: string) => Promise<ServiceLike | null>
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

    const { code, serviceId } = parseResult.data

    const service = deps?.getService
      ? await deps.getService(serviceId)
      : await getServiceById(serviceId)
    if (!service || !service.isActive) {
      return { success: false, error: "Layanan tidak ditemukan atau tidak aktif" }
    }

    const allowVoucher = service.allowVoucher
    const grossAmount = activePrice(service)

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
    serviceId,
  }: {
    scheduleId: string
    counselorId: string
    screeningId?: string | null
    serviceId?: string | null
  },
  deps?: BookingDependencies
): Promise<ActionResponse<BookingContextData>> {
  try {
    const now = deps?.now ? deps.now() : new Date()

    let counselor: any
    if (deps?.getCounselor) {
      counselor = await deps.getCounselor(counselorId)
    } else {
      const rows = await db
        .select()
        .from(counselors)
        .where(eq(counselors.id, counselorId))
        .limit(1)
      counselor = rows[0] || null
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
    } else {
      const rows = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, scheduleId))
        .limit(1)
      schedule = rows[0] || null
    }

    if (!schedule) {
      return {
        success: false,
        error: "Slot jadwal tidak ditemukan",
      }
    }

    if (schedule.isLeave) {
      return {
        success: false,
        error: `Slot jadwal ini tidak tersedia karena mitra konselor sedang izin/cuti praktik${
          schedule.leaveReason ? ` (${schedule.leaveReason})` : ""
        }.`,
      }
    }

    const leadTime = deps?.leadTimeMinutes ?? MIN_BOOKING_LEAD_TIME_MINUTES
    const bookableCheck = isSlotBookable(schedule.date, schedule.startTime, now, leadTime)
    if (!bookableCheck.bookable) {
      return {
        success: false,
        error:
          bookableCheck.reason ||
          `Slot jadwal ini sudah tidak dapat dipesan (batas minimal pemesanan ${Math.round(
            leadTime / 60
          )} jam sebelum sesi dimulai atau jadwal sudah terlewat).`,
      }
    }

    const isExpiredHold = schedule.status === "reserved" && isHoldExpired(schedule.reservedUntil, now)
    const isAvailable = schedule.status === "available" || isExpiredHold

    if (!isAvailable) {
      return {
        success: false,
        error: "Slot jadwal ini sudah tidak tersedia atau sedang dalam proses transaksi oleh pasien lain.",
      }
    }

    const offered = (await loadOfferedServices(counselor, deps)).map(toServicePricingView)
    if (offered.length === 0) {
      return {
        success: false,
        error: "Mitra konselor ini belum menawarkan Layanan aktif. Silakan pilih konselor lain.",
      }
    }
    if (serviceId && !offered.some((v) => v.serviceId === serviceId)) {
      return {
        success: false,
        error: "Layanan yang dipilih tidak tersedia untuk mitra konselor ini.",
      }
    }
    const selected = resolveServiceSelection(offered, serviceId)

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
        services: offered,
        selectedServiceId: selected ? selected.serviceId : null,
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
  deps?: BookingDependencies,
  options: CheckoutOptions = {}
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
    const isCepat = options.source === "booking_cepat"

    // Fail closed before reserving anything: no Xendit key means no payable invoice.
    if (data.paymentProvider === "xendit" && !deps?.createInvoice) {
      getXenditConfig()
    }

    let schedule: any
    if (deps?.getSchedule) {
      schedule = await deps.getSchedule(data.scheduleId)
    } else {
      const rows = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, data.scheduleId))
        .limit(1)
      schedule = rows[0] || null
    }

    if (!schedule) {
      return { success: false, error: "Slot jadwal tidak ditemukan" }
    }

    if (schedule.isLeave) {
      return {
        success: false,
        error: `Slot jadwal ini tidak tersedia karena mitra konselor sedang izin/cuti praktik${
          schedule.leaveReason ? ` (${schedule.leaveReason})` : ""
        }.`,
      }
    }

    if (schedule.counselorId && schedule.counselorId !== data.counselorId) {
      return { success: false, error: "Slot jadwal tidak dimiliki konselor yang dipilih." }
    }

    const leadTime = deps?.leadTimeMinutes ?? (isCepat ? 0 : MIN_BOOKING_LEAD_TIME_MINUTES)
    const bookableCheck = isSlotBookable(schedule.date, schedule.startTime, now, leadTime)
    if (!bookableCheck.bookable) {
      return {
        success: false,
        error: bookableCheck.reason || "Slot jadwal ini sudah tidak dapat dipesan.",
      }
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

    // Anti-hoarding check: Max 1 active unexpired reservation per patient (tidak berlaku untuk Booking Cepat)
    if (isCepat) {
      // Admin boleh menahan beberapa slot untuk klien yang sama.
    } else if (deps?.checkExistingPendingHold) {
      const hasHold = await deps.checkExistingPendingHold(data.patientEmail, data.patientPhone)
      if (hasHold) {
        return {
          success: false,
          error:
            "Anda masih memiliki 1 transaksi pemesanan yang sedang berjalan. Silakan selesaikan pembayaran tersebut atau tunggu hingga batas waktu pembayaran (17 menit) berakhir sebelum memesan jadwal lain.",
        }
      }
    } else {
      try {
        const pendingHolds = await db
          .select({ id: bookings.id })
          .from(bookings)
          .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
          .where(
            and(
              sql`(${bookings.patientEmail} ILIKE ${data.patientEmail} OR ${bookings.patientPhone} = ${data.patientPhone})`,
              eq(bookings.status, "pending_payment"),
              eq(schedules.status, "reserved"),
              sql`${schedules.reservedUntil} > ${now.toISOString()}`
            )
          )
          .limit(1)

        if (pendingHolds.length > 0) {
          return {
            success: false,
            error:
              "Anda masih memiliki 1 transaksi pemesanan yang sedang berjalan. Silakan selesaikan pembayaran tersebut atau tunggu hingga batas waktu pembayaran (17 menit) berakhir sebelum memesan jadwal lain.",
          }
        }
      } catch (holdErr) {
        console.error("[CHECKOUT] Hold check error:", holdErr)
      }
    }

    let counselor: any
    if (deps?.getCounselor) {
      counselor = await deps.getCounselor(data.counselorId)
    } else {
      const rows = await db
        .select()
        .from(counselors)
        .where(eq(counselors.id, data.counselorId))
        .limit(1)
      counselor = rows[0] || null
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

    let effectiveLimit = 10
    if (deps?.getZoomCapacity) {
      effectiveLimit = await deps.getZoomCapacity()
    } else {
      const cap = await getActiveZoomCapacity()
      if (cap >= 4) {
        effectiveLimit = 10
      } else if (cap > 0) {
        effectiveLimit = cap
      }
    }

    if (overlapCount >= effectiveLimit) {
      return {
        success: false,
        error: `Kapasitas ruang Zoom penuh pada jam ini (maksimal ${effectiveLimit} sesi bersamaan). Silakan pilih slot lain.`,
      }
    }

    const offeredServices = await loadOfferedServices(counselor, deps)
    const service = offeredServices.find((svc) => svc.id === data.serviceId)
    if (!service) {
      return {
        success: false,
        error: "Layanan yang dipilih tidak tersedia untuk mitra konselor ini.",
      }
    }

    const allowVoucher = service.allowVoucher
    // Tarif pokok aktif sebelum voucher; ini yang di-snapshot ke booking.
    const grossAmount = activePrice(service)
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
    const reservedUntil = isCepat
      ? holdExpiresAt(now, "booking_cepat", options.holdMinutes)
      : computeHoldExpiry(now)
    const appUrl = getAppBaseUrl()

    let bookingId: string
    let transactionId: string

    if (deps?.reserveSlotAndCreateBooking) {
      const res = await deps.reserveSlotAndCreateBooking({
        scheduleId: schedule.id,
        counselorId: counselor.id,
        screeningId: data.screeningId,
        serviceId: service.id,
        basePriceSnapshot: grossAmount,
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
      if (options.inTransaction && deps.executor) {
        await options.inTransaction(deps.executor, {
          bookingId,
          transactionId,
          scheduleId: schedule.id,
          counselorId: counselor.id,
          serviceId: service.id,
          accessToken,
          referenceNumber,
          grossAmount,
          netAmount,
          reservedUntil,
        })
      }
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
            serviceId: service.id,
            basePriceSnapshot: String(grossAmount),
            status: "pending_payment",
            source: isCepat ? "booking_cepat" : "public",
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

        if (options.inTransaction) {
          await options.inTransaction(tx, {
            bookingId: newBooking.id,
            transactionId: newTx.id,
            scheduleId: schedule.id,
            counselorId: counselor.id,
            serviceId: service.id,
            accessToken,
            referenceNumber,
            grossAmount,
            netAmount,
            reservedUntil,
          })
        }

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
        invoiceDuration: isCepat
          ? Math.round((reservedUntil.getTime() - now.getTime()) / 1000)
          : 900,
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
  } | null
  schedule: {
    /** Kosong untuk booking Konselor Bebas yang belum diklaim. */
    id: string | null
    date: string
    startTime: string
    endTime: string
    timeRange: string
  }
  /** True: booking Konselor Bebas yang belum punya konselor (counselor = null). */
  awaitingCounselor: boolean
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

    const rows = await db
      .select({
        booking: bookings,
        counselor: counselors,
        schedule: schedules,
        transaction: transactions,
      })
      .from(bookings)
      .leftJoin(counselors, eq(bookings.counselorId, counselors.id))
      .leftJoin(schedules, eq(bookings.scheduleId, schedules.id))
      .leftJoin(transactions, eq(bookings.id, transactions.bookingId))
      .where(eq(bookings.accessToken, accessToken))
      .limit(1)

    if (rows.length === 0) {
      return { success: false, error: "Pemesanan dengan tautan ini tidak ditemukan" }
    }

    const item = rows[0]
    const poolSlot = item.schedule ? null : poolSlotDisplay(item.booking)
    if (!item.schedule && !poolSlot) {
      return { success: false, error: "Pemesanan dengan tautan ini tidak ditemukan" }
    }

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

          if (item.schedule) {
            await db
              .update(schedules)
              .set({ status: "booked" })
              .where(eq(schedules.id, item.schedule.id))
          }

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
        counselor: item.counselor
          ? {
              id: item.counselor.id,
              fullName: item.counselor.fullName,
              title: item.counselor.title,
              counselorType: item.counselor.counselorType,
              counselorTypeDisplay:
                item.counselor.counselorType === "psychologist"
                  ? "Psikolog Klinis"
                  : "Konselor Sebaya",
              avatarR2Url: item.counselor.avatarR2Url,
            }
          : null,
        awaitingCounselor: !item.counselor,
        schedule: item.schedule
          ? {
              id: item.schedule.id,
              date: item.schedule.date,
              startTime: item.schedule.startTime,
              endTime: item.schedule.endTime,
              timeRange: formatTimeRange(item.schedule.startTime, item.schedule.endTime),
            }
          : {
              id: null,
              date: poolSlot!.date,
              startTime: poolSlot!.startTime,
              endTime: poolSlot!.endTime,
              timeRange: formatTimeRange(poolSlot!.startTime, poolSlot!.endTime),
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
