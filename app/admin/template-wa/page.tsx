import { ErrorState } from "@/components/data-table/error-state"
import { requireStaffUser } from "@/lib/auth/staff"
import { SUPERADMIN_ONLY } from "@/lib/auth/staff-role"
import { listWhatsAppTemplates } from "@/lib/whatsapp/db-deps"
import { WA_TEMPLATE_KEYS } from "@/lib/whatsapp/templates"
import { TemplateWaClient, type TemplateItem } from "./TemplateWaClient"

export const metadata = {
  title: "Template WA | Solulu Admin",
  description: "Kelola template pesan WhatsApp berparameter.",
}

export const dynamic = "force-dynamic"

const wrap = "p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full"

export default async function TemplateWaPage() {
  const user = await requireStaffUser(undefined, SUPERADMIN_ONLY)
  if (!user) {
    return (
      <div className={wrap}>
        <ErrorState title="Akses ditolak" message="Hanya Superadmin yang dapat mengelola template WhatsApp." />
      </div>
    )
  }

  let rows: Awaited<ReturnType<typeof listWhatsAppTemplates>>
  try {
    rows = await listWhatsAppTemplates()
  } catch (err) {
    console.error("[template-wa] gagal memuat template", err)
    return (
      <div className={wrap}>
        <ErrorState message="Template tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </div>
    )
  }

  const items: TemplateItem[] = WA_TEMPLATE_KEYS.map((key) => {
    const row = rows.find((r) => r.key === key)
    return { key, body: row?.body ?? "", updatedAt: row ? row.updatedAt.toISOString() : null }
  })
  return <TemplateWaClient items={items} />
}
