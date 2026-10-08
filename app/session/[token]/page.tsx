import * as React from "react"
import type { Metadata } from "next"
import { getSessionByTokenAction } from "@/lib/session/actions"
import SessionClient from "./SessionClient"
import { SessionInvalidView } from "./SessionInvalidView"

export const dynamic = "force-dynamic"

interface SessionPageProps {
  params: Promise<{
    token: string
  }>
}

export async function generateMetadata({
  params,
}: SessionPageProps): Promise<Metadata> {
  const { token } = await params
  const res = await getSessionByTokenAction(token)

  if (!res.success || !res.data) {
    return {
      title: "Sesi Tidak Ditemukan | Solulu",
      description: "Tautan sesi telekonseling tidak ditemukan di sistem Solulu.",
    }
  }

  return {
    title: `Ruang Sesi: ${res.data.counselor.fullName} | Solulu`,
    description: `Ruang telekonseling 90 menit bersama ${res.data.counselor.fullName} pada ${res.data.schedule.formattedDate}, ${res.data.schedule.timeRange}.`,
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { token } = await params

  if (!token) {
    return <SessionInvalidView />
  }

  const res = await getSessionByTokenAction(token)

  if (!res.success || !res.data) {
    return <SessionInvalidView token={token} error={res.error} />
  }

  return <SessionClient initialData={res.data} />
}
