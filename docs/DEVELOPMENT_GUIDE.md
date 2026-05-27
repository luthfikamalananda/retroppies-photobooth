# Development Guide (2-Week Roadmap)

## Week 1 (5 Days)

### Day 1 — Foundation Setup
- Create base app shell, routing skeleton, design tokens.
- Dependencies: React, TS, Zustand, Tailwind, Axios, Framer Motion.
- Files: `src/App.tsx`, `src/styles/*`, `src/store/uiStore.ts`.

### Day 2 — Core State + Services
- Implement stores (`auth`, `session`, `cart`).
- Implement auth/product/voucher/payment service stubs.
- Files: `src/store/*`, `src/services/*`.
- Dependency: Day 1 shell complete.

### Day 3 — Halaman 0–2
- Build Admin Login, Landing, How To Use pages.
- Add hardware detection placeholders and flow guards.
- Dependency: Day 2 auth/session store.

### Day 4 — Halaman 3–6
- Build product, extra print, add-ons (horizontal scroll), voucher pages.
- Integrate products and voucher validation APIs.
- Dependency: Day 2 cart + service layer.

### Day 5 — Halaman 7–9
- Build payment QRIS page, success page, start photo page.
- Add payment polling, transaction ID propagation, timer bootstrap.
- Dependency: Day 4 cart finalized.

## Week 2 (5 Days)

### Day 1 — Halaman 10 (Take Photo)
- Integrate webcam capture, retake logic, thumbnail grid.
- Begin recording lifecycle hooks.
- Dependency: session timer + media permissions.

### Day 2 — Halaman 11–12
- Template chooser + drag/drop composition.
- Slot validation and preview rendering.
- Dependencies: captured photos and template service.

### Day 3 — Halaman 13–14
- Filter chooser (8 filters, horizontal scroller).
- Finished photo review with print trigger + optional email.
- Dependencies: composition output from Day 2.

### Day 4 — Finalize Integrations
- Finalize endpoint, email invoice, printer IPC bridge.
- Video save/upload and QR generation wiring.
- Dependencies: complete flow output artifacts.

### Day 5 — Stabilization & Deployment Prep
- End-to-end regression + edge-case handling.
- Kiosk hardening (fullscreen recovery, auto-reset).
- Packaging and deployment checklist execution.

## Daily Dependency Summary
- Each day depends on previous day’s store/service contracts.
- Freeze API interfaces after Week 1 Day 5.
- UI polish only after functional acceptance per page.

## Target File Structure to Create
- `src/components/Auth/*`
- `src/components/Onboarding/*`
- `src/components/Product/*`
- `src/components/Payment/*`
- `src/components/PhotoSession/*`
- `src/store/*`
- `src/services/*`
- `src/utils/filters/*`
- `electron/handlers/*`

## Testing Milestones
- End Week 1: halaman 0–9 happy path functional.
- Week 2 Day 2: photo capture + template mapping deterministic.
- Week 2 Day 3: filter outputs validated against reference snapshots.
- Week 2 Day 5: full halaman 1→14 flow + printer/email fallback tests.

## Deployment Checklist
- [ ] Environment variables configured (API, assets, feature flags)
- [ ] Production API health check passed
- [ ] Printer detection verified on target OS
- [ ] Camera permission flow verified
- [ ] Kiosk fullscreen lock and crash recovery verified
- [ ] Build artifacts signed/package tested
- [ ] Monitoring/logging endpoint enabled
