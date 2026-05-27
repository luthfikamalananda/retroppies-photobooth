# Technical Architecture

## Tech Stack Breakdown
- Frontend: React 18 + TypeScript
- Build: Vite 5
- Desktop runtime: Electron 27+
- State: Zustand
- UI: Tailwind CSS + custom CSS
- Canvas & composition: Fabric.js + Canvas2D/WebGL filters
- Motion: Framer Motion
- API: Axios

## Component Architecture
- **Page components:** one per halaman (`Auth`, `Onboarding`, `Product`, `Payment`, `PhotoSession`).
- **Shared components:** timer bar, video background, modals, toast, buttons.
- **Composition components:** template canvas, draggable tray, filter preview surface.

## Zustand Stores
- `authStore`: token, operator profile, config.
- `sessionStore`: flow step, timer, txId, consent, reset actions.
- `cartStore`: package, add-ons, voucher, totals.
- `photoStore`: captures, selected indices, retake state.
- `layoutStore`: template, slot mapping, filter, final output blob.
- `uiStore`: loading map, errors, global modal/toast.

## Service Layer Structure
- `services/authService.ts`
- `services/productService.ts`
- `services/voucherService.ts`
- `services/paymentService.ts`
- `services/templateService.ts`
- `services/finalizeService.ts`
- `services/emailService.ts`
- `services/hardwareService.ts` (camera/printer capability checks)

## Folder Organization
- `src/components/*` page + shared components
- `src/store/*` Zustand stores
- `src/services/*` API/IPC services
- `src/utils/*` filters, canvas helpers, formatters
- `electron/*` main/preload/handlers for print and system APIs

## Design Patterns
- Container/presenter split for page orchestration vs UI blocks.
- Service abstraction for all side effects (HTTP/IPC).
- Store selectors to reduce rerenders.
- State-machine-like flow guards for page transitions.

## Performance Considerations
- Lazy-load heavy pages (camera/filter/drag-drop).
- Keep filter previews downscaled during interaction; render full-res on finalize.
- Debounce payment status polling and voucher checks.
- Reuse canvas contexts and avoid repeated image decode.

## Testing Strategy
- Unit: filter math, total price logic, state reducers/actions.
- Integration: API services + transaction flow.
- E2E: halaman 1→14 happy path + payment timeout + printer fail.
- Hardware mocks in CI for camera/printer dependent behavior.
