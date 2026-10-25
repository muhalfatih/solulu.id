import { redirect } from "next/navigation"

export default function PricingAdminPage() {
  redirect("/admin/settings?tab=fees")
}
