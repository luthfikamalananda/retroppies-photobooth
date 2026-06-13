/**
 * Represents a single photo slot in a template layout.
 * All coordinates are relative (0..1) to the template image dimensions,
 * so they scale correctly regardless of display or production resolution.
 *
 * Origin (0,0) is top-left corner.
 */
export interface SlotDef {
  /** Slot index (0-based) */
  index: number;
  /** Left edge, as fraction of template width  (0..1) */
  x: number;
  /** Top edge, as fraction of template height (0..1) */
  y: number;
  /** Width, as fraction of template width  (0..1) */
  w: number;
  /** Height, as fraction of template height (0..1) */
  h: number;
  _pxHint?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
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
