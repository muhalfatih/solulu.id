"use client"

import * as React from "react"
import { MOCK_TESTIMONIALS, TestimonialItem } from "../mock-data"
import { TestimonialVariantA } from "./components/testimonial-variant-a"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TestimonialsAdminPage() {
  const [items, setItems] = React.useState<TestimonialItem[]>(MOCK_TESTIMONIALS)
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Handle Add New Post
  const handleAddPost = (newPost: TestimonialItem) => {
    setItems((prev) => [newPost, ...prev])
    showToast(
      newPost.isActive
        ? `Ulasan ${newPost.anonymousDisplay} berhasil disimpan dan berstatus Aktif.`
        : `Ulasan ${newPost.anonymousDisplay} berhasil disimpan (Tidak Aktif).`
    )
  }

  // Handle Update Existing Post
  const handleUpdatePost = (id: string, updated: Partial<TestimonialItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    )
    showToast("Perubahan ulasan berhasil disimpan.")
  }

  // Handle Toggle Active Status
  const handleToggleActive = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextActive = !item.isActive
        showToast(
          nextActive
            ? `Ulasan ${item.anonymousDisplay} kini berstatus Aktif di website.`
            : `Ulasan ${item.anonymousDisplay} dinonaktifkan dari website.`
        )
        return { ...item, isActive: nextActive }
      })
    )
  }

  // Handle Delete Post
  const handleDeletePost = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    showToast("Testimoni telah dihapus.")
  }

  const activeCount = items.filter((i) => i.isActive).length
  const inactiveCount = items.filter((i) => !i.isActive).length

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/30 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md"
        >
          <div className="flex items-center gap-2.5">
            <Check className="size-4 text-primary shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Main Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Testimoni Klien
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tulis ulasan klien dari evaluasi sesi dan kelola testimoni yang tampil di halaman website Solulu.
          </p>
        </div>

        {/* Telemetry Summary: Aktif, Tidak Aktif, Total */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-foreground tabular-nums">{activeCount}</span>
              <span>aktif</span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              <span className="font-semibold text-foreground tabular-nums">{inactiveCount}</span>
              <span>tidak aktif</span>
            </div>
            <span className="text-muted-foreground/50">•</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground tabular-nums">{items.length}</span>
              <span>total</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area: Opsi 1 (Komposer Langsung & Linimasa Ulasan) */}
      <main className="w-full">
        <TestimonialVariantA
          items={items}
          onAddPost={handleAddPost}
          onUpdatePost={handleUpdatePost}
          onToggleActive={handleToggleActive}
          onDeletePost={handleDeletePost}
        />
      </main>
    </div>
  )
}
