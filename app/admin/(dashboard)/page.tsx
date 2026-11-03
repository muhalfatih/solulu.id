import { ErrorState } from "@/components/data-table/error-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { loadAdminDashboard, parseRangeKey, rangeForKey, RANGE_OPTIONS } from "@/lib/admin-metrics"
import { drizzleMetricsStore } from "@/lib/admin-metrics/store"
import { listAuditLogs } from "@/lib/audit/list"
import { auditTableConfig } from "@/lib/audit/query"
import { getSessionUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, getStaffRole, hasStaffRole } from "@/lib/auth/staff-role"
import { parseTableParams } from "@/lib/data-table/search-params"
import { drizzleHonorStore } from "@/lib/finance/honor-store"
import { PaymentMixChart, RevenueHppChart, SessionsByServiceChart, SlotHeatmap } from "./_dashboard/charts"
import { RangeFilter } from "./_dashboard/range-filter"
import { AttentionPanel, KpiCards, NoData, RecentAudit, dayLabel } from "./_dashboard/sections"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dashboard | Solulu Admin",
  description: "Perlu Tindakan, Omzet, Laba Bersih, sesi, keterisian slot, dan metode bayar.",
}

type Params = Record<string, string | string[] | undefined>

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 pb-16 sm:p-6 lg:p-8">{children}</div>
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await getSessionUser()
  // Operator tidak boleh melihat angka keuangan; dashboard-nya ada di portal Operator.
  if (!hasStaffRole(user, ADMIN_ROLES)) {
    return (
      <Shell>
        <ErrorState title="Akses ditolak" message="Dashboard keuangan hanya dapat dibuka oleh Admin atau Superadmin." />
      </Shell>
    )
  }

  const key = parseRangeKey((await searchParams).period)
  const now = new Date()
  const range = rangeForKey(key, now)

  let data: Awaited<ReturnType<typeof loadAdminDashboard>>
  try {
    data = await loadAdminDashboard({ range, now, honorStore: drizzleHonorStore, metricsStore: drizzleMetricsStore })
  } catch (err) {
    console.error("[admin/dashboard] gagal memuat dashboard", err)
    return (
      <Shell>
        <ErrorState message="Dashboard tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </Shell>
    )
  }

  // Jejak Audit hanya untuk Superadmin; kegagalan membaca tidak boleh menjatuhkan dashboard.
  let audit: Awaited<ReturnType<typeof listAuditLogs>> = null
  let auditFailed = false
  if (getStaffRole(user) === "superadmin") {
    try {
      audit = await listAuditLogs({ ...parseTableParams({}, auditTableConfig), pageSize: 5 }, user)
    } catch (err) {
      console.error("[admin/dashboard] gagal memuat Jejak Audit terbaru", err)
      auditFailed = true
    }
  }

  const hasMoney = data.daily.some((d) => d.omzet > 0 || d.hpp > 0)
  const comparisonLabel = `${dayLabel(data.comparisonRange.from)} - ${dayLabel(data.comparisonRange.to)}`
  const rangeLabel = RANGE_OPTIONS.find((o) => o.key === key)?.label

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {rangeLabel}: {dayLabel(data.range.from)} - {dayLabel(data.range.to)} · dibanding {comparisonLabel}
          </p>
        </div>
        <RangeFilter value={key} />
      </div>

      <AttentionPanel items={data.attention} />
      <KpiCards kpis={data.kpis} comparisonLabel={comparisonLabel} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Omzet vs HPP</CardTitle>
            <CardDescription>Rupiah per hari. Omzet menurut tanggal lunas, HPP menurut tanggal sesi.</CardDescription>
          </CardHeader>
          <CardContent>{hasMoney ? <RevenueHppChart data={data.daily} /> : <NoData title="Belum ada omzet atau HPP" />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Metode Bayar</CardTitle>
            <CardDescription>Transaksi lunas pada rentang ini</CardDescription>
          </CardHeader>
          <CardContent>
            {data.paymentMix.length > 0 ? <PaymentMixChart data={data.paymentMix} /> : <NoData title="Belum ada transaksi lunas" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sesi per Layanan</CardTitle>
            <CardDescription>Selesai dan No-Show</CardDescription>
          </CardHeader>
          <CardContent>
            {data.sessionsByService.length > 0 ? (
              <SessionsByServiceChart data={data.sessionsByService} />
            ) : (
              <NoData title="Belum ada sesi selesai" />
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Keterisian Slot</CardTitle>
            <CardDescription>
              7 slot x 7 hari ({dayLabel(data.heatmap.days[0])} - {dayLabel(data.heatmap.days[data.heatmap.days.length - 1])}), terisi dari
              slot yang dibuka konselor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.kpis.keterisian.opened > 0 || data.heatmap.rows.some((r) => r.cells.some((c) => c.opened > 0)) ? (
              <SlotHeatmap heatmap={data.heatmap} />
            ) : (
              <NoData title="Belum ada slot dibuka" hint="Heatmap muncul setelah konselor membuka jadwal pada rentang ini." />
            )}
          </CardContent>
        </Card>
      </div>

      {getStaffRole(user) === "superadmin" &&
        (auditFailed ? (
          <ErrorState title="Jejak Audit gagal dimuat" message="Catatan audit terbaru tidak dapat dimuat. Buka halaman Jejak Audit atau coba lagi nanti." />
        ) : (
          <RecentAudit rows={audit?.rows ?? []} />
        ))}
    </Shell>
  )
}
