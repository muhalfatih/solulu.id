"use client"

import * as React from "react"
import Link from "next/link"
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  Tag,
  Sparkles,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Heart,
  Video,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { PublicShell } from "@/components/public/public-shell"
import {
  getCounselorsCatalogAction,
  type CatalogCounselorView,
  type CatalogSlot,
} from "./actions"

interface CounselorsCatalogClientProps {
  initialCounselors: CatalogCounselorView[]
  initialScreeningId?: string
  initialRecommendedType?: "all" | "peer" | "psychologist"
  isScreeningRequired?: boolean
}

export default function CounselorsCatalogClient({
  initialCounselors,
  initialScreeningId,
  initialRecommendedType,
  isScreeningRequired = false,
}: CounselorsCatalogClientProps) {
  const [counselors, setCounselors] = React.useState<CatalogCounselorView[]>(initialCounselors)
  const [typeFilter, setTypeFilter] = React.useState<"all" | "peer" | "psychologist">(
    initialRecommendedType || "all"
  )
  const [dateFilter, setDateFilter] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [loading, setLoading] = React.useState(false)

  // Booking slot selection modal
  const [selectedSlotModal, setSelectedSlotModal] = React.useState<{
    counselor: CatalogCounselorView
    slot: CatalogSlot
  } | null>(null)

  // Tomorrow string for quick date filter
  const tomorrowStr = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split("T")[0]
  }, [])

  const dayAfterStr = React.useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split("T")[0]
  }, [])

  const fetchCatalog = React.useCallback(
    async (type: "all" | "peer" | "psychologist", date: string) => {
      setLoading(true)
      try {
        const res = await getCounselorsCatalogAction({
          type: type === "all" ? undefined : type,
          date: date || undefined,
        })
        if (res.success && res.data) {
          setCounselors(res.data)
        }
      } catch (err) {
        console.error("Failed to load catalog", err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleTypeChange = (newType: "all" | "peer" | "psychologist") => {
    setTypeFilter(newType)
    fetchCatalog(newType, dateFilter)
  }

  const handleDateChange = (newDate: string) => {
    setDateFilter(newDate)
    fetchCatalog(typeFilter, newDate)
  }

  const clearFilters = () => {
    setTypeFilter("all")
    setDateFilter("")
    setSearchQuery("")
    fetchCatalog("all", "")
  }

  // Local client-side search query filtering
  const filteredCounselors = React.useMemo(() => {
    if (!searchQuery.trim()) return counselors
    const q = searchQuery.toLowerCase()
    return counselors.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.specializations.some((s) => s.toLowerCase().includes(q))
    )
  }, [counselors, searchQuery])

  return (
    <PublicShell>

      {/* Hero Section */}
      <section className="bg-radial from-card via-card to-muted/30 border-b border-border/60 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Katalog Tenaga Ahli Terverifikasi • Privasi 100% Terjaga</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-3xl text-balance leading-tight">
            Pilih Mitra Konselor yang Tepat untuk Menemani Langkahmu
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl text-pretty leading-relaxed">
            Sesi privat 90 menit langsung tatap muka daring via Zoom. Tanpa ribet membuat akun, reservasi slot aman, dan didukung psikolog klinis ber-STR serta konselor sebaya tersertifikasi.
          </p>
        </div>
      </section>

      {/* Main Catalog Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Connected Screening Banner if Patient took screening */}
        {initialScreeningId && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-foreground">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Hasil skrining SRQ-20 Anda tersimpan{" "}
                {initialRecommendedType && (
                  <strong>
                    (Rekomendasi:{" "}
                    {initialRecommendedType === "psychologist"
                      ? "Psikolog Klinis"
                      : "Konselor Sebaya"}
                    )
                  </strong>
                )}
                . Rekomendasi ini otomatis terlampir saat Anda memilih jadwal sesi.
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="h-7 text-xs shrink-0">
              <Link href={`/screening?screeningId=${initialScreeningId}`}>
                Lihat Evaluasi
              </Link>
            </Button>
          </div>
        )}
        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Type Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Kategori:</span>
              <button
                type="button"
                onClick={() => handleTypeChange("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  typeFilter === "all"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Semua Mitra ({counselors.length})
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("peer")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === "peer"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>Konselor Sebaya</span>
                <span className="text-[10px] opacity-80">(Mulai Rp 50.000)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("psychologist")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === "psychologist"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>Psikolog Klinis</span>
                <span className="text-[10px] opacity-80">(Mulai Rp 150.000)</span>
              </button>
            </div>

            {/* Keyword Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari nama atau topik (misal: kecemasan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          {/* Date Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/50 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                <span>Pilih Tanggal:</span>
              </span>

              <button
                type="button"
                onClick={() => handleDateChange("")}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  dateFilter === ""
                    ? "bg-foreground text-background font-medium"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                Kapan Saja
              </button>

              <button
                type="button"
                onClick={() => handleDateChange(tomorrowStr)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  dateFilter === tomorrowStr
                    ? "bg-foreground text-background font-medium"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                Besok ({tomorrowStr})
              </button>

              <button
                type="button"
                onClick={() => handleDateChange(dayAfterStr)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  dateFilter === dayAfterStr
                    ? "bg-foreground text-background font-medium"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                Lusa ({dayAfterStr})
              </button>
            </div>

            {/* Custom Date Input */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground whitespace-nowrap">Tanggal Tertentu:</span>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={dateFilter}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-xs h-8 w-36 px-2"
              />
              {(dateFilter || typeFilter !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Header Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Menampilkan <strong>{filteredCounselors.length}</strong> mitra konselor aktif
            {dateFilter && ` dengan slot tersedia pada ${dateFilter}`}
          </span>
          <span className="hidden sm:inline">Setiap sesi berdurasi penuh 90 menit</span>
        </div>

        {/* Counselors Grid */}
        {filteredCounselors.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3">
            <Clock className="size-10 text-muted-foreground/40" />
            <h2 className="text-base font-bold text-foreground">Tidak Ada Jadwal yang Cocok</h2>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Tidak ditemukan mitra konselor dengan slot praktik yang sesuai dengan filter pencarian Anda. Silakan pilih tanggal lain atau reset filter.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs mt-2">
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCounselors.map((counselor) => {
              const isPsychologist = counselor.counselorType === "psychologist"
              return (
                <Card
                  key={counselor.id}
                  className="border border-border/80 shadow-xs hover:border-border transition-all flex flex-col justify-between overflow-hidden bg-card"
                >
                  <div>
                    {/* Header Card */}
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="size-14 rounded-2xl border border-border/80 shadow-xs shrink-0">
                          {counselor.avatarR2Url && (
                            <AvatarImage
                              src={counselor.avatarR2Url}
                              alt={counselor.fullName}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-base rounded-2xl">
                            {counselor.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-base tracking-tight text-foreground truncate">
                              {counselor.fullName}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] py-0 px-2 font-medium ${
                                isPsychologist
                                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                                  : "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/30"
                              }`}
                            >
                              {counselor.counselorTypeDisplay}
                            </Badge>
                          </div>

                          <span className="text-xs text-muted-foreground font-medium">
                            {counselor.title}
                          </span>

                          {/* Pricing Pill */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-extrabold text-foreground">
                              {counselor.pricing.displayPriceFormatted}
                            </span>
                            <span className="text-[11px] text-muted-foreground">/ 90 Menit</span>
                            {counselor.pricing.isSaleActive && counselor.pricing.originalPriceFormatted && (
                              <span className="text-xs text-muted-foreground line-through">
                                {counselor.pricing.originalPriceFormatted}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-muted-foreground pt-3 leading-relaxed line-clamp-2">
                        {counselor.bio}
                      </p>

                      {/* Specializations Tags */}
                      {counselor.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-3">
                          {counselor.specializations.map((spec) => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] text-muted-foreground font-medium"
                            >
                              #{spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardHeader>

                    {/* Available Schedule Slots Section */}
                    <CardContent className="px-6 py-4 border-t border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Clock className="size-3.5 text-primary" />
                          <span>Pilihan Jadwal Konsultasi (90 Menit):</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {counselor.availableSlots.length} slot terbuka
                        </span>
                      </div>

                      {counselor.availableSlots.length === 0 ? (
                        <div className="p-3 rounded-lg bg-background border border-border/60 text-center text-xs text-muted-foreground">
                          Belum ada slot terbuka pada tanggal yang dipilih.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {counselor.availableSlots.slice(0, 4).map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlotModal({ counselor, slot })}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-background hover:border-primary hover:bg-primary/5 transition-all text-left text-xs cursor-pointer group"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {slot.timeRange}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {slot.date}
                                </span>
                              </div>
                              <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </div>

                  {/* Card Footer Action */}
                  <div className="p-4 px-6 border-t border-border/60 bg-card flex items-center justify-between gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      Proteksi privasi tanpa riwayat akun publik
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (counselor.availableSlots.length > 0) {
                          setSelectedSlotModal({
                            counselor,
                            slot: counselor.availableSlots[0],
                          })
                        }
                      }}
                      disabled={counselor.availableSlots.length === 0}
                      className="text-xs h-8 gap-1.5 font-medium cursor-pointer"
                    >
                      <span>Pilih Jadwal</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal Konfirmasi Pilihan Slot (Menuju Booking Flow) */}
      <Dialog open={!!selectedSlotModal} onOpenChange={(open) => !open && setSelectedSlotModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <span>Konfirmasi Pilihan Jadwal Konsultasi</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Slot yang Anda pilih akan di-hold selama 15–17 menit pada saat proses checkout agar tidak diambil orang lain.
            </DialogDescription>
          </DialogHeader>

          {selectedSlotModal && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">
                    {selectedSlotModal.counselor.fullName}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0">
                    {selectedSlotModal.counselor.counselorTypeDisplay}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1 text-muted-foreground pt-1 border-t border-border/60">
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span className="font-semibold text-foreground">{selectedSlotModal.slot.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rentang Waktu:</span>
                    <span className="font-semibold text-foreground">{selectedSlotModal.slot.timeRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durasi Sesi:</span>
                    <span className="font-semibold text-foreground">90 Menit Penuh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarif Layanan:</span>
                    <span className="font-bold text-foreground">
                      {selectedSlotModal.counselor.pricing.displayPriceFormatted}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px]">
                <ShieldCheck className="size-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Ruang Zoom Pro otomatis dialokasikan setelah konfirmasi pembayaran tanpa perlu pendaftaran akun.
                </span>
              </div>

              {!initialScreeningId && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-primary shrink-0" />
                    <span>
                      {isScreeningRequired
                        ? "Skrining SRQ-20 diwajibkan sebelum menyelesaikan booking."
                        : "Ingin memberikan konteks emosional sebelum konseling?"}
                    </span>
                  </div>
                  {!isScreeningRequired && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] text-primary hover:text-primary underline px-1"
                    >
                      <Link
                        href={`/screening?counselorId=${selectedSlotModal?.counselor.id}&scheduleId=${selectedSlotModal?.slot.id}`}
                      >
                        Isi Skrining SRQ-20 Dulu
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedSlotModal(null)}
              className="text-xs h-9 cursor-pointer"
            >
              Pilih Waktu Lain
            </Button>
            {isScreeningRequired && !initialScreeningId ? (
              <Button
                asChild
                size="sm"
                className="text-xs h-9 gap-1.5 font-semibold cursor-pointer"
              >
                <Link
                  href={`/screening?counselorId=${selectedSlotModal?.counselor.id}&scheduleId=${selectedSlotModal?.slot.id}`}
                >
                  <span>Lanjut ke Skrining (Wajib)</span>
                  <ArrowRight className="size-3.5" data-icon="inline-end" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="text-xs h-9 gap-1.5 font-semibold cursor-pointer"
              >
                <Link
                  href={`/booking?counselorId=${selectedSlotModal?.counselor.id}&scheduleId=${selectedSlotModal?.slot.id}${
                    initialScreeningId ? `&screeningId=${initialScreeningId}` : ""
                  }`}
                >
                  <span>Lanjut ke Formulir Pasien</span>
                  <ArrowRight className="size-3.5" data-icon="inline-end" />
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicShell>
  )
}
