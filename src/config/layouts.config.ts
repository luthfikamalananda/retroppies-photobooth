/**
 * layouts.config.ts
 *
 * Definisi koordinat slot untuk setiap layout template.
 * Koordinat dalam format RELATIF (0..1) — berlaku untuk
 * semua resolusi (display preview maupun production print).
 *
 * ─── CARA UPDATE ───────────────────────────────────────────
 * Buka tools/slot-mapper/index.html di browser,
 * load template PNG yang sesuai, gambar area slot,
 * lalu copy/paste hasil JSON ke sini.
 * ───────────────────────────────────────────────────────────
 */

import type { LayoutDef } from "@/types/layout";

export const LAYOUTS: LayoutDef[] = [
  // ─────────────────────────────────────────────────────────
  // Layout 1 — Single Center (1 foto besar di tengah)
  // Digunakan oleh: template "On Tour", dll.
  // Diukur dengan slot-mapper dari template asli.
  // TODO: Sesuaikan koordinat berikut dengan template PNG asli
  //       menggunakan tools/slot-mapper/index.html
  // ─────────────────────────────────────────────────────────
  {
    "layoutId": 1,
    "name": "2x2 Grid",
    "slotCount": 4,
    "templateSize": {
      "w": 1414,
      "h": 2000
    },
    "slots": [
      {
        "index": 0,
        "cx": 0.299,
        "cy": 0.3765,
        "w": 0.3447,
        "h": 0.2869,
        "angle": 0,
        "_pxHint": {
          "cx": 423,
          "cy": 753,
          "w": 487,
          "h": 574
        }
      },
      {
        "index": 1,
        "cx": 0.7007,
        "cy": 0.3757,
        "w": 0.3467,
        "h": 0.2883,
        "angle": 0,
        "_pxHint": {
          "cx": 991,
          "cy": 751,
          "w": 490,
          "h": 577
        }
      },
      {
        "index": 2,
        "cx": 0.2983,
        "cy": 0.7058,
        "w": 0.3454,
        "h": 0.2893,
        "angle": 0,
        "_pxHint": {
          "cx": 422,
          "cy": 1412,
          "w": 488,
          "h": 579
        }
      },
      {
        "index": 3,
        "cx": 0.7014,
        "cy": 0.7058,
        "w": 0.3522,
        "h": 0.2922,
        "angle": 0,
        "_pxHint": {
          "cx": 992,
          "cy": 1412,
          "w": 498,
          "h": 584
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────
  // Layout 2 — 2×2 Grid (4 foto dalam grid 2 kolom 2 baris)
  // Digunakan oleh: template "Lana Del Rey", dll.
  // ─────────────────────────────────────────────────────────
  {
    "layoutId": 2,
    "name": "1x4 Grid",
    "slotCount": 4,
    "templateSize": {
      "w": 1414,
      "h": 2000
    },
    "slots": [
      {
        "index": 0,
        "cx": 0.7306,
        "cy": 0.1938,
        "w": 0.2168,
        "h": 0.21,
        "angle": 2.5,
        "_pxHint": {
          "cx": 1033,
          "cy": 388,
          "w": 307,
          "h": 420
        }
      },
      {
        "index": 1,
        "cx": 0.7162,
        "cy": 0.4106,
        "w": 0.2163,
        "h": 0.208,
        "angle": 2.5,
        "_pxHint": {
          "cx": 1013,
          "cy": 821,
          "w": 306,
          "h": 416
        }
      },
      {
        "index": 2,
        "cx": 0.7002,
        "cy": 0.6289,
        "w": 0.2233,
        "h": 0.2096,
        "angle": 2.5,
        "_pxHint": {
          "cx": 990,
          "cy": 1258,
          "w": 316,
          "h": 419
        }
      },
      {
        "index": 3,
        "cx": 0.6858,
        "cy": 0.845,
        "w": 0.2236,
        "h": 0.2127,
        "angle": 2,
        "_pxHint": {
          "cx": 970,
          "cy": 1690,
          "w": 316,
          "h": 425
        }
      }
    ]
  },

  // ─────────────────────────────────────────────────────────
  // Layout 3 — Vertical Strip (4 foto sejajar vertikal)
  // Digunakan oleh: template "Short n' Sweet", dll.
  // ─────────────────────────────────────────────────────────
  {
    "layoutId": 3,
    "name": "1x1 Grid",
    "slotCount": 1,
    "templateSize": {
      "w": 1414,
      "h": 2000
    },
    "slots": [
      {
        "index": 0,
        "cx": 0.4997,
        "cy": 0.434,
        "w": 0.7219,
        "h": 0.4943,
        "angle": 0,
        "_pxHint": {
          "cx": 707,
          "cy": 868,
          "w": 1021,
          "h": 989
        }
      }
    ]
  }
];

/**
 * Helper: ambil layout berdasarkan layoutId.
 * Returns undefined jika tidak ditemukan.
 */
export function getLayoutDef(layoutId: number): LayoutDef | undefined {
  return LAYOUTS.find((l) => l.layoutId === layoutId);
}
