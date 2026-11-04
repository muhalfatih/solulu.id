"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { setCounselorServiceExcludedAction } from "../actions"

/** Satu saklar: Layanan ditawarkan (aktif) atau dimatikan untuk konselor ini. */
export function ExclusionToggle({
  counselorId,
  serviceId,
  serviceName,
  offered,
}: {
  counselorId: string
  serviceId: string
  serviceName: string
  offered: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [checked, setChecked] = React.useState(offered)

  React.useEffect(() => setChecked(offered), [offered])

  const onChange = (next: boolean) => {
    setChecked(next)
    startTransition(async () => {
      const res = await setCounselorServiceExcludedAction(counselorId, serviceId, !next)
      if (res.success) {
        toast.success(res.message)
        router.refresh()
      } else {
        setChecked(!next)
        toast.error(res.error)
      }
    })
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} disabled={pending} aria-label={`${serviceName} ditawarkan`} />
      <span>{serviceName}</span>
    </label>
  )
}
