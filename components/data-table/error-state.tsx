import * as React from "react"
import { TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/** Tampilan galat bersama untuk halaman data; terpisah dari Empty agar galat tidak tampak seperti "tidak ada data". */
export function ErrorState({
  title = "Data gagal dimuat",
  message,
  action,
}: {
  title?: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <Alert variant="destructive" role="alert">
      <TriangleAlert />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {action}
      </AlertDescription>
    </Alert>
  )
}
