import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  buildTableHref,
  pageCount,
  type TableConfig,
  type TableState,
} from "@/lib/data-table/search-params"

export function DataTablePagination({
  total,
  state,
  config,
  pathname,
}: {
  total: number
  state: TableState
  config: TableConfig
  pathname: string
}) {
  const pages = pageCount(total, state.pageSize)
  const page = Math.min(state.page, pages)
  const from = total === 0 ? 0 : (page - 1) * state.pageSize + 1
  const to = Math.min(page * state.pageSize, total)
  const href = (p: number) => buildTableHref(pathname, state, config, { page: p })

  return (
    <nav
      aria-label="Paginasi tabel"
      className="flex items-center justify-between gap-2 border-t pt-3"
    >
      <p className="text-sm text-muted-foreground">
        Menampilkan {from}-{to} dari {total}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Halaman {page} dari {pages}
        </span>
        {page > 1 ? (
          <Button variant="outline" size="icon-sm" asChild>
            <Link href={href(page - 1)} scroll={false} aria-label="Halaman sebelumnya">
              <ChevronLeft />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon-sm" disabled aria-label="Halaman sebelumnya">
            <ChevronLeft />
          </Button>
        )}
        {page < pages ? (
          <Button variant="outline" size="icon-sm" asChild>
            <Link href={href(page + 1)} scroll={false} aria-label="Halaman berikutnya">
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="icon-sm" disabled aria-label="Halaman berikutnya">
            <ChevronRight />
          </Button>
        )}
      </div>
    </nav>
  )
}
