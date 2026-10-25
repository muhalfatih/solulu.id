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
  Sparkles,
  Info,
  Trash2,
  Copy,
  Loader2,
  AlertCircle,
  Clock,
  Save,
  CheckCircle2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
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
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  getPlatformPricingAction,
  updateRolePricingAction,
  getVouchersAdminAction,
  createVoucherAdminAction,
  toggleVoucherStatusAction,
  deleteVoucherAdminAction,
} from "@/app/admin/pricing/actions"
import { updatePlatformSettingsAction } from "./actions"
import type { PlatformSettingsData } from "@/lib/settings/platform"

export interface RolePricingState {
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

export interface VoucherItem {
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
    subtitle: "Pendampingan emosional, stres ringan hingga sedang (Lulusan S1 Psikologi).",
    badge: "Non-Klinis",
    duration: "90 Menit",
    regularPrice: 85000,
    isSaleActive: true,
    salePrice: 49000,
    allowVoucher: false,
  },
  {
    id: "psikolog",
    title: "Psikolog Klinis",
    subtitle: "Intervensi klinis psikoterapeutik, rujukan SRQ-20 & asesmen mendalam.",
    badge: "Izin Praktik STR/SIPP",
    duration: "90 Menit",
    regularPrice: 150000,
    isSaleActive: true,
    salePrice: 129000,
    allowVoucher: true,
  },
]

interface FeesTabProps {
  formData: PlatformSettingsData
  setFormData: React.Dispatch<React.SetStateAction<PlatformSettingsData>>
  isSuperadmin: boolean
  onFeedback?: (feedback: { type: "success" | "error"; message: string } | null) => void
}

