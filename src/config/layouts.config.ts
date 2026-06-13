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
    layoutId: 1,
    name: "2x2 Grid",
    slotCount: 4,
    templateSize: {
      w: 1414,
      h: 2000,
    },
    slots: [
      {
        index: 0,
        x: 0.122,
        y: 0.2275,
        w: 0.3518,
        h: 0.2975,
        _pxHint: {
          x: 173,
          y: 455,
          w: 497,
          h: 595,
        },
      },
      {
        index: 1,
        x: 0.5251,
        y: 0.2275,
        w: 0.3518,
        h: 0.295,
        _pxHint: {
          x: 742,
          y: 455,
          w: 497,
          h: 590,
        },
      },
      {
        index: 2,
        x: 0.1238,
        y: 0.5587,
        w: 0.3501,
        h: 0.2963,
        _pxHint: {
          x: 175,
          y: 1117,
          w: 495,
          h: 593,
        },
      },
      {
        index: 3,
        x: 0.5233,
        y: 0.5563,
        w: 0.3554,
        h: 0.2975,
        _pxHint: {
          x: 740,
          y: 1113,
          w: 503,
          h: 595,
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Layout 2 — 2×2 Grid (4 foto dalam grid 2 kolom 2 baris)
  // Digunakan oleh: template "Lana Del Rey", dll.
  // ─────────────────────────────────────────────────────────
  {
    layoutId: 2,
    name: "4 Foto Vertical Right",
    slotCount: 4,
    templateSize: {
      w: 4419,
      h: 6250,
    },
    slots: [
      {
        index: 0,
        x: 0.6862,
        y: 0.0836,
        w: 0.232,
        h: 0.2152,
        _pxHint: {
          x: 3032,
          y: 523,
          w: 1025,
          h: 1345,
        },
      },
      {
        index: 1,
        x: 0.6676,
        y: 0.3012,
        w: 0.2303,
        h: 0.214,
        _pxHint: {
          x: 2950,
          y: 1883,
          w: 1018,
          h: 1338,
        },
      },
      {
        index: 2,
        x: 0.6495,
        y: 0.5176,
        w: 0.2455,
        h: 0.2116,
        _pxHint: {
          x: 2870,
          y: 3235,
          w: 1085,
          h: 1323,
        },
      },
      {
        index: 3,
        x: 0.6325,
        y: 0.732,
        w: 0.2308,
        h: 0.2228,
        _pxHint: {
          x: 2795,
          y: 4575,
          w: 1020,
          h: 1393,
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Layout 3 — Vertical Strip (4 foto sejajar vertikal)
  // Digunakan oleh: template "Short n' Sweet", dll.
  // ─────────────────────────────────────────────────────────
  {
    layoutId: 3,
    name: "Single Center",
    slotCount: 1,
    templateSize: {
      w: 4419,
      h: 6250,
    },
    slots: [
      {
        index: 0,
        x: 0.1378,
        y: 0.1905,
        w: 0.7262,
        h: 0.4916,
        _pxHint: {
          x: 609,
          y: 1191,
          w: 3209,
          h: 3073,
        },
      },
    ],
  },
];

/**
 * Helper: ambil layout berdasarkan layoutId.
 * Returns undefined jika tidak ditemukan.
 */
export function getLayoutDef(layoutId: number): LayoutDef | undefined {
  return LAYOUTS.find((l) => l.layoutId === layoutId);
}
