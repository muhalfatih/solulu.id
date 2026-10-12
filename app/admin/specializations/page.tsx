"use client"

import * as React from "react"
import {
  Tag,
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { AdminPageHeader, AdminMetricCard } from "@/components/admin"
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
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all")
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
    setErrorMessage(null)
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
    setErrorMessage(null)
    try {
      if (editingItem) {
        const res = await updateSpecializationAction({
          id: editingItem.id,
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          sortOrder: Number(formSortOrder) || 0,
          isActive: formIsActive,
        })
        if (!res.success) throw new Error(res.error)
        showToast(res.message || "Topik berhasil diperbarui")
      } else {
        const res = await createSpecializationAction({
          name: formName.trim(),
          description: formDesc.trim() || undefined,
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
    setErrorMessage(null)
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
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.isActive) ||
      (statusFilter === "inactive" && !item.isActive)

    return matchesSearch && matchesStatus
  })

  const activeCount = items.filter((i) => i.isActive).length

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-20 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md"
        >
          <div className="flex items-center gap-2">
            <Check className="size-4 text-primary shrink-0" aria-hidden="true" />
            <span className="leading-relaxed">{toastMessage}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
            className="size-6 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Database Fokus & Spesialisasi"
        description="Kelola daftar resmi topik konseling untuk profil mitra konselor dan filter katalog publik."
        icon={Tag}
        badge={isLoading ? undefined : `${items.length} Topik`}
        badgeVariant="outline"
        actions={
          <Button
            onClick={openCreateDialog}
            size="sm"
            className="gap-1.5 font-medium shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Tambah Topik Baru</span>
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

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminMetricCard
          title="Total Topik"
          value={items.length}
          isLoading={isLoading}
          trendLabel="Basis data terdaftar"
        />
        <AdminMetricCard
          title="Topik Aktif"
          value={activeCount}
          isLoading={isLoading}
          status="success"
          trendLabel="Tampil di formulir & filter"
        />
        <AdminMetricCard
          title="Topik Nonaktif"
          value={items.length - activeCount}
          isLoading={isLoading}
          status="neutral"
          trendLabel="Diarsipkan dari pilihan publik"
        />
      </div>

      {/* Table Card Container */}
      <Card className="overflow-hidden shadow-xs">
        {/* Table Toolbar Header */}
        <CardHeader className="p-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari topik atau kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-8 h-8 text-xs bg-background"
                aria-label="Cari topik spesialisasi"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Filter Segmented Control & Counter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`h-7 px-3 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-card text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semua ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`h-7 px-3 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "active"
                      ? "bg-card text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Aktif ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                  className={`h-7 px-3 flex items-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === "inactive"
                      ? "bg-card text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Nonaktif ({items.length - activeCount})
                </button>
              </div>

              <span className="text-[11px] text-muted-foreground hidden lg:inline font-mono">
                {filteredItems.length} dari {items.length} topik
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Semantic Responsive Table */}
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="w-16 text-center font-semibold text-foreground">Urutan</TableHead>
                <TableHead className="min-w-[200px] font-semibold text-foreground">Nama Topik Spesialisasi</TableHead>
                <TableHead className="min-w-[280px] font-semibold text-foreground">Deskripsi / Ruang Lingkup</TableHead>
                <TableHead className="w-32 text-center font-semibold text-foreground">Status Publik</TableHead>
                <TableHead className="w-24 text-right font-semibold text-foreground">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`spec-skel-${i}`} className="border-border/60">
                    <TableCell className="py-3.5 px-4 text-center">
                      <Skeleton className="h-4 w-6 mx-auto rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Skeleton className="h-4 w-40 rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <Skeleton className="h-3.5 w-64 rounded" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <Skeleton className="h-5 w-9 mx-auto rounded-full" />
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2.5 px-4">
                      <Tag className="size-8 text-muted-foreground/30 mb-1" />
                      <p className="font-semibold text-foreground text-sm">
                        {searchQuery || statusFilter !== "all"
                          ? "Tidak ada topik yang sesuai filter"
                          : "Belum ada topik spesialisasi"}
                      </p>
                      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                        {searchQuery
                          ? `Tidak ditemukan topik dengan kata kunci "${searchQuery}". Coba gunakan istilah pencarian lain.`
                          : statusFilter !== "all"
                          ? `Tidak ada topik dengan status ${statusFilter === "active" ? "Aktif" : "Nonaktif"}.`
                          : "Daftar spesialisasi digunakan oleh mitra konselor dan pasien saat pencarian topik konseling."}
                      </p>
                      {!searchQuery && statusFilter === "all" && (
                        <Button
                          onClick={openCreateDialog}
                          size="sm"
                          className="mt-2 gap-1.5 font-medium shadow-xs"
                        >
                          <Plus className="size-3.5" />
                          <span>Tambah Topik Pertama</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors border-border/60 group"
                  >
                    <TableCell className="py-3.5 px-4 text-center">
                      <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/60">
                        #{item.sortOrder}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-xs">
                          {item.name}
                        </span>
                        {!item.isActive && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground"
                          >
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-muted-foreground">
                      {item.description ? (
                        <p className="line-clamp-2 leading-relaxed text-xs">
                          {item.description}
                        </p>
                      ) : (
                        <span className="italic text-muted-foreground/60 text-xs">
                          Belum ada deskripsi ruang lingkup
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={(checked) => handleToggle(item, checked)}
                          aria-label={`Toggle status ${item.name}`}
                          size="sm"
                        />
                        <span className="text-[11px] font-medium text-muted-foreground min-w-[44px] text-left">
                          {item.isActive ? "Aktif" : "Off"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(item)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Ubah Topik"
                          aria-label={`Ubah topik ${item.name}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteId(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Hapus Topik"
                          aria-label={`Hapus topik ${item.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Tag className="size-4 text-primary" />
                <span>{editingItem ? "Edit Topik Spesialisasi" : "Tambah Topik Spesialisasi"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Topik ini akan muncul sebagai pilihan resmi pada formulir mitra konselor dan filter katalog publik.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3.5 text-xs py-1">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="formName" className="font-medium text-foreground">
                  Nama Topik / Fokus <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="formDesc" className="font-medium text-foreground">
                  Deskripsi / Contoh Kasus
                </Label>
                <Textarea
                  id="formDesc"
                  placeholder="Contoh: Penanganan kemarahan impulsif, ledakan emosi mendadak, dan teknik relaksasi mandiri..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="formSortOrder" className="font-medium text-foreground">
                    Nomor Urutan Tampilan
                  </Label>
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
                  <Label htmlFor="formActiveSwitch" className="font-medium text-foreground">
                    Status Publik
                  </Label>
                  <div className="flex items-center gap-2.5 h-9">
                    <Switch
                      checked={formIsActive}
                      onCheckedChange={setFormIsActive}
                      id="formActiveSwitch"
                    />
                    <label htmlFor="formActiveSwitch" className="text-xs text-muted-foreground cursor-pointer select-none">
                      {formIsActive ? "Aktif di Katalog" : "Nonaktif (Draft)"}
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-foreground flex items-center gap-2">
                <Info className="size-4 text-primary shrink-0" aria-hidden="true" />
                <span>
                  Topik aktif langsung disinkronkan ke bank spesialisasi pendaftaran mitra konselor.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !formName.trim()}
                className="gap-1.5"
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
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus topik ini? Konselor yang sudah memiliki topik ini tetap menyimpannya di profil riwayat mereka, namun topik ini tidak akan muncul lagi pada pilihan baru.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-1.5"
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
