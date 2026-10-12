"use client"

import * as React from "react"
import {
  UploadCloud,
  ImageIcon,
  ShieldCheck,
  Loader2,
} from "lucide-react"
import type { GalleryItem } from "@/lib/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GalleryUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (item: GalleryItem, caption: string) => Promise<void> | void
}

const PRESET_SAMPLE_IMAGES = [
  {
    label: "Webinar Zoom Online",
    url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
    caption: "Sesi edukasi kesehatan mental interaktif via Zoom",
    aspectRatio: "16:9" as const,
    dimensions: "1920 × 1080",
  },
  {
    label: "Workshop Offline",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
    caption: "Workshop manajemen stres & mindfulness tatap muka",
    aspectRatio: "16:9" as const,
    dimensions: "2400 × 1600",
  },
  {
    label: "Sesi Diskusi Konseling",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
    caption: "Diskusi kelompok terarah bersama mitra konselor Solulu",
    aspectRatio: "16:9" as const,
    dimensions: "1920 × 1080",
  },
  {
    label: "Komunitas Kampus",
    url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80",
    caption: "Kegiatan peer support dan sosialisasi di lingkungan kampus",
    aspectRatio: "4:3" as const,
    dimensions: "2048 × 1536",
  },
]

export function GalleryUploadDialog({
  isOpen,
  onClose,
  onUpload,
}: GalleryUploadDialogProps) {
  const [imageUrl, setImageUrl] = React.useState(PRESET_SAMPLE_IMAGES[0].url)
  const [caption, setCaption] = React.useState(PRESET_SAMPLE_IMAGES[0].caption)
  const [aspectRatio, setAspectRatio] = React.useState<"16:9" | "4:3" | "1:1">("16:9")
  const [dimensions, setDimensions] = React.useState("1920 × 1080")
  const [hasConsent, setHasConsent] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) return

    setIsSubmitting(true)
    try {
      const newItem: GalleryItem = {
        id: `g-${Date.now()}`,
        imageUrl: imageUrl.trim(),
        title: caption.trim() || "Dokumentasi Kegiatan Solulu",
        caption: caption.trim() || "Dokumentasi Kegiatan Solulu",
        aspectRatio,
        dimensions,
        fileSize: "920 KB",
        date: new Date().toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        isCensoredAndConsented: hasConsent,
        uploadedBy: "Admin",
      }

      await onUpload(newItem, caption.trim())
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ImageIcon className="size-4 text-primary" />
              <span>Unggah Foto Dokumentasi</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Tambahkan foto kegiatan atau screenshot sesi untuk etalase publik Solulu.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 text-xs py-1">
            {/* Visual Preview Box */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Pratinjau foto dokumentasi"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <ImageIcon className="size-8 text-muted-foreground/40" />
                  <span className="text-xs">Pratinjau berkas gambar</span>
                </div>
              )}
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Pilih Contoh Template Kegiatan:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url)
                      setCaption(preset.caption)
                      setAspectRatio(preset.aspectRatio)
                      setDimensions(preset.dimensions)
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      imageUrl === preset.url
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/30 border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct URL Input */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="custom-image-url" className="text-xs font-medium text-foreground">
                Tautan Gambar / URL CDN Cloudflare R2 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="custom-image-url"
                type="url"
                placeholder="https://pub-r2.solulu.id/gallery/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                className="h-9 text-xs bg-background"
              />
            </div>

            {/* Caption / Description Input */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="custom-caption" className="text-xs font-medium text-foreground">
                Keterangan / Caption Foto
              </Label>
              <Textarea
                id="custom-caption"
                placeholder="Contoh: Sesi webinar kesehatan mental mahasiswa bersama konselor sebaya..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                className="text-xs resize-none bg-background"
              />
            </div>

            {/* Privacy & Legal Audit Compliance */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
              <Checkbox
                id="legalConsent"
                checked={hasConsent}
                onCheckedChange={(checked) => setHasConsent(Boolean(checked))}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="legalConsent" className="text-xs font-semibold text-foreground cursor-pointer">
                  Kepatuhan Privasi &amp; Izin Dokumentasi
                </Label>
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  Foto telah disamarkan (blur wajah) atau telah memperoleh persetujuan tertulis dari peserta kegiatan (*Privacy-First Standard*).
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!imageUrl.trim() || isSubmitting}
              className="gap-1.5 font-medium shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="size-3.5" />
                  <span>Tambahkan ke Galeri</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
