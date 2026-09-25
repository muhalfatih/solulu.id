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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function AdminProfilePage() {
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

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault()
    showToast("Data kontak dan preferensi notifikasi berhasil disimpan.")
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (!currentPassword) {
      setPasswordError("Kata sandi saat ini wajib diisi.")
      return
    }
    if (newPassword.length < 8) {
      setPasswordError("Kata sandi baru minimal terdiri dari 8 karakter.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak sesuai.")
      return
    }

    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    showToast("Kata sandi akun Anda berhasil diperbarui. Gunakan kata sandi baru untuk login berikutnya.")
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-card border border-primary/40 text-foreground text-xs shadow-xl animate-in fade-in flex items-center justify-between gap-4 max-w-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setToastMessage(null)}
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Profil Saya
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Kelola data kontak operasional, preferensi pemberitahuan, dan kata sandi login Anda.
          </p>
        </div>

        <Badge variant="outline" className="text-xs py-0.5 px-2 font-medium">
          Akun Terverifikasi
        </Badge>
      </div>

      {/* Locked Official Identity Card */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xl shrink-0 shadow-2xs">
            AP
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">
                Admin Pelayanan
              </span>
              <Badge variant="secondary" className="text-xs py-0 px-2 font-medium">
                Staf Operasional
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              admin@solulu.id
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
          <TabsTrigger value="contact" className="text-xs font-medium">
            Kontak & Informasi Akun
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs font-medium">
            Keamanan & Kata Sandi
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: KONTAK & INFORMASI AKUN */}
        <TabsContent value="contact" className="mt-0">
          <form onSubmit={handleSaveContact} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Phone className="size-4 text-primary shrink-0" />
              <h2 className="text-sm font-bold text-foreground">
                Kontak Operasional Staf
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* WhatsApp Number */}
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground">
                  Nomor WhatsApp Operasional
                </label>
                <Input
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
                <label className="font-medium text-foreground">
                  Alamat Email Masuk
                </label>
                <Input
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
                <label className="font-medium text-foreground">
                  Zona Waktu Operasional
                </label>
                <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs flex items-center justify-between text-muted-foreground">
                  <span>Waktu Indonesia Barat (WIB / UTC+7)</span>
                  <Badge variant="outline" className="text-[10px]">Standar Platform</Badge>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-foreground">
                  Preferensi Pemberitahuan di Layar
                </h3>
              </div>

              <div className="flex flex-col divide-y divide-border/60 text-xs">
                {/* Switch 1 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      Pemberitahuan Pasien Kondisi Mendesak
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Munculkan peringatan langsung ketika pasien mencatat indikasi tekanan emosional tinggi.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyUrgent}
                    onChange={(e) => setNotifyUrgent(e.target.checked)}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Switch 2 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      Notifikasi Pendaftar Konselor Baru
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Beri tanda saat ada mitra psikolog yang baru saja mengajukan berkas.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyCounselor}
                    onChange={(e) => setNotifyCounselor(e.target.checked)}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Switch 3 */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      Pengingat Sesi Konseling
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Tampilkan notifikasi 15 menit sebelum sesi temu tatap muka dimulai.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifySession}
                    onChange={(e) => setNotifySession(e.target.checked)}
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" className="h-9 text-xs font-semibold px-5">
                <Save className="size-3.5 mr-1.5" />
                <span>Simpan Perubahan Kontak</span>
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* TAB 2: KEAMANAN & KATA SANDI */}
        <TabsContent value="security" className="mt-0">
          <form onSubmit={handleUpdatePassword} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
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
                <label className="font-medium text-foreground">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <Input
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
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="font-medium text-foreground">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Input
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
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
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
                <label className="font-medium text-foreground">
                  Ulangi Kata Sandi Baru
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="text-xs h-9"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="submit" size="sm" className="h-9 text-xs font-semibold px-5">
                <KeyRound className="size-3.5 mr-1.5" />
                <span>Perbarui Kata Sandi</span>
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
