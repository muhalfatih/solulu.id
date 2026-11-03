import { eq, and, lt, inArray, isNull, isNotNull, sql } from "drizzle-orm"
import { db } from "@/db"
import { bookings, schedules, transactions, vouchers } from "@/db/schema"
import { SLOT_HOLD_MINUTES } from "@/lib/booking/hold"

export interface CleanupResult {
  success: boolean
  releasedSlotsCount: number
  expiredBookingsCount: number
  expiredTransactionsCount: number
  vouchersRolledBackCount: number
  autoArchivedSessionsCount: number
  error?: string
}

export interface CleanupDependencies {
  now?: Date
  findExpiredReservedSlots?: (now: Date) => Promise<Array<{
    scheduleId: string
    bookingId?: string | null
    transactionId?: string | null
    voucherId?: string | null
  }>>
  findSessionsToArchive?: (now: Date) => Promise<Array<{ bookingId: string }>>
  executeCleanupTransaction?: (data: {
    scheduleIds: string[]
    bookingIds: string[]
    transactionIds: string[]
    voucherIds: string[]
    archiveBookingIds: string[]
  }) => Promise<void>
}

/**
 * Helper to determine if a session ended more than 2 hours ago (in WIB, UTC+7).
 */
export function isSessionPastTwoHours(
  sessionDate: string,
  endTime: string,
  now: Date = new Date()
): boolean {
  const normalizedTime = endTime.length === 5 ? `${endTime}:00` : endTime
  const sessionEndTimeUtc = new Date(`${sessionDate}T${normalizedTime}+07:00`)
  const twoHoursMs = 2 * 60 * 60 * 1000
  return now.getTime() - sessionEndTimeUtc.getTime() > twoHoursMs
}

/**
 * Marks held (pending_payment) bookings whose slot hold lapsed as 'expired' (ADR-0008).
 * Returns the number of bookings expired.
 */
export async function expireHeldBookings(
  tx: Pick<typeof db, "update">,
  bookingIds: string[]
): Promise<number> {
  if (bookingIds.length === 0) return 0
  await tx
    .update(bookings)
    .set({ status: "expired" })
    .where(inArray(bookings.id, bookingIds))
  return bookingIds.length
}

export interface PoolHoldRow {
  bookingId: string
  transactionId: string | null
  transactionStatus: string | null
  voucherId: string | null
}

/**
 * Booking Konselor Bebas tidak punya baris jadwal yang ditahan, jadi hold-nya
 * kedaluwarsa SLOT_HOLD_MINUTES setelah booking dibuat. Murni, untuk diuji tanpa DB.
 */
export function isPoolHoldExpired(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() > SLOT_HOLD_MINUTES * 60_000
}

/** Rencana pelepasan hold pool: booking yang dikedaluwarsakan, transaksi PENDING, dan voucher yang dikembalikan. */
export function planPoolHoldExpiry(rows: PoolHoldRow[]) {
  const unique = (xs: (string | null)[]) => Array.from(new Set(xs.filter((x): x is string => Boolean(x))))
  return {
    bookingIds: unique(rows.map((r) => r.bookingId)),
    transactionIds: unique(rows.filter((r) => r.transactionStatus === "PENDING").map((r) => r.transactionId)),
    voucherIds: rows.filter((r) => r.transactionStatus === "PENDING" && r.voucherId).map((r) => r.voucherId as string),
  }
}

/** Mengkedaluwarsakan hold booking pool (pending_payment tanpa konselor) yang lewat batas. */
async function expirePoolHolds(tx: Pick<typeof db, "select" | "update">, now: Date) {
  const cutoff = new Date(now.getTime() - SLOT_HOLD_MINUTES * 60_000)
  const rows = await tx
    .select({
      bookingId: bookings.id,
      transactionId: transactions.id,
      transactionStatus: transactions.status,
      voucherId: transactions.voucherId,
    })
    .from(bookings)
    .leftJoin(transactions, eq(bookings.id, transactions.bookingId))
    .where(
      and(
        eq(bookings.status, "pending_payment"),
        isNull(bookings.counselorId),
        isNotNull(bookings.poolDate),
        lt(bookings.createdAt, cutoff)
      )
    )
  const plan = planPoolHoldExpiry(rows)
  const expiredBookings = await expireHeldBookings(tx, plan.bookingIds)
  if (plan.transactionIds.length > 0) {
    await tx.update(transactions).set({ status: "EXPIRED" }).where(inArray(transactions.id, plan.transactionIds))
  }
  for (const vId of plan.voucherIds) {
    await tx
      .update(vouchers)
      .set({ usedCount: sql`GREATEST(0, ${vouchers.usedCount} - 1)` })
      .where(eq(vouchers.id, vId))
  }
  return {
    expiredBookings,
    expiredTransactions: plan.transactionIds.length,
    vouchersRolledBack: plan.voucherIds.length,
  }
}

/**
 * Executes atomic cleanup of expired slot holds and auto-archives completed sessions.
 * Adheres to US-58, US-90, and ADR-0001:
 * 1. Releases expired reserved slots (reserved_until < NOW()) back to 'available'
 * 2. Expires associated bookings ('pending_payment' -> 'expired')
 * 3. Expires associated transactions ('PENDING' -> 'EXPIRED')
 * 4. Rolls back voucher usedCount for expired bookings that used a voucher
 * 5. Auto-archives confirmed sessions >2 hours past endTime to 'completed'
 */
