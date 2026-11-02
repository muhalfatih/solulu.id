// PROTOTYPE (branch prototype/admin-dashboard-v9)
// Three variants of the admin dashboard on the existing /admin route, switchable via
// ?variant=A|B|C (plus "now" = the dashboard on main). Range via ?range=.
import { redirect } from "next/navigation"
import { getAuthenticatedAdmin } from "./counselors/actions"
import { getDashboardData } from "./_prototype/dashboard-data"
import { isRangeKey } from "./_prototype/range-options"
import { VariantA, VariantB, VariantC } from "./_prototype/variants"
import CurrentDashboard from "./_prototype/current-dashboard"
import { PrototypeSwitcher } from "@/components/prototype-switcher"

const VARIANTS = [
  { key: "A", name: "Pusat Kendali" },
  { key: "B", name: "Operasional + rail keuangan" },
  { key: "C", name: "Laporan Periode" },
  { key: "now", name: "Dashboard saat ini" },
]

export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const admin = await getAuthenticatedAdmin()
  if (!admin) redirect("/login")

  const sp = await props.searchParams
  const variant = VARIANTS.some((v) => v.key === sp.variant) ? String(sp.variant) : "A"
  const range = isRangeKey(sp.range) ? sp.range : "period"

  const data = variant === "now" ? null : await getDashboardData(range)

  return (
    <>
      {variant === "A" && data && <VariantA data={data} />}
      {variant === "B" && data && <VariantB data={data} />}
      {variant === "C" && data && <VariantC data={data} />}
      {variant === "now" && <CurrentDashboard />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} />
    </>
  )
}
