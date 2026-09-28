"use client"

import * as React from "react"
import { MOCK_GALLERY_ITEMS, GalleryItem } from "../mock-data"
import { GalleryGrid } from "./components/gallery-grid"
import { GalleryUploadDialog } from "./components/gallery-upload-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Plus } from "lucide-react"

export default function GalleryAdminPage() {
  const [items, setItems] = React.useState<GalleryItem[]>(MOCK_GALLERY_ITEMS)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleUpload = (newItem: GalleryItem) => {
    setItems((prev) => [newItem, ...prev])
    showToast("Foto berhasil ditambahkan ke galeri.")
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    showToast("Foto telah dihapus dari galeri.")
  }

  const handleCopyCDN = (id: string) => {
    const url = `https://pub-r2.solulu.id/gallery/${id}.webp`
    navigator.clipboard?.writeText?.(url)
    showToast("Tautan CDN foto berhasil disalin ke papan klip.")
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md"
        >
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Clean Minimal Header: Pure Image Focus */}
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Galeri Foto
          </h1>
          <Badge variant="secondary" className="font-mono text-xs py-0.5">
            {items.length} Foto
          </Badge>
        </div>

        {/* Quick Upload Action */}
        <Button
          size="sm"
          onClick={() => setIsUploadOpen(true)}
          className="h-8 text-xs font-medium gap-1.5 cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Unggah Foto</span>
        </Button>
      </header>

      {/* Main Pure Visual Grid (Opsi 1) */}
      <main className="w-full">
        <GalleryGrid
          items={items}
          onUploadClick={() => setIsUploadOpen(true)}
          onDelete={handleDelete}
          onCopyCDN={handleCopyCDN}
        />
      </main>

      {/* Upload Dialog: Minimal Pure Image Drop/Pick */}
      <GalleryUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}
