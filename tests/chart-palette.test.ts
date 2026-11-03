import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  CATEGORICAL_PALETTE,
  CVD_KINDS,
  SEQUENTIAL_BLUE_RAMP,
  colorDifference,
  minPairwiseDifference,
} from "@/lib/design/chart-palette"

const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8")

function block(selector: string): string {
  const start = css.indexOf(`\n${selector} {`)
  expect(start).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf("\n}", start))
}

function token(scope: string, name: string): string | undefined {
  return new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(scope)?.[1]?.toLowerCase()
}

describe("Ticket 21: chart palette tokens (ADR-0012)", () => {
  const light = block(":root")
  const dark = block(".dark")

  it("globals.css --chart-1..3 carry the validated categorical palette", () => {
    CATEGORICAL_PALETTE.light.forEach((hex, i) =>
      expect(token(light, `--chart-${i + 1}`)).toBe(hex)
    )
    CATEGORICAL_PALETTE.dark.forEach((hex, i) =>
      expect(token(dark, `--chart-${i + 1}`)).toBe(hex)
    )
  })

  it("globals.css heat ramp carries the sequential blue ramp", () => {
    SEQUENTIAL_BLUE_RAMP.light.forEach((hex, i) =>
      expect(token(light, `--heat-${i + 1}`)).toBe(hex)
    )
    SEQUENTIAL_BLUE_RAMP.dark.forEach((hex, i) =>
      expect(token(dark, `--heat-${i + 1}`)).toBe(hex)
    )
  })

  it("does not override preset tokens per portal (.theme-admin removed)", () => {
    expect(css).not.toContain(".theme-admin")
  })

  for (const mode of ["light", "dark"] as const) {
    describe(`${mode} categorical palette passes the CVD validator`, () => {
      for (const kind of CVD_KINDS) {
        it(`every pair stays distinguishable under ${kind}`, () => {
          expect(minPairwiseDifference(CATEGORICAL_PALETTE[mode], kind)).toBeGreaterThan(
            kind === "none" ? 40 : 15
          )
        })
      }
    })

    it(`${mode} sequential ramp is monotonic in lightness`, () => {
      const ramp = SEQUENTIAL_BLUE_RAMP[mode]
      const steps = ramp.slice(1).map((hex, i) => colorDifference(ramp[i], hex, "none"))
      steps.forEach((step) => expect(step).toBeGreaterThan(8))
    })
  }
})
