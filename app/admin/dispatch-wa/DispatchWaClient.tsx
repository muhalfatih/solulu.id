"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Send } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import type { TableState } from "@/lib/data-table/search-params"
import { formatDateId, formatDateTimeWib } from "@/lib/format/datetime"
import { WA_TEMPLATE_KEYS, WA_TEMPLATE_META } from "@/lib/whatsapp/templates"
import type { DispatchQueueRow } from "@/lib/whatsapp/queue"
import { sendWhatsAppDispatchAction } from "./actions"
import { dispatchTableConfig } from "./table-config"

export function DispatchWaClient({
  rows,
  total,
  pendingTotal,
  state,
  pathname,
}: {
  rows: DispatchQueueRow[]
  total: number
  pendingTotal: number
  state: TableState
  pathname: string
}) {
  const router = useRouter()
  const [busyId, setBusyId] = React.useState<string | null>(null)

  async function send(row: DispatchQueueRow) {
    setBusyId(row.bookingId)
    // Buka tab dulu secara sinkron agar tidak diblokir popup blocker, lalu arahkan setelah server merender pesan.
    const tab = window.open("", "_blank")
    try {
      const result = await sendWhatsAppDispatchAction(row.bookingId)
      if (!result.success) {
        tab?.close()
        toast.error(result.error)
        return
      }
      if (tab) {
        tab.opener = null
        tab.location.href = result.url
      } else {
        window.location.href = result.url
      }
      toast.success(`Ditandai Sudah Dikirim: ${row.patientName}`)
      router.refresh()
    } catch {
      tab?.close()
      toast.error("Gagal menyiapkan pesan WhatsApp.")
    } finally {
      setBusyId(null)
    }
  }

  const columns: DataTableColumn<DispatchQueueRow>[] = [
    {
      id: "client",
      header: "Klien",
      sortKey: "patientName",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.patientName}</span>
          <span className="font-mono text-xs text-muted-foreground">{r.patientPhone}</span>
          <span className="font-mono text-xs text-muted-foreground">{r.bookingCode}</span>
        </div>
      ),
    },
    {
      id: "schedule",
      header: "Jadwal",
      sortKey: "scheduleDate",
      cell: (r) => (
        <div className="flex flex-col text-sm">
          <span>{formatDateId(r.scheduleDate)}</span>
          <span className="text-xs text-muted-foreground">
            Slot {r.slotIndex} · {r.timeRange} WIB
          </span>
        </div>
      ),
    },
    {
      id: "counselor",
      header: "Konselor",
      sortKey: "counselorName",
      cell: (r) => r.counselorName,
    },
    {
      id: "template",
      header: "Template",
      cell: (r) => <Badge variant="outline">{WA_TEMPLATE_META[r.kind].name}</Badge>,
    },
    {
      id: "status",
      header: "Status",
      cell: (r) =>
        r.lastSentAt ? (
          <Badge variant="secondary">
            <CheckCircle2 aria-hidden /> Sudah Dikirim · {formatDateTimeWib(r.lastSentAt)}
          </Badge>
        ) : (
          <Badge variant="outline">
            <Clock aria-hidden /> Belum dikirim
          </Badge>
        ),
    },
    {
      id: "action",
      header: "Aksi",
      align: "right",
      cell: (r) => (
        <Button
          size="sm"
          variant={r.lastSentAt ? "outline" : "default"}
          disabled={busyId !== null}
          onClick={() => send(r)}
        >
          {busyId === r.bookingId ? <Spinner /> : <Send aria-hidden />}
          {r.lastSentAt ? "Kirim ulang" : "Kirim WhatsApp"}
        </Button>
      ),
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Dispatch WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Antrean Booking yang perlu dikirimi pesan. Satu klik membuka WhatsApp dengan pesan yang sudah
          terisi dan mencatatnya sebagai Sudah Dikirim.{" "}
          <span className="font-medium text-foreground">{pendingTotal} belum dikirim.</span>
        </p>
      </div>

      <DataTableToolbar
        pathname={pathname}
        state={state}
        config={dispatchTableConfig}
        search={{ name: "q", placeholder: "Cari kode, klien, nomor, konselor" }}
        selects={[
          {
            name: "kind",
            placeholder: "Template",
            allLabel: "Semua template",
            options: WA_TEMPLATE_KEYS.map((k) => ({ value: k, label: WA_TEMPLATE_META[k].name })),
          },
          {
            name: "sent",
            placeholder: "Status kirim",
            allLabel: "Semua status",
            options: [
              { value: "pending", label: "Belum dikirim" },
              { value: "sent", label: "Sudah dikirim" },
            ],
          },
        ]}
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.bookingId}
        total={total}
        state={state}
        config={dispatchTableConfig}
        pathname={pathname}
        empty={{
          icon: <Send aria-hidden />,
          title: "Antrean kosong",
          description: "Tidak ada Booking yang perlu dikirimi pesan WhatsApp untuk filter ini.",
        }}
      />
    </div>
  )
}
