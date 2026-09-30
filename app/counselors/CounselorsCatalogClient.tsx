"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  Star,
  BadgeCheck,
  X,
  Sparkles,
  Lock,
  UserCheck,
  CalendarDays,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

// Fallback images in case avatar URL is missing
const DEFAULT_FALLBACK_PORTRAITS: Record<string, string> = {
  psychologist:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
  peer:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
}

function formatSlotChipDate(dateStr: string, tomorrowStr: string, dayAfterStr: string): string {
  if (dateStr === tomorrowStr) return "Besok"
  if (dateStr === dayAfterStr) return "Lusa"
  try {
    const d = new Date(dateStr + "T00:00:00")
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(d)
  } catch {
    return dateStr
  }
}

export default function CounselorsCatalogClient({
  initialCounselors,
  initialScreeningId,
  initialRecommendedType,
  isScreeningRequired = false,
}: CounselorsCatalogClientProps) {
  const searchParams = useSearchParams()
  const targetCounselorId = searchParams.get("id")

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

  // Counselor full profile detail modal
  const [selectedBioCounselor, setSelectedBioCounselor] = React.useState<CatalogCounselorView | null>(
    null
  )

  // Counselor type comparison info modal
  const [showTypeInfoModal, setShowTypeInfoModal] = React.useState(false)

  // Tomorrow & Day after strings
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

  const isFiltered = typeFilter !== "all" || dateFilter !== "" || searchQuery.trim() !== ""

  // Client-side search filtering across names, roles, and specializations
  const filteredCounselors = React.useMemo(() => {
    if (!searchQuery.trim()) return counselors
    const q = searchQuery.toLowerCase()
    return counselors.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.role && c.role.toLowerCase().includes(q)) ||
        c.title.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        c.specializations.some((s) => s.toLowerCase().includes(q))
    )
  }, [counselors, searchQuery])

  // Count available by type for badges
  const peerCount = React.useMemo(
    () => counselors.filter((c) => c.counselorType === "peer").length,
    [counselors]
  )
  const psychologistCount = React.useMemo(
    () => counselors.filter((c) => c.counselorType === "psychologist").length,
    [counselors]
  )

  return (
    <PublicShell>
      {/* 1. Hero Section - Distilled, Confident & Reassuring */}
      <section className="border-b border-border/60 py-12 sm:py-16 bg-linear-to-b from-purple-50/40 via-background to-background dark:from-purple-950/20 dark:via-background dark:to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-4">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight text-balance">
            Temukan Mitra Konselor &amp; Jadwal Sesi
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed text-pretty">
            Konsultasi privat 90 menit via Zoom dengan psikolog klinis berizin resmi atau konselor sebaya tersertifikasi. Tanpa registrasi akun.
          </p>

          {/* 3 Core Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-xs text-foreground/80">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/60 font-medium">
              <Clock className="size-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>90 Menit Penuh</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/60 font-medium">
              <Lock className="size-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>100% Rahasia &amp; Anonim</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/60 font-medium">
              <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>Tautan Zoom Otomatis</span>
            </span>
          </div>

          {/* Distinction helper button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTypeInfoModal(true)}
              className="text-xs text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer underline underline-offset-4 decoration-border hover:decoration-purple-500"
            >
              <HelpCircle className="size-3.5" aria-hidden="true" />
              <span>Bingung memilih Konselor Sebaya vs Psikolog Klinis?</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Catalog Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-6">
        {/* Connected Screening Banner (if client previously completed screening) */}
        {initialScreeningId && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-foreground">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-emerald-950 dark:text-emerald-200">
                  Hasil skrining SRQ-20 Anda tersimpan
                </span>
                <span className="text-muted-foreground">
                  {initialRecommendedType && (
                    <>
                      Rekomendasi kebutuhan:{" "}
                      <strong className="text-foreground">
                        {initialRecommendedType === "psychologist"
                          ? "Psikolog Klinis"
                          : "Konselor Sebaya"}
                      </strong>
                      .{" "}
                    </>
                  )}
                  Data skrining akan otomatis dilampirkan ke konselor saat Anda memilih jadwal.
                </span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0 rounded-full">
              <Link href={`/screening?screeningId=${initialScreeningId}`}>
                Lihat Hasil Evaluasi
              </Link>
            </Button>
          </div>
        )}

        {/* Unified Filter Bar */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  typeFilter === "all"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                Semua Mitra <span className="tabular-nums opacity-90">({counselors.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("peer")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === "peer"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                <span className="size-1.5 rounded-full bg-blue-400" />
                <span>Konselor Sebaya</span>
                <span className="text-[11px] opacity-80 tabular-nums">(Mulai Rp 35rb)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("psychologist")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === "psychologist"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                <span className="size-1.5 rounded-full bg-purple-400" />
                <span>Psikolog Klinis</span>
                <span className="text-[11px] opacity-80 tabular-nums">(Rp 150rb)</span>
              </button>
            </div>

            {/* Keyword Search with Clear Icon */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari topik, keahlian, atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9.5 pr-8 text-xs h-10 rounded-full border-border/80 bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Date Filter & Reset Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-border/60 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5 mr-1">
                <CalendarIcon className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Waktu Praktik:</span>
              </span>

              <button
                type="button"
                onClick={() => handleDateChange("")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  dateFilter === ""
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                Kapan Saja
              </button>

              <button
                type="button"
                onClick={() => handleDateChange(tomorrowStr)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  dateFilter === tomorrowStr
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                Besok
              </button>

              <button
                type="button"
                onClick={() => handleDateChange(dayAfterStr)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  dateFilter === dayAfterStr
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-secondary hover:bg-secondary/80 text-foreground"
                }`}
              >
                Lusa
              </button>
            </div>

            {/* Custom Date Input and Reset */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground whitespace-nowrap text-xs">Pilih tanggal:</span>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={dateFilter}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-xs h-8.5 w-36 px-2.5 rounded-lg border-border/80 bg-background"
              />
              {isFiltered && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-purple-600 dark:text-purple-400 font-semibold hover:underline text-xs ml-1 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter & Session Duration Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Menampilkan <strong className="text-foreground tabular-nums">{filteredCounselors.length}</strong> mitra konselor aktif
            {dateFilter && ` dengan slot pada ${dateFilter}`}
          </span>
          <span className="hidden sm:inline font-medium">Durasi standar 90 menit per sesi</span>
        </div>

        {/* Counselors Grid */}
        {filteredCounselors.length === 0 ? (
          <div className="p-12 sm:p-16 text-center rounded-2xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3">
            <Clock className="size-10 text-muted-foreground/40" />
            <h2 className="font-heading text-lg font-bold text-foreground text-balance">
              Tidak Ada Jadwal yang Cocok
            </h2>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed text-pretty">
              Tidak ditemukan mitra konselor dengan kriteria filter saat ini. Coba ubah tanggal menjadi "Kapan Saja" atau reset filter pencarian.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-xs mt-2 rounded-full cursor-pointer"
            >
              Reset Semua Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-stretch">
            {filteredCounselors.map((counselor) => {
              const isPsychologist = counselor.counselorType === "psychologist"
              const avatarSrc =
                counselor.avatarR2Url ||
                (isPsychologist
                  ? DEFAULT_FALLBACK_PORTRAITS.psychologist
                  : DEFAULT_FALLBACK_PORTRAITS.peer)
              const hasSlots = counselor.availableSlots.length > 0
              const isHighlighted = targetCounselorId === counselor.id

              return (
                <Card
                  key={counselor.id}
                  id={`counselor-card-${counselor.id}`}
                  className={`group p-0 py-0 gap-0 ring-0 border shadow-xs hover:border-purple-500/40 hover:shadow-md transition-all flex flex-col justify-between rounded-2xl bg-card overflow-hidden ${
                    isHighlighted
                      ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md"
                      : "border-border/80"
                  }`}
                  style={{ paddingTop: 0 }}
                >
                  {/* 1. Top Cover / Portrait Photo (Flush to card top, identical to homepage) */}
                  <div
                    data-slot="card-cover"
                    className="relative w-full aspect-[4/3] bg-muted overflow-hidden shrink-0"
                  >
                    <img
                      src={avatarSrc}
                      alt={counselor.fullName}
                      width={600}
                      height={450}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Subtle Gradient Vignette at bottom of image for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                    {/* Top-left Counselor Type Badge (Proper inset to prevent corner clipping) */}
                    <div className="absolute top-3.5 left-3.5 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs ${
                          isPsychologist
                            ? "bg-purple-950/90 text-purple-200 border border-purple-400/40"
                            : "bg-blue-950/90 text-blue-200 border border-blue-400/40"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isPsychologist ? "bg-purple-400" : "bg-blue-400"
                          }`}
                        />
                        <span>{counselor.counselorTypeDisplay}</span>
                      </span>
                    </div>

                    {/* Top-right Rating Badge */}
                    <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-bold shadow-xs border border-white/15">
                      <Star className="size-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                      <span className="tabular-nums">{counselor.rating || (isPsychologist ? "4.9" : "4.8")}</span>
                    </div>

                    {/* Bottom Availability Status & Experience */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between text-xs font-medium text-white/95">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15">
                        <span
                          className={`size-2 rounded-full shrink-0 ${
                            hasSlots ? "bg-emerald-400 animate-pulse" : "bg-zinc-400"
                          }`}
                        />
                        <span>
                          {hasSlots
                            ? counselor.availableSoon || `${counselor.availableSlots.length} Slot Terbuka`
                            : "Jadwal Penuh"}
                        </span>
                      </div>
                      <span className="text-white/90 font-medium px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[11px]">
                        {counselor.experience || (isPsychologist ? "4+ Tahun" : "3+ Tahun")} Pengalaman
                      </span>
                    </div>
                  </div>

                  {/* 2. Counselor Details Underneath */}
                  <CardContent className="p-5 sm:p-6 flex flex-col gap-3.5 flex-1">
                    {/* Name, Role & Education (Standardized min-height for uniform alignment) */}
                    <div className="flex flex-col gap-1 min-h-[72px]">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-heading font-bold text-base sm:text-lg text-foreground tracking-tight line-clamp-1">
                          {counselor.fullName}
                        </h3>
                        <BadgeCheck
                          className="size-4.5 text-purple-600 dark:text-purple-400 shrink-0"
                          aria-label="Terverifikasi"
                        />
                      </div>
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 line-clamp-1">
                        {counselor.role || (isPsychologist ? "Psikolog Klinis Berizin Resmi" : "Konselor Sebaya (Partner Cerita)")}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {counselor.education || counselor.title}
                      </p>
                    </div>

                    {/* Specializations / Focus Areas */}
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                      {counselor.specializations.slice(0, 3).map((spec) => (
                        <span
                          key={spec}
                          className="text-xs font-medium text-muted-foreground px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/50 whitespace-nowrap"
                        >
                          {spec}
                        </span>
                      ))}
                      {counselor.specializations.length > 3 && (
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full tabular-nums">
                          +{counselor.specializations.length - 3} lainnya
                        </span>
                      )}
                    </div>

                    {/* Short Bio Snippet + Read Profile Link */}
                    <div className="flex flex-col gap-1 min-h-[56px] justify-between">
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-2 text-pretty">
                        {counselor.bio}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedBioCounselor(counselor)}
                        className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline self-start cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Baca profil lengkap</span>
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>

                    {/* Additional Catalog Detail: Interactive Schedule Slots Quick-Pick */}
                    <div className="pt-3 pb-1 flex flex-col gap-2.5 border-t border-border/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span>Pilihan Jadwal (90 Menit):</span>
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                          {counselor.availableSlots.length} slot terbuka
                        </span>
                      </div>

                      {!hasSlots ? (
                        <div className="p-3 rounded-xl bg-muted/30 border border-dashed border-border/70 text-center text-xs text-muted-foreground min-h-[92px] flex items-center justify-center">
                          Belum ada slot pada tanggal ini
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 min-h-[92px]">
                          {counselor.availableSlots.slice(0, 2).map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlotModal({ counselor, slot })}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-purple-500/10 hover:border-purple-500/60 transition-all text-left cursor-pointer group shadow-2xs"
                              title={`Pilih jadwal ${slot.date} pukul ${slot.timeRange}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="shrink-0 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-background border border-border/60 text-foreground/90 shadow-2xs">
                                  {formatSlotChipDate(slot.date, tomorrowStr, dayAfterStr)}
                                </span>
                                <span className="text-xs sm:text-[13px] font-bold text-foreground tabular-nums group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {slot.timeRange}
                                </span>
                              </div>
                              <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                          ))}

                          {counselor.availableSlots.length > 2 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedBioCounselor(counselor)}
                              className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline text-center py-0.5 transition-colors cursor-pointer"
                            >
                              +{counselor.availableSlots.length - 2} jadwal lainnya tersedia
                            </button>
                          ) : (
                            <div className="h-5" aria-hidden="true" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rate / Fee Row (Uniform height across cards with invisible balancer) */}
                    <div className="pt-3.5 mt-auto border-t border-border/60 flex items-center justify-between min-h-[50px]">
                      <div className="flex flex-col justify-center">
                        <span className="text-xs text-muted-foreground font-medium">
                          Tarif sesi (90 mnt):
                        </span>
                        {counselor.pricing.isSaleActive && counselor.pricing.originalPriceFormatted ? (
                          <span className="text-[11px] text-muted-foreground line-through tabular-nums leading-none pt-0.5">
                            {counselor.pricing.originalPriceFormatted}
                          </span>
                        ) : (
                          <span className="text-[11px] text-transparent select-none leading-none pt-0.5" aria-hidden="true">
                            -
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <strong className="text-foreground font-heading font-bold text-base sm:text-lg tabular-nums">
                          {counselor.pricing.displayPriceFormatted}
                        </strong>
                      </div>
                    </div>
                  </CardContent>

                  {/* 3. Action Button (Identical to Homepage Card) */}
                  <CardFooter className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <Button
                      type="button"
                      variant="public"
                      size="pill"
                      className="w-full cursor-pointer"
                      disabled={!hasSlots}
                      id={`btn-counselor-${counselor.id}`}
                      onClick={() => {
                        if (hasSlots) {
                          setSelectedSlotModal({
                            counselor,
                            slot: counselor.availableSlots[0],
                          })
                        }
                      }}
                    >
                      <span>
                        {hasSlots ? "Pilih Jadwal Konseling" : "Jadwal Sedang Penuh"}
                      </span>
                      <ArrowRight className="size-3.5" data-icon="inline-end" aria-hidden="true" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Modal Detail Profil Lengkap Konselor */}
      <Dialog
        open={!!selectedBioCounselor}
        onOpenChange={(open) => !open && setSelectedBioCounselor(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedBioCounselor && (
            <div className="flex flex-col gap-5 py-1">
              <div className="flex items-start gap-4">
                <img
                  src={
                    selectedBioCounselor.avatarR2Url ||
                    (selectedBioCounselor.counselorType === "psychologist"
                      ? DEFAULT_FALLBACK_PORTRAITS.psychologist
                      : DEFAULT_FALLBACK_PORTRAITS.peer)
                  }
                  alt={selectedBioCounselor.fullName}
                  className="size-20 rounded-2xl object-cover ring-2 ring-purple-500/20 shrink-0"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-heading font-bold text-base sm:text-lg text-foreground">
                      {selectedBioCounselor.fullName}
                    </h3>
                    <BadgeCheck className="size-4.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs w-fit py-0.5 px-2.5 font-semibold rounded-full ${
                      selectedBioCounselor.counselorType === "psychologist"
                        ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    }`}
                  >
                    {selectedBioCounselor.counselorTypeDisplay}
                  </Badge>
                  <p className="text-xs text-muted-foreground pt-0.5">
                    {selectedBioCounselor.title}
                  </p>
                </div>
              </div>

              {/* Bio & Pendekatan */}
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="font-bold text-foreground">Tentang &amp; Pendekatan Konseling:</span>
                <p className="text-muted-foreground leading-relaxed text-pretty">
                  {selectedBioCounselor.bio}
                </p>
              </div>

              {/* Bidang Keahlian */}
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-bold text-foreground">Fokus Topik / Spesialisasi:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBioCounselor.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-2.5 py-1 rounded-full bg-secondary text-xs text-foreground/90 font-medium border border-border/50"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Available Slots List inside Profile */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/60 text-xs">
                <span className="font-bold text-foreground flex items-center justify-between">
                  <span>Jadwal Tersedia (90 Menit):</span>
                  <span className="text-muted-foreground font-normal tabular-nums">
                    {selectedBioCounselor.availableSlots.length} slot terbuka
                  </span>
                </span>

                {selectedBioCounselor.availableSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Belum ada slot terbuka untuk konselor ini saat ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedBioCounselor.availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          const c = selectedBioCounselor
                          setSelectedBioCounselor(null)
                          setSelectedSlotModal({ counselor: c, slot })
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-purple-600 hover:bg-purple-500/5 transition-all text-left text-xs cursor-pointer group shadow-2xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground tabular-nums group-hover:text-purple-600 transition-colors">
                            {slot.timeRange}
                          </span>
                          <span className="text-muted-foreground text-[11px] tabular-nums">
                            {slot.date}
                          </span>
                        </div>
                        <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBioCounselor(null)}
                  className="w-full text-xs rounded-full cursor-pointer"
                >
                  Tutup Profil
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 4. Modal Konfirmasi Pilihan Slot (Menuju Booking Flow) */}
      <Dialog
        open={!!selectedSlotModal}
        onOpenChange={(open) => !open && setSelectedSlotModal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2 text-balance">
              <CheckCircle2 className="size-4.5 text-purple-600 dark:text-purple-400" />
              <span>Konfirmasi Pilihan Jadwal Konseling</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 text-pretty">
              Jadwal yang Anda pilih diamankan selama 15 menit agar tidak diambil pengguna lain selama pengisian formulir.
            </DialogDescription>
          </DialogHeader>

          {selectedSlotModal && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-foreground text-sm">
                    {selectedSlotModal.counselor.fullName}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] py-0.5 px-2 font-medium rounded-full ${
                      selectedSlotModal.counselor.counselorType === "psychologist"
                        ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    }`}
                  >
                    {selectedSlotModal.counselor.counselorTypeDisplay}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5 text-muted-foreground pt-2 border-t border-border/60">
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {selectedSlotModal.slot.date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu Sesi:</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {selectedSlotModal.slot.timeRange}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durasi:</span>
                    <span className="font-semibold text-foreground">90 Menit Penuh</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-border/40">
                    <span className="font-medium text-foreground">Total Biaya Sesi:</span>
                    <span className="font-heading font-bold text-sm sm:text-base text-foreground tabular-nums">
                      {selectedSlotModal.counselor.pricing.displayPriceFormatted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Privacy Reassurance Banner */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-xs">
                <ShieldCheck className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-pretty">
                  Ruang Zoom Pro privat otomatis dialokasikan ke email Anda setelah pembayaran. Identitas Anda 100% terjaga dan tanpa perlu membuat akun.
                </span>
              </div>

              {/* Optional Screening Hook */}
              {!initialScreeningId && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="text-pretty">
                      {isScreeningRequired
                        ? "Skrining SRQ-20 diwajibkan sebelum menyelesaikan booking."
                        : "Ingin memberi gambaran emosional sebelum konseling?"}
                    </span>
                  </div>
                  {!isScreeningRequired && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 underline px-1 shrink-0"
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
              className="text-xs h-9 rounded-full cursor-pointer"
            >
              Pilih Waktu Lain
            </Button>
            {isScreeningRequired && !initialScreeningId ? (
              <Button
                asChild
                variant="public"
                size="sm"
                className="text-xs h-9 gap-1.5 font-semibold rounded-full cursor-pointer"
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
                variant="public"
                size="sm"
                className="text-xs h-9 gap-1.5 font-semibold rounded-full cursor-pointer"
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

      {/* 5. Modal Penjelasan Perbedaan Konselor Sebaya vs Psikolog Klinis */}
      <Dialog open={showTypeInfoModal} onOpenChange={setShowTypeInfoModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <UserCheck className="size-4.5 text-purple-600 dark:text-purple-400" />
              <span>Konselor Sebaya vs Psikolog Klinis</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Pilih mitra yang paling sesuai dengan kebutuhan emosional dan kondisi Anda saat ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            {/* Peer Counselor Info Card */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  Konselor Sebaya (Partner Cerita)
                </span>
                <span className="font-bold text-foreground tabular-nums">Mulai Rp 35.000 / 90 mnt</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                Lulusan sarjana psikologi (S.Psi) yang tersertifikasi dalam peer counseling. Cocok untuk Anda yang butuh teman bicara suportif tanpa penghakiman untuk:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Curhat masalah relasi, pertemanan, dan keluarga</li>
                <li>Stres kuliah, skripsi, atau adaptasi dunia kerja baru</li>
                <li>Overthinking ringan dan quarter-life crisis</li>
                <li>Validasi emosi dan mencari sudut pandang segar</li>
              </ul>
            </div>

            {/* Psychologist Info Card */}
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-sm text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-purple-500" />
                  Psikolog Klinis Berizin Resmi
                </span>
                <span className="font-bold text-foreground tabular-nums">Rp 150.000 / 90 mnt</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                Magister Psikologi Profesi (M.Psi., Psikolog) dengan Surat Tanda Registrasi (STR) aktif dari Kemenkes. Wajib dipilih untuk:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Gejala kecemasan akut, panik, dan depresi berkepanjangan</li>
                <li>Pemulihan trauma masa lalu dan duka mendalam</li>
                <li>Burnout parah yang mengganggu fungsi keseharian</li>
                <li>Intervensi klinis terstruktur (CBT, ACT, Regulasi Emosi)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTypeInfoModal(false)}
              className="w-full text-xs rounded-full cursor-pointer"
            >
              Saya Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicShell>
  )
}
