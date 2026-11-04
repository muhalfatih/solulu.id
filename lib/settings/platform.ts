import { eq } from "drizzle-orm"
import { db } from "@/db"
import { platformSettings } from "@/db/schema"
import { requireStaffUser } from "@/lib/auth/staff"
import { SUPERADMIN_ONLY } from "@/lib/auth/staff-role"
import { recordAudit } from "@/lib/audit/record"

export interface PlatformSettingsData {
  id?: string
  isScreeningRequired: boolean
  bookingCutoffHours: number
  rescheduleCutoffHours: number
  paymentHoldMinutes: number
  bookingCepatHoldMinutes: number
  maxSlotQuota: number
  minCounselorWeeklySlots: number
  noShowTimeoutMinutes: number
  basePrice: number | string
  isManualPaymentEnabled: boolean
  manualPaymentInstructions: string
  updatedAt?: Date | string
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsData = {
  id: "default",
  isScreeningRequired: false,
  bookingCutoffHours: 4,
  rescheduleCutoffHours: 4,
  paymentHoldMinutes: 15,
  bookingCepatHoldMinutes: 60,
  maxSlotQuota: 10,
  minCounselorWeeklySlots: 10,
  noShowTimeoutMinutes: 30,
  basePrice: 150000,
  isManualPaymentEnabled: true,
  // Tidak ada rekening bawaan (ADR-0013): Superadmin wajib mengisinya; kosong = keadaan kosong di UI.
  manualPaymentInstructions: "",
}

/**
 * Platform Settings dari PostgreSQL. Baris "default" di-seed dengan nilai SOP bila belum ada.
 * Gagal-tertutup (ADR-0013): galat database diteruskan ke pemanggil, tidak ada fallback di memori.
 */
export async function getPlatformSettings(): Promise<PlatformSettingsData> {
  const rows = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, "default"))
    .limit(1)

  if (rows.length === 0) {
    await db
      .insert(platformSettings)
      .values({
        id: "default",
        isScreeningRequired: DEFAULT_PLATFORM_SETTINGS.isScreeningRequired,
        bookingCutoffHours: DEFAULT_PLATFORM_SETTINGS.bookingCutoffHours,
        rescheduleCutoffHours: DEFAULT_PLATFORM_SETTINGS.rescheduleCutoffHours,
        paymentHoldMinutes: DEFAULT_PLATFORM_SETTINGS.paymentHoldMinutes,
        bookingCepatHoldMinutes: DEFAULT_PLATFORM_SETTINGS.bookingCepatHoldMinutes,
        maxSlotQuota: DEFAULT_PLATFORM_SETTINGS.maxSlotQuota,
        minCounselorWeeklySlots: DEFAULT_PLATFORM_SETTINGS.minCounselorWeeklySlots,
        noShowTimeoutMinutes: DEFAULT_PLATFORM_SETTINGS.noShowTimeoutMinutes,
        basePrice: String(DEFAULT_PLATFORM_SETTINGS.basePrice),
        isManualPaymentEnabled: DEFAULT_PLATFORM_SETTINGS.isManualPaymentEnabled,
        manualPaymentInstructions: DEFAULT_PLATFORM_SETTINGS.manualPaymentInstructions,
        updatedAt: new Date(),
      })
      .onConflictDoNothing()
    return { ...DEFAULT_PLATFORM_SETTINGS }
  }

  const row = rows[0]
  return {
    id: row.id,
    isScreeningRequired: Boolean(row.isScreeningRequired),
    bookingCutoffHours: row.bookingCutoffHours,
    rescheduleCutoffHours: row.rescheduleCutoffHours,
    paymentHoldMinutes: row.paymentHoldMinutes,
    bookingCepatHoldMinutes: row.bookingCepatHoldMinutes,
    maxSlotQuota: row.maxSlotQuota,
    minCounselorWeeklySlots: row.minCounselorWeeklySlots,
    noShowTimeoutMinutes: row.noShowTimeoutMinutes,
    basePrice: String(Number(row.basePrice)),
    isManualPaymentEnabled: Boolean(row.isManualPaymentEnabled),
    manualPaymentInstructions: row.manualPaymentInstructions ?? "",
    updatedAt: row.updatedAt,
  }
}

/** Cutoff Booking dari Platform Settings, dalam menit (dipakai daftar slot publik & checkout). */
export async function getBookingLeadTimeMinutes(): Promise<number> {
  return (await getPlatformSettings()).bookingCutoffHours * 60
}

