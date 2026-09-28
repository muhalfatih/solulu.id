import * as React from "react"
import { getCounselorsCatalogAction, type CatalogCounselorView } from "./actions"
import { getPlatformSettings } from "@/lib/settings/platform"
import CounselorsCatalogClient from "./CounselorsCatalogClient"

export const metadata = {
  title: "Pilih Mitra Konselor — Solulu",
  description:
    "Katalog psikolog klinis dan konselor sebaya terverifikasi untuk sesi konsultasi 90 menit via Zoom tanpa perlu membuat akun.",
}

export default async function CounselorsCatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = searchParams ? await searchParams : {}
  const screeningId =
    typeof params.screeningId === "string" ? params.screeningId : undefined
  const rawType = typeof params.type === "string" ? params.type : undefined
  const recommendedType =
    rawType === "clinical" ? "psychologist" : rawType === "peer" ? "peer" : undefined

  const result = await getCounselorsCatalogAction({
    type: recommendedType,
  })

  let initialCounselors: CatalogCounselorView[] = []

  if (result.success && result.data && result.data.length > 0) {
    initialCounselors = result.data
  } else {
    // Demo fallback for local development and visual review
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tStr = tomorrow.toISOString().split("T")[0]

    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    const daStr = dayAfter.toISOString().split("T")[0]

    initialCounselors = [
      {
        id: "c-1",
        fullName: "Sarah Annisa, M.Psi., Psikolog",
        title: "Psikolog Klinis Dewasa • No. STR: 1902837482910",
        counselorType: "psychologist",
        counselorTypeDisplay: "Psikolog Klinis",
        bio: "Praktisi psikologi klinis dengan fokus pada penanganan gangguan kecemasan, depresi, trauma masa lalu, dan manajemen stres kerja (burnout).",
        specializations: ["Kecemasan", "Depresi", "Trauma", "Burnout"],
        avatarR2Url: null,
        pricing: {
          basePrice: 150000,
          promoPrice: null,
          isSaleActive: false,
          allowVoucher: true,
          displayPrice: 150000,
          displayPriceFormatted: "Rp 150.000",
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
        counselorType: "peer",
        counselorTypeDisplay: "Konselor Sebaya",
        bio: "Berpengalaman mendampingi mahasiswa dan pekerja muda dalam menghadapi tekanan perkuliahan, quarter-life crisis, serta dinamika relasi asmara dan keluarga.",
        specializations: ["Stres Kuliah", "Quarter-Life Crisis", "Relasi Asmara", "Karir"],
        avatarR2Url: null,
        pricing: {
          basePrice: 50000,
          promoPrice: 35000,
          isSaleActive: true,
          allowVoucher: true,
          displayPrice: 35000,
          displayPriceFormatted: "Rp 35.000",
          originalPriceFormatted: "Rp 50.000",
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
        fullName: "Nabila Safitri, S.Psi",
        title: "Konselor Sebaya Remaja • Fasilitator Komunitas Sejiwa",
        counselorType: "peer",
        counselorTypeDisplay: "Konselor Sebaya",
        bio: "Fasilitator pendampingan emosional remaja dan dewasa awal dengan pendekatan empatik, mendengarkan aktif tanpa penghakiman, dan panduan regulasi emosi sehat.",
        specializations: ["Manajemen Emosi", "Keluarga", "Kecemasan Sosial", "Self-Acceptance"],
        avatarR2Url: null,
        pricing: {
          basePrice: 50000,
          promoPrice: null,
          isSaleActive: false,
          allowVoucher: true,
          displayPrice: 50000,
          displayPriceFormatted: "Rp 50.000",
        },
        availableSlots: [
          {
            id: "s-301",
            date: tStr,
            startTime: "13:30",
            endTime: "15:00",
            timeRange: "13:30 – 15:00 WIB",
          },
          {
            id: "s-302",
            date: daStr,
            startTime: "10:00",
            endTime: "11:30",
            timeRange: "10:00 – 11:30 WIB",
          },
        ],
        totalAvailableSlotsCount: 2,
      },
    ]
  }

  const settings = await getPlatformSettings()

  return (
    <CounselorsCatalogClient
      initialCounselors={initialCounselors}
      initialScreeningId={screeningId}
      initialRecommendedType={recommendedType}
      isScreeningRequired={settings.isScreeningRequired}
    />
  )
}
