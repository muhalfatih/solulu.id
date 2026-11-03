/**
 * Checkout "Konselor Bebas" (pool booking, ADR-0011).
 *
 * Booking pool dibayar sebelum ada konselor: counselor_id dan schedule_id NULL, slot
 * disimpan di pool_date + pool_slot_index. Opsinya hanya ditawarkan bila getPoolOffer
 * menjamin masih ada konselor yang memenuhi syarat; jaminan dicek ulang di dalam
 * transaksi yang sama dengan insert (dengan advisory lock per slot) agar dua klien
 * yang membayar bersamaan tidak melampaui jaminan.
 */
import { and, eq, gt, sql } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, transactions, vouchers } from "@/db/schema"
import { createPoolBookingSchema, type CreatePoolBookingInput } from "@/lib/validations/booking"
import { evaluateVoucherEligibility, type VoucherRecord } from "@/lib/booking/voucher"
import {
  SLOT_HOLD_MINUTES,
  generateReferenceNumber,
  generateSessionAccessToken,
} from "@/lib/booking/hold"
import { CLAIM_CUTOFF_HOURS } from "@/lib/booking-cycle"
import { formatTimeRange, isSlotBookable, MAX_PLATFORM_CONCURRENCY } from "@/lib/schedules/concurrency"
import { FIXED_SLOTS, getSlotByIndex } from "@/lib/schedules/slots"
import { getPoolOffer } from "@/lib/pool/store"
import { activePrice, toServicePricingView, type ServiceLike, type ServicePricingView } from "@/lib/services/pricing"
import { getServiceById, listAllServices } from "@/lib/services/repository"
import { createXenditInvoice } from "@/lib/xendit"
import { getXenditConfig } from "@/lib/config/integrations"
import { getAppBaseUrl } from "@/lib/url"
import { formatRupiah } from "@/lib/utils"
import { getActiveZoomCapacity } from "@/lib/zoom/active-capacity"

export interface PoolOffer {
  offerable: boolean
  poolBookings: number
  eligibleCounselors: number
}

export interface PoolSlotOption {
  slotIndex: number
  startTime: string
  endTime: string
  timeRange: string
}

export interface PoolCheckoutResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface CreatePoolBookingParams {
  date: string
  slotIndex: number
  screeningId?: string | null
  serviceId: string
  basePriceSnapshot: number
  patientName: string
  patientEmail: string
  patientPhone: string
  initialNotes?: string | null
  accessToken: string
  grossAmount: number
  discountAmount: number
  netAmount: number
  voucherId?: string | null
  paymentProvider: string
  paymentMethod?: string | null
  referenceNumber: string
}

export interface PoolCheckoutDeps {
  now?: () => Date
  leadTimeMinutes?: number
  getService?: (serviceId: string) => Promise<ServiceLike | null>
  listServices?: () => Promise<ServiceLike[]>
  getOffer?: (input: { date: string; slotIndex: number; serviceId: string }) => Promise<PoolOffer>
  getVoucher?: (code: string) => Promise<VoucherRecord | null>
  checkExistingPendingHold?: (patientEmail: string, patientPhone: string) => Promise<boolean>
  /** Jumlah sesi aktif (jadwal booked/reserved + booking pool) yang tumpang tindih di slot ini. */
  getSlotLoad?: (date: string, slotIndex: number) => Promise<number>
  getZoomCapacity?: () => Promise<number>
  /**
   * Insert booking + transaksi secara atomik. Mengembalikan null bila jaminan pool
   * sudah tidak terpenuhi saat transaksi berjalan.
   */
  createPoolBooking?: (params: CreatePoolBookingParams) => Promise<{ bookingId: string; transactionId: string } | null>
  createInvoice?: typeof createXenditInvoice
}

export const POOL_UNAVAILABLE_MESSAGE =
  "Opsi Konselor Bebas untuk slot ini sudah tidak tersedia. Silakan pilih slot lain atau konselor tertentu."

