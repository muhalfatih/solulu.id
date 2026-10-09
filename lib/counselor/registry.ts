import { formatRupiah } from "@/lib/booking/checkout"
import {
  DEFAULT_PLATFORM_PRICING,
  type PlatformPricingData,
} from "@/lib/pricing/platform-pricing"

export interface CounselorSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  timeRange: string
  status?: "available" | "reserved" | "booked"
}

export interface CounselorStoreItem {
  id: string
  fullName: string
  title: string
  role: string
  counselorType: "peer" | "psychologist"
  counselorTypeDisplay: "Konselor Sebaya" | "Psikolog Klinis"
  education: string
  bio: string
  specializations: string[]
  avatarR2Url: string | null
  email: string
  phone: string
  strNumber?: string | null
  rating: string
  experience: string
  totalSessions: number
  joinedDate: string
  isActive: boolean
  isFeatured?: boolean
  slots?: CounselorSlot[]
}

import { getWIBDateString } from "@/lib/schedules/concurrency"

function getDynamicDates() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = getWIBDateString(tomorrow)

  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  const dayAfterStr = getWIBDateString(dayAfter)

  return { tomorrowStr, dayAfterStr }
}

export function getDefaultCounselors(): CounselorStoreItem[] {
  const { tomorrowStr, dayAfterStr } = getDynamicDates()

  return [
    {
      id: "c-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa",
      role: "Psikolog Klinis Berizin Resmi",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      education: "S2 Profesi Psikologi • Izin Kemenkes STR Terverifikasi",
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout).",
      specializations: ["Kecemasan (Anxiety)", "Depresi", "Trauma", "Burnout Karir"],
      avatarR2Url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
      email: "sarah.annisa@solulu.id",
      phone: "0812-3456-7890",
      strNumber: "1902837482910",
      rating: "4.9",
      experience: "4+ Tahun",
      totalSessions: 38,
      joinedDate: "12 Mei 2026",
      isActive: true,
      slots: [
        {
          id: "s-101",
          date: tomorrowStr,
          startTime: "09:00",
          endTime: "10:30",
          timeRange: "09:00 – 10:30 WIB",
          status: "available",
        },
        {
          id: "s-102",
          date: tomorrowStr,
          startTime: "19:00",
          endTime: "20:30",
          timeRange: "19:00 – 20:30 WIB",
          status: "available",
        },
        {
          id: "s-103",
          date: dayAfterStr,
          startTime: "13:30",
          endTime: "15:00",
          timeRange: "13:30 – 15:00 WIB",
          status: "available",
        },
      ],
    },
    {
      id: "c-2",
      fullName: "Rian Hidayat, S.Psi",
      title: "Konselor Sebaya Senior",
      role: "Konselor Sebaya (Teman Cerita)",
      counselorType: "peer",
      counselorTypeDisplay: "Konselor Sebaya",
      education: "Sarjana Psikologi (S.Psi) • Peer Counselor Indonesia",
      bio: "Berpengalaman mendampingi mahasiswa dan pekerja muda dalam menghadapi tekanan perkuliahan, quarter-life crisis, serta dinamika relasi asmara dan keluarga.",
      specializations: ["Quarter-life Crisis", "Stres Kuliah & Kerja", "Relasi Asmara", "Karir"],
      avatarR2Url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
      email: "rian.hidayat@solulu.id",
      phone: "0856-1122-3344",
      rating: "4.8",
      experience: "3+ Tahun",
      totalSessions: 24,
      joinedDate: "01 Juni 2026",
      isActive: true,
      slots: [
        {
          id: "s-201",
          date: tomorrowStr,
          startTime: "11:00",
          endTime: "12:30",
          timeRange: "11:00 – 12:30 WIB",
          status: "available",
        },
        {
          id: "s-202",
          date: tomorrowStr,
          startTime: "15:30",
          endTime: "17:00",
          timeRange: "15:30 – 17:00 WIB",
          status: "available",
        },
        {
          id: "s-203",
          date: dayAfterStr,
          startTime: "19:00",
          endTime: "20:30",
          timeRange: "19:00 – 20:30 WIB",
          status: "available",
        },
      ],
    },
    {
      id: "c-3",
      fullName: "Dr. Nadia Larasati, M.Psi",
      title: "Psikolog Klinis Dewasa",
      role: "Psikolog Klinis Berizin Resmi",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      education: "Doktor & Magister Psikologi • Izin Kemenkes STR Terverifikasi",
      bio: "Pendekatan berbasis bukti ilmiah untuk penanganan depresi ringan hingga sedang, pemulihan luka masa kecil, serta peningkatan self-esteem dan penerimaan diri.",
      specializations: ["Depresi Ringan-Sedang", "Insecurity", "Penerimaan Diri", "Regulasi Emosi"],
      avatarR2Url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600",
      email: "nadia.larasati@solulu.id",
      phone: "0813-9988-7766",
      strNumber: "1902837482999",
      rating: "5.0",
      experience: "6+ Tahun",
      totalSessions: 52,
      joinedDate: "15 Maret 2026",
      isActive: true,
      slots: [
        {
          id: "s-301",
          date: dayAfterStr,
          startTime: "10:00",
          endTime: "11:30",
          timeRange: "10:00 – 11:30 WIB",
          status: "available",
        },
        {
          id: "s-302",
          date: dayAfterStr,
          startTime: "14:00",
          endTime: "15:30",
          timeRange: "14:00 – 15:30 WIB",
          status: "available",
        },
      ],
    },
    {
      id: "c-4",
      fullName: "Nabila Safitri, S.Psi",
      title: "Konselor Sebaya Remaja",
      role: "Konselor Sebaya (Teman Cerita)",
      counselorType: "peer",
      counselorTypeDisplay: "Konselor Sebaya",
      education: "Sarjana Psikologi (S.Psi) • Fasilitator Komunitas Sejiwa",
      bio: "Fasilitator pendampingan emosional remaja dan dewasa awal dengan pendekatan empatik, mendengarkan aktif tanpa penghakiman, dan panduan regulasi emosi sehat.",
      specializations: ["Manajemen Emosi", "Keluarga", "Kecemasan Sosial", "Self-Acceptance"],
      avatarR2Url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600",
      email: "nabila.safitri@solulu.id",
      phone: "0877-4455-6677",
      rating: "4.9",
      experience: "3+ Tahun",
      totalSessions: 16,
      joinedDate: "20 Juli 2026",
      isActive: true,
      slots: [
        {
          id: "s-401",
          date: tomorrowStr,
          startTime: "13:30",
          endTime: "15:00",
          timeRange: "13:30 – 15:00 WIB",
          status: "available",
        },
        {
          id: "s-402",
          date: dayAfterStr,
          startTime: "16:00",
          endTime: "17:30",
          timeRange: "16:00 – 17:30 WIB",
          status: "available",
        },
      ],
    },
  ]
}

