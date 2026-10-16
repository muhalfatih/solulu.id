import { getZoomAccountsAction } from "./actions"
import type { ZoomAccountView } from "./schema"
import { ZoomSettingsClient } from "./ZoomSettingsClient"

export const metadata = {
  title: "4 Akun Zoom Pro | Solulu Admin",
  description:
    "Manajemen infrastruktur 4 akun Zoom Pro terenkripsi AES-256-GCM, Host Key 6-digit, dan proteksi Safety Lock otomatis.",
}

export default async function ZoomSettingsPage() {
  let initialAccounts: ZoomAccountView[] = []
  let isSuperadmin = false

  try {
    const res = await getZoomAccountsAction()
    if (res.success && res.accounts) {
      initialAccounts = res.accounts
      isSuperadmin = Boolean(res.isSuperadmin)
    }
  } catch {
    initialAccounts = []
  }

  return (
    <ZoomSettingsClient
      initialAccounts={initialAccounts}
      isSuperadmin={isSuperadmin}
    />
  )
}
