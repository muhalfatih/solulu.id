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
  Check,
  X,
  Search,
  ExternalLink,
  Calendar,
  User,
  Eye,
  Lock,
  Copy,
  AlertTriangle,
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

// Tambahan item awal agar tampilan grid 3-kolom terisi optimal dan estetis
const INITIAL_ITEMS: GalleryItem[] = [
  ...MOCK_GALLERY_ITEMS,
  {
    id: "g-3",
    title: "Workshop Mindfulness & Regulasi Emosi di Tempat Kerja",
    caption:
      "Pelatihan interaktif bagi karyawan untuk mengelola stres kerja dan burnout. Seluruh identitas visual peserta telah disensor blur sesuai klausul informed consent.",
    date: "14 Agu 2026",
    category: "Workshop",
    imageUrl:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80",
    isCensoredAndConsented: true,
    uploadedBy: "Admin Operasional",
  },
]

export default function DistilledGalleryAdminPage() {
  const [items, setItems] = React.useState<GalleryItem[]>(INITIAL_ITEMS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false)
  const [inspectingItem, setInspectingItem] = React.useState<GalleryItem | null>(null)

  // Form State
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
    if (!title.trim() || !isConsented) return

    const newItem: GalleryItem = {
      id: `g-${Date.now()}`,
      title: title.trim(),
      caption: caption.trim() || "Dokumentasi kegiatan edukasi kesehatan mental Solulu.",
      date: "18 Sep 2026",
      category,
      imageUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
      isCensoredAndConsented: true,
      uploadedBy: "Admin Operasional",
    }

    setItems([newItem, ...items])
    setIsUploadModalOpen(false)
    setTitle("")
    setCaption("")
    setIsConsented(false)
    showToast(`Foto dokumentasi "${newItem.title}" berhasil diunggah ke Cloudflare R2 Public CDN!`)
  }

  const handleDelete = (id: string, itemTitle: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    showToast(`Dokumentasi "${itemTitle}" berhasil dihapus dari galeri publik.`)
    if (inspectingItem?.id === id) {
      setInspectingItem(null)
    }
  }

  const handleCopyCDNUrl = (id: string) => {
    const url = `https://pub-r2.solulu.id/gallery/${id}.webp`
    navigator.clipboard?.writeText?.(url)
    showToast("Tautan CDN Cloudflare R2 berhasil disalin ke papan klip!")
  }

  const filteredItems = items.filter((item) => {
    const matchQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === "all" || item.category === categoryFilter
    return matchQuery && matchCat
  })

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
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

      {/* Page Header: Balanced & Clear */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Moderasi Galeri & Dokumentasi Kegiatan
            </h1>
            <Badge variant="outline" className="text-xs font-mono py-0.5">
              ADR-0001 & ADR-0002
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Kurasi dan publikasikan dokumentasi kegiatan Solulu dengan kepatuhan audit sensor wajah 100% (*informed consent*).
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsUploadModalOpen(true)}
          className="h-8 text-xs font-medium gap-1.5"
        >
          <Plus className="size-3.5" />
          <span>Upload Dokumentasi Baru</span>
        </Button>
      </div>

      {/* ADR-0002 Distilled Privacy Policy Bar: Sleek 1-Row Banner */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold text-foreground whitespace-nowrap">
              Protokol Sensor & Privasi Pasien (ADR-0002):
            </span>
            <span className="text-muted-foreground line-clamp-1 sm:line-clamp-none">
              Seluruh foto kegiatan publik wajib sensor wajah 100% dan memiliki izin tertulis (*informed consent*) sebelum dipublikasikan.
            </span>
          </div>
        </div>

        {/* Audit Status Pills */}
        <div className="flex items-center gap-2 shrink-0 text-xs">
          <Badge variant="secondary" className="font-mono text-[10px] py-0.5">
            CLOUDFLARE R2 CDN
          </Badge>
          <Badge variant="default" className="text-[10px] py-0.5 flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            <span>100% Audit Lolos</span>
          </Badge>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari judul kegiatan atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-card"
            aria-label="Cari dokumentasi"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `Semua (${items.length})` },
            { id: "Webinar", label: "Webinar" },
            { id: "Workshop", label: "Workshop" },
            { id: "Sharing Session", label: "Sharing Session" },
            { id: "Community", label: "Community" },
          ].map((cat) => (
            <Button
              key={cat.id}
              variant={categoryFilter === cat.id ? "default" : "outline"}
              size="xs"
              onClick={() => setCategoryFilter(cat.id)}
              className="h-7 text-xs font-normal px-2.5 whitespace-nowrap"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Gallery Grid: Balanced 3 Columns, Refined Typography and Aspect Ratio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group h-full"
            >
              <div>
                {/* Image Container with 16:10 Ratio & Badges */}
                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 opacity-95"
                    loading="lazy"
                  />
                  {/* Category Pill */}
                  <Badge
                    variant="secondary"
                    className="absolute top-3 left-3 text-[10px] font-semibold backdrop-blur-md shadow-xs bg-card/85"
                  >
                    {item.category}
                  </Badge>

                  {/* Consent Badge */}
                  <Badge
                    variant="default"
                    className="absolute top-3 right-3 text-[10px] font-medium gap-1 shadow-xs"
                    title="Sensor wajah 100% telah diverifikasi dan memiliki persetujuan tertulis"
                  >
                    <CheckCircle2 className="size-3" />
                    <span>Informed Consent</span>
                  </Badge>
                </div>

                {/* Content Body */}
                <div className="p-5 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      <span className="tabular-nums">{item.date}</span>
                    </span>
                    <span className="font-mono text-[10px]">R2 Public</span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.caption}
                  </p>
                </div>
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="p-4 pt-3 border-t border-border flex items-center justify-between text-xs mt-auto">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <User className="size-3" />
                  <span>{item.uploadedBy}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setInspectingItem(item)}
                    className="h-7 text-xs font-normal"
                    title="Pratinjau dokumentasi dan rincian kepatuhan privasi"
                  >
                    <Eye className="size-3.5 mr-1" />
                    <span>Pratinjau</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(item.id, item.title)}
                    className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Hapus dokumentasi dari galeri publik"
                    aria-label={`Hapus ${item.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-border rounded-2xl bg-card">
            <ImageIcon className="size-8 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Tidak ada dokumentasi ditemukan
            </span>
            <span className="text-xs text-muted-foreground max-w-sm">
              Coba sesuaikan kata kunci pencarian atau ganti filter kategori.
            </span>
          </div>
        )}
      </div>

      {/* Modal 1: Pratinjau Audit Dokumentasi & Consent */}
      {inspectingItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">
                    Audit Privasi Dokumentasi Kegiatan
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Verifikasi kepatuhan informed consent dan distribusi aset publik CDN.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setInspectingItem(null)}
                aria-label="Tutup pratinjau"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Photo Preview */}
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted border border-border">
              <img
                src={inspectingItem.imageUrl}
                alt={inspectingItem.title}
                className="w-full h-full object-cover"
              />
              <Badge
                variant="default"
                className="absolute top-3 right-3 text-[10px] font-medium gap-1 shadow-md"
              >
                <CheckCircle2 className="size-3" />
                <span>Sensor Wajah Terverifikasi</span>
              </Badge>
            </div>

            {/* Content Details */}
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                <Badge variant="secondary" className="text-[10px]">
                  {inspectingItem.category}
                </Badge>
                <span className="tabular-nums">Dipublikasikan: {inspectingItem.date}</span>
              </div>

              <h4 className="text-sm font-bold text-foreground">{inspectingItem.title}</h4>
              <p className="text-muted-foreground leading-relaxed text-xs">
                {inspectingItem.caption}
              </p>
            </div>

            {/* Privacy Checklist Box */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col gap-2 text-xs">
              <span className="font-semibold text-foreground text-[11px]">
                Audit Trail Etika & Infrastruktur (ADR-0001 & ADR-0002):
              </span>
              <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary shrink-0" />
                  <span>Wajah seluruh peserta telekonsultasi/webinar telah disensor 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary shrink-0" />
                  <span>Surat informed consent tertulis dari peserta terarsip di sistem</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary shrink-0" />
                  <span>Disimpan di Cloudflare R2 Public Bucket (Bypass batas 4.5MB Vercel)</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyCDNUrl(inspectingItem.id)}
                className="h-8 text-xs font-normal"
                title="Salin URL CDN Cloudflare R2"
              >
                <Copy className="size-3.5 mr-1.5 text-muted-foreground" />
                <span>Salin URL CDN</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setInspectingItem(null)}
                className="h-8 text-xs font-medium"
              >
                Selesai
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Upload Foto Dokumentasi Baru */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <UploadCloud className="size-5 text-primary" />
                  <h3 className="font-bold text-foreground text-base">
                    Unggah Dokumentasi Kegiatan Publik
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Publikasikan foto kegiatan ke CDN Cloudflare R2 dengan persetujuan privasi.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Tutup form unggah"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Judul Kegiatan / Sesi</label>
                <Input
                  type="text"
                  placeholder="Misal: Webinar Regulasi Emosi Remaja & Dewasa Awal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-foreground">Kategori Kegiatan</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none font-medium h-8"
                  >
                    <option value="Webinar">Webinar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Sharing Session">Sharing Session</option>
                    <option value="Community">Community</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-medium text-foreground">Target Unggah</label>
                  <div className="h-8 rounded-xl bg-muted/40 border border-border flex items-center px-3 text-[11px] font-mono text-muted-foreground truncate">
                    Cloudflare R2 (Public)
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Keterangan / Caption Ringkas</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan ringkasan kegiatan, narasumber, dan jumlah peserta..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none resize-none"
                />
              </div>

              {/* Upload Dropzone Simulation */}
              <div className="p-4 bg-muted/20 border-2 border-dashed border-border rounded-xl text-center flex flex-col items-center gap-1">
                <ImageIcon className="size-6 text-muted-foreground" />
                <div className="text-xs text-foreground font-medium">
                  Klik atau seret file foto (.jpg, .png, .webp)
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Unggah langsung via presigned URL ke Cloudflare R2 (Bypass Vercel 4.5MB limit)
                </div>
              </div>

              {/* MANDATORY CONSENT AUDIT CHECKBOX */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={isConsented}
                  onChange={(e) => setIsConsented(e.target.checked)}
                  className="mt-0.5 size-4 rounded accent-primary cursor-pointer shrink-0"
                />
                <label
                  htmlFor="consentCheckbox"
                  className="text-[11px] text-foreground leading-tight cursor-pointer select-none"
                >
                  <strong className="font-semibold text-amber-500">Audit Kepatuhan Privasi:</strong> Saya mengonfirmasi bahwa seluruh wajah klien/peserta pada foto ini telah disensor blur 100% dan klien telah memberikan persetujuan tertulis (*informed consent*) untuk publikasi.
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="h-8 text-xs font-normal"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isConsented}
                  className="h-8 text-xs font-medium"
                >
                  Publikasikan ke CDN Publik
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

