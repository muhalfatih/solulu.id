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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
  CalendarCheck,
  FileText,
  UserCheck,
} from "lucide-react"
import { computeEndTime, formatTimeRange } from "@/lib/schedules/concurrency"
import {
  getAvailableCounselorsAction,
  getCounselorAvailableSlotsAction,
  checkZoomConcurrencyAction,
  getActiveZoomCapacityAction,
  createAdminManualBookingAction,
} from "../manual-booking-actions"
import type { BookingSession } from "@/lib/types/admin"

export interface AdminManualBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onBookingCreated: (session: BookingSession) => void
}

const DEFAULT_ADMIN_NOTES = "Booking manual via Admin Console"

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
  const [platformZoomCapacity, setPlatformZoomCapacity] = React.useState<number>(1)
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

  // Sesi & Zoom Toggles
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
          setCounselorsList([])
        }
      } catch (err) {
        console.error("Failed to load counselors:", err)
        setCounselorsList([])
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

  // Load platform zoom capacity from real DB when modal opens
  React.useEffect(() => {
    if (!isOpen) return
    getActiveZoomCapacityAction().then((res) => {
      if (res.success && typeof res.data === "number") {
        setPlatformZoomCapacity(res.data)
      }
    })
  }, [isOpen])

  // Check Zoom concurrency whenever target slot date or start time changes (both existing and adhoc modes)
  const selectedSlot = availableSlots.find((s) => s.id === selectedScheduleId)
  const targetDate = scheduleMode === "existing" ? (selectedSlot?.date || "") : adhocDate
  const targetStartTime = scheduleMode === "existing" ? (selectedSlot?.startTime || "") : adhocStartTime

  React.useEffect(() => {
    if (!isOpen) return

    if (!targetDate || !targetStartTime) {
      setZoomConcurrency(null)
      return
    }

    let cancelled = false
    async function checkConcurrency() {
      setIsCheckingZoom(true)
      try {
        const res = await checkZoomConcurrencyAction(targetDate, targetStartTime)
        if (!cancelled && res.success && res.data) {
          setZoomConcurrency(res.data)
          if (res.data.maxConcurrency) {
            setPlatformZoomCapacity(res.data.maxConcurrency)
          }
        }
      } catch {
        if (!cancelled) {
          setZoomConcurrency({ available: true, activeOverlapCount: 0, maxConcurrency: platformZoomCapacity })
        }
      } finally {
        if (!cancelled) setIsCheckingZoom(false)
      }
    }

    checkConcurrency()
    return () => {
      cancelled = true
    }
  }, [scheduleMode, targetDate, targetStartTime, isOpen, platformZoomCapacity])

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
        adminNotes: DEFAULT_ADMIN_NOTES,
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
        zoomJoinUrl:
          manualMeetingUrl ||
          `https://zoom.us/j/88${Math.floor(10000000 + Math.random() * 90000000)}`,
        srqScore: 0,
        hasSuicidalThoughts: false,
        waiverSigned: true,
        paymentProvider: "manual",
        paymentMethod: "Admin Bypass (Rp 0)",
        referenceNumber: `ADMIN-BYPASS-${res.data.accessToken.slice(0, 8).toUpperCase()}`,
        adminNotes: DEFAULT_ADMIN_NOTES,
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
      <DialogContent className="sm:max-w-4xl lg:max-w-[880px] p-0 overflow-hidden bg-background border-border/80 rounded-xl shadow-xl">
        {/* Header Compact - Mode Operate Aesthetic */}
        <DialogHeader className="px-5 py-3.5 border-b border-border/60 bg-muted/15">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CalendarCheck className="size-4" />
              </div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-semibold text-foreground tracking-tight">
                  Buat Booking Manual
                </DialogTitle>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                  Admin Bypass • Rp 0
                </span>
              </div>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Daftarkan pasien langsung tanpa gateway pembayaran. Token sesi instan akan diterbitkan untuk telekonseling.
          </DialogDescription>
        </DialogHeader>

        {/* Success View */}
        {createdSessionData ? (
          <div className="flex flex-col gap-4 p-6 animate-in fade-in">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-foreground">
                  Booking Manual Berhasil Dikonfirmasi & Terverifikasi
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ruang telekonseling telah aktif. Transaksi bypass tercatat bernilai Rp 0 dengan status PAID di audit konsol.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/10 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Tautan Ruang Sesi Pasien:</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Token: {createdSessionData.accessToken}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}${createdSessionData.sessionUrl}`
                      : createdSessionData.sessionUrl
                  }
                  className="text-xs h-8.5 font-mono bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8.5 px-3 text-xs shrink-0 cursor-pointer"
                >
                  {isCopiedToken ? (
                    <>
                      <Check className="size-3.5 mr-1 text-emerald-500" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1" />
                      <span>Salin</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-muted-foreground">
                  Pasien dapat langsung mengakses ruang telekonseling melalui tautan privat di atas.
                </span>
                <a
                  href={createdSessionData.sessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors flex items-center gap-1 font-medium text-xs ml-2 shrink-0"
                >
                  <span>Buka Ruang Sesi</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleResetForm()
                  onClose()
                }}
                className="h-8.5 text-xs cursor-pointer"
              >
                Tutup Dialog
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleResetForm}
                className="h-8.5 text-xs font-medium cursor-pointer"
              >
                Buat Booking Lain
              </Button>
            </div>
          </div>
        ) : (
          /* Dual-Column Cockpit Form */
          <form onSubmit={handleSubmit} className="flex flex-col">
            {errorMessage && (
              <div className="mx-5 mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border/60 max-h-[calc(85vh-120px)] overflow-y-auto">
              {/* Kolom Kiri: Konselor & Alokasi Jadwal 90 Menit */}
              <div className="md:col-span-6 p-5 flex flex-col gap-4 bg-muted/[0.03]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                    <User className="size-3 text-muted-foreground" />
                    <span>Konselor & Jadwal Sesi</span>
                  </span>
                  {selectedCounselor && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 text-foreground border border-border/60">
                      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span>
                        {selectedCounselor.counselorType === "psychologist"
                          ? "Psikolog Klinis"
                          : "Konselor Sebaya"}
                      </span>
                    </span>
                  )}
                </div>

                {/* Pilih Konselor */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="select-counselor" className="text-xs font-medium text-foreground">
                    Mitra Konselor Penanggung Jawab
                  </label>
                  <Select value={selectedCounselorId} onValueChange={setSelectedCounselorId}>
                    <SelectTrigger id="select-counselor" className="h-9 text-xs bg-background">
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

                {/* Mode Jadwal (Segmented Control Compact) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-foreground">
                    Alokasi Waktu (Durasi 90 Menit)
                  </label>
                  <div className="grid grid-cols-2 p-0.5 rounded-md border border-border/70 bg-muted/30 text-xs">
                    <button
                      type="button"
                      onClick={() => setScheduleMode("existing")}
                      disabled={availableSlots.length === 0}
                      className={`h-7.5 px-2.5 flex items-center justify-center gap-1.5 rounded text-xs font-medium transition-all cursor-pointer ${
                        scheduleMode === "existing"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground disabled:opacity-40"
                      }`}
                    >
                      <span>Slot Terbuka</span>
                      {availableSlots.length > 0 && (
                        <span className="text-[10px] tabular-nums font-mono px-1 py-0.2 rounded bg-muted text-foreground">
                          {availableSlots.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleMode("adhoc")}
                      className={`h-7.5 px-2.5 flex items-center justify-center gap-1 rounded text-xs font-medium transition-all cursor-pointer ${
                        scheduleMode === "adhoc"
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Plus className="size-3" />
                      <span>Jadwal Baru (Ad-hoc)</span>
                    </button>
                  </div>
                </div>

                {/* Input Jadwal Berdasarkan Mode */}
                {scheduleMode === "existing" ? (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="select-slot" className="text-xs font-medium text-foreground">
                      Pilih Jam Sesi Tersedia
                    </label>
                    {availableSlots.length > 0 ? (
                      <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                        <SelectTrigger id="select-slot" className="h-9 text-xs bg-background">
                          <SelectValue placeholder="Pilih waktu slot" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {availableSlots.map((slot) => (
                              <SelectItem key={slot.id} value={slot.id} className="text-xs font-mono">
                                {slot.date} • {formatTimeRange(slot.startTime, slot.endTime)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 rounded-lg border border-border/70 bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
                        <span>Tidak ada slot jadwal terbuka saat ini.</span>
                        <button
                          type="button"
                          onClick={() => setScheduleMode("adhoc")}
                          className="text-foreground hover:underline font-medium text-xs cursor-pointer"
                        >
                          Buat Ad-hoc →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="adhocDate" className="text-xs font-medium text-foreground">
                          Tanggal Sesi
                        </label>
                        <Input
                          id="adhocDate"
                          type="date"
                          value={adhocDate}
                          onChange={(e) => setAdhocDate(e.target.value)}
                          required
                          className="h-8.5 text-xs bg-background tabular-nums font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label htmlFor="adhocStartTime" className="text-xs font-medium text-foreground">
                          Jam Mulai (WIB)
                        </label>
                        <Input
                          id="adhocStartTime"
                          type="time"
                          value={adhocStartTime}
                          onChange={(e) => setAdhocStartTime(e.target.value)}
                          required
                          className="h-8.5 text-xs bg-background tabular-nums font-mono"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span className="font-mono tabular-nums">
                        Selesai: {adhocEndTime} WIB (Standar 90 Menit)
                      </span>
                    </div>
                  </div>
                )}

                {/* Telemetri Kapasitas Akun Zoom */}
                <div className="mt-auto p-2.5 rounded-lg border border-border/70 bg-muted/25 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Video className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-[11px]">
                      Kapasitas Zoom ({zoomConcurrency?.maxConcurrency ?? platformZoomCapacity} Akun):
                    </span>
                    {isCheckingZoom ? (
                      <span className="text-muted-foreground text-[11px] italic">Memeriksa...</span>
                    ) : !zoomConcurrency ? (
                      <span className="text-muted-foreground text-[11px] italic">
                        {scheduleMode === "existing" ? "Pilih slot jadwal" : "Pilih jam konseling"}
                      </span>
                    ) : zoomConcurrency.available ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium tabular-nums text-[11px] flex items-center gap-1 font-mono">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Tersedia ({zoomConcurrency.activeOverlapCount}/{zoomConcurrency.maxConcurrency} sesi)
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400 font-medium tabular-nums text-[11px] flex items-center gap-1 font-mono">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        Penuh ({zoomConcurrency.activeOverlapCount}/{zoomConcurrency.maxConcurrency} sesi)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    90 Min Guard
                  </span>
                </div>
              </div>

              {/* Kolom Kanan: Pasien & Pengaturan Sesi */}
              <div className="md:col-span-6 p-5 flex flex-col gap-4 bg-background">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-3 text-muted-foreground" />
                  <span>Identitas Pasien & Pengaturan Sesi</span>
                </span>

                {/* Field Pasien */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="patientName" className="text-xs font-medium text-foreground">
                      Nama Lengkap Pasien <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="patientName"
                      type="text"
                      placeholder="cth. Budi Santoso"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      required
                      className="h-8.5 text-xs bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="patientEmail" className="text-xs font-medium text-foreground">
                        Email Pasien <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="patientEmail"
                        type="email"
                        placeholder="pasien@gmail.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        required
                        className="h-8.5 text-xs bg-background"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="patientPhone" className="text-xs font-medium text-foreground">
                        WhatsApp Pasien <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="patientPhone"
                        type="tel"
                        placeholder="081234567890"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        required
                        className="h-8.5 text-xs bg-background tabular-nums font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="initialNotes" className="text-xs font-medium text-foreground">
                      Keluhan Utama / Catatan Awal (Opsional)
                    </label>
                    <Input
                      id="initialNotes"
                      type="text"
                      placeholder="cth. Manajemen stres, kecemasan, gangguan tidur..."
                      value={initialNotes}
                      onChange={(e) => setInitialNotes(e.target.value)}
                      className="h-8.5 text-xs bg-background"
                    />
                  </div>
                </div>

                {/* Section Sesi & Zoom Toggles */}
                <div className="pt-2 border-t border-border/60 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        Alokasi Zoom Otomatis
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Gunakan salah satu dari 2 akun Zoom Pro platform.
                      </span>
                    </div>
                    <Switch
                      checked={createZoom}
                      onCheckedChange={setCreateZoom}
                      aria-label="Toggle alokasi Zoom otomatis"
                    />
                  </div>

                  {/* Fallback Manual Meeting URL */}
                  {(!createZoom || (zoomConcurrency && !zoomConcurrency.available)) && (
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex flex-col gap-1.5 animate-in fade-in">
                      <label
                        htmlFor="manualMeetingUrl"
                        className="text-xs font-medium text-amber-800 dark:text-amber-400"
                      >
                        Tautan Video Rapat Manual <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="manualMeetingUrl"
                        type="url"
                        placeholder="https://meet.google.com/... atau Zoom sendiri"
                        value={manualMeetingUrl}
                        onChange={(e) => setManualMeetingUrl(e.target.value)}
                        required={!createZoom}
                        className="h-8 text-xs bg-background font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Wajib diisi karena Zoom otomatis dimatikan atau kapasitas platform penuh.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        Kirim Email Konfirmasi
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Kirimkan tiket & tautan telekonseling ke {patientEmail || "pasien"}.
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
            </div>

            {/* Submit Footer Bar */}
            <div className="px-5 py-3 border-t border-border/60 bg-muted/15 flex items-center justify-between">
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                <ShieldCheck className="size-3.5 text-muted-foreground" />
                <span>Bypass kasir: Transaksi tercatat Rp 0 (PAID)</span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="h-8.5 px-3.5 text-xs cursor-pointer"
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !patientName || !patientEmail || !patientPhone}
                  className="h-8.5 px-4 text-xs font-medium cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                      <span>Menerbitkan Sesi...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5 mr-1.5 text-emerald-400" />
                      <span>Konfirmasi Booking (Rp 0)</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
