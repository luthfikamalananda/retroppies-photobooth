# Filters Implementation Guide

## Supported Filters (8)
1. Original — no transform.
2. Vivid — +saturation, +contrast, slight sharpen.
3. Sepia — sepia matrix tone.
4. Grayscale — luminance weighted conversion.
5. Warm — red/yellow lift, slight shadows.
6. Cold — blue/cyan lift, mild contrast.
7. Polaroid — soft fade + warm highlights.
8. Vignette — radial edge darkening.

## Implementation (Canvas/WebGL)
- Use WebGL shader pipeline when available for realtime preview.
- Fallback to Canvas2D pixel processing if WebGL unavailable.
- Keep canonical filter params in a single config map.

Example config shape:
```ts
{
  id: 'vivid',
  uniforms: { saturation: 1.2, contrast: 1.15 },
  cssFallback: 'saturate(1.2) contrast(1.15)'
}
```

## Realtime Preview Requirements
- Preview update target: <= 100ms interaction response.
- Selected filter state must persist across page navigation.
- Preview must reflect final template composition (not single photo only).

## Performance Optimization Tips
- Render preview at reduced resolution while scrolling filter list.
- Throttle filter recompute during drag/gesture events.
- Memoize decoded images and WebGL textures.
- Render full-resolution output only on final export/print.
- Release offscreen canvases when page unmounts.
