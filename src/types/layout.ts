/**
 * Represents a single photo slot in a template layout.
 * All coordinates are relative (0..1) to the template image dimensions,
 * so they scale correctly regardless of display or production resolution.
 *
 * Origin (0,0) is top-left corner.
 */
export interface SlotDef {
  index: number;
  // Format baru (dengan rotasi) — titik tengah
  cx: number;
  cy: number;
  // Bersama
  w: number;
  h: number;
  angle?: number; // derajat, searah jarum jam
  _pxHint?: {
    cx: number;
    cy: number;
    w: number;
    h: number;
  };
}

/**
 * Full layout definition for one template layout.
 * Matches backend `layoutId` so they stay in sync.
 */
export interface LayoutDef {
  /** Must match the layoutId coming from the backend template records */
  layoutId: number;
  name: string;
  slotCount: number;
  slots: SlotDef[];
  templateSize?: {
    w?: number;
    h?: number;
  };
}
