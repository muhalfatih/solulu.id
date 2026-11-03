import * as React from "react"
import { PortalShell } from "@/components/app-shell/portal-shell"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell portal="admin">{children}</PortalShell>
}
