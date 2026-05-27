# Retroppies Photobooth — TODO Tracker

> Last updated: 2026-05-27 — Project fully scaffolded. Build passes. ✅
> Reference: `docs/DEVELOPMENT_GUIDE.md` (2-week roadmap)

---

## Legend
- `[ ]` = Not started
- `[~]` = In progress
- `[x]` = Completed

---

## WEEK 1

### Day 1 — Foundation Setup
- [x] Create project with Vite + React 18 + TypeScript
- [x] Install all dependencies (Zustand, Tailwind, Axios, Framer Motion, react-webcam, Fabric.js, qrcode)
- [x] Configure Tailwind CSS + custom global styles
- [x] Set up Electron (main.ts, preload.ts)
- [x] Create base folder structure (`src/components/*`, `src/store`, `src/services`, `src/utils`, `src/types`)
- [x] Set up environment variable files (`.env.example`, `.env`)
- [x] Configure `vite.config.ts` and `tsconfig.json`
- [x] Configure `electron-builder.json`
- [x] Create App.tsx router skeleton (all 15 halaman routes)
- [x] Create `BackgroundVideo` shared component
- [x] Create `TopTimerBar` shared component (halaman 9–14)
- [x] Create `uiStore` (loading, error, modal, toast)

### Day 2 — Core State + Services
- [x] Implement `authStore` (token, operator, settings)
- [x] Implement `sessionStore` (step, timer, txId, consent)
- [x] Implement `cartStore` (package, addons, voucher, totals)
- [x] Implement `photoStore` (captures, retake)
- [x] Implement `layoutStore` (template, slotMap, filter, canvas)
- [x] Create `authService.ts` (login stub)
- [x] Create `productService.ts` (products, addons)
- [x] Create `voucherService.ts` (validate)
- [x] Create `paymentService.ts` (create transaction, poll status)
- [x] Create `templateService.ts` (get templates)
- [x] Create `finalizeService.ts` (finalize transaction)
- [x] Create `emailService.ts` (send invoice)
- [x] Create `hardwareService.ts` (camera/printer capability)
- [x] Set up Axios instance with base URL + auth interceptor

### Day 3 — Halaman 0–2
- [ ] Build `AdminLoginPage` (Halaman 0)
- [ ] Build `LandingPage` (Halaman 1)
- [ ] Build `HowToUsePage` (Halaman 2)
- [ ] Add hardware status badges (Halaman 0)
- [ ] Add flow guards (redirect if not logged in)
- [ ] Test login → settings sync → redirect to halaman 1

### Day 4 — Halaman 3–6
- [ ] Build `ProductPage` (Halaman 3) — package selection + API
- [ ] Build `ExtraPrintPage` (Halaman 4) — qty stepper
- [ ] Build `AddOnsPage` (Halaman 5) — horizontal scroll + API
- [ ] Build `VoucherPage` (Halaman 6) — input + validate API
- [ ] Wire `cartStore` across all 4 pages
- [ ] Test full product/voucher selection flow

### Day 5 — Halaman 7–9
- [ ] Build `PaymentPage` (Halaman 7) — QRIS + polling
- [ ] Build `PaymentSuccessPage` (Halaman 8) — auto-advance
- [ ] Build `StartPhotoPage` (Halaman 9) — consent + timer init
- [ ] Create transaction on Halaman 7 load
- [ ] Poll `/transactions/{id}/status` every 3s
- [ ] Bootstrap session timer on consent confirm
- [ ] Test end-to-end payment flow (mock PAID status)

---

## WEEK 2

### Day 1 — Halaman 10 (Take Photo)
- [ ] Build `TakePhotoPage` (Halaman 10)
- [ ] Integrate `react-webcam` live preview
- [ ] Implement shutter capture (4 shots)
- [ ] Implement retake per slot
- [ ] Display thumbnail grid
- [ ] Start `MediaRecorder` video recording on session start
- [ ] Enable Next only when all 4 slots captured

### Day 2 — Halaman 11–12
- [ ] Build `TemplatePage` (Halaman 11) — fetch + display 4 templates
- [ ] Build `DragDropPage` (Halaman 12) — Fabric.js canvas
- [ ] Implement photo tray (draggable photo list)
- [ ] Implement slot drop validation (all slots filled)
- [ ] Preview composition on canvas
- [ ] Test drag/drop on touch + mouse

### Day 3 — Halaman 13–14
- [ ] Build `FilterPage` (Halaman 13) — horizontal filter scroller
- [ ] Implement 8 filter previews (WebGL + Canvas2D fallback)
- [ ] Build `FinishedPhotoPage` (Halaman 14) — final preview
- [ ] Implement print trigger via Electron IPC
- [ ] Implement optional email input
- [ ] Add Retroppies branding + transaction QR to print output

### Day 4 — Finalize Integrations
- [ ] Wire `POST /transactions/{id}/finalize` (final image + metadata)
- [ ] Wire `POST /email/send-invoice`
- [ ] Save/upload video recording to backend
- [ ] Generate QR code (transaction URL) on Halaman 14
- [ ] Verify printer IPC bridge (Electron → native printer)
- [ ] Test complete flow from halaman 1 → 14 → auto-reset to 1

### Day 5 — Stabilization & Deployment Prep
- [ ] End-to-end regression tests (happy path halaman 1→14)
- [ ] Handle edge cases: payment timeout, camera fail, printer fail
- [ ] Session timeout → auto reset to halaman 1
- [ ] Kiosk hardening: fullscreen recovery on crash/close
- [ ] Configure production environment variables
- [ ] Verify printer detection on target OS
- [ ] Verify camera permission flow
- [ ] Build and test Electron production package
- [ ] Sign/notarize package (if macOS)
- [ ] Final deployment checklist review

---

## Infrastructure & Config
- [x] `.github/copilot-instructions.md` — Copilot persistent rules
- [ ] `README.md` — Keep up to date with setup instructions
- [ ] CI/CD pipeline (optional: GitHub Actions)
- [ ] Monitoring/logging endpoint configured for production

---

## Notes
- Freeze API interfaces after Week 1 Day 5
- UI polish only after functional acceptance per halaman
- Filter previews: downscale during interaction, full-res on finalize only
- Timer visible on halaman 9–14 only (TopTimerBar)
- Session auto-resets to **halaman 1** (not halaman 0/login)
