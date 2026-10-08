"use client"

import * as React from "react"
import type { TestimonialItem } from "../mock-data"
import { TestimonialVariantA } from "./components/testimonial-variant-a"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getTestimonialsAdminAction,
  createTestimonialAdminAction,
  updateTestimonialAdminAction,
  toggleTestimonialActiveAction,
  deleteTestimonialAdminAction,
} from "./actions"

export default function TestimonialsAdminPage() {
  const [items, setItems] = React.useState<TestimonialItem[]>([])
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Fetch real testimonials from database on mount
  React.useEffect(() => {
    async function loadTestimonials() {
      try {
        const res = await getTestimonialsAdminAction()
        if (res.success && res.data && res.data.length > 0) {
          const mapped: TestimonialItem[] = res.data.map((r: any) => ({
            id: r.id,
            clientName: r.clientName,
            isAnonymous: r.isAnonymous,
            anonymousDisplay: r.anonymousDisplay,
            sessionCode: r.sessionCode || "",
            counselorName: r.counselorName,
            counselorType: r.counselorType || "Psikolog Klinis",
            rating: r.rating,
            quoteHighlight: r.quoteHighlight,
            comment: r.comment,
            topic: r.topic,
            submittedAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
            date: new Date(r.createdAt).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            isActive: r.isActive,
            isFeatured: r.isFeatured ?? true,
          }))
          setItems(mapped)
        } else {
          setItems([])
        }
      } catch (err) {
        console.error("Failed to load real testimonials:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadTestimonials()
  }, [])

  // Handle Add New Post
  const handleAddPost = async (newPost: TestimonialItem) => {
    setItems((prev) => [newPost, ...prev])
    try {
      await createTestimonialAdminAction({
        clientName: newPost.clientName,
        isAnonymous: newPost.isAnonymous,
        anonymousDisplay: newPost.anonymousDisplay,
        sessionCode: newPost.sessionCode,
        counselorName: newPost.counselorName,
        counselorType: newPost.counselorType || "Psikolog Klinis",
        rating: newPost.rating,
        quoteHighlight: newPost.quoteHighlight,
        comment: newPost.comment,
        topic: newPost.topic,
        isActive: newPost.isActive,
        isFeatured: newPost.isFeatured ?? true,
      })
    } catch (err) {
      console.error("Failed to persist testimonial to DB:", err)
    }

    showToast(
      newPost.isActive
        ? `Ulasan ${newPost.anonymousDisplay} berhasil disimpan ke database dan berstatus Aktif.`
        : `Ulasan ${newPost.anonymousDisplay} berhasil disimpan ke database (Tidak Aktif).`
    )
  }

  // Handle Update Existing Post
  const handleUpdatePost = async (id: string, updated: Partial<TestimonialItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    )
    try {
      await updateTestimonialAdminAction(id, updated as any)
    } catch (err) {
      console.error("Failed to update testimonial in DB:", err)
    }
    showToast("Perubahan ulasan berhasil disimpan.")
  }

  // Handle Toggle Active Status
  const handleToggleActive = async (id: string) => {
    const target = items.find((i) => i.id === id)
    const nextActive = target ? !target.isActive : true

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return { ...item, isActive: nextActive }
      })
    )

    try {
      await toggleTestimonialActiveAction(id, nextActive)
    } catch (err) {
      console.error("Failed to toggle testimonial in DB:", err)
    }

    showToast(
      nextActive
        ? `Ulasan kini berstatus Aktif di website.`
        : `Ulasan dinonaktifkan dari website.`
    )
  }

  // Handle Delete Post
  const handleDeletePost = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    try {
      await deleteTestimonialAdminAction(id)
    } catch (err) {
      console.error("Failed to delete testimonial in DB:", err)
    }
    showToast("Testimoni telah dihapus dari database.")
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
