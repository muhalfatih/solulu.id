"use client"

import * as React from "react"
import { MOCK_PRICING, MOCK_VOUCHERS, VoucherItem } from "../mock-data"
import {
  Tag,
  DollarSign,
  Plus,
  RotateCcw,
  Percent,
} from "lucide-react"

export default function PricingAdminPage() {
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
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200 text-xs shadow-md animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Pengaturan Tarif Flat & Kode Voucher
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Konfigurasi tarif sesi 90 menit tanpa biaya tersembunyi dan kelola kuota voucher promosi.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Terbitkan Voucher Baru</span>
        </button>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Pricing Settings */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900/70 border border-neutral-200/90 dark:border-neutral-800 space-y-5 shadow-xs">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-bold text-neutral-900 dark:text-white text-base">
                Tarif Flat Layanan
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Tarif berlaku tetap untuk seluruh durasi 90 menit. Pasien membayar langsung saat checkout via Xendit tanpa biaya platform tambahan.
            </p>

            <div className="space-y-4 text-xs">
              {/* Peer Counselor Pricing */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    Konselor Sebaya
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                    Rp {peerPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Untuk pendampingan emosional non-klinis.
                </div>
                <input
                  type="number"
                  step="5000"
                  value={peerPrice}
                  onChange={(e) => setPeerPrice(Number(e.target.value))}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 mt-1 font-semibold"
                />
              </div>

              {/* Psychologist Pricing */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    Psikolog Klinis (STR)
                  </span>
                  <span className="text-base font-extrabold text-teal-700 dark:text-teal-400 font-mono">
                    Rp {psychPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Untuk intervensi klinis & kasus berisiko (SRQ &ge; 8).
                </div>
                <input
                  type="number"
                  step="10000"
                  value={psychPrice}
                  onChange={(e) => setPsychPrice(Number(e.target.value))}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 mt-1 font-semibold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => showToast("Perubahan tarif berhasil disimpan ke database!")}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Simpan Perubahan Tarif
            </button>
          </div>
        </div>

        {/* Right 2 Cols: Voucher List & Architecture Rule */}
        <div className="lg:col-span-2 space-y-4">
          {/* Architecture info box */}
          <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/90 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-3.5 shadow-xs">
            <RotateCcw className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-neutral-900 dark:text-white font-bold">
                Mekanisme Voucher Hold & Rollback Atomik (ADR-0002):
              </strong>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
                Saat pasien menahan (*hold*) slot dengan voucher, kuota pemakaian di-increment secara atomik. Jika pasien tidak menyelesaikan pembayaran dalam 15 menit, worker QStash Cron secara otomatis mengembalikan (*rollback*) kuota voucher tersebut!
              </p>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="border border-neutral-200/90 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/40 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200/90 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Kode Voucher</th>
                  <th className="py-3.5 px-3">Potongan Diskon</th>
                  <th className="py-3.5 px-3">Kuota Pemakaian</th>
                  <th className="py-3.5 px-3">Kedaluwarsa</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-neutral-800/60">
                {vouchers.map((v) => {
                  const percent = Math.round((v.usedQuota / v.totalQuota) * 100)
                  return (
                    <tr
                      key={v.code}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                          {v.code}
                        </div>
                      </td>
                      <td className="py-4 px-3 font-semibold text-neutral-900 dark:text-white">
                        {v.discount}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                            {v.usedQuota}/{v.totalQuota} ({percent}%)
                          </span>
                        </div>
                        <div className="w-32 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 100 ? "bg-rose-500" : "bg-emerald-600 dark:bg-emerald-400"
                            }`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-3 text-neutral-500 dark:text-neutral-400 font-medium">
                        {v.expiryDate}
                      </td>
                      <td className="py-4 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === "active"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                              : "bg-neutral-100 text-neutral-600 border border-neutral-300 dark:bg-neutral-800 dark:text-neutral-500"
                          }`}
                        >
                          {v.status === "active" ? "Aktif" : "Habis / Expired"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => showToast(`Voucher ${v.code} dinonaktifkan.`)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 text-[11px] font-semibold transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
                        >
                          Nonaktifkan
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Buat Voucher Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateVoucher}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h2 className="font-bold text-neutral-900 dark:text-white text-sm">
                Terbitkan Kode Voucher Baru
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-neutral-700 dark:text-neutral-300 font-semibold">
                  Kode Kupon (Uppercase):
                </label>
                <input
                  type="text"
                  placeholder="MISAL: SEHATBERSAMA"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white font-mono uppercase mt-1 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="text-neutral-700 dark:text-neutral-300 font-semibold">
                  Potongan / Keterangan:
                </label>
                <input
                  type="text"
                  placeholder="Misal: Potongan Rp 25.000 atau Diskon 20%"
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white mt-1 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-neutral-700 dark:text-neutral-300 font-semibold">
                  Batas Kuota Pemakaian:
                </label>
                <input
                  type="number"
                  placeholder="50"
                  value={newQuota}
                  onChange={(e) => setNewQuota(e.target.value)}
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white mt-1 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Terbitkan Voucher
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
