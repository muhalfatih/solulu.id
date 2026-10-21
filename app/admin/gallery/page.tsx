"use client"

import * as React from "react"
import type { GalleryItem } from "@/lib/types/admin"
import { GalleryGrid } from "./components/gallery-grid"
import { GalleryUploadDialog } from "./components/gallery-upload-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AdminPageHeader, AdminMetricCard } from "@/components/admin"
import {
  Check,
  X,
  Plus,
  Images,
  Search,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import {
  getGalleryAdminAction,
  createGalleryAdminAction,
  deleteGalleryAdminAction,
} from "./actions"

export default function GalleryAdminPage() {
  const [items, setItems] = React.useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Fetch real gallery items from database on mount
  const loadGallery = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await getGalleryAdminAction()
      if (res.success && res.data && res.data.length > 0) {
        const mapped: GalleryItem[] = res.data.map((r: any) => ({
          id: r.id,
          imageUrl: r.imageUrl || r.r2Url,
          title: r.caption || "Dokumentasi Kegiatan",
          caption: r.caption || "Dokumentasi Kegiatan",
          aspectRatio: "16:9",
          dimensions: "1920 × 1080",
          fileSize: "920 KB",
          date: new Date(r.createdAt).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          isCensoredAndConsented: r.isCensoredAndConsented ?? true,
          uploadedBy: "Admin",
        }))
        setItems(mapped)
      } else {
        setItems([])
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memuat galeri dari database.")
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadGallery()
  }, [loadGallery])

  const handleUpload = async (newItem: GalleryItem, captionText: string) => {
    setErrorMessage(null)
    try {
      const res = await createGalleryAdminAction({
        title: captionText || "Dokumentasi Solulu",
        category: "general",
        r2Url: newItem.imageUrl,
        caption: captionText || "Dokumentasi sesi/kegiatan Solulu",
      })

      if (res.success && res.data) {
        const created: GalleryItem = {
          ...newItem,
          id: res.data.id || newItem.id,
          caption: res.data.caption || captionText,
        }
        setItems((prev) => [created, ...prev])
        showToast("Foto berhasil ditambahkan ke galeri dan disimpan ke database.")
      } else {
        throw new Error(res.error || "Gagal menyimpan foto ke database.")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan foto ke database.")
    }
  }

  const handleDelete = async (id: string) => {
    setErrorMessage(null)
    const prevItems = [...items]
    setItems((prev) => prev.filter((item) => item.id !== id))

    try {
      const res = await deleteGalleryAdminAction(id)
      if (!res.success) throw new Error(res.error)
      showToast("Foto telah dihapus dari galeri.")
    } catch (err: any) {
      setItems(prevItems)
      setErrorMessage(err.message || "Gagal menghapus foto dari database.")
    }
  }

  const handleCopyCDN = (id: string) => {
    const item = items.find((i) => i.id === id)
    const url = item?.imageUrl || `https://pub-r2.solulu.id/gallery/${id}.webp`
    navigator.clipboard?.writeText?.(url)
    showToast("Tautan CDN foto berhasil disalin ke papan klip.")
  }

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      (item.caption && item.caption.toLowerCase().includes(q)) ||
      item.id.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md"
        >
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary shrink-0" />
            <span className="leading-relaxed">{toastMessage}</span>
          </div>
          <Button
            type="button"
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

      {/* Page Header */}
      <AdminPageHeader
        title="Galeri & Dokumentasi Visual"
        description="Manajemen dokumentasi visual kegiatan, workshop, dan foto edukasi Solulu untuk portofolio publik."
        icon={Images}
        badge={isLoading ? undefined : `${items.length} Foto`}
        badgeVariant="outline"
        actions={
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="gap-1.5 font-medium shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Unggah Foto Baru</span>
          </Button>
        }
      />

      {/* Error Feedback Banner */}
      {errorMessage && (
        <Alert variant="destructive" className="animate-in fade-in">
          <AlertCircle className="size-4" />
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5">
              <AlertTitle className="text-xs font-semibold">Terjadi Kesalahan</AlertTitle>
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setErrorMessage(null)}
              className="text-destructive hover:bg-destructive/10 shrink-0"
              aria-label="Tutup pesan error"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminMetricCard
          title="Total Dokumentasi"
          value={items.length}
          isLoading={isLoading}
          trendLabel="Foto tersimpan di Cloudflare R2"
        />
        <AdminMetricCard
          title="Persetujuan Privasi"
          value="100% Consent"
          isLoading={isLoading}
          status="success"
          trendLabel="Audit privasi & consent legal"
        />
        <AdminMetricCard
          title="Rasio Aspek Visual"
          value="16:9 / 4:3"
          isLoading={isLoading}
          status="neutral"
          trendLabel="Format optimal etalase publik"
        />
      </div>

      {/* Search Bar Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari keterangan atau kata kunci foto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 pr-8 h-8 text-xs bg-background"
            aria-label="Cari foto galeri"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Hapus pencarian"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
          Menampilkan {filteredItems.length} dari {items.length} foto
        </span>
      </div>

      {/* Main Visual Grid */}
      <main className="w-full">
        <GalleryGrid
          items={filteredItems}
          isLoading={isLoading}
          onUploadClick={() => setIsUploadOpen(true)}
          onDelete={handleDelete}
          onCopyCDN={handleCopyCDN}
        />
      </main>

      {/* Upload Dialog: Standard Shadcn Vega Modal */}
      <GalleryUploadDialog
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}
