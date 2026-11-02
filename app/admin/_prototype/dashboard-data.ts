// PROTOTYPE (branch prototype/admin-dashboard-v9) — read-only queries for the
// admin dashboard variants. Not production code: no tests, minimal error handling.
// HPP is an estimate using the PRD v9 default Bagi Hasil (ADR-0007) because the
// Layanan / payroll tables do not exist yet. "Layanan" = Tipe Konselor for now.
import { sql } from "drizzle-orm"
import { db } from "@/db"

import type { RangeKey } from "./range-options"
export type { RangeKey }

const SPLIT = {
  peer: { base: 0.7, overtime: 0.8 },
  psychologist: { base: 0.8, overtime: 0.85 },
} as const

const SLOT_LABELS = ["08.00", "10.00", "12.00", "14.00", "16.00", "18.00", "20.00"]

type Ymd = string // YYYY-MM-DD in WIB

function todayWib(): Date {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date())
  return new Date(`${s}T00:00:00Z`)
}
const ymd = (d: Date): Ymd => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000) + 1

function payrollPeriodOf(d: Date) {
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  if (d.getUTCDate() <= 15) {
    return { start: new Date(Date.UTC(y, m, 1)), end: new Date(Date.UTC(y, m, 15)) }
  }
  return { start: new Date(Date.UTC(y, m, 16)), end: new Date(Date.UTC(y, m + 1, 0)) }
}

export function resolveRange(key: RangeKey) {
  const today = todayWib()
  let start: Date
  let end: Date
  let prevStart: Date
  let prevEnd: Date
  switch (key) {
    case "prev-period": {
      const cur = payrollPeriodOf(today)
      ;({ start, end } = payrollPeriodOf(addDays(cur.start, -1)))
      ;({ start: prevStart, end: prevEnd } = payrollPeriodOf(addDays(start, -1)))
      break
    }
    case "7d":
    case "30d": {
      const n = key === "7d" ? 7 : 30
      end = today
      start = addDays(today, -(n - 1))
      prevEnd = addDays(start, -1)
      prevStart = addDays(prevEnd, -(n - 1))
      break
    }
    case "month": {
      start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
      end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))
      prevStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1))
      prevEnd = addDays(start, -1)
      break
    }
    default: {
      ;({ start, end } = payrollPeriodOf(today))
      ;({ start: prevStart, end: prevEnd } = payrollPeriodOf(addDays(start, -1)))
    }
  }
  return { key, start, end, prevStart, prevEnd, today }
}

async function rows<T>(q: ReturnType<typeof sql>): Promise<T[]> {
  const r = (await db.execute(q)) as unknown as T[]
  return Array.from(r)
}

const num = (v: unknown) => Number(v ?? 0) || 0

async function revenueAndHpp(start: Ymd, end: Ymd) {
  const revenue = await rows<{ day: string; amount: string }>(sql`
    select to_char((paid_at at time zone 'Asia/Jakarta')::date, 'YYYY-MM-DD') as day,
           sum(net_amount) as amount
    from transactions
    where status = 'PAID'
      and (paid_at at time zone 'Asia/Jakarta')::date between ${start}::date and ${end}::date
    group by 1`)

  // Honor per session (by session date): active tier price x base split + paid overtime x overtime split
  const hpp = await rows<{
    day: string
    counselor_type: "peer" | "psychologist"
    is_no_show: boolean
    status: string
    active_price: string
    extension_fee: string
    extension_paid: boolean
  }>(sql`
    select to_char(s.date, 'YYYY-MM-DD') as day, c.counselor_type, b.is_no_show, b.status,
           case when p.is_sale_active and p.promo_price is not null and p.promo_price < p.base_price
                then p.promo_price else p.base_price end as active_price,
           b.extension_fee, (b.extension_payment_status = 'PAID') as extension_paid
    from bookings b
    join schedules s on s.id = b.schedule_id
    join counselors c on c.id = b.counselor_id
    left join platform_pricing p on p.counselor_type = c.counselor_type
    where b.status = 'completed' and s.date between ${start}::date and ${end}::date`)

  const byDay = new Map<string, { revenue: number; hpp: number }>()
  for (const r of revenue) byDay.set(r.day, { revenue: num(r.amount), hpp: 0 })
  let completed = 0
  let noShow = 0
  const perService = { peer: { selesai: 0, noShow: 0 }, psychologist: { selesai: 0, noShow: 0 } }
  for (const r of hpp) {
    const split = SPLIT[r.counselor_type]
    const honor = num(r.active_price) * split.base + (r.extension_paid ? num(r.extension_fee) * split.overtime : 0)
    const d = byDay.get(r.day) ?? { revenue: 0, hpp: 0 }
    d.hpp += honor
    byDay.set(r.day, d)
    if (r.is_no_show) {
      noShow++
      perService[r.counselor_type].noShow++
    } else {
      completed++
      perService[r.counselor_type].selesai++
    }
  }
  const totalRevenue = [...byDay.values()].reduce((a, b) => a + b.revenue, 0)
  const totalHpp = [...byDay.values()].reduce((a, b) => a + b.hpp, 0)
  return { byDay, totalRevenue, totalHpp, completed, noShow, perService }
}

async function occupancy(start: Ymd, end: Ymd) {
  const [r] = await rows<{ opened: string; booked: string }>(sql`
    select count(*) filter (where status <> 'cancelled' and not is_leave) as opened,
           count(*) filter (where status = 'booked') as booked
    from schedules where date between ${start}::date and ${end}::date`)
  const opened = num(r?.opened)
  const booked = num(r?.booked)
  return { opened, booked, rate: opened ? booked / opened : null }
}