export function FeesTab({
  formData,
  setFormData,
  isSuperadmin,
  onFeedback,
}: FeesTabProps) {
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
            subtitle: "Pendampingan emosional, stres ringan hingga sedang (Lulusan S1 Psikologi).",
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
            subtitle: "Intervensi klinis psikoterapeutik, rujukan SRQ-20 & asesmen mendalam.",
            badge: "Izin Praktik STR/SIPP",
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

  const handleSaveAllPricingAndExtend = async () => {
    setIsSavingPricing(true)
    setErrorMessage(null)
    try {
      // 1. Simpan tarif 90 menit kedua role
      for (const role of roles) {
        const res = await updateRolePricingAction(role.id, {
          regularPrice: role.regularPrice,
          salePrice: role.salePrice,
          isSaleActive: role.isSaleActive,
          allowVoucher: role.allowVoucher,
        })
        if (!res.success) throw new Error(res.error)
      }

      // 2. Simpan extend fee ke platform settings jika user superadmin
      if (isSuperadmin) {
        const settingsRes = await updatePlatformSettingsAction({
          basePrice: String(formData.basePrice),
          counselorExtendFeePer30Min: String(formData.counselorExtendFeePer30Min),
          psychologistExtendFeePer30Min: String(formData.psychologistExtendFeePer30Min),
        })
        if (!settingsRes.success) throw new Error(settingsRes.error)
      }

      showToast("Seluruh konfigurasi tarif layanan & extend sesi berhasil disimpan ke database.")
      if (onFeedback) {
        onFeedback({
          type: "success",
          message: "Konfigurasi tarif layanan dan extend sesi berhasil diperbarui di database produksi.",
        })
      }
    } catch (err: any) {
      const msg = err.message || "Gagal menyimpan tarif ke database."
      setErrorMessage(msg)
      if (onFeedback) {
        onFeedback({
          type: "error",
          message: msg,
        })
      }
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

  return (
    <div className="flex flex-col gap-6">
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

      {/* SECTION 1 & 2: KONFIGURASI TARIF RESMI & EXTEND FEES */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pt-6 px-6 pb-5 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="size-4 text-primary" aria-hidden="true" />
                  <span>Tarif Konseling 90 Menit &amp; Perpanjangan Sesi (+30 Menit)</span>
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-mono">
                  SOP Terintegrasi
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Konfigurasi harga patokan 90 menit per jenis layanan, diskon promo, opsi voucher, serta biaya perpanjangan sesi tambahan.
              </CardDescription>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleSaveAllPricingAndExtend}
              disabled={isSavingPricing || isLoading}
              className="gap-2 font-medium cursor-pointer shadow-xs shrink-0 self-start sm:self-center"
            >
              {isSavingPricing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span>{isSavingPricing ? "Menyimpan Tarif..." : "Simpan Tarif & Extend"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 px-6 pb-6 flex flex-col gap-6">
          {/* Subheading Layanan 90 Menit */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Tarif Sesi Standar (90 Menit)
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Biaya gateway Xendit diserap platform</span>
            </div>
          </div>

          {/* 2-Column Grid: Role Sebaya & Role Psikolog */}
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
                    className="p-5 flex flex-col justify-between gap-5 shadow-xs hover:border-primary/30 transition-colors bg-muted/10"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Role Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm tracking-tight">
                            {role.title}
                          </span>
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

                      {/* Pricing Inputs */}
                      <div className={`grid ${role.isSaleActive ? "grid-cols-2 gap-3" : "grid-cols-1"} items-end`}>
                        {/* Tarif Reguler */}
                        <div className="flex flex-col gap-1.5">
                          <Label
                            htmlFor={`reg-${role.id}`}
                            className="text-[11px] font-medium text-muted-foreground"
                          >
                            Tarif Reguler 90 Menit
                          </Label>
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
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor={`sale-val-${role.id}`}
                                className="text-[11px] font-medium text-primary flex items-center gap-1"
                              >
                                <span>Tarif Promo</span>
                              </Label>
                              {discountPercent > 0 && (
                                <span className="text-[10px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                  Hemat Rp {discountNominal.toLocaleString("id-ID")}
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-primary font-mono font-semibold select-none">
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
                                className="pl-9 h-9 text-xs font-bold text-primary bg-background font-mono tabular-nums border-primary/40 focus-visible:border-primary"
                                aria-label={`Tarif promo ${role.title}`}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Toggles */}
                      <div className="flex flex-col gap-2.5 pt-2 border-t border-border/40">
                        {/* Toggle Promo */}
                        <div className="flex items-center justify-between gap-2">
                          <Label
                            htmlFor={`toggle-sale-${role.id}`}
                            className="text-xs text-foreground cursor-pointer select-none flex items-center gap-1.5"
                          >
                            <span>Aktifkan Harga Promo</span>
                          </Label>
                          <Switch
                            id={`toggle-sale-${role.id}`}
                            checked={role.isSaleActive}
                            onCheckedChange={(checked) =>
                              handleUpdateRole(role.id, { isSaleActive: checked })
                            }
                            aria-label={`Aktifkan harga promo ${role.title}`}
                          />
                        </div>

                        {/* Toggle Voucher */}
                        <div className="flex items-center justify-between gap-2">
                          <Label
                            htmlFor={`toggle-voucher-${role.id}`}
                            className="text-xs text-foreground cursor-pointer select-none"
                          >
                            Izinkan Kupon Diskon Tambahan
                          </Label>
                          <Switch
                            id={`toggle-voucher-${role.id}`}
                            checked={role.allowVoucher}
                            onCheckedChange={(checked) =>
                              handleUpdateRole(role.id, { allowVoucher: checked })
                            }
                            aria-label={`Izinkan voucher untuk ${role.title}`}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Subheading Extend Sesi (+30 Menit) */}
          <div className="flex flex-col gap-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Tarif Perpanjangan Sesi Tambahan (+30 Menit)
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Biaya perpanjangan ini diterapkan secara otomatis saat konselor memperpanjang sesi di floating timer konseling. Klien akan menerima invoice perpanjangan di halaman sesi konseling mereka.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Extend Fee Konselor Sebaya */}
              <div className="p-4 rounded-lg border border-border/70 bg-muted/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Extend Konselor Sebaya (+30 Menit)
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    Non-Klinis
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tarif tambahan per 30 menit perpanjangan sesi dengan Konselor Sebaya (Lulusan S1 Psikologi).
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono select-none">
                    Rp
                  </span>
                  <Input
                    id="counselorExtendFeePer30Min"
                    type="number"
                    step="5000"
                    min="0"
                    disabled={isLoading || isSavingPricing || !isSuperadmin}
                    value={formData.counselorExtendFeePer30Min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        counselorExtendFeePer30Min: e.target.value,
                      })
                    }
                    className="pl-9 text-xs font-semibold bg-background font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Extend Fee Psikolog Klinis */}
              <div className="p-4 rounded-lg border border-border/70 bg-muted/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Extend Psikolog Klinis (+30 Menit)
                  </span>
                  <Badge variant="default" className="text-[10px]">
                    STR/SIPP Aktif
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tarif tambahan per 30 menit perpanjangan sesi dengan Psikolog Klinis berizin praktik resmi.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono select-none">
                    Rp
                  </span>
                  <Input
                    id="psychologistExtendFeePer30Min"
                    type="number"
                    step="5000"
                    min="0"
                    disabled={isLoading || isSavingPricing || !isSuperadmin}
                    value={formData.psychologistExtendFeePer30Min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        psychologistExtendFeePer30Min: e.target.value,
                      })
                    }
                    className="pl-9 text-xs font-semibold bg-background font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-muted/30 border-border/70 text-muted-foreground text-xs">
            <Info className="size-4 text-foreground shrink-0 mt-0.5" />
            <AlertDescription className="text-xs leading-relaxed">
              Sistem perpanjangan sesi Solulu sepenuhnya transparan. Invoice perpanjangan otomatis tercatat dalam rekap keuangan admin dan laporan sesi konselor akan terkunci bagi klien sampai pembayaran extend diselesaikan.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* SECTION 3: MANAJEMEN KODE PROMO & KUPON DISKON */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pt-6 px-6 pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-primary" aria-hidden="true" />
                <CardTitle className="text-base font-semibold text-foreground">
                  Manajemen Voucher &amp; Kupon Promo
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {vouchers.length} Terdaftar
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Buat dan kelola kode kupon diskon persentase maupun nominal potongan langsung untuk pasien.
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-1.5 font-medium shadow-xs shrink-0 self-start sm:self-center"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Buat Voucher Baru</span>
            </Button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari kode atau nominal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-8 text-xs bg-background"
                aria-label="Cari voucher promo"
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

            {/* Filter Segmented Control */}
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
                      <Skeleton className="h-7 w-7 rounded-md ml-auto" />
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
                            aria-label={`Salin kode ${v.code}`}
                          >
                            <Copy className="size-3" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Besaran Diskon */}
                      <TableCell className="py-3.5 px-4">
                        <Badge
                          variant={v.discountType === "percentage" ? "secondary" : "outline"}
                          className="font-medium text-xs font-mono"
                        >
                          {v.discountType === "percentage" ? (
                            <Percent className="size-3 mr-1 text-primary inline" />
                          ) : (
                            <DollarSign className="size-3 mr-0.5 text-primary inline" />
                          )}
                          {v.discount}
                        </Badge>
                      </TableCell>

                      {/* Kuota & Progress Bar */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-foreground font-medium">
                              {v.usedQuota} / {v.totalQuota} Terpakai
                            </span>
                            <span className="text-muted-foreground">{percent}%</span>
                          </div>
                          <Progress value={percent} className="h-1.5" />
                        </div>
                      </TableCell>

                      {/* Masa Berlaku */}
                      <TableCell className="py-3.5 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>{v.expiryDate}</span>
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            isActive
                              ? "default"
                              : v.status === "expired"
                              ? "outline"
                              : "secondary"
                          }
                          className="text-[10px] py-0 px-2 font-medium"
                        >
                          {isActive
                            ? "Aktif"
                            : v.status === "expired"
                            ? "Kedaluwarsa"
                            : "Nonaktif / Habis"}
                        </Badge>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleVoucherStatus(v)}
                            aria-label={`Ubah status voucher ${v.code}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteVoucherId(v.id)}
                            className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
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

      {/* MODAL: BUAT VOUCHER BARU */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateVoucher} className="flex flex-col gap-5">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Tag className="size-4 text-primary" />
                <span>Buat Voucher Promo Baru</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Buat kode promosi unik untuk menarik pasien atau memberikan potongan harga pada sesi konseling.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="flex flex-col gap-4">
              {/* Kode Voucher */}
              <Field>
                <FieldLabel htmlFor="new-code" className="text-xs font-semibold">
                  Kode Voucher
                </FieldLabel>
                <FieldDescription className="text-[11px] text-muted-foreground">
                  Gunakan huruf kapital dan angka tanpa spasi (misal: SOLULUHEMAT).
                </FieldDescription>
                <Input
                  id="new-code"
                  placeholder="SOLULU2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  className="font-mono text-xs font-bold uppercase tracking-wider"
                  required
                />
              </Field>

              {/* Tipe Diskon */}
              <Field>
                <FieldLabel className="text-xs font-semibold">Tipe Diskon</FieldLabel>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant={discountType === "fixed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDiscountType("fixed")
                      setDiscountAmount("25000")
                    }}
                    className="gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <DollarSign className="size-3.5" />
                    <span>Nominal Rupiah (Rp)</span>
                  </Button>
                  <Button
                    type="button"
                    variant={discountType === "percentage" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDiscountType("percentage")
                      setDiscountAmount("20")
                    }}
                    className="gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Percent className="size-3.5" />
                    <span>Persentase (%)</span>
                  </Button>
                </div>
              </Field>

              {/* Besaran Diskon */}
              <Field>
                <FieldLabel htmlFor="discount-val" className="text-xs font-semibold">
                  {discountType === "fixed" ? "Nominal Potongan (Rp)" : "Besaran Diskon (%)"}
                </FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    {discountType === "fixed" ? "Rp" : "%"}
                  </span>
                  <Input
                    id="discount-val"
                    type="number"
                    min="1"
                    max={discountType === "percentage" ? 100 : 1000000}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="pl-8 font-mono text-xs font-semibold"
                    required
                  />
                </div>
              </Field>

              {/* Kuota & Tanggal Kedaluwarsa */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="new-quota" className="text-xs font-semibold">
                    Kuota Penggunaan
                  </FieldLabel>
                  <Input
                    id="new-quota"
                    type="number"
                    min="1"
                    max="10000"
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                    className="font-mono text-xs font-semibold"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="new-expiry" className="text-xs font-semibold">
                    Berlaku Hingga
                  </FieldLabel>
                  <Input
                    id="new-expiry"
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="text-xs"
                    required
                  />
                </Field>
              </div>
            </FieldGroup>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreatingVoucher}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreatingVoucher || !newCode.trim()}
                className="gap-1.5"
              >
                {isCreatingVoucher && <Loader2 className="size-3.5 animate-spin" />}
                <span>{isCreatingVoucher ? "Membuat..." : "Simpan Voucher"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: HAPUS VOUCHER */}
      <Dialog open={Boolean(deleteVoucherId)} onOpenChange={(open) => !open && setDeleteVoucherId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="size-4" />
              <span>Hapus Kode Voucher</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus voucher ini dari sistem? Tindakan ini permanen dan kode tidak dapat digunakan kembali oleh pasien.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteVoucherId(null)}
              disabled={isDeletingVoucher}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteVoucher}
              disabled={isDeletingVoucher}
              className="gap-1.5"
            >
              {isDeletingVoucher && <Loader2 className="size-3.5 animate-spin" />}
              <span>{isDeletingVoucher ? "Menghapus..." : "Ya, Hapus Voucher"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
