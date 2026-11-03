import * as React from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import {
  buildTableHref,
  type TableConfig,
  type TableState,
} from "@/lib/data-table/search-params"
import { DataTablePagination } from "./data-table-pagination"

export interface DataTableColumn<T> {
  id: string
  header: React.ReactNode
  /** Kunci sort di URL; tanpa ini kolom tidak bisa diurutkan. */
  sortKey?: string
  align?: "left" | "right"
  cell: (row: T) => React.ReactNode
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Total baris setelah filter (seluruh halaman), untuk paginasi. */
  total: number
  state: TableState
  config: TableConfig
  pathname: string
  empty: {
    icon: React.ReactNode
    title: string
    description: string
  }
}

function SortHead({
  label,
  sortKey,
  pathname,
  state,
  config,
}: {
  label: React.ReactNode
  sortKey: string
  pathname: string
  state: TableState
  config: TableConfig
}) {
  const active = state.sort.key === sortKey
  const nextDir = active && state.sort.dir === "asc" ? "desc" : "asc"
  const Icon = !active ? ChevronsUpDown : state.sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <Link
      href={buildTableHref(pathname, state, config, { sort: { key: sortKey, dir: nextDir } })}
      scroll={false}
      className="inline-flex items-center gap-1 hover:text-foreground"
      aria-label={`Urutkan berdasarkan ${typeof label === "string" ? label : sortKey}`}
    >
      {label}
      <Icon className="size-3.5" aria-hidden />
    </Link>
  )
}

/**
 * Tabel data bersama: sort (header berupa tautan) dan paginasi digerakkan oleh
 * search params URL. Tidak punya state sendiri; halaman server yang mengambil data.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  total,
  state,
  config,
  pathname,
  empty,
}: DataTableProps<T>) {
  const hasFilters = Object.keys(state.filters).length > 0

  if (rows.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon">{empty.icon}</EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{empty.title}</EmptyTitle>
          <EmptyDescription>{empty.description}</EmptyDescription>
        </EmptyHeader>
        {hasFilters || state.page > 1 ? (
          <EmptyContent>
            <Button variant="outline" size="sm" asChild>
              <Link href={pathname}>Reset semua filter</Link>
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    )
  }

  return (
    <div className="flex flex-col">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.id} className={col.align === "right" ? "text-right" : undefined}>
                {col.sortKey ? (
                  <SortHead
                    label={col.header}
                    sortKey={col.sortKey}
                    pathname={pathname}
                    state={state}
                    config={config}
                  />
                ) : (
                  col.header
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.id} className={col.align === "right" ? "text-right" : undefined}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DataTablePagination total={total} state={state} config={config} pathname={pathname} />
    </div>
  )
}
