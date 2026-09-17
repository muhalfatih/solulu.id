"use client"

import * as React from "react"
import { MOCK_PRICING, MOCK_VOUCHERS, VoucherItem } from "../mock-data"
import {
  Tag,
  DollarSign,
  Plus,
  RotateCcw,
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

export default function FreshPricingAdminPage() {
  const [peerPrice, setPeerPrice] = React.useState(MOCK_PRICING.peerRate)
  const [psychPrice, setPsychPrice] = React.useState(MOCK_PRICING.psychologistRate)
  const [vouchers, setVouchers] = React.useState<VoucherItem[]>(MOCK_VOUCHERS)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [newCode, setNewCode] = React.useState("")
  const [newDiscount, setNewDiscount] = React.useState("")
  const [newQuota, setNewQuota] = React.useState("50")
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode) return

    const created: VoucherItem = {
      code: newCode.toUpperCase(),
      discount: newDiscount || "Potongan Rp 25.000",
      usedQuota: 0,
      totalQuota: Number(newQuota) || 50,
      status: "active",
      expiryDate: "31 Des 2026",
    }

    setVouchers([created, ...vouchers])
    setIsModalOpen(false)
    setNewCode("")
    setNewDiscount("")
    showToast(`✅ Kode voucher ${created.code} berhasil diterbitkan!`)
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-card border border-primary/40 text-foreground text-xs shadow-md animate-in fade-in flex items-center justify-between">
          <span>{toastMessage}</span>
          <Button variant="ghost" size="xs" onClick={() => setToastMessage(null)}>
            ✕
          </Button>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pengaturan Tarif Flat & Kode Voucher
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Konfigurasi tarif sesi 90 menit tanpa biaya tersembunyi dan kelola kuota voucher promosi.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 font-bold"
        >
          <Plus className="size-4" />
          <span>Terbitkan Voucher Baru</span>
        </Button>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Pricing Settings */}
        <div>
          <Card className="p-6 flex flex-col gap-5 shadow-xs">
            <CardHeader className="p-0 flex flex-row items-center gap-2">
              <DollarSign className="size-5 text-primary" />
              <CardTitle className="text-base">Tarif Flat Layanan</CardTitle>
            </CardHeader>
            <CardDescription className="text-xs leading-relaxed">
              Tarif berlaku tetap untuk seluruh durasi 90 menit. Pasien membayar langsung saat checkout via Xendit tanpa biaya platform tambahan.
            </CardDescription>

            <CardContent className="p-0 flex flex-col gap-4 text-xs">
              {/* Peer Counselor Pricing */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Konselor Sebaya</span>
                  <span className="text-base font-extrabold text-primary font-mono">
                    Rp {peerPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Pendampingan emosional & stres non-klinis.
                </div>
                <Input
                  type="number"
                  step="5000"
                  value={peerPrice}
                  onChange={(e) => setPeerPrice(Number(e.target.value))}
                  className="bg-card font-semibold h-8 text-xs"
                />
              </div>

              {/* Psychologist Pricing */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Psikolog Klinis (STR)</span>
                  <span className="text-base font-extrabold text-primary font-mono">
                    Rp {psychPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Intervensi klinis berisiko (SRQ &ge; 8).
                </div>
                <Input
                  type="number"
                  step="10000"
                  value={psychPrice}
                  onChange={(e) => setPsychPrice(Number(e.target.value))}
                  className="bg-card font-semibold h-8 text-xs"
                />
              </div>

              <Button
                size="sm"
                onClick={() => showToast("Perubahan tarif berhasil disimpan ke database!")}
                className="w-full font-semibold"
              >
                Simpan Perubahan Tarif
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right 2 Cols: Voucher List & Architecture Rule */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Architecture info box */}
          <Card className="p-5 bg-muted/40 border-border flex flex-row items-start gap-3.5 shadow-xs">
            <RotateCcw className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <CardTitle className="text-sm">
                Mekanisme Voucher Hold & Rollback Atomik (ADR-0002)
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Saat pasien menahan (*hold*) slot dengan voucher, kuota pemakaian di-increment secara atomik. Jika pasien tidak menyelesaikan pembayaran dalam 15 menit, worker QStash Cron secara otomatis mengembalikan (*rollback*) kuota voucher tersebut!
              </CardDescription>
            </div>
          </Card>

          {/* Vouchers Table */}
          <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
            <Table className="text-xs">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="py-3.5 px-4">Kode Voucher</TableHead>
                  <TableHead className="py-3.5 px-3">Potongan Diskon</TableHead>
                  <TableHead className="py-3.5 px-3">Kuota Pemakaian</TableHead>
                  <TableHead className="py-3.5 px-3">Kedaluwarsa</TableHead>
                  <TableHead className="py-3.5 px-3">Status</TableHead>
                  <TableHead className="py-3.5 px-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((v) => {
                  const percent = Math.round((v.usedQuota / v.totalQuota) * 100)
                  return (
                    <TableRow key={v.code} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="py-4 px-4 font-mono font-bold text-primary text-sm">
                        {v.code}
                      </TableCell>
                      <TableCell className="py-4 px-3 font-semibold text-foreground">
                        {v.discount}
                      </TableCell>
                      <TableCell className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">
                            {v.usedQuota}/{v.totalQuota} ({percent}%)
                          </span>
                        </div>
                        <div className="w-32 h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 100 ? "bg-destructive" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-3 text-muted-foreground font-medium">
                        {v.expiryDate}
                      </TableCell>
                      <TableCell className="py-4 px-3">
                        <Badge
                          variant={v.status === "active" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {v.status === "active" ? "Aktif" : "Habis / Expired"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => showToast(`Voucher ${v.code} dinonaktifkan.`)}
                        >
                          Nonaktifkan
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Modal Buat Voucher Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <Card className="max-w-md w-full p-6 shadow-2xl">
            <form onSubmit={handleCreateVoucher} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <CardTitle className="text-sm">Terbitkan Kode Voucher Baru</CardTitle>
                <Button variant="ghost" size="xs" onClick={() => setIsModalOpen(false)}>
                  ✕
                </Button>
              </div>

              <div className="flex flex-col gap-3.5 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground font-semibold">
                    Kode Kupon (Uppercase):
                  </label>
                  <Input
                    type="text"
                    placeholder="MISAL: SEHATBERSAMA"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    required
                    className="font-mono uppercase font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground font-semibold">
                    Potongan / Keterangan:
                  </label>
                  <Input
                    type="text"
                    placeholder="Misal: Potongan Rp 25.000 atau Diskon 20%"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground font-semibold">
                    Batas Kuota Pemakaian:
                  </label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" className="font-bold">
                  Terbitkan Voucher
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
