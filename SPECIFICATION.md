# SPECIFICATION.md — Retroppies Photobooth

> Spesifikasi teknis brand-new (2026-07-06), disusun dari pembacaan langsung atas
> codebase. Menggantikan seluruh dokumen lama. Pendamping: [`context.md`](./context.md),
> [`DEVICE_TEST_CHECKLIST.md`](./DEVICE_TEST_CHECKLIST.md).

---

## 1. Ikhtisar produk

Kiosk photobooth touchscreen untuk cafe vintage. Satu sesi: pilih paket → bayar →
ambil 4 foto (+ klip video per foto) → susun ke template → filter → cetak + kirim
hasil (foto/GIF/video) via QR & email. Berjalan fullscreen kiosk di Electron pada
mini-PC (Dell OptiPlex / Intel UHD 630).

## 2. Stack teknis

| Lapisan | Teknologi |
|---|---|
| UI | React 18 + TypeScript, Tailwind CSS 3, Framer Motion 11 |
| Build | Vite 5 (`@` → `src/`) |
| Desktop | Electron 30 (`kiosk: true`, `fullscreen: true`) |
| State | Zustand 4 (+ `persist`: `sessionStorage` & IndexedDB via `idb-keyval`) |
| Kamera | `react-webcam` |
| Media | Canvas 2D, `MediaRecorder`, `gifenc` (GIF), `qrcode.react` |
| HTTP | axios (`apiClient` + interceptor JWT/401) |
| Print | Electron IPC → PowerShell/.NET (Windows) atau `lp`/CUPS (macOS) |

## 3. Model navigasi

Navigasi = angka `currentHalaman` (0–13) di `sessionStore`, **bukan** react-router.
`App.tsx` memegang peta `PAGE_COMPONENTS` (lazy-loaded) dan sejumlah guard.

### 3.1 Alur halaman

| # | Halaman | Komponen | Inti |
|---|---------|----------|------|
| 0 | Admin Login | `AdminLoginPage` | login + pilih ukuran kertas (A4/A6) + cek hardware |
| 1 | Landing | `LandingPage` | "Press Start"; reset transaksi |
| 2 | How To Use | `HowToUsePage` | instruksi (skippable) |
| 3 | Choose Product | `ProductPage` | pilih 1 `bundling` |
| 4 | Extra Print | `ExtraPrintPage` | tambah produk `print` (qty via entri berulang) |
| 5 | Add Ons | `AddOnsPage` | tambah `addon`; auto-skip bila kosong |
| 6 | Voucher | `VoucherPage` | validasi kode diskon |
| 7 | Payment | `PaymentPage` | QRIS (poll status 2 dtk) / tunai via admin modal |
| 8 | Payment Success | `PaymentSuccessPage` | auto-transisi 2,5 dtk (SUCCESS→9, FAILED→7) |
| 9 | Start Photo | `StartPhotoPage` | tampilkan limit waktu; minta izin kamera; mulai timer |
| 10 | Take Photo | `TakePhotoPage` | ambil 4 foto + rekam klip per slot |
| 11 | Choose Template | `TemplatePage` | pilih template (fetch by tenant) |
| 12 | Drag & Drop + Filter | `DragDropPage` | susun foto ke slot, pilih filter, **composite & finalize** |
| 13 | Finished | `FinishedPhotoPage` | QR download + kirim email; kembali ke Home |

`goNext` clamp maksimum 14; `goBack` minimum 1.

### 3.2 Guard di `App.tsx`

- **Auth** (`PROTECTED_HALAMAN` 1–13): tanpa `user` → `goTo(0)`.
- **Produk** (`MUSTHAVE_PRODUCTS` 4,5,6): tanpa `productBundle` → `goTo(3)`.
- **Transaksi** (`MUSHAVE_TRANSACTION_DATA` 8–13): tanpa `transaction` → `goTo(1)`.
- **Reset sesi** (`RESET_SESSION` 0–7): panggil `resetSession()` + `clearPhotos()`.
- **Idle timeout** (`HIDDEN_TIMER_HALAMAN` 2–6): countdown `timerBeforePayment`=30 dtk → `goTo(1)`.
- **Timer sesi** (`TIMER_VISIBLE_HALAMAN` 10–13): `TopTimerBar`; saat habis auto-submit ke halaman 12 (atau ke 3 bila belum ada foto, ke 1 bila di 13).

