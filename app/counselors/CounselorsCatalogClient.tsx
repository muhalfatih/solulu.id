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
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { PublicShell } from "@/components/public/public-shell"
import { cn } from "@/lib/utils"
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
  "Kecemasan",
  "Overthinking",
  "Burnout",
  "Quarter-life Crisis",
  "Relasi Asmara",
  "Keluarga",
  "Trauma",
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

// Semantic topic pill styling using primary & secondary design tokens
const getTopicChipClass = (isSelected: boolean) =>
  cn(
    "h-8 px-3.5 rounded-full text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    isSelected
      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
      : "bg-secondary/60 hover:bg-secondary text-secondary-foreground border border-border/70 hover:border-primary/40"
  )

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
  const [dateFilter, setDateFilter] = React.useState<string>("any")
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [isSearchingServer, setIsSearchingServer] = React.useState(false)
  const [isTopicsExpanded, setIsTopicsExpanded] = React.useState(false)

  // Booking schedule & slot selection modal
  const [scheduleModalCounselor, setScheduleModalCounselor] = React.useState<CatalogCounselorView | null>(null)
  const [modalSelectedDate, setModalSelectedDate] = React.useState<string>("")
  const [modalSelectedSlot, setModalSelectedSlot] = React.useState<CatalogSlot | null>(null)

  const handleOpenScheduleModal = React.useCallback(
    (counselor: CatalogCounselorView, initialSlot?: CatalogSlot | null) => {
      setScheduleModalCounselor(counselor)
      if (initialSlot) {
        setModalSelectedDate(initialSlot.date)
        setModalSelectedSlot(initialSlot)
      } else {
        const firstDate = counselor.availableSlots[0]?.date || ""
        setModalSelectedDate(firstDate)
        setModalSelectedSlot(null)
      }
    },
    []
  )

  const handleCloseScheduleModal = React.useCallback(() => {
    setScheduleModalCounselor(null)
    setModalSelectedDate("")
    setModalSelectedSlot(null)
  }, [])

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
          date: date && date !== "any" ? date : undefined,
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
    const targetDate = newDate || "any"
    setDateFilter(targetDate)
    syncServerCatalog(typeFilter, targetDate)
  }

  const handleTopicClick = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    )
  }

  const clearFilters = () => {
    setTypeFilter("all")
    setDateFilter("any")
    setSelectedTopics([])
    setSearchQuery("")
    syncServerCatalog("all", "any")
  }

  const isFiltered =
    typeFilter !== "all" ||
    (dateFilter !== "" && dateFilter !== "any") ||
    selectedTopics.length > 0 ||
    searchQuery.trim() !== ""

  // Comprehensive, instant client-side filtering across all fields & facets
  const filteredCounselors = React.useMemo(() => {
    return counselors.filter((c) => {
      // 1. Category / Type filter
      if (typeFilter !== "all" && c.counselorType !== typeFilter) {
        return false
      }

      // 2. Date availability filter
      if (dateFilter && dateFilter !== "any") {
        const hasSlotOnDate = c.availableSlots.some((slot) => slot.date === dateFilter)
        if (!hasSlotOnDate) return false
      }

      // 3. Dedicated Topic Populer filter (multi-select support)
      if (selectedTopics.length > 0) {
        const matchTopic = selectedTopics.some((topic) => {
          const targetTopic = topic.toLowerCase()
          return (
            c.specializations.some((s) => s.toLowerCase().includes(targetTopic)) ||
            (c.bio ? c.bio.toLowerCase().includes(targetTopic) : false) ||
            (c.role ? c.role.toLowerCase().includes(targetTopic) : false)
          )
        })
        if (!matchTopic) return false
      }

      // 4. Search query across name, role, title, bio, education, and specializations
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
  }, [counselors, typeFilter, dateFilter, selectedTopics, searchQuery])

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
            <span>Pilihan Konselor Terverifikasi Solulu</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] text-balance">
            Temukan Konselor yang Cocok Buatmu
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed text-pretty">
            Sesi ngobrol privat 90 menit via Zoom bareng Psikolog Klinis Berizin Resmi atau Teman Cerita Terlatih. Bebas cerita tanpa takut dihakimi, bisa langsung pilih jadwal tanpa ribet bikin akun.
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
                  Hasil cek kondisi emosionalmu sudah tersimpan
                </span>
                <span className="text-muted-foreground">
                  {initialRecommendedType && (
                    <>
                      Rekomendasi untukmu:{" "}
                      <strong className="text-foreground">
                        {initialRecommendedType === "psychologist"
                          ? "Psikolog Klinis"
                          : "Konselor Sebaya"}
                      </strong>
                      .{" "}
                    </>
                  )}
                  Catatan ini akan otomatis diteruskan ke konselormu saat kamu memilih jadwal.
                </span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0 rounded-full">
              <Link href={`/screening?screeningId=${initialScreeningId}`}>
                Lihat Hasil Cek Mandiri
              </Link>
            </Button>
          </div>
        )}

        {/* 3. Redesigned Unified Search & Filter Command Center */}
        {/* 3. Unified Search & Filter Command Center */}
        <section
          aria-label="Filter dan Pencarian Konselor"
          className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-xs p-5 sm:p-6 flex flex-col gap-4.5 transition-all"
        >
          {/* Top Layer: Search Input & Accurate Status Telemetry */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="relative w-full sm:max-w-[420px]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                id="search-counselor-input"
                type="text"
                placeholder="Cari nama konselor atau keahlian..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 text-xs sm:text-sm h-10 sm:h-11 rounded-full border-border/80 bg-background/90 shadow-2xs focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer size-6 rounded-full hover:bg-muted/80 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.95]"
                  aria-label="Hapus kata kunci pencarian"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <span className="text-xs text-muted-foreground font-medium">
                Menampilkan <strong className="text-foreground tabular-nums font-semibold">{filteredCounselors.length}</strong> dari{" "}
                <span className="tabular-nums font-semibold text-foreground/90">{initialCounselors.length}</span> konselor
              </span>
            </div>
          </div>

          <div className="h-px bg-border/60 w-full" aria-hidden="true" />

          {/* Middle Layer: Structured Dual Segmented Controls (Pilihan Konseling & Waktu Praktik) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start lg:items-center">
            {/* Filter 1: Counselor Category / Type Segment */}
            <div className="lg:col-span-7 flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" aria-hidden="true" />
                <span>Pilihan Konseling:</span>
              </span>
              <ToggleGroup
                type="single"
                value={typeFilter}
                onValueChange={(val) => {
                  if (val) handleTypeChange(val as "all" | "peer" | "psychologist")
                }}
                aria-label="Pilihan Konseling"
                className="w-full sm:w-auto justify-start flex-wrap gap-1 p-1 rounded-xl bg-muted/60 border border-border/60"
              >
                <ToggleGroupItem
                  value="all"
                  id="btn-filter-all"
                  className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-background/80 hover:text-foreground active:scale-[0.98] data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:shadow-xs data-[state=on]:font-semibold transition-all cursor-pointer select-none"
                >
                  <span>Semua</span>
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="peer"
                  id="btn-filter-peer"
                  className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-background/80 hover:text-foreground active:scale-[0.98] data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:shadow-xs data-[state=on]:font-semibold transition-all cursor-pointer select-none inline-flex items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full transition-colors",
                      typeFilter === "peer" ? "bg-sky-200 ring-1 ring-white/50" : "bg-blue-500"
                    )}
                  />
                  <span>Konselor Sebaya</span>
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="psychologist"
                  id="btn-filter-psychologist"
                  className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-background/80 hover:text-foreground active:scale-[0.98] data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:shadow-xs data-[state=on]:font-semibold transition-all cursor-pointer select-none inline-flex items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full transition-colors",
                      typeFilter === "psychologist" ? "bg-purple-200 ring-1 ring-white/50" : "bg-purple-500"
                    )}
                  />
                  <span>Psikolog Klinis</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Filter 2: Date / Practice Schedule Segment */}
            <div className="lg:col-span-5 flex flex-col gap-2 lg:border-l lg:border-border/60 lg:pl-6">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-primary" aria-hidden="true" />
                <span>Waktu Praktik:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={dateFilter}
                  onValueChange={(val) => handleDateChange(val || "")}
                  aria-label="Waktu Praktik"
                  className="justify-start flex-wrap gap-1 p-1 rounded-xl bg-muted/60 border border-border/60"
                >
                  <ToggleGroupItem
                    value="any"
                    id="btn-date-any"
                    className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-background/80 hover:text-foreground active:scale-[0.98] data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:shadow-xs data-[state=on]:font-semibold transition-all cursor-pointer select-none"
                  >
                    Kapan Saja
                  </ToggleGroupItem>

                  <ToggleGroupItem
                    value={tomorrowStr}
                    id="btn-date-tomorrow"
                    className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-background/80 hover:text-foreground active:scale-[0.98] data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:shadow-xs data-[state=on]:font-semibold transition-all cursor-pointer select-none"
                  >
                    Besok
                  </ToggleGroupItem>

                  <ToggleGroupItem
                    value={dayAfterStr}
                    id="btn-date-dayafter"
                    className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-background/80 hover:text-foreground active:scale-[0.98] data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground data-[state=on]:shadow-xs data-[state=on]:font-semibold transition-all cursor-pointer select-none"
                  >
                    Lusa
                  </ToggleGroupItem>
                </ToggleGroup>

                <div className="flex items-center">
                  <Input
                    type="date"
                    id="input-custom-date"
                    min={new Date().toISOString().split("T")[0]}
                    value={dateFilter === "any" ? "" : dateFilter}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className={cn(
                      "text-xs h-8.5 w-34 px-2.5 rounded-lg shadow-2xs font-medium transition-all cursor-pointer border-border/80 bg-background/90",
                      dateFilter && dateFilter !== "any" && dateFilter !== tomorrowStr && dateFilter !== dayAfterStr
                        ? "border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/25"
                        : "hover:bg-muted text-foreground"
                    )}
                    title="Pilih tanggal khusus"
                    aria-label="Pilih tanggal praktik khusus"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60 w-full" aria-hidden="true" />

          {/* Bottom Layer: Dedicated Topik Populer Filter with Collapsible/Expandable view */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                <span>Topik Populer:</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Topik Populer">
              <button
                type="button"
                id="btn-topic-all"
                onClick={() => setSelectedTopics([])}
                aria-pressed={selectedTopics.length === 0}
                className={getTopicChipClass(selectedTopics.length === 0)}
              >
                <span>Semua Topik</span>
              </button>

              {POPULAR_TOPICS.map((topic, idx) => {
                const isSelected = selectedTopics.includes(topic)
                // In collapsed mode, display first 4 topics unless this topic is currently selected
                const isHiddenOnCollapse = !isTopicsExpanded && idx >= 4 && !isSelected
                if (isHiddenOnCollapse) return null

                return (
                  <button
                    key={topic}
                    type="button"
                    id={`btn-topic-${topic.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => handleTopicClick(topic)}
                    aria-pressed={isSelected}
                    className={getTopicChipClass(isSelected)}
                  >
                    <span>{topic}</span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => setIsTopicsExpanded(!isTopicsExpanded)}
                className="h-8 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 border border-dashed border-border/80 hover:border-border transition-colors cursor-pointer select-none"
                aria-expanded={isTopicsExpanded}
                aria-label={isTopicsExpanded ? "Sembunyikan topik tambahan" : "Lihat topik lainnya"}
              >
                {isTopicsExpanded ? (
                  <>
                    <span>Tutup</span>
                    <ChevronUp className="size-3" />
                  </>
                ) : (
                  <>
                    <span>+{POPULAR_TOPICS.length - 4} Topik Lainnya</span>
                    <ChevronDown className="size-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Filter Chips & Single Comprehensive Reset */}
          {isFiltered && (
            <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground font-medium mr-1">Filter aktif:</span>

                {typeFilter !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                    <span>{typeFilter === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya"}</span>
                    <button
                      type="button"
                      onClick={() => handleTypeChange("all")}
                      className="size-4 rounded-full inline-flex items-center justify-center hover:bg-primary/20 text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary active:scale-[0.95]"
                      aria-label="Hapus filter jenis mitra"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {dateFilter && dateFilter !== "any" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                    <span>
                      Tanggal: {formatSlotChipDate(dateFilter, tomorrowStr, dayAfterStr)} ({dateFilter})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDateChange("any")}
                      className="size-4 rounded-full inline-flex items-center justify-center hover:bg-primary/20 text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary active:scale-[0.95]"
                      aria-label="Hapus filter tanggal"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                {selectedTopics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                  >
                    <span>Topik: {topic}</span>
                    <button
                      type="button"
                      onClick={() => handleTopicClick(topic)}
                      className="size-4 rounded-full inline-flex items-center justify-center hover:bg-primary/20 text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary active:scale-[0.95]"
                      aria-label={`Hapus filter topik ${topic}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                    <span>Kata kunci: &ldquo;{searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="size-4 rounded-full inline-flex items-center justify-center hover:bg-primary/20 text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary active:scale-[0.95]"
                      aria-label="Hapus kata kunci pencarian"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-7 px-2.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary border border-border/70 inline-flex items-center gap-1.5 transition-colors cursor-pointer ml-1 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="size-3" />
                  <span>Reset Semua Filter</span>
                </button>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground font-medium text-xs">
                <Clock className="size-3.5 text-primary" />
                <span>Sesi 90 menit privat via Zoom</span>
              </span>
            </div>
          )}
        </section>

        {/* 4. Counselors Catalog Grid */}
        {filteredCounselors.length === 0 ? (
          <div className="p-12 sm:p-16 text-center rounded-2xl border border-dashed border-border bg-card flex flex-col items-center justify-center gap-3.5 shadow-2xs">
            <div className="size-12 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Search className="size-6" />
            </div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground text-balance">
              Belum Ada Konselor yang Cocok
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed text-pretty">
              Belum ada konselor yang pas dengan pilihan filtermu saat ini. Coba pilih &ldquo;Kapan Saja&rdquo; atau reset kata kunci pencarian untuk melihat semua jadwal yang ada.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="public"
                size="pill-sm"
                onClick={clearFilters}
                className="cursor-pointer"
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
              const sortedSlots = dateFilter && dateFilter !== "any"
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
                        className={`h-7 px-3 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs inline-flex items-center gap-1.5 select-none ${
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

                    {/* Bottom overlay: Availability Status & Experience */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-center justify-between text-xs font-medium text-white/95 select-none">
                      <div className="h-7 px-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 inline-flex items-center gap-1.5">
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
                      <span className="h-7 px-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-xs font-medium text-white/95 inline-flex items-center">
                        {counselor.experience || (isPsychologist ? "4+ Tahun" : "3+ Tahun")} Pengalaman
                      </span>
                    </div>
                  </div>

                  {/* Card Content & Details */}
                  <CardContent className="p-5 sm:p-6 flex flex-col gap-3.5 flex-1">
                    {/* Name, Role & Education */}
                    <div className="flex flex-col gap-1 min-h-[72px]">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/counselors/${counselor.id}`}
                          className="hover:underline group/name flex items-center gap-1.5 min-w-0"
                        >
                          <h3 className="font-heading font-semibold text-base sm:text-lg text-foreground tracking-tight line-clamp-1 group-hover/name:text-purple-600 transition-colors">
                            {counselor.fullName}
                          </h3>
                        </Link>
                        <BadgeCheck
                          className="size-4.5 text-purple-600 dark:text-purple-400 shrink-0"
                          aria-label="Terverifikasi"
                        />
                      </div>
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 line-clamp-1">
                        {counselor.role || (isPsychologist ? "Psikolog Klinis Berizin Resmi" : "Konselor Sebaya (Teman Cerita)")}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {counselor.education || counselor.title}
                      </p>
                    </div>

                    {/* Specializations / Focus Topic Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                      {counselor.specializations.slice(0, 3).map((spec) => {
                        const isSpecActive = selectedTopics.some(
                          (t) => t.toLowerCase() === spec.toLowerCase()
                        )
                        return (
                          <button
                            key={spec}
                            type="button"
                            onClick={() => handleTopicClick(spec)}
                            aria-pressed={isSpecActive}
                            className={cn(
                              "h-6 text-xs px-2.5 rounded-full transition-all whitespace-nowrap cursor-pointer inline-flex items-center select-none",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                              "active:scale-[0.97]",
                              isSpecActive
                                ? "bg-[#7c3aed] text-white border border-[#7c3aed] font-semibold shadow-2xs"
                                : "font-medium text-muted-foreground bg-secondary/80 border border-border/50 hover:border-purple-300 hover:text-purple-600 dark:hover:text-purple-300"
                            )}
                            title={`Filter topik ${spec}`}
                          >
                            {spec}
                          </button>
                        )
                      })}
                      {counselor.specializations.length > 3 && (
                        <span className="h-6 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 rounded-full tabular-nums inline-flex items-center select-none">
                          +{counselor.specializations.length - 3} lainnya
                        </span>
                      )}
                    </div>

                    {/* Short Bio Snippet */}
                    <div className="flex flex-col gap-1 min-h-[46px] justify-between">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 text-pretty">
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
                        <span className="text-xs font-normal text-muted-foreground tabular-nums">
                          {counselor.availableSlots.length} slot tersedia
                        </span>
                      </div>

                      {!hasSlots ? (
                        <div className="p-3 rounded-xl bg-muted/30 border border-dashed border-border/70 text-center text-xs text-muted-foreground min-h-[92px] flex items-center justify-center">
                          Belum ada jadwal di tanggal ini
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 min-h-[92px]">
                          {sortedSlots.slice(0, 2).map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => handleOpenScheduleModal(counselor, slot)}
                              className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-border/80 bg-muted/20 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all text-left cursor-pointer group shadow-2xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                              title={`Pilih jadwal ${slot.date} pukul ${slot.timeRange}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold bg-background border border-border/60 text-foreground/90 shadow-2xs">
                                  {formatSlotChipDate(slot.date, tomorrowStr, dayAfterStr)}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-foreground tabular-nums group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {slot.timeRange}
                                </span>
                              </div>
                              <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                          ))}

                          {counselor.availableSlots.length > 2 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleModal(counselor, null)}
                              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline text-center py-0.5 transition-colors cursor-pointer"
                            >
                              +{counselor.availableSlots.length - 2} pilihan jadwal lainnya
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
                      </div>
                      <div className="flex flex-col items-end">
                        <strong className="text-foreground font-heading font-bold text-base sm:text-lg tabular-nums">
                          {counselor.pricing.displayPriceFormatted}
                        </strong>
                        {counselor.pricing.isSaleActive && counselor.pricing.originalPriceFormatted && (
                          <span className="text-[11px] sm:text-xs text-muted-foreground line-through tabular-nums leading-tight">
                            {counselor.pricing.originalPriceFormatted}
                          </span>
                        )}
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
                      className="w-full"
                      disabled={!hasSlots}
                      id={`btn-counselor-${counselor.id}`}
                      onClick={() => {
                        if (hasSlots) {
                          handleOpenScheduleModal(counselor, null)
                        }
                      }}
                    >
                      <span>
                        {hasSlots ? "Pilih Jadwal Sesi" : "Jadwal Sedang Penuh"}
                      </span>
                      <ArrowRight data-icon="inline-end" aria-hidden="true" />
                    </Button>

                    {/* Secondary Button: Buka Detail Lengkap Konselor */}
                    <Button
                      variant="public-secondary"
                      size="pill"
                      className="w-full"
                      id={`btn-detail-${counselor.id}`}
                      asChild
                    >
                      <Link href={`/counselors/${counselor.id}`}>
                        <UserCheck data-icon="inline-start" aria-hidden="true" />
                        <span>Lihat Profil Lengkap</span>
                      </Link>
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
              Informasi izin praktik resmi, latar belakang pendidikan, spesialisasi, dan pendekatan konseling.
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
                  <Clock className="size-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <div className="text-[11px] text-muted-foreground">Durasi Konseling</div>
                    <div className="font-semibold text-foreground">
                      90 Menit Penuh
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Approach */}
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="size-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Tentang &amp; Pendekatan Sesi:</span>
                </span>
                <p className="text-muted-foreground leading-relaxed text-pretty bg-background p-3.5 rounded-xl border border-border/60">
                  {selectedBioCounselor.bio}
                </p>
              </div>

              {/* Focus Areas */}
              <div className="flex flex-col gap-2 text-xs">
                <span className="font-bold text-foreground">Fokus Masalah &amp; Spesialisasi:</span>
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
                    <span>Jadwal Tersedia (90 Menit):</span>
                  </span>
                  <span className="text-muted-foreground font-normal tabular-nums">
                    {selectedBioCounselor.availableSlots.length} slot tersedia
                  </span>
                </span>

                {selectedBioCounselor.availableSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-3 bg-muted/20 rounded-xl text-center">
                    Belum ada jadwal terbuka untuk konselor ini saat ini.
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
                          handleOpenScheduleModal(c, slot)
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-purple-600 hover:bg-purple-500/10 transition-all text-left text-xs cursor-pointer group shadow-2xs active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
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
                <span className="text-muted-foreground">Biaya Sesi (90 Menit):</span>
                <div className="flex flex-col items-end">
                  <strong className="text-foreground font-heading font-bold text-sm sm:text-base tabular-nums">
                    {selectedBioCounselor.pricing.displayPriceFormatted}
                  </strong>
                  {selectedBioCounselor.pricing.isSaleActive && selectedBioCounselor.pricing.originalPriceFormatted && (
                    <span className="text-[11px] text-muted-foreground line-through tabular-nums leading-tight">
                      {selectedBioCounselor.pricing.originalPriceFormatted}
                    </span>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="pill-sm"
                  onClick={() => setSelectedBioCounselor(null)}
                  className="w-full sm:w-auto cursor-pointer"
                >
                  Tutup
                </Button>
                {selectedBioCounselor.availableSlots.length > 0 && (
                  <Button
                    variant="public"
                    size="pill-sm"
                    onClick={() => {
                      const c = selectedBioCounselor
                      setSelectedBioCounselor(null)
                      handleOpenScheduleModal(c, null)
                    }}
                    className="w-full sm:w-auto cursor-pointer"
                  >
                    <span>Pilih Jadwal Sesi</span>
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Modal Pemilihan Jadwal Sesi (Schedule Picker Modal) */}
      <Dialog
        open={!!scheduleModalCounselor}
        onOpenChange={(open) => !open && handleCloseScheduleModal()}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-base sm:text-lg font-bold flex items-center gap-2 text-balance">
              <CalendarDays className="size-5 text-purple-600 dark:text-purple-400" />
              <span>Pilih Jadwal Sesi Konseling</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 text-pretty">
              Pilih tanggal dan jam sesi yang paling nyaman untuk Anda. Sesi berdurasi 90 menit penuh via Zoom privat.
            </DialogDescription>
          </DialogHeader>

          {scheduleModalCounselor && (
            <div className="flex flex-col gap-4 py-2 text-xs">
              {/* Counselor Header Summary */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-11 rounded-xl overflow-hidden bg-primary/10 border border-border/80 shrink-0">
                    <img
                      src={
                        scheduleModalCounselor.avatarR2Url ||
                        DEFAULT_FALLBACK_PORTRAITS[scheduleModalCounselor.counselorType] ||
                        DEFAULT_FALLBACK_PORTRAITS.peer
                      }
                      alt={scheduleModalCounselor.fullName}
                      className="size-full object-cover object-top"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-heading font-semibold text-foreground text-sm truncate">
                      {scheduleModalCounselor.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {scheduleModalCounselor.title}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-xs py-0.5 px-2 font-medium rounded-full mb-1 ${
                      scheduleModalCounselor.counselorType === "psychologist"
                        ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                        : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    }`}
                  >
                    {scheduleModalCounselor.counselorTypeDisplay}
                  </Badge>
                  <strong className="text-foreground font-heading font-bold text-sm sm:text-base tabular-nums">
                    {scheduleModalCounselor.pricing.displayPriceFormatted}
                  </strong>
                </div>
              </div>

              {/* Step 1: Pilihan Tanggal & Step 2: Pilihan Jam Sesi */}
              {(() => {
                const uniqueDates = Array.from(
                  new Set(scheduleModalCounselor.availableSlots.map((s) => s.date))
                ).sort()

                const activeDate = modalSelectedDate || uniqueDates[0] || ""
                const slotsOnActiveDate = scheduleModalCounselor.availableSlots
                  .filter((s) => s.date === activeDate)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))

                return (
                  <div className="flex flex-col gap-3.5">
                    {/* Tanggal */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-xs">
                          1. Pilih Tanggal:
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {uniqueDates.length} hari tersedia
                        </span>
                      </div>

                      {uniqueDates.length === 0 ? (
                        <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border text-center text-xs text-muted-foreground">
                          Belum ada jadwal tersedia untuk konselor ini.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueDates.map((dateStr) => {
                            const isSelected = dateStr === activeDate
                            const slotsCount = scheduleModalCounselor.availableSlots.filter(
                              (s) => s.date === dateStr
                            ).length

                            return (
                              <button
                                key={dateStr}
                                type="button"
                                onClick={() => {
                                  setModalSelectedDate(dateStr)
                                  if (modalSelectedSlot && modalSelectedSlot.date !== dateStr) {
                                    setModalSelectedSlot(null)
                                  }
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left flex items-center gap-2",
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                    : "bg-muted/30 hover:bg-muted/60 text-foreground border-border/80"
                                )}
                              >
                                <span>{formatSlotChipDate(dateStr, tomorrowStr, dayAfterStr)}</span>
                                <span
                                  className={cn(
                                    "text-xs px-1.5 py-0.2 rounded-full tabular-nums",
                                    isSelected
                                      ? "bg-primary-foreground/20 text-primary-foreground"
                                      : "bg-background/80 text-muted-foreground border border-border/60"
                                  )}
                                >
                                  {slotsCount}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Jam Sesi */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-xs">
                          2. Pilih Jam Sesi (90 Menit):
                        </span>
                        {modalSelectedSlot && (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" />
                            <span>Jam dipilih: {modalSelectedSlot.timeRange}</span>
                          </span>
                        )}
                      </div>

                      {slotsOnActiveDate.length === 0 ? (
                        <div className="p-3 rounded-xl bg-muted/20 border border-dashed border-border text-center text-xs text-muted-foreground">
                          Tidak ada jam sesi yang tersedia di tanggal ini.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {slotsOnActiveDate.map((slot) => {
                            const isChosen = modalSelectedSlot?.id === slot.id

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setModalSelectedSlot(slot)}
                                className={cn(
                                  "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                                  isChosen
                                    ? "bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-600/30 font-bold"
                                    : "bg-muted/20 hover:bg-purple-500/10 hover:border-purple-500/40 text-foreground border-border/80"
                                )}
                              >
                                <span className="text-xs sm:text-sm tabular-nums font-semibold">
                                  {slot.timeRange}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs",
                                    isChosen ? "text-purple-100" : "text-muted-foreground"
                                  )}
                                >
                                  {isChosen ? "✓ Terpilih" : "Tersedia"}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Ringkasan Konfirmasi */}
                    {modalSelectedSlot ? (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 font-semibold text-xs">
                          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            Jadwal Terpilih: {formatSlotChipDate(modalSelectedSlot.date, tomorrowStr, dayAfterStr)}, {modalSelectedSlot.timeRange}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed pl-6">
                          Tautan Zoom privat otomatis disiapkan dan dikirimkan ke email Anda setelah pembayaran terkonfirmasi.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                        <HelpCircle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Silakan klik salah satu jam sesi di atas untuk melanjutkan pemesanan.</span>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Optional Screening Hook */}
              {!initialScreeningId && modalSelectedSlot && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="text-pretty">
                      {isScreeningRequired
                        ? "Cek kondisi emosional diwajibkan sebelum menyelesaikan pemesanan."
                        : "Mau beri gambaran perasaanmu sebelum sesi dimulai?"}
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
                        href={`/screening?counselorId=${scheduleModalCounselor.id}&scheduleId=${modalSelectedSlot.id}`}
                      >
                        Isi Cek Mandiri Dulu
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="pill-sm"
              onClick={handleCloseScheduleModal}
              className="w-full sm:w-auto cursor-pointer"
            >
              Batal
            </Button>
            {modalSelectedSlot ? (
              isScreeningRequired && !initialScreeningId ? (
                <Button
                  asChild
                  variant="public"
                  size="pill-sm"
                  className="w-full sm:w-auto cursor-pointer"
                >
                  <Link
                    href={`/screening?counselorId=${scheduleModalCounselor?.id}&scheduleId=${modalSelectedSlot.id}`}
                  >
                    <span>Lanjut ke Cek Mandiri (Wajib)</span>
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="public"
                  size="pill-sm"
                  className="w-full sm:w-auto cursor-pointer"
                >
                  <Link
                    href={`/booking?counselorId=${scheduleModalCounselor?.id}&scheduleId=${modalSelectedSlot.id}${
                      initialScreeningId ? `&screeningId=${initialScreeningId}` : ""
                    }`}
                  >
                    <span>Lanjut Isi Data Sesi</span>
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              )
            ) : (
              <Button
                type="button"
                variant="public"
                size="pill-sm"
                disabled
                className="w-full sm:w-auto opacity-50 cursor-not-allowed"
              >
                <span>Pilih Jam Sesi Dahulu</span>
                <ArrowRight data-icon="inline-end" />
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
              Keduanya siap mendengarkan tanpa menghakimi. Pilih yang paling sesuai dengan kebutuhanmu saat ini.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            {/* Peer Counselor Info Card */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-blue-500" />
                  Konselor Sebaya (Teman Cerita)
                </span>
                <span className="font-bold text-foreground tabular-nums">Rp 85.000 / 90 mnt</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                Lulusan sarjana psikologi terlatih. Cocok banget buat kamu yang butuh teman ngobrol suportif tanpa dihakimi untuk:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Curhat masalah hubungan, pertemanan, dan keluarga</li>
                <li>Stres kuliah, skripsi, atau adaptasi di dunia kerja baru</li>
                <li>Overthinking ringan dan rasa bimbang usia 20-an</li>
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
                <span className="font-bold text-foreground tabular-nums">Rp 130.000 / 90 mnt</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-pretty">
                Magister Psikologi Profesi dengan izin praktik resmi Kemenkes. Tepat dipilih jika kamu menghadapi:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Rasa cemas intens, serangan panik, dan kesedihan berkepanjangan</li>
                <li>Pemulihan trauma masa lalu dan rasa duka mendalam</li>
                <li>Kelelahan mental berat (burnout) yang mengganggu aktivitas sehari-hari</li>
                <li>Pendampingan terstruktur dengan metode psikologi profesional</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="public"
              size="pill-sm"
              onClick={() => setShowTypeInfoModal(false)}
              className="w-full sm:w-auto cursor-pointer"
            >
              Saya Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicShell>
  )
}
