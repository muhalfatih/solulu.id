import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth/staff"
import { ADMIN_ROLES, hasStaffRole } from "@/lib/auth/staff-role"
import { payoutCsv, payrollPeriodFor } from "@/lib/finance"
import { loadPayrollPeriodDetail } from "@/lib/finance/payroll-load"

export const dynamic = "force-dynamic"

const START_PARAM = /^\d{4}-\d{2}-(01|16)$/

/** CSV transfer massal (RFC 4180) untuk satu Periode Payroll. Admin/Superadmin saja. */
export async function GET(_req: Request, ctx: { params: Promise<{ period: string }> }) {
  const user = await getSessionUser()
  if (!hasStaffRole(user, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
  }

  const { period } = await ctx.params
  let valid = false
  try {
    valid = START_PARAM.test(period) && payrollPeriodFor(period).startDate === period
  } catch {
    valid = false
  }
  if (!valid) return NextResponse.json({ error: "Periode tidak valid" }, { status: 400 })

  try {
    const detail = await loadPayrollPeriodDetail({ startDate: period, now: new Date() })
    return new NextResponse(payoutCsv(detail), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payroll-${detail.startDate}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[admin/payroll] gagal ekspor CSV", err)
    return NextResponse.json({ error: "Gagal membuat CSV" }, { status: 500 })
  }
}
