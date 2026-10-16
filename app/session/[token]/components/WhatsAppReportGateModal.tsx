"use client"

import * as React from "react"
import { Phone, ShieldCheck, Loader2, AlertCircle, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { getClientSessionReportAction } from "@/lib/session/actions"
import type { ClientSessionReportView } from "@/lib/session/types"

interface WhatsAppReportGateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accessToken: string
  onUnlocked: (report: ClientSessionReportView) => void
}

export function WhatsAppReportGateModal({
  open,
  onOpenChange,
  accessToken,
  onUnlocked,
}: WhatsAppReportGateModalProps) {
  const [phone, setPhone] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!phone.trim()) {
      setErrorMsg("Nomor WhatsApp terdaftar wajib diisi")
      return
    }

    setIsLoading(true)

    try {
      const res = await getClientSessionReportAction(accessToken, phone)

      if (!res.success || !res.data) {
        setErrorMsg(res.error || "Nomor WhatsApp verifikasi tidak cocok dengan data pendaftaran sesi.")
        return
      }

      toast.success("Verifikasi berhasil!", {
        description: "Laporan klinis resmi Anda kini terbuka.",
      })
      onUnlocked(res.data.report)
      onOpenChange(false)
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memverifikasi nomor WhatsApp")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        id="modal-wa-report-gate"
        className="sm:max-w-md border-border/80 shadow-lg"
      >
        <DialogHeader>
          <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Lock className="size-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Verifikasi Akses Laporan Sesi
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed text-pretty">
            Demi menjaga kerahasiaan medis dan privasi klinis Anda, masukkan nomor WhatsApp
            yang Anda gunakan saat mendaftar sesi ini untuk membuka dokumen resmi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && (
            <Alert variant="destructive" className="py-2.5 px-3 text-xs">
              <AlertCircle data-icon="inline-start" className="size-4" />
              <AlertTitle className="font-semibold text-xs">Verifikasi Gagal</AlertTitle>
              <AlertDescription className="text-xs mt-0.5 leading-relaxed">
                {errorMsg}
              </AlertDescription>
            </Alert>
          )}

          <FieldGroup>
            <Field data-invalid={Boolean(errorMsg)}>
              <FieldLabel htmlFor="input-verification-phone" className="text-xs font-semibold">
                Nomor WhatsApp Terdaftar
              </FieldLabel>
              <InputGroup className="h-10">
                <InputGroupAddon align="inline-start">
                  <Phone className="size-4 text-muted-foreground" />
                </InputGroupAddon>
                <InputGroupInput
                  id="input-verification-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="Contoh: 0812-3456-7890"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (errorMsg) setErrorMsg(null)
                  }}
                  disabled={isLoading}
                  autoComplete="tel"
                  aria-invalid={Boolean(errorMsg)}
                  className="text-sm font-mono"
                />
              </InputGroup>
              <FieldDescription className="text-[11px] text-muted-foreground">
                Gunakan nomor Indonesia yang valid (08... atau +62...).
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !phone.trim()}
              id="btn-submit-phone-verification"
              className="text-xs font-semibold gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5" data-icon="inline-start" />
                  <span>Buka Laporan Sesi</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
