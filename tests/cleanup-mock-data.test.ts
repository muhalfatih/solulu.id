import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, it, expect, vi } from "vitest"
import { getTableConfig } from "drizzle-orm/pg-core"
import { bookings, sessionReports } from "@/db/schema"
import { generateBookingCode } from "@/lib/booking/code"
import { processExtensionPayment } from "@/lib/session/access"
import { confirmManualPaymentAdminAction } from "@/app/admin/manual-payments/actions"
import { mapAdminBookingRow } from "@/lib/admin/booking-session"
import { sessionReportSchema } from "@/lib/validations/counselor"

type AdminRow = Parameters<typeof mapAdminBookingRow>[0]

function bookingRow(overrides: Partial<typeof bookings.$inferSelect> = {}): typeof bookings.$inferSelect {
  return {
    id: "6f1c1c3e-0000-4000-8000-000000000001",
    accessToken: "tok",
    bookingCode: "SL-7K2M9Q",
    patientName: "Nadia Rahma",
    patientEmail: "nadia@klien.id",
    patientPhone: "081234567890",
    gender: null,
    age: null,
    domicile: null,
    religion: null,
    initialNotes: null,
    informedConsentAcceptedAt: null,
    scheduleId: "s1",
    counselorId: "c1",
    screeningId: null,
    bypassedRecommendation: false,
    waiverAcceptedAt: null,
    zoomAccountId: null,
    zoomAccountNumber: 1,
    zoomAllocationMode: "standalone",
    zoomMeetingId: null,
    zoomJoinUrl: null,
    zoomStartUrl: null,
    zoomHostKey: null,
    breakoutRoomName: null,
    operatorAdmittedAt: null,
    paymentMethod: "xendit",
    manualPaymentProofR2Key: null,
    manualPaymentStatus: "NONE",
    isExtended: false,
    extensionMinutes: 0,
    extensionFee: "0",
    extensionPaymentStatus: "NONE",
    extensionPaymentMethod: null,
    extensionProofR2Key: null,
    status: "pending_payment",
    rescheduleCount: 0,
    isFollowedUp: false,
    followedUpAt: null,
    isNoShow: false,
    noShowMarkedAt: null,
    createdAt: new Date("2026-11-01T00:00:00Z"),
    ...overrides,
  } as typeof bookings.$inferSelect
}

function adminRow(overrides: Partial<AdminRow> = {}): AdminRow {
  return {
    booking: bookingRow(),
    counselor: null,
    schedule: null,
    transaction: null,
    zoomAccount: null,
    report: null,
    ...overrides,
  } as AdminRow
}

describe("Ticket 17: baris sesi Admin tanpa data tidak diisi nilai karangan", () => {
  it("transaksi kosong: nominal dan metode pembayaran null, bukan Rp150.000 / Transfer Bank Manual", () => {
    const s = mapAdminBookingRow(adminRow(), { zoomAccounts: [] })
    expect(s.amount).toBeNull()
    expect(s.paymentMethod).toBeNull()
  })

  it("tanpa link Zoom: zoomJoinUrl null, bukan '#'", () => {
    const s = mapAdminBookingRow(adminRow(), { zoomAccounts: [] })
    expect(s.zoomJoinUrl).toBeNull()
  })

  it("tanpa jadwal: rentang waktu kosong, bukan '09:00 - 10:30 WIB'", () => {
    const s = mapAdminBookingRow(adminRow(), { zoomAccounts: [] })
    expect(s.timeRange).toBe("")
    expect(s.date).toBe("")
  })

  it("tanpa konselor: nama konselor kosong, bukan 'Konselor'", () => {
    const s = mapAdminBookingRow(adminRow(), { zoomAccounts: [] })
    expect(s.counselorName).toBe("")
  })

  it("memetakan data nyata apa adanya", () => {
    const s = mapAdminBookingRow(
      adminRow({
        booking: bookingRow({ zoomJoinUrl: "https://zoom.us/j/123", status: "confirmed" }),
        counselor: { fullName: "Dimas Pratama", title: "M.Psi", counselorType: "psychologist" } as AdminRow["counselor"],
        schedule: { date: "2026-12-01", startTime: "19:00:00", endTime: "20:30:00" } as AdminRow["schedule"],
        transaction: { netAmount: "130000.00", paymentMethod: "Transfer Bank BCA (Manual)", paymentProvider: "manual_bank_transfer" } as AdminRow["transaction"],
      }),
      { zoomAccounts: [] }
    )
    expect(s.zoomJoinUrl).toBe("https://zoom.us/j/123")
    expect(s.amount).toBe(130000)
    expect(s.paymentMethod).toBe("Transfer Bank BCA (Manual)")
    expect(s.counselorName).toBe("Dimas Pratama, M.Psi")
    expect(s.timeRange).toBe("19:00 - 20:30")
    expect(s.counselorType).toBe("Psikolog Klinis")
  })
})

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

function listSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
    const rel = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listSourceFiles(rel))
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(rel)
  }
  return out
}

describe("Ticket 17: laporan sesi tidak diberi permasalahan utama karangan", () => {
  it("menolak laporan tanpa permasalahan utama alih-alih mengisi 'Konsultasi Emosional & Stres'", () => {
    const parsed = sessionReportSchema.safeParse({
      bookingId: "123e4567-e89b-12d3-a456-426614174000",
      summary: "Klien telah menyelesaikan sesi pertama dengan pembahasan pemicu kecemasan.",
    })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.flatten().fieldErrors.mainIssue).toBeDefined()
  })
})

describe("Ticket 17: Timer Melayang tanpa kontrol simulasi", () => {
  it("tidak ada kontrol lompat waktu / Simulasi Transisi Waktu", () => {
    const src = readSource("components/counselor/FloatingTimer.tsx")
    expect(src).not.toMatch(/Simulasi Transisi Waktu/i)
    expect(src).not.toContain("jumpToSeconds")
    expect(src).not.toContain("btn-jump-")
  })
})

describe("Ticket 17: tidak ada Math.random untuk link Zoom atau nomor referensi", () => {
  const files = ["app", "lib", "components"].flatMap(listSourceFiles)

  it("tidak ada link Zoom atau nomor referensi yang dibuat dari Math.random", () => {
    const offenders = files.filter((f) => {
      const lines = readSource(f).split("\n")
      return lines.some(
        (line) =>
          line.includes("Math.random") &&
          /zoom\.us|REF-|MANUAL-|referenceNumber|refNum|zoomJoinUrl/i.test(line)
      )
    })
    expect(offenders).toEqual([])
  })

  it("tidak ada email, kode booking, atau nominal karangan yang di-hardcode", () => {
    const patterns = [/pasien@example\.com/, /"SL-1001"/, /(\|\||\?\?|:)\s*150000\b(?!\s*,)/]
    const offenders = files.filter((f) => {
      const src = readSource(f)
      return patterns.some((p) => p.test(src))
    })
    expect(offenders).toEqual([])
  })
})

const adminUser = {
  id: "admin-uuid-1",
  app_metadata: { role: "admin" },
  user_metadata: { role: "admin" },
}

