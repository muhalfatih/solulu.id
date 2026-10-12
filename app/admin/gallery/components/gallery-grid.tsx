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
  AlertCircle,
  Images,
  Plus,
} from "lucide-react"
import type { GalleryItem } from "@/lib/types/admin"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GalleryGridProps {
  items: GalleryItem[]
  isLoading?: boolean
  onUploadClick: () => void
  onDelete: (id: string) => void
  onCopyCDN: (id: string) => void
}

export function GalleryGrid({
  items,
  isLoading = false,
  onUploadClick,
  onDelete,
  onCopyCDN,
}: GalleryGridProps) {
  const [columns, setColumns] = React.useState<3 | 4 | 5>(4)
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<GalleryItem | null>(null)

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

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Visual Density & Status Bar */}
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground pb-1">
        <span className="font-medium text-foreground">
          {items.length} Dokumentasi Visual
        </span>

        {/* Grid Column Density Toggles */}
        <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-muted/40">
          <button
            type="button"
            onClick={() => setColumns(3)}
            className={`h-7 px-2.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              columns === 3
                ? "bg-card text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tampilan Besar (3 Kolom)"
            aria-label="3 Kolom"
          >
            <Grid2X2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setColumns(4)}
            className={`h-7 px-2.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              columns === 4
                ? "bg-card text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tampilan Standar (4 Kolom)"
            aria-label="4 Kolom"
          >
            <Grid3X3 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setColumns(5)}
            className={`h-7 px-2.5 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
              columns === 5
                ? "bg-card text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tampilan Kompak (5 Kolom)"
            aria-label="5 Kolom"
          >
            <LayoutGrid className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Photo Grid */}
      <div
        className={`grid gap-4 ${
          columns === 3
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : columns === 4
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        }`}
      >
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`gallery-skel-${i}`}
              className="rounded-xl overflow-hidden bg-muted/70 border border-border/80 shadow-xs aspect-video animate-pulse"
            />
          ))
        ) : items.length === 0 ? (
          <div className="col-span-full py-16 text-center border border-dashed border-border rounded-2xl bg-card flex flex-col items-center justify-center gap-2.5 px-4 shadow-xs">
            <Images className="size-8 text-muted-foreground/30 mb-1" />
            <p className="text-sm font-semibold text-foreground">Belum ada foto di galeri</p>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Dokumentasi yang Anda unggah akan ditampilkan di etalase kegiatan publik Solulu.
            </p>
            <Button
              onClick={onUploadClick}
              size="sm"
              className="mt-2 gap-1.5 font-medium shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Unggah Foto Pertama</span>
            </Button>
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden bg-muted border border-border/80 shadow-xs hover:shadow-md transition-all aspect-video cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
              {/* Photo Image */}
              <img
                src={item.imageUrl}
                alt={item.caption || "Foto kegiatan Solulu"}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                loading="lazy"
              />

              {/* Caption Bar (Bottom) */}
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6 text-white text-[11px] leading-snug line-clamp-1 pointer-events-none group-hover:opacity-0 transition-opacity">
                  {item.caption}
                </div>
              )}

              {/* Hover Action Overlay */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                {/* Top Row: Delete & Info */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-black/60 text-white border-0">
                    {item.date || "Foto"}
                  </Badge>

                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(item)
                    }}
                    className="size-7 rounded-full bg-black/60 hover:bg-destructive hover:text-destructive-foreground text-white border-0 cursor-pointer"
                    title="Hapus Foto"
                    aria-label="Hapus foto"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                {/* Center: Fullscreen Zoom Icon */}
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
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span>Hapus Foto Galeri</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus foto dokumentasi ini dari galeri dan basis data?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              className="gap-1.5 font-medium shadow-xs"
            >
              <Trash2 className="size-3.5" />
              <span>Hapus Sekarang</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pure Theatrical Fullscreen Lightbox */}
      {currentLightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Penampil foto layar penuh"
          className="fixed inset-0 bg-black/95 z-50 flex flex-col justify-between p-4 sm:p-6 animate-in fade-in"
        >
          {/* Top Bar: Counter & Actions Only */}
          <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-white/70">
                {(lightboxIndex ?? 0) + 1} / {items.length}
              </span>
              {currentLightboxItem.caption && (
                <span className="text-xs text-white/90 hidden sm:inline truncate max-w-md">
                  {currentLightboxItem.caption}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyCDN(currentLightboxItem.id)}
                className="h-8 text-xs border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <Copy className="size-3.5 mr-1" />
                <span>Salin Tautan CDN</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentLightboxItem.imageUrl, "_blank")}
                className="h-8 text-xs border-white/20 text-white hover:bg-white/10 bg-transparent"
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
              alt={currentLightboxItem.caption || "Foto dokumentasi layar penuh"}
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