export interface AuthContext {
  id: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

export interface UpdatePlatformSettingsOptions {
  currentUser?: AuthContext | null
  skipAuthCheck?: boolean
}

async function verifySuperadminPermission(
  customUser?: AuthContext | null
): Promise<boolean> {
  return (await requireStaffUser(customUser, SUPERADMIN_ONLY)) !== null
}

/**
 * Update platform settings with strict Superadmin role verification.
 */
export async function updatePlatformSettings(
  data: Partial<PlatformSettingsData>,
  options: UpdatePlatformSettingsOptions = {}
): Promise<PlatformSettingsData> {
  if (!options.skipAuthCheck) {
    const isSuper = await verifySuperadminPermission(options.currentUser)
    if (!isSuper) {
      throw new Error(
        "Akses ditolak: Hanya role Superadmin yang berwenang memperbarui parameter sistem platform."
      )
    }
  }

  // Validate operational ranges
  if (data.bookingCutoffHours !== undefined && (data.bookingCutoffHours < 1 || data.bookingCutoffHours > 72)) {
    throw new Error("Cutoff pemesanan baru harus antara 1 hingga 72 jam.")
  }
  if (data.rescheduleCutoffHours !== undefined && (data.rescheduleCutoffHours < 1 || data.rescheduleCutoffHours > 72)) {
    throw new Error("Cutoff reschedule harus antara 1 hingga 72 jam.")
  }
  if (data.paymentHoldMinutes !== undefined && (data.paymentHoldMinutes < 5 || data.paymentHoldMinutes > 60)) {
    throw new Error("Durasi kunci jadwal pembayaran harus antara 5 hingga 60 menit.")
  }
  if (
    data.bookingCepatHoldMinutes !== undefined &&
    (data.bookingCepatHoldMinutes < 15 || data.bookingCepatHoldMinutes > 240)
  ) {
    throw new Error("Durasi hold Booking Cepat harus antara 15 hingga 240 menit.")
  }
  if (data.maxSlotQuota !== undefined && (data.maxSlotQuota < 1 || data.maxSlotQuota > 50)) {
    throw new Error("Kuota maksimal per slot harus antara 1 hingga 50 sesi.")
  }
  if (data.noShowTimeoutMinutes !== undefined && (data.noShowTimeoutMinutes < 5 || data.noShowTimeoutMinutes > 120)) {
    throw new Error("Batas toleransi no-show harus antara 5 hingga 120 menit.")
  }
  if (data.minCounselorWeeklySlots !== undefined && (data.minCounselorWeeklySlots < 1 || data.minCounselorWeeklySlots > 50)) {
    throw new Error("Target minimal sesi mingguan konselor harus antara 1 hingga 50 sesi.")
  }

  // Gagal-tertutup: galat database diteruskan, tidak ada "sukses" di memori.
  {
    const current = await getPlatformSettings()

    const newRequired = data.isScreeningRequired !== undefined ? data.isScreeningRequired : current.isScreeningRequired
    const newBookingCutoff = data.bookingCutoffHours !== undefined ? data.bookingCutoffHours : current.bookingCutoffHours
    const newRescheduleCutoff = data.rescheduleCutoffHours !== undefined ? data.rescheduleCutoffHours : current.rescheduleCutoffHours
    const newHoldMinutes = data.paymentHoldMinutes !== undefined ? data.paymentHoldMinutes : current.paymentHoldMinutes
    const newCepatHold = data.bookingCepatHoldMinutes !== undefined ? data.bookingCepatHoldMinutes : current.bookingCepatHoldMinutes
    const newMaxQuota = data.maxSlotQuota !== undefined ? data.maxSlotQuota : current.maxSlotQuota
    const newWeeklyTarget = data.minCounselorWeeklySlots !== undefined ? data.minCounselorWeeklySlots : current.minCounselorWeeklySlots
    const newNoShowTimeout = data.noShowTimeoutMinutes !== undefined ? data.noShowTimeoutMinutes : current.noShowTimeoutMinutes
    const newBasePrice = data.basePrice !== undefined ? String(data.basePrice) : String(current.basePrice)
    const newManualEnabled = data.isManualPaymentEnabled !== undefined ? data.isManualPaymentEnabled : current.isManualPaymentEnabled
    const newManualInstructions = data.manualPaymentInstructions !== undefined ? data.manualPaymentInstructions : current.manualPaymentInstructions

    // Perubahan pengaturan + Jejak Audit commit/rollback bersama (#24).
    await db.transaction(async (tx) => {
      await tx
        .insert(platformSettings)
        .values({
          id: "default",
          isScreeningRequired: newRequired,
          bookingCutoffHours: newBookingCutoff,
          rescheduleCutoffHours: newRescheduleCutoff,
          paymentHoldMinutes: newHoldMinutes,
          bookingCepatHoldMinutes: newCepatHold,
          maxSlotQuota: newMaxQuota,
          minCounselorWeeklySlots: newWeeklyTarget,
          noShowTimeoutMinutes: newNoShowTimeout,
          basePrice: newBasePrice,
          isManualPaymentEnabled: newManualEnabled,
          manualPaymentInstructions: newManualInstructions,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: platformSettings.id,
          set: {
            isScreeningRequired: newRequired,
            bookingCutoffHours: newBookingCutoff,
            rescheduleCutoffHours: newRescheduleCutoff,
            paymentHoldMinutes: newHoldMinutes,
            bookingCepatHoldMinutes: newCepatHold,
            maxSlotQuota: newMaxQuota,
            minCounselorWeeklySlots: newWeeklyTarget,
            noShowTimeoutMinutes: newNoShowTimeout,
            basePrice: newBasePrice,
            isManualPaymentEnabled: newManualEnabled,
            manualPaymentInstructions: newManualInstructions,
            updatedAt: new Date(),
          },
        })
      await recordAudit(tx, {
        actor: options.currentUser,
        action: "settings.update",
        entityType: "platform_settings",
        entityId: "default",
        before: current,
        after: {
          ...current,
          isScreeningRequired: newRequired,
          bookingCutoffHours: newBookingCutoff,
          rescheduleCutoffHours: newRescheduleCutoff,
          paymentHoldMinutes: newHoldMinutes,
          bookingCepatHoldMinutes: newCepatHold,
          maxSlotQuota: newMaxQuota,
          minCounselorWeeklySlots: newWeeklyTarget,
          noShowTimeoutMinutes: newNoShowTimeout,
          basePrice: newBasePrice,
          isManualPaymentEnabled: newManualEnabled,
          manualPaymentInstructions: newManualInstructions,
        },
      })
    })

  }

  return getPlatformSettings()
}
