"use client"

import { ErrorState } from "@/components/data-table/error-state"
import { Button } from "@/components/ui/button"

export default function OperatorDashboardError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <ErrorState
        message="Terjadi kesalahan saat menampilkan dashboard operator."
        action={
          <Button variant="outline" size="sm" onClick={() => retry()}>
            Coba lagi
          </Button>
        }
      />
    </div>
  )
}
