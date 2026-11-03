import Link from "next/link"
import { ScrollText } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table"
import { ErrorState } from "@/components/data-table/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { AuditLog } from "@/db/schema"
import { listAuditLogs } from "@/lib/audit/list"
import { AUDIT_PATH, auditTableConfig } from "@/lib/audit/query"
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit/record"
import { getSessionUser } from "@/lib/auth/staff"
import { parseTableParams, type RawSearchParams } from "@/lib/data-table/search-params"
import { formatDateTimeWib } from "@/lib/format/datetime"

export const metadata = {
  title: "Jejak Audit | Solulu Admin",
  description: "Catatan append-only seluruh aksi sensitif staf. Hanya Superadmin.",
}

function JsonCell({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>
  return (
    <details className="max-w-xs">
      <summary className="cursor-pointer text-xs text-muted-foreground">Lihat</summary>
      <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  )
}

const columns: DataTableColumn<AuditLog>[] = [
  {
    id: "createdAt",
    header: "Waktu",
    sortKey: "createdAt",
    cell: (r) => <span className="whitespace-nowrap">{formatDateTimeWib(r.createdAt)}</span>,
  },
  {
    id: "actor",
    header: "Aktor",
    sortKey: "actorRole",
    cell: (r) => (
      <div className="flex flex-col">
        <span className="capitalize">{r.actorRole ?? "sistem"}</span>
        <span className="text-xs text-muted-foreground break-all">{r.actorId ?? "-"}</span>
      </div>
    ),
  },
  { id: "action", header: "Aksi", sortKey: "action", cell: (r) => <code className="text-xs">{r.action}</code> },
  {
    id: "entity",
    header: "Entitas",
    sortKey: "entityType",
    cell: (r) => (
      <div className="flex flex-col">
        <span>{r.entityType}</span>
        <span className="text-xs text-muted-foreground break-all">{r.entityId ?? "-"}</span>
      </div>
    ),
  },
  { id: "ip", header: "IP", cell: (r) => r.ip ?? "-" },
  { id: "before", header: "Sebelum", cell: (r) => <JsonCell value={r.before} /> },
  { id: "after", header: "Sesudah", cell: (r) => <JsonCell value={r.after} /> },
]

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export default async function AuditPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const state = parseTableParams(await searchParams, auditTableConfig)

  // Pemeriksaan peran ada di listAuditLogs; halaman tidak pernah membaca tabel untuk non-Superadmin.
  const user = await getSessionUser()
  let data: Awaited<ReturnType<typeof listAuditLogs>>
  try {
    data = await listAuditLogs(state, user)
  } catch (err) {
    console.error("[admin/audit] gagal memuat Jejak Audit", err)
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <ErrorState message="Jejak Audit tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <ErrorState title="Akses ditolak" message="Jejak Audit hanya dapat dibuka oleh Superadmin." />
      </div>
    )
  }

  const f = state.filters
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Jejak Audit</h1>
        <p className="text-sm text-muted-foreground">
          Catatan append-only aksi sensitif staf. Tidak dapat diubah atau dihapus.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Riwayat Aksi</CardTitle>
            <CardDescription>{data.total} entri sesuai filter.</CardDescription>
          </div>
          <form method="get" action={AUDIT_PATH} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <Input name="actor" defaultValue={f.actor ?? ""} placeholder="Aktor (ID atau peran)" aria-label="Aktor" />
            <select name="action" defaultValue={f.action ?? ""} className={selectClass} aria-label="Aksi">
              <option value="">Semua aksi</option>
              {AUDIT_ACTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select name="entity" defaultValue={f.entity ?? ""} className={selectClass} aria-label="Entitas">
              <option value="">Semua entitas</option>
              {AUDIT_ENTITY_TYPES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <Input type="date" name="from" defaultValue={f.from ?? ""} aria-label="Dari tanggal" />
            <Input type="date" name="to" defaultValue={f.to ?? ""} aria-label="Sampai tanggal" />
            <div className="flex gap-2">
              <Button type="submit" size="sm">Terapkan</Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={AUDIT_PATH}>Reset</Link>
              </Button>
            </div>
          </form>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={data.rows}
            rowKey={(r) => r.id}
            total={data.total}
            state={state}
            config={auditTableConfig}
            pathname={AUDIT_PATH}
            empty={{
              icon: <ScrollText />,
              title: "Belum Ada Catatan Audit",
              description: "Tidak ada catatan yang cocok dengan filter. Aksi sensitif staf akan muncul di sini.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