function slotBookable(date: string, slotIndex: number, deps: PoolCheckoutDeps): { ok: boolean; reason?: string } {
  const slot = getSlotByIndex(slotIndex)
  if (!slot) return { ok: false, reason: "Slot tidak valid." }
  const now = deps.now ? deps.now() : new Date()
  // Booking pool ditutup di Cutoff H-4 Jam (sama dengan penutupan klaim), bukan lead time checkout biasa.
  const check = isSlotBookable(date, slot.startTime, now, deps.leadTimeMinutes ?? CLAIM_CUTOFF_HOURS * 60)
  return { ok: check.bookable, reason: check.reason }
}

/**
 * Slot pada tanggal tertentu yang boleh menampilkan opsi Konselor Bebas untuk sebuah Layanan.
 * Slot tanpa jaminan, atau yang sudah lewat batas pemesanan, tidak muncul sama sekali.
 */
export async function listPoolSlotOptions(
  input: { date: string; serviceId: string },
  deps: PoolCheckoutDeps = {}
): Promise<PoolSlotOption[]> {
  const getOffer = deps.getOffer ?? ((i) => getPoolOffer(i))
  const options: PoolSlotOption[] = []
  for (const slot of FIXED_SLOTS) {
    if (!slotBookable(input.date, slot.slotIndex, deps).ok) continue
    const offer = await getOffer({ date: input.date, slotIndex: slot.slotIndex, serviceId: input.serviceId })
    if (!offer.offerable) continue
    options.push({
      slotIndex: slot.slotIndex,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timeRange: formatTimeRange(slot.startTime, slot.endTime),
    })
  }
  return options
}

/** Layanan aktif yang bisa dibeli sebagai Konselor Bebas (memiliki setidaknya satu tipe konselor). */
export async function listPoolServices(deps: PoolCheckoutDeps = {}): Promise<ServicePricingView[]> {
  const all = deps.listServices ? await deps.listServices() : await listAllServices()
  return all
    .filter((s) => s.isActive && s.allowedCounselorTypes.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toServicePricingView)
}

async function defaultSlotLoad(date: string, slotIndex: number): Promise<number> {
  const now = new Date()
  const [sched] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schedules)
    .where(
      and(
        eq(schedules.date, date),
        eq(schedules.slotIndex, slotIndex),
        sql`(${schedules.status} = 'booked' OR (${schedules.status} = 'reserved' AND ${schedules.reservedUntil} > ${now.toISOString()}))`
      )
    )
  const [pool] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(
        eq(bookings.poolDate, date),
        eq(bookings.poolSlotIndex, slotIndex),
        sql`${bookings.counselorId} IS NULL`,
        sql`${bookings.status} IN ('pending_payment', 'confirmed')`
      )
    )
  return (sched?.n ?? 0) + (pool?.n ?? 0)
}

async function defaultPendingHold(patientEmail: string, patientPhone: string): Promise<boolean> {
  const since = new Date(Date.now() - SLOT_HOLD_MINUTES * 60_000)
  const rows = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        sql`(${bookings.patientEmail} ILIKE ${patientEmail} OR ${bookings.patientPhone} = ${patientPhone})`,
        eq(bookings.status, "pending_payment"),
        gt(bookings.createdAt, since)
      )
    )
    .limit(1)
  return rows.length > 0
}

async function defaultVoucher(code: string): Promise<VoucherRecord | null> {
  const rows = await db.select().from(vouchers).where(eq(vouchers.code, code)).limit(1)
  const v = rows[0]
  if (!v) return null
  return {
    id: v.id,
    code: v.code,
    discountType: v.discountType,
    discountValue: v.discountValue,
    quota: v.quota,
    usedCount: v.usedCount,
    expiresAt: v.expiresAt,
    isActive: v.isActive,
  }
}

