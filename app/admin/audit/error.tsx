"use client"

import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/data-table/error-state"

export default function AuditError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <ErrorState
        message="Terjadi kesalahan saat menampilkan Jejak Audit."
        action={
          <Button variant="outline" size="sm" onClick={() => retry()}>
            Coba lagi
          </Button>
        }
      />
    </div>
  )
}
