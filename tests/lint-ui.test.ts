import { describe, expect, it } from "vitest"
import { findViolations, countAnimatePulse, countCardOverrides, isCardStyleOverride } from "../scripts/lint-ui-lib.mjs"

describe("Ticket 21: lint:ui Card rules", () => {
  it.each(["p-4", "px-6", "pt-0", "sm:py-2", "border", "border-b", "rounded-xl", "shadow-sm", "bg-muted", "text-primary", "ring-1", "[&>div]:p-2", "dark:bg-card"])(
    "flags restyling class %s",
    (token: string) => {
      expect(isCardStyleOverride(token)).toBe(true)
    }
  )

  it.each(["grid", "gap-4", "w-full", "col-span-2", "flex", "flex-col", "text-sm", "text-xs", "text-center", "md:grid-cols-2", "overflow-hidden", "min-h-0", "lg:col-span-3", "mt-4"])(
    "allows layout class %s",
    (token: string) => {
      expect(isCardStyleOverride(token)).toBe(false)
    }
  )

  it("counts Card* usages whose className restyles the card", () => {
    const src = `
      <Card className="gap-4 w-full" />
      <Card className="p-0" />
      <CardHeader
        id="x"
        className={cn("flex", open && "border-b pb-2")}
      >
      <CardContent className="grid gap-2">
      <CardFooter className="bg-muted/30" />
      <MetricCard className="p-4" />
    `
    expect(countCardOverrides(src)).toBe(3)
  })

  it("ignores className on non-class attributes and nested elements", () => {
    const src = `<Card onClick={() => go()} className="flex"><div className="p-4" /></Card>`
    expect(countCardOverrides(src)).toBe(0)
  })
})

describe("Ticket 21: lint:ui animate-pulse rule", () => {
  it("counts hand-written animate-pulse but not other animate classes", () => {
    expect(countAnimatePulse(`<div className="h-4 animate-pulse bg-muted" />`)).toBe(1)
    expect(countAnimatePulse(`<span className="animate-pulse-ring" />`)).toBe(0)
    expect(countAnimatePulse(`cn("x", loading && "animate-pulse")`)).toBe(1)
  })
})

describe("lint:ui zero tolerance", () => {
  it("passes when there are no violations", () => {
    expect(findViolations({})).toEqual([])
    expect(findViolations({ "app/admin/a.tsx": { "card-override": 0 } })).toEqual([])
  })

  it("fails for every file and rule with a violation", () => {
    expect(
      findViolations({
        "app/operator/new.tsx": { "animate-pulse": 1 },
        "app/admin/a.tsx": { "card-override": 2, "animate-pulse": 0 },
      })
    ).toEqual([
      { file: "app/admin/a.tsx", rule: "card-override", have: 2 },
      { file: "app/operator/new.tsx", rule: "animate-pulse", have: 1 },
    ])
  })
})
