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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function FreshGalleryAdminPage() {
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

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Moderasi Galeri Dokumentasi Publik
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kurasi dan publikasikan dokumentasi kegiatan Solulu dengan audit persetujuan sensor wajah 100%.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 font-bold"
        >
          <Plus className="size-4" />
          <span>Upload Dokumentasi Baru</span>
        </Button>
      </div>

      {/* ADR Privacy Policy Box */}
      <Card className="p-5 bg-muted/40 border-border flex flex-row items-start gap-3.5 shadow-xs">
        <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm">
            Protokol Privasi & Audit Persetujuan Pasien (ADR-0002)
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Seluruh foto dokumentasi sesi telekonsultasi atau webinar publik wajib melalui sensor blur pada seluruh identitas wajah peserta. Admin wajib mencentang klausul persetujuan tertulis (*is_censored_and_consented = true*) sebelum file diizinkan terunggah ke Cloudflare R2 Public CDN.
          </CardDescription>
        </div>
      </Card>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden flex flex-col justify-between group shadow-xs hover:shadow-md transition-all"
          >
            <div>
              {/* Image Thumbnail with Tag */}
              <div className="relative h-48 bg-muted overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-95"
                />
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 text-[10px] font-bold shadow-xs backdrop-blur-md"
                >
                  {item.category}
                </Badge>
                <Badge
                  variant="default"
                  className="absolute top-3 right-3 text-[10px] font-bold gap-1 shadow-xs"
                >
                  <CheckCircle2 className="size-3" />
                  <span>Consented</span>
                </Badge>
              </div>

              {/* Body */}
              <CardContent className="p-5 flex flex-col gap-2 text-xs">
                <div className="text-[11px] text-muted-foreground font-medium">{item.date}</div>
                <CardTitle className="text-sm line-clamp-2 leading-snug">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-[11px] line-clamp-3 leading-relaxed">
                  {item.caption}
                </CardDescription>
              </CardContent>
            </div>

            {/* Footer / Actions */}
            <CardFooter className="p-5 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="text-[10px] font-mono">By: {item.uploadedBy}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(item.id)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Hapus dari galeri"
                aria-label="Hapus item galeri"
              >
                <Trash2 className="size-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Modal Upload Dokumentasi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <Card className="max-w-lg w-full p-6 shadow-2xl">
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UploadCloud className="size-4 text-primary" />
                  <span>Upload Foto Dokumentasi Publik</span>
                </CardTitle>
                <Button variant="ghost" size="xs" onClick={() => setIsModalOpen(false)}>
                  ✕
                </Button>
              </div>

              <div className="flex flex-col gap-3.5 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground font-semibold">
                    Judul Kegiatan / Sesi:
                  </label>
                  <Input
                    type="text"
                    placeholder="Misal: Webinar Regulasi Emosi Remaja"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground font-semibold">Kategori:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none font-medium"
                  >
                    <option value="Webinar">Webinar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Sharing Session">Sharing Session</option>
                    <option value="Community">Community</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-foreground font-semibold">
                    Keterangan / Caption Singkat:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan ringkasan kegiatan dan dampak positif..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none resize-none font-medium"
                  />
                </div>

                {/* Upload Dropzone Simulation */}
                <div className="p-5 bg-muted/20 border-2 border-dashed border-border rounded-2xl text-center flex flex-col items-center gap-1.5">
                  <ImageIcon className="size-8 text-muted-foreground" />
                  <div className="text-xs text-foreground font-semibold">
                    Pilih file gambar (.jpg, .png, .webp)
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Unggah langsung via presigned URL ke Cloudflare R2 (Bypass Vercel 4.5MB limit)
                  </div>
                </div>

                {/* MANDATORY CONSENT CHECKBOX */}
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consentCheckbox"
                    checked={isConsented}
                    onChange={(e) => setIsConsented(e.target.checked)}
                    className="mt-0.5 size-4 rounded accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="consentCheckbox"
                    className="text-[11px] text-foreground leading-tight cursor-pointer select-none"
                  >
                    <strong className="font-bold">Audit Etika Privasi Pasien:</strong> Saya
                    mengonfirmasi bahwa seluruh wajah klien pada foto ini telah disensor/diblur dan
                    klien telah memberikan persetujuan tertulis untuk publikasi.
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isConsented}
                  className="font-bold"
                >
                  Upload ke CDN Publik
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