async function defaultCreatePoolBooking(
  params: CreatePoolBookingParams
): Promise<{ bookingId: string; transactionId: string } | null> {
  return db.transaction(async (tx) => {
    // Serialisasi checkout pada slot yang sama; lock dilepas saat transaksi selesai.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`pool:${params.date}:${params.slotIndex}`}))`)

    const offer = await getPoolOffer(
      { date: params.date, slotIndex: params.slotIndex, serviceId: params.serviceId },
      tx as unknown as typeof db
    )
    if (!offer.offerable) return null

    if (params.voucherId) {
      await tx
        .update(vouchers)
        .set({ usedCount: sql`${vouchers.usedCount} + 1` })
        .where(eq(vouchers.id, params.voucherId))
    }

    const [booking] = await tx
      .insert(bookings)
      .values({
        accessToken: params.accessToken,
        patientName: params.patientName,
        patientEmail: params.patientEmail,
        patientPhone: params.patientPhone,
        initialNotes: params.initialNotes || null,
        scheduleId: null,
        counselorId: null,
        poolDate: params.date,
        poolSlotIndex: params.slotIndex,
        screeningId: params.screeningId || null,
        serviceId: params.serviceId,
        basePriceSnapshot: String(params.basePriceSnapshot),
        paymentMethod: params.paymentProvider === "manual" ? "manual_bank_transfer" : "xendit",
        status: "pending_payment",
      })
      .returning({ id: bookings.id })

    const [txn] = await tx
      .insert(transactions)
      .values({
        bookingId: booking.id,
        voucherId: params.voucherId || null,
        paymentProvider: params.paymentProvider,
        paymentMethod:
          params.paymentMethod || (params.paymentProvider === "xendit" ? "Xendit Gateway" : "Transfer Manual"),
        referenceNumber: params.referenceNumber,
        grossAmount: String(params.grossAmount),
        discountAmount: String(params.discountAmount),
        netAmount: String(params.netAmount),
        status: "PENDING",
      })
      .returning({ id: transactions.id })

    return { bookingId: booking.id, transactionId: txn.id }
  })
}

export interface PoolCheckoutData {
  bookingId: string
  accessToken: string
  paymentProvider: "xendit" | "manual"
  paymentUrl?: string
  redirectUrl?: string
  referenceNumber: string
  netAmount: number
  netAmountFormatted: string
}

/**
 * Membuat booking Konselor Bebas: Layanan snapshot, hold (pending_payment, kedaluwarsa
 * oleh cron setelah SLOT_HOLD_MINUTES), dan invoice Xendit seperti checkout biasa.
 */