export async function executeSlotCleanupAndArchiving(
  deps: CleanupDependencies = {}
): Promise<CleanupResult> {
  try {
    const now = deps.now ?? new Date()

    // 1. Dependency injection path for unit testing
    if (deps.executeCleanupTransaction && deps.findExpiredReservedSlots && deps.findSessionsToArchive) {
      const expiredData = await deps.findExpiredReservedSlots(now)
      const sessionsToArchive = await deps.findSessionsToArchive(now)

      const scheduleIds = expiredData.map((d) => d.scheduleId).filter(Boolean)
      const bookingIds = expiredData.map((d) => d.bookingId).filter((id): id is string => Boolean(id))
      const transactionIds = expiredData.map((d) => d.transactionId).filter((id): id is string => Boolean(id))
      const voucherIds = expiredData.map((d) => d.voucherId).filter((id): id is string => Boolean(id))
      const archiveBookingIds = sessionsToArchive.map((s) => s.bookingId)

      await deps.executeCleanupTransaction({
        scheduleIds,
        bookingIds,
        transactionIds,
        voucherIds,
        archiveBookingIds,
      })

      return {
        success: true,
        releasedSlotsCount: scheduleIds.length,
        expiredBookingsCount: bookingIds.length,
        expiredTransactionsCount: transactionIds.length,
        vouchersRolledBackCount: voucherIds.length,
        autoArchivedSessionsCount: archiveBookingIds.length,
      }
    }

    // 2. Production Database Execution (Atomic Transaction)
    let releasedSlotsCount = 0
    let expiredBookingsCount = 0
    let expiredTransactionsCount = 0
    let vouchersRolledBackCount = 0
    let autoArchivedSessionsCount = 0

    await db.transaction(async (tx) => {
      // Step A: Find expired reserved slots (status = 'reserved' AND reserved_until < NOW())
      const expiredSlots = await tx
        .select({
          scheduleId: schedules.id,
          bookingId: bookings.id,
          bookingStatus: bookings.status,
          transactionId: transactions.id,
          transactionStatus: transactions.status,
          voucherId: transactions.voucherId,
        })
        .from(schedules)
        .leftJoin(bookings, eq(schedules.id, bookings.scheduleId))
        .leftJoin(transactions, eq(bookings.id, transactions.bookingId))
        .where(
          and(
            eq(schedules.status, "reserved"),
            lt(schedules.reservedUntil, now)
          )
        )

      if (expiredSlots.length > 0) {
        const scheduleIds = Array.from(new Set(expiredSlots.map((s) => s.scheduleId)))
        const bookingIds = Array.from(
          new Set(
            expiredSlots
              .filter((s) => s.bookingId && s.bookingStatus === "pending_payment")
              .map((s) => s.bookingId as string)
          )
        )
        const transactionIds = Array.from(
          new Set(
            expiredSlots
              .filter((s) => s.transactionId && s.transactionStatus === "PENDING")
              .map((s) => s.transactionId as string)
          )
        )
        const voucherIdsToRollback = expiredSlots
          .filter((s) => s.bookingStatus === "pending_payment" && s.voucherId)
          .map((s) => s.voucherId as string)

        // (1) Release schedules
        if (scheduleIds.length > 0) {
          await tx
            .update(schedules)
            .set({
              status: "available",
              reservedUntil: null,
            })
            .where(inArray(schedules.id, scheduleIds))
          releasedSlotsCount = scheduleIds.length
        }

        // (2) Expire associated bookings
        expiredBookingsCount = await expireHeldBookings(tx, bookingIds)

        // (3) Expire associated transactions
        if (transactionIds.length > 0) {
          await tx
            .update(transactions)
            .set({
              status: "EXPIRED",
            })
            .where(inArray(transactions.id, transactionIds))
          expiredTransactionsCount = transactionIds.length
        }

        // (4) Rollback voucher usedCount
        for (const vId of voucherIdsToRollback) {
          await tx
            .update(vouchers)
            .set({
              usedCount: sql`GREATEST(0, ${vouchers.usedCount} - 1)`,
            })
            .where(eq(vouchers.id, vId))
          vouchersRolledBackCount++
        }
      }

      // Step A2: hold booking Konselor Bebas (tanpa baris jadwal) yang lewat batas
      const poolExpiry = await expirePoolHolds(tx, now)
      expiredBookingsCount += poolExpiry.expiredBookings
      expiredTransactionsCount += poolExpiry.expiredTransactions
      vouchersRolledBackCount += poolExpiry.vouchersRolledBack

      // Step B: Auto-archive sessions >2 hours past endTime (status = 'confirmed' -> 'completed')
      // Find confirmed sessions
      const confirmedSessions = await tx
        .select({
          bookingId: bookings.id,
          date: schedules.date,
          endTime: schedules.endTime,
        })
        .from(bookings)
        .innerJoin(schedules, eq(bookings.scheduleId, schedules.id))
        .where(eq(bookings.status, "confirmed"))

      const toArchiveIds = confirmedSessions
        .filter((session) => isSessionPastTwoHours(session.date, session.endTime, now))
        .map((session) => session.bookingId)

      if (toArchiveIds.length > 0) {
        await tx
          .update(bookings)
          .set({
            status: "completed",
          })
          .where(inArray(bookings.id, toArchiveIds))
        autoArchivedSessionsCount = toArchiveIds.length
      }
    })

    return {
      success: true,
      releasedSlotsCount,
      expiredBookingsCount,
      expiredTransactionsCount,
      vouchersRolledBackCount,
      autoArchivedSessionsCount,
    }
  } catch (error: any) {
    console.error("Error executing slot cleanup and auto-archiving:", error)
    return {
      success: false,
      releasedSlotsCount: 0,
      expiredBookingsCount: 0,
      expiredTransactionsCount: 0,
      vouchersRolledBackCount: 0,
      autoArchivedSessionsCount: 0,
      error: error?.message || "Failed to execute cleanup",
    }
  }
}
