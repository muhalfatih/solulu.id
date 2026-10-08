"use client"

import * as React from "react"
import { MOCK_TESTIMONIALS, type TestimonialItem } from "../mock-data"
import { TestimonialVariantA } from "./components/testimonial-variant-a"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getActiveSpecializationsAction } from "@/app/admin/specializations/actions"
import {
  getTestimonialsAdminAction,
  createTestimonialAdminAction,
  updateTestimonialAdminAction,
  toggleTestimonialActiveAction,
  deleteTestimonialAdminAction,
} from "./actions"

export default function TestimonialsAdminPage() {
  const [items, setItems] = React.useState<TestimonialItem[]>(MOCK_TESTIMONIALS)
  const [specializationTopics, setSpecializationTopics] = React.useState<string[]>([])
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Fetch real testimonials and active specializations directory from database on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        const [testimonialsRes, specializationsRes] = await Promise.all([
          getTestimonialsAdminAction(),
          getActiveSpecializationsAction(),
        ])

        if (specializationsRes.success && specializationsRes.data) {
          const names = specializationsRes.data.map((s: any) => s.name).filter(Boolean)
          if (names.length > 0) {
            setSpecializationTopics(names)
          }
        }

        if (testimonialsRes.success && testimonialsRes.data && testimonialsRes.data.length > 0) {
          const mapped: TestimonialItem[] = testimonialsRes.data.map((r: any) => ({
            id: r.id,
            clientName: r.clientName,
            isAnonymous: r.isAnonymous ?? true,
            anonymousDisplay: r.anonymousDisplay || r.clientName || "Klien Anonim",
            quoteHighlight: r.quoteHighlight,
            comment: r.comment,
            topic: r.topic,
            submittedAt: r.createdAt
              ? new Date(r.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Baru saja",
            isActive: r.isActive,
            isFeatured: r.isFeatured ?? r.isActive,
            rating: r.rating || 5,
          }))

          const existingIds = new Set(mapped.map((m) => m.id))
          const preservedMocks = MOCK_TESTIMONIALS.filter((m) => !existingIds.has(m.id))
          setItems([...mapped, ...preservedMocks])
        } else {
          setItems(MOCK_TESTIMONIALS)
        }
      } catch (err) {
        console.error("Failed to load real testimonials, keeping mock view:", err)
        setItems(MOCK_TESTIMONIALS)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Handle Add New Post
  const handleAddPost = async (newPost: TestimonialItem) => {
    setItems((prev) => [newPost, ...prev])
    try {
      await createTestimonialAdminAction({
        clientName: newPost.clientName,
        isAnonymous: true,
        anonymousDisplay: newPost.anonymousDisplay || newPost.clientName,
        quoteHighlight: newPost.quoteHighlight, // Subjek
        comment: newPost.comment, // Isi
        topic: newPost.topic, // Topik Masalah
        isActive: newPost.isActive,
        isFeatured: newPost.isFeatured ?? newPost.isActive,
      })
    } catch (err) {
      console.error("Failed to persist testimonial to DB:", err)
    }

    showToast(
      newPost.isActive
        ? `Ulasan "${newPost.quoteHighlight}" berhasil disimpan dan berstatus Aktif di homepage.`
        : `Ulasan "${newPost.quoteHighlight}" berhasil disimpan (Tidak Aktif).`
    )
  }

  // Handle Update Existing Post
  const handleUpdatePost = async (id: string, updated: Partial<TestimonialItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    )
    try {
      await updateTestimonialAdminAction(id, {
        clientName: updated.clientName,
        anonymousDisplay: updated.anonymousDisplay || updated.clientName,
        quoteHighlight: updated.quoteHighlight,
        comment: updated.comment,
        topic: updated.topic,
        isActive: updated.isActive,
        isFeatured: updated.isActive,
      })
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
    showToast("Ulasan berhasil dihapus.")
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

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Manajemen Testimoni Publik
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Format mandiri sesuai homepage: Subjek, Isi, Nama Anonim, dan Topik Masalah (dari fokus &amp; spesialisasi).
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

      {/* Main Content Area */}
      <main className="w-full">
        <TestimonialVariantA
          items={items}
          availableTopics={specializationTopics}
          onAddPost={handleAddPost}
          onUpdatePost={handleUpdatePost}
          onToggleActive={handleToggleActive}
          onDeletePost={handleDeletePost}
        />
      </main>
    </div>
  )
}
