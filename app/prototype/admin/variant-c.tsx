"use client"

import * as React from "react"
import {
  MOCK_APPLICANTS,
  MOCK_VOUCHERS,
  MOCK_PRICING,
  MOCK_ZOOM_ACCOUNTS,
} from "./mock-data"
import {
  Clock,
  Video,
  FileCheck2,
  ShieldCheck,
  Check,
  AlertOctagon,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag,
  Lock,
} from "lucide-react"

export function VariantC() {
  const [activeStep, setActiveStep] = React.useState<number>(1)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [peerPrice, setPeerPrice] = React.useState(MOCK_PRICING.peerRate)
  const [psychPrice, setPsychPrice] = React.useState(MOCK_PRICING.psychologistRate)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 pb-24 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Banner & Pipeline Workflow */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider border border-teal-500/30">
                Workflow Hub
              </span>
              <span className="text-xs text-neutral-400">Varian C: Visual Pipeline & Timeline</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-1">
              Solulu Ops Pipeline & Zoom Concurrency Visualizer
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              Kapasitas Server: <span className="text-emerald-400 font-semibold">100% Free Tier</span>
            </div>
          </div>
        </div>

        {/* Workflow Phase Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveStep(1)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeStep === 1
                ? "bg-teal-950/40 border-teal-500/50 shadow-md shadow-teal-950/50"
                : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Pilar 1</span>
              <Video className="w-4 h-4 text-teal-400" />
            </div>
            <div className="font-semibold text-sm text-white mt-1">Zoom Capacity & Overlap</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Visualisasi jadwal 90m & Safety Lock
            </div>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeStep === 2
                ? "bg-sky-950/40 border-sky-500/50 shadow-md shadow-sky-950/50"
                : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Pilar 2</span>
              <FileCheck2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="font-semibold text-sm text-white mt-1">Verifikasi Pelamar Mitra</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Review KTP, Ijazah, CV, STR psikolog
            </div>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              activeStep === 3
                ? "bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/50"
                : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Pilar 3</span>
              <Tag className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-semibold text-sm text-white mt-1">Tarif & Kuota Voucher</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Manajemen harga flat & promo kupon
            </div>
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-lg bg-teal-950 border border-teal-500 text-teal-200 text-xs shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* STEP 1: ZOOM CAPACITY & OVERLAP TIMELINE VISUALIZER */}
      {activeStep === 1 && (
        <section className="space-y-5">
          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Timeline Kapasitas Zoom 2 Akun (Peak Hours 18:00 – 23:00 WIB)</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Setiap sesi berdurasi 90 menit. Guard concurrency memastikan tidak ada &gt;2 sesi
                  bersamaan di seluruh platform.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Terisi (90m)
                </span>
                <span className="flex items-center gap-1 text-neutral-400 ml-2">
                  <span className="w-2.5 h-2.5 rounded bg-neutral-800 border border-neutral-700 inline-block" />{" "}
                  Slot Kosong
                </span>
              </div>
            </div>

            {/* Visual Gantt-like Timeline */}
            <div className="space-y-4 pt-2">
              {/* Timeline Hour Scale */}
              <div className="grid grid-cols-5 text-center text-[11px] text-neutral-400 font-mono border-b border-neutral-800 pb-2">
                <div>18:00 WIB</div>
                <div>19:00 WIB</div>
                <div>20:00 WIB</div>
                <div>21:00 WIB</div>
                <div>22:00 WIB</div>
              </div>

              {/* Account 1 Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span>Zoom Pro 1 (Primary)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      LOCKED
                    </span>
                  </span>
                  <span className="text-[11px] text-neutral-400">solulu.room1@gmail.com</span>
                </div>
                <div className="h-12 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden flex items-center p-1">
                  {/* Meeting 1: 19:00 - 20:30 (starts at 20%, width 30%) */}
                  <div className="absolute left-[20%] w-[30%] h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-2 text-white shadow-sm flex flex-col justify-center">
                    <div className="font-semibold text-[11px] truncate">
                      SL-9281 (Sarah Annisa, M.Psi)
                    </div>
                    <div className="text-[9px] text-emerald-100">19:00 – 20:30 WIB • Lunas</div>
                  </div>
                  {/* Meeting 2: 21:00 - 22:30 (starts at 60%, width 30%) */}
                  <div className="absolute left-[60%] w-[30%] h-10 bg-gradient-to-r from-sky-600 to-teal-600 rounded-lg p-2 text-white shadow-sm flex flex-col justify-center">
                    <div className="font-semibold text-[11px] truncate">
                      SL-9283 (Sarah Annisa, M.Psi)
                    </div>
                    <div className="text-[9px] text-sky-100">21:00 – 22:30 WIB • Lunas</div>
                  </div>
                </div>
              </div>

              {/* Account 2 Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <span>Zoom Pro 2 (Backup & Overlap Handler)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      LOCKED
                    </span>
                  </span>
                  <span className="text-[11px] text-neutral-400">solulu.room2@gmail.com</span>
                </div>
                <div className="h-12 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden flex items-center p-1">
                  {/* Meeting Overlap: 19:30 - 21:00 (starts at 30%, width 30%) */}
                  <div className="absolute left-[30%] w-[30%] h-10 bg-gradient-to-r from-amber-600 to-emerald-600 rounded-lg p-2 text-white shadow-sm flex flex-col justify-center">
                    <div className="font-semibold text-[11px] truncate">
                      SL-9282 (Rian Hidayat, S.Psi)
                    </div>
                    <div className="text-[9px] text-amber-100">19:30 – 21:00 WIB • Overlap Sesi</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Insight explanation card */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs text-neutral-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Mengapa Concurrency Guard Krusial:</strong> Antara jam
                19:30 s/d 20:30 WIB, kedua akun Zoom sedang dipakai bersamaan. Jika ada pasien lain
                mencoba memilih slot 20:00 WIB pada hari ini, sistem otomatis menolaknya/menyembunyikannya
                karena kuota 2 Zoom sudah penuh!
              </div>
            </div>
          </div>
        </section>
      )}

      {/* STEP 2: COUNSELOR APPLICANT CARDS */}
      {activeStep === 2 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-white">
              Antrean Pelamar Mitra ({MOCK_APPLICANTS.length})
            </h3>
            <span className="text-xs text-neutral-400">
              Dokumen tersimpan aman di Cloudflare R2 (Private Bucket)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_APPLICANTS.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-base">{app.name}</h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {app.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400">{app.appliedAt}</span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  {app.bio}
                </p>

                {/* Document Verification Stack */}
                <div className="space-y-2 text-xs">
                  <div className="text-neutral-400 text-[11px] font-medium">
                    Pemeriksaan Kelengkapan Berkas:
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px]">
                      <span className="text-neutral-300">1. KTP Asli (Identitas WNI)</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Terverifikasi
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px]">
                      <span className="text-neutral-300">2. Ijazah Terakhir ({app.education})</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Terverifikasi
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px]">
                      <span className="text-neutral-300">3. Curriculum Vitae (CV)</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Terverifikasi
                      </span>
                    </div>
                    {app.documents.str && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-teal-950/40 border border-teal-800 text-[11px]">
                        <span className="text-teal-200">
                          4. Surat Tanda Registrasi (STR: {app.strNumber})
                        </span>
                        <span className="text-teal-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Valid & Aktif
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() =>
                      showToast(`Akun mitra dibuat & email aktivasi dikirim ke ${app.email}!`)
                    }
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    Setujui & Buat Akun Mitra
                  </button>
                  <button
                    onClick={() => showToast(`Lamaran ${app.name} ditolak.`)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-rose-950/60 text-neutral-300 hover:text-rose-300 text-xs transition-colors cursor-pointer border border-neutral-700"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STEP 3: PRICING & VOUCHERS */}
      {activeStep === 3 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Adjuster */}
          <div className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-5">
            <div>
              <h3 className="font-semibold text-sm text-white">Tarif Sesi Solulu (90 Menit)</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Tarif flat diterapkan langsung pada seluruh checkout pasien tanpa biaya tersembunyi.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">Konselor Sebaya (90 Menit)</span>
                  <span className="text-sm font-bold text-teal-400">
                    Rp {peerPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="100000"
                  step="5000"
                  value={peerPrice}
                  onChange={(e) => setPeerPrice(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Rp 50.000</span>
                  <span>Maks Rp 100.000</span>
                </div>
              </div>

              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white">Psikolog Klinis (90 Menit)</span>
                  <span className="text-sm font-bold text-teal-400">
                    Rp {psychPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max="250000"
                  step="10000"
                  value={psychPrice}
                  onChange={(e) => setPsychPrice(Number(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500">
                  <span>Rp 100.000</span>
                  <span>Maks Rp 250.000</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => showToast("Perubahan tarif berhasil disimpan ke database!")}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Simpan Perubahan Tarif
            </button>
          </div>

          {/* Vouchers Progress Cards */}
          <div className="p-6 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-white">Monitoring Kuota Voucher</h3>
              <span className="text-xs text-neutral-400">Rollback atomik saat expired</span>
            </div>

            <div className="space-y-3">
              {MOCK_VOUCHERS.map((v) => {
                const percentage = Math.round((v.usedQuota / v.totalQuota) * 100)
                return (
                  <div
                    key={v.code}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono font-bold text-teal-400">{v.code}</div>
                        <div className="text-[11px] text-neutral-400">{v.discount}</div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          v.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {v.status === "active" ? "Aktif" : "Habis / Expired"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>Pemakaian Kuota</span>
                        <span>
                          {v.usedQuota} dari {v.totalQuota} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
