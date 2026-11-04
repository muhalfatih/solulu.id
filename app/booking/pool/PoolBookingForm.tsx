"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { PublicButton } from "@/components/public/public-button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createPoolBookingAction } from "./actions"

interface PoolBookingFormProps {
  date: string
  slotIndex: number
  serviceId: string
  screeningId?: string
  priceFormatted: string
  allowVoucher: boolean
}

export default function PoolBookingForm({
  date,
  slotIndex,
  serviceId,
  screeningId,
  priceFormatted,
  allowVoucher,
}: PoolBookingFormProps) {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const text = (name: string) => String(form.get(name) ?? "").trim()
    setSubmitting(true)
    setError(null)
    try {
      const res = await createPoolBookingAction({
        date,
        slotIndex,
        serviceId,
        screeningId: screeningId || undefined,
        patientName: text("patientName"),
        patientEmail: text("patientEmail").toLowerCase(),
        patientEmailConfirm: text("patientEmailConfirm").toLowerCase(),
        patientPhone: text("patientPhone"),
        initialNotes: text("initialNotes") || undefined,
        voucherCode: allowVoucher ? text("voucherCode") || undefined : undefined,
        paymentProvider: "xendit",
        paymentMethod: "Xendit Gateway",
      })
      if (!res.success || !res.data) {
        setError(res.error || "Gagal memproses pemesanan.")
        setSubmitting(false)
        return
      }
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl
      } else if (res.data.redirectUrl) {
        router.push(res.data.redirectUrl)
      } else {
        router.push(`/booking/success?token=${res.data.accessToken}`)
      }
    } catch {
      setError("Terjadi kendala jaringan saat memproses pemesanan. Coba lagi dalam beberapa saat.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nama lengkap / panggilan
        <Input name="patientName" required minLength={2} maxLength={100} autoComplete="name" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <Input name="patientEmail" type="email" required autoComplete="email" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Konfirmasi email
        <Input name="patientEmailConfirm" type="email" required autoComplete="email" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Nomor WhatsApp
        <Input name="patientPhone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="08123456789" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Catatan awal (opsional)
        <Textarea name="initialNotes" maxLength={1000} rows={3} />
      </label>
      {allowVoucher ? (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Kode voucher (opsional)
          <Input name="voucherCode" autoComplete="off" />
        </label>
      ) : null}
      <PublicButton type="submit" variant="public" size="pill" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        <span>Bayar {priceFormatted}</span>
      </PublicButton>
    </form>
  )
}
