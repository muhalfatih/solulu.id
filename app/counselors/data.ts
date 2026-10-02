import type { CatalogCounselorView } from "./actions"

export function getFallbackCounselors(
  typeFilter?: "all" | "peer" | "psychologist",
  dateFilter?: string
): CatalogCounselorView[] {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tStr = tomorrow.toISOString().split("T")[0]

  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  const daStr = dayAfter.toISOString().split("T")[0]

  const all: CatalogCounselorView[] = [
    {
      id: "c-1",
      fullName: "Sarah Annisa, M.Psi., Psikolog",
      title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
      role: "Psikolog Klinis Berizin Resmi",
      education: "S2 Psikologi Klinis • Izin Kemenkes",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout).",
      specializations: ["Kecemasan (Anxiety)", "Depresi", "Trauma", "Burnout Karir"],
      avatarR2Url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600",
      rating: "4.9",
      experience: "4+ Tahun",
      availableSoon: "Tersedia Besok",
      pricing: {
        basePrice: 250000,
        promoPrice: 130000,
        isSaleActive: true,
        allowVoucher: true,
        displayPrice: 130000,
        displayPriceFormatted: "Rp 130.000",
        originalPriceFormatted: "Rp 250.000",
      },
      availableSlots: [
        {
          id: "s-101",
          date: tStr,
          startTime: "09:00",
          endTime: "10:30",
          timeRange: "09:00 – 10:30 WIB",
        },
        {
          id: "s-102",
          date: tStr,
          startTime: "19:00",
          endTime: "20:30",
          timeRange: "19:00 – 20:30 WIB",
        },
        {
          id: "s-103",
          date: daStr,
          startTime: "13:30",
          endTime: "15:00",
          timeRange: "13:30 – 15:00 WIB",
        },
      ],
      totalAvailableSlotsCount: 3,
    },
    {
      id: "c-2",
      fullName: "Rian Hidayat, S.Psi",
      title: "Konselor Sebaya Senior • Tersertifikasi Konseling Pemuda",
      role: "Konselor Sebaya (Partner Cerita)",
      education: "Sarjana Psikologi (S.Psi) • Fasilitator",
      counselorType: "peer",
      counselorTypeDisplay: "Konselor Sebaya",
      bio: "Berpengalaman mendampingi mahasiswa dan pekerja muda dalam menghadapi tekanan perkuliahan, quarter-life crisis, serta dinamika relasi asmara dan keluarga.",
      specializations: ["Quarter-life Crisis", "Stres Kuliah & Kerja", "Relasi Asmara", "Karir"],
      avatarR2Url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
      rating: "4.8",
      experience: "3+ Tahun",
      availableSoon: "Tersedia Besok",
      pricing: {
        basePrice: 150000,
        promoPrice: 85000,
        isSaleActive: true,
        allowVoucher: true,
        displayPrice: 85000,
        displayPriceFormatted: "Rp 85.000",
        originalPriceFormatted: "Rp 150.000",
      },
      availableSlots: [
        {
          id: "s-201",
          date: tStr,
          startTime: "11:00",
          endTime: "12:30",
          timeRange: "11:00 – 12:30 WIB",
        },
        {
          id: "s-202",
          date: tStr,
          startTime: "15:30",
          endTime: "17:00",
          timeRange: "15:30 – 17:00 WIB",
        },
        {
          id: "s-203",
          date: daStr,
          startTime: "19:00",
          endTime: "20:30",
          timeRange: "19:00 – 20:30 WIB",
        },
      ],
      totalAvailableSlotsCount: 3,
    },
    {
      id: "c-3",
      fullName: "Dr. Nadia Larasati, M.Psi",
      title: "Doktor & S2 Psikologi • Izin Kemenkes STR Terverifikasi",
      role: "Psikolog Klinis Berizin Resmi",
      education: "Doktor & S2 Psikologi • Izin Kemenkes",
      counselorType: "psychologist",
      counselorTypeDisplay: "Psikolog Klinis",
      bio: "Pendekatan berbasis bukti ilmiah untuk penanganan depresi ringan hingga sedang, pemulihan luka masa kecil, serta peningkatan self-esteem dan penerimaan diri.",
      specializations: ["Depresi Ringan-Sedang", "Insecurity", "Penerimaan Diri", "Regulasi Emosi"],
      avatarR2Url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600",
      rating: "5.0",
      experience: "6+ Tahun",
      availableSoon: "Tersedia Lusa",
      pricing: {
        basePrice: 250000,
        promoPrice: 130000,
        isSaleActive: true,
        allowVoucher: true,
        displayPrice: 130000,
        displayPriceFormatted: "Rp 130.000",
        originalPriceFormatted: "Rp 250.000",
      },
      availableSlots: [
        {
          id: "s-301",
          date: daStr,
          startTime: "10:00",
          endTime: "11:30",
          timeRange: "10:00 – 11:30 WIB",
        },
        {
          id: "s-302",
          date: daStr,
          startTime: "14:00",
          endTime: "15:30",
          timeRange: "14:00 – 15:30 WIB",
        },
      ],
      totalAvailableSlotsCount: 2,
    },
    {
      id: "c-4",
      fullName: "Nabila Safitri, S.Psi",
      title: "Konselor Sebaya Remaja • Fasilitator Komunitas Sejiwa",
      role: "Konselor Sebaya Remaja",
      education: "Sarjana Psikologi (S.Psi) • Komunitas Sejiwa",
      counselorType: "peer",
      counselorTypeDisplay: "Konselor Sebaya",
      bio: "Fasilitator pendampingan emosional remaja dan dewasa awal dengan pendekatan empatik, mendengarkan aktif tanpa penghakiman, dan panduan regulasi emosi sehat.",
      specializations: ["Manajemen Emosi", "Keluarga", "Kecemasan Sosial", "Self-Acceptance"],
      avatarR2Url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600",
      rating: "4.9",
      experience: "3+ Tahun",
      availableSoon: "Tersedia Besok",
      pricing: {
        basePrice: 150000,
        promoPrice: 85000,
        isSaleActive: true,
        allowVoucher: true,
        displayPrice: 85000,
        displayPriceFormatted: "Rp 85.000",
        originalPriceFormatted: "Rp 150.000",
      },
      availableSlots: [
        {
          id: "s-401",
          date: tStr,
          startTime: "13:30",
          endTime: "15:00",
          timeRange: "13:30 – 15:00 WIB",
        },
        {
          id: "s-402",
          date: daStr,
          startTime: "16:00",
          endTime: "17:30",
          timeRange: "16:00 – 17:30 WIB",
        },
      ],
      totalAvailableSlotsCount: 2,
    },
  ]

  let filtered = all
  if (typeFilter && typeFilter !== "all") {
    filtered = filtered.filter((c) => c.counselorType === typeFilter)
  }
  if (dateFilter) {
    filtered = filtered.filter((c) => c.availableSlots.some((s) => s.date === dateFilter))
  }
  return filtered
}

export function getFallbackCounselorById(id: string): CatalogCounselorView | null {
  const all = getFallbackCounselors("all")
  return all.find((c) => c.id === id) || all.find((c) => c.id.toLowerCase() === id.toLowerCase()) || all[0] || null
}
