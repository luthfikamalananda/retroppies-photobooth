/**
 * colorGrading.ts
 *
 * Engine color grading ringan menggunakan Canvas 2D + manipulasi pixel manual.
 * Dipilih dibanding CSS filter karena CSS filter HANYA bisa menggeser channel
 * warna secara global (saturate/hue-rotate/sepia) — tidak bisa melakukan:
 *   - Split-tone (shadows ditint warna A, highlights ditint warna B)
 *   - Tone curve per-channel (S-curve kontras yang natural seperti film)
 *   - Vignette yang presisi
 *   - Film grain/noise organik
 *
 * Dipilih dibanding WebGL karena:
 *   - Operasi ini hanya dijalankan SEKALI per foto (bukan animasi real-time),
 *     sehingga overhead compile shader WebGL justru lebih lambat di first-run
 *     dibanding manipulasi pixel langsung di Canvas 2D (CPU-based).
 *   - Tidak perlu GLSL, tidak ada dependency tambahan, kompatibel di semua
 *     device tanpa risiko GPU driver issue (penting untuk mini PC low-end).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColorGradeOptions {
    /** Kurva per channel — titik kontrol untuk shadows/midtones/highlights */
    curve?: {
        r?: [number, number][] // [input, output] pairs, 0-255
        g?: [number, number][]
        b?: [number, number][]
    }
    /** Split-tone: tint warna untuk shadow dan highlight secara terpisah */
    splitTone?: {
        shadowColor: [number, number, number] // RGB
        shadowIntensity: number // 0-1
        highlightColor: [number, number, number]
        highlightIntensity: number // 0-1
    }
    /** Saturasi global (1 = normal, 0 = grayscale, >1 = lebih jenuh) */
    saturation?: number
    /** Kontras tambahan (1 = normal) */
    contrast?: number
    /** Brightness tambahan (0 = normal, range -50 to 50) */
    brightness?: number
    /** Vignette — gelap di pinggir */
    vignette?: {
        intensity: number // 0-1
        radius: number // 0-1, seberapa jauh dari tengah vignette mulai muncul
    }
    /** Film grain — noise halus */
    grain?: {
        intensity: number // 0-1
    }
}

// ─── Lookup table generator untuk curve (precompute, jauh lebih cepat dari per-pixel calc) ──

function buildLUT(points: [number, number][] | undefined): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256)

    if (!points || points.length === 0) {
        for (let i = 0; i < 256; i++) lut[i] = i
        return lut
    }

    const sorted = [...points].sort((a, b) => a[0] - b[0])
    if (sorted[0][0] !== 0) sorted.unshift([0, sorted[0][1]])
    if (sorted[sorted.length - 1][0] !== 255) sorted.push([255, sorted[sorted.length - 1][1]])

    for (let i = 0; i < 256; i++) {
        let p1 = sorted[0]
        let p2 = sorted[sorted.length - 1]

        for (let j = 0; j < sorted.length - 1; j++) {
            if (i >= sorted[j][0] && i <= sorted[j + 1][0]) {
                p1 = sorted[j]
                p2 = sorted[j + 1]
                break
            }
        }

        const [x1, y1] = p1
        const [x2, y2] = p2
        const t = x2 === x1 ? 0 : (i - x1) / (x2 - x1)
        lut[i] = y1 + t * (y2 - y1)
    }

    return lut
}

// ─── Main apply function ──────────────────────────────────────────────────────

