"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { VariantA } from "./variant-a"
import { VariantB } from "./variant-b"
import { VariantC } from "./variant-c"
import { PrototypeSwitcher, VariantOption } from "@/components/prototype-switcher"

const VARIANTS: VariantOption[] = [
  {
    key: "A",
    name: "Executive Overview",
    description: "Stat cards, sidebar navigasi, dual-column feed sesi & safety lock widget",
  },
  {
    key: "B",
    name: "Command Center Table",
    description: "Tabel berdensitas tinggi untuk operator cepat, filter, dan tab kontrol",
  },
  {
    key: "C",
    name: "Visual Pipeline & Timeline",
    description: "Gantt timeline overlap Zoom 90m dan visual applicant verification cards",
  },
]

function AdminPrototypeContent() {
  const searchParams = useSearchParams()
  const variant = (searchParams.get("variant") || "A").toUpperCase()

  return (
    <div className="relative min-h-screen bg-neutral-950">
      {variant === "B" ? (
        <VariantB />
      ) : variant === "C" ? (
        <VariantC />
      ) : (
        <VariantA />
      )}

      {/* Floating switcher bar at the bottom */}
      <PrototypeSwitcher variants={VARIANTS} defaultVariant="A" />
    </div>
  )
}

export default function AdminPrototypePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center text-xs">
          Memuat prototipe admin...
        </div>
      }
    >
      <AdminPrototypeContent />
    </React.Suspense>
  )
}
