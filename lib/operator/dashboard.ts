/**
 * Dashboard Operator (#34). Operator tidak boleh menerima angka keuangan
 * (PRD v9, CONTEXT: Operator), jadi seluruh data dashboard lewat proyeksi
 * whitelist di bawah ini: field yang tidak disebut eksplisit tidak pernah
 * keluar, walau store mengembalikan baris yang lebih lebar.
 * Pure: tidak mengimpor `@/db`; store Drizzle ada di `./dashboard-store`.
 */
import { FIXED_SLOTS, type ZoomMode } from "./types"
import { determineSlotMode } from "./dispatcher"
import type { WaTemplateKey } from "@/lib/whatsapp/templates"

export const ZOOM_ACCOUNT_COUNT = 4
export const DISPATCH_PREVIEW_LIMIT = 8

export interface RawSlotCount {
  slotIndex: number
  sessionCount: number
}

export interface RawZoomAccount {
  accountNumber: number
  name: string
  isActive: boolean
  /** Jumlah sesi hari ini yang memakai akun ini. */
  sessionsToday: number
}

export interface RawDispatchRow {
  bookingId: string
  bookingCode: string
  patientName: string
  counselorName: string
  scheduleDate: string
  timeRange: string
  kind: WaTemplateKey
}

export interface OperatorDashboardStore {
  slotCounts(date: string): Promise<RawSlotCount[]>
  zoomAccounts(date: string): Promise<RawZoomAccount[]>
  pendingDispatch(opts: { limit: number; today: string }): Promise<{ rows: RawDispatchRow[]; total: number }>
}

export interface OperatorDashboardSlot {
  slotIndex: number
  label: string
  displayTime: string
  sessionCount: number
  mode: ZoomMode
}

export type ZoomAccountState = "active" | "inactive" | "missing"

export interface OperatorDashboardZoomAccount {
  accountNumber: number
  name: string
  state: ZoomAccountState
  sessionsToday: number
}

export interface OperatorDashboardDispatchRow {
  bookingId: string
  bookingCode: string
  patientName: string
  counselorName: string
  scheduleDate: string
  timeRange: string
  kind: WaTemplateKey
}

export interface OperatorDashboardData {
  date: string
  totalSessions: number
  breakoutSlots: number
  slots: OperatorDashboardSlot[]
  zoomAccounts: OperatorDashboardZoomAccount[]
  pendingDispatch: { total: number; rows: OperatorDashboardDispatchRow[] }
}

export function projectSlots(counts: readonly RawSlotCount[]): OperatorDashboardSlot[] {
  return FIXED_SLOTS.map((slot) => {
    const sessionCount = counts.find((c) => c.slotIndex === slot.slotIndex)?.sessionCount ?? 0
    return {
      slotIndex: slot.slotIndex,
      label: slot.label,
      displayTime: slot.displayTime,
      sessionCount,
      mode: determineSlotMode(sessionCount),
    }
  })
}

/** Selalu 4 entri (Zoom 1-4); akun yang belum dikonfigurasi ditandai "missing". */
export function projectZoomAccounts(raw: readonly RawZoomAccount[]): OperatorDashboardZoomAccount[] {
  return Array.from({ length: ZOOM_ACCOUNT_COUNT }, (_, i) => {
    const number = i + 1
    const account = raw.find((a) => a.accountNumber === number)
    if (!account) {
      return { accountNumber: number, name: `Akun Zoom Pro ${number}`, state: "missing" as const, sessionsToday: 0 }
    }
    return {
      accountNumber: number,
      name: account.name,
      state: account.isActive ? ("active" as const) : ("inactive" as const),
      sessionsToday: account.sessionsToday,
    }
  })
}

export async function loadOperatorDashboard(input: {
  today: string
  store: OperatorDashboardStore
}): Promise<OperatorDashboardData> {
  const { today, store } = input
  const [counts, accounts, dispatch] = await Promise.all([
    store.slotCounts(today),
    store.zoomAccounts(today),
    store.pendingDispatch({ limit: DISPATCH_PREVIEW_LIMIT, today }),
  ])
  const slots = projectSlots(counts)
  return {
    date: today,
    totalSessions: slots.reduce((sum, s) => sum + s.sessionCount, 0),
    breakoutSlots: slots.filter((s) => s.mode === "breakout_room").length,
    slots,
    zoomAccounts: projectZoomAccounts(accounts),
    pendingDispatch: {
      total: dispatch.total,
      rows: dispatch.rows.map((r) => ({
        bookingId: r.bookingId,
        bookingCode: r.bookingCode,
        patientName: r.patientName,
        counselorName: r.counselorName,
        scheduleDate: r.scheduleDate,
        timeRange: r.timeRange,
        kind: r.kind,
      })),
    },
  }
}
