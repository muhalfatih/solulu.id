"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Copy, MessageCircle, Zap } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import type { TableState } from "@/lib/data-table/search-params"
import { formatDateId, formatDateTimeWib } from "@/lib/format/datetime"
import { formatRupiah } from "@/lib/utils"
import type { BookingCepatRow } from "@/lib/booking/booking-cepat-list"
import type { BookingCepatWay } from "@/lib/validations/booking-cepat"
import {
  getCounselorAvailableSlotsAction,
  getOfferedServicesForCounselorAction,
} from "@/app/admin/sessions/manual-booking-actions"
import { createBookingCepatAction } from "./actions"
import { bookingCepatTableConfig } from "./table-config"

interface Option {
  id: string
  label: string
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

const WAY_LABEL: Record<BookingCepatWay, string> = {
  xendit: "Tautan Xendit",
  transfer: "Bukti transfer (Admin)",
  manual_zero: "Booking Manual Rp 0",
}

export function BookingCepatClient({
  rows,
  total,
  counselors,
  state,
  pathname,
}: {
  rows: BookingCepatRow[]
  total: number
  counselors: { id: string; fullName: string }[]
  state: TableState
  pathname: string
}) {
  const router = useRouter()
  const [counselorId, setCounselorId] = React.useState("")
  const [services, setServices] = React.useState<Option[]>([])
  const [slots, setSlots] = React.useState<Option[]>([])
  const [serviceId, setServiceId] = React.useState("")
  const [scheduleId, setScheduleId] = React.useState("")
  const [way, setWay] = React.useState<BookingCepatWay>("xendit")
  const [reason, setReason] = React.useState("")
  const [proofKey, setProofKey] = React.useState("")
  const [referenceNumber, setReferenceNumber] = React.useState("")
  const [uploading, setUploading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [result, setResult] = React.useState<{ paymentUrl: string; waUrl: string | null; holdExpiresAt: string } | null>(
    null
  )
  const formRef = React.useRef<HTMLFormElement>(null)

  React.useEffect(() => {
    setServices([])
    setSlots([])
    setServiceId("")
    setScheduleId("")
    if (!counselorId) return
    let cancelled = false
    void (async () => {
      const [svc, slt] = await Promise.all([
        getOfferedServicesForCounselorAction(counselorId),
        getCounselorAvailableSlotsAction(counselorId),
      ])
      if (cancelled) return
      if (svc.success) setServices(svc.data.map((s) => ({ id: s.serviceId, label: s.name })))
      else toast.error(svc.error ?? "Gagal memuat Layanan.")
      if (slt.success) {
        setSlots(
          (slt.data ?? []).map((s: { id: string; date: string; startTime: string; endTime: string }) => ({
            id: s.id,
            label: `${formatDateId(s.date)} · ${s.startTime.slice(0, 5)} - ${s.endTime.slice(0, 5)} WIB`,
          }))
        )
      } else toast.error(slt.error ?? "Gagal memuat slot.")
    })()
    return () => {
      cancelled = true
    }
  }, [counselorId])

  async function uploadProof(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      body.append("category", "payment-proof")
      const res = await fetch("/api/upload", { method: "POST", body })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setProofKey(json.data.r2Key)
      toast.success("Bukti transfer terunggah.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah bukti.")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payment =
      way === "xendit"
        ? { way }
        : way === "transfer"
          ? { way, proofR2Key: proofKey, referenceNumber: referenceNumber || null }
          : { way, reason }
    setSubmitting(true)
    setResult(null)
    try {
      const res = await createBookingCepatAction({
        counselorId,
        scheduleId,
        serviceId,
        patientName: fd.get("patientName"),
        patientEmail: fd.get("patientEmail"),
        patientPhone: fd.get("patientPhone"),
        initialNotes: fd.get("initialNotes") || null,
        payment,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      if (res.data.way === "xendit" && res.data.paymentUrl) {
        setResult({
          paymentUrl: res.data.paymentUrl,
          waUrl: res.data.waUrl ?? null,
          holdExpiresAt: res.data.holdExpiresAt ?? "",
        })
        toast.success("Tautan pembayaran dibuat. Slot ditahan.")
      } else if (res.data.fulfilled === false) {
        toast.warning(`Booking tersimpan, tetapi Pemenuhan Sesi gagal: ${res.data.fulfillError ?? "tidak diketahui"}`)
      } else {
        toast.success("Booking terkonfirmasi.")
      }
      formRef.current?.reset()
      setReason("")
      setProofKey("")
      setReferenceNumber("")
      setCounselorId("")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const columns: DataTableColumn<BookingCepatRow>[] = [
    {
      id: "client",
      header: "Klien",
      sortKey: "patientName",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.patientName}</span>
          <span className="font-mono text-xs text-muted-foreground">{r.patientPhone}</span>
          <span className="font-mono text-xs text-muted-foreground">{r.bookingCode}</span>
        </div>
      ),
    },
    {
      id: "schedule",
      header: "Jadwal",
      sortKey: "scheduleDate",
      cell: (r) => (
        <div className="flex flex-col text-sm">
          <span>{r.scheduleDate ? formatDateId(r.scheduleDate) : "-"}</span>
          <span className="text-xs text-muted-foreground">{r.timeRange} WIB</span>
        </div>
      ),
    },
    { id: "counselor", header: "Konselor", cell: (r) => r.counselorName },
    {
      id: "payment",
      header: "Pembayaran",
      cell: (r) => (
        <div className="flex flex-col text-sm">
          <span>{r.paymentLabel}</span>
          <span className="text-xs text-muted-foreground">{formatRupiah(r.netAmount)}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      cell: (r) => (
        <div className="flex flex-col gap-1">
          <Badge variant="outline">{r.status}</Badge>
          {r.holdUntil ? (
            <span className="text-xs text-muted-foreground">Hold sampai {formatDateTimeWib(r.holdUntil)}</span>
          ) : null}
        </div>
      ),
    },
    { id: "created", header: "Dibuat", sortKey: "createdAt", cell: (r) => formatDateTimeWib(r.createdAt) },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Booking Cepat</h1>
        <p className="text-sm text-muted-foreground">
          Buat booking untuk klien yang menghubungi lewat WhatsApp. Pilih salah satu cara bayar; semuanya tercatat di
          Jejak Audit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap aria-hidden className="size-4" /> Booking baru
          </CardTitle>
          <CardDescription>Slot ditahan untuk tautan Xendit sampai batas hold (default 60 menit).</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="counselor">Konselor</Label>
              <select id="counselor" required className={selectClass} value={counselorId} onChange={(e) => setCounselorId(e.target.value)}>
                <option value="">Pilih konselor</option>
                {counselors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="service">Layanan</Label>
              <select id="service" required className={selectClass} value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={!counselorId}>
                <option value="">Pilih Layanan</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="slot">Slot</Label>
              <select id="slot" required className={selectClass} value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} disabled={!counselorId}>
                <option value="">{counselorId && slots.length === 0 ? "Tidak ada slot tersedia" : "Pilih slot"}</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="patientName">Nama klien</Label>
              <Input id="patientName" name="patientName" required minLength={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="patientPhone">Nomor WhatsApp</Label>
              <Input id="patientPhone" name="patientPhone" required inputMode="tel" placeholder="08123456789" />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="patientEmail">Email</Label>
              <Input id="patientEmail" name="patientEmail" type="email" required />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="initialNotes">Catatan awal (opsional)</Label>
              <Textarea id="initialNotes" name="initialNotes" maxLength={1000} rows={2} />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="way">Cara bayar</Label>
              <select id="way" className={selectClass} value={way} onChange={(e) => setWay(e.target.value as BookingCepatWay)}>
                {(Object.keys(WAY_LABEL) as BookingCepatWay[]).map((w) => (
                  <option key={w} value={w}>
                    {WAY_LABEL[w]}
                  </option>
                ))}
              </select>
            </div>

            {way === "transfer" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="proof">Bukti transfer</Label>
                  <Input
                    id="proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void uploadProof(f)
                    }}
                  />
                  {proofKey ? <span className="text-xs text-muted-foreground">Terunggah: {proofKey}</span> : null}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ref">Nomor referensi (opsional)</Label>
                  <Input id="ref" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
                </div>
              </>
            ) : null}

            {way === "manual_zero" ? (
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="reason">Alasan Booking Manual Rp 0 (wajib)</Label>
                <Textarea id="reason" required minLength={3} maxLength={500} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                <span className="text-xs text-muted-foreground">
                  Klien tidak membayar, tetapi Honor Konselor tetap dihitung dari tarif aktif Layanan.
                </span>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting || uploading || (way === "transfer" && !proofKey)}>
                {submitting ? <Spinner /> : <Zap aria-hidden />}
                {way === "xendit" ? "Buat tautan pembayaran" : "Buat & konfirmasi booking"}
              </Button>
            </div>
          </form>

          {result ? (
            <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">Tautan pembayaran siap</p>
              <p className="break-all font-mono text-xs">{result.paymentUrl}</p>
              <p className="text-xs text-muted-foreground">
                Slot ditahan sampai {result.holdExpiresAt ? formatDateTimeWib(result.holdExpiresAt) : "-"}.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(result.paymentUrl)
                    toast.success("Tautan disalin.")
                  }}
                >
                  <Copy aria-hidden /> Salin tautan
                </Button>
                {result.waUrl ? (
                  <Button size="sm" asChild>
                    <a href={result.waUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle aria-hidden /> Kirim via WhatsApp
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <DataTableToolbar
        pathname={pathname}
        state={state}
        config={bookingCepatTableConfig}
        search={{ name: "q", placeholder: "Cari klien, kode, nomor" }}
        selects={[
          {
            name: "status",
            placeholder: "Status",
            allLabel: "Semua status",
            options: [
              { value: "pending_payment", label: "Menunggu bayar" },
              { value: "confirmed", label: "Terkonfirmasi" },
              { value: "expired", label: "Kedaluwarsa" },
              { value: "completed", label: "Selesai" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.bookingId}
        total={total}
        state={state}
        config={bookingCepatTableConfig}
        pathname={pathname}
        empty={{
          icon: <Zap aria-hidden />,
          title: "Belum ada Booking Cepat",
          description: "Booking yang dibuat dari formulir di atas akan tampil di sini.",
        }}
      />
    </div>
  )
}
