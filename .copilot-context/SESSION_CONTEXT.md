# Retroppies Photobooth — Session Context

## 1) Product Snapshot
Retroppies Photobooth is a kiosk-style, vintage-themed photo experience for touchscreen cafe environments. Users go from product/payment setup to timed photo capture, template composition, filter styling, and final print/email delivery.

**Terminology:** "Halaman" = "Page" in Indonesian.

## 2) 15 Halaman Specifications (Halaman 0–14)

| Halaman | Name | Purpose | Core Elements | Navigation |
|---|---|---|---|---|
| 0 | Admin Login | Secure kiosk activation and settings sync | Username/password, remember toggle, device status | Success → 1 |
| 1 | Landing | Attract mode and session start | VHS video loop, brand logo, Start button | Start → 2 |
| 2 | How To Use | Fast onboarding | 3-4 step cards, skip button, progress indicator | Next/Skip → 3 |
| 3 | Choose Product | Choose package/bundle | Product cards, pricing, selection highlight | Back → 2, Next → 4 |
| 4 | Extra Print | Add print quantity | Stepper +/- qty, subtotal panel | Back → 3, Next → 5 |
| 5 | Add Ons | Add merchandise | Horizontal scroll cards (drink, fries, keychain), qty controls | Back → 4, Next → 6 |
| 6 | Voucher | Discount handling | Voucher input, apply button, validation message | Back → 5, Next → 7 |
| 7 | Payment (QRIS) | Collect payment | QR image, countdown, amount summary, status polling | Back → 6, Success → 8 |
| 8 | Payment Success | Confirm payment and initialize session | Success animation, transaction ID | Auto → 9 |
| 9 | Time Limit / Start Photo | Explain timed session and permission | Session timer summary, camera/privacy consent, Start Photo | Back disabled, Start → 10 |
| 10 | Take Photo | Capture 4 photos | Live webcam preview, shutter button, 2x2/2x3 thumbnail grid, retake icon, timer | Back → 9, Next → 11 |
| 11 | Choose Template | Select frame layout | 4 template cards with mini previews, timer | Back → 10, Next → 12 |
| 12 | Drag & Drop | Map photos to template slots | Slot canvas (numbered), draggable photo tray, timer | Back → 11, Next → 13 |
| 13 | Choose Filter | Style final image | Horizontal filter scroller, realtime preview, active filter chip | Back → 12, Next → 14 |
| 14 | Finished Photo | Final review and trigger print | Full composition preview, print button, email field optional, done state | Back → 13, Print → finalize + return 1 |

## 3) Tech Stack Decisions
- **React 18 + TypeScript** for predictable typed UI workflows.
- **Vite 5** for fast development and optimized build output.
- **Electron 27+** for kiosk mode + native printer access.
- **Zustand** for lightweight cross-page flow state.
- **Tailwind CSS + custom CSS** for rapid, responsive UI and vintage styling.
- **Fabric.js** for drag-and-drop template slot composition.
- **Framer Motion** for smooth transitions and horizontal gesture interactions.
- **react-webcam + MediaRecorder API** for capture/recording.
- **Axios** for API communication.

## 4) Architecture Overview
- **Presentation layer:** page components per halaman.
- **Domain state layer:** Zustand stores (`auth`, `session`, `cart`, `photo`, `layout`, `ui`).
- **Service layer:** `authService`, `productService`, `voucherService`, `paymentService`, `templateService`, `finalizeService`, `emailService`.
- **Integration layer:** Electron IPC handlers for printer/camera capability checks.

## 5) API Integration Details
- `POST /auth/login`
- `GET /products`
- `POST /vouchers/validate`
- `POST /transactions/create`
- `GET /transactions/{id}/status`
- `GET /templates`
- `POST /transactions/{id}/finalize`
- `POST /email/send-invoice`

## 6) Development Timeline (2 Weeks)
- **Week 1:** setup, halaman 0–9, payment integration.
- **Week 2:** halaman 10–14, filters, print/email/video finalize, hardening/testing.

## 7) Key Implementation Notes
- Timer starts at halaman 9 and persists until print complete.
- Payment success (halaman 8) initializes recording context and session ID.
- Drag/drop uses slot-based validation (all mandatory slots filled before next).
- Filter preview must be realtime and performant on kiosk GPUs.
- Print output always includes Retroppies branding and transaction QR.

## 8) State Management Structure
- **authStore:** login token, operator profile, device flags.
- **sessionStore:** session timer, transactionId, consent flags, flow step.
- **cartStore:** package, extra prints, add-ons, voucher, totals.
- **photoStore:** raw captures, selected captures, retake metadata.
- **layoutStore:** selected template, slot map, selected filter, final canvas.
- **uiStore:** modals, toasts, loading/error states, offline flags.

## 9) Component Hierarchy (High-Level)
- `AppShell`
  - `BackgroundVideo`
  - `TopTimerBar`
  - `PageRouter`
    - `AuthPage`
    - `LandingPage`
    - `HowToUsePage`
    - `ProductPage`
    - `ExtraPrintPage`
    - `AddOnsPage`
    - `VoucherPage`
    - `PaymentPage`
    - `PaymentSuccessPage`
    - `StartPhotoPage`
    - `TakePhotoPage`
    - `TemplatePage`
    - `DragDropPage`
    - `FilterPage`
    - `FinishedPhotoPage`
  - `GlobalModalHost`
  - `ToastHost`
