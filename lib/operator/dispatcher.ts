import { FIXED_SLOTS, type FixedSlot, type ZoomMode } from "./types"

/**
 * Determines whether a slot runs in Standalone Mode or Zoom 4 Breakout Mode.
 * SOP Rule:
 * - Sessions 1 to 4 (<= 4 total sessions in slot): Standalone Mode (Zoom 1-4 direct join)
 * - Sessions > 4: Zoom 4 Breakout Mode (Sessions 1-3 on Zoom 1-3; Session 4+ on Zoom 4 Breakout Rooms guided by Operator)
 */
export function determineSlotMode(sessionCount: number): ZoomMode {
  return sessionCount > 4 ? "breakout_room" : "standalone"
}

/**
 * Formats the exact Breakout Room name string required by Solulu Master SOP:
 * `[Kode Booking] - [Nama Konselor]`
 * Example: "SL-4821 - Dimas (Konselor)" or "SL-1001 - Dr. Sarah"
 */
export function formatBreakoutRoomName(
  bookingCode: string,
  counselorName: string
): string {
  const code = (bookingCode || "").trim()
  const counselor = (counselorName || "").trim()
  if (!code && !counselor) return "Breakout Room"
  if (!code) return counselor
  if (!counselor) return code
  return `${code} - ${counselor}`
}

/**
 * Formats a batch multiline string containing all breakout room names for a given slot.
 * Used by the Operator for 1-click clipboard batch copy into Zoom desktop client.
 */
export function generateBatchBreakoutNames(
  sessions: Array<{
    bookingCode: string
    counselorName: string
    zoomAllocationMode?: string | null
  }>
): string {
  if (!sessions || sessions.length === 0) return ""

  return sessions
    .map((s) => formatBreakoutRoomName(s.bookingCode, s.counselorName))
    .filter(Boolean)
    .join("\n")
}

/**
 * Generates the standardized Waiting Room chat guidance template.
 * Sent by the Operator to clients in Zoom 4 Waiting Room with incorrect display names.
 */
export function generateWaitingRoomChatTemplate(options?: {
  bookingCode?: string
  patientName?: string
  counselorName?: string
}): string {
  const greeting = options?.patientName
    ? `Halo Kak ${options.patientName.trim()},`
    : "Halo Kak,"

  const targetFormat =
    options?.bookingCode && options?.patientName
      ? `${options.bookingCode.trim()} - ${options.patientName.trim()}`
      : "[Kode Booking] - [Nama Panggilan] (contoh: SL-1001 - Budi)"

  return `${greeting} selamat datang di ruang konseling Solulu Mental Health.

Mohon ubah nama tampilan (Display Name) Zoom Kakak menjadi format berikut:
👉 ${targetFormat}

Langkah mengubah nama di Zoom:
1. Klik menu 'Participants' di bawah layar.
2. Cari nama akun Kakak, lalu klik 'More' (atau titik tiga).
3. Pilih 'Rename' dan masukkan format nama di atas.

Operator kami akan segera mengarahkan Kakak ke Breakout Room privat bersama konselor yang bertugas. Terima kasih!`
}

/**
 * Determines the currently active slot based on the given time (defaults to current WIB time: UTC+7).
 */
export function getCurrentSlotIndex(referenceDate?: Date): number | null {
  const now = referenceDate || new Date()

  // Convert to UTC+7 (WIB)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const wibTime = new Date(utc + 3600000 * 7)

  const hours = wibTime.getHours()
  const minutes = wibTime.getMinutes()
  const totalMinutes = hours * 60 + minutes

  for (const slot of FIXED_SLOTS) {
    const [startH, startM] = slot.startTime.split(":").map(Number)
    const [endH, endM] = slot.endTime.split(":").map(Number)
    const startTotal = startH * 60 + (startM || 0)
    const endTotal = endH * 60 + (endM || 0)

    if (totalMinutes >= startTotal && totalMinutes < endTotal) {
      return slot.slotIndex
    }
  }

  return null
}

/**
 * Dispatches Zoom Pro account and mode according to Master SOP 4-Zoom Hybrid algorithm:
 * - Session rank 1..3: Zoom 1, 2, 3 in standalone mode.
 * - Session rank 4: If totalInSlot <= 4 -> Zoom 4 in standalone; If totalInSlot > 4 -> Zoom 4 in breakout_room.
 * - Session rank 5..10: Zoom 4 in breakout_room mode.
 */
export function dispatchZoomForSession(
  sessionRank: number,
  totalInSlot: number
): { accountNumber: number; mode: ZoomMode } {
  if (sessionRank <= 3) {
    return { accountNumber: sessionRank, mode: "standalone" }
  }

  if (sessionRank === 4) {
    return {
      accountNumber: 4,
      mode: totalInSlot <= 4 ? "standalone" : "breakout_room",
    }
  }

  return { accountNumber: 4, mode: "breakout_room" }
}

/**
 * Formats date into readable Indonesian string, e.g. "Jumat, 16 Oktober 2026".
 */
export function formatIndonesianDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  } catch {
    return dateStr
  }
}

/**
 * Returns today's date in WIB timezone formatted as `YYYY-MM-DD`.
 */
export function getTodayWibDateString(): string {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const wibTime = new Date(utc + 3600000 * 7)

  const y = wibTime.getFullYear()
  const m = String(wibTime.getMonth() + 1).padStart(2, "0")
  const d = String(wibTime.getDate()).padStart(2, "0")

  return `${y}-${m}-${d}`
}
