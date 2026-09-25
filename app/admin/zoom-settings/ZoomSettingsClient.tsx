"use client"

import * as React from "react"
import {
  Video,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Zap,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  Clock,
  User,
  X,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  saveZoomAccountAction,
  updateZoomAccountAction,
  deleteZoomAccountAction,
} from "./actions"
import type { ZoomAccountView, ZoomAccountInput } from "./schema"

interface ZoomSettingsClientProps {
  initialAccounts: ZoomAccountView[]
}

export function ZoomSettingsClient({
  initialAccounts,
}: ZoomSettingsClientProps) {
  const [accounts, setAccounts] =
    React.useState<ZoomAccountView[]>(initialAccounts)
  const [showSecret, setShowSecret] = React.useState<{
    [key: string]: boolean
  }>({})
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  // Modals state
  const [inspectingAccount, setInspectingAccount] =
    React.useState<ZoomAccountView | null>(null)
  const [editingAccount, setEditingAccount] =
    React.useState<ZoomAccountView | null>(null)
  const [deletingAccount, setDeletingAccount] =
    React.useState<ZoomAccountView | null>(null)
  const [isAddingOpen, setIsAddingOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)

  // Add Form state
  const [addForm, setAddForm] = React.useState<ZoomAccountInput>({
    name: "",
    email: "",
    accountId: "",
    clientId: "",
    clientSecret: "",
  })

  // Edit Form state
  const [editForm, setEditForm] = React.useState({
    name: "",
    email: "",
    accountId: "",
    clientId: "",
    clientSecret: "",
    isActive: true,
  })

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText?.(text)
    setCopiedKey(label)
    showToast(`${label} disalin ke papan klip!`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const toggleSecret = (id: string) => {
    setShowSecret((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Open Edit Modal with prefilled data
  const handleOpenEdit = (acc: ZoomAccountView) => {
    if (acc.safetyLock.isLocked) {
      setInspectingAccount(acc)
      return
    }
    setEditingAccount(acc)
    setEditForm({
      name: acc.name,
      email: acc.email,
      accountId: acc.accountId,
      clientId: acc.clientId,
      clientSecret: "", // leave empty unless changed
      isActive: acc.isActive,
    })
  }

  // Submit Add Account
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const res = await saveZoomAccountAction(addForm)
      if (res.success) {
        showToast(
          "Akun Zoom Pro baru berhasil ditambahkan dengan enkripsi AES-256-GCM!"
        )
        setIsAddingOpen(false)
        setAddForm({
          name: "",
          email: "",
          accountId: "",
          clientId: "",
          clientSecret: "",
        })
        window.location.reload()
      } else {
        showToast(res.error || "Gagal menambahkan akun Zoom.", "error")
      }
    } catch {
      showToast("Terjadi kendala teknis saat menyimpan akun.", "error")
    } finally {
      setIsPending(false)
    }
  }

  // Submit Edit Account
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return
    setIsPending(true)
    try {
      const payload: Record<string, any> = {
        name: editForm.name,
        email: editForm.email,
        accountId: editForm.accountId,
        clientId: editForm.clientId,
        isActive: editForm.isActive,
      }
      if (editForm.clientSecret.trim()) {
        payload.clientSecret = editForm.clientSecret.trim()
      }

      const res = await updateZoomAccountAction(editingAccount.id, payload)
      if (res.success) {
        showToast(
          "Kredensial Akun Zoom berhasil diperbarui dan dienkripsi ulang!"
        )
        setEditingAccount(null)
        window.location.reload()
      } else {
        showToast(res.error || "Gagal memperbarui akun Zoom.", "error")
      }
    } catch {
      showToast("Terjadi kendala teknis saat memperbarui akun.", "error")
    } finally {
      setIsPending(false)
    }
  }

  // Submit Delete Account
  const handleDeleteSubmit = async () => {
    if (!deletingAccount) return
    setIsPending(true)
    try {
      const res = await deleteZoomAccountAction(deletingAccount.id)
      if (res.success) {
        showToast("Akun Zoom berhasil dihapus dari platform.")
        setDeletingAccount(null)
        window.location.reload()
      } else {
        showToast(res.error || "Gagal menghapus akun Zoom.", "error")
      }
    } catch {
      showToast("Terjadi kendala teknis saat menghapus akun.", "error")
    } finally {
      setIsPending(false)
    }
  }

  const isPoolFull = accounts.length >= 2
  const lockedCount = accounts.filter((a) => a.safetyLock.isLocked).length

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex max-w-md animate-in items-center justify-between gap-4 rounded-xl border p-4 text-xs shadow-xl fade-in ${
            toast.type === "error"
              ? "border-destructive/40 bg-destructive/15 font-medium text-destructive"
              : "border-primary/40 bg-card text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "error" ? (
              <AlertTriangle className="size-4 shrink-0 text-destructive" />
            ) : (
              <Check className="size-4 shrink-0 text-primary" />
            )}
            <span>{toast.message}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setToast(null)}
            className="size-6 text-muted-foreground hover:text-foreground"
            aria-label="Tutup notifikasi"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pengaturan Akun Zoom
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              ADR-0001 & ADR-0002
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Manajemen 2 akun Zoom Pro terenkripsi dengan proteksi Safety Lock
            otomatis untuk menjaga kelancaran sesi pasien.
          </p>
        </div>

        {/* Action Controls & Pool Metrics */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex h-8 items-center gap-2 rounded-xl border border-border bg-card px-3">
            <Server className="size-3.5 shrink-0 text-primary" />
            <span className="text-muted-foreground">Kapasitas Pool:</span>
            <span className="font-semibold text-foreground">
              {accounts.length} / 2 Ruang
            </span>
          </div>

          <Badge
            variant={lockedCount > 0 ? "destructive" : "secondary"}
            className="flex h-8 items-center gap-1.5 px-3 text-xs font-semibold"
          >
            <Lock className="size-3" />
            <span>
              {lockedCount > 0
                ? `Safety Lock: ${lockedCount} Terkunci`
                : "Safety Lock: Siaga (0 Terkunci)"}
            </span>
          </Badge>

          <Button
            size="sm"
            onClick={() => setIsAddingOpen(true)}
            disabled={isPoolFull}
            className="h-8 gap-1.5 text-xs font-medium"
            title={
              isPoolFull
                ? "Batas maksimal 2 akun Zoom Pro telah tercapai"
                : "Tambah Akun Zoom baru"
            }
          >
            <Plus className="size-3.5" />
            <span>Tambah Akun</span>
          </Button>
        </div>
      </div>

      {/* Architectural Safety Lock Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3.5 text-xs">
        <div className="flex min-w-0 items-center gap-2.5">
          <ShieldAlert className="size-4 shrink-0 text-amber-500" />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold whitespace-nowrap text-foreground">
              Prinsip Safety Lock:
            </span>
            <span className="text-muted-foreground">
              Akun Zoom dengan sesi aktif atau reservasi mendatang otomatis
              dikunci. Edit dan hapus diblokir demi mencegah pembatalan meeting
              pasien.
            </span>
          </div>
        </div>
      </div>

      {/* Visual Concurrency Timeline (ADR-0002) */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Peta Alokasi Konkurensi Sesi 90-Menit (ADR-0002)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              <span>Ruang #1 (Host Utama)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Ruang #2 (Penanganan Overlap)</span>
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="grid grid-cols-6 border-b border-border/60 pb-1 text-center font-mono text-[10px] text-muted-foreground">
            <div>18:00 WIB</div>
            <div>19:00 WIB</div>
            <div>20:00 WIB</div>
            <div>21:00 WIB</div>
            <div>22:00 WIB</div>
            <div>23:00 WIB</div>
          </div>

          {accounts.map((acc, idx) => (
            <div key={acc.id} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 truncate text-[11px] font-medium text-foreground">
                Slot #{idx + 1} ({acc.name}):
              </span>
              <div className="relative h-8 flex-1 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                {acc.safetyLock.lockedSessions.length > 0 ? (
                  acc.safetyLock.lockedSessions.slice(0, 2).map((ses, sIdx) => {
                    const leftPos = sIdx === 0 ? "20%" : "60%"
                    return (
                      <div
                        key={ses.bookingId}
                        style={{ left: leftPos }}
                        className="absolute top-1 bottom-1 flex w-[30%] items-center justify-between rounded-md border border-primary/40 bg-primary/20 px-2 text-[10px] font-semibold text-foreground"
                        title={`${ses.patientName} (${ses.startTime} - ${ses.endTime})`}
                      >
                        <span className="truncate">{ses.patientName}</span>
                        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
                      </div>
                    )
                  })
                ) : (
                  <div className="flex h-full items-center px-3 text-[10px] text-muted-foreground italic">
                    Ruang siaga — siap menerima alokasi sesi baru
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom Accounts Grid */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        {accounts.map((acc, index) => {
          const isLocked = acc.safetyLock.isLocked
          const boundCount = acc.safetyLock.upcomingSessionCount

          return (
            <div
              key={acc.id}
              className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xs transition-colors"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-foreground">
                      {acc.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 font-mono text-[10px]"
                    >
                      Slot #{index + 1}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {acc.email}
                  </span>
                </div>

                <Badge
                  variant={acc.isActive ? "default" : "secondary"}
                  className="flex shrink-0 items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
                >
                  <span
                    className={`size-2 rounded-full ${
                      acc.isActive
                        ? "animate-pulse bg-emerald-400"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <span>{acc.isActive ? "Aktif" : "Nonaktif"}</span>
                </Badge>
              </div>

              {/* Safety Lock Status Alert */}
              <div
                className={`flex min-h-[88px] flex-col justify-between gap-2 rounded-xl border p-3.5 text-xs ${
                  isLocked
                    ? "border-destructive/20 bg-destructive/10 text-destructive"
                    : "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    {isLocked ? (
                      <Lock className="size-4" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )}
                    <span>
                      {isLocked
                        ? "Safety Lock: Aktif (Terkunci)"
                        : "Safety Lock: Nonaktif (Dapat Diedit / Dihapus)"}
                    </span>
                  </span>

                  {isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInspectingAccount(acc)}
                      className="h-6 px-2 text-[11px] font-medium text-destructive hover:bg-destructive/15 hover:text-destructive"
                      title="Lihat daftar sesi yang mengunci kredensial akun ini"
                    >
                      {boundCount} Sesi Terikat →
                    </Button>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed text-foreground/80">
                  {isLocked
                    ? acc.safetyLock.reason
                    : "Tidak ada sesi aktif atau reservasi mendatang yang terikat pada akun ini. Anda dapat memperbarui kredensial atau menghapus akun secara aman."}
                </p>
              </div>

              {/* S2S OAuth Credentials Box */}
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Kredensial Server-to-Server OAuth (AES-256-GCM)
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Supabase Encrypted
                  </span>
                </div>

                <div className="divide-y divide-border/60 rounded-xl border border-border bg-background/50 font-mono text-[11px]">
                  {/* Account ID */}
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <span className="min-w-[90px] font-sans text-xs text-muted-foreground">
                      Account ID
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {acc.accountId}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(acc.accountId, "Account ID")}
                        title="Salin Account ID"
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Client ID */}
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <span className="min-w-[90px] font-sans text-xs text-muted-foreground">
                      Client ID
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {acc.clientId}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(acc.clientId, "Client ID")}
                        title="Salin Client ID"
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Client Secret */}
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                    <span className="min-w-[90px] font-sans text-xs text-muted-foreground">
                      Client Secret
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {showSecret[acc.id]
                          ? acc.decryptedSecret
                          : acc.maskedClientSecret}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSecret(acc.id)}
                        title={
                          showSecret[acc.id]
                            ? "Sembunyikan Secret"
                            : "Tampilkan Secret"
                        }
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        {showSecret[acc.id] ? (
                          <EyeOff className="size-3" />
                        ) : (
                          <Eye className="size-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCopy(acc.decryptedSecret, "Client Secret")
                        }
                        title="Salin Client Secret"
                        className="size-6 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Zap className="size-3.5 text-primary" />
                  <span>
                    Dibuat:{" "}
                    {new Date(acc.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(acc)}
                    className="h-8 text-xs font-normal"
                    title={
                      isLocked
                        ? "Akun terkunci karena sesi mendatang"
                        : "Ubah data akun"
                    }
                  >
                    {isLocked ? (
                      <>
                        <Lock className="mr-1.5 size-3 text-destructive" />
                        <span>Kredensial Terkunci</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="mr-1.5 size-3" />
                        <span>Ubah</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLocked}
                    onClick={() => setDeletingAccount(acc)}
                    className="h-8 text-xs font-normal text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title={
                      isLocked
                        ? "Tidak dapat dihapus saat Safety Lock aktif"
                        : "Hapus akun"
                    }
                  >
                    <Trash2 className="mr-1.5 size-3" />
                    <span>Hapus</span>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty Slot Card if < 2 accounts */}
        {accounts.length < 2 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Plus className="size-6" />
            </div>
            <div className="flex max-w-sm flex-col gap-1">
              <span className="text-base font-bold text-foreground">
                Slot Ruang #{accounts.length + 1} Tersedia
              </span>
              <p className="text-xs text-muted-foreground">
                Daftarkan akun Zoom Pro kedua untuk mengaktifkan konkurensi 2
                sesi telekonseling simultan (ADR-0002).
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddingOpen(true)}
              className="gap-1.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              <span>Daftarkan Akun Zoom #{accounts.length + 1}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Modal 1: Inspeksi Sesi Terikat (Audit Safety Lock) */}
      {inspectingAccount && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-xs fade-in">
          <div className="flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-5 text-destructive" />
                  <h3 className="text-base font-bold text-foreground">
                    Audit Safety Lock: {inspectingAccount.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Daftar reservasi sesi aktif dan mendatang yang mengunci
                  kredensial akun ini.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInspectingAccount(null)}
                aria-label="Tutup dialog"
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-1.5 rounded-xl border border-destructive/25 bg-destructive/10 p-3.5 text-xs text-destructive">
              <div className="flex items-center gap-2 font-semibold">
                <Lock className="size-4 shrink-0" />
                <span>Kredensial Terkunci Demi Kelancaran Pasien</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground/90">
                Perubahan Client ID atau Client Secret saat sesi telah terjadwal
                akan membatalkan tautan rapat Zoom pasien. Kredensial hanya
                dapat diperbarui setelah seluruh sesi di bawah ini selesai.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground">
                Sesi Terikat (
                {inspectingAccount.safetyLock.lockedSessions.length} Sesi):
              </span>
              <div className="max-h-56 divide-y divide-border/60 overflow-y-auto rounded-xl border border-border bg-muted/20">
                {inspectingAccount.safetyLock.lockedSessions.length > 0 ? (
                  inspectingAccount.safetyLock.lockedSessions.map((ses) => (
                    <div
                      key={ses.bookingId}
                      className="flex items-center justify-between gap-3 p-3 text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-foreground">
                            {ses.bookingId.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge
                            variant={
                              ses.status === "confirmed"
                                ? "outline"
                                : "secondary"
                            }
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {ses.status === "confirmed"
                              ? "Terkonfirmasi"
                              : "Reservasi"}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">
                          {ses.patientName} → {ses.counselorName}
                        </span>
                      </div>
                      <div className="shrink-0 text-right text-[11px] font-medium text-foreground tabular-nums">
                        {ses.date} ({ses.startTime} - {ses.endTime})
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-xs text-muted-foreground italic">
                    Tidak ada sesi terikat.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-border pt-2 text-xs">
              <Button
                size="sm"
                onClick={() => setInspectingAccount(null)}
                className="h-8 text-xs font-medium"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Tambah Akun Zoom */}
      {isAddingOpen && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-xs fade-in">
          <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Plus className="size-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Daftarkan Akun Zoom Pro
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Masukkan kredensial Server-to-Server OAuth dari Zoom App
                  Marketplace.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddingOpen(false)}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form
              onSubmit={handleAddSubmit}
              className="flex flex-col gap-3.5 text-xs"
            >
              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">
                  Nama Akun / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Akun Zoom Pro 1"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">
                  Email Terdaftar di Zoom
                </label>
                <input
                  type="email"
                  placeholder="e.g. admin.zoom1@solulu.id"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">
                  Account ID
                </label>
                <input
                  type="text"
                  placeholder="zm_acc_..."
                  value={addForm.accountId}
                  onChange={(e) =>
                    setAddForm({ ...addForm, accountId: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Client ID</label>
                <input
                  type="text"
                  placeholder="zm_cli_..."
                  value={addForm.clientId}
                  onChange={(e) =>
                    setAddForm({ ...addForm, clientId: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">
                  Client Secret
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={addForm.clientSecret}
                  onChange={(e) =>
                    setAddForm({ ...addForm, clientSecret: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  Client secret otomatis dienkripsi dengan standar AES-256-GCM
                  sebelum disimpan.
                </span>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingOpen(false)}
                  className="h-8 text-xs font-normal"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="h-8 text-xs font-medium"
                >
                  {isPending ? "Menyimpan..." : "Simpan Akun"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Akun Zoom */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-xs fade-in">
          <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Key className="size-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">
                    Ubah Kredensial: {editingAccount.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Perbarui kredensial untuk {editingAccount.name}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingAccount(null)}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-4 shrink-0" />
              <span className="text-xs leading-relaxed text-foreground">
                Safety Lock nonaktif. Tidak ada sesi aktif atau reservasi
                mendatang pada akun ini.
              </span>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="flex flex-col gap-3.5 text-xs"
            >
              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Nama Akun</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">
                  Zoom Account ID
                </label>
                <input
                  type="text"
                  value={editForm.accountId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, accountId: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">
                  Zoom Client ID
                </label>
                <input
                  type="text"
                  value={editForm.clientId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clientId: e.target.value })
                  }
                  required
                  className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-medium text-foreground">
                  Zoom Client Secret (Kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={editForm.clientSecret}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clientSecret: e.target.value })
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAccount(null)}
                  className="h-8 text-xs font-normal"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="h-8 text-xs font-medium"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Konfirmasi Hapus Akun */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-xs fade-in">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="size-6 shrink-0" />
              <h3 className="text-base font-bold text-foreground">
                Hapus Akun Zoom?
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Anda yakin ingin menghapus <strong>{deletingAccount.name}</strong>{" "}
              ({deletingAccount.email})? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingAccount(null)}
                className="h-8 text-xs font-normal"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={handleDeleteSubmit}
                className="h-8 text-xs font-medium"
              >
                {isPending ? "Menghapus..." : "Ya, Hapus Akun"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
