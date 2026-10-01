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
  RotateCcw,
  GraduationCap,
  Award,
  Layers,
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

// Curated popular mental health topics for fast 1-click discovery
const POPULAR_TOPICS = [
  "Kecemasan (Anxiety)",
  "Depresi",
  "Burnout Karir",
  "Quarter-life Crisis",
  "Relasi Asmara",
  "Trauma",
  "Overthinking",
]

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

  // Master list of counselors
  const [counselors, setCounselors] = React.useState<CatalogCounselorView[]>(initialCounselors)
  const [typeFilter, setTypeFilter] = React.useState<"all" | "peer" | "psychologist">(
    initialRecommendedType || "all"
  )
  const [dateFilter, setDateFilter] = React.useState<string>("")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [isSearchingServer, setIsSearchingServer] = React.useState(false)

  // Booking slot selection modal
  const [selectedSlotModal, setSelectedSlotModal] = React.useState<{
    counselor: CatalogCounselorView
    slot: CatalogSlot
  } | null>(null)

  // Counselor full profile detail modal (opened via secondary button or card link)
  const [selectedBioCounselor, setSelectedBioCounselor] = React.useState<CatalogCounselorView | null>(
    null
  )

  // Counselor type comparison info modal
  const [showTypeInfoModal, setShowTypeInfoModal] = React.useState(false)

  // Tomorrow & Day after ISO date strings
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

  // Dynamic server synchronization (updates master list without breaking current client view on error)
  const syncServerCatalog = React.useCallback(
    async (type: "all" | "peer" | "psychologist", date: string) => {
      setIsSearchingServer(true)
      try {
        const res = await getCounselorsCatalogAction({
          type: type === "all" ? undefined : type,
          date: date || undefined,
        })
        if (res.success && res.data && res.data.length > 0) {
          setCounselors(res.data)
        }
      } catch (err) {
        console.warn("Client fetch catalog notice:", err)
      } finally {
        setIsSearchingServer(false)
      }
    },
    []
  )

  const handleTypeChange = (newType: "all" | "peer" | "psychologist") => {
    setTypeFilter(newType)
    syncServerCatalog(newType, dateFilter)
  }

  const handleDateChange = (newDate: string) => {
    setDateFilter(newDate)
    syncServerCatalog(typeFilter, newDate)
  }

  const handleTopicClick = (topic: string) => {
    if (searchQuery.toLowerCase() === topic.toLowerCase()) {
      setSearchQuery("")
    } else {
      setSearchQuery(topic)
    }
  }

  const clearFilters = () => {
    setTypeFilter("all")
    setDateFilter("")
    setSearchQuery("")
    syncServerCatalog("all", "")
  }

  const isFiltered = typeFilter !== "all" || dateFilter !== "" || searchQuery.trim() !== ""

  // Comprehensive, instant client-side filtering across all fields & facets
  const filteredCounselors = React.useMemo(() => {
    return counselors.filter((c) => {
      // 1. Category / Type filter
      if (typeFilter !== "all" && c.counselorType !== typeFilter) {
        return false
      }

      // 2. Date availability filter
      if (dateFilter) {
        const hasSlotOnDate = c.availableSlots.some((slot) => slot.date === dateFilter)
        if (!hasSlotOnDate) return false
      }

      // 3. Search query across name, role, title, bio, education, and specializations
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = c.fullName.toLowerCase().includes(q)
        const matchRole = c.role ? c.role.toLowerCase().includes(q) : false
        const matchTitle = c.title ? c.title.toLowerCase().includes(q) : false
        const matchBio = c.bio ? c.bio.toLowerCase().includes(q) : false
        const matchEducation = c.education ? c.education.toLowerCase().includes(q) : false
        const matchSpec = c.specializations.some((s) => s.toLowerCase().includes(q))

        if (!matchName && !matchRole && !matchTitle && !matchBio && !matchEducation && !matchSpec) {
          return false
        }
      }

      return true
    })
  }, [counselors, typeFilter, dateFilter, searchQuery])

  // Count by counselor type for badge telemetry
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
      {/* 1. Hero Section - Warm, Dignified, & Empathetic */}
      <section className="border-b border-border/60 py-12 sm:py-16 bg-gradient-to-b from-purple-50/50 via-background to-background dark:from-purple-950/20 dark:via-background dark:to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100/80 dark:bg-purple-900/40 border border-purple-200/60 dark:border-purple-800/40 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span>Katalog Mitra Terverifikasi #CeritaDiSolulu</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] text-balance">
            Temukan Mitra Konselor &amp; Jadwal Sesi
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed text-pretty">
            Konsultasi privat 90 menit via Zoom dengan psikolog klinis berizin resmi atau konselor sebaya tersertifikasi. Tanpa registrasi akun, 100% terjaga kerahasiaannya.
          </p>

          {/* 3 Core Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 text-xs text-foreground/85">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/70 font-medium shadow-2xs">
              <Clock className="size-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>90 Menit Penuh</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/70 font-medium shadow-2xs">
              <Lock className="size-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>100% Rahasia &amp; Anonim</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/70 font-medium shadow-2xs">
              <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>Tautan Zoom Otomatis</span>
            </span>
          </div>

          {/* Distinction helper button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowTypeInfoModal(true)}
              className="text-xs text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1 rounded-full hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-transparent hover:border-purple-200/50"
            >
              <HelpCircle className="size-3.5 text-purple-500" aria-hidden="true" />
              <span>Bingung memilih Konselor Sebaya vs Psikolog Klinis?</span>
              <ChevronRight className="size-3 opacity-70" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Catalog Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-6">
        {/* Connected Screening Banner (if client previously completed screening) */}
        {initialScreeningId && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-foreground">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
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

        {/* 3. Redesigned Unified Search & Filter Command Center */}
        <section
          aria-label="Filter dan Pencarian Konselor"
          className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xs p-5 sm:p-6 flex flex-col gap-5 transition-all"
        >
          {/* Top Layer: Prominent Smart Search Field */}
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-purple-600 dark:text-purple-400 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="search-counselor-input"
                type="text"
                placeholder="Cari psikolog, topik masalah (anxiety, burnout, overthinking, relasi), atau keahlian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-10 text-xs sm:text-sm h-11 sm:h-12 rounded-full border-border/80 bg-background/90 shadow-2xs focus-visible:border-purple-500 focus-visible:ring-purple-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Hapus pencarian"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Quick Topic Chips (Mental health topics clickable shortcuts) */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
              <span className="text-muted-foreground font-medium text-[11px] sm:text-xs shrink-0 flex items-center gap-1 mr-1">
                <Sparkles className="size-3 text-purple-600 dark:text-purple-400" />
                <span>Topik Populer:</span>
              </span>
              {POPULAR_TOPICS.map((topic) => {
                const isSelected = searchQuery.toLowerCase() === topic.toLowerCase()
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicClick(topic)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-purple-600 text-white border-purple-600 font-semibold shadow-2xs"
                        : "bg-secondary/70 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 text-muted-foreground border-border/60 font-medium"
                    }`}
                  >
                    {topic}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="h-px bg-border/60 w-full" aria-hidden="true" />

          {/* Bottom Layer: Structured Dual Filters (Jenis Mitra & Jadwal Sesi) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start lg:items-center">
            {/* Filter 1: Counselor Category / Type Segment */}
            <div className="lg:col-span-7 flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Jenis Mitra Konseling:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="btn-filter-all"
                  onClick={() => handleTypeChange("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    typeFilter === "all"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/60"
                  }`}
                >
                  Semua Mitra <span className="tabular-nums opacity-90">({counselors.length})</span>
                </button>

                <button
                  type="button"
                  id="btn-filter-peer"
                  onClick={() => handleTypeChange("peer")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    typeFilter === "peer"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/60"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-blue-400" />
                  <span>Konselor Sebaya</span>
                  <span className="text-[11px] opacity-80 tabular-nums">({peerCount} • Rp 35rb)</span>
                </button>

                <button
                  type="button"
                  id="btn-filter-psychologist"
                  onClick={() => handleTypeChange("psychologist")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    typeFilter === "psychologist"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/60"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-purple-400" />
                  <span>Psikolog Klinis</span>
                  <span className="text-[11px] opacity-80 tabular-nums">({psychologistCount} • Rp 150rb)</span>
                </button>
              </div>
            </div>

            {/* Filter 2: Date / Practice Schedule Segment */}
            <div className="lg:col-span-5 flex flex-col gap-1.5 lg:border-l lg:border-border/60 lg:pl-6">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Waktu Praktik:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="btn-date-any"
                  onClick={() => handleDateChange("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === ""
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/60"
                  }`}
                >
                  Kapan Saja
                </button>

                <button
                  type="button"
                  id="btn-date-tomorrow"
                  onClick={() => handleDateChange(tomorrowStr)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === tomorrowStr
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/60"
                  }`}
                >
                  Besok
                </button>

                <button
                  type="button"
                  id="btn-date-dayafter"
                  onClick={() => handleDateChange(dayAfterStr)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    dateFilter === dayAfterStr
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/60"
                  }`}
                >
                  Lusa
                </button>

                {/* Styled Native Date Picker for Custom Dates */}
                <div className="flex items-center">
                  <Input
                    type="date"
                    id="input-custom-date"
                    min={new Date().toISOString().split("T")[0]}
                    value={dateFilter}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="text-xs h-8 w-34 px-2.5 rounded-full border-border/80 bg-background text-foreground shadow-2xs"
                    title="Pilih tanggal khusus"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Chips & Live Telemetry Summary */}
          <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground font-medium">
                Menampilkan <strong className="text-foreground tabular-nums">{filteredCounselors.length}</strong> dari{" "}
                <span className="tabular-nums">{counselors.length}</span> mitra konselor
              </span>

              {isFiltered && (
                <div className="flex items-center gap-1.5 flex-wrap ml-1">
                  {typeFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-semibold">
                      <span>{typeFilter === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}</span>
                      <button
                        type="button"
                        onClick={() => handleTypeChange("all")}
                        className="hover:opacity-75 cursor-pointer"
                        aria-label="Hapus filter jenis mitra"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )}

                  {dateFilter && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-semibold">
                      <span>
                        Jadwal: {formatSlotChipDate(dateFilter, tomorrowStr, dayAfterStr)} ({dateFilter})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDateChange("")}
                        className="hover:opacity-75 cursor-pointer"
                        aria-label="Hapus filter tanggal"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )}

                  {searchQuery.trim() && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-semibold">
                      <span>Kata kunci: &ldquo;{searchQuery}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="hover:opacity-75 cursor-pointer"
                        aria-label="Hapus kata kunci pencarian"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-purple-600 dark:text-purple-400 font-semibold hover:underline text-xs inline-flex items-center gap-1 cursor-pointer ml-1"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset Semua</span>
                  </button>
                </div>
              )}
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
              <Clock className="size-3 text-purple-600 dark:text-purple-400" />
              <span>Sesi 90 menit penuh via Zoom privat</span>
            </span>
          </div>
        </section>

        {/* 4. Counselors Catalog Grid */}
        {filteredCounselors.length === 0 ? (
          <div className="p-12 sm:p-16 text-center rounded-2xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3.5 shadow-2xs">
            <div className="size-12 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Search className="size-6" />
            </div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground text-balance">
              Tidak Ada Mitra yang Cocok
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed text-pretty">
              Tidak ditemukan mitra konselor dengan kriteria filter saat ini. Coba pilih &ldquo;Kapan Saja&rdquo; atau reset kata kunci pencarian untuk melihat semua jadwal mitra.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs rounded-full cursor-pointer border-border/80"
              >
                <RotateCcw data-icon="inline-start" />
                <span>Reset Semua Filter</span>
              </Button>
            </div>
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

              // Sort slots so that slots matching dateFilter are prioritized
              const sortedSlots = dateFilter
                ? [...counselor.availableSlots].sort((a, b) => {
                    if (a.date === dateFilter && b.date !== dateFilter) return -1
                    if (b.date === dateFilter && a.date !== dateFilter) return 1
                    return 0
                  })
                : counselor.availableSlots

              return (
                <Card
                  key={counselor.id}
                  id={`counselor-card-${counselor.id}`}
                  className={`group p-0 py-0 gap-0 ring-0 border shadow-xs hover:border-purple-500/50 hover:shadow-md transition-all flex flex-col justify-between rounded-2xl bg-card overflow-hidden ${
                    isHighlighted
                      ? "border-purple-500 ring-2 ring-purple-500/25 shadow-md"
                      : "border-border/80"
                  }`}
                  style={{ paddingTop: 0 }}
                >
                  {/* Card Cover Photo (4:3 aspect ratio) */}
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
                    {/* Subtle Gradient Vignette at bottom for text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                    {/* Top-left: Role Badge */}
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

                    {/* Top-right: Rating Badge */}
                    <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-bold shadow-xs border border-white/15">
                      <Star className="size-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                      <span className="tabular-nums">{counselor.rating || (isPsychologist ? "4.9" : "4.8")}</span>
                    </div>

                    {/* Bottom overlay: Availability Status & Experience */}
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

                  {/* Card Content & Details */}
                  <CardContent className="p-5 sm:p-6 flex flex-col gap-3.5 flex-1">
                    {/* Name, Role & Education */}
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

                    {/* Specializations / Focus Topic Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                      {counselor.specializations.slice(0, 3).map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => handleTopicClick(spec)}
                          className="text-xs font-medium text-muted-foreground px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/50 hover:border-purple-300 hover:text-purple-600 dark:hover:text-purple-300 transition-colors whitespace-nowrap cursor-pointer"
                          title={`Cari topik ${spec}`}
                        >
                          {spec}
                        </button>
                      ))}
                      {counselor.specializations.length > 3 && (
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full tabular-nums">
                          +{counselor.specializations.length - 3} lainnya
                        </span>
                      )}
                    </div>

                    {/* Short Bio Snippet */}
                    <div className="flex flex-col gap-1 min-h-[46px] justify-between">
                      <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-2 text-pretty">
                        {counselor.bio}
                      </p>
                    </div>

                    {/* Interactive Schedule Slots Quick-Pick */}
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
                          {sortedSlots.slice(0, 2).map((slot) => (
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

                    {/* Rate / Fee Row */}
                    <div className="pt-3.5 mt-auto border-t border-border/60 flex items-center justify-between min-h-[48px]">
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

                  {/* Card Footer: Primary CTA + Secondary Detail Button */}
                  <CardFooter className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 flex flex-col gap-2.5">
                    {/* Primary Button: Pilih Jadwal */}
                    <Button
                      type="button"
                      variant="public"
                      size="pill"
                      className="w-full cursor-pointer font-semibold shadow-xs hover:shadow transition-all"
                      disabled={!hasSlots}
                      id={`btn-counselor-${counselor.id}`}
                      onClick={() => {
                        if (hasSlots) {
                          setSelectedSlotModal({
                            counselor,
                            slot: sortedSlots[0],
                          })
                        }
                      }}
                    >
                      <span>
                        {hasSlots ? "Pilih Jadwal Konseling" : "Jadwal Sedang Penuh"}
                      </span>
                      <ArrowRight data-icon="inline-end" aria-hidden="true" />
                    </Button>

                    {/* Secondary Button: Buka Detail Lengkap Konselor (Explicit User Requirement) */}
                    <Button
                      type="button"
                      variant="outline"
                      size="pill"
                      className="w-full cursor-pointer text-xs sm:text-sm font-semibold border-border/80 text-foreground hover:bg-purple-50/70 hover:text-purple-700 hover:border-purple-300 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-all shadow-2xs"
                      id={`btn-detail-${counselor.id}`}
                      onClick={() => setSelectedBioCounselor(counselor)}
                    >
                      <UserCheck data-icon="inline-start" aria-hidden="true" />
                      <span>Lihat Detail Lengkap Konselor</span>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* 5. Modal Detail Profil Lengkap Konselor */}
      <Dialog
        open={!!selectedBioCounselor}
        onOpenChange={(open) => !open && setSelectedBioCounselor(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <UserCheck className="size-5 text-purple-600 dark:text-purple-400" />
              <span>Profil Lengkap Konselor</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Informasi lisensi klinis, latar belakang pendidikan, spesialisasi, dan pendekatan konseling.
            </DialogDescription>
          </DialogHeader>

          {selectedBioCounselor && (
            <div className="flex flex-col gap-5 py-2">
              {/* Profile Card Header */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/70">
                <img
                  src={
                    selectedBioCounselor.avatarR2Url ||
                    (selectedBioCounselor.counselorType === "psychologist"
                      ? DEFAULT_FALLBACK_PORTRAITS.psychologist
                      : DEFAULT_FALLBACK_PORTRAITS.peer)
                  }
                  alt={selectedBioCounselor.fullName}
                  className="size-20 rounded-2xl object-cover ring-2 ring-purple-500/25 shrink-0 shadow-xs"
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

              {/* Badges / Experience & Rating */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-background border border-border/70 flex items-center gap-2.5">
                  <Award className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <div className="text-[11px] text-muted-foreground">Pengalaman</div>
                    <div className="font-semibold text-foreground">
                      {selectedBioCounselor.experience || "3+ Tahun"} Praktik
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border/70 flex items-center gap-2.5">
                  <Star className="size-4 text-amber-500 fill-amber-500 shrink-0" />
                  <div>
                    <div className="text-[11px] text-muted-foreground">Rating Klien</div>
                    <div className="font-semibold text-foreground">
                      {selectedBioCounselor.rating || "4.9"} / 5.0 (Puas)
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Approach */}
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Tentang &amp; Pendekatan Konseling:</span>
                </span>
                <p className="text-muted-foreground leading-relaxed text-pretty bg-background p-3.5 rounded-xl border border-border/60">
                  {selectedBioCounselor.bio}
                </p>
              </div>

              {/* Focus Areas */}
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-bold text-foreground">Fokus Topik / Spesialisasi:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBioCounselor.specializations.map((spec) => (
                    <span
                      key={spec}
                      className="px-3 py-1 rounded-full bg-secondary text-xs text-foreground/90 font-medium border border-border/60 shadow-2xs"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Available Slots List inside Profile */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/60 text-xs">
                <span className="font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Jadwal Praktik Tersedia (90 Menit):</span>
                  </span>
                  <span className="text-muted-foreground font-normal tabular-nums">
                    {selectedBioCounselor.availableSlots.length} slot terbuka
                  </span>
                </span>

                {selectedBioCounselor.availableSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-3 bg-muted/20 rounded-xl text-center">
                    Belum ada slot terbuka untuk mitra ini saat ini.
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
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-purple-600 hover:bg-purple-500/10 transition-all text-left text-xs cursor-pointer group shadow-2xs"
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

              {/* Pricing Notice */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tarif Resmi Sesi (90 Menit):</span>
                <strong className="text-foreground font-heading font-bold text-sm sm:text-base tabular-nums">
                  {selectedBioCounselor.pricing.displayPriceFormatted}
                </strong>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBioCounselor(null)}
                  className="w-full sm:w-auto text-xs rounded-full cursor-pointer"
                >
                  Tutup Profil
                </Button>
                {selectedBioCounselor.availableSlots.length > 0 && (
                  <Button
                    variant="public"
                    size="sm"
                    onClick={() => {
                      const c = selectedBioCounselor
                      setSelectedBioCounselor(null)
                      setSelectedSlotModal({
                        counselor: c,
                        slot: c.availableSlots[0],
                      })
                    }}
                    className="w-full sm:w-auto text-xs font-semibold rounded-full cursor-pointer"
                  >
                    <span>Pilih Jadwal Konseling</span>
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Modal Konfirmasi Pilihan Slot (Menuju Booking Flow) */}
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
                  <ArrowRight data-icon="inline-end" />
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
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Modal Penjelasan Perbedaan Konselor Sebaya vs Psikolog Klinis */}
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
