# 15 Halaman Detailed Page Specification

## Shared Layout Rules
- Landscape fullscreen kiosk layout.
- Safe-area centered content with fixed top timer zone (halaman 9–14).
- Bottom navigation zone for Back/Next where applicable.

## Halaman 0 — Admin Login
- **Positioning:** centered login card; hardware status badges top-right.
- **Responsive:** card width clamps from 420px to 640px.
- **Interactions:** submit on Enter/tap login.
- **Loading:** button spinner during auth.
- **Error:** invalid credential inline error.
- **Success:** transition to halaman 1.

## Halaman 1 — Landing
- **Positioning:** logo center, Start CTA bottom-center.
- **Responsive:** preserve visual hierarchy on 15" screens.
- **Interactions:** tap Start.
- **Loading/Error:** none.
- **Success:** transition to 2.

## Halaman 2 — How To Use
- **Positioning:** instruction cards center; Skip top-right.
- **Responsive:** cards wrap 2x2 on lower widths.
- **Interaction:** Next/Skip.
- **Error:** none.

## Halaman 3 — Choose Product
- **Positioning:** horizontal card list center; summary right/bottom.
- **Responsive:** cards become 2-column grid if needed.
- **Interaction:** single select package.
- **Loading:** skeleton cards.
- **Error:** product fetch failed state + retry.

## Halaman 4 — Extra Print
- **Positioning:** quantity control center, price summary side panel.
- **Interaction:** plus/minus qty.
- **Error:** qty boundary message.

## Halaman 5 — Add Ons
- **Positioning:** horizontal scroll carousel of add-on cards.
- **Responsive:** swipe gestures for touch.
- **Interaction:** increment/decrement each add-on.
- **Loading/Error:** same as product page.

## Halaman 6 — Voucher
- **Positioning:** input center, status message beneath.
- **Interaction:** apply/reset voucher.
- **Loading:** inline spinner on apply.
- **Error:** invalid/expired voucher states.
- **Success:** discount shown in summary.

## Halaman 7 — Payment (QRIS)
- **Positioning:** QR center-left, summary and countdown right.
- **Interaction:** passive polling; cancel/back optional.
- **Loading:** initial QR generation.
- **Error:** create transaction fail, poll timeout.
- **Success:** paid status triggers halaman 8.

## Halaman 8 — Payment Success
- **Positioning:** success icon/message centered.
- **Interaction:** none.
- **Loading:** short delay auto-forward.
- **Success:** auto to halaman 9.

## Halaman 9 — Time Limit / Start Photo
- **Positioning:** timer explainer card centered; Start CTA emphasized.
- **Interaction:** consent checkbox then Start.
- **Error:** blocked if camera permission not granted.

## Halaman 10 — Take Photo
- **Positioning:** large live preview left, capture grid right, shutter center overlay.
- **Responsive:** right panel can stack under preview on smaller screens.
- **Interaction:** capture, retake individual slot, proceed when required shots complete.
- **Loading:** camera initialization state.
- **Error:** camera unavailable and retry/help prompt.
- **Success:** all slots filled enables Next.

## Halaman 11 — Choose Template
- **Positioning:** 4 template cards center grid; timer top-right.
- **Interaction:** select one card.
- **Loading:** template skeletons.
- **Error:** template fetch failed + retry.

## Halaman 12 — Drag & Drop
- **Positioning:** template slot canvas left, draggable photo tray right.
- **Responsive:** split view with adaptive ratio.
- **Interaction:** drag photo to numbered slots, replace by dropping again.
- **Error:** missing slot assignment blocks Next.
- **Success:** all mandatory slots mapped.

## Halaman 13 — Choose Filter
- **Positioning:** large preview center; horizontal filter strip bottom.
- **Interaction:** tap/swipe to choose filter, instant preview update.
- **Loading:** preview recompute indicator for heavy devices.
- **Error:** fallback to Original if rendering fails.
- **Success:** selected filter persisted and Next enabled.

## Halaman 14 — Finished Photo (Review + Print)
- **Positioning:** final composition preview dominant center; print CTA bottom-right; optional email input side panel.
- **Interaction:** Print triggers finalize + print pipeline; optional send email.
- **Loading:** blocking progress modal during finalize/print.
- **Error:** print failed (retry/change printer), finalize failed (retry).
- **Success:** confirmation shown then auto-return to halaman 1.
