import { describe, expect, it } from "vitest"
import {
  buildTableHref,
  pageCount,
  parseTableParams,
  type TableConfig,
} from "@/lib/data-table/search-params"
import { formatDateId, formatDateTimeWib, formatTimeWib } from "@/lib/format/datetime"

const config: TableConfig = {
  sortable: ["createdAt", "patientName"],
  defaultSort: { key: "createdAt", dir: "desc" },
  filters: { status: ["confirmed", "completed"], q: "text" },
  pageSize: 10,
  maxPageSize: 50,
}

describe("Ticket 23: parseTableParams", () => {
  it("defaults when nothing is supplied", () => {
    expect(parseTableParams({}, config)).toEqual({
      page: 1,
      pageSize: 10,
      sort: { key: "createdAt", dir: "desc" },
      filters: {},
    })
  })

  it("reads page, sort and filters from the URL", () => {
    const r = parseTableParams(
      { page: "3", sort: "patientName", dir: "asc", status: "confirmed", q: "  budi " },
      config
    )
    expect(r.page).toBe(3)
    expect(r.sort).toEqual({ key: "patientName", dir: "asc" })
    expect(r.filters).toEqual({ status: "confirmed", q: "budi" })
  })

  it("rejects unknown sort keys, bad pages, and unknown enum values", () => {
    const r = parseTableParams(
      { page: "-4", sort: "passwordHash", dir: "sideways", status: "hacked", pageSize: "9999" },
      config
    )
    expect(r.page).toBe(1)
    expect(r.sort).toEqual({ key: "createdAt", dir: "desc" })
    expect(r.filters).toEqual({})
    expect(r.pageSize).toBe(50)
  })

  it("uses the first value of repeated params and ignores 'all'", () => {
    const r = parseTableParams({ status: ["completed", "confirmed"], q: "all" }, config)
    expect(r.filters.status).toBe("completed")
    expect(parseTableParams({ status: "all" }, config).filters).toEqual({})
  })
})

describe("Ticket 23: buildTableHref", () => {
  it("omits defaults and resets to page 1 when a filter changes", () => {
    const current = parseTableParams({ page: "4", status: "confirmed" }, config)
    expect(buildTableHref("/admin/bookings", current, config, { status: "completed" })).toBe(
      "/admin/bookings?status=completed"
    )
    expect(buildTableHref("/admin/bookings", current, config, { status: null })).toBe(
      "/admin/bookings"
    )
  })

  it("keeps filters when paging and sorting", () => {
    const current = parseTableParams({ status: "confirmed" }, config)
    expect(buildTableHref("/admin/bookings", current, config, { page: 2 })).toBe(
      "/admin/bookings?status=confirmed&page=2"
    )
    expect(
      buildTableHref("/admin/bookings", current, config, {
        sort: { key: "patientName", dir: "asc" },
      })
    ).toBe("/admin/bookings?status=confirmed&sort=patientName&dir=asc")
  })
})

describe("Ticket 23: pageCount", () => {
  it("is at least 1", () => {
    expect(pageCount(0, 10)).toBe(1)
    expect(pageCount(21, 10)).toBe(3)
  })
})

describe("Ticket 23: id-ID dates, WIB clock", () => {
  const instant = new Date("2026-11-03T18:30:00Z") // 4 Nov 01:30 WIB
  it("formats the calendar date in WIB", () => {
    expect(formatDateId(instant)).toBe("4 Nov 2026")
  })
  it("formats the clock in WIB with a WIB suffix", () => {
    expect(formatTimeWib(instant)).toBe("01.30 WIB")
  })
  it("combines both and accepts ISO strings", () => {
    expect(formatDateTimeWib(instant.toISOString())).toBe("4 Nov 2026, 01.30 WIB")
  })
})