export async function executeCreatePoolBooking(
  input: CreatePoolBookingInput,
  deps: PoolCheckoutDeps = {}
): Promise<PoolCheckoutResult<PoolCheckoutData>> {
  try {
    const parsed = createPoolBookingSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Data formulir pemesanan tidak valid" }
    }
    const data = parsed.data
    const now = deps.now ? deps.now() : new Date()

    if (data.paymentProvider === "xendit" && !deps.createInvoice) {
      getXenditConfig()
    }

    const slot = getSlotByIndex(data.slotIndex)
    const bookable = slotBookable(data.date, data.slotIndex, deps)
    if (!slot || !bookable.ok) {
      return { success: false, error: bookable.reason || "Slot ini sudah tidak dapat dipesan." }
    }

    const service = deps.getService ? await deps.getService(data.serviceId) : await getServiceById(data.serviceId)
    if (!service || !service.isActive) {
      return { success: false, error: "Layanan tidak ditemukan atau tidak aktif" }
    }

    const hasHold = deps.checkExistingPendingHold
      ? await deps.checkExistingPendingHold(data.patientEmail, data.patientPhone)
      : await defaultPendingHold(data.patientEmail, data.patientPhone)
    if (hasHold) {
      return {
        success: false,
        error:
          "Anda masih memiliki 1 transaksi pemesanan yang sedang berjalan. Silakan selesaikan pembayaran tersebut atau tunggu hingga batas waktu pembayaran berakhir sebelum memesan jadwal lain.",
      }
    }

    // Jaminan ADR-0011 (dicek lagi secara atomik saat insert).
    const offer = deps.getOffer
      ? await deps.getOffer({ date: data.date, slotIndex: data.slotIndex, serviceId: service.id })
      : await getPoolOffer({ date: data.date, slotIndex: data.slotIndex, serviceId: service.id })
    if (!offer.offerable) return { success: false, error: POOL_UNAVAILABLE_MESSAGE }

    let limit = MAX_PLATFORM_CONCURRENCY
    if (deps.getZoomCapacity) {
      limit = await deps.getZoomCapacity()
    } else {
      const cap = await getActiveZoomCapacity()
      if (cap > 0 && cap < 4) limit = cap
    }
    const load = deps.getSlotLoad ? await deps.getSlotLoad(data.date, data.slotIndex) : await defaultSlotLoad(data.date, data.slotIndex)
    if (load >= limit) {
      return {
        success: false,
        error: `Kapasitas ruang Zoom penuh pada jam ini (maksimal ${limit} sesi bersamaan). Silakan pilih slot lain.`,
      }
    }

    const grossAmount = activePrice(service)
    let discountAmount = 0
    let netAmount = grossAmount
    let voucherId: string | null = null
    if (data.voucherCode) {
      const voucher = deps.getVoucher ? await deps.getVoucher(data.voucherCode) : await defaultVoucher(data.voucherCode)
      const evaluation = evaluateVoucherEligibility({
        voucher,
        allowVoucher: service.allowVoucher,
        grossAmount,
        now,
      })
      if (!evaluation.eligible) {
        return { success: false, error: evaluation.reason || "Voucher tidak valid" }
      }
      discountAmount = evaluation.discountAmount
      netAmount = evaluation.netAmount
      voucherId = evaluation.voucher?.id ?? null
    }

    const accessToken = generateSessionAccessToken()
    const referenceNumber = generateReferenceNumber(now)
    const appUrl = getAppBaseUrl()

    const create = deps.createPoolBooking ?? defaultCreatePoolBooking
    const created = await create({
      date: data.date,
      slotIndex: data.slotIndex,
      screeningId: data.screeningId,
      serviceId: service.id,
      basePriceSnapshot: grossAmount,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      initialNotes: data.initialNotes,
      accessToken,
      grossAmount,
      discountAmount,
      netAmount,
      voucherId,
      paymentProvider: data.paymentProvider,
      paymentMethod: data.paymentMethod,
      referenceNumber,
    })
    if (!created) return { success: false, error: POOL_UNAVAILABLE_MESSAGE }

    const netAmountFormatted = formatRupiah(netAmount)
    // Hold booking pool = created_at + SLOT_HOLD_MINUTES; cron kedaluwarsa (expirePoolHolds) yang melepasnya.

    if (data.paymentProvider === "xendit") {
      const createInvoice = deps.createInvoice ?? createXenditInvoice
      const invoice = await createInvoice({
        externalId: `txn_${created.transactionId}`,
        amount: netAmount,
        payerEmail: data.patientEmail,
        description: `Konseling Solulu: Konselor Bebas (${data.date} ${formatTimeRange(slot.startTime, slot.endTime)})`,
        invoiceDuration: 900,
        successRedirectUrl: `${appUrl}/booking/success?token=${accessToken}`,
        failureRedirectUrl: `${appUrl}/booking/pool?date=${data.date}&slotIndex=${data.slotIndex}&serviceId=${service.id}&error=payment_cancelled`,
      })
      if (!deps.createPoolBooking) {
        await db
          .update(transactions)
          .set({ xenditInvoiceId: invoice.id, xenditPaymentUrl: invoice.invoiceUrl })
          .where(eq(transactions.id, created.transactionId))
      }
      return {
        success: true,
        data: {
          bookingId: created.bookingId,
          accessToken,
          paymentProvider: "xendit",
          paymentUrl: invoice.invoiceUrl,
          referenceNumber,
          netAmount,
          netAmountFormatted,
        },
      }
    }

    return {
      success: true,
      data: {
        bookingId: created.bookingId,
        accessToken,
        paymentProvider: "manual",
        redirectUrl: `/booking/manual-pending?token=${accessToken}`,
        referenceNumber,
        netAmount,
        netAmountFormatted,
      },
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Gagal memproses pemesanan" }
  }
}