describe("Ticket 17: transfer manual mewajibkan nomor referensi", () => {
  it.each([undefined, "", "   "])("menolak konfirmasi tanpa nomor referensi (%j)", async (referenceNumber) => {
    const confirmPaymentFn = vi.fn()
    const res = await confirmManualPaymentAdminAction(
      {
        bookingId: "b-ref-1",
        paymentType: "initial",
        paymentMethod: "Transfer Bank BCA (Manual)",
        referenceNumber,
      },
      { currentUser: adminUser, confirmPaymentFn, updateBookingFn: vi.fn() }
    )
    expect(res.success).toBe(false)
    expect(res.error).toContain("Nomor referensi")
    expect(confirmPaymentFn).not.toHaveBeenCalled()
  })

  it("meneruskan nomor referensi yang diisi Admin apa adanya (setelah trim)", async () => {
    const confirmPaymentFn = vi.fn(async () => ({ success: true, zoomRoom: "Zoom Pro 1", zoomJoinUrl: "https://zoom.us/j/1" }))
    const res = await confirmManualPaymentAdminAction(
      {
        bookingId: "b-ref-2",
        paymentType: "initial",
        paymentMethod: "Transfer Bank BCA (Manual)",
        referenceNumber: "  BCA-REF-9921 ",
      },
      { currentUser: adminUser, confirmPaymentFn, updateBookingFn: vi.fn() }
    )
    expect(res.success).toBe(true)
    expect(confirmPaymentFn).toHaveBeenCalledWith(
      expect.objectContaining({ referenceNumber: "BCA-REF-9921" })
    )
  })
})

function column(table: Parameters<typeof getTableConfig>[0], name: string) {
  const col = getTableConfig(table).columns.find((c) => c.name === name)
  if (!col) throw new Error(`column ${name} not found`)
  return col
}

describe("Ticket 17: schema tidak lagi mengarang data klien", () => {
  it("kolom gender, age, booking_code, dan main_issue tidak punya default SQL", () => {
    expect(column(bookings, "gender").hasDefault).toBe(false)
    expect(column(bookings, "age").hasDefault).toBe(false)
    expect(column(sessionReports, "main_issue").hasDefault).toBe(false)
    expect(column(bookings, "booking_code").default).toBeUndefined()
  })

  it("kode booking dibuat generator saat insert, bukan default statis", () => {
    const col = column(bookings, "booking_code")
    expect(col.defaultFn).toBeTypeOf("function")
    expect(col.defaultFn!()).toMatch(/^SL-[2-9A-HJ-NP-Z]{6}$/)
  })
})

describe("Ticket 17: generateBookingCode", () => {
  it("menghasilkan format SL-XXXXXX tanpa karakter yang mudah tertukar", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateBookingCode()).toMatch(/^SL-[2-9A-HJ-NP-Z]{6}$/)
    }
  })

  it("menghasilkan kode berbeda pada setiap pemanggilan", () => {
    const codes = new Set(Array.from({ length: 2000 }, () => generateBookingCode()))
    expect(codes.size).toBe(2000)
  })

  it("memetakan byte acak ke alfabet secara deterministik", () => {
    const bytes = Uint8Array.from([0, 1, 2, 3, 4, 5])
    expect(generateBookingCode(() => bytes)).toBe("SL-234567")
  })
})

describe("Ticket 17: invoice perpanjangan memakai email klien dari booking", () => {
  const baseBooking = {
    id: "b-ext-1",
    bookingCode: "SL-7K2M9Q",
    extensionFee: 70000,
    extensionMinutes: 60,
  }

  it("mengirim email klien asli ke Xendit", async () => {
    const createXenditInvoice = vi.fn(async () => ({ id: "inv-1", invoiceUrl: "https://pay.test/inv-1" }))
    const res = await processExtensionPayment(
      { accessToken: "tok_ext_1", paymentMethod: "xendit" },
      {
        findBooking: async () => ({ ...baseBooking, patientEmail: "nadia.rahma@klien.id" }),
        updateBooking: async () => undefined,
        createXenditInvoice,
      }
    )
    expect(res.success).toBe(true)
    expect(createXenditInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ payerEmail: "nadia.rahma@klien.id" })
    )
  })

  it("gagal dengan pesan jelas bila booking tidak punya email, tanpa membuat invoice", async () => {
    const createXenditInvoice = vi.fn()
    const res = await processExtensionPayment(
      { accessToken: "tok_ext_2", paymentMethod: "xendit" },
      {
        findBooking: async () => ({ ...baseBooking, patientEmail: "" }),
        updateBooking: async () => undefined,
        createXenditInvoice,
      }
    )
    expect(res.success).toBe(false)
    expect(createXenditInvoice).not.toHaveBeenCalled()
  })
})
