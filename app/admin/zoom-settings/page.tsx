import { getZoomAccountsAction } from "./actions"
import type { ZoomAccountView } from "./schema"
import { ZoomSettingsClient } from "./ZoomSettingsClient"

export const metadata = {
  title: "Pengaturan Akun Zoom | Solulu Admin",
  description:
    "Manajemen kredensial 2 akun Zoom Pro terenkripsi AES-256-GCM dengan proteksi Safety Lock otomatis.",
}

export default async function ZoomSettingsPage() {
  let initialAccounts: ZoomAccountView[] = []

  try {
    const res = await getZoomAccountsAction()
    if (res.success && res.accounts) {
      initialAccounts = res.accounts
    }
  } catch (error) {
    // If DB is offline or table is empty during local dev, initialize with empty accounts list
    initialAccounts = []
  }

  return <ZoomSettingsClient initialAccounts={initialAccounts} />
}
