import * as React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, UserX } from "lucide-react"

import { getCounselorByIdAction } from "../actions"
import { getPlatformSettings } from "@/lib/settings/platform"
import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"
import CounselorDetailClient from "./CounselorDetailClient"

interface CounselorPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({
  params,
}: CounselorPageProps): Promise<Metadata> {
  const { id } = await params
  const res = await getCounselorByIdAction(id)
  const counselor = res.data

  if (!counselor) {
    return {
      title: "Profil Konselor Tidak Ditemukan | Solulu.id",
      description: "Halaman profil konselor tidak dapat ditemukan.",
    }
  }

  const roleText =
    counselor.counselorType === "psychologist"
      ? "Psikolog Klinis Berizin Resmi"
      : "Konselor Sebaya Terlatih"

  return {
    title: `${counselor.fullName} (${roleText}) - Jadwal & Profil | Solulu.id`,
    description: `${counselor.bio.slice(0, 160)}... Reservasi sesi konseling privat 90 menit online bersama ${counselor.fullName}.`,
    openGraph: {
      title: `${counselor.fullName} - Konseling 1-on-1 | Solulu.id`,
      description: counselor.bio,
      images: counselor.avatarR2Url ? [{ url: counselor.avatarR2Url }] : [],
    },
  }
}

export default async function CounselorDetailPage({
  params,
}: CounselorPageProps) {
  const { id } = await params
  const [counselorResult, settings] = await Promise.all([
    getCounselorByIdAction(id),
    getPlatformSettings(),
  ])

  const counselor = counselorResult.data

  if (!counselor) {
    return (
      <PublicShell>
        <div className="max-w-xl mx-auto px-4 py-24 text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted/60 text-muted-foreground">
            <UserX className="size-10" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Profil Konselor Tidak Ditemukan
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Mitra konselor atau psikolog yang kamu cari mungkin sedang tidak aktif atau alamat tautan tidak sesuai.
          </p>
          <Button asChild variant="public" className="rounded-full mt-2">
            <Link href="/counselors">
              <ArrowLeft data-icon="inline-start" />
              <span>Kembali ke Katalog Konselor</span>
            </Link>
          </Button>
        </div>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <CounselorDetailClient counselor={counselor} settings={settings} />
    </PublicShell>
  )
}
