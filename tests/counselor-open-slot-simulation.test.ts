import { describe, it, expect } from "vitest"
import { db } from "@/db"
import { counselors, schedules, bookings } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import {
  getCounselorWeeklyGridAction,
  toggleSlotAvailabilityAction,
} from "@/app/counselor/schedule/actions"
import { getAuthenticatedCounselor, resolveCounselorId } from "@/lib/counselor/auth"
import type { CounselorAuthContext } from "@/lib/counselor/types"

describe("Simulasi Lengkap: Buka Slot Kosong sebagai Mitra Konselor (Database Real)", () => {
  let sarahCounselor: any = null
  let authContext: CounselorAuthContext

  it("1. Verifikasi Konselor Terdaftar di Database Riil", async () => {
    const rows = await db
      .select()
      .from(counselors)
      .where(sql`${counselors.fullName} ILIKE '%Sarah Annisa%'`)
      .limit(1)

    expect(rows.length).toBeGreaterThan(0)
    sarahCounselor = rows[0]
    console.log("✓ Konselor Terverifikasi:", {
      id: sarahCounselor.id,
      fullName: sarahCounselor.fullName,
      email: sarahCounselor.email,
    })

    authContext = {
      id: `demo-${sarahCounselor.id}`,
      counselorId: sarahCounselor.id,
      app_metadata: { role: "counselor" },
      user_metadata: {
        role: "counselor",
        full_name: sarahCounselor.fullName,
        email: sarahCounselor.email,
      },
    }

    const resolvedId = await resolveCounselorId(authContext)
    expect(resolvedId).toBe(sarahCounselor.id)
  })

  it("2. Memuat Matriks Jadwal Mingguan Konselor untuk Minggu Depan", async () => {
    // Referensi minggu mendatang (Mulai Senin 02 November 2026 s/d Minggu 08 November 2026)
    const weekRef = "2026-11-02"
    const gridRes = await getCounselorWeeklyGridAction(weekRef, {
      currentUser: authContext,
    })

    expect(gridRes.success).toBe(true)
    expect(gridRes.data).toBeDefined()
    expect(gridRes.data!.weekDates).toHaveLength(7)
    expect(gridRes.data!.fixedSlots).toHaveLength(7)

    console.log("✓ Berhasil memuat matriks jadwal mingguan untuk:", gridRes.data!.counselorName)
    console.log("  Rentang tanggal:", gridRes.data!.weekDates[0].date, "s/d", gridRes.data!.weekDates[6].date)
    console.log("  Komitmen slot aktif saat ini:", gridRes.data!.commitment.activeCount, `(Target: ${gridRes.data!.commitment.target})`)
  })

  it("3. Identifikasi Slot Kosong & Eksekusi 'Buka Slot' sampai Terbuka", async () => {
    const weekRef = "2026-11-02"
    const gridBefore = await getCounselorWeeklyGridAction(weekRef, {
      currentUser: authContext,
    })

    // Cari slot yang berstatus kosong (unopened atau cancelled) dan masih dapat di-toggle
    let targetSlot: { slotIndex: number; date: string; displayTime: string; initialStatus: string } | null = null

    for (let slotIdx = 1; slotIdx <= 7; slotIdx++) {
      for (const day of gridBefore.data!.weekDates) {
        const cell = gridBefore.data!.grid[slotIdx]?.[day.date]
        if (cell && (cell.status === "unopened" || cell.status === "cancelled") && cell.canToggle) {
          targetSlot = {
            slotIndex: slotIdx,
            date: day.date,
            displayTime: cell.displayTime,
            initialStatus: cell.status,
          }
          break
        }
      }
      if (targetSlot) break
    }

    expect(targetSlot).not.toBeNull()
    console.log(`✓ Ditemukan slot kosong: Slot ${targetSlot!.slotIndex} (${targetSlot!.displayTime}) pada ${targetSlot!.date} (Status awal: ${targetSlot!.initialStatus})`)

    const initialCommitmentCount = gridBefore.data!.commitment.activeCount

    // Simulasi klik konselor: Buka Slot Kosong
    const toggleResult = await toggleSlotAvailabilityAction(
      { date: targetSlot!.date, slotIndex: targetSlot!.slotIndex },
      { currentUser: authContext }
    )

    console.log("✓ Respon aksi Buka Slot:", toggleResult)
    expect(toggleResult.success).toBe(true)
    expect(toggleResult.data?.status).toBe("available")
    expect(toggleResult.data?.isLeave).toBe(false)

    // 4. Verifikasi Langsung di Database PostgreSQL Real
    const [persisted] = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.counselorId, sarahCounselor.id),
          eq(schedules.date, targetSlot!.date),
          eq(schedules.slotIndex, targetSlot!.slotIndex)
        )
      )
      .limit(1)

    expect(persisted).toBeDefined()
    expect(persisted.status).toBe("available")
    expect(persisted.isLeave).toBe(false)
    console.log("✓ Terverifikasi di tabel 'schedules' PostgreSQL:", {
      id: persisted.id,
      counselorId: persisted.counselorId,
      date: persisted.date,
      slotIndex: persisted.slotIndex,
      startTime: persisted.startTime,
      endTime: persisted.endTime,
      status: persisted.status,
    })

    // 5. Verifikasi Matriks UI Menampilkan Slot 'available' (Dibuka) & Komitmen Bertambah
    const gridAfter = await getCounselorWeeklyGridAction(weekRef, {
      currentUser: authContext,
    })

    const updatedCell = gridAfter.data!.grid[targetSlot!.slotIndex][targetSlot!.date]
    expect(updatedCell.status).toBe("available")
    expect(updatedCell.canToggle).toBe(true)
    expect(gridAfter.data!.commitment.activeCount).toBe(initialCommitmentCount + 1)
    console.log(`✓ Slot berhasil terbuka di matriks! Komitmen mingguan bertambah dari ${initialCommitmentCount} menjadi ${gridAfter.data!.commitment.activeCount}.`)
  }, 30000)

  it("4. Proteksi Integritas: Tolak Menonaktifkan Slot yang Sudah Dipesan Klien", async () => {
    // Buat skenario proteksi jika slot telah di-booking
    const fakeBookedSlot = {
      id: "test-booked-slot-id",
      status: "booked",
      booking: { id: "booking-sample", status: "confirmed" },
    }

    const testNow = new Date("2026-10-19T03:00:00.000Z")
    const rejectRes = await toggleSlotAvailabilityAction(
      { date: "2026-10-21", slotIndex: 3 },
      {
        currentUser: authContext,
        now: testNow,
        getSlot: async () => fakeBookedSlot,
      }
    )

    expect(rejectRes.success).toBe(false)
    expect(rejectRes.error).toContain("sudah dipesan oleh klien")
    console.log("✓ Proteksi Terpesan Aktif: Konselor dicegah mematikan slot yang sudah memiliki pasien.")
  })

  it("5. Proteksi Integritas: Tolak Membuka Slot yang Sudah Terlewat", async () => {
    const testNow = new Date("2026-10-19T10:00:00.000Z") // 17:00 WIB
    const pastRes = await toggleSlotAvailabilityAction(
      { date: "2026-10-18", slotIndex: 1 }, // Kemarin
      {
        currentUser: authContext,
        now: testNow,
      }
    )

    expect(pastRes.success).toBe(false)
    expect(pastRes.error).toContain("terlewat")
    console.log("✓ Proteksi Masa Lalu Aktif: Konselor dicegah memanipulasi slot yang telah lewat.")
  })
})
