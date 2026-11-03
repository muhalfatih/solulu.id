"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { closePayrollPeriodAction } from "./actions"

export function ClosePeriodButton({ startDate, label, canClose }: { startDate: string; label: string; canClose: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function close() {
    setError(null)
    startTransition(async () => {
      const res = await closePayrollPeriodAction(startDate)
      if (res.ok) router.refresh()
      else setError(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={!canClose || pending}>
            <Lock data-icon="inline-start" />
            Tutup Periode
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup periode {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Isi periode dan persentase Bagi Hasil dibekukan. Laporan sesi yang masuk atau perubahan Bagi Hasil
              setelahnya tidak mengubah periode ini; honor yang baru terlepas masuk ke periode terbuka berikutnya.
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={close}>Tutup Periode</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!canClose && <p className="text-xs text-muted-foreground">Periode dapat ditutup setelah tanggal akhirnya lewat.</p>}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
