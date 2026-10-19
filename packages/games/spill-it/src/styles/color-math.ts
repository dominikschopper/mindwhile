// Pure color helpers for the palette checks. Not used at runtime.

export type Rgb = readonly [number, number, number]
export type Matrix = readonly [Rgb, Rgb, Rgb]

export const visionCases = ['normal', 'protan', 'deutan', 'tritan'] as const
export type VisionCase = (typeof visionCases)[number]

// Machado et al. (2009), severity 1.0, applied to linear RGB.
const machado: Record<Exclude<VisionCase, 'normal'>, Matrix> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
}

const whitePoint: Rgb = [0.95047, 1, 1.08883]

export const hexToRgb = (hex: string): Rgb => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) throw new Error(`Invalid hex color: ${hex}`)
  const value = parseInt(match[1]!, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const toLinear = (channel: number): number => {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

export const toLinearRgb = (rgb: Rgb): Rgb => [toLinear(rgb[0]), toLinear(rgb[1]), toLinear(rgb[2])]

export const relativeLuminance = (hex: string): number => {
  const [r, g, b] = toLinearRgb(hexToRgb(hex))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Returns linear RGB as seen with the given vision case.
export const simulateLinear = (hex: string, vision: VisionCase): Rgb => {
  const linear = toLinearRgb(hexToRgb(hex))
  if (vision === 'normal') return linear
  const m = machado[vision]
  const row = (r: Rgb): number => clamp01(r[0] * linear[0] + r[1] * linear[1] + r[2] * linear[2])
  return [row(m[0]), row(m[1]), row(m[2])]
}

export type Lab = readonly [number, number, number]

export const linearToLab = ([r, g, b]: Rgb): Lab => {
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
  const z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b
  const f = (t: number): number => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116)
  const fx = f(x / whitePoint[0])
  const fy = f(y / whitePoint[1])
  const fz = f(z / whitePoint[2])
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export const labFor = (hex: string, vision: VisionCase): Lab =>
  linearToLab(simulateLinear(hex, vision))

// CIE76 color difference.
export const deltaE76 = (a: Lab, b: Lab): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

export const pairDeltaE = (hexA: string, hexB: string, vision: VisionCase): number =>
  deltaE76(labFor(hexA, vision), labFor(hexB, vision))
