"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  HeartHandshake,
  Lock,
  MessageCircle,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  Check,
  ChevronRight,
  Headphones,
  FileCheck2,
  HelpCircle,
} from "lucide-react"

import type { CatalogCounselorView, CatalogSlot } from "../actions"
import type { PlatformSettingsData } from "@/lib/settings/platform"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface CounselorDetailClientProps {
  counselor: CatalogCounselorView
  settings: PlatformSettingsData
}

export default function CounselorDetailClient({
  counselor,
  settings,
}: CounselorDetailClientProps) {
  const router = useRouter()
  const isPsychologist = counselor.counselorType === "psychologist"

  // Group slots by date
  const slotsByDate = React.useMemo(() => {
    const map = new Map<string, CatalogSlot[]>()
    for (const slot of counselor.availableSlots) {
      if (!map.has(slot.date)) {
        map.set(slot.date, [])
      }
      map.get(slot.date)!.push(slot)
    }
    // Sort slots by start time
    map.forEach((slots) => {
      slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    return map
  }, [counselor.availableSlots])

  const availableDates = React.useMemo(() => {
    return Array.from(slotsByDate.keys()).sort((a, b) => a.localeCompare(b))
  }, [slotsByDate])

  const [selectedDate, setSelectedDate] = React.useState<string>(
    availableDates[0] || ""
  )

  const activeDateSlots = React.useMemo(() => {
    return slotsByDate.get(selectedDate) || []
  }, [slotsByDate, selectedDate])

  const [selectedSlot, setSelectedSlot] = React.useState<CatalogSlot | null>(
    activeDateSlots[0] || null
  )

  // Update selected slot if date changes
  React.useEffect(() => {
    if (activeDateSlots.length > 0) {
      setSelectedSlot(activeDateSlots[0])
    } else {
      setSelectedSlot(null)
    }
  }, [selectedDate, activeDateSlots])

  // Helper date formatter in Indonesian
  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split("-")
      if (parts.length !== 3) return dateStr
      const d = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      )
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const target = new Date(d)
      target.setHours(0, 0, 0, 0)
      const diffDays = Math.round(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      let prefix = ""
      if (diffDays === 0) prefix = "Hari Ini • "
      else if (diffDays === 1) prefix = "Besok • "
      else if (diffDays === 2) prefix = "Lusa • "

      const formatted = d.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
      return `${prefix}${formatted}`
    } catch {
      return dateStr
    }
  }

  // Handle Proceed to Booking or Screening
  const handleProceedBooking = () => {
    if (!selectedSlot) return

    if (settings.isScreeningRequired) {
      router.push(
        `/screening?counselorId=${counselor.id}&scheduleId=${selectedSlot.id}`
      )
    } else {
      router.push(
        `/booking?counselorId=${counselor.id}&scheduleId=${selectedSlot.id}`
      )
    }
  }

  const bookingCardRef = React.useRef<HTMLDivElement>(null)
  const scrollToBooking = () => {
    if (bookingCardRef.current) {
      bookingCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  return (
    <div className="w-full pb-24 lg:pb-16 pt-4 sm:pt-6">
      {/* 1. Breadcrumbs & Top Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
          <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Beranda
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <Link
              href="/counselors"
              className="hover:text-foreground transition-colors"
            >
              Katalog Konselor
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">
              {counselor.fullName}
            </span>
          </nav>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs text-muted-foreground hover:text-foreground -mr-2"
          >
            <Link href="/counselors">
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              <span>Kembali ke Katalog</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Main 2-Column Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Distilled Clinical Profile & Credentials     */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 lg:gap-8">
            {/* 1. Core Profile & Clinical Approach Card */}
            <Card className="border-border/60 shadow-xs overflow-hidden bg-card rounded-2xl">
              <CardContent className="p-6 sm:p-7 lg:p-8">
                {/* Hero Header: Avatar + Identity */}
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 items-start">
                  {/* Avatar with Verified Badge */}
                  <div className="relative shrink-0 mx-auto sm:mx-0">
                    <div className="size-28 sm:size-32 rounded-2xl overflow-hidden ring-1 ring-border/80 shadow-xs bg-muted/40">
                      <img
                        src={
                          counselor.avatarR2Url ||
                          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
                        }
                        alt={counselor.fullName}
                        className="w-full h-full object-cover object-top"
                        loading="eager"
                      />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-background border border-border/80 shadow-2xs">
                      <BadgeCheck
                        className="size-4.5 text-purple-600/80 dark:text-purple-400"
                        aria-label="Profil Terverifikasi"
                      />
                    </div>
                  </div>

                  {/* Identity Info */}
                  <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left min-w-0 w-full">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3.5 sm:mb-4">
                      <Badge
                        variant="secondary"
                        className="px-2.5 py-0.5 font-medium text-xs border border-border/70 rounded-full gap-1.5 bg-secondary/60 text-secondary-foreground leading-normal"
                      >
                        {isPsychologist ? (
                          <ShieldCheck className="size-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <HeartHandshake className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span>{counselor.counselorTypeDisplay}</span>
                      </Badge>

                      <Badge
                        variant="outline"
                        className="px-2.5 py-0.5 text-xs text-muted-foreground rounded-full border-border/70 font-normal gap-1.5 flex items-center leading-normal"
                      >
                        <Lock className="size-3 text-muted-foreground shrink-0" />
                        <span>Kerahasiaan 100%</span>
                      </Badge>
                    </div>

                    {/* Headings Hierarchy with Generous Breathing Room */}
                    <div className="space-y-1.5 sm:space-y-2 mb-6 w-full">
                      <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                        {counselor.fullName}
                      </h1>

                      <p className="text-sm sm:text-base text-foreground/80 font-medium leading-relaxed">
                        {counselor.title}
                      </p>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex items-start justify-center sm:justify-start gap-1.5 pt-0.5">
                        <GraduationCap className="size-3.5 shrink-0 text-muted-foreground/80 mt-0.5" />
                        <span className="leading-relaxed">{counselor.education || counselor.title}</span>
                      </p>
                    </div>

                    {/* Stats Strip: Unified, Serene & Proportional */}
                    <div className="w-full grid grid-cols-3 gap-2.5 sm:gap-3.5 pt-5 sm:pt-6 border-t border-border/50">
                      <div className="p-2.5 sm:p-3.5 rounded-xl bg-muted/30 border border-border/50 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
                        <div className="size-8 sm:size-9 rounded-lg bg-background border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                          <Star className="size-3.5 sm:size-4 fill-foreground/70 text-foreground/70" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-normal leading-normal">Rating</div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground leading-normal">
                            {counselor.rating || "4.9"} / 5.0
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3.5 rounded-xl bg-muted/30 border border-border/50 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
                        <div className="size-8 sm:size-9 rounded-lg bg-background border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                          <Clock className="size-3.5 sm:size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-normal leading-normal">Pengalaman</div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground leading-normal">
                            {counselor.experience || "3+ Tahun"}
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3.5 rounded-xl bg-muted/30 border border-border/50 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
                        <div className="size-8 sm:size-9 rounded-lg bg-background border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                          <CheckCircle2 className="size-3.5 sm:size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground font-normal leading-normal">Durasi Sesi</div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground leading-normal">
                            90 Menit Penuh
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-7 sm:my-8 bg-border/50" />

                {/* Section: Tentang & Bio */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
                    <div className="size-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-purple-600 dark:text-purple-400 border border-violet-100/80 dark:border-violet-900/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <HeartHandshake className="size-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground tracking-tight leading-snug">
                      Tentang &amp; Filosofi Pendampingan
                    </h2>
                  </div>
                  <div className="p-4.5 sm:p-5 rounded-xl bg-muted/20 border border-border/50">
                    <p className="text-sm sm:text-base leading-relaxed text-foreground/85 text-pretty max-w-prose">
                      {counselor.bio}
                    </p>
                  </div>
                </div>

                <Separator className="my-7 sm:my-8 bg-border/50" />

                {/* Section: Fokus Masalah & Spesialisasi */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
                    <div className="size-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-purple-600 dark:text-purple-400 border border-violet-100/80 dark:border-violet-900/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="size-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground tracking-tight leading-snug">
                      Fokus Masalah &amp; Spesialisasi
                    </h2>
                  </div>
                  <div className="p-4 sm:p-4.5 rounded-xl bg-muted/20 border border-border/50">
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {counselor.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-full bg-violet-50 dark:bg-violet-950/50 text-purple-700 dark:text-purple-300 border border-violet-200/70 dark:border-violet-800/60 transition-colors"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator className="my-7 sm:my-8 bg-border/50" />

                {/* Section: Metode & Teori Pendekatan */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
                    <div className="size-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-purple-600 dark:text-purple-400 border border-violet-100/80 dark:border-violet-900/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <GraduationCap className="size-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground tracking-tight leading-snug">
                      Metode &amp; Teori Pendekatan Klinis
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
                      <div className="size-6 rounded-md bg-violet-100/80 dark:bg-violet-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3.5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          Cognitive Behavioral Therapy (CBT)
                        </strong>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Mengurai pola pikir distorsif dan kecemasan dengan restrukturisasi kognitif.
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
                      <div className="size-6 rounded-md bg-violet-100/80 dark:bg-violet-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3.5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          Client-Centered &amp; Empathic Listening
                        </strong>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Ruang aman tanpa penghakiman untuk memvalidasi emosi secara utuh.
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
                      <div className="size-6 rounded-md bg-violet-100/80 dark:bg-violet-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3.5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          Solution-Focused Brief Therapy (SFBT)
                        </strong>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Fokus pada perumusan langkah praktis yang dapat segera kamu terapkan.
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
                      <div className="size-6 rounded-md bg-violet-100/80 dark:bg-violet-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-3.5 stroke-[2.5]" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          Mindfulness &amp; Regulasi Stres
                        </strong>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Latihan pernapasan dan grounding saat menghadapi luapan kecemasan.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Kredensial Resmi & Panduan Sesi Card */}
            <Card className="border-border/60 shadow-xs bg-card overflow-hidden rounded-2xl">
              <CardContent className="p-6 sm:p-7 lg:p-8">
                {/* Section: Kredensial & Legalitas Praktik */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
                    <div className="size-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-purple-600 dark:text-purple-400 border border-violet-100/80 dark:border-violet-900/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <ShieldCheck className="size-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground tracking-tight leading-snug">
                      Kredensial &amp; Legalitas Praktik
                    </h2>
                  </div>

                  {/* 2-Column Credentials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-4">
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Gelar Pendidikan</span>
                      <strong className="text-foreground font-semibold text-sm sm:text-base leading-normal">
                        {counselor.education || counselor.title}
                      </strong>
                      <span className="text-xs text-muted-foreground leading-relaxed">Fakultas Psikologi Resmi Terakreditasi</span>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Izin &amp; Lisensi Praktik</span>
                      <strong className="text-foreground font-semibold text-sm sm:text-base leading-normal">
                        {isPsychologist
                          ? "Surat Tanda Registrasi (STR) Kemenkes Aktif"
                          : "Sertifikasi Fasilitator Sebaya & Komunitas"}
                      </strong>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5 leading-relaxed">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Status Kredensial Terverifikasi</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/50 text-xs sm:text-sm text-foreground/80 leading-relaxed flex items-start gap-3">
                    <Lock className="size-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Terikat <span className="font-semibold text-foreground">Kode Etik Psikologi Indonesia</span> serta kewajiban menjaga kerahasiaan identitas dan data klien secara absolut.
                    </span>
                  </div>
                </div>

                <Separator className="my-7 sm:my-8 bg-border/50" />

                {/* Section: Panduan Kesiapan Sebelum Sesi Online */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3.5 sm:mb-4">
                    <div className="size-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-purple-600 dark:text-purple-400 border border-violet-100/80 dark:border-violet-900/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <Headphones className="size-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground tracking-tight leading-snug">
                      Panduan Kesiapan Sebelum Sesi Online
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
                      <div className="size-7 rounded-lg bg-background border border-border/70 text-foreground/80 font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        1
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          Ruangan Privat &amp; Tenang
                        </strong>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Bebas dari lalu-lalang orang lain.
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
                      <div className="size-7 rounded-lg bg-background border border-border/70 text-foreground/80 font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        2
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          Gunakan Earphone / Headset
                        </strong>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Suara jernih dan privasi terjaga.
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
                      <div className="size-7 rounded-lg bg-background border border-border/70 text-foreground/80 font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        3
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          Koneksi Internet Stabil
                        </strong>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Wi-Fi atau kuota data memadai.
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 flex items-start gap-3">
                      <div className="size-7 rounded-lg bg-background border border-border/70 text-foreground/80 font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        4
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <strong className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                          Hadir 5 Menit Lebih Awal
                        </strong>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          Link Meet/Zoom via WA &amp; Email.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Distilled Sticky Reservation Card           */}
          {/* ========================================================= */}
          <div
            ref={bookingCardRef}
            className="lg:col-span-5 xl:col-span-4 sticky top-20 flex flex-col gap-4"
          >
            <Card className="border-border/60 shadow-xs bg-card overflow-hidden py-0 gap-0 rounded-2xl">
              <div className="bg-muted/30 px-6 py-5 sm:px-7 border-b border-border/50 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8.5 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-purple-600 dark:text-purple-400 border border-violet-100/80 dark:border-violet-900/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <Calendar className="size-4.5" />
                    </div>
                    <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground tracking-tight leading-snug">
                      Pilih Jadwal Sesi
                    </h2>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 px-3 py-1 text-xs font-medium text-foreground/80 border border-border/60 bg-background/90 rounded-full shadow-2xs"
                  >
                    90 Menit
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-11">
                  Ngobrol privat online via Zoom (90 Menit)
                </p>
              </div>

              <CardContent className="p-6 sm:p-7 flex flex-col gap-6">
                {/* 1. Pilih Tanggal (Available Dates) */}
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center justify-between mb-3 leading-normal">
                    <span>Pilihan Tanggal</span>
                    <span className="text-xs text-muted-foreground font-normal leading-normal">
                      {availableDates.length} hari tersedia
                    </span>
                  </div>

                  {availableDates.length === 0 ? (
                    <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center text-xs text-muted-foreground leading-relaxed">
                      Saat ini belum ada jadwal yang tersedia untuk konselor ini.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {availableDates.map((dateStr) => {
                        const isSelected = dateStr === selectedDate
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedDate(dateStr)}
                            className={cn(
                              "px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer text-left flex flex-col gap-0.5 leading-normal",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-muted/20 hover:bg-muted/50 text-foreground/90 border-border/70"
                            )}
                          >
                            <span className="leading-normal">{formatDateLabel(dateStr)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Pilih Jam Konseling (Slots) */}
                <div className="pt-5 sm:pt-6 border-t border-border/50">
                  <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center justify-between mb-3 leading-normal">
                    <span>Pilihan Jam Sesi</span>
                    <span className="text-xs text-muted-foreground font-normal tabular-nums leading-normal">
                      {activeDateSlots.length} slot terbuka
                    </span>
                  </div>

                  {activeDateSlots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/60 text-center text-xs text-muted-foreground leading-relaxed">
                      Tidak ada jam yang terbuka pada tanggal ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                      {activeDateSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={cn(
                              "px-4 py-3 rounded-xl border text-xs sm:text-sm transition-all text-left flex items-center justify-between cursor-pointer group leading-normal",
                              isSelected
                                ? "border-primary/70 bg-primary/5 text-foreground ring-1 ring-primary/20"
                                : "border-border/70 bg-background hover:border-border hover:bg-muted/30 text-foreground/90"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <Clock
                                className={cn(
                                  "size-3.5 shrink-0 transition-colors",
                                  isSelected
                                    ? "text-primary"
                                    : "text-muted-foreground group-hover:text-foreground"
                                )}
                              />
                              <span className="font-medium tabular-nums leading-normal">
                                {slot.timeRange}
                              </span>
                            </div>
                            {isSelected ? (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium leading-normal">
                                Terpilih
                              </span>
                            ) : (
                              <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Pricing Breakdown */}
                <div className="p-4.5 rounded-xl bg-muted/20 border border-border/50 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground leading-normal">
                    <span>Biaya Sesi (90 Menit):</span>
                    <span className="font-semibold text-foreground tabular-nums leading-normal">
                      {counselor.pricing.displayPriceFormatted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground leading-normal">
                    <span>Biaya Layanan:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 leading-normal">
                      Gratis
                    </span>
                  </div>

                  <div className="pt-2.5 mt-0.5 border-t border-border/50 flex items-baseline justify-between leading-normal">
                    <span className="text-xs sm:text-sm font-semibold text-foreground leading-normal">Total Biaya Sesi:</span>
                    <strong className="text-xl font-heading font-bold text-foreground tabular-nums leading-none">
                      {counselor.pricing.displayPriceFormatted}
                    </strong>
                  </div>
                </div>

                {/* 4. Action Button */}
                <Button
                  type="button"
                  variant="public"
                  size="pill"
                  disabled={!selectedSlot}
                  onClick={handleProceedBooking}
                  className="w-full"
                  id="btn-proceed-booking"
                >
                  <span>
                    {settings.isScreeningRequired
                      ? "Lanjut ke Cek Mandiri"
                      : "Lanjut Isi Data Sesi"}
                  </span>
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Button>

                {!selectedSlot && (
                  <p className="text-xs text-center text-muted-foreground leading-relaxed -mt-1">
                    Pilih salah satu jam di atas untuk melanjutkan pemesanan.
                  </p>
                )}

                {/* Guarantees Strip */}
                <div className="pt-1 flex flex-col gap-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-4 text-emerald-600/90 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">Bisa atur ulang jadwal (reschedule) maksimal 4 jam sebelum sesi.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="size-4 text-purple-600/90 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">Pembayaran mudah via QRIS, Virtual Account, atau Dompet Digital.</span>
                  </div>
                </div>

                {/* Distilled Integrated WhatsApp Support */}
                <div className="pt-3 border-t border-border/50 text-center text-xs text-muted-foreground leading-relaxed flex flex-wrap items-center justify-center gap-1.5">
                  <span>Butuh bantuan jadwal khusus?</span>
                  <a
                    href="https://wa.me/6281234567890?text=Halo%20Solulu,%20saya%20butuh%20bantuan%20jadwal%20konseling"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-0.5 leading-relaxed"
                  >
                    <span>Tanya Admin</span>
                    <ChevronRight className="size-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 3. Mobile Floating Bottom Bar for Fast Conversion */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t border-border/60 z-40 shadow-xs flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-normal leading-normal">Tarif (90 Mnt)</span>
          <strong className="text-base font-semibold text-foreground tabular-nums leading-normal">
            {counselor.pricing.displayPriceFormatted}
          </strong>
        </div>

        <Button
          type="button"
          variant="public"
          size="sm"
          onClick={() => {
            if (selectedSlot) {
              handleProceedBooking()
            } else {
              scrollToBooking()
            }
          }}
          className="rounded-full px-5 font-medium text-xs cursor-pointer shadow-xs"
        >
          <span>{selectedSlot ? "Lanjut Isi Data" : "Pilih Jadwal Sesi"}</span>
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
