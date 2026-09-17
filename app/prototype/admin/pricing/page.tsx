"use client"

import * as React from "react"
import { MOCK_PRICING, MOCK_VOUCHERS, VoucherItem } from "../mock-data"
import {
  Tag,
  DollarSign,
  Plus,
  RotateCcw,
  Check,
  X,
  Search,
  Percent,
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

export default function DistilledPricingAdminPage() {
  const [peerPrice, setPeerPrice] = React.useState(MOCK_PRICING.peerRate)
  const [psychPrice, setPsychPrice] = React.useState(MOCK_PRICING.psychologistRate)
  const [vouchers, setVouchers] = React.useState<VoucherItem[]>(MOCK_VOUCHERS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "exhausted">("all")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newCode, setNewCode] = React.useState("")
  const [newDiscount, setNewDiscount] = React.useState("")
  const [newQuota, setNewQuota] = React.useState("50")
  const [newExpiry, setNewExpiry] = React.useState("31 Des 2026")
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleSavePricing = () => {
    showToast("Tarif sesi konseling 90 menit berhasil diperbarui ke database!")
  }

  const handleToggleVoucherStatus = (code: string) => {
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.code === code) {
          const nextStatus = v.status === "active" ? "exhausted" : "active"
          showToast(`Status voucher ${code} diubah menjadi: ${nextStatus === "active" ? "Aktif" : "Nonaktif"}`)
          return { ...v, status: nextStatus }
        }
        return v
      })
    )
  }

  const handleSimulateRollback = () => {
    // Simulasi pengembalian kuota voucher oleh cron QStash saat invoice 15m kedaluwarsa
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.code === "SOLULURELAX" && v.usedQuota > 0) {
          return { ...v, usedQuota: v.usedQuota - 1 }
        }
        return v
      })
    )
    showToast(
      "Simulasi Rollback Berhasil (ADR-0002): 1 kuota voucher SOLULURELAX dikembalikan otomatis karena invoice 15 menit kedaluwarsa tanpa pembayaran."
    )
  }

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return

    const created: VoucherItem = {
      code: newCode.trim().toUpperCase(),
      discount: newDiscount.trim() || "Potongan Rp 25.000",
      usedQuota: 0,
      totalQuota: Number(newQuota) || 50,
      status: "active",
      expiryDate: newExpiry,
    }

    setVouchers([created, ...vouchers])
    setIsModalOpen(false)
    setNewCode("")
    setNewDiscount("")
    setNewQuota("50")
    showToast(`Kode voucher promosi ${created.code} berhasil diterbitkan!`)
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
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md">
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Page Header: Clear & Balanced */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tarif Layanan & Manajemen Voucher
            </h1>
            <Badge variant="outline" className="text-xs font-mono py-0.5 px-2">
              ADR-0001 & ADR-0002
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Konfigurasi tarif flat sesi 90 menit tanpa biaya tersembunyi dan kelola kuota voucher promosi.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="h-8 text-xs font-medium gap-1.5"
        >
          <Plus className="size-3.5" />
          <span>Terbitkan Voucher Baru</span>
        </Button>
      </div>

      {/* ADR-0002 Atomic Rollback Policy Bar: Sleek 1-Row Banner */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <RotateCcw className="size-4 text-primary shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold text-foreground whitespace-nowrap">
              Mekanisme Hold & Rollback Kuota Atomik (ADR-0002):
            </span>
            <span className="text-muted-foreground line-clamp-1 sm:line-clamp-none">
              Kuota voucher ditahan 15 menit saat checkout. Jika invoice Xendit kedaluwarsa, worker cron QStash otomatis mengembalikannya.
            </span>
          </div>
        </div>

        {/* Quick Simulation Test Button */}
        <Button
          variant="outline"
          size="xs"
          onClick={handleSimulateRollback}
          className="h-7 text-xs font-normal shrink-0"
          title="Simulasikan worker cron yang membatalkan invoice Xendit yang expired dan mengembalikan kuota voucher"
        >
          Simulasi Rollback Kuota (ADR-0002)
        </Button>
      </div>

      {/* Main Grid: Balanced 3 Columns (1 col Settings, 2 cols Vouchers Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 1 Col: Flat Pricing Configuration (No Nested Cards) */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-primary" />
              <h2 className="font-bold text-foreground text-base tracking-tight">
                Tarif Flat Sesi 90 Menit
              </h2>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              XENDIT DIRECT
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
            Tarif berlaku tetap untuk durasi penuh 90 menit tanpa biaya platform tersembunyi. Pasien membayar langsung via Xendit invoice.
          </p>

          {/* Pricing Input Rows: Clean Unified Surface */}
          <div className="flex flex-col gap-4">
            {/* Peer Counselor */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground text-xs">Konselor Sebaya</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    Non-Klinis
                  </Badge>
                </div>
                <span className="text-sm font-extrabold text-primary font-mono tabular-nums">
                  Rp {peerPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pendampingan emosional, stres ringan, dan ventilasi curhat.
              </p>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 text-xs text-muted-foreground font-mono">
                  Rp
                </span>
                <Input
                  type="number"
                  step="5000"
                  value={peerPrice}
                  onChange={(e) => setPeerPrice(Number(e.target.value))}
                  className="pl-9 h-8 text-xs font-semibold bg-background font-mono"
                  aria-label="Tarif konselor sebaya dalam rupiah"
                />
              </div>
            </div>

            {/* Clinical Psychologist */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/30 border border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground text-xs">Psikolog Klinis</span>
                  <Badge variant="default" className="text-[10px] py-0 px-1.5">
                    STR Aktif
                  </Badge>
                </div>
                <span className="text-sm font-extrabold text-primary font-mono tabular-nums">
                  Rp {psychPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Intervensi klinis psikoterapeutik, rujukan skrining SRQ-20 &ge; 8.
              </p>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 text-xs text-muted-foreground font-mono">
                  Rp
                </span>
                <Input
                  type="number"
                  step="10000"
                  value={psychPrice}
                  onChange={(e) => setPsychPrice(Number(e.target.value))}
                  className="pl-9 h-8 text-xs font-semibold bg-background font-mono"
                  aria-label="Tarif psikolog klinis dalam rupiah"
                />
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleSavePricing}
            className="w-full h-8 text-xs font-medium mt-1"
          >
            Simpan Perubahan Tarif
          </Button>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-3 border-t border-border/60">
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            <span>Biaya payment gateway Xendit diserap oleh platform demi kenyamanan pasien.</span>
          </div>
        </div>

        {/* Right 2 Cols: Voucher Management Table & Controls */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Table Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari kode atau nominal voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-card"
                aria-label="Cari kode voucher"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="xs"
                onClick={() => setStatusFilter("all")}
                className="h-7 text-xs font-normal px-2.5"
              >
                Semua ({vouchers.length})
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="xs"
                onClick={() => setStatusFilter("active")}
                className="h-7 text-xs font-normal px-2.5"
              >
                Aktif ({vouchers.filter((v) => v.status === "active").length})
              </Button>
              <Button
                variant={statusFilter === "exhausted" ? "default" : "outline"}
                size="xs"
                onClick={() => setStatusFilter("exhausted")}
                className="h-7 text-xs font-normal px-2.5"
              >
                Nonaktif ({vouchers.filter((v) => v.status !== "active").length})
              </Button>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
            <Table className="text-xs">
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/60">
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Kode Voucher</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Potongan Diskon</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Penggunaan Kuota</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Masa Berlaku</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground">Status</TableHead>
                  <TableHead className="py-3 px-3.5 font-semibold text-foreground text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVouchers.length > 0 ? (
                  filteredVouchers.map((v) => {
                    const percent = Math.round((v.usedQuota / v.totalQuota) * 100)
                    const isExhausted = v.usedQuota >= v.totalQuota || v.status !== "active"

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
                        <TableCell className="py-3.5 px-3">
                          <div className="flex flex-col gap-1 min-w-[130px]">
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
                        <TableCell className="py-3.5 px-3 text-muted-foreground text-[11px] tabular-nums whitespace-nowrap">
                          {v.expiryDate}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-3.5 px-3">
                          <Badge
                            variant={v.status === "active" ? "default" : "secondary"}
                            className="text-[10px] py-0 px-2 font-medium"
                          >
                            {v.status === "active" ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>

                        {/* Tindakan */}
                        <TableCell className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleToggleVoucherStatus(v.code)}
                            className="h-7 text-xs font-normal"
                            title={
                              v.status === "active"
                                ? "Nonaktifkan kode voucher ini agar tidak bisa digunakan saat checkout"
                                : "Aktifkan kembali voucher ini"
                            }
                          >
                            {v.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-28 text-center text-muted-foreground text-xs">
                      Tidak ada voucher yang cocok dengan filter pencarian.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal Terbitkan Voucher Baru: Clarified & Accessible */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Tag className="size-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">
                    Terbitkan Kode Voucher Baru
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Buat kode promo diskon untuk kampanye atau kerjasama institusi.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup modal voucher"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateVoucher} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Kode Voucher (Otomatis Kapital)</label>
                <Input
                  type="text"
                  placeholder="Misal: KAMPUSSEHAT2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="font-mono uppercase font-semibold h-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Bentuk Potongan Diskon</label>
                <Input
                  type="text"
                  placeholder="Misal: Potongan Rp 30.000 atau Diskon 20%"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-foreground">Batas Kuota Pemakaian</label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                    required
                    className="font-mono h-8 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium text-foreground">Tanggal Kedaluwarsa</label>
                  <Input
                    type="text"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* ADR atomic notice */}
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 text-[11px] text-foreground flex items-center gap-2">
                <Info className="size-4 text-primary shrink-0" />
                <span>
                  Voucher baru otomatis mendukung mekanisme proteksi hold 15 menit dan rollback QStash scheduler.
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
                  Terbitkan Kode Voucher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
