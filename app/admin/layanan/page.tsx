import Link from "next/link"
import { BadgeDollarSign } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { ErrorState } from "@/components/data-table/error-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionUser } from "@/lib/auth/staff"
import { getStaffRole } from "@/lib/auth/staff-role"
import { parseTableParams, type RawSearchParams } from "@/lib/data-table/search-params"
import { LAYANAN_PATH, layananTableConfig, queryServices } from "@/lib/services/list"
import { toServicePricingView } from "@/lib/services/pricing"
import { listAllServices, type ServiceRecord } from "@/lib/services/repository"
import { formatRupiah } from "@/lib/utils"
import {
  CreateServiceButton,
  ServiceRowActions,
  type ServiceFormSeed,
} from "./ServiceControls"

export const metadata = {
  title: "Layanan & Tarif | Solulu Admin",
  description: "Kelola Layanan, tarif, promo, Bagi Hasil, dan Tipe Konselor. Hanya Superadmin yang dapat mengubah.",
}

export const dynamic = "force-dynamic"

const wrap = "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"
const TYPE_LABEL = { peer: "Sebaya", psychologist: "Psikolog" } as const

function toSeed(s: ServiceRecord): ServiceFormSeed {
  return {
    id: s.id,
    isActive: s.isActive,
    name: s.name,
    description: s.description,
    basePrice: Number(s.basePrice),
    promoPrice: s.promoPrice === null ? null : Number(s.promoPrice),
    allowVoucher: s.allowVoucher,
    overtimeRatePer30Min: Number(s.overtimeRatePer30Min),
    basePayoutPercent: s.basePayoutPercent,
    overtimePayoutPercent: s.overtimePayoutPercent,
    allowedCounselorTypes: s.allowedCounselorTypes,
    sortOrder: s.sortOrder,
  }
}

export default async function LayananPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await getSessionUser()
  const role = getStaffRole(user)
  if (role !== "superadmin" && role !== "admin") {
    return (
      <div className={wrap}>
        <ErrorState title="Akses ditolak" message="Halaman ini hanya untuk Admin dan Superadmin." />
      </div>
    )
  }
  const canEdit = role === "superadmin"
  const state = parseTableParams(await searchParams, layananTableConfig)

  let all: ServiceRecord[]
  try {
    all = await listAllServices()
  } catch (err) {
    console.error("[admin/layanan] gagal memuat Layanan", err)
    return (
      <div className={wrap}>
        <ErrorState message="Layanan tidak dapat dimuat saat ini. Muat ulang halaman atau coba beberapa saat lagi." />
      </div>
    )
  }

  const { rows, total } = queryServices(all, state)

  const columns: DataTableColumn<ServiceRecord>[] = [
    {
      id: "name",
      header: "Layanan",
      sortKey: "name",
      cell: (s) => (
        <div className="flex flex-col">
          <span className="font-medium">{s.name}</span>
          <span className="text-xs text-muted-foreground">{s.slug}</span>
        </div>
      ),
    },
    {
      id: "price",
      header: "Tarif",
      sortKey: "price",
      cell: (s) => {
        const v = toServicePricingView(s)
        return (
          <div className="flex flex-col">
            <span>{v.activePriceFormatted}</span>
            {v.isPromoActive ? (
              <span className="text-xs text-muted-foreground line-through">{v.originalPriceFormatted}</span>
            ) : null}
          </div>
        )
      },
    },
    {
      id: "voucher",
      header: "Voucher",
      cell: (s) => (
        <Badge variant={s.allowVoucher ? "secondary" : "outline"}>{s.allowVoucher ? "Boleh" : "Tidak"}</Badge>
      ),
    },
    { id: "overtime", header: "Overtime / 30 mnt", cell: (s) => formatRupiah(Number(s.overtimeRatePer30Min)) },
    {
      id: "payout",
      header: "Bagi Hasil",
      cell: (s) => `${s.basePayoutPercent}% / ${s.overtimePayoutPercent}%`,
    },
    {
      id: "types",
      header: "Tipe Konselor",
      cell: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.allowedCounselorTypes.map((t) => (
            <Badge key={t} variant="outline">
              {TYPE_LABEL[t]}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (s) => <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Aktif" : "Nonaktif"}</Badge>,
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: <span className="sr-only">Aksi</span>,
            align: "right" as const,
            cell: (s: ServiceRecord) => <ServiceRowActions service={toSeed(s)} />,
          },
        ]
      : []),
  ]

  return (
    <div className={`${wrap} flex flex-col gap-6 pb-16`}>
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Layanan &amp; Tarif</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit
              ? "Layanan yang dapat dipesan klien. Menonaktifkan Layanan menyembunyikannya dari katalog tanpa mengubah booking atau payroll lama."
              : "Tampilan baca-saja. Hanya Superadmin yang dapat mengubah Layanan, tarif, dan Bagi Hasil."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/layanan/konselor">Pengecualian per konselor</Link>
          </Button>
          {canEdit ? <CreateServiceButton /> : null}
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Daftar Layanan</CardTitle>
            <CardDescription>{total} Layanan sesuai filter. Durasi selalu 90 menit.</CardDescription>
          </div>
          <DataTableToolbar
            pathname={LAYANAN_PATH}
            state={state}
            config={layananTableConfig}
            search={{ name: "q", placeholder: "Cari nama Layanan" }}
            selects={[
              {
                name: "status",
                placeholder: "Status",
                allLabel: "Semua status",
                options: [
                  { value: "active", label: "Aktif" },
                  { value: "inactive", label: "Nonaktif" },
                ],
              },
              {
                name: "type",
                placeholder: "Tipe Konselor",
                allLabel: "Semua tipe",
                options: [
                  { value: "peer", label: "Konselor Sebaya" },
                  { value: "psychologist", label: "Psikolog Klinis" },
                ],
              },
            ]}
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(s) => s.id}
            total={total}
            state={state}
            config={layananTableConfig}
            pathname={LAYANAN_PATH}
            empty={{
              icon: <BadgeDollarSign />,
              title: "Belum Ada Layanan",
              description: canEdit
                ? "Tambahkan Layanan pertama agar klien dapat memesan."
                : "Belum ada Layanan yang cocok dengan filter.",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
