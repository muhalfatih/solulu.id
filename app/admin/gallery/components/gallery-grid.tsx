"use client"

import * as React from "react"
import {
  Maximize2,
  Copy,
  Trash2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Grid2X2,
  LayoutGrid,
} from "lucide-react"
import { GalleryItem } from "../../mock-data"
import { Button } from "@/components/ui/button"

interface GalleryGridProps {
  items: GalleryItem[]
  onUploadClick: () => void
  onDelete: (id: string, title?: string) => void
  onCopyCDN: (id: string) => void
}

export function GalleryGrid({
  items,
  onUploadClick,
  onDelete,
  onCopyCDN,
}: GalleryGridProps) {
  const [columns, setColumns] = React.useState<3 | 4 | 5>(4)
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)

  const currentLightboxItem = lightboxIndex !== null ? items[lightboxIndex] : null

  const handlePrev = React.useCallback(() => {
    if (lightboxIndex !== null && items.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + items.length) % items.length)
    }
  }, [lightboxIndex, items.length])

  const handleNext = React.useCallback(() => {
    if (lightboxIndex !== null && items.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % items.length)
    }
  }, [lightboxIndex, items.length])

  // Keyboard navigation for lightbox
  React.useEffect(() => {
    if (lightboxIndex === null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "ArrowRight") handleNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxIndex, handlePrev, handleNext])

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Visual Density Toolbar */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground pb-2">
        <span className="font-medium text-foreground">
          {items.length} Foto / Screenshot
        </span>

        {/* Grid Column Density Toggles */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setColumns(3)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              columns === 3 ? "bg-background text-foreground shadow-xs" : "hover:text-foreground"
            }`}
            title="Tampilan Besar (3 Kolom)"
            aria-label="3 Kolom"
          >
            <Grid2X2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setColumns(4)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              columns === 4 ? "bg-background text-foreground shadow-xs" : "hover:text-foreground"
            }`}
            title="Tampilan Sedang (4 Kolom)"
            aria-label="4 Kolom"
          >
            <Grid3X3 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setColumns(5)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              columns === 5 ? "bg-background text-foreground shadow-xs" : "hover:text-foreground"
            }`}
            title="Tampilan Kompak (5 Kolom)"
            aria-label="5 Kolom"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {/* Pure Visual Photo Grid: NO Text, NO Captions */}
      <div
        className={`grid gap-4 ${
          columns === 3
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : columns === 4
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        }`}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className="group relative rounded-xl overflow-hidden bg-muted border border-border/80 shadow-xs hover:shadow-md transition-all aspect-video cursor-pointer"
            onClick={() => setLightboxIndex(index)}
          >
            {/* Pure Photo */}
            <img
              src={item.imageUrl}
              alt="Foto kegiatan"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              loading="lazy"
            />

            {/* Subtle Hover Action Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              {/* Top Row: Delete */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.id)
                  }}
                  className="size-7 rounded-full bg-black/60 hover:bg-destructive hover:text-destructive-foreground text-white border-0 cursor-pointer"
                  title="Hapus Foto"
                  aria-label="Hapus foto"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              {/* Center: Fullscreen Zoom */}
              <div className="flex justify-center">
                <div className="size-9 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Maximize2 className="size-4" />
                </div>
              </div>

              {/* Bottom Row: Copy CDN & Download */}
              <div className="flex items-center justify-between text-xs text-white">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCopyCDN(item.id)
                  }}
                  className="px-2 py-1 rounded-md bg-black/60 hover:bg-black/80 text-white font-medium flex items-center gap-1.5 cursor-pointer text-xs"
                  title="Salin Tautan CDN"
                >
                  <Copy className="size-3" />
                  <span>Salin CDN</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(item.imageUrl, "_blank")
                  }}
                  className="p-1 rounded-md bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                  title="Unduh Berkas Asli"
                  aria-label="Unduh berkas asli"
                >
                  <Download className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pure Theatrical Fullscreen Lightbox (Zero Text Overlays) */}
      {currentLightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Penampil foto layar penuh"
          className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in"
        >
          {/* Top Bar: Counter & Actions Only */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
            <span className="font-mono text-xs text-white/70">
              {(lightboxIndex ?? 0) + 1} / {items.length}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => onCopyCDN(currentLightboxItem.id)}
                className="h-8 text-xs border-white/20 text-white hover:bg-white/10"
              >
                <Copy className="size-3.5 mr-1" />
                <span>Salin Tautan CDN</span>
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={() => window.open(currentLightboxItem.imageUrl, "_blank")}
                className="h-8 text-xs border-white/20 text-white hover:bg-white/10"
              >
                <Download className="size-3.5 mr-1" />
                <span>Unduh</span>
              </Button>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setLightboxIndex(null)}
                className="size-8 text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Tutup penampil foto"
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>

          {/* Central Fullscreen Image Stage */}
          <div className="relative my-auto flex items-center justify-center max-h-[82vh] w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-10 size-11 rounded-full bg-black/50 text-white hover:bg-black/80 border border-white/20 cursor-pointer"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft className="size-6" />
            </Button>

            <img
              src={currentLightboxItem.imageUrl}
              alt="Foto dokumentasi layar penuh"
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-10 size-11 rounded-full bg-black/50 text-white hover:bg-black/80 border border-white/20 cursor-pointer"
              aria-label="Foto berikutnya"
            >
              <ChevronRight className="size-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
