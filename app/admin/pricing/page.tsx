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
  Trash2,
  Copy,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminPageHeader, AdminMetricCard } from "@/components/admin"
import {
  getPlatformPricingAction,
  updateRolePricingAction,
  getVouchersAdminAction,
  createVoucherAdminAction,
  toggleVoucherStatusAction,
  deleteVoucherAdminAction,
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
  id: string
  code: string
  discount: string
  discountType: "fixed" | "percentage"
  discountValue: number
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
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSavingPricing, setIsSavingPricing] = React.useState(false)

  // Create Voucher Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newCode, setNewCode] = React.useState("")
  const [discountType, setDiscountType] = React.useState<"fixed" | "percentage">("fixed")
  const [discountAmount, setDiscountAmount] = React.useState("25000")
  const [newQuota, setNewQuota] = React.useState("50")
  const [newExpiryDate, setNewExpiryDate] = React.useState("2026-12-31")
  const [isCreatingVoucher, setIsCreatingVoucher] = React.useState(false)

  // Delete Voucher Modal State
  const [deleteVoucherId, setDeleteVoucherId] = React.useState<string | null>(null)
  const [isDeletingVoucher, setIsDeletingVoucher] = React.useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
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
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memuat tarif dan data voucher.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdateRole = (id: "sebaya" | "psikolog", field: Partial<RolePricingState>) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...field } : r)))
  }

  const handleSavePricing = async () => {
    setIsSavingPricing(true)
    setErrorMessage(null)
    try {
      for (const role of roles) {
        const res = await updateRolePricingAction(role.id, {
          regularPrice: role.regularPrice,
          salePrice: role.salePrice,
          isSaleActive: role.isSaleActive,
          allowVoucher: role.allowVoucher,
        })
        if (!res.success) throw new Error(res.error)
      }
      showToast("Perubahan tarif berhasil disimpan ke database dan disinkronkan.")
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan tarif ke database.")
    } finally {
      setIsSavingPricing(false)
    }
  }

  const handleToggleVoucherStatus = async (voucher: VoucherItem) => {
    const nextActive = voucher.status !== "active"

    // Optimistic UI
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === voucher.id
          ? { ...v, status: nextActive ? "active" : "exhausted" }
          : v
      )
    )

    try {
      const res = await toggleVoucherStatusAction(voucher.id, nextActive)
      if (!res.success) throw new Error(res.error)
      showToast(`Voucher ${voucher.code} sekarang ${nextActive ? "aktif" : "dinonaktifkan"}.`)
    } catch (err: any) {
      // Revert on error
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === voucher.id ? { ...v, status: voucher.status } : v
        )
      )
      setErrorMessage(err.message || "Gagal mengubah status voucher.")
    }
  }

  const handleDeleteVoucher = async () => {
    if (!deleteVoucherId) return
    setIsDeletingVoucher(true)
    setErrorMessage(null)
    try {
      const res = await deleteVoucherAdminAction(deleteVoucherId)
      if (!res.success) throw new Error(res.error)
      showToast("Voucher berhasil dihapus dari database.")
      setDeleteVoucherId(null)
      loadData()
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menghapus voucher.")
    } finally {
      setIsDeletingVoucher(false)
    }
  }

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return

    const cleanNum = Number(discountAmount.replace(/[^0-9]/g, "")) || 0
    if (cleanNum <= 0) {
      setErrorMessage("Nominal atau persentase diskon harus lebih dari 0.")
      return
    }

    const quotaNum = Number(newQuota) || 50
    setIsCreatingVoucher(true)
    setErrorMessage(null)

    try {
      const expiresAt = newExpiryDate
        ? new Date(`${newExpiryDate}T23:59:59+07:00`)
        : null

      const res = await createVoucherAdminAction({
        code: newCode.trim().toUpperCase(),
        discountType,
        discountValue: cleanNum,
        quota: quotaNum,
        expiresAt,
        isActive: true,
      })

      if (res.success && res.data) {
        showToast(`Voucher ${newCode.toUpperCase()} berhasil dibuat dan disimpan.`)
        setIsModalOpen(false)
        setNewCode("")
        setDiscountAmount("25000")
        setNewQuota("50")
        loadData()
      } else {
        setErrorMessage(res.error || "Gagal membuat voucher.")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat membuat voucher.")
    } finally {
      setIsCreatingVoucher(false)
    }
  }

  const filteredVouchers = vouchers.filter((v) => {
    const q = searchQuery.toLowerCase().trim()
    const matchQuery =
      !q ||
      v.code.toLowerCase().includes(q) ||
      v.discount.toLowerCase().includes(q)
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && v.status === "active") ||
      (statusFilter === "exhausted" && v.status !== "active")
    return matchQuery && matchStatus
  })

  const peerRole = roles.find((r) => r.id === "sebaya") || INITIAL_ROLES[0]
  const psychologistRole = roles.find((r) => r.id === "psikolog") || INITIAL_ROLES[1]
  const activeVouchersCount = vouchers.filter((v) => v.status === "active").length
  const totalUsedQuota = vouchers.reduce((acc, v) => acc + v.usedQuota, 0)
  const totalAllocatedQuota = vouchers.reduce((acc, v) => acc + v.totalQuota, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md"
        >
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary shrink-0" aria-hidden="true" />
            <span className="leading-relaxed">{toastMessage}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Tarif Platform & Kode Promo"
        description="Atur tarif standar sesi 90 menit untuk seluruh tipe konselor dan pantau utilisasi kuota voucher pasien."
        icon={Tag}
        badge="Sesi 90 Menit"
        badgeVariant="outline"
        actions={
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 font-medium shadow-xs"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            <span>Buat Voucher Baru</span>
          </Button>
        }
      />

      {/* Error Feedback Banner */}
      {errorMessage && (
        <Alert variant="destructive" className="animate-in fade-in">
          <AlertCircle className="size-4" />
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <AlertTitle className="text-xs font-semibold">Terjadi Kesalahan</AlertTitle>
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setErrorMessage(null)}
              className="text-destructive hover:bg-destructive/10 shrink-0"
              aria-label="Tutup pesan error"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminMetricCard
          title="Tarif Konselor Sebaya"
          value={`Rp ${(peerRole.isSaleActive ? peerRole.salePrice : peerRole.regularPrice).toLocaleString("id-ID")}`}
          isLoading={isLoading}
          status={peerRole.isSaleActive ? "success" : "neutral"}
          trendLabel={
            peerRole.isSaleActive
              ? `Promo Aktif (Reguler Rp ${peerRole.regularPrice.toLocaleString("id-ID")})`
              : "Tarif standar normal"
          }
        />
        <AdminMetricCard
          title="Tarif Psikolog Klinis"
          value={`Rp ${(psychologistRole.isSaleActive ? psychologistRole.salePrice : psychologistRole.regularPrice).toLocaleString("id-ID")}`}
          isLoading={isLoading}
          status={psychologistRole.isSaleActive ? "success" : "neutral"}
          trendLabel={
            psychologistRole.isSaleActive
              ? `Promo Aktif (Reguler Rp ${psychologistRole.regularPrice.toLocaleString("id-ID")})`
              : "Tarif standar normal"
          }
        />
        <AdminMetricCard
          title="Voucher Aktif"
          value={`${activeVouchersCount} Kode`}
          isLoading={isLoading}
          status={activeVouchersCount > 0 ? "success" : "neutral"}
          trendLabel={
            totalAllocatedQuota > 0
              ? `${totalUsedQuota} dari ${totalAllocatedQuota} kuota dipakai (${Math.round((totalUsedQuota / totalAllocatedQuota) * 100)}%)`
              : "Belum ada kuota voucher"
          }
        />
      </div>

      {/* SECTION 1: TARIF SESI 90 MENIT (2 Side-by-Side Cards) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-primary" aria-hidden="true" />
            <h2 className="font-bold text-foreground text-sm tracking-tight">
              Konfigurasi Tarif Resmi Sesi 90 Menit
            </h2>
            <Badge variant="outline" className="font-mono text-[10px]">
              2 Tipe Layanan
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span>Biaya gateway pembayaran Xendit diserap platform.</span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePricing}
              disabled={isSavingPricing || isLoading}
              className="gap-1.5 font-medium cursor-pointer shadow-xs"
            >
              {isSavingPricing && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isSavingPricing ? "Menyimpan Tarif..." : "Simpan Perubahan Tarif"}</span>
            </Button>
          </div>
        </div>

        {/* 2-Column Grid: Role 1 (Konselor Sebaya) & Role 2 (Psikolog Klinis) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Card
                key={`pricing-skel-${i}`}
                className="p-5 flex flex-col justify-between gap-5 shadow-xs"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
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
              </Card>
            ))
          ) : (
            roles.map((role) => {
              const discountNominal = Math.max(0, role.regularPrice - role.salePrice)
              const discountPercent =
                role.regularPrice > 0 ? Math.round((discountNominal / role.regularPrice) * 100) : 0
              const activePrice = role.isSaleActive ? role.salePrice : role.regularPrice

              return (
                <Card
                  key={role.id}
                  className="p-5 flex flex-col justify-between gap-5 shadow-xs hover:border-primary/30 transition-colors"
                >
                  {/* Upper: Role Header & Rate status */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
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
                        {role.isSaleActive && discountPercent > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                            (-{discountPercent}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {role.subtitle}
                    </p>

                    {/* Pricing Inputs: Paired 2-Column Grid */}
                    <div className={`grid ${role.isSaleActive ? "grid-cols-2 gap-3" : "grid-cols-1"} items-end`}>
                      {/* Tarif Reguler */}
                      <div className="flex flex-col gap-1.5">
                        <div className="h-5 flex items-center">
                          <Label
                            htmlFor={`reg-${role.id}`}
                            className="text-[11px] font-medium text-muted-foreground"
                          >
                            Tarif Reguler
                          </Label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono select-none">
                            Rp
                          </span>
                          <Input
                            id={`reg-${role.id}`}
                            type="number"
                            step="5000"
                            min="0"
                            value={role.regularPrice}
                            onChange={(e) =>
                              handleUpdateRole(role.id, { regularPrice: Number(e.target.value) || 0 })
                            }
                            className="pl-9 h-9 text-xs font-semibold bg-background font-mono tabular-nums"
                            aria-label={`Tarif reguler ${role.title}`}
                          />
                        </div>
                      </div>

                      {/* Tarif Promo */}
                      {role.isSaleActive && (
                        <div className="flex flex-col gap-1.5">
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
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono select-none">
                              Rp
                            </span>
                            <Input
                              id={`sale-val-${role.id}`}
                              type="number"
                              step="5000"
                              min="0"
                              value={role.salePrice}
                              onChange={(e) =>
                                handleUpdateRole(role.id, { salePrice: Number(e.target.value) || 0 })
                              }
                              className="pl-9 h-9 text-xs font-bold text-primary bg-background font-mono tabular-nums"
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
                        className="text-[11px] font-medium text-foreground cursor-pointer flex items-center gap-1 select-none"
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
                        className="text-[11px] text-muted-foreground cursor-pointer select-none"
                        title={role.allowVoucher ? "Bisa digabung dengan voucher diskon" : "Tarif promo nett tanpa tambahan voucher"}
                      >
                        {role.allowVoucher ? "Bisa Ditumpuk Voucher" : "Promo Nett"}
                      </Label>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* SECTION 2: MANAJEMEN VOUCHER & TELEMETRI */}
      <Card className="overflow-hidden shadow-xs">
        {/* Table Toolbar Header */}
        <CardHeader className="p-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari kode atau nominal voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-8 h-8 text-xs bg-background"
                aria-label="Cari kode voucher"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Segmented Control & Counter */}
            <div className="flex items-center gap-3 flex-wrap">
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
                  Aktif ({activeVouchersCount})
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
                  Nonaktif ({vouchers.length - activeVouchersCount})
                </button>
              </div>

              <span className="text-[11px] text-muted-foreground hidden lg:inline font-mono">
                {filteredVouchers.length} dari {vouchers.length} voucher
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Semantic Responsive Table */}
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="py-3 px-4 font-semibold text-foreground">Kode Voucher</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-foreground">Besaran Diskon</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-foreground min-w-[180px]">Utilisasi Kuota</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-foreground">Berlaku Hingga</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-foreground text-center w-28">Status</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-foreground text-right w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`voucher-skel-${i}`} className="border-border/60">
                    <TableCell className="py-3.5 px-4">
                      <Skeleton className="h-4 w-28 rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Skeleton className="h-4 w-24 rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Skeleton className="h-3.5 w-32 rounded mb-1.5" />
                      <Skeleton className="h-1.5 w-36 rounded-full" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Skeleton className="h-3.5 w-24 rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <Skeleton className="h-5 w-14 mx-auto rounded-full" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredVouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2.5 px-4">
                      <Tag className="size-8 text-muted-foreground/30 mb-1" />
                      <p className="font-semibold text-foreground text-sm">
                        {searchQuery || statusFilter !== "all"
                          ? "Tidak ada voucher yang cocok dengan filter"
                          : "Belum ada kode voucher terdaftar"}
                      </p>
                      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                        {searchQuery
                          ? `Tidak ditemukan voucher dengan kata kunci "${searchQuery}". Coba periksa kembali ejaan kode voucher.`
                          : statusFilter !== "all"
                          ? `Tidak ada voucher dengan status ${statusFilter === "active" ? "Aktif" : "Nonaktif"}.`
                          : "Buat kode promo baru untuk memberikan diskon biaya sesi konseling kepada pasien."}
                      </p>
                      {!searchQuery && statusFilter === "all" && (
                        <Button
                          onClick={() => setIsModalOpen(true)}
                          size="sm"
                          className="mt-2 gap-1.5 font-medium shadow-xs"
                        >
                          <Plus className="size-3.5" />
                          <span>Buat Voucher Pertama</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVouchers.map((v) => {
                  const percent = Math.round((v.usedQuota / Math.max(1, v.totalQuota)) * 100)
                  const isActive = v.status === "active"

                  return (
                    <TableRow
                      key={v.id || v.code}
                      className="hover:bg-muted/30 transition-colors border-border/60 group"
                    >
                      {/* Kode Voucher */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60 text-xs">
                            {v.code}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(v.code)
                              showToast(`Kode "${v.code}" disalin ke clipboard.`)
                            }}
                            className="size-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Salin Kode Voucher"
                            aria-label={`Salin kode voucher ${v.code}`}
                          >
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Potongan Diskon */}
                      <TableCell className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          {v.discountType === "percentage" ? (
                            <Percent className="size-3.5 text-primary shrink-0" />
                          ) : (
                            <Tag className="size-3.5 text-primary shrink-0" />
                          )}
                          <span>{v.discount}</span>
                        </div>
                      </TableCell>

                      {/* Penggunaan Kuota */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 min-w-[140px] max-w-[200px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-foreground font-medium tabular-nums">
                              {v.usedQuota} / {v.totalQuota} kuota
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
                      <TableCell className="py-3.5 px-4 text-muted-foreground text-[11px] tabular-nums whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
                          <span>{v.expiryDate}</span>
                        </div>
                      </TableCell>

                      {/* Status Toggle Switch */}
                      <TableCell className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleVoucherStatus(v)}
                            size="sm"
                            aria-label={`Toggle voucher ${v.code}`}
                          />
                          <span className="text-[11px] font-medium text-muted-foreground min-w-[42px] text-left">
                            {isActive ? "Aktif" : "Off"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Tombol Hapus */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteVoucherId(v.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Hapus Voucher"
                            aria-label={`Hapus voucher ${v.code}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Buat Voucher Baru */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateVoucher} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Tag className="size-4 text-primary" />
                <span>Buat Kode Voucher Baru</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Tentukan kode promo, besaran potongan, kuota maksimal klaim, serta batas kedaluwarsa.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3.5 text-xs py-1">
              {/* Kode Voucher */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="modal-code" className="font-medium text-foreground">
                  Kode Voucher Promo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="modal-code"
                  type="text"
                  placeholder="Misal: SEHATJIWA2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono uppercase font-bold h-9 text-xs tracking-wider"
                />
              </div>

              {/* Tipe & Nominal Diskon */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="discount-type" className="font-medium text-foreground">
                    Tipe Diskon
                  </Label>
                  <div className="flex items-center h-9 rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
                    <button
                      type="button"
                      onClick={() => setDiscountType("fixed")}
                      className={`flex-1 h-7 flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer ${
                        discountType === "fixed"
                          ? "bg-card text-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Nominal Rp
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType("percentage")}
                      className={`flex-1 h-7 flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer ${
                        discountType === "percentage"
                          ? "bg-card text-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Persen %
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="discount-amount" className="font-medium text-foreground">
                    Besaran Potongan <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    {discountType === "fixed" && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono select-none">
                        Rp
                      </span>
                    )}
                    <Input
                      id="discount-amount"
                      type="number"
                      min="1"
                      placeholder={discountType === "fixed" ? "25000" : "20"}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      required
                      className={`h-9 text-xs font-mono tabular-nums ${discountType === "fixed" ? "pl-9" : "pr-8"}`}
                    />
                    {discountType === "percentage" && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono select-none">
                        %
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Kuota & Tanggal Berlaku */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="modal-quota" className="font-medium text-foreground">
                    Batas Kuota Penggunaan
                  </Label>
                  <Input
                    id="modal-quota"
                    type="number"
                    min="1"
                    max="10000"
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                    required
                    className="font-mono h-9 text-xs tabular-nums"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="modal-expiry" className="font-medium text-foreground">
                    Berlaku Hingga
                  </Label>
                  <Input
                    id="modal-expiry"
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    required
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-foreground flex items-center gap-2">
                <Info className="size-4 text-primary shrink-0" aria-hidden="true" />
                <span>
                  Kuota otomatis ditahan sementara 15 menit saat pasien reservasi slot, dan dikembalikan bila pembayaran kedaluwarsa.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreatingVoucher || !newCode.trim()}
                className="gap-1.5 font-medium shadow-xs"
              >
                {isCreatingVoucher && <Loader2 className="size-3.5 animate-spin" />}
                <span>Simpan Voucher</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteVoucherId}
        onOpenChange={(open) => !open && setDeleteVoucherId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span>Hapus Kode Voucher</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus voucher ini? Pasien tidak akan dapat lagi menggunakan kode ini pada proses checkout berikutnya.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteVoucherId(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteVoucher}
              disabled={isDeletingVoucher}
              className="gap-1.5 font-medium shadow-xs"
            >
              {isDeletingVoucher && <Loader2 className="size-3.5 animate-spin" />}
              <span>Hapus Sekarang</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
