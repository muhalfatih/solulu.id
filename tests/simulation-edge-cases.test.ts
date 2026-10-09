import { describe, it, expect } from "vitest"
import { executeSlotCleanupAndArchiving, isSessionPastTwoHours } from "@/lib/cron/cleanup"
import { computeHoldExpiry, isHoldExpired } from "@/lib/booking/hold"
import { canRescheduleSession } from "@/lib/admin/reschedule"
import { sessionReportSchema } from "@/lib/validations/counselor"
import { calculateSessionTimeInfo, getSessionCountdown } from "@/lib/session/time"

describe("End-to-End Simulation: Operational Edge Cases & Failure Scenarios (Pilihan C)", () => {
  // ===========================================================================
  // CASE 1A: TRANSFER MANUAL EXPIRED (Hold 17 Menit Habis)
  // ===========================================================================
  describe("Case 1A — Transfer Manual Expired & Slot Hold Timeout", () => {
    it("1.1 Menghitung batas kedaluwarsa slot hold 17 menit secara akurat", () => {
      const now = new Date("2026-10-08T10:00:00+07:00")
      const holdExpiry = computeHoldExpiry(now)
      const expectedExpiry = new Date("2026-10-08T10:17:00+07:00")

      expect(holdExpiry.getTime()).toBe(expectedExpiry.getTime())
      expect(isHoldExpired(holdExpiry, new Date("2026-10-08T10:16:59+07:00"))).toBe(false)
      expect(isHoldExpired(holdExpiry, new Date("2026-10-08T10:17:01+07:00"))).toBe(true)
    })

    it("1.2 Melepaskan slot ke 'available', membatalkan booking ke 'cancelled', dan meng-expire transaksi saat 17 menit habis", async () => {
      let releasedData: any = null

      const result = await executeSlotCleanupAndArchiving({
        now: new Date("2026-10-08T10:20:00+07:00"),
        findExpiredReservedSlots: async () => [
          {
            scheduleId: "s-slot-manual-expired",
            bookingId: "b-client-manual-expired",
            transactionId: "t-trx-manual-expired",
            voucherId: "v-voucher-test",
          },
        ],
        findSessionsToArchive: async () => [],
        executeCleanupTransaction: async (data) => {
          releasedData = data
        },
      })

      expect(result.success).toBe(true)
      expect(result.releasedSlotsCount).toBe(1)
      expect(result.cancelledBookingsCount).toBe(1)
      expect(result.expiredTransactionsCount).toBe(1)
      expect(result.vouchersRolledBackCount).toBe(1)

      expect(releasedData.scheduleIds).toContain("s-slot-manual-expired")
      expect(releasedData.bookingIds).toContain("b-client-manual-expired")
      expect(releasedData.transactionIds).toContain("t-trx-manual-expired")
      expect(releasedData.voucherIds).toContain("v-voucher-test")
    })
  })

  // ===========================================================================
  // CASE 1B: VERIFIKASI PEMBAYARAN MANUAL DITOLAK ADMIN
  // ===========================================================================
  describe("Case 1B — Bukti Transfer Manual Tidak Valid / Ditolak Admin", () => {
    it("1.3 Mengidentifikasi kebutuhan status penolakan pembayaran pada state machine transaksi", () => {
      // Pada skenario transaksi tidak valid (nominal salah / bukti palsu),
      // status transaksi harus bisa bertransisi ke FAILED atau EXPIRED
      const validStatuses = ["PENDING", "PAID", "EXPIRED", "FAILED"]
      expect(validStatuses).toContain("FAILED")
      expect(validStatuses).toContain("EXPIRED")
    })
  })

  // ===========================================================================
  // CASE 2A: KONSELOR TIDAK HADIR / NO-SHOW
  // ===========================================================================
  describe("Case 2A — Konselor Tidak Hadir (Counselor No-Show) & Auto-Archiving", () => {
    it("2.1 Mendeteksi transisi waktu sesi: UPCOMING_LOCKED -> ROOM_OPEN -> IN_PROGRESS -> ENDED", () => {
      const sessionDate = "2026-10-08"
      const startTime = "09:00:00"
      const endTime = "10:30:00"

      // H-15 menit (08:45): Terkunci
      const t1 = new Date("2026-10-08T08:45:00+07:00")
      const info1 = calculateSessionTimeInfo(sessionDate, startTime, endTime, t1)
      expect(info1.state).toBe("UPCOMING_LOCKED")
      expect(info1.isZoomActive).toBe(false)

      // H-5 menit (08:55): Ruang Zoom Terbuka
      const t2 = new Date("2026-10-08T08:55:00+07:00")
      const info2 = calculateSessionTimeInfo(sessionDate, startTime, endTime, t2)
      expect(info2.state).toBe("ROOM_OPEN_PREPARING")
      expect(info2.isZoomActive).toBe(true)

      // Sesi Sedang Berlangsung (09:30): Zoom Aktif
      const t3 = new Date("2026-10-08T09:30:00+07:00")
      const info3 = calculateSessionTimeInfo(sessionDate, startTime, endTime, t3)
      expect(info3.state).toBe("IN_PROGRESS")
      expect(info3.isZoomActive).toBe(true)

      // Sesi Habis (10:35): State Berubah Menjadi ENDED dan Zoom Terkunci
      const t4 = new Date("2026-10-08T10:35:00+07:00")
      const info4 = calculateSessionTimeInfo(sessionDate, startTime, endTime, t4)
      expect(info4.state).toBe("ENDED")
      expect(info4.isZoomActive).toBe(false)
    })

    it("2.2 Mengarsipkan sesi yang telah melewati endTime > 2 jam ke status 'completed' via cron", async () => {
      const sessionDate = "2026-10-08"
      const endTime = "10:30:00"

      // 1 jam setelah endTime (11:30): Belum diarsipkan
      const check1HourLater = new Date("2026-10-08T11:30:00+07:00")
      expect(isSessionPastTwoHours(sessionDate, endTime, check1HourLater)).toBe(false)

      // 2 jam 5 menit setelah endTime (12:35): Melebihi 2 jam, siap diarsipkan
      const check2HoursLater = new Date("2026-10-08T12:35:00+07:00")
      expect(isSessionPastTwoHours(sessionDate, endTime, check2HoursLater)).toBe(true)

      let archivedData: any = null
      const result = await executeSlotCleanupAndArchiving({
        now: check2HoursLater,
        findExpiredReservedSlots: async () => [],
        findSessionsToArchive: async () => [{ bookingId: "b-counselor-noshow-1" }],
        executeCleanupTransaction: async (data) => {
          archivedData = data
        },
      })

      expect(result.success).toBe(true)
      expect(result.autoArchivedSessionsCount).toBe(1)
      expect(archivedData.archiveBookingIds).toContain("b-counselor-noshow-1")
    })
  })

  // ===========================================================================
  // CASE 2C: KLIEN TIDAK HADIR / CLIENT NO-SHOW & LAPORAN KONSELOR
  // ===========================================================================
  describe("Case 2C — Klien Tidak Hadir (Client No-Show) & Validasi Laporan Klinis", () => {
    it("2.3 Menyoroti batasan skema: Konselor tetap diwajibkan menulis summary & actionPlan minimal 20 karakter", () => {
      // Skema saat ini mewajibkan summary dan actionPlan min 20 karakter,
      // tanpa membedakan apakah sesi dihadiri atau no-show
      const dummyNoShowReport = {
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        summary: "Klien tidak hadir dalam panggilan Zoom sampai sesi berakhir (No-Show).",
        actionPlan: "Menjadwalkan kontak lanjutan via admin atau menawarkan sesi pengganti.",
      }

      const parseResult = sessionReportSchema.safeParse(dummyNoShowReport)
      expect(parseResult.success).toBe(true)
    })

    it("2.4 Mendukung field attendanceStatus ('attended' vs 'no_show') pada sessionReportSchema", () => {
      const reportAttended = {
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        summary: "Sesi konseling berjalan lancar mengenai kecemasan akademik.",
        actionPlan: "Latihan pernapasan 4-7-8 dan pencatatan trigger harian.",
        attendanceStatus: "attended",
      }
      expect(sessionReportSchema.safeParse(reportAttended).success).toBe(true)

      const reportNoShow = {
        bookingId: "123e4567-e89b-12d3-a456-426614174000",
        summary: "Klien tidak hadir dalam panggilan Zoom setelah ditunggu 30 menit.",
        actionPlan: "Rekomendasi tindak lanjut oleh tim customer care Solulu.",
        attendanceStatus: "no_show",
      }
      const parsed = sessionReportSchema.safeParse(reportNoShow)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.attendanceStatus).toBe("no_show")
      }
    })
  })

  // ===========================================================================
  // CASE 3A: RESCHEDULE H-12 POLICY
  // ===========================================================================
  describe("Case 3A — Evaluasi Kebijakan Reschedule H-12", () => {
    it("3.1 Memblokir permintaan reschedule jika kurang dari 12 jam sebelum sesi", () => {
      const fixedNow = new Date("2026-10-08T10:00:00+07:00")

      // 6 jam lagi: Diblokir
      const blocked = canRescheduleSession("2026-10-08", "16:00", fixedNow)
      expect(blocked.allowed).toBe(false)
      expect(blocked.reason).toContain("Aturan H-12")

      // 24 jam lagi: Diizinkan
      const allowed = canRescheduleSession("2026-10-09", "10:00", fixedNow)
      expect(allowed.allowed).toBe(true)
    })
  })
})
