# Product Requirements Document (PRD)

## Purpose
Deliver a touchscreen photobooth kiosk app with a complete 15-page (halaman) flow from admin login to final print trigger.

## Goals
- Fast, fun vintage photobooth journey.
- Reliable payment and print outcomes.
- Touch-first UX on 15"–24" landscape displays.

## Detailed 15 Halaman Specs

| Halaman | Purpose | Main Flow | UI Elements | Navigation | Data/API |
|---|---|---|---|---|---|
| 0 Login | Admin auth | Login → fetch config | Inputs, login CTA, hardware status | 0 → 1 | `POST /auth/login` |
| 1 Landing | Start session | Idle attract → start | VHS bg, logo, Start | 1 → 2 | none |
| 2 How To Use | Explain steps | Read or skip | Step cards, skip | 2 → 3 | none |
| 3 Product | Choose package | Select one package | Product cards, price | 3 ↔ 4 | `GET /products` |
| 4 Extra Print | Add copies | Qty adjust | Stepper, summary | 4 ↔ 5 | local calc |
| 5 Add Ons | Add merchandise | Select add-ons | Horizontal scroller cards | 5 ↔ 6 | `GET /products?type=addon` |
| 6 Voucher | Discount | Input + validate | Input, apply, feedback | 6 ↔ 7 | `POST /vouchers/validate` |
| 7 Payment | Pay with QRIS | Show QR + poll | QR, timer, amount | 7 ↔ 6, success → 8 | `POST /transactions/create`, `GET /transactions/{id}/status` |
| 8 Payment Success | Confirm payment | Show success then advance | Success icon, tx ID | auto → 9 | status from tx |
| 9 Start Photo | Prepare session | Consent + start | Time info, start CTA | 9 → 10 | update session |
| 10 Take Photo | Capture 4 shots | Capture/retake until complete | Webcam preview, shutter, thumbnails | 10 ↔ 11 | local media |
| 11 Choose Template | Select frame | Pick template card | 4 template cards, timer | 11 ↔ 12 | `GET /templates` |
| 12 Drag & Drop | Arrange photos | Drag tray → slots | Slot canvas, draggable images | 12 ↔ 13 | local canvas data |
| 13 Choose Filter | Apply style | Select filter, preview update | Horizontal filter selector | 13 ↔ 14 | local filter render |
| 14 Finished Photo | Review & trigger print | Confirm result → print/finalize | Final preview, print CTA, optional email input | 14 ↔ 13, done → 1 | `POST /transactions/{id}/finalize`, `POST /email/send-invoice` |

## Special Effects & Animation
- VHS looping background video on all user-facing pages.
- Animated transitions (slide/fade) between halaman.
- Filter preview transition <150ms perceived latency.

## Filter Specifications
Original, Vivid, Sepia, Grayscale, Warm, Cold, Polaroid, Vignette.

## Print Output Specs
- Paper: A4 portrait (primary), optional thermal receipt summary.
- Include: composed photo strip/poster, Retroppies branding, transaction QR.
- Margins safe-zone for printer variance.

## Technical Requirements
- Kiosk fullscreen mode.
- Touch targets >= 48x48px.
- Offline/error fallbacks for network-dependent steps.
- Session timeout handling and auto-reset to halaman 1.

## Hardware Requirements
- Webcam 1080p+, touchscreen monitor 15"–24" landscape.
- Printer (inkjet/laser A4; optional thermal receipt).
- Stable internet for payment, email, upload.