// In-memory store for instant synchronization across server actions and requests
let globalCounselorsStore: CounselorStoreItem[] = getDefaultCounselors()

export function getAllStoreCounselors(): CounselorStoreItem[] {
  return [...globalCounselorsStore]
}

export function getActiveStoreCounselors(
  typeFilter?: "all" | "peer" | "psychologist"
): CounselorStoreItem[] {
  let list = globalCounselorsStore.filter((c) => c.isActive)
  if (typeFilter && typeFilter !== "all") {
    list = list.filter((c) => c.counselorType === typeFilter)
  }
  return list
}

export function getStoreCounselorById(id: string): CounselorStoreItem | null {
  const found = globalCounselorsStore.find((c) => c.id === id)
  if (found) return found
  const lower = id.toLowerCase()
  return globalCounselorsStore.find((c) => c.id.toLowerCase() === lower) || null
}

export function upsertStoreCounselor(
  input: Partial<CounselorStoreItem> & { id: string; fullName: string }
): CounselorStoreItem {
  const existingIdx = globalCounselorsStore.findIndex((c) => c.id === input.id)
  const isPsychologist = input.counselorType === "psychologist"
  const defaultAvatar = isPsychologist
    ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600"
    : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600"

  const { tomorrowStr, dayAfterStr } = getDynamicDates()

  const formattedFullName = input.fullName.includes(",")
    ? input.fullName
    : input.title && (input.title.includes("Psi") || input.title.includes("Dr") || input.title.includes("S."))
      ? `${input.fullName}, ${input.title}`
      : input.fullName

  if (existingIdx >= 0) {
    const prev = globalCounselorsStore[existingIdx]
    const updated: CounselorStoreItem = {
      ...prev,
      ...input,
      fullName: formattedFullName,
      education: input.education || prev.education,
      counselorTypeDisplay:
        input.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
      role:
        input.role ||
        (input.counselorType === "psychologist"
          ? "Psikolog Klinis Berizin Resmi"
          : "Konselor Sebaya (Teman Cerita)"),
      avatarR2Url: input.avatarR2Url !== undefined ? input.avatarR2Url : prev.avatarR2Url,
      isActive: input.isActive !== undefined ? input.isActive : prev.isActive,
    }
    globalCounselorsStore[existingIdx] = updated
    return updated
  }

  // Create new
  const newItem: CounselorStoreItem = {
    id: input.id,
    fullName: formattedFullName,
    title: input.title || (isPsychologist ? "Psikolog Klinis" : "Konselor Sebaya"),
    role: input.role || (isPsychologist ? "Psikolog Klinis Berizin Resmi" : "Konselor Sebaya (Teman Cerita)"),
    counselorType: input.counselorType || "peer",
    counselorTypeDisplay: input.counselorType === "psychologist" ? "Psikolog Klinis" : "Konselor Sebaya",
    education: input.education || (isPsychologist ? "S2 Profesi Psikologi • Izin Kemenkes STR Terverifikasi" : "Sarjana Psikologi (S.Psi) • Peer Counselor Indonesia"),
    bio: input.bio || "Konselor profesional siap mendampingi perjalanan kesehatan mental Anda.",
    specializations: input.specializations || ["Pengembangan Diri"],
    avatarR2Url: input.avatarR2Url || defaultAvatar,
    email: input.email || `${input.id}@solulu.id`,
    phone: input.phone || "0812-0000-0000",
    strNumber: input.strNumber || null,
    rating: input.rating || "5.0",
    experience: input.experience || "2+ Tahun",
    totalSessions: input.totalSessions || 0,
    joinedDate: input.joinedDate || new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    isActive: input.isActive !== undefined ? input.isActive : true,
    slots: input.slots || [
      {
        id: `s-${input.id}-1`,
        date: tomorrowStr,
        startTime: "10:00",
        endTime: "11:30",
        timeRange: "10:00 – 11:30 WIB",
        status: "available",
      },
      {
        id: `s-${input.id}-2`,
        date: dayAfterStr,
        startTime: "14:00",
        endTime: "15:30",
        timeRange: "14:00 – 15:30 WIB",
        status: "available",
      },
    ],
  }

  globalCounselorsStore.unshift(newItem)
  return newItem
}

export function toggleStoreCounselorActive(id: string, isActive: boolean): boolean {
  const item = getStoreCounselorById(id)
  if (!item) return false
  item.isActive = isActive
  return true
}

export function removeStoreCounselor(id: string): boolean {
  const idx = globalCounselorsStore.findIndex((c) => c.id === id)
  if (idx >= 0) {
    globalCounselorsStore.splice(idx, 1)
    return true
  }
  return false
}

export function resetCounselorsStoreToDefault() {
  globalCounselorsStore = getDefaultCounselors()
}
