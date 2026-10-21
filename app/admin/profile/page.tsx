"use client"

import * as React from "react"
import {
  User,
  Lock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Bell,
  Clock,
  Save,
  KeyRound,
  X,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AdminPageHeader } from "@/components/admin"
import {
  getAdminProfileDataAction,
  updateAdminContactAction,
  updateAdminPasswordAction,
  type AdminProfileView,
} from "./actions"

export default function AdminProfilePage() {
  const [profile, setProfile] = React.useState<AdminProfileView | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSavingContact, setIsSavingContact] = React.useState(false)
  const [isSavingPassword, setIsSavingPassword] = React.useState(false)

  // Contact state
  const [phone, setPhone] = React.useState("0812-3456-7890")
  const [email, setEmail] = React.useState("admin@solulu.id")
  const [notifyUrgent, setNotifyUrgent] = React.useState(true)
  const [notifyCounselor, setNotifyCounselor] = React.useState(true)
  const [notifySession, setNotifySession] = React.useState(true)

  // Password state
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showCurrentPass, setShowCurrentPass] = React.useState(false)
  const [showNewPass, setShowNewPass] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)

  // Toast
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  React.useEffect(() => {
    async function loadProfile() {
      setIsLoading(true)
      try {
        const res = await getAdminProfileDataAction()
        if (res.success && res.data) {
          setProfile(res.data)
          setEmail(res.data.email)
          setPhone(res.data.phone)
          setNotifyUrgent(res.data.notifyUrgent)
          setNotifyCounselor(res.data.notifyCounselor)
          setNotifySession(res.data.notifySession)
        }
      } catch {
        // Fallback default
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingContact(true)
    try {
      const res = await updateAdminContactAction({
        phone,
        notifyUrgent,
        notifyCounselor,
        notifySession,
      })
      if (res.success) {
        showToast(res.message || "Data kontak dan preferensi notifikasi berhasil disimpan.")
      } else {
        showToast(res.error || "Gagal menyimpan perubahan kontak.")
      }
    } catch (err: any) {
      showToast(err.message || "Gagal menyimpan perubahan kontak.")
    } finally {
      setIsSavingContact(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError("Kata sandi baru minimal terdiri dari 8 karakter.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak sesuai.")
      return
    }

    setIsSavingPassword(true)
    try {
      const res = await updateAdminPasswordAction(newPassword)
      if (res.success) {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        showToast(res.message || "Kata sandi akun Anda berhasil diperbarui.")
      } else {
        setPasswordError(res.error || "Gagal memperbarui kata sandi.")
      }
    } catch (err: any) {
      setPasswordError(err.message || "Gagal memperbarui kata sandi.")
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6 pb-16 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
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
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Page Header */}
      <AdminPageHeader
        title="Profil Saya"
        description="Kelola data kontak operasional, preferensi pemberitahuan, dan kata sandi login Anda."
        icon={User}
        badge="Akun Terverifikasi"
        badgeVariant="outline"
      />

      {/* Locked Official Identity Card */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
            {profile?.role === "superadmin" ? "SA" : "AP"}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                {profile?.role === "superadmin" ? "Super Administrator" : "Admin Pelayanan"}
              </span>
              <Badge variant="secondary" className="text-xs py-0 px-2 font-medium">
                {profile?.role === "superadmin" ? "Master Access" : "Staf Operasional"}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {profile?.email || email}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Bergabung sejak 1 Agustus 2026 • Status Aktif
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground shrink-0 self-start sm:self-auto">
          <Lock className="size-3.5 text-muted-foreground" />
          <div className="flex flex-col text-[11px]">
            <span className="font-semibold text-foreground">Nama & Foto Terkunci</span>
            <span>Dikelola oleh Administrator Utama</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation: 1. Kontak & Informasi Akun | 2. Keamanan */}
      <Tabs defaultValue="contact" className="w-full flex flex-col gap-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/40 border border-border">
          <TabsTrigger value="contact" className="text-xs font-medium cursor-pointer">
            Kontak & Informasi Akun
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs font-medium cursor-pointer">
            Keamanan & Kata Sandi
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: KONTAK & INFORMASI AKUN */}
        <TabsContent value="contact" className="mt-0">
          <form onSubmit={handleSaveContact} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Phone className="size-4 text-primary shrink-0" />
              <h2 className="text-sm font-bold text-foreground">
                Kontak Operasional Staf
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* WhatsApp Number */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="adminPhone" className="font-medium text-foreground">
                  Nomor WhatsApp Operasional
                </Label>
                <Input
                  id="adminPhone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="text-xs h-9"
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Digunakan untuk koordinasi darurat dengan konselor.
                </span>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="adminEmail" className="font-medium text-foreground">
                  Alamat Email Masuk
                </Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@solulu.id"
                  className="text-xs h-9"
                  required
                />
                <span className="text-[11px] text-muted-foreground">
                  Email aktif untuk menerima notifikasi sistem.
                </span>
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="font-medium text-foreground">
                  Zona Waktu Operasional
                </Label>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs flex items-center justify-between text-muted-foreground">
                  <span>Waktu Indonesia Barat (WIB / UTC+7)</span>
                  <Badge variant="outline" className="text-[10px]">Standar Platform</Badge>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-foreground">
                  Preferensi Pemberitahuan di Layar
                </h3>
              </div>

              <div className="flex flex-col divide-y divide-border/60 text-xs">
                {/* Switch 1 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">
                      Pemberitahuan Pasien Kondisi Mendesak
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Munculkan peringatan langsung ketika pasien mencatat indikasi tekanan emosional tinggi.
                    </span>
                  </div>
                  <Switch
                    checked={notifyUrgent}
                    onCheckedChange={setNotifyUrgent}
                    size="sm"
                    aria-label="Pemberitahuan Pasien Kondisi Mendesak"
                  />
                </div>

                {/* Switch 2 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">
                      Notifikasi Pendaftar Konselor Baru
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Beri tanda saat ada mitra psikolog yang baru saja mengajukan berkas.
                    </span>
                  </div>
                  <Switch
                    checked={notifyCounselor}
                    onCheckedChange={setNotifyCounselor}
                    size="sm"
                    aria-label="Notifikasi Pendaftar Konselor Baru"
                  />
                </div>

                {/* Switch 3 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">
                      Pengingat Sesi Konseling
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Tampilkan notifikasi 15 menit sebelum sesi temu tatap muka dimulai.
                    </span>
                  </div>
                  <Switch
                    checked={notifySession}
                    onCheckedChange={setNotifySession}
                    size="sm"
                    aria-label="Pengingat Sesi Konseling"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" disabled={isSavingContact} className="font-medium px-4 shadow-xs">
                {isSavingContact ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="size-3.5 mr-1.5" />
                )}
                <span>{isSavingContact ? "Menyimpan..." : "Simpan Perubahan Kontak"}</span>
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* TAB 2: KEAMANAN & KATA SANDI */}
        <TabsContent value="security" className="mt-0">
          <form onSubmit={handleUpdatePassword} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <KeyRound className="size-4 text-primary shrink-0" />
              <h2 className="text-sm font-bold text-foreground">
                Perbarui Kata Sandi Akun
              </h2>
            </div>

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4 max-w-md text-xs">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currentPassword" className="font-medium text-foreground">
                  Kata Sandi Saat Ini
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi lama"
                    className="text-xs h-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showCurrentPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showCurrentPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword" className="font-medium text-foreground">
                  Kata Sandi Baru
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="text-xs h-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showNewPass ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showNewPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Gunakan kombinasi huruf dan angka untuk keamanan data pasien.
                </span>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword" className="font-medium text-foreground">
                  Ulangi Kata Sandi Baru
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border/60">
              <Button type="submit" size="sm" disabled={isSavingPassword} className="font-medium px-4 shadow-xs">
                {isSavingPassword ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <KeyRound className="size-3.5 mr-1.5" />
                )}
                <span>{isSavingPassword ? "Memperbarui..." : "Perbarui Kata Sandi"}</span>
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
