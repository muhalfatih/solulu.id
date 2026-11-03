"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Copy, Loader2, Percent, Plus, Search, Tag, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  createVoucherAdminAction,
  deleteVoucherAdminAction,
  toggleVoucherStatusAction,
} from "@/app/admin/pricing/actions"
import { formatDateId } from "@/lib/format/datetime"
import { formatRupiah } from "@/lib/utils"

export interface VoucherRow {
  id: string
  code: string
  discountType: "fixed" | "percentage"
  discountValue: number
  quota: number
  usedCount: number
  expiresAt: string | null
  isActive: boolean
}

type VoucherStatus = "active" | "inactive" | "exhausted" | "expired"
type StatusFilter = "all" | "active" | "inactive"

const STATUS_LABEL: Record<VoucherStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  exhausted: "Kuota habis",
  expired: "Kedaluwarsa",
}

function statusOf(v: VoucherRow, now: number): VoucherStatus {
  if (!v.isActive) return "inactive"
  if (v.quota > 0 && v.usedCount >= v.quota) return "exhausted"
  if (v.expiresAt && new Date(v.expiresAt).getTime() < now) return "expired"
  return "active"
}

const describeDiscount = (v: VoucherRow) =>
  v.discountType === "percentage" ? `Diskon ${v.discountValue}%` : `Potongan ${formatRupiah(v.discountValue)}`