export async function getDashboardData(key: RangeKey) {
  const range = resolveRange(key)
  const [s, e, ps, pe] = [range.start, range.end, range.prevStart, range.prevEnd].map(ymd)

  const [cur, prev, occ, prevOcc] = await Promise.all([
    revenueAndHpp(s, e),
    revenueAndHpp(ps, pe),
    occupancy(s, e),
    occupancy(ps, pe),
  ])

  // Daily series across the whole range (zeros included so the time axis is honest)
  const days = daysBetween(range.start, range.end)
  const daily = Array.from({ length: days }, (_, i) => {
    const day = ymd(addDays(range.start, i))
    const v = cur.byDay.get(day) ?? { revenue: 0, hpp: 0 }
    return { day, omzet: Math.round(v.revenue), hpp: Math.round(v.hpp) }
  })

  // Slot heatmap: 7 days ending at min(range end, today+6) — shows opened vs booked per slot
  const heatEnd = range.end < addDays(range.today, 6) ? range.end : addDays(range.today, 6)
  const heatStart = addDays(heatEnd, -6)
  const heatRows = await rows<{ day: string; slot_index: number; opened: string; booked: string }>(sql`
    select to_char(date, 'YYYY-MM-DD') as day, slot_index,
           count(*) filter (where status <> 'cancelled' and not is_leave) as opened,
           count(*) filter (where status = 'booked') as booked
    from schedules where date between ${ymd(heatStart)}::date and ${ymd(heatEnd)}::date
    group by 1, 2`)
  const heatDays = Array.from({ length: 7 }, (_, i) => ymd(addDays(heatStart, i)))
  const heatmap = SLOT_LABELS.map((label, si) => ({
    slot: si + 1,
    label,
    cells: heatDays.map((day) => {
      const hit = heatRows.find((r) => r.day === day && Number(r.slot_index) === si + 1)
      return { day, opened: num(hit?.opened), booked: num(hit?.booked) }
    }),
  }))

  const paymentRows = await rows<{ provider: string; count: string; amount: string }>(sql`
    select payment_provider as provider, count(*) as count, sum(net_amount) as amount
    from transactions
    where status = 'PAID'
      and (paid_at at time zone 'Asia/Jakarta')::date between ${s}::date and ${e}::date
    group by 1`)
  const providerLabel = (p: string) =>
    p === "xendit" ? "Xendit" : p === "manual_bank_transfer" ? "Transfer Manual" : "Booking Rp 0"
  const payments = paymentRows.map((r) => ({
    key: r.provider === "xendit" ? "xendit" : r.provider === "manual_bank_transfer" ? "transfer" : "bypass",
    label: providerLabel(r.provider),
    count: num(r.count),
    amount: num(r.amount),
  }))

  const attention = await getAttention()

  const delta = (a: number, b: number) => (b ? (a - b) / b : null)
  return {
    range: { key, start: s, end: e, prevStart: ps, prevEnd: pe },
    kpi: {
      omzet: { value: cur.totalRevenue, prev: prev.totalRevenue, delta: delta(cur.totalRevenue, prev.totalRevenue) },
      laba: {
        value: cur.totalRevenue - cur.totalHpp,
        prev: prev.totalRevenue - prev.totalHpp,
        delta: delta(cur.totalRevenue - cur.totalHpp, prev.totalRevenue - prev.totalHpp),
      },
      hpp: { value: cur.totalHpp, prev: prev.totalHpp, delta: delta(cur.totalHpp, prev.totalHpp) },
      sesi: { value: cur.completed, prev: prev.completed, delta: delta(cur.completed, prev.completed), noShow: cur.noShow },
      okupansi: {
        value: occ.rate,
        prev: prevOcc.rate,
        delta: occ.rate !== null && prevOcc.rate ? occ.rate - prevOcc.rate : null,
        booked: occ.booked,
        opened: occ.opened,
      },
    },
    daily,
    perService: [
      { layanan: "Partner Cerita", ...cur.perService.peer },
      { layanan: "Psikolog Klinis", ...cur.perService.psychologist },
    ],
    heatmap,
    heatDays,
    payments,
    attention,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

export async function getAttention() {
  const [r] = await rows<{
    transfer: string
    reports: string
    credentials: string
    applications: string
  }>(sql`
    select
      (select count(*) from bookings
        where manual_payment_status = 'PENDING' or extension_payment_status = 'PENDING') as transfer,
      (select count(*) from bookings b
        join schedules s on s.id = b.schedule_id
        left join session_reports r on r.booking_id = b.id
        where b.status = 'completed' and not b.is_no_show and r.id is null
          and (s.date + s.end_time) < (now() at time zone 'Asia/Jakarta') - interval '24 hours') as reports,
      (select count(*) from counselors
        where is_active and (str_expires_at < current_date + 60 or sipp_expires_at < current_date + 60)) as credentials,
      (select count(*) from counselor_applications where status = 'pending') as applications`)
  return [
    { key: "pool", label: "Klien belum diklaim", count: null as number | null, href: "#", hint: "Fitur Client Pool belum ada" },
    { key: "transfer", label: "Transfer menunggu", count: num(r?.transfer), href: "/admin/manual-payments", hint: "Booking & perpanjangan" },
    { key: "reports", label: "Laporan lewat 24 jam", count: num(r?.reports), href: "/admin/bookings", hint: "Honor tertahan (Payroll Hold)" },
    { key: "credentials", label: "STR/SIPP < 60 hari", count: num(r?.credentials), href: "/admin/counselors", hint: "Perlu perpanjangan izin" },
    { key: "applications", label: "Pendaftaran baru", count: num(r?.applications), href: "/admin/counselors/applications", hint: "Menunggu verifikasi berkas" },
  ]
}

export type AttentionItem = Awaited<ReturnType<typeof getAttention>>[number]
