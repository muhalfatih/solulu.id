import { Building2 } from "lucide-react"

/**
 * Instruksi transfer manual dari Platform Settings (diatur Superadmin).
 * Tidak ada rekening bawaan: bila belum diatur, tampilkan keadaan kosong (ADR-0013).
 */
export function ManualTransferInstructions({ instructions }: { instructions: string | null | undefined }) {
  const text = instructions?.trim() ?? ""
  if (!text) {
    return (
      <p className="text-sm text-muted-foreground">
        Rekening tujuan transfer belum diatur. Hubungi Admin Solulu untuk mendapatkan instruksi pembayaran.
      </p>
    )
  }
  return (
    <div className="flex items-start gap-3">
      <Building2 className="size-4 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-foreground whitespace-pre-line">{text}</p>
    </div>
  )
}