## 4. State (Zustand)

| Store | Persist | Isi utama |
|---|---|---|
| `sessionStore` | `sessionStorage` | `currentHalaman`, `transaction`, `sessionCode`, `timerSeconds/Running`, `autoSubmit`; aksi navigasi & timer |
| `photoStore` | **IndexedDB** | `captures[]` (4 foto), `capturesVideo[]` (4 klip Blob), `template`, `totalSlots`, hasil composite (`templateWithPhoto`, `...Production`, `...Video`, `capturesToGIF`) — hanya `...Production` yang dipersist untuk print |
| `cartStore` | — | `productBundle`, `productPrint[]`, `productAddOns[]`, `voucher` (qty = jumlah entri di array) |
| `authStore` | `sessionStorage` | `user` = `ResultLogin & { paperType }` |
| `uiStore` | — | loading/error map, modal, toasts, `backgroundVariant` |
| `keyboardStore` | — | state floating on-screen keyboard |

## 5. Domain / ubiquitous language

- **Product** (`productType`: `bundling` | `print` | `addon`). Bundle = 1 wajib.
- **TransactionResult** — hasil order (`invoiceNumber` kunci utama; `status`:
  PENDING/SUCCESS/EXPIRED/FAILED; `finalAmount`, `qrContent`, `expiredAt`, `totalPrint`).
- **CapturedPhoto** `{ slotIndex, dataUrl, capturedAt }`; **CapturedVideo** `{ slotIndex, videoBlob, recordedAt }`.
- **Template** `{ id, layoutId, displayUrl (preview), productionUrl (print-res), isDefault, tenantId }`.
- **LayoutDef** (lokal, `layouts.config.ts`) — dipetakan dari `layoutId`; `slotCount`,
  `templateSize {w,h}` (semua saat ini **1414×2000**), dan `slots[]` berkoordinat
  **relatif 0..1** (`cx,cy,w,h,angle`) sehingga skala-independen.
- **Session (finalize)** — `sessionCode` hasil unggah; jadi QR + link email.

## 6. Integrasi API

`apiClient` (axios) memakai `VITE_API_BASE_URL`, menyisipkan `Bearer` token, dan pada
401 → `clearUser()` + `goTo(0)`. Semua respons dibungkus `BaseResponse<T>`.

| Fungsi | Endpoint | Kegunaan |
|---|---|---|
| `login` | `POST /users/login` | auth admin (juga Basic-auth header hardcode) |
| `getProducts` | `POST /products/get` | daftar produk per tenant |
| `validateVoucher` | `POST /voucher/apply-v2` | validasi voucher |
| `createTransactionv2` | `POST /payments/qris/order` | buat order QRIS |
| `createTransactionTunai` | `POST /payments/qris/tunai` | order tunai (via admin) |
| `getTransactionStatus` | `POST /transactions/payment-status` | poll status bayar |
| `getTimerTransaction` | `POST /rules/get` | ambil rule timer (`rulesType: 'PHOTO'`) |
| `getTemplates` | `POST /template/get` | daftar template per tenant |
| `createSessions` | `POST /photobooth/sessions` | unggah multipart: 5 foto + gif + video |
| `getSesssions` | `GET /photobooth/sessions/{code}` | ambil hasil sesi (URL + QR) |
| `sendEmail` | `POST /invoices/send-email` | kirim invoice + link |

## 7. Pipeline capture & composite

### 7.1 Take Photo (halaman 10)
Per slot: `getScreenshot` (still, JPEG 0.95, sampai 1920×1080) **dan** rekam klip via
`MediaRecorder` dari `videoEl.captureStream()` selama `countDownPhoto` (6 dtk),
VP9/webm bila didukung. Bisa retake per slot.

### 7.2 Composite (`DragDropPage.handleNext`)
Menghasilkan 4 artefak dari `slotMap`:
1. **Foto display** — canvas `templateSize`, tiap slot di-crop (cover) + rotate + clip,
   `applyColorGrade` bila ada filter, lalu overlay `displayUrl`.
2. **Foto production** — sama, memakai `productionUrl` (untuk print).
3. **Video composite** — canvas `templateSize`, gambar template + tiap klip per-frame
   dalam loop, direkam `MediaRecorder`. **(Area isu — lihat §9.)**
4. **GIF** — 4 foto raw (+grade) via `gifenc`.

