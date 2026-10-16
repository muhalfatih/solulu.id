import { eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { platformSettings } from "@/db/schema"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export interface PlatformSettingsData {
  id?: string
  isScreeningRequired: boolean
  bookingCutoffHours: number
  rescheduleCutoffHours: number
  paymentHoldMinutes: number
  maxSlotQuota: number
  minCounselorWeeklySlots: number
  noShowTimeoutMinutes: number
  basePrice: number | string
  counselorExtendFeePer30Min: number | string
  psychologistExtendFeePer30Min: number | string
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
  maxSlotQuota: 10,
  minCounselorWeeklySlots: 10,
  noShowTimeoutMinutes: 30,
  basePrice: 150000,
  counselorExtendFeePer30Min: 35000,
  psychologistExtendFeePer30Min: 50000,
  isManualPaymentEnabled: true,
  manualPaymentInstructions:
    "Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.",
}

// In-memory cache for ultra-fast reads & resilience
let cachedSettings: PlatformSettingsData = { ...DEFAULT_PLATFORM_SETTINGS }

let isTableInitialized = false
let isDbAvailable = true

async function ensureSettingsTable(): Promise<void> {
  if (isTableInitialized) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id text PRIMARY KEY DEFAULT 'default',
        is_screening_required boolean NOT NULL DEFAULT false,
        booking_cutoff_hours integer NOT NULL DEFAULT 4,
        reschedule_cutoff_hours integer NOT NULL DEFAULT 4,
        payment_hold_minutes integer NOT NULL DEFAULT 15,
        max_slot_quota integer NOT NULL DEFAULT 10,
        min_counselor_weekly_slots integer NOT NULL DEFAULT 10,
        no_show_timeout_minutes integer NOT NULL DEFAULT 30,
        base_price numeric(12, 2) NOT NULL DEFAULT '150000',
        counselor_extend_fee_per_30_min numeric(12, 2) NOT NULL DEFAULT '35000',
        psychologist_extend_fee_per_30_min numeric(12, 2) NOT NULL DEFAULT '50000',
        is_manual_payment_enabled boolean NOT NULL DEFAULT true,
        manual_payment_instructions text DEFAULT 'Transfer ke Rekening BCA: 123-456-7890 a.n. Solulu Mental Health. Sertakan Kode Booking pada berita transfer.',
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `)
    isTableInitialized = true
    isDbAvailable = true
  } catch (error) {
    isTableInitialized = true
    isDbAvailable = false
    console.warn("[settings] Table auto-ensure skipped:", error)
  }
}

/**
 * Get current platform settings from PostgreSQL.
 * Defaults to Master SOP values.
 */
export async function getPlatformSettings(): Promise<PlatformSettingsData> {
  if (!isDbAvailable) return { ...cachedSettings }
  try {
    await ensureSettingsTable()
    if (!isDbAvailable) return { ...cachedSettings }

    const rows = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"))
      .limit(1)

    if (rows.length > 0) {
      const row = rows[0]
      cachedSettings = {
        id: row.id,
        isScreeningRequired: Boolean(row.isScreeningRequired),
        bookingCutoffHours: row.bookingCutoffHours ?? DEFAULT_PLATFORM_SETTINGS.bookingCutoffHours,
        rescheduleCutoffHours: row.rescheduleCutoffHours ?? DEFAULT_PLATFORM_SETTINGS.rescheduleCutoffHours,
        paymentHoldMinutes: row.paymentHoldMinutes ?? DEFAULT_PLATFORM_SETTINGS.paymentHoldMinutes,
        maxSlotQuota: row.maxSlotQuota ?? DEFAULT_PLATFORM_SETTINGS.maxSlotQuota,
        minCounselorWeeklySlots: row.minCounselorWeeklySlots ?? DEFAULT_PLATFORM_SETTINGS.minCounselorWeeklySlots,
        noShowTimeoutMinutes: row.noShowTimeoutMinutes ?? DEFAULT_PLATFORM_SETTINGS.noShowTimeoutMinutes,
        basePrice: row.basePrice ? String(Number(row.basePrice)) : String(DEFAULT_PLATFORM_SETTINGS.basePrice),
        counselorExtendFeePer30Min: row.counselorExtendFeePer30Min ? String(Number(row.counselorExtendFeePer30Min)) : String(DEFAULT_PLATFORM_SETTINGS.counselorExtendFeePer30Min),
        psychologistExtendFeePer30Min: row.psychologistExtendFeePer30Min ? String(Number(row.psychologistExtendFeePer30Min)) : String(DEFAULT_PLATFORM_SETTINGS.psychologistExtendFeePer30Min),
        isManualPaymentEnabled: Boolean(row.isManualPaymentEnabled),
        manualPaymentInstructions: row.manualPaymentInstructions ?? DEFAULT_PLATFORM_SETTINGS.manualPaymentInstructions,
        updatedAt: row.updatedAt,
      }
    } else {
      // Seed default row if empty
      await db
        .insert(platformSettings)
        .values({
          id: "default",
          isScreeningRequired: DEFAULT_PLATFORM_SETTINGS.isScreeningRequired,
          bookingCutoffHours: DEFAULT_PLATFORM_SETTINGS.bookingCutoffHours,
          rescheduleCutoffHours: DEFAULT_PLATFORM_SETTINGS.rescheduleCutoffHours,
          paymentHoldMinutes: DEFAULT_PLATFORM_SETTINGS.paymentHoldMinutes,
          maxSlotQuota: DEFAULT_PLATFORM_SETTINGS.maxSlotQuota,
          minCounselorWeeklySlots: DEFAULT_PLATFORM_SETTINGS.minCounselorWeeklySlots,
          noShowTimeoutMinutes: DEFAULT_PLATFORM_SETTINGS.noShowTimeoutMinutes,
          basePrice: String(DEFAULT_PLATFORM_SETTINGS.basePrice),
          counselorExtendFeePer30Min: String(DEFAULT_PLATFORM_SETTINGS.counselorExtendFeePer30Min),
          psychologistExtendFeePer30Min: String(DEFAULT_PLATFORM_SETTINGS.psychologistExtendFeePer30Min),
          isManualPaymentEnabled: DEFAULT_PLATFORM_SETTINGS.isManualPaymentEnabled,
          manualPaymentInstructions: DEFAULT_PLATFORM_SETTINGS.manualPaymentInstructions,
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
    }
  } catch (error) {
    isDbAvailable = false
    console.warn("[settings] Failed to read platform_settings from DB, using fallback:", error)
  }

  return { ...cachedSettings }
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
  if (customUser !== undefined) {
    if (!customUser) return false
    const role = customUser.app_metadata?.role || customUser.user_metadata?.role
    return role === "superadmin"
  }

  try {
    const cookieStore = await cookies()
    const demoRole = cookieStore.get("solulu_demo_role")?.value
    if (demoRole === "superadmin") {
      return true
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false
    const role = user.app_metadata?.role || user.user_metadata?.role
    return role === "superadmin"
  } catch {
    return false
  }
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
  if (data.maxSlotQuota !== undefined && (data.maxSlotQuota < 1 || data.maxSlotQuota > 50)) {
    throw new Error("Kuota maksimal per slot harus antara 1 hingga 50 sesi.")
  }
  if (data.noShowTimeoutMinutes !== undefined && (data.noShowTimeoutMinutes < 5 || data.noShowTimeoutMinutes > 120)) {
    throw new Error("Batas toleransi no-show harus antara 5 hingga 120 menit.")
  }
  if (data.minCounselorWeeklySlots !== undefined && (data.minCounselorWeeklySlots < 1 || data.minCounselorWeeklySlots > 50)) {
    throw new Error("Target minimal sesi mingguan konselor harus antara 1 hingga 50 sesi.")
  }
  if (data.counselorExtendFeePer30Min !== undefined && Number(data.counselorExtendFeePer30Min) < 0) {
    throw new Error("Tarif perpanjangan konselor sebaya tidak boleh negatif.")
  }
  if (data.psychologistExtendFeePer30Min !== undefined && Number(data.psychologistExtendFeePer30Min) < 0) {
    throw new Error("Tarif perpanjangan psikolog klinis tidak boleh negatif.")
  }

  try {
    await ensureSettingsTable()

    const current = await getPlatformSettings()

    const newRequired = data.isScreeningRequired !== undefined ? data.isScreeningRequired : current.isScreeningRequired
    const newBookingCutoff = data.bookingCutoffHours !== undefined ? data.bookingCutoffHours : current.bookingCutoffHours
    const newRescheduleCutoff = data.rescheduleCutoffHours !== undefined ? data.rescheduleCutoffHours : current.rescheduleCutoffHours
    const newHoldMinutes = data.paymentHoldMinutes !== undefined ? data.paymentHoldMinutes : current.paymentHoldMinutes
    const newMaxQuota = data.maxSlotQuota !== undefined ? data.maxSlotQuota : current.maxSlotQuota
    const newWeeklyTarget = data.minCounselorWeeklySlots !== undefined ? data.minCounselorWeeklySlots : current.minCounselorWeeklySlots
    const newNoShowTimeout = data.noShowTimeoutMinutes !== undefined ? data.noShowTimeoutMinutes : current.noShowTimeoutMinutes
    const newBasePrice = data.basePrice !== undefined ? String(data.basePrice) : String(current.basePrice)
    const newCounselorExtend = data.counselorExtendFeePer30Min !== undefined ? String(data.counselorExtendFeePer30Min) : String(current.counselorExtendFeePer30Min)
    const newPsychologistExtend = data.psychologistExtendFeePer30Min !== undefined ? String(data.psychologistExtendFeePer30Min) : String(current.psychologistExtendFeePer30Min)
    const newManualEnabled = data.isManualPaymentEnabled !== undefined ? data.isManualPaymentEnabled : current.isManualPaymentEnabled
    const newManualInstructions = data.manualPaymentInstructions !== undefined ? data.manualPaymentInstructions : current.manualPaymentInstructions

    await db
      .insert(platformSettings)
      .values({
        id: "default",
        isScreeningRequired: newRequired,
        bookingCutoffHours: newBookingCutoff,
        rescheduleCutoffHours: newRescheduleCutoff,
        paymentHoldMinutes: newHoldMinutes,
        maxSlotQuota: newMaxQuota,
        minCounselorWeeklySlots: newWeeklyTarget,
        noShowTimeoutMinutes: newNoShowTimeout,
        basePrice: newBasePrice,
        counselorExtendFeePer30Min: newCounselorExtend,
        psychologistExtendFeePer30Min: newPsychologistExtend,
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
          maxSlotQuota: newMaxQuota,
          minCounselorWeeklySlots: newWeeklyTarget,
          noShowTimeoutMinutes: newNoShowTimeout,
          basePrice: newBasePrice,
          counselorExtendFeePer30Min: newCounselorExtend,
          psychologistExtendFeePer30Min: newPsychologistExtend,
          isManualPaymentEnabled: newManualEnabled,
          manualPaymentInstructions: newManualInstructions,
          updatedAt: new Date(),
        },
      })

    cachedSettings = {
      id: "default",
      isScreeningRequired: newRequired,
      bookingCutoffHours: newBookingCutoff,
      rescheduleCutoffHours: newRescheduleCutoff,
      paymentHoldMinutes: newHoldMinutes,
      maxSlotQuota: newMaxQuota,
      minCounselorWeeklySlots: newWeeklyTarget,
      noShowTimeoutMinutes: newNoShowTimeout,
      basePrice: newBasePrice,
      counselorExtendFeePer30Min: newCounselorExtend,
      psychologistExtendFeePer30Min: newPsychologistExtend,
      isManualPaymentEnabled: newManualEnabled,
      manualPaymentInstructions: newManualInstructions,
      updatedAt: new Date(),
    }
  } catch (error: any) {
    if (error?.message?.includes("Akses ditolak") || error?.message?.includes("harus antara") || error?.message?.includes("tidak boleh")) {
      throw error
    }
    console.error("[settings] Failed to persist platform_settings to DB, updating in-memory:", error)
    cachedSettings = {
      ...cachedSettings,
      ...data,
      updatedAt: new Date(),
    }
  }

  return { ...cachedSettings }
}
