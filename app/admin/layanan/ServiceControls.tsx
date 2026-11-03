"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Power } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { ServiceFormInput } from "@/lib/services/validation"
import {
  createServiceAction,
  setServiceActiveAction,
  updateServiceAction,
  type LayananActionResult,
} from "./actions"

/** Nilai awal form dari baris Layanan; angka sudah berupa number (diserialisasi server). */
export interface ServiceFormSeed extends ServiceFormInput {
  id: string
  isActive: boolean
}

const TYPE_LABEL = { peer: "Konselor Sebaya", psychologist: "Psikolog Klinis" } as const

const EMPTY: ServiceFormInput = {
  name: "",
  description: "",
  basePrice: 0,
  promoPrice: null,
  allowVoucher: true,
  overtimeRatePer30Min: 0,
  basePayoutPercent: 70,
  overtimePayoutPercent: 80,
  allowedCounselorTypes: [],
  sortOrder: 0,
}

function numberValue(raw: string): number {
  return raw.trim() === "" ? NaN : Number(raw)
}

function ServiceFormDialog({
  seed,
  open,
  onOpenChange,
}: {
  seed: ServiceFormSeed | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [form, setForm] = React.useState<ServiceFormInput>(seed ?? EMPTY)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (open) {
      setForm(seed ?? EMPTY)
      setError(null)
    }
  }, [open, seed])

  const set = <K extends keyof ServiceFormInput>(key: K, value: ServiceFormInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleType = (type: string, on: boolean) =>
    set(
      "allowedCounselorTypes",
      on
        ? Array.from(new Set([...form.allowedCounselorTypes, type]))
        : form.allowedCounselorTypes.filter((t) => t !== type)
    )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res: LayananActionResult = seed
        ? await updateServiceAction(seed.id, form)
        : await createServiceAction(form)
      if (!res.success) {
        setError(res.error)
        return
      }
      toast.success(res.message)
      onOpenChange(false)
      router.refresh()
    })
  }

  const promoOn = form.promoPrice !== null && form.promoPrice !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{seed ? "Ubah Layanan" : "Tambah Layanan"}</DialogTitle>
          <DialogDescription>
            Durasi Layanan selalu 90 menit. Perubahan tarif tidak mengubah booking yang sudah dibuat.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-name">Nama Layanan</Label>
            <Input id="svc-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-desc">Deskripsi</Label>
            <Textarea
              id="svc-desc"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-base">Tarif dasar (Rp)</Label>
              <Input
                id="svc-base"
                inputMode="numeric"
                value={Number.isNaN(form.basePrice) ? "" : form.basePrice}
                onChange={(e) => set("basePrice", numberValue(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-overtime">Tarif overtime per 30 menit (Rp)</Label>
              <Input
                id="svc-overtime"
                inputMode="numeric"
                value={Number.isNaN(form.overtimeRatePer30Min) ? "" : form.overtimeRatePer30Min}
                onChange={(e) => set("overtimeRatePer30Min", numberValue(e.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <Label htmlFor="svc-promo-on">Promo aktif</Label>
            <Switch
              id="svc-promo-on"
              checked={promoOn}
              onCheckedChange={(on) => set("promoPrice", on ? 0 : null)}
            />
          </div>
          {promoOn ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-promo">Tarif promo (Rp)</Label>
              <Input
                id="svc-promo"
                inputMode="numeric"
                value={form.promoPrice == null || Number.isNaN(form.promoPrice) ? "" : form.promoPrice}
                onChange={(e) => set("promoPrice", numberValue(e.target.value))}
              />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <Label htmlFor="svc-voucher">Izinkan voucher</Label>
            <Switch
              id="svc-voucher"
              checked={form.allowVoucher}
              onCheckedChange={(on) => set("allowVoucher", on)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-payout">Bagi Hasil pokok (%)</Label>
              <Input
                id="svc-payout"
                inputMode="numeric"
                value={Number.isNaN(form.basePayoutPercent) ? "" : form.basePayoutPercent}
                onChange={(e) => set("basePayoutPercent", numberValue(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="svc-payout-ot">Bagi Hasil overtime (%)</Label>
              <Input
                id="svc-payout-ot"
                inputMode="numeric"
                value={Number.isNaN(form.overtimePayoutPercent) ? "" : form.overtimePayoutPercent}
                onChange={(e) => set("overtimePayoutPercent", numberValue(e.target.value))}
              />
            </div>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Tipe Konselor yang diizinkan</legend>
            {(Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`svc-type-${type}`}
                  checked={form.allowedCounselorTypes.includes(type)}
                  onCheckedChange={(on) => toggleType(type, on === true)}
                />
                <Label htmlFor={`svc-type-${type}`}>{TYPE_LABEL[type]}</Label>
              </div>
            ))}
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-sort">Urutan tampil</Label>
            <Input
              id="svc-sort"
              inputMode="numeric"
              value={form.sortOrder === undefined || Number.isNaN(form.sortOrder) ? "" : form.sortOrder}
              onChange={(e) => set("sortOrder", numberValue(e.target.value))}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreateServiceButton() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Tambah Layanan
      </Button>
      <ServiceFormDialog seed={null} open={open} onOpenChange={setOpen} />
    </>
  )
}

export function ServiceRowActions({ service }: { service: ServiceFormSeed }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  const toggle = () =>
    startTransition(async () => {
      const res = await setServiceActiveAction(service.id, !service.isActive)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })

  return (
    <div className="flex justify-end gap-1">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil data-icon="inline-start" />
        Ubah
      </Button>
      <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
        <Power data-icon="inline-start" />
        {service.isActive ? "Nonaktifkan" : "Aktifkan"}
      </Button>
      <ServiceFormDialog seed={service} open={open} onOpenChange={setOpen} />
    </div>
  )
}
