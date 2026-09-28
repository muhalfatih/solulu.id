"use client"

import * as React from "react"
import {
  UploadCloud,
  X,
  ImageIcon,
  Check,
} from "lucide-react"
import { GalleryItem } from "../../mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GalleryUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (item: GalleryItem) => void
}

const PRESET_SAMPLE_IMAGES = [
  {
    label: "Screenshot Zoom Webinar",
    url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80",
    aspectRatio: "16:9" as const,
    dimensions: "1920 × 1080",
  },
  {
    label: "Foto Workshop Offline",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
    aspectRatio: "16:9" as const,
    dimensions: "2400 × 1600",
  },
  {
    label: "Foto Sesi Konseling",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
    aspectRatio: "16:9" as const,
    dimensions: "1920 × 1080",
  },
  {
    label: "Foto Komunitas Kampus",
    url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80",
    aspectRatio: "4:3" as const,
    dimensions: "2048 × 1536",
  },
  {
    label: "Screenshot Edukasi Persegi",
    url: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=1200&auto=format&fit=crop&q=80",
    aspectRatio: "1:1" as const,
    dimensions: "1200 × 1200",
  },
]

export function GalleryUploadDialog({
  isOpen,
  onClose,
  onUpload,
}: GalleryUploadDialogProps) {
  const [imageUrl, setImageUrl] = React.useState(PRESET_SAMPLE_IMAGES[0].url)
  const [aspectRatio, setAspectRatio] = React.useState<"16:9" | "4:3" | "1:1">("16:9")
  const [dimensions, setDimensions] = React.useState("1920 × 1080")

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) return

    const newItem: GalleryItem = {
      id: `g-${Date.now()}`,
      imageUrl: imageUrl.trim(),
      aspectRatio,
      dimensions,
      fileSize: "920 KB",
      date: new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      isCensoredAndConsented: true,
      uploadedBy: "Admin",
    }

    onUpload(newItem)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
      className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 flex flex-col gap-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 id="upload-dialog-title" className="text-base font-bold text-foreground">
            Unggah Foto atau Screenshot
          </h2>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
          {/* Visual Preview Box */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Pratinjau foto kegiatan"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                <ImageIcon className="size-8" />
                <span className="text-xs">Pratinjau berkas gambar</span>
              </div>
            )}
          </div>

          {/* Quick Sample Presets */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Pilih Contoh Gambar atau Screenshot:
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setImageUrl(preset.url)
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
            <Label htmlFor="custom-image-url" className="text-xs font-medium">
              Atau Masukkan Tautan Gambar (URL / File)
            </Label>
            <Input
              id="custom-image-url"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="h-9 text-xs bg-background"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-normal"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!imageUrl.trim()}
              className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
            >
              <UploadCloud className="size-3.5" />
              <span>Tambahkan ke Galeri</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
