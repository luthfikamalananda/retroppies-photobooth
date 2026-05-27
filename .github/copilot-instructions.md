# Retroppies Photobooth — GitHub Copilot Instructions

## MANDATORY CONTEXT LOADING

At the **start of every conversation or prompt**, you MUST read the following files before doing anything else:

1. `README.md` — Project overview, tech stack, 15-page flow, quick start instructions.
2. `docs/PRD.md` — Full product requirements, halaman specs, print/filter specs.
3. `docs/ARCHITECTURE.md` — Zustand stores, service layer, folder structure, design patterns.
4. `docs/DEVELOPMENT_GUIDE.md` — 2-week day-by-day roadmap, daily task breakdown.
5. `docs/API_SPECS.md` — All API endpoints with request/response shapes.
6. `docs/FILTERS_GUIDE.md` — 8 filter definitions, WebGL/Canvas2D implementation details.
7. `docs/PAGES_SPECIFICATION.md` — Per-halaman layout rules, interactions, error/loading states.
8. `.copilot-context/SESSION_CONTEXT.md` — Previous session summary: decisions made, terminology, architecture snapshot.
9. `TODO.md` — Current task progress tracker (what's done, in-progress, remaining).

Do NOT skip these reads even if the prompt seems small. These files are the single source of truth.

---

## Project Summary

**Retroppies Photobooth** is a touchscreen kiosk app for vintage cafes (Indonesia).
- React 18 + TypeScript + Vite 5 + Electron 27+
- Zustand (state), Tailwind CSS, Fabric.js (canvas), Framer Motion, react-webcam, Axios
- 15-halaman flow: Admin Login → Landing → Onboarding → Product → Payment → Photo Capture → Template → Filter → Print
- All pages run fullscreen landscape on 15"–24" monitors
- Touch targets ≥ 48×48px, no scroll, VHS video background on every page

---

## Terminology

- **Halaman** = Page (Indonesian). Halaman 0–14 make up the full flow.
- **Slot** = A photo placement zone in a template.
- **Tray** = The draggable photo picker on the drag-drop page.
- **Transaction** = The backend record tied to one full photobooth session.

---

## Code Style Rules

- Functional components only — no class components.
- Named exports for all components (no default unless route-required).
- TypeScript: explicit types on params and return values where non-obvious.
- `interface` for object shapes, `type` for unions/aliases. No `any`.
- One component per file. File name = component name (PascalCase).
- Zustand selectors: use shallow equality selectors to avoid unnecessary rerenders.
- Services = pure async functions that wrap Axios calls; no UI logic in services.
- Co-locate component, styles, and hooks in the same feature folder.
- Tailwind for styling. No inline `style={}` unless dynamically computed.
- Framer Motion for all page transitions and animated state changes.

---

## Folder Structure Reference

```
src/
  components/
    Auth/           # Halaman 0
    Onboarding/     # Halaman 1, 2
    Product/        # Halaman 3, 4, 5, 6
    Payment/        # Halaman 7, 8, 9
    PhotoSession/   # Halaman 10, 11, 12, 13, 14
    Common/         # Shared: TimerBar, BackgroundVideo, Modal, Toast, Button
  store/            # Zustand stores (authStore, sessionStore, cartStore, photoStore, layoutStore, uiStore)
  services/         # API service modules
  utils/            # filters, canvas helpers, formatters
  types/            # Shared TypeScript interfaces
  styles/           # Global CSS + Tailwind config
  App.tsx
  main.tsx
electron/
  main.ts
  preload.ts
  handlers/         # printer, camera IPC handlers
```

---

## State Stores Quick Reference

| Store | Responsibility |
|---|---|
| `authStore` | JWT token, operator profile, device flags, session settings |
| `sessionStore` | Current halaman step, countdown timer, transactionId, consent |
| `cartStore` | Package, extra prints, add-ons, voucher, calculated totals |
| `photoStore` | Raw captures array, selected indices, retake state |
| `layoutStore` | Selected template, slot→photo mapping, active filter, final canvas blob |
| `uiStore` | Loading states map, error messages, modal visibility, toast queue |

---

## API Endpoints Quick Reference

| Method | Path | Used on Halaman |
|---|---|---|
| POST | `/auth/login` | 0 |
| GET | `/products` | 3, 5 |
| POST | `/vouchers/validate` | 6 |
| POST | `/transactions/create` | 7 |
| GET | `/transactions/{id}/status` | 7 (polling) |
| GET | `/templates` | 11 |
| POST | `/transactions/{id}/finalize` | 14 |
| POST | `/email/send-invoice` | 14 |

---

## Session Context Migration Note

Previous session work was documented in `.copilot-context/SESSION_CONTEXT.md` (cloud session, now local).
Always read that file to inherit decisions, naming conventions, and any partial implementation details from prior sessions before generating new code.

---

## TODO.md Instructions

`TODO.md` at the project root tracks all implementation progress.
- Before starting work on any feature, check `TODO.md` to understand current status.
- After completing a task, update the relevant checkbox in `TODO.md`.
- Structure follows the 2-week development roadmap from `docs/DEVELOPMENT_GUIDE.md`.