export function applyColorGrade(
    canvas: HTMLCanvasElement,
    options: ColorGradeOptions
): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    const lutR = buildLUT(options.curve?.r)
    const lutG = buildLUT(options.curve?.g)
    const lutB = buildLUT(options.curve?.b)

    const saturation = options.saturation ?? 1
    const contrast = options.contrast ?? 1
    const brightness = options.brightness ?? 0

    const splitTone = options.splitTone
    const vignette = options.vignette
    const grain = options.grain

    const centerX = width / 2
    const centerY = height / 2
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i]
        let g = data[i + 1]
        let b = data[i + 2]

        r = lutR[r]
        g = lutG[g]
        b = lutB[b]

        if (brightness !== 0) {
            r += brightness
            g += brightness
            b += brightness
        }

        if (contrast !== 1) {
            r = (r - 128) * contrast + 128
            g = (g - 128) * contrast + 128
            b = (b - 128) * contrast + 128
        }

        if (saturation !== 1) {
            const gray = r * 0.299 + g * 0.587 + b * 0.114
            r = gray + (r - gray) * saturation
            g = gray + (g - gray) * saturation
            b = gray + (b - gray) * saturation
        }

        if (splitTone) {
            const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255

            const shadowWeight = Math.max(0, 1 - luminance * 2) * splitTone.shadowIntensity
            if (shadowWeight > 0) {
                r = r * (1 - shadowWeight) + splitTone.shadowColor[0] * shadowWeight
                g = g * (1 - shadowWeight) + splitTone.shadowColor[1] * shadowWeight
                b = b * (1 - shadowWeight) + splitTone.shadowColor[2] * shadowWeight
            }

            const highlightWeight = Math.max(0, luminance * 2 - 1) * splitTone.highlightIntensity
            if (highlightWeight > 0) {
                r = r * (1 - highlightWeight) + splitTone.highlightColor[0] * highlightWeight
                g = g * (1 - highlightWeight) + splitTone.highlightColor[1] * highlightWeight
                b = b * (1 - highlightWeight) + splitTone.highlightColor[2] * highlightWeight
            }
        }

        if (vignette && vignette.intensity > 0) {
            const pixelIndex = i / 4
            const x = pixelIndex % width
            const y = Math.floor(pixelIndex / width)
            const dx = x - centerX
            const dy = y - centerY
            const dist = Math.sqrt(dx * dx + dy * dy) / maxDist

            const vignetteFactor = Math.max(
                0,
                1 - Math.max(0, (dist - vignette.radius) / (1 - vignette.radius)) * vignette.intensity
            )

            r *= vignetteFactor
            g *= vignetteFactor
            b *= vignetteFactor
        }

        if (grain && grain.intensity > 0) {
            const noise = (Math.random() - 0.5) * 255 * grain.intensity * 0.15
            r += noise
            g += noise
            b += noise
        }

        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
    }

    ctx.putImageData(imageData, 0, 0)
}

// ─── Preset definitions untuk 6 filter yang diminta ───────────────────────────

export const COLOR_GRADE_PRESETS: Record<string, ColorGradeOptions> = {
    kodakVintage: {
        curve: {
            r: [[0, 15], [64, 75], [128, 145], [192, 205], [255, 245]],
            g: [[0, 10], [128, 130], [255, 240]],
            b: [[0, 25], [128, 115], [255, 215]],
        },
        splitTone: {
            shadowColor: [60, 40, 30],
            shadowIntensity: 0.25,
            highlightColor: [255, 230, 180],
            highlightIntensity: 0.2,
        },
        saturation: 0.85,
        contrast: 0.92,
        brightness: 8,
        vignette: { intensity: 0.25, radius: 0.5 },
        grain: { intensity: 0.3 },
    },

    noirFilm: {
        curve: {
            r: [[0, 0], [64, 40], [128, 128], [192, 215], [255, 255]],
            g: [[0, 0], [64, 40], [128, 128], [192, 215], [255, 255]],
            b: [[0, 0], [64, 40], [128, 128], [192, 215], [255, 255]],
        },
        saturation: 0,
        contrast: 1.35,
        brightness: -5,
        vignette: { intensity: 0.4, radius: 0.4 },
        grain: { intensity: 0.35 },
    },

    digicam2000s: {
        curve: {
            r: [[0, 5], [128, 140], [255, 255]],
            g: [[0, 5], [128, 135], [255, 255]],
            b: [[0, 10], [128, 145], [255, 255]],
        },
        saturation: 1.45,
        contrast: 1.2,
        brightness: 12,
        grain: { intensity: 0.15 },
    },

    '80sRetro': {
        curve: {
            r: [[0, 20], [128, 150], [255, 250]],
            g: [[0, 10], [128, 125], [255, 230]],
            b: [[0, 30], [128, 110], [255, 200]],
        },
        splitTone: {
            shadowColor: [80, 30, 90],
            shadowIntensity: 0.2,
            highlightColor: [255, 180, 100],
            highlightIntensity: 0.25,
        },
        saturation: 1.15,
        contrast: 0.95,
        brightness: 5,
        vignette: { intensity: 0.2, radius: 0.55 },
        grain: { intensity: 0.2 },
    },

    dramaticBW: {
        curve: {
            r: [[0, 0], [50, 20], [128, 120], [200, 230], [255, 255]],
            g: [[0, 0], [50, 20], [128, 120], [200, 230], [255, 255]],
            b: [[0, 0], [50, 20], [128, 120], [200, 230], [255, 255]],
        },
        saturation: 0,
        contrast: 1.6,
        brightness: -10,
        vignette: { intensity: 0.35, radius: 0.35 },
        grain: { intensity: 0.2 },
    },

    dreamyVintage: {
        curve: {
            r: [[0, 35], [128, 150], [255, 240]],
            g: [[0, 30], [128, 145], [255, 235]],
            b: [[0, 40], [128, 140], [255, 230]],
        },
        splitTone: {
            shadowColor: [200, 190, 220],
            shadowIntensity: 0.3,
            highlightColor: [255, 245, 220],
            highlightIntensity: 0.25,
        },
        saturation: 0.75,
        contrast: 0.8,
        brightness: 15,
        vignette: { intensity: 0.15, radius: 0.6 },
        grain: { intensity: 0.1 },
    },
}