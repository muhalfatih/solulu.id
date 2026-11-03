#!/usr/bin/env node
// `npm run lint:ui` (ADR-0012).
//
//   1. components/ui must equal the pinned registry fingerprint
//      (scripts/lint-ui-registry.json). `--registry` additionally asks the
//      shadcn CLI to diff every installed component against the live registry.
//   2. Portal code (admin, operator, counselor) must not use a hand-written
//      `animate-pulse` or restyle Card* (padding/border/radius/shadow/color).
//      Zero tolerance: any violation fails.
//
// Flags://        --write-registry   re-pin the fingerprint after a CLI registry update
//        --registry         diff against the live registry via the shadcn CLI
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { countViolations, findViolations } from "./lint-ui-lib.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const UI_DIR = path.join(ROOT, "components/ui")
const REGISTRY_FILE = path.join(ROOT, "scripts/lint-ui-registry.json")
const PORTAL_DIRS = [
  "app/admin",
  "app/operator",
  "app/counselor",
  "components/admin",
  "components/operator",
  "components/counselor",
]

const args = new Set(process.argv.slice(2))
const rel = (file) => path.relative(ROOT, file).split(path.sep).join("/")

function walk(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

function uiFingerprints() {
  const result = {}
  for (const file of readdirSync(UI_DIR).sort()) {
    if (!/\.tsx?$/.test(file)) continue
    const body = readFileSync(path.join(UI_DIR, file), "utf8").replace(/\r\n/g, "\n")
    result[file] = createHash("sha256").update(body).digest("hex").slice(0, 16)
  }
  return result
}

function portalViolations() {
  const result = {}
  for (const dir of PORTAL_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const counts = countViolations(readFileSync(file, "utf8"))
      const nonZero = Object.fromEntries(Object.entries(counts).filter(([, n]) => n > 0))
      if (Object.keys(nonZero).length) result[rel(file)] = nonZero
    }
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)))
}

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {})
const writeJson = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + "\n")

if (args.has("--write-registry")) {
  writeJson(REGISTRY_FILE, uiFingerprints())
  console.log("lint:ui registry fingerprint written")
}

let failed = false

// 1. components/ui vs pinned registry fingerprint
const pinned = readJson(REGISTRY_FILE)
const actual = uiFingerprints()
for (const file of new Set([...Object.keys(pinned), ...Object.keys(actual)])) {
  if (pinned[file] !== actual[file]) {
    failed = true
    const why = !actual[file] ? "was removed" : !pinned[file] ? "is not pinned" : "differs from the registry"
    console.error(`components/ui/${file} ${why}. Update components only via "npx shadcn@latest add <name> --overwrite", then "npm run lint:ui -- --write-registry".`)
  }
}

if (args.has("--registry")) {
  const names = Object.keys(actual).map((f) => f.replace(/\.tsx?$/, ""))
  for (const name of names) {
    const out = execFileSync("npx", ["shadcn@latest", "add", name, "--diff"], {
      cwd: ROOT,
      encoding: "utf8",
    })
    if (/^\s*│ │ [+-](?![+-])/m.test(out)) {
      failed = true
      console.error(`components/ui/${name}.tsx differs from the live registry (shadcn add ${name} --diff)`)
    }
  }
}

// 2. portal rules (zero tolerance)
for (const f of findViolations(portalViolations())) {
  failed = true
  const label = f.rule === "animate-pulse" ? "hand-written animate-pulse (use <Skeleton />)" : "Card* className restyles the card (layout classes only)"
  console.error(`${f.file}: ${f.have} ${label}`)
}

console.log(`lint:ui: ${failed ? "FAILED" : "ok"}`)
process.exit(failed ? 1 : 0)
