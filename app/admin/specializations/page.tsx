"use client"

import * as React from "react"
import Link from "next/link"
import {
  Sparkles,
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Tag,
  AlertCircle,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getSpecializationsAdminAction,
  createSpecializationAction,
  updateSpecializationAction,
  toggleSpecializationAction,
  deleteSpecializationAction,
  type SpecializationItem,
} from "./actions"

export default function SpecializationsAdminPage() {
  const [items, setItems] = React.useState<SpecializationItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Dialog state for Create/Edit
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<SpecializationItem | null>(null)
  const [formName, setFormName] = React.useState("")
  const [formDesc, setFormDesc] = React.useState("")
  const [formSortOrder, setFormSortOrder] = React.useState<number>(0)
  const [formIsActive, setFormIsActive] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getSpecializationsAdminAction()
      if (res.success && res.data) {
        setItems(res.data)
      } else {
        setErrorMessage(res.error || "Gagal memuat topik spesialisasi.")
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memuat data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const openCreateDialog = () => {
    setEditingItem(null)
    setFormName("")
    setFormDesc("")
    setFormSortOrder(items.length + 1)
    setFormIsActive(true)
    setDialogOpen(true)
  }

  const openEditDialog = (item: SpecializationItem) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormDesc(item.description || "")
    setFormSortOrder(item.sortOrder)
    setFormIsActive(item.isActive)
    setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    setIsSubmitting(true)
    try {
      if (editingItem) {
        const res = await updateSpecializationAction({
          id: editingItem.id,
          name: formName,
          description: formDesc,
          sortOrder: Number(formSortOrder) || 0,
          isActive: formIsActive,
        })
        if (!res.success) throw new Error(res.error)
        showToast(res.message || "Topik berhasil diperbarui")
      } else {
        const res = await createSpecializationAction({
          name: formName,
          description: formDesc,
          sortOrder: Number(formSortOrder) || 0,
          isActive: formIsActive,
        })
        if (!res.success) throw new Error(res.error)
        showToast(res.message || "Topik baru berhasil ditambahkan")
      }
      setDialogOpen(false)
      loadData()
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menyimpan topik.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (item: SpecializationItem, checked: boolean) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isActive: checked } : i))
    )
    try {
      const res = await toggleSpecializationAction(item.id, checked)
      if (!res.success) {
        throw new Error(res.error)
      }
      showToast(
        checked
          ? `Topik "${item.name}" diaktifkan.`
          : `Topik "${item.name}" dinonaktifkan.`
      )
    } catch {
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !checked } : i))
      )
      setErrorMessage("Gagal mengubah status topik.")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await deleteSpecializationAction(deleteId)
      if (!res.success) throw new Error(res.error)
      showToast("Topik berhasil dihapus.")
      setDeleteId(null)
      loadData()
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menghapus topik.")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    )
  })

  const activeCount = items.filter((i) => i.isActive).length

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="size-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Tag className="size-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Database Fokus & Spesialisasi
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Kelola daftar resmi topik konseling untuk profil mitra konselor dan filter katalog publik.
          </p>
        </div>

        <Button
          onClick={openCreateDialog}
          size="sm"
          className="text-xs h-9 px-3.5 font-medium gap-1.5 shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>Tambah Topik Baru</span>
        </Button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Topik
          </span>
          <div className="text-2xl font-bold text-foreground tabular-nums">
            {isLoading ? <Skeleton className="h-7 w-12 my-0.5 rounded" /> : items.length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Topik Aktif (Muncul di Form & Filter)
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {isLoading ? <Skeleton className="h-7 w-12 my-0.5 rounded" /> : activeCount}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Topik Nonaktif
          </span>
          <div className="text-2xl font-bold text-muted-foreground tabular-nums">
            {isLoading ? <Skeleton className="h-7 w-12 my-0.5 rounded" /> : items.length - activeCount}
          </div>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari topik atau kata kunci..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 h-9 text-xs"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          Menampilkan {filteredItems.length} dari {items.length} topik
        </span>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-medium">
                <th className="py-3 px-4 w-14 text-center">Urutan</th>
                <th className="py-3 px-4">Nama Topik Spesialisasi</th>
                <th className="py-3 px-4">Deskripsi / Ruang Lingkup</th>
                <th className="py-3 px-4 w-28 text-center">Status Aktif</th>
                <th className="py-3 px-4 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`spec-skel-${i}`}>
                    <td className="py-3 px-4 text-center">
                      <Skeleton className="h-4 w-6 mx-auto rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-36 rounded" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-3.5 w-64 rounded" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Skeleton className="h-5 w-9 mx-auto rounded-full" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton className="h-7 w-7 rounded-md" />
                        <Skeleton className="h-7 w-7 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 px-4">
                      <Tag className="size-8 text-muted-foreground/40 mb-1" />
                      <p className="font-medium text-foreground">Belum ada topik spesialisasi</p>
                      <p className="max-w-sm">
                        {searchQuery
                          ? `Tidak ada topik yang cocok dengan pencarian "${searchQuery}".`
                          : "Klik tombol 'Tambah Topik Baru' untuk menambahkan topik konseling pertama."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center text-muted-foreground font-mono text-[11px]">
                      {item.sortOrder}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-xs">
                          {item.name}
                        </span>
                        {!item.isActive && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal"
                          >
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-md truncate">
                      {item.description || (
                        <span className="italic text-muted-foreground/60">
                          Tidak ada deskripsi tambahan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={(checked) => handleToggle(item, checked)}
                          aria-label={`Toggle ${item.name}`}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Edit Topik"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(item.id)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Hapus Topik"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingItem ? "Edit Topik Spesialisasi" : "Tambah Topik Spesialisasi"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Topik ini akan muncul sebagai pilihan resmi pada form pendaftaran konselor dan filter pencarian.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="formName" className="text-xs font-medium text-foreground">
                  Nama Topik / Fokus <span className="text-destructive">*</span>
                </label>
                <Input
                  id="formName"
                  placeholder="Contoh: Regulasi Emosi & Anger Management"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="formDesc" className="text-xs font-medium text-foreground">
                  Deskripsi / Contoh Kasus
                </label>
                <Textarea
                  id="formDesc"
                  placeholder="Contoh: Penanganan kemarahan berlebih, ledakan emosi impulsif, dan teknik relaksasi..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="formSortOrder" className="text-xs font-medium text-foreground">
                    Nomor Urutan Tampilan
                  </label>
                  <Input
                    id="formSortOrder"
                    type="number"
                    min={0}
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground">Status Aktif</span>
                  <div className="flex items-center gap-2 h-9">
                    <Switch
                      checked={formIsActive}
                      onCheckedChange={setFormIsActive}
                      id="formActiveSwitch"
                    />
                    <label htmlFor="formActiveSwitch" className="text-xs text-muted-foreground cursor-pointer">
                      {formIsActive ? "Aktif" : "Nonaktif"}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="text-xs h-9"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !formName.trim()}
                className="text-xs h-9 gap-1.5"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                <span>{editingItem ? "Simpan Perubahan" : "Tambahkan Topik"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" />
              <span>Hapus Topik Spesialisasi</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus topik ini? Konselor yang sudah memiliki topik ini tetap menyimpannya di profil riwayat mereka, namun topik ini tidak akan muncul lagi di pilihan baru.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs h-9 gap-1.5"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Hapus Sekarang</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
