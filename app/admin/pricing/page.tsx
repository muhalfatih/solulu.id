"use client"

import * as React from "react"
import {
  Tag,
  DollarSign,
  Plus,
  Check,
  X,
  Search,
  Percent,
  Calendar,
  ShieldCheck,
  Flame,
  Info,
  TrendingUp,
  BadgePercent,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getPlatformPricingAction,
  updateRolePricingAction,
  getVouchersAdminAction,
  createVoucherAdminAction,
  toggleVoucherStatusAction,
} from "./actions"

interface RolePricingState {
  id: "sebaya" | "psikolog"
  title: string
  subtitle: string
  badge: string
  duration: string
  regularPrice: number
  isSaleActive: boolean
  salePrice: number
  allowVoucher: boolean
}

interface VoucherItem {
  id?: string
  code: string
  discount: string
  discountType?: "fixed" | "percentage"
  discountValue?: number
  usedQuota: number
  totalQuota: number
  status: "active" | "exhausted" | "expired"
  expiryDate: string
}

const INITIAL_ROLES: RolePricingState[] = [
  {
    id: "sebaya",
    title: "Konselor Sebaya",
    subtitle: "Pendampingan emosional dan stres ringan hingga sedang.",
    badge: "Non-Klinis",
    duration: "90 Menit",
    regularPrice: 75000,
    isSaleActive: true,
    salePrice: 49000,
    allowVoucher: false,
  },
  {
    id: "psikolog",
    title: "Psikolog Klinis",
    subtitle: "Intervensi klinis psikoterapeutik dan rujukan SRQ-20.",
    badge: "Izin Praktik Aktif",
    duration: "90 Menit",
    regularPrice: 150000,
    isSaleActive: true,
    salePrice: 129000,
    allowVoucher: true,
  },
]

