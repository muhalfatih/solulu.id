"use client"

import * as React from "react"
import type { TestimonialItem } from "@/lib/types/admin"
import { TestimonialVariantA } from "./components/testimonial-variant-a"
import { Check, X, MessageSquareQuote, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AdminPageHeader, AdminMetricCard } from "@/components/admin"
import { getActiveSpecializationsAction } from "@/app/admin/specializations/actions"
import {
  getTestimonialsAdminAction,
  createTestimonialAdminAction,
  updateTestimonialAdminAction,
  toggleTestimonialActiveAction,
  deleteTestimonialAdminAction,
} from "./actions"

export default function TestimonialsAdminPage() {
  const [items, setItems] = React.useState<TestimonialItem[]>([])
  const [specializationTopics, setSpecializationTopics] = React.useState<string[]>([])
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Fetch real testimonials and active specializations directory from database on mount
  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
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

        setItems(mapped)
      } else {
        setItems([])
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memuat ulasan testimoni dari database.")
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Handle Add New Post
  const handleAddPost = async (newPost: TestimonialItem) => {
    setErrorMessage(null)
    try {
      const res = await createTestimonialAdminAction({
        clientName: newPost.clientName,
        isAnonymous: true,
        anonymousDisplay: newPost.anonymousDisplay || newPost.clientName,
        quoteHighlight: newPost.quoteHighlight,
        comment: newPost.comment,
        topic: newPost.topic,
        isActive: newPost.isActive,
        isFeatured: newPost.isFeatured ?? newPost.isActive,
      })

      if (res.success && res.data) {
        const created: TestimonialItem = {
          ...newPost,
          id: res.data.id || newPost.id,
        }
        setItems((prev) => [created, ...prev])
        showToast(
          newPost.isActive
            ? `Ulasan "${newPost.quoteHighlight}" berhasil disimpan dan aktif di homepage.`
            : `Ulasan "${newPost.quoteHighlight}" berhasil disimpan (tidak aktif).`
        )
      } else {
        throw new Error(res.error || "Gagal menyimpan ulasan ke database.")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan ulasan ke database.")
    }
  }

  // Handle Update Existing Post
  const handleUpdatePost = async (id: string, updated: Partial<TestimonialItem>) => {
    setErrorMessage(null)
    const prevItems = [...items]
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    )

    try {
      const res = await updateTestimonialAdminAction(id, {
        clientName: updated.clientName,
        anonymousDisplay: updated.anonymousDisplay || updated.clientName,
        quoteHighlight: updated.quoteHighlight,
        comment: updated.comment,
        topic: updated.topic,
        isActive: updated.isActive,
        isFeatured: updated.isActive,
      })
      if (!res.success) throw new Error(res.error)
      showToast("Perubahan ulasan berhasil disimpan.")
    } catch (err: any) {
      setItems(prevItems)
      setErrorMessage(err.message || "Gagal memperbarui ulasan.")
    }
  }

  // Handle Toggle Active Status
  const handleToggleActive = async (id: string) => {
    setErrorMessage(null)
    const target = items.find((i) => i.id === id)
    const nextActive = target ? !target.isActive : true

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return { ...item, isActive: nextActive }
      })
    )

    try {
      const res = await toggleTestimonialActiveAction(id, nextActive)
      if (!res.success) throw new Error(res.error)
      showToast(
        nextActive
          ? `Ulasan kini aktif dan tampil di website.`
          : `Ulasan dinonaktifkan dari website.`
      )
    } catch (err: any) {
      // Revert on error
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item
          return { ...item, isActive: !nextActive }
        })
      )
      setErrorMessage(err.message || "Gagal mengubah status publikasi ulasan.")
    }
  }

  // Handle Delete Post
  const handleDeletePost = async (id: string) => {
    setErrorMessage(null)
    const prevItems = [...items]
    setItems((prev) => prev.filter((item) => item.id !== id))

    try {
      const res = await deleteTestimonialAdminAction(id)
      if (!res.success) throw new Error(res.error)
      showToast("Ulasan berhasil dihapus dari database.")
    } catch (err: any) {
      setItems(prevItems)
      setErrorMessage(err.message || "Gagal menghapus ulasan dari database.")
    }
  }

  const activeCount = items.filter((i) => i.isActive).length
  const uniqueTopicsCount = new Set(items.map((i) => i.topic).filter(Boolean)).size

  const scrollToComposer = () => {
    const el = document.getElementById("composer-form")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
      const input = el.querySelector("input")
      if (input) input.focus()
    }
  }

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

      {/* Header */}
      <AdminPageHeader
        title="Testimoni & Ulasan Publik"
        description="Kelola ulasan anonim klien yang ditampilkan pada homepage publik Solulu."
        icon={MessageSquareQuote}
        badge={isLoading ? undefined : `${items.length} Ulasan`}
        badgeVariant="outline"
        actions={
          <Button
            size="sm"
            onClick={scrollToComposer}
            className="gap-1.5 font-medium shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Tulis Testimoni Baru</span>
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
          title="Total Ulasan"
          value={items.length}
          isLoading={isLoading}
          trendLabel="Database ulasan terdaftar"
        />
        <AdminMetricCard
          title="Ulasan Tayang"
          value={activeCount}
          isLoading={isLoading}
          status="success"
          trendLabel="Tampil di homepage publik"
        />
        <AdminMetricCard
          title="Distribusi Topik"
          value={`${uniqueTopicsCount} Topik`}
          isLoading={isLoading}
          status="neutral"
          trendLabel="Terkoneksi fokus spesialisasi"
        />
      </div>

      {/* Main Content Area */}
      <main className="w-full">
        <TestimonialVariantA
          items={items}
          availableTopics={specializationTopics}
          isLoading={isLoading}
          onAddPost={handleAddPost}
          onUpdatePost={handleUpdatePost}
          onToggleActive={handleToggleActive}
          onDeletePost={handleDeletePost}
        />
      </main>
    </div>
  )
}
