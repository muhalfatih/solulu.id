import { describe, it, expect, vi } from "vitest"
import { prepareWhatsAppDispatch, saveWhatsAppTemplate } from "@/lib/whatsapp/service"
import type { DispatchBookingData } from "@/lib/whatsapp/queue"
import type { RoleCarrier } from "@/lib/auth/staff-role"

const user = (role: string): RoleCarrier => ({ id: `${role}-id`, app_metadata: { role } })

const booking = (over: Partial<DispatchBookingData> = {}): DispatchBookingData => ({
  bookingId: "b1",
  status: "confirmed",
  patientName: "Dimas",
  patientPhone: "081234567890",
  accessToken: "tok123",
  counselorName: "Sari",
  scheduleDate: "2026-11-05",
  startTime: "10:00:00",
  endTime: "12:00:00",
  hasReport: false,
  ...over,
})

function deps(b: DispatchBookingData | null = booking(), body = "Halo {{nama_klien}} {{tanggal}} {{slot}} {{nama_konselor}} {{link_sesi}}") {
  return {
    loadBooking: vi.fn(async () => b),
    loadTemplate: vi.fn(async () => ({ id: "t1", body })),
    recordSent: vi.fn(async () => undefined),
    today: () => "2026-11-05",
    baseUrl: () => "https://solulu.test",
  }
}

describe("Ticket 31: saving templates", () => {
  it("only superadmin may save", async () => {
    for (const role of ["admin", "operator", "counselor"]) {
      const upsertTemplate = vi.fn()
      const r = await saveWhatsAppTemplate({ key: "laporan_siap", body: "Halo" }, { upsertTemplate }, user(role))
      expect(r.success).toBe(false)
      expect(upsertTemplate).not.toHaveBeenCalled()
    }
    const anon = await saveWhatsAppTemplate({ key: "laporan_siap", body: "Halo" }, { upsertTemplate: vi.fn() }, null)
    expect(anon.success).toBe(false)
  })

  it("saves a valid body with the acting superadmin id", async () => {
    const upsertTemplate = vi.fn(async () => undefined)
    const r = await saveWhatsAppTemplate(
      { key: "laporan_siap", body: "Halo {{nama_klien}}" },
      { upsertTemplate },
      user("superadmin")
    )
    expect(r.success).toBe(true)
    expect(upsertTemplate).toHaveBeenCalledWith({
      key: "laporan_siap",
      name: "Laporan Siap",
      body: "Halo {{nama_klien}}",
      updatedBy: "superadmin-id",
    })
  })

  it("rejects unknown placeholders and unknown keys without writing", async () => {
    const upsertTemplate = vi.fn()
    const bad = await saveWhatsAppTemplate({ key: "laporan_siap", body: "Hai {{harga}}" }, { upsertTemplate }, user("superadmin"))
    expect(bad).toMatchObject({ success: false })
    const key = await saveWhatsAppTemplate({ key: "lainnya", body: "Hai" }, { upsertTemplate }, user("superadmin"))
    expect(key.success).toBe(false)
    expect(upsertTemplate).not.toHaveBeenCalled()
  })
})

describe("Ticket 31: preparing a dispatch", () => {
  it("renders on the server, returns wa.me url, and records Sudah Dikirim", async () => {
    const d = deps()
    const r = await prepareWhatsAppDispatch({ bookingId: "b1" }, d, user("operator"))
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.templateKey).toBe("dispatch_link_sesi")
    expect(r.url.startsWith("https://wa.me/6281234567890?text=")).toBe(true)
    const text = decodeURIComponent(r.url.split("?text=")[1])
    expect(text).toContain("Halo Dimas")
    expect(text).toContain("10:00 - 12:00 WIB")
    expect(text).toContain("Sari")
    expect(text).toContain("https://solulu.test/session/tok123")
    expect(d.recordSent).toHaveBeenCalledWith({
      bookingId: "b1",
      templateId: "t1",
      templateKey: "dispatch_link_sesi",
      sentBy: "operator-id",
    })
  })

  it("uses the Laporan Siap template for completed bookings with a report", async () => {
    const d = deps(booking({ status: "completed", hasReport: true, scheduleDate: "2026-11-01" }))
    const r = await prepareWhatsAppDispatch({ bookingId: "b1" }, d, user("admin"))
    expect(r.success && r.templateKey).toBe("laporan_siap")
    expect(d.loadTemplate).toHaveBeenCalledWith("laporan_siap")
  })

  it("does not record anything when the booking is not in the queue", async () => {
    const d = deps(booking({ status: "cancelled" }))
    const r = await prepareWhatsAppDispatch({ bookingId: "b1" }, d, user("admin"))
    expect(r.success).toBe(false)
    expect(d.recordSent).not.toHaveBeenCalled()
  })

  it("fails when the template is not configured or the phone is invalid", async () => {
    const d = deps()
    d.loadTemplate = vi.fn(async () => null) as never
    expect((await prepareWhatsAppDispatch({ bookingId: "b1" }, d, user("admin"))).success).toBe(false)
    const d2 = deps(booking({ patientPhone: "abc" }))
    expect((await prepareWhatsAppDispatch({ bookingId: "b1" }, d2, user("admin"))).success).toBe(false)
    expect(d2.recordSent).not.toHaveBeenCalled()
  })

  it("denies counselors and anonymous users", async () => {
    const d = deps()
    expect((await prepareWhatsAppDispatch({ bookingId: "b1" }, d, user("counselor"))).success).toBe(false)
    expect((await prepareWhatsAppDispatch({ bookingId: "b1" }, d, null)).success).toBe(false)
    expect(d.loadBooking).not.toHaveBeenCalled()
  })
})
