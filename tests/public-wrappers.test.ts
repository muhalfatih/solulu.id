import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  resolvePublicButton,
  type PublicButtonSize,
  type PublicButtonVariant,
} from "@/components/public/public-button-styles"

/**
 * Ticket 18 (ADR-0012, expand stage): the public site must stop using the
 * non-registry variants that live in components/ui, and the wrappers that
 * replace them must render the same classes as the legacy variants did.
 */

const ROOT = process.cwd()
const PORTAL_DIRS = new Set(["admin", "counselor", "operator", "api"])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

function publicSurfaceFiles(): string[] {
  const appDir = path.join(ROOT, "app")
  const appFiles = readdirSync(appDir)
    .filter((entry) => !PORTAL_DIRS.has(entry))
    .flatMap((entry) => {
      const full = path.join(appDir, entry)
      return statSync(full).isDirectory() ? walk(full) : [full]
    })
    .filter((file) => /\.(ts|tsx)$/.test(file))
  return [
    ...appFiles,
    ...walk(path.join(ROOT, "components/public")),
    ...walk(path.join(ROOT, "components/screening")),
  ]
}

function violations(pattern: RegExp, allow: (file: string) => boolean = () => false) {
  return publicSurfaceFiles()
    .filter((file) => !allow(file))
    .filter((file) => pattern.test(readFileSync(file, "utf8")))
    .map((file) => path.relative(ROOT, file))
}

const insidePublicWrappers = (file: string) =>
  file.includes(`${path.sep}components${path.sep}public${path.sep}`)

describe("Ticket 18: public pages avoid non-registry ui variants", () => {
  it("scans a non-trivial public surface", () => {
    const files = publicSurfaceFiles().map((f) => path.relative(ROOT, f))
    expect(files).toContain("app/page.tsx")
    expect(files).toContain("app/pricing/page.tsx")
    expect(files.some((f) => f.startsWith("app/session/"))).toBe(true)
    expect(files.some((f) => f.startsWith("app/admin/"))).toBe(false)
  })

  // PublicButton legitimately accepts variant="public" / size="pill"; the rule
  // is that the registry Button from components/ui is never given them.
  const importsUiButton =
    /import\s*\{[^}]*\bButton\b[^}]*\}\s*from\s*["']@\/components\/ui\/button["']/
  const usesPublicLooks =
    /variant=\{?["']public(-secondary|-white)?["']|size=\{?["']pill(-sm|-lg)?["']/

  it("does not feed the local public / pill button looks to the ui Button", () => {
    const offenders = publicSurfaceFiles()
      .filter((file) => !insidePublicWrappers(file))
      .filter((file) => {
        const src = readFileSync(file, "utf8")
        return importsUiButton.test(src) && usesPublicLooks.test(src)
      })
      .map((file) => path.relative(ROOT, file))
    expect(offenders).toEqual([])
  })

  it("routes public pages through PublicButton", () => {
    const users = publicSurfaceFiles().filter((file) =>
      /<PublicButton\b/.test(readFileSync(file, "utf8"))
    )
    expect(users.length).toBeGreaterThan(10)
  })

  it("does not import the locally customised accordion or toggle", () => {
    expect(
      violations(/from ["']@\/components\/ui\/(accordion|toggle|toggle-group)["']/)
    ).toEqual([])
  })

  it("does not use the local badge warning variant or toggle solid/pill variants", () => {
    expect(violations(/<Badge[^>]*variant=\{?["']warning["']/)).toEqual([])
    expect(
      violations(/<Toggle(Group)?(Item)?\b[^>]*variant=\{?["'](solid|pill)["']/)
    ).toEqual([])
  })
})

describe("Ticket 18: PublicButton resolves to the legacy rendering", () => {
  const variants = ["public", "public-secondary", "public-white"] as const
  const sizes = ["pill", "pill-sm", "pill-lg"] as const

  const classSet = (value: string) => value.split(/\s+/).filter(Boolean).sort()

  // The legacy variants still exist in components/ui until the reset ticket,
  // so they are the independent reference for "looks identical".
  // Button renders cn(buttonVariants(...)); mirror that merge step.
  const legacyVariants = buttonVariants as unknown as (opts: {
    variant?: string
    size?: string
    className?: string
  }) => string
  const legacy = (opts: { variant: string; size: string }) =>
    cn(legacyVariants(opts))

  const wrapped = (variant: PublicButtonVariant, size: PublicButtonSize, className?: string) => {
    const r = resolvePublicButton(variant, size)
    return cn(
      buttonVariants({
        variant: r.variant,
        size: r.size,
        className: cn(r.className, className),
      })
    )
  }

  for (const variant of variants) {
    it(`variant ${variant} with default size matches legacy`, () => {
      expect(classSet(wrapped(variant, "default"))).toEqual(
        classSet(legacy({ variant, size: "default" }))
      )
    })
    for (const size of sizes) {
      it(`variant ${variant} with size ${size} matches legacy`, () => {
        expect(classSet(wrapped(variant, size))).toEqual(
          classSet(legacy({ variant, size }))
        )
      })
    }
  }

  it("keeps caller className last so overrides still win", () => {
    const cls = wrapped("public", "pill", "w-full rounded-lg")
    expect(cls).toContain("w-full")
    expect(cls).toContain("rounded-lg")
    expect(cls).not.toContain("rounded-full")
  })

  it("passes registry variants with pill sizes (e.g. outline + pill-sm) like legacy", () => {
    expect(classSet(wrapped("outline", "pill-sm"))).toEqual(
      classSet(legacy({ variant: "outline", size: "pill-sm" }))
    )
  })

  it("passes plain registry variants and sizes through untouched", () => {
    expect(resolvePublicButton("ghost", "sm")).toEqual({
      variant: "ghost",
      size: "sm",
      className: "",
    })
  })
})