export default function PricingAdminPage() {
  const [roles, setRoles] = React.useState<RolePricingState[]>(INITIAL_ROLES)
  const [vouchers, setVouchers] = React.useState<VoucherItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "exhausted">("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newCode, setNewCode] = React.useState("")
  const [newDiscount, setNewDiscount] = React.useState("")
  const [newQuota, setNewQuota] = React.useState("50")
  const [newExpiry, setNewExpiry] = React.useState("31 Des 2026")
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [pricingRes, vouchersRes] = await Promise.all([
        getPlatformPricingAction(),
        getVouchersAdminAction(),
      ])

      if (pricingRes.success && pricingRes.data) {
        setRoles([
          {
            id: "sebaya",
            title: "Konselor Sebaya",
            subtitle: "Pendampingan emosional dan stres ringan hingga sedang.",
            badge: "Non-Klinis",
            duration: "90 Menit",
            regularPrice: pricingRes.data.peer.basePrice,
            isSaleActive: pricingRes.data.peer.isSaleActive,
            salePrice: pricingRes.data.peer.promoPrice,
            allowVoucher: pricingRes.data.peer.allowVoucher,
          },
          {
            id: "psikolog",
            title: "Psikolog Klinis",
            subtitle: "Intervensi klinis psikoterapeutik dan rujukan SRQ-20.",
            badge: "Izin Praktik Aktif",
            duration: "90 Menit",
            regularPrice: pricingRes.data.psychologist.basePrice,
            isSaleActive: pricingRes.data.psychologist.isSaleActive,
            salePrice: pricingRes.data.psychologist.promoPrice,
            allowVoucher: pricingRes.data.psychologist.allowVoucher,
          },
        ])
      }

      if (vouchersRes.success && vouchersRes.data) {
        const mappedVouchers: VoucherItem[] = vouchersRes.data.map((v: any) => {
          const valNum = Number(v.discountValue)
          const discountStr =
            v.discountType === "percentage"
              ? `Diskon ${valNum}%`
              : `Potongan Rp ${valNum.toLocaleString("id-ID")}`
          const isExpired = v.expiresAt
            ? new Date(v.expiresAt).getTime() < Date.now()
            : false
          const isExhausted = v.quota > 0 && v.usedCount >= v.quota
          const status =
            !v.isActive || isExhausted
              ? "exhausted"
              : isExpired
              ? "expired"
              : "active"
          const expiryDate = v.expiresAt
            ? new Date(v.expiresAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Tanpa Batas"

          return {
            id: v.id,
            code: v.code,
            discount: discountStr,
            discountType: v.discountType,
            discountValue: valNum,
            usedQuota: v.usedCount ?? 0,
            totalQuota: v.quota,
            status,
            expiryDate,
          }
        })
        setVouchers(mappedVouchers)
      } else {
        setVouchers([])
      }
    } catch (err) {
      console.error("Failed to load pricing and vouchers:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleUpdateRole = (id: "sebaya" | "psikolog", field: Partial<RolePricingState>) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...field } : r)))
  }

  const handleSavePricing = async () => {
    setIsSaving(true)
    try {
      for (const role of roles) {
        await updateRolePricingAction(role.id, {
          regularPrice: role.regularPrice,
          salePrice: role.salePrice,
          isSaleActive: role.isSaleActive,
          allowVoucher: role.allowVoucher,
        })
      }
      showToast("Perubahan tarif berhasil disimpan ke database dan disinkronkan.")
    } catch {
      showToast("Gagal menyimpan tarif ke database.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleVoucherStatus = async (code: string) => {
    const target = vouchers.find((v) => v.code === code)
    if (!target) return
    const nextActive = target.status !== "active"

    if (target.id) {
      try {
        await toggleVoucherStatusAction(target.id, nextActive)
      } catch (err) {
        console.error("Failed to toggle voucher status in DB:", err)
      }
    }

    setVouchers((prev) =>
      prev.map((v) => {
        if (v.code === code) {
          const nextStatus = nextActive ? "active" : "exhausted"
          showToast(`Voucher ${code} sekarang ${nextStatus === "active" ? "aktif" : "nonaktif"}.`)
          return { ...v, status: nextStatus }
        }
        return v
      })
    )
  }

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return

    const isPercentage = newDiscount.includes("%")
    const cleanNum = Number(newDiscount.replace(/[^0-9]/g, "")) || 25000
    const quotaNum = Number(newQuota) || 50

    try {
      const res = await createVoucherAdminAction({
        code: newCode.trim().toUpperCase(),
        discountType: isPercentage ? "percentage" : "fixed",
        discountValue: cleanNum,
        quota: quotaNum,
        expiresAt: new Date("2026-12-31T23:59:59+07:00"),
        isActive: true,
      })

      if (res.success && res.data) {
        loadData()
        showToast(`Voucher ${newCode.toUpperCase()} berhasil disimpan ke database.`)
      } else {
        showToast(res.error || "Gagal membuat voucher.")
      }
    } catch {
      showToast("Terjadi kesalahan saat membuat voucher.")
    }

    setIsModalOpen(false)
    setNewCode("")
    setNewDiscount("")
    setNewQuota("50")
  }

  const filteredVouchers = vouchers.filter((v) => {
    const matchQuery =
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.discount.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && v.status === "active") ||
      (statusFilter === "exhausted" && v.status !== "active")
    return matchQuery && matchStatus
  })

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md"
        >
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary shrink-0" aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tarif & Promo
            </h1>
            <Badge variant="outline" className="text-xs font-mono py-0.5 px-2">
              SESI 90 MENIT
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Atur tarif sesi konseling 90 menit dan kelola kuota voucher pasien.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-8 text-xs font-medium gap-1.5"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            <span>Buat Voucher</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: TARIF SESI 90 MENIT (2 Side-by-Side Cards) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-primary" aria-hidden="true" />
            <h2 className="font-bold text-foreground text-base tracking-tight">
              Tarif Sesi Konseling 90 Menit
            </h2>
            <Badge variant="outline" className="font-mono text-[10px]">
              2 PERAN
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span>Biaya gateway Xendit diserap platform.</span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePricing}
              disabled={isSaving}
              className="h-8 text-xs font-medium cursor-pointer"
            >
              {isSaving ? "Menyimpan..." : "Simpan Tarif"}
            </Button>
          </div>
        </div>

        {/* 2-Column Grid: Role 1 (Konselor Sebaya) & Role 2 (Psikolog Klinis) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div
                key={`pricing-skel-${i}`}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xs animate-pulse"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
                    <Skeleton className="h-5 w-36 rounded" />
                    <Skeleton className="h-5 w-24 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-20 rounded" />
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Skeleton className="h-6 w-48 rounded" />
                    <Skeleton className="h-6 w-56 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            roles.map((role) => {
            const discountNominal = Math.max(0, role.regularPrice - role.salePrice)
            const discountPercent =
              role.regularPrice > 0 ? Math.round((discountNominal / role.regularPrice) * 100) : 0
            const activePrice = role.isSaleActive ? role.salePrice : role.regularPrice

            return (
              <div
                key={role.id}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xs"
              >
                {/* Upper: Role Header & Rate status */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm tracking-tight">{role.title}</span>
                      <Badge
                        variant={role.id === "psikolog" ? "default" : "secondary"}
                        className="text-[10px] py-0 px-2 font-medium"
                      >
                        {role.badge}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">Tarif Aktif:</span>
                      <span className="text-sm font-bold text-foreground font-mono tabular-nums">
                        Rp {activePrice.toLocaleString("id-ID")}
                      </span>
                      {role.isSaleActive && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          (-{discountPercent}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Inputs: Paired 2-Column Grid when Promo is active */}
                  <div className={`grid ${role.isSaleActive ? "grid-cols-2 gap-3" : "grid-cols-1"} items-end`}>
                    {/* Tarif Reguler */}
                    <div className="flex flex-col gap-1">
                      <div className="h-5 flex items-center">
                        <Label
                          htmlFor={`reg-${role.id}`}
                          className="text-[11px] font-medium text-muted-foreground"
                        >
                          Tarif Reguler
                        </Label>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-muted-foreground font-mono">
                          Rp
                        </span>
                        <Input
                          id={`reg-${role.id}`}
                          type="number"
                          step="5000"
                          value={role.regularPrice}
                          onChange={(e) =>
                            handleUpdateRole(role.id, { regularPrice: Number(e.target.value) || 0 })
                          }
                          className="pl-9 h-8 text-xs font-semibold bg-background font-mono tabular-nums"
                          aria-label={`Tarif reguler ${role.title}`}
                        />
                      </div>
                    </div>

                    {/* Tarif Promo */}
                    {role.isSaleActive && (
                      <div className="flex flex-col gap-1">
                        <div className="h-5 flex items-center justify-between">
                          <Label
                            htmlFor={`sale-val-${role.id}`}
                            className="text-[11px] font-medium text-primary"
                          >
                            Tarif Promo
                          </Label>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                            Hemat Rp {discountNominal.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs text-muted-foreground font-mono">
                            Rp
                          </span>
                          <Input
                            id={`sale-val-${role.id}`}
                            type="number"
                            step="5000"
                            value={role.salePrice}
                            onChange={(e) =>
                              handleUpdateRole(role.id, { salePrice: Number(e.target.value) || 0 })
                            }
                            className="pl-9 h-8 text-xs font-bold text-primary bg-background font-mono tabular-nums"
                            aria-label={`Nominal harga promo ${role.title}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lower: Dual Controls */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3 text-xs">
                  {/* Switch Promo */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`sale-switch-${role.id}`}
                      checked={role.isSaleActive}
                      onCheckedChange={(checked) => {
                        handleUpdateRole(role.id, { isSaleActive: checked })
                        showToast(`${role.title}: tarif promo ${checked ? "diaktifkan" : "dimatikan"}.`)
                      }}
                      size="sm"
                      aria-label={`Toggle harga promo ${role.title}`}
                    />
                    <Label
                      htmlFor={`sale-switch-${role.id}`}
                      className="text-[11px] font-medium text-foreground cursor-pointer flex items-center gap-1"
                    >
                      <Flame
                        className={`size-3 ${role.isSaleActive ? "text-amber-500" : "text-muted-foreground"}`}
                        aria-hidden="true"
                      />
                      <span>Promo Aktif</span>
                    </Label>
                  </div>

                  {/* Switch Tambahan Voucher */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`v-perm-${role.id}`}
                      checked={role.allowVoucher}
                      onCheckedChange={(checked) =>
                        handleUpdateRole(role.id, { allowVoucher: checked })
                      }
                      size="sm"
                      aria-label={`Izin tambahan voucher ${role.title}`}
                    />
                    <Label
                      htmlFor={`v-perm-${role.id}`}
                      className="text-[11px] text-muted-foreground cursor-pointer"
                      title={role.allowVoucher ? "Bisa digabung dengan voucher diskon" : "Tarif promo nett tanpa tambahan voucher"}
                    >
                      {role.allowVoucher ? "Bisa Ditumpuk Voucher" : "Promo Nett"}
                    </Label>
                  </div>
                </div>
              </div>
            )
          })
          )}
        </div>
      </div>

      {/* SECTION 2: MANAJEMEN VOUCHER & TELEMETRI (Full-Width Card) */}
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 shadow-xs">
        {/* Telemetry Status Strip */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Tag className="size-3.5 text-primary" aria-hidden="true" />
              <span>
                <strong className="text-foreground font-mono">
                  {vouchers.filter((v) => v.status === "active").length}
                </strong>{" "}
                Voucher Aktif
              </span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>
                <strong className="text-foreground font-mono">
                  {Math.round(
                    (vouchers.reduce((acc, v) => acc + v.usedQuota, 0) /
                      Math.max(1, vouchers.reduce((acc, v) => acc + v.totalQuota, 0))) *
                      100
                  )}%
                </strong>{" "}
                Kuota Terpakai ({vouchers.reduce((acc, v) => acc + v.usedQuota, 0)}/{vouchers.reduce((acc, v) => acc + v.totalQuota, 0)})
              </span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <BadgePercent className="size-3.5 text-primary" aria-hidden="true" />
              <span>
                <strong className="text-foreground font-mono">Rp 1,75 Jt</strong> Total Potongan
              </span>
            </div>
          </div>

        </div>

        {/* Table Toolbar: Search and Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Cari kode atau nominal voucher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
              aria-label="Cari kode voucher"
            />
          </div>

          {/* Filter Segmented Control */}
          <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`h-7 px-3 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "all"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({vouchers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`h-7 px-3 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "active"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Aktif ({vouchers.filter((v) => v.status === "active").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("exhausted")}
              className={`h-7 px-3 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "exhausted"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nonaktif ({vouchers.filter((v) => v.status !== "active").length})
            </button>
          </div>
        </div>

        {/* Vouchers Table */}
        <div className="border border-border/80 rounded-xl overflow-hidden">
          <Table className="text-xs">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="py-3 px-3.5 font-semibold text-foreground">Kode</TableHead>
                <TableHead className="py-3 px-3.5 font-semibold text-foreground">Potongan</TableHead>
                <TableHead className="py-3 px-3.5 font-semibold text-foreground">Kuota Terpakai</TableHead>
                <TableHead className="py-3 px-3.5 font-semibold text-foreground">Berlaku Hingga</TableHead>
                <TableHead className="py-3 px-3.5 font-semibold text-foreground text-right">Status & Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`voucher-skel-${i}`} className="border-border/60">
                    <TableCell className="py-3.5 px-3.5">
                      <Skeleton className="h-4 w-24 rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-3.5">
                      <Skeleton className="h-4 w-28 rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-3.5">
                      <Skeleton className="h-3.5 w-32 rounded mb-1" />
                      <Skeleton className="h-1.5 w-32 rounded-full" />
                    </TableCell>
                    <TableCell className="py-3.5 px-3.5">
                      <Skeleton className="h-3.5 w-20 rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-5 w-14 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredVouchers.length > 0 ? (
                filteredVouchers.map((v) => {
                  const percent = Math.round((v.usedQuota / v.totalQuota) * 100)
                  const isActive = v.status === "active"

                  return (
                    <TableRow key={v.code} className="hover:bg-muted/30 transition-colors border-border/60">
                      {/* Kode */}
                      <TableCell className="py-3.5 px-3.5 font-mono font-bold text-primary text-xs">
                        {v.code}
                      </TableCell>

                      {/* Diskon */}
                      <TableCell className="py-3.5 px-3.5 font-semibold text-foreground">
                        {v.discount}
                      </TableCell>

                      {/* Penggunaan Kuota */}
                      <TableCell className="py-3.5 px-3.5">
                        <div className="flex flex-col gap-1 min-w-[140px] max-w-[200px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-foreground font-medium tabular-nums">
                              {v.usedQuota} / {v.totalQuota}
                            </span>
                            <span className="text-muted-foreground font-mono text-[10px]">
                              {percent}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percent >= 100 ? "bg-destructive" : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Masa Berlaku */}
                      <TableCell className="py-3.5 px-3.5 text-muted-foreground text-[11px] tabular-nums whitespace-nowrap">
                        {v.expiryDate}
                      </TableCell>

                      {/* Status & Aksi Terpadu */}
                      <TableCell className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge
                            variant={isActive ? "default" : "secondary"}
                            className="text-[10px] py-0 px-2 font-medium"
                          >
                            {isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleVoucherStatus(v.code)}
                            className="h-8 text-xs font-normal px-2.5"
                            title={
                              isActive
                                ? "Nonaktifkan voucher ini agar tidak bisa dipakai saat checkout"
                                : "Aktifkan kembali voucher ini"
                            }
                          >
                            {isActive ? "Matikan" : "Aktifkan"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-xs">
                    Tidak ada voucher yang cocok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal Buat Voucher Baru */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-voucher-title"
          className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Tag className="size-5 text-primary" aria-hidden="true" />
                  <h3 id="modal-voucher-title" className="font-bold text-foreground text-base">
                    Buat Voucher
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Buat kode voucher baru dan tentukan kuota pemakaiannya.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup modal voucher"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateVoucher} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label htmlFor="modal-code" className="font-medium text-foreground">
                  Kode Voucher
                </label>
                <Input
                  id="modal-code"
                  type="text"
                  placeholder="Misal: SEHATJIWA2026…"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono uppercase font-semibold h-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="modal-discount" className="font-medium text-foreground">
                  Potongan Diskon
                </label>
                <Input
                  id="modal-discount"
                  type="text"
                  placeholder="Misal: Potongan Rp 25.000 atau Diskon 20%…"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="modal-quota" className="font-medium text-foreground">
                    Batas Kuota
                  </label>
                  <Input
                    id="modal-quota"
                    type="number"
                    min="1"
                    max="1000"
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                    required
                    className="font-mono h-8 text-xs tabular-nums"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="modal-expiry" className="font-medium text-foreground">
                    Berlaku Hingga
                  </label>
                  <Input
                    id="modal-expiry"
                    type="text"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Atomic hold policy notice */}
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 text-[11px] text-foreground flex items-center gap-2">
                <Info className="size-4 text-primary shrink-0" aria-hidden="true" />
                <span>
                  Kuota voucher otomatis ditahan 15 menit saat reservasi slot, dan kembali jika pembayaran kedaluwarsa.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 text-xs font-normal"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs font-medium">
                  Simpan Voucher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
