import { describe, it, expect } from "vitest"
import { getCounselorsCatalogAction } from "../app/counselors/actions"
import { getWIBDateString } from "../lib/schedules/concurrency"
import type { ServiceLike } from "../lib/services/pricing"

function makeService(overrides: Partial<ServiceLike>): ServiceLike {
  return {
    id: "svc",
    name: "Layanan",
    slug: "layanan",
    description: null,
    basePrice: "85000.00",
    promoPrice: null,
    allowVoucher: true,
    overtimeRatePer30Min: "35000.00",
    basePayoutPercent: 70,
    overtimePayoutPercent: 80,
    allowedCounselorTypes: ["peer"],
    isActive: true,
    sortOrder: 0,
    ...overrides,
  }
}

const sebaya = makeService({
  id: "svc-sebaya",
  name: "Partner Cerita",
  slug: "partner-cerita",
  basePrice: "85000.00",
  promoPrice: "49000.00",
  allowedCounselorTypes: ["peer"],
  sortOrder: 1,
})
const psikolog = makeService({
  id: "svc-psikolog",
  name: "Psikolog Klinis",
  slug: "psikolog-klinis",
  basePrice: "150000.00",
  allowedCounselorTypes: ["psychologist"],
  sortOrder: 2,
})
const praNikah = makeService({
  id: "svc-pranikah",
  name: "Konseling Pra-Nikah",
  slug: "pra-nikah",
  basePrice: "120000.00",
  allowedCounselorTypes: ["psychologist"],
  sortOrder: 3,
})

const counselors = [
  {
    id: "c-peer",
    fullName: "Rian Hidayat",
    title: "Konselor Sebaya",
    counselorType: "peer" as const,
    bio: "",
    specializations: [],
    avatarR2Url: null,
    isActive: true,
  },
  {
    id: "c-psy",
    fullName: "Sarah Annisa",
    title: "Psikolog",
    counselorType: "psychologist" as const,
    bio: "",
    specializations: [],
    avatarR2Url: null,
    isActive: true,
  },
]

const baseOptions = {
  getCounselors: async () => counselors,
  getSlots: async () => [],
  getActiveSessions: async () => ({}),
  getZoomCapacity: async () => 4,
}

describe("Katalog konselor berbasis Layanan (#20)", () => {
  it("menampilkan 'Mulai dari' = tarif aktif termurah dari Layanan yang ditawarkan konselor", async () => {
    const res = await getCounselorsCatalogAction(
      { type: "all" },
      { ...baseOptions, getServices: async () => [sebaya, psikolog, praNikah], getExclusions: async () => ({}) }
    )
    expect(res.success).toBe(true)
    const peer = res.data!.find((c) => c.id === "c-peer")!
    const psy = res.data!.find((c) => c.id === "c-psy")!

    expect(peer.pricing.displayPrice).toBe(49000)
    expect(peer.pricing.isSaleActive).toBe(true)
    expect(peer.pricing.basePrice).toBe(85000)

    expect(psy.pricing.displayPrice).toBe(120000) // Pra-Nikah lebih murah dari Psikolog Klinis
    expect(psy.services.map((s) => s.serviceId)).toEqual(["svc-psikolog", "svc-pranikah"])
  })

  it("konselor hanya muncul untuk Layanan yang tipenya cocok (filter Layanan)", async () => {
    const res = await getCounselorsCatalogAction(
      { type: "all", serviceId: "svc-pranikah" },
      { ...baseOptions, getServices: async () => [sebaya, psikolog, praNikah], getExclusions: async () => ({}) }
    )
    expect(res.data!.map((c) => c.id)).toEqual(["c-psy"])
    expect(res.data![0].pricing.displayPrice).toBe(120000)
  })

  it("menyembunyikan konselor dari Layanan yang dimatikan Admin untuk konselor itu", async () => {
    const res = await getCounselorsCatalogAction(
      { type: "all", serviceId: "svc-pranikah" },
      {
        ...baseOptions,
        getServices: async () => [sebaya, psikolog, praNikah],
        getExclusions: async () => ({ "c-psy": ["svc-pranikah"] }),
      }
    )
    expect(res.data).toEqual([])
  })

  it("tidak menampilkan Layanan nonaktif", async () => {
    const res = await getCounselorsCatalogAction(
      { type: "all" },
      {
        ...baseOptions,
        getServices: async () => [sebaya, { ...psikolog, isActive: false }, { ...praNikah, isActive: false }],
        getExclusions: async () => ({}),
      }
    )
    expect(res.data!.map((c) => c.id)).toEqual(["c-peer"])
  })

  it("mengembalikan daftar kosong (tanpa harga karangan) bila belum ada Layanan", async () => {
    const res = await getCounselorsCatalogAction(
      { type: "all" },
      { ...baseOptions, getServices: async () => [], getExclusions: async () => ({}) }
    )
    expect(res.success).toBe(true)
    expect(res.data).toEqual([])
  })

  it("tetap menyembunyikan slot yang diblokir concurrency guard", async () => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    const date = getWIBDateString(d)
    const res = await getCounselorsCatalogAction(
      { type: "all", date },
      {
        ...baseOptions,
        getServices: async () => [sebaya, psikolog],
        getExclusions: async () => ({}),
        getSlots: async () => [
          { id: "s1", counselorId: "c-peer", date, startTime: "10:00", endTime: "11:30", status: "available" },
        ],
      }
    )
    expect(res.data!.map((c) => c.id)).toEqual(["c-peer"])
  })
})
