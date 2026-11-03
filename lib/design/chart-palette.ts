/**
 * Validated chart palette (ADR-0012). The CSS custom properties `--chart-1..3`
 * in app/globals.css must equal these values; `tests/chart-palette.test.ts`
 * enforces that and runs the color-vision-deficiency (CVD) validator below.
 */
export const CATEGORICAL_PALETTE = {
  light: ["#2a78d6", "#eb6834", "#1baf7a"],
  dark: ["#3987e5", "#d95926", "#199e70"],
} as const

/** Single-hue (blue) sequential ramp for the occupancy heatmap, low to high. */
export const SEQUENTIAL_BLUE_RAMP = {
  light: ["#e8f1fc", "#b9d4f5", "#7fb0ec", "#2a78d6", "#1a4f93"],
  dark: ["#14263d", "#1d4272", "#2c63ab", "#3987e5", "#8dbaf2"],
} as const

type Rgb = readonly [number, number, number]
export type CvdKind = "none" | "protanopia" | "deuteranopia" | "tritanopia"

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear RGB.
const CVD_MATRICES: Record<Exclude<CvdKind, "none">, readonly Rgb[]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
}

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function toLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function linearRgb(hex: string): Rgb {
  const [r, g, b] = hexToRgb(hex)
  return [toLinear(r), toLinear(g), toLinear(b)]
}

function simulate(linear: Rgb, kind: CvdKind): Rgb {
  if (kind === "none") return linear
  const [r0, g0, b0] = linear
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const [m0, m1, m2] = CVD_MATRICES[kind]
  return [
    clamp(m0[0] * r0 + m0[1] * g0 + m0[2] * b0),
    clamp(m1[0] * r0 + m1[1] * g0 + m1[2] * b0),
    clamp(m2[0] * r0 + m2[1] * g0 + m2[2] * b0),
  ]
}

function linearToLab([r, g, b]: Rgb): [number, number, number] {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

/** CIE76 color difference between two hex colors as seen with the given CVD. */
export function colorDifference(a: string, b: string, kind: CvdKind): number {
  const labA = linearToLab(simulate(linearRgb(a), kind))
  const labB = linearToLab(simulate(linearRgb(b), kind))
  return Math.hypot(labA[0] - labB[0], labA[1] - labB[1], labA[2] - labB[2])
}

export const CVD_KINDS: CvdKind[] = ["none", "protanopia", "deuteranopia", "tritanopia"]

/** Smallest pairwise difference across the palette, per vision type. */
export function minPairwiseDifference(
  colors: readonly string[],
  kind: CvdKind
): number {
  let min = Infinity
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      min = Math.min(min, colorDifference(colors[i], colors[j], kind))
    }
  }
  return min
}
