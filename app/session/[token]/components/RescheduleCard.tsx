"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CalendarClock } from "lucide-react"
import { PublicButton as Button } from "@/components/public/public-button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/public/public-card"
import {
  getRescheduleOptionsAction,
  rescheduleSessionAction,
  type RescheduleOptions,
} from "@/lib/session/actions"
import { formatIndonesianDate } from "@/lib/session/time"

interface RescheduleCardProps {
  accessToken: string
}

/** Reschedule Mandiri: 1x per booking, sebelum Cutoff Reschedule, slot konselor yang sama. */
export function RescheduleCard({ accessToken }: RescheduleCardProps) {
  const router = useRouter()
  const [options, setOptions] = React.useState<RescheduleOptions | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<{ kind: "error" | "success"; text: string } | null>(null)

  React.useEffect(() => {
    let alive = true
    getRescheduleOptionsAction(accessToken).then((res) => {
      if (!alive) return
      if (res.success && res.data) setOptions(res.data)
      else setLoadError(res.error ?? "Gagal memuat opsi reschedule.")
    })
    return () => {
      alive = false
    }
  }, [accessToken])

  const submit = async () => {
    if (!selected) return
    setBusy(true)
    setMessage(null)
    const res = await rescheduleSessionAction(accessToken, selected)
    setBusy(false)
    if (!res.success) {
      setMessage({ kind: "error", text: res.error ?? "Gagal mengubah jadwal." })
      return
    }
    setMessage({ kind: "success", text: res.warning ?? "Jadwal berhasil diubah. Tautan sesi Anda tetap sama." })
    setOpen(false)
    router.refresh()
  }

  if (loadError) return null
  if (!options) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" aria-hidden /> Ubah Jadwal Sesi
        </CardTitle>
        <CardDescription>
          {options.canReschedule
            ? `Anda dapat mengubah jadwal satu kali, paling lambat H-${options.cutoffHours} jam sebelum sesi, dengan konselor yang sama.`
            : options.reason}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {options.canReschedule && !open && (
          <Button type="button" onClick={() => setOpen(true)}>
            Pilih Jadwal Baru
          </Button>
        )}
        {options.canReschedule && open && (
          <>
            {options.slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada slot lain yang tersedia dari konselor Anda.</p>
            ) : (
              <select
                aria-label="Jadwal baru"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Pilih slot...</option>
                {options.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatIndonesianDate(s.date)} - {s.timeRange}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <Button type="button" onClick={submit} disabled={!selected || busy}>
                {busy ? "Memproses..." : "Konfirmasi Jadwal Baru"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                Batal
              </Button>
            </div>
          </>
        )}
        {message && (
          <p role="status" className={message.kind === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700"}>
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
