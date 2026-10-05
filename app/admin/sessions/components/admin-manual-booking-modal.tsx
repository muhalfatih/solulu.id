"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Calendar,
  Clock,
  Video,
  Mail,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react"
import { computeEndTime, formatTimeRange } from "@/lib/schedules/concurrency"
import {
  getAvailableCounselorsAction,
  getCounselorAvailableSlotsAction,
  checkZoomConcurrencyAction,
  createAdminManualBookingAction,
} from "../manual-booking-actions"
import type { BookingSession } from "../../mock-data"

export interface AdminManualBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onBookingCreated: (session: BookingSession) => void
}

export function AdminManualBookingModal({
  isOpen,
  onClose,
  onBookingCreated,
}: AdminManualBookingModalProps) {
  // Counselor & Schedule state
  const [counselorsList, setCounselorsList] = React.useState<any[]>([])
  const [selectedCounselorId, setSelectedCounselorId] = React.useState<string>("")
  const [availableSlots, setAvailableSlots] = React.useState<any[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = React.useState(false)

  const [scheduleMode, setScheduleMode] = React.useState<"existing" | "adhoc">("existing")
  const [selectedScheduleId, setSelectedScheduleId] = React.useState<string>("")
  const [adhocDate, setAdhocDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [adhocStartTime, setAdhocStartTime] = React.useState<string>("19:00")
  const adhocEndTime = computeEndTime(adhocStartTime)

  // Zoom Concurrency Status
  const [isCheckingZoom, setIsCheckingZoom] = React.useState(false)
  const [zoomConcurrency, setZoomConcurrency] = React.useState<{
    available: boolean
    activeOverlapCount: number
    maxConcurrency: number
  } | null>(null)

  // Patient Info
  const [patientName, setPatientName] = React.useState("")
  const [patientEmail, setPatientEmail] = React.useState("")
  const [patientPhone, setPatientPhone] = React.useState("")
  const [initialNotes, setInitialNotes] = React.useState("")

  // Admin audit & toggles
  const [adminNotes, setAdminNotes] = React.useState("Beasiswa / Program Pro-bono Khusus")
  const [createZoom, setCreateZoom] = React.useState(true)
  const [manualMeetingUrl, setManualMeetingUrl] = React.useState("")
  const [sendConfirmationEmail, setSendConfirmationEmail] = React.useState(true)

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [createdSessionData, setCreatedSessionData] = React.useState<{
    accessToken: string
    sessionUrl: string
    bookingId: string
  } | null>(null)
  const [isCopiedToken, setIsCopiedToken] = React.useState(false)

  // Load active counselors on open
  React.useEffect(() => {
    if (!isOpen) return
    async function loadCounselors() {
      try {
        const res = await getAvailableCounselorsAction()
        if (res.success && res.data && res.data.length > 0) {
          setCounselorsList(res.data)
          if (!selectedCounselorId) {
            setSelectedCounselorId(res.data[0].id)
          }
        } else {
          // Mock counselors fallback
          const fallback = [
            {
              id: "c-1",
              fullName: "Sarah Annisa, M.Psi., Psikolog",
              title: "Psikolog Klinis Dewasa",
              counselorType: "psychologist",
            },
            {
              id: "c-2",
              fullName: "Rian Hidayat, S.Psi",
              title: "Konselor Sebaya Senior",
              counselorType: "peer",
            },
            {
              id: "c-3",
              fullName: "Nadia Utami, S.Psi",
              title: "Konselor Sebaya",
              counselorType: "peer",
            },
          ]
          setCounselorsList(fallback)
          if (!selectedCounselorId) {
            setSelectedCounselorId(fallback[0].id)
          }
        }
      } catch (err) {
        console.warn("Failed to load counselors, using fallback:", err)
      }
    }
    loadCounselors()
  }, [isOpen, selectedCounselorId])

  // Load counselor available slots when counselor changes
  React.useEffect(() => {
    if (!selectedCounselorId || !isOpen) return
    async function loadSlots() {
      setIsLoadingSlots(true)
      try {
        const res = await getCounselorAvailableSlotsAction(selectedCounselorId)
        if (res.success && res.data && res.data.length > 0) {
          setAvailableSlots(res.data)
          setSelectedScheduleId(res.data[0].id)
        } else {
          setAvailableSlots([])
          setSelectedScheduleId("")
          // If no slots, auto-switch to adhoc mode
          setScheduleMode("adhoc")
        }
      } catch {
        setAvailableSlots([])
        setSelectedScheduleId("")
        setScheduleMode("adhoc")
      } finally {
        setIsLoadingSlots(false)
      }
    }
    loadSlots()
  }, [selectedCounselorId, isOpen])

  // Check Zoom concurrency when adhoc date or start time changes
  React.useEffect(() => {
    if (scheduleMode !== "adhoc" || !adhocDate || !adhocStartTime || !isOpen) return

    let cancelled = false
    async function checkConcurrency() {
      setIsCheckingZoom(true)
      try {
        const res = await checkZoomConcurrencyAction(adhocDate, adhocStartTime)
        if (!cancelled && res.success && res.data) {
          setZoomConcurrency(res.data)
        }
      } catch {
        if (!cancelled) {
          setZoomConcurrency({ available: true, activeOverlapCount: 0, maxConcurrency: 2 })
        }
      } finally {
        if (!cancelled) setIsCheckingZoom(false)
      }
    }

    checkConcurrency()
    return () => {
      cancelled = true
    }
  }, [scheduleMode, adhocDate, adhocStartTime, isOpen])

  const handleCopyLink = () => {
    if (!createdSessionData) return
    const fullUrl = window.location.origin + createdSessionData.sessionUrl
    navigator.clipboard.writeText(fullUrl)
    setIsCopiedToken(true)
    setTimeout(() => setIsCopiedToken(false), 2500)
  }

  const handleResetForm = () => {
    setPatientName("")
    setPatientEmail("")
    setPatientPhone("")
    setInitialNotes("")
    setAdminNotes("Beasiswa / Program Pro-bono Khusus")
    setCreateZoom(true)
    setManualMeetingUrl("")
    setCreatedSessionData(null)
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!selectedCounselorId) {
      setErrorMessage("Silakan pilih mitra konselor.")
      return
    }

    if (scheduleMode === "existing" && !selectedScheduleId) {
      setErrorMessage("Silakan pilih salah satu slot jadwal atau buat jadwal ad-hoc baru.")
      return
    }

    if (!createZoom && !manualMeetingUrl.trim()) {
      setErrorMessage("Tautan rapat manual wajib diisi jika Zoom otomatis dinonaktifkan.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await createAdminManualBookingAction({
        counselorId: selectedCounselorId,
        scheduleMode,
        scheduleId: scheduleMode === "existing" ? selectedScheduleId : null,
        adhocDate: scheduleMode === "adhoc" ? adhocDate : null,
        adhocStartTime: scheduleMode === "adhoc" ? adhocStartTime : null,
        patientName,
        patientEmail,
        patientPhone,
        initialNotes: initialNotes.trim() || null,
        adminNotes,
        createZoom,
        manualMeetingUrl: manualMeetingUrl.trim() || null,
        sendConfirmationEmail,
      })

      if (!res.success || !res.data) {
        setErrorMessage(res.error || "Gagal membuat booking manual.")
        setIsSubmitting(false)
        return
      }

      setCreatedSessionData({
        accessToken: res.data.accessToken,
        sessionUrl: res.data.sessionUrl,
        bookingId: res.data.bookingId,
      })

      // Notify parent to append or update session list
      const selectedCounselor = counselorsList.find((c) => c.id === selectedCounselorId)
      const newSessionObj: BookingSession = {
        id: res.data.bookingId,
        code: `SOL-${res.data.accessToken.slice(0, 6).toUpperCase()}`,
        patientName,
        patientContact: `${patientPhone} • ${patientEmail}`,
        counselorName: selectedCounselor?.fullName || "Mitra Konselor",
        counselorType:
          selectedCounselor?.counselorType === "psychologist"
            ? "Psikolog Klinis"
            : "Konselor Sebaya",
        date: scheduleMode === "adhoc" ? adhocDate : "Hari Ini",
        timeRange:
          scheduleMode === "adhoc"
            ? formatTimeRange(adhocStartTime, adhocEndTime)
            : "19:00 – 20:30 WIB",
        hoursUntilSession: 24,
        status: "confirmed",
        zoomRoom: createZoom ? "Zoom Pro 1" : "Ruang Rapat Manual",
        zoomJoinUrl: manualMeetingUrl || `https://zoom.us/j/88${Math.floor(10000000 + Math.random() * 90000000)}`,
        srqScore: 0,
        hasSuicidalThoughts: false,
        waiverSigned: true,
        paymentProvider: "manual",
        paymentMethod: "Admin Bypass (Rp 0)",
        referenceNumber: `ADMIN-BYPASS-${res.data.accessToken.slice(0, 8).toUpperCase()}`,
        adminNotes,
        amount: 0,
      }

      onBookingCreated(newSessionObj)
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat memproses booking.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCounselor = counselorsList.find((c) => c.id === selectedCounselorId)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleResetForm()
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card border-border rounded-xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <DialogTitle className="text-base font-bold text-foreground">
              Buat Booking Manual (Admin Bypass)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Daftarkan pasien rujukan darurat, beasiswa, atau program pro-bono secara instan dengan transaksi Rp 0
            dan Token Sesi mandiri tanpa gateway pembayaran.
          </DialogDescription>
        </DialogHeader>

        {/* Success View */}
        {createdSessionData ? (
          <div className="flex flex-col gap-6 py-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">
                  Booking Manual Berhasil Dikonfirmasi!
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ruang sesi telah disiapkan dan transaksi tercatat bernilai Rp 0 dengan status PAID di sistem.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3">
              <span className="text-xs font-semibold text-foreground">Tautan Ruang Sesi Pasien:</span>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}${createdSessionData.sessionUrl}`
                      : createdSessionData.sessionUrl
                  }
                  className="text-xs h-9 font-mono bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-9 px-3 text-xs shrink-0"
                >
                  {isCopiedToken ? (
                    <>
                      <Check className="size-3.5 mr-1.5 text-emerald-500" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1.5" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span className="tabular-nums font-mono text-[11px]">
                  Token Sesi: {createdSessionData.accessToken}
                </span>
                <a
                  href={createdSessionData.sessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Buka Ruang Sesi</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleResetForm()
                  onClose()
                }}
                className="h-9 text-xs"
              >
                Tutup Dialog
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleResetForm}
                className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Buat Booking Lain
              </Button>
            </div>
          </div>
        ) : (
          /* Input Form View */
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-3">
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Counselor & Schedule Slot */}
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" />
                  <span>1. Pilih Mitra Konselor & Jadwal 90 Menit</span>
                </span>
                {selectedCounselor && (
                  <Badge variant="outline" className="text-[10px] py-0">
                    {selectedCounselor.counselorType === "psychologist"
                      ? "Psikolog Klinis (Rp 130k)"
                      : "Konselor Sebaya (Rp 85k)"}
                  </Badge>
                )}
              </div>

              {/* Counselor Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="select-counselor" className="text-xs font-medium text-muted-foreground">
                  Mitra Konselor Penanggung Jawab
                </label>
                <Select value={selectedCounselorId} onValueChange={setSelectedCounselorId}>
                  <SelectTrigger id="select-counselor" className="h-9 text-xs bg-card">
                    <SelectValue placeholder="Pilih konselor aktif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {counselorsList.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.fullName} ({c.title})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule Mode Selector */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center h-8 rounded-lg border border-border p-0.5 bg-background text-xs">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("existing")}
                    disabled={availableSlots.length === 0}
                    className={`h-7 px-3 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      scheduleMode === "existing"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground disabled:opacity-40"
                    }`}
                  >
                    <span>Slot Tersedia</span>
                    {availableSlots.length > 0 && (
                      <span className="text-[10px] tabular-nums font-semibold px-1 rounded-sm bg-primary-foreground/20">
                        {availableSlots.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("adhoc")}
                    className={`h-7 px-3 flex items-center gap-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      scheduleMode === "adhoc"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Plus className="size-3" />
                    <span>Jadwal Baru (Ad-hoc)</span>
                  </button>
                </div>

                {scheduleMode === "existing" && availableSlots.length === 0 && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    Tidak ada slot terbuka. Beralih ke jadwal ad-hoc.
                  </span>
                )}
              </div>

              {/* Mode 1: Existing Slots Dropdown */}
              {scheduleMode === "existing" ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="select-slot" className="text-xs font-medium text-muted-foreground">
                    Pilih Slot Jam Konseling
                  </label>
                  <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                    <SelectTrigger id="select-slot" className="h-9 text-xs bg-card">
                      <SelectValue placeholder="Pilih waktu slot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id} className="text-xs">
                            {slot.date} • {formatTimeRange(slot.startTime, slot.endTime)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                /* Mode 2: Ad-hoc Date & Time Picker */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="adhocDate" className="text-xs font-medium text-muted-foreground">
                      Tanggal Konseling
                    </label>
                    <Input
                      id="adhocDate"
                      type="date"
                      value={adhocDate}
                      onChange={(e) => setAdhocDate(e.target.value)}
                      required
                      className="h-9 text-xs bg-card tabular-nums"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="adhocStartTime" className="text-xs font-medium text-muted-foreground">
                        Jam Mulai (WIB)
                      </label>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        Selesai: {adhocEndTime} WIB
                      </span>
                    </div>
                    <Input
                      id="adhocStartTime"
                      type="time"
                      value={adhocStartTime}
                      onChange={(e) => setAdhocStartTime(e.target.value)}
                      required
                      className="h-9 text-xs bg-card tabular-nums"
                    />
                  </div>
                </div>
              )}

              {/* Concurrency Guard Status Indicator */}
              {scheduleMode === "adhoc" && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-md border border-border/70 bg-card">
                  <div className="flex items-center gap-2">
                    <Video className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Kapasitas 2 Akun Zoom:</span>
                    {isCheckingZoom ? (
                      <span className="text-muted-foreground italic text-[11px]">Memeriksa...</span>
                    ) : zoomConcurrency?.available ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums text-[11px] flex items-center gap-1">
                        <Check className="size-3" />
                        Tersedia ({zoomConcurrency.activeOverlapCount}/2 sesi aktif)
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-medium tabular-nums text-[11px] flex items-center gap-1">
                        <AlertTriangle className="size-3" />
                        Penuh (2/2 sesi aktif). Gunakan tautan manual.
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums font-mono">
                    Durasi: 90 menit
                  </span>
                </div>
              )}
            </div>

            {/* STEP 2: Patient Identity */}
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4 bg-muted/10">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-primary" />
                <span>2. Data Pasien (Guest Checkout)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="patientName" className="text-xs font-medium text-muted-foreground">
                    Nama Lengkap Pasien <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="patientName"
                    type="text"
                    placeholder="Nama pasien"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                    className="h-9 text-xs bg-card"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="patientEmail" className="text-xs font-medium text-muted-foreground">
                    Alamat Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="patientEmail"
                    type="email"
                    placeholder="pasien@gmail.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    required
                    className="h-9 text-xs bg-card"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="patientPhone" className="text-xs font-medium text-muted-foreground">
                    Nomor WhatsApp <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="patientPhone"
                    type="tel"
                    placeholder="081234567890"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required
                    className="h-9 text-xs bg-card tabular-nums"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label htmlFor="initialNotes" className="text-xs font-medium text-muted-foreground">
                    Keluhan Utama / Catatan Awal Pasien (Opsional)
                  </label>
                  <Input
                    id="initialNotes"
                    type="text"
                    placeholder="Kecemasan, masalah tidur, relasi..."
                    value={initialNotes}
                    onChange={(e) => setInitialNotes(e.target.value)}
                    className="h-9 text-xs bg-card"
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Otorisasi & Audit Trail Admin */}
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4 bg-muted/10">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>3. Alasan Bypass Biaya & Otorisasi Operasional</span>
              </span>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="adminNotes" className="text-xs font-medium text-muted-foreground">
                  Catatan Alasan Bypass (Audit Trail Wajib) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="adminNotes"
                  type="text"
                  placeholder="Misal: Beasiswa BEM UI, Rujukan Krisis Darurat, Pembayaran Tunai"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  required
                  className="h-9 text-xs bg-card"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground">Alokasi Ruang Zoom Otomatis</span>
                    <span className="text-[11px] text-muted-foreground">
                      Menggunakan salah satu dari 2 akun Zoom Pro platform.
                    </span>
                  </div>
                  <Switch checked={createZoom} onCheckedChange={setCreateZoom} aria-label="Toggle alokasi Zoom otomatis" />
                </div>

                {/* Manual Meeting URL Fallback */}
                {(!createZoom || (zoomConcurrency && !zoomConcurrency.available)) && (
                  <div className="flex flex-col gap-1.5 p-3 rounded-md border border-amber-500/30 bg-amber-500/5 animate-in fade-in">
                    <label htmlFor="manualMeetingUrl" className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Tautan Temu Video Manual (Google Meet / Zoom Sendiri) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="manualMeetingUrl"
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={manualMeetingUrl}
                      onChange={(e) => setManualMeetingUrl(e.target.value)}
                      required={!createZoom}
                      className="h-8 text-xs bg-card"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Tautan ini akan langsung disajikan kepada pasien di halaman sesi /session/[token].
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border/60">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground">Kirim Email Konfirmasi ke Pasien</span>
                    <span className="text-[11px] text-muted-foreground">
                      Kirim jadwal dan tautan sesi langsung ke {patientEmail || "email pasien"}.
                    </span>
                  </div>
                  <Switch
                    checked={sendConfirmationEmail}
                    onCheckedChange={setSendConfirmationEmail}
                    aria-label="Toggle kirim email konfirmasi"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-9 text-xs">
                Batal
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !patientName || !patientEmail || !patientPhone || !adminNotes}
                className="h-9 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 mr-2 animate-spin" />
                    <span>Menerbitkan Ruang Sesi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 mr-2" />
                    <span>Konfirmasi Booking (Rp 0)</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