Lalu `createSessions` (unggah) → `continueToFinalization(sessionCode)` (ke halaman 13)
→ `printPhotoBorderless(productionUrl, totalCopy=transaction.totalPrint)`.
`autoSubmit` (timer habis) mengisi slot otomatis lalu submit tanpa dialog izin.

### 7.3 Filter (`colorGrading.ts`)
Engine Canvas 2D per-pixel: LUT tone-curve per channel, split-tone shadow/highlight,
saturation/contrast/brightness, vignette, grain. **6 preset** + Original. Thumbnail
tray di-downscale (280px) + staggered render (60 ms) demi UHD 630.

## 8. Print

`printService.printPhotoBorderless` → IPC `print-photo-borderless`:
- **Windows:** PowerShell `print-borderless.ps1` + .NET `PrintDocument`.
- **macOS:** `lp`/CUPS dengan `media=<paperName>` + `fit-to-page`.
- Printer **hardcode** `"EPSON L8050 Series"`; ukuran kertas dari `user.paperType` (A4/A6).
- Catatan: jalur non-borderless `printPhoto` memanggil IPC `print-photo-silent` yang
  **belum ada handler-nya** di `electron/main.js` (utang teknis).

## 9. Reliabilitas Video (isu aktif & spesifikasi target)

### 9.1 Masalah
Video composite terpotong jadi **1–2 detik** pada **monitor non-1080p** (touchscreen
kecil) di OptiPlex, padahal **benar di monitor 1080p** pada mesin yang sama. Resolusi
encode konstan (1414×2000) ⇒ beban encoder bukan penyebab ⇒ akar masalah pada
**display/compositor**. Rincian root cause di `context.md` §4.

### 9.2 Persyaratan
- **FR-V1.** Durasi video hasil = `max(countDownPhoto*1000, durasi klip terpanjang)`, **± 0,5 dtk**.
- **FR-V2.** Independen terhadap resolusi monitor, refresh rate, touchscreen, device scale factor.
- **FR-V3.** Tetap berdurasi penuh walau sebagian klip sumber lambat siap (`readyState < 2`).
- **FR-V4.** Frame ter-encode tidak hilang saat `stop()`.
- **NFR-V1.** **Tanpa** menurunkan resolusi/kualitas (resolusi tetap = `templateSize`).
- **NFR-V2.** Tidak meregresi foto display, foto production, GIF.

### 9.3 Solusi bertahap
- **Fase 1 (terpasang):** `captureStream(VIDEO_RENDER_FPS)` fixed-rate + `recorder.start(500)`
  timeslice, resolusi penuh. Melepas ketergantungan pada `requestFrame`/coalescing.
- **Fase 2 (definitif, bila Fase 1 belum lulus di device):** encoding **offline WebCodecs**
  (`VideoEncoder` + muxer WebM, timestamp per-frame eksplisit `frameIndex*(1e6/fps)`
  µs) ⇒ durasi = `jumlahFrame/fps`, sepenuhnya deterministik & lepas dari display.
  Sediakan fallback `MediaRecorder` bila WebCodecs tak tersedia.

### 9.4 Acceptance criteria & prosedur uji
Lihat [`DEVICE_TEST_CHECKLIST.md`](./DEVICE_TEST_CHECKLIST.md) — mencakup AC1–AC6, data
lingkungan yang wajib dicatat, dan pohon keputusan menuju Fase 2.

## 10. Konfigurasi & environment

- `VITE_API_BASE_URL` — base URL backend.
- `VITE_PRINT_PAPER_SIZE` — A4 | A6 (default A4).
- Timer: `timerBeforePayment=30`, `timerFinished=120`, `countDownPhoto=6` (`src/const/timers.ts`).
- Electron window: `1920×1080`, `fullscreen`, `kiosk` (`electron/main.js`).

## 11. Utang teknis diketahui (non-blocker)

- File mati: `services/printService copy.ts`, `PhotoSession/TakePhotoPage_ORI.tsx`.
- `VideoPreviewModal` menampilkan tombol/preview `[DEV]` di produksi.
- IPC `print-photo-silent` dipanggil tanpa handler di main process.
- `photoStore` memakai `any` untuk hasil composite.
- Kredensial Basic-auth hardcode di `authService` & `duringPhotoService`.
- Penomoran halaman & komentar `partialize timerRunning` tidak konsisten dengan kode.
