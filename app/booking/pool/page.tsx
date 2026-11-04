import * as React from "react"
import Link from "next/link"
import { PublicShell } from "@/components/public/public-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/public/public-card"
import { listPoolServices, listPoolSlotOptions } from "@/lib/booking/pool-checkout"
import { getWIBDateString } from "@/lib/schedules/concurrency"
import { getSlotByIndex } from "@/lib/schedules/slots"
import PoolBookingForm from "./PoolBookingForm"

interface PoolBookingPageProps {
  searchParams: Promise<{
    date?: string
    slotIndex?: string
    serviceId?: string
    screeningId?: string
    error?: string
  }>
}

export const metadata = {
  title: "Pesan Konselor Bebas | Solulu",
  description: "Pesan sesi telekonseling tanpa memilih konselor tertentu.",
}

const HORIZON_DAYS = 7

function upcomingDates(): string[] {
  const now = Date.now()
  return Array.from({ length: HORIZON_DAYS }, (_, i) => getWIBDateString(new Date(now + i * 86_400_000)))
}

function query(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v)
  return `/booking/pool?${q.toString()}`
}

export default async function PoolBookingPage({ searchParams }: PoolBookingPageProps) {
  const params = await searchParams
  const services = await listPoolServices()
  const service = services.find((s) => s.serviceId === params.serviceId) ?? null
  const dates = upcomingDates()
  const date = params.date && dates.includes(params.date) ? params.date : null

  // Hanya slot dengan jaminan konselor (ADR-0011) yang pernah muncul di sini.
  const slots = service && date ? await listPoolSlotOptions({ date, serviceId: service.serviceId }) : []
  const slotIndex = Number(params.slotIndex)
  const chosenSlot = slots.find((s) => s.slotIndex === slotIndex) ?? null
  const base = { screeningId: params.screeningId }

  return (
    <PublicShell>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Konselor Bebas</CardTitle>
            <CardDescription>
              Pilih Layanan, tanggal, dan jam. Nama konselor dikirim ke email Anda setelah sesi diambil.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {params.error === "payment_cancelled" ? (
              <p role="alert" className="text-sm text-destructive">
                Pembayaran dibatalkan. Silakan pilih slot kembali.
              </p>
            ) : null}

            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">1. Layanan</h2>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada Layanan yang tersedia.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {services.map((s) => (
                    <li key={s.serviceId}>
                      <Link
                        href={query({ ...base, serviceId: s.serviceId })}
                        aria-current={service?.serviceId === s.serviceId ? "true" : undefined}
                        className="flex justify-between rounded-xl border border-border px-4 py-3 text-sm aria-[current=true]:border-primary"
                      >
                        <span>{s.name}</span>
                        <span className="font-medium">{s.activePriceFormatted}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {service ? (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">2. Tanggal</h2>
                <ul className="flex flex-wrap gap-2">
                  {dates.map((d) => (
                    <li key={d}>
                      <Link
                        href={query({ ...base, serviceId: service.serviceId, date: d })}
                        aria-current={date === d ? "true" : undefined}
                        className="rounded-full border border-border px-3 py-1.5 text-sm aria-[current=true]:border-primary"
                      >
                        {d}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {service && date ? (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">3. Jam</h2>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada jam Konselor Bebas pada tanggal ini. Coba tanggal lain atau pilih konselor tertentu di{" "}
                    <Link href="/counselors" className="underline">
                      katalog
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <li key={s.slotIndex}>
                        <Link
                          href={query({ ...base, serviceId: service.serviceId, date, slotIndex: String(s.slotIndex) })}
                          aria-current={chosenSlot?.slotIndex === s.slotIndex ? "true" : undefined}
                          className="rounded-full border border-border px-3 py-1.5 text-sm aria-[current=true]:border-primary"
                        >
                          {s.timeRange}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : null}

            {service && date && chosenSlot && getSlotByIndex(chosenSlot.slotIndex) ? (
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">4. Data Anda</h2>
                <PoolBookingForm
                  date={date}
                  slotIndex={chosenSlot.slotIndex}
                  serviceId={service.serviceId}
                  screeningId={params.screeningId}
                  priceFormatted={service.activePriceFormatted}
                  allowVoucher={service.allowVoucher}
                />
              </section>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PublicShell>
  )
}
