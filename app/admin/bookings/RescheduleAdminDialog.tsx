"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatIndonesianDate } from "@/lib/session/time"
import type { RescheduleSlotOption } from "@/lib/booking/reschedule-store"
import {
  getAdminRescheduleSlotsAction,
  rescheduleBookingAdminAction,
  type AdminBookingItem,
  type BookingCounselorOption,
} from "./actions"

interface Props {
  booking: AdminBookingItem | null
  counselors: BookingCounselorOption[]
  onClose: () => void
  onDone: () => void
}

/** Reschedule Admin: boleh ganti konselor, tidak memakai jatah klien. */
export function RescheduleAdminDialog({ booking, counselors, onClose, onDone }: Props) {
  const [counselorId, setCounselorId] = React.useState("")
  const [slots, setSlots] = React.useState<RescheduleSlotOption[]>([])
  const [slotId, setSlotId] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    setCounselorId(booking?.counselorId ?? "")
    setSlotId("")
    setSlots([])
  }, [booking])

  React.useEffect(() => {
    if (!booking || !counselorId) return
    let alive = true
    setLoading(true)
    getAdminRescheduleSlotsAction(counselorId).then((res) => {
      if (!alive) return
      setLoading(false)
      setSlotId("")
      if (res.success) setSlots(res.slots)
      else {
        setSlots([])
        toast.error(res.error ?? "Gagal memuat slot.")
      }
    })
    return () => {
      alive = false
    }
  }, [booking, counselorId])

  const submit = async () => {
    if (!booking || !slotId) return
    setBusy(true)
    const res = await rescheduleBookingAdminAction({ bookingId: booking.id, newScheduleId: slotId })
    setBusy(false)
    if (!res.success) {
      toast.error(res.error ?? "Gagal mengubah jadwal.")
      return
    }
    if ("warning" in res && res.warning) toast.warning(res.warning)
    else toast.success("Jadwal berhasil diubah.")
    onDone()
    onClose()
  }

  return (
    <Dialog open={Boolean(booking)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Admin</DialogTitle>
          <DialogDescription>
            {booking?.bookingCode} - {booking?.patientName}. Jadwal saat ini: {booking?.scheduleDate} {booking?.timeRange}.
            Jatah reschedule klien tidak berkurang.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold" htmlFor="reschedule-counselor">
            Konselor
          </label>
          <select
            id="reschedule-counselor"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={counselorId}
            onChange={(e) => setCounselorId(e.target.value)}
          >
            {counselors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
          <label className="text-xs font-semibold" htmlFor="reschedule-slot">
            Slot baru
          </label>
          <select
            id="reschedule-slot"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            value={slotId}
            disabled={loading || slots.length === 0}
            onChange={(e) => setSlotId(e.target.value)}
          >
            <option value="">{loading ? "Memuat..." : slots.length === 0 ? "Tidak ada slot tersedia" : "Pilih slot..."}</option>
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {formatIndonesianDate(s.date)} - {s.timeRange}
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="button" onClick={submit} disabled={!slotId || busy}>
            {busy ? "Memproses..." : "Pindahkan Jadwal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
