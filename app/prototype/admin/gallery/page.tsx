"use client"

import * as React from "react"
import { MOCK_GALLERY_ITEMS, GalleryItem } from "../mock-data"
import {
  ImageIcon,
  UploadCloud,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  Plus,
} from "lucide-react"

export default function GalleryAdminPage() {
  const [items, setItems] = React.useState<GalleryItem[]>(MOCK_GALLERY_ITEMS)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [caption, setCaption] = React.useState("")
  const [category, setCategory] = React.useState<GalleryItem["category"]>("Webinar")
  const [isConsented, setIsConsented] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !isConsented) return

    const newItem: GalleryItem = {
      id: `g-${Date.now()}`,
      title,
      caption,
      date: "17 Sep 2026",
      category,
      imageUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
      isCensoredAndConsented: true,
      uploadedBy: "Admin Operasional",
    }

    setItems([newItem, ...items])
    setIsModalOpen(false)
    setTitle("")
    setCaption("")
    setIsConsented(false)
    showToast("✅ Foto dokumentasi berhasil diunggah ke Cloudflare R2 Public CDN!")
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    showToast("Dokumentasi dihapus dari galeri publik.")
  }

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200 text-xs shadow-md animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Moderasi Galeri Dokumentasi Publik
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Kurasi dan publikasikan dokumentasi kegiatan Solulu dengan audit persetujuan sensor wajah 100%.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Dokumentasi Baru</span>
        </button>
      </div>

      {/* ADR Privacy Policy Box */}
      <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/90 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-3.5 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-neutral-900 dark:text-white font-bold text-sm">
            Protokol Privasi & Audit Persetujuan Pasien (ADR-0002):
          </strong>
          <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
            Seluruh foto dokumentasi sesi telekonsultasi atau webinar publik wajib melalui sensor blur pada seluruh identitas wajah peserta. Admin wajib mencentang klausul persetujuan tertulis (*is_censored_and_consented = true*) sebelum file diizinkan terunggah ke Cloudflare R2 Public CDN.
          </p>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 overflow-hidden flex flex-col justify-between group shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
          >
            <div>
              {/* Image Thumbnail with Tag */}
              <div className="relative h-48 bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95 dark:opacity-90"
                />
                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white text-[10px] font-bold shadow-xs">
                  {item.category}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Consented</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2 text-xs">
                <div className="text-[11px] text-neutral-400 font-medium">{item.date}</div>
                <h2 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-2 leading-snug">
                  {item.title}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px] line-clamp-3 leading-relaxed">
                  {item.caption}
                </p>
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
              <span className="text-[10px] font-mono">By: {item.uploadedBy}</span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Hapus dari galeri"
                aria-label="Hapus item galeri"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Upload Dokumentasi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleUpload}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h2 className="font-bold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Upload Foto Dokumentasi Publik</span>
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
                  Judul Kegiatan / Sesi:
                </label>
                <input
                  type="text"
                  placeholder="Misal: Webinar Regulasi Emosi Remaja"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white mt-1 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="text-neutral-700 dark:text-neutral-300 font-semibold">Kategori:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-neutral-200 mt-1 focus:outline-none font-medium"
                >
                  <option value="Webinar">Webinar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Sharing Session">Sharing Session</option>
                  <option value="Community">Community</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-700 dark:text-neutral-300 font-semibold">
                  Keterangan / Caption Singkat:
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ringkasan kegiatan dan dampak positif..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl p-3 text-xs text-neutral-900 dark:text-white mt-1 focus:outline-none focus:border-emerald-500 resize-none font-medium"
                />
              </div>

              {/* Upload Dropzone Simulation */}
              <div className="p-5 bg-neutral-50 dark:bg-neutral-950 border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl text-center space-y-1.5">
                <ImageIcon className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto" />
                <div className="text-xs text-neutral-700 dark:text-neutral-300 font-semibold">
                  Pilih file gambar (.jpg, .png, .webp)
                </div>
                <div className="text-[10px] text-neutral-500">
                  Unggah langsung via presigned URL ke Cloudflare R2 (Bypass Vercel 4.5MB limit)
                </div>
              </div>

              {/* MANDATORY CONSENT CHECKBOX */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={isConsented}
                  onChange={(e) => setIsConsented(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <label
                  htmlFor="consentCheckbox"
                  className="text-[11px] text-amber-900 dark:text-amber-200 leading-tight cursor-pointer select-none"
                >
                  <strong className="font-bold">Audit Etika Privasi Pasien:</strong> Saya
                  mengonfirmasi bahwa seluruh wajah klien pada foto ini telah disensor/diblur dan
                  klien telah memberikan persetujuan tertulis untuk publikasi.
                </label>
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
                disabled={!isConsented}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-200 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Upload ke CDN Publik
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