export function VouchersClient({ rows, canMutate }: { rows: VoucherRow[]; canMutate: boolean }) {
  const router = useRouter()
  const [now] = React.useState(() => Date.now())
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<StatusFilter>("all")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<VoucherRow | null>(null)
  const [pending, startTransition] = React.useTransition()

  const [code, setCode] = React.useState("")
  const [discountType, setDiscountType] = React.useState<"fixed" | "percentage">("fixed")
  const [discountValue, setDiscountValue] = React.useState("")
  const [quota, setQuota] = React.useState("")
  const [expiry, setExpiry] = React.useState("")
  const [formError, setFormError] = React.useState<string | null>(null)

  const visible = rows.filter((v) => {
    const q = query.trim().toLowerCase()
    const matchQuery = !q || v.code.toLowerCase().includes(q) || describeDiscount(v).toLowerCase().includes(q)
    const status = statusOf(v, now)
    const matchStatus = filter === "all" || (filter === "active" ? status === "active" : status !== "active")
    return matchQuery && matchStatus
  })
  const activeCount = rows.filter((v) => statusOf(v, now) === "active").length

  function resetForm() {
    setCode("")
    setDiscountType("fixed")
    setDiscountValue("")
    setQuota("")
    setExpiry("")
    setFormError(null)
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(discountValue)
    const quotaNum = Number(quota)
    if (!code.trim()) return setFormError("Kode voucher wajib diisi.")
    if (!Number.isFinite(value) || value <= 0) return setFormError("Besaran diskon harus lebih dari 0.")
    if (discountType === "percentage" && value > 100) return setFormError("Persentase diskon maksimal 100.")
    if (!Number.isInteger(quotaNum) || quotaNum <= 0) return setFormError("Kuota harus bilangan bulat lebih dari 0.")
    setFormError(null)
    startTransition(async () => {
      const res = await createVoucherAdminAction({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: value,
        quota: quotaNum,
        expiresAt: expiry ? new Date(`${expiry}T23:59:59+07:00`) : null,
        isActive: true,
      })
      if (!res.success) return setFormError(res.error ?? "Gagal membuat voucher.")
      toast.success(`Voucher ${code.trim().toUpperCase()} dibuat.`)
      setCreateOpen(false)
      resetForm()
      router.refresh()
    })
  }

  function toggle(v: VoucherRow) {
    startTransition(async () => {
      const res = await toggleVoucherStatusAction(v.id, !v.isActive)
      if (!res.success) return void toast.error(res.error ?? "Gagal mengubah status voucher.")
      toast.success(`Voucher ${v.code} ${v.isActive ? "dinonaktifkan" : "diaktifkan"}.`)
      router.refresh()
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    startTransition(async () => {
      const res = await deleteVoucherAdminAction(target.id)
      if (!res.success) return void toast.error(res.error ?? "Gagal menghapus voucher.")
      toast.success(`Voucher ${target.code} dihapus.`)
      setDeleteTarget(null)
      router.refresh()
    })
  }

  async function copyCode(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`Kode ${value} disalin.`)
    } catch {
      toast.error("Tidak dapat menyalin kode.")
    }
  }

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `Semua (${rows.length})` },
    { value: "active", label: `Aktif (${activeCount})` },
    { value: "inactive", label: `Tidak aktif (${rows.length - activeCount})` },
  ]

  return (
    <>
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Daftar Voucher</CardTitle>
              <CardDescription>{rows.length} voucher terdaftar.</CardDescription>
            </div>
            {canMutate && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus data-icon="inline-start" />
                Buat Voucher
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kode atau besaran"
                aria-label="Cari voucher"
                className="pl-9"
              />
            </div>
            <div role="group" aria-label="Filter status" className="flex flex-wrap gap-2">
              {filterOptions.map((o) => (
                <Button
                  key={o.value}
                  size="sm"
                  variant={filter === o.value ? "default" : "outline"}
                  aria-pressed={filter === o.value}
                  onClick={() => setFilter(o.value)}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Tag />
                </EmptyMedia>
                <EmptyTitle>{rows.length === 0 ? "Belum ada voucher" : "Tidak ada voucher yang cocok"}</EmptyTitle>
                <EmptyDescription>
                  {rows.length === 0
                    ? "Voucher yang dibuat Superadmin akan muncul di sini."
                    : "Ubah kata kunci atau filter status."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Besaran</TableHead>
                  <TableHead className="min-w-44">Kuota terpakai</TableHead>
                  <TableHead>Berlaku hingga</TableHead>
                  <TableHead>Status</TableHead>
                  {canMutate && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((v) => {
                  const status = statusOf(v, now)
                  const percent = Math.min(100, Math.round((v.usedCount / Math.max(1, v.quota)) * 100))
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{v.code}</span>
                          <Button variant="ghost" size="icon-xs" onClick={() => copyCode(v.code)} aria-label={`Salin kode ${v.code}`}>
                            <Copy />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.discountType === "percentage" ? "secondary" : "outline"}>
                          {v.discountType === "percentage" && <Percent data-icon="inline-start" />}
                          {describeDiscount(v)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-48 flex-col gap-1.5">
                          <span className="text-xs tabular-nums">
                            {v.usedCount} / {v.quota} terpakai
                          </span>
                          <Progress value={percent} aria-label={`Kuota ${v.code} terpakai ${percent} persen`} />
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{v.expiresAt ? formatDateId(v.expiresAt) : "Tanpa batas"}</TableCell>
                      <TableCell>
                        <Badge variant={status === "active" ? "default" : status === "expired" ? "outline" : "secondary"}>
                          {STATUS_LABEL[status]}
                        </Badge>
                      </TableCell>
                      {canMutate && (
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={v.isActive}
                              disabled={pending}
                              onCheckedChange={() => toggle(v)}
                              aria-label={`Aktifkan voucher ${v.code}`}
                            />
                            <Button variant="ghost" size="icon-xs" onClick={() => setDeleteTarget(v)} aria-label={`Hapus voucher ${v.code}`}>
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitCreate} className="flex flex-col gap-5" noValidate>
            <DialogHeader>
              <DialogTitle>Buat Voucher</DialogTitle>
              <DialogDescription>Kode unik yang dapat dipakai klien saat pembayaran.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="voucher-code">Kode</FieldLabel>
                <FieldDescription>Huruf kapital dan angka tanpa spasi, misalnya SOLULUHEMAT.</FieldDescription>
                <Input
                  id="voucher-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  className="font-mono uppercase"
                  autoComplete="off"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Tipe diskon</FieldLabel>
                <div role="group" aria-label="Tipe diskon" className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={discountType === "fixed" ? "default" : "outline"} aria-pressed={discountType === "fixed"} onClick={() => setDiscountType("fixed")}>
                    Nominal (Rp)
                  </Button>
                  <Button type="button" variant={discountType === "percentage" ? "default" : "outline"} aria-pressed={discountType === "percentage"} onClick={() => setDiscountType("percentage")}>
                    Persentase (%)
                  </Button>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="voucher-value">{discountType === "fixed" ? "Nominal potongan (Rp)" : "Besaran diskon (%)"}</FieldLabel>
                <Input
                  id="voucher-value"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={discountType === "percentage" ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="voucher-quota">Kuota pemakaian</FieldLabel>
                  <Input id="voucher-quota" type="number" inputMode="numeric" min={1} value={quota} onChange={(e) => setQuota(e.target.value)} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="voucher-expiry">Berlaku hingga (WIB)</FieldLabel>
                  <Input id="voucher-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                </Field>
              </div>
            </FieldGroup>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={pending}>
                Batal
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
                Simpan Voucher
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus voucher {deleteTarget?.code}?</DialogTitle>
            <DialogDescription>
              Tindakan ini permanen dan tercatat di jejak audit. Kode tidak dapat dipakai lagi oleh klien.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
              {pending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Ya, hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
