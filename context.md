# context.md — Retroppies Photobooth

> Dokumen konteks tunggal, ditulis ulang dari nol (2026-07-06) berdasarkan pembacaan
> menyeluruh atas codebase. Menggantikan seluruh `.md` lama yang sudah tidak
> dipelihara. Pendamping: [`SPECIFICATION.md`](./SPECIFICATION.md) dan
> [`DEVICE_TEST_CHECKLIST.md`](./DEVICE_TEST_CHECKLIST.md).

---

## 1. Apa ini

Aplikasi **kiosk photobooth** touchscreen untuk cafe vintage (Indonesia). Pelanggan
memilih paket, membayar via QRIS (atau tunai lewat admin), mengambil 4 foto + klip
video pendek per foto, menyusunnya ke template, memberi filter, lalu hasil dicetak
(A4/A6 borderless) dan dikirim sebagai foto/GIF/video via QR & email.

- **Stack:** React 18 + TypeScript, Vite 5, Zustand 4, Tailwind, Framer Motion,
  dibungkus **Electron** (mode `kiosk` + `fullscreen`).
- **Target hardware:** mini-PC kelas **Dell OptiPlex** dengan **Intel UHD 630**
  (iGPU low-end), monitor 15"–24". **Tidak semua monitor 1920×1080** — ada panel
  touchscreen beresolusi lebih kecil (relevan untuk isu aktif di §4).
- **Backend:** sudah ada, dikonsumsi via REST (`VITE_API_BASE_URL`). Lihat
  `SPECIFICATION.md` untuk daftar endpoint.

## 2. Bentuk arsitektur (ringkas)

- Navigasi memakai **nomor halaman** `currentHalaman` (0–13) di `sessionStore`,
  **bukan** react-router. `App.tsx` memetakan nomor → komponen (lazy-loaded) dan
  memasang guard (auth / productBundle / transaction / reset-session / idle-timeout).
- State di **Zustand**: `sessionStore` (alur+timer+transaksi, persist `sessionStorage`),
  `photoStore` (foto/video/hasil composite, persist **IndexedDB** untuk Blob),
  `cartStore`, `authStore`, `uiStore`, `keyboardStore`.
- **Services** membungkus API (`apiClient` axios + interceptor JWT/401) dan logika
  hardware (kamera via `getUserMedia`, printer via Electron IPC).
- **Composite** foto/video/GIF terjadi di sisi klien (Canvas 2D + `colorGrading.ts`
  + `MediaRecorder`/`gifenc`) pada `DragDropPage.handleNext`.

Detail lengkap flow, domain, dan API ada di `SPECIFICATION.md`.

## 3. Kondisi terkini

- Codebase berjalan; alur 14 halaman lengkap dari login sampai halaman selesai.
- Fokus kerja saat ini: **reliabilitas perekaman video composite lintas monitor** (§4).
- Utang teknis yang diketahui (belum dikerjakan, bukan blocker): file mati
  (`printService copy.ts`, `TakePhotoPage_ORI.tsx`), tombol preview `[DEV]` masih
  tampil di produksi (`VideoPreviewModal`), IPC `print-photo-silent` dipanggil tapi
  tidak ada handler-nya di `electron/main.js`, `photoStore` memakai `any` untuk hasil
  composite, kredensial Basic-auth ter-hardcode di `authService`/`duringPhotoService`.

## 4. Isu aktif — durasi video composite terpotong di monitor non-1080p

### Gejala
Video composite (foto + klip per-slot digabung ke frame template) **hanya 1–2 detik**,
seharusnya selebar countdown sesi (`countDownPhoto = 6` dtk / durasi klip terpanjang).
Hanya file **video** yang terpengaruh; foto display, foto production (print), dan GIF normal.

### Fakta kunci penentu diagnosis
- Pada **OptiPlex yang sama**, dengan **monitor 1080p** → video **benar** (durasi & resolusi penuh).
- Setelah ganti ke **monitor touchscreen beresolusi lebih kecil** → video jadi 1–2 dtk.
- Resolusi encode video **konstan** = `layoutDef.templateSize` (**1414×2000**), tidak
  ikut resolusi monitor ⇒ **beban encoder identik di kedua monitor** ⇒ **penurunan
  kualitas BUKAN solusi** (dan sudah di-revert).
- Variabel yang berubah hanyalah **display/compositor**.

### Root cause (hipotesis kuat)
Implementasi lama merekam canvas *detached* dengan `canvas.captureStream(0)` +
`captureTrack.requestFrame()`. Pada canvas yang tidak di-DOM, produksi & timestamp
frame `requestFrame()` mengikuti irama **begin-frame compositor** yang terikat
**vsync/refresh/scaling display**. Ganti panel → irama berubah → timestamp frame
**mampat di awal** → durasi file pendek. Frame identik (klip sumber belum siap,
`readyState < 2`) juga rawan **di-coalesce** pada mode `captureStream(0)`, memperparah.

### Yang sudah dikerjakan (2026-07-06) — di `DragDropPage.tsx`, tanpa turunkan kualitas
| Perubahan | Dari | Menjadi | Alasan |
|---|---|---|---|
| Mode capture | `captureStream(0)` + `requestFrame()` | `captureStream(VIDEO_RENDER_FPS)` fixed-rate | Frame diproduksi pada laju tetap oleh timer internal Chromium walau konten statis ⇒ durasi ikut wall-clock, lepas dari `requestFrame`/coalescing |
| Flush | `recorder.start()` | `recorder.start(500)` (timeslice) | Frame ter-encode di-flush bertahap, tidak hilang saat `stop()` |
| Resolusi | 1414×2000 | **tetap** 1414×2000 | Terbukti sanggup real-time di 1080p; bukan akar masalah |

### Catatan kejujuran teknis
`captureStream(fps)` masih *compositor-adjacent* — **mungkin** menuntaskan, tapi belum
100% dijamin sampai diuji di panel bermasalah. Bila masih pendek, solusi definitif =
**WebCodecs** (`VideoEncoder` + muxer WebM, timestamp per-frame eksplisit ⇒ durasi =
`jumlahFrame / fps`, sepenuhnya deterministik & lepas dari display). Semua langkah uji
+ data yang harus dicatat ada di [`DEVICE_TEST_CHECKLIST.md`](./DEVICE_TEST_CHECKLIST.md).

## 5. Cara menjalankan

```bash
npm install
cp .env.example .env          # isi VITE_API_BASE_URL dsb.
npm run dev                   # web only (Vite)
npm run electron:dev          # Electron + hot reload
npm run build                 # tsc + vite build
npm run electron:build        # build installer (nsis/dmg)
```

Env penting: `VITE_API_BASE_URL`, `VITE_PRINT_PAPER_SIZE` (A4/A6). Printer di
`printService.ts` masih **hardcode** `"EPSON L8050 Series"`.

## 6. Peta file penting

- `src/App.tsx` — router-by-number + guard.
- `src/components/PhotoSession/DragDropPage.tsx` — **inti composite** foto/video/GIF (isu §4 di sini).
- `src/components/PhotoSession/TakePhotoPage.tsx` — capture 4 foto + rekam klip per slot.
- `src/services/colorGrading.ts` — engine filter Canvas 2D + 6 preset.
- `src/config/layouts.config.ts` — koordinat slot per `layoutId` (relatif 0..1) + `templateSize`.
- `src/store/*` — state. `electron/main.js` + `preload.js` — window kiosk + IPC print.
- `src/store/templateStore.ts` — cache templat per-tenant + **prefetch/warm** gambar
  (lihat [ADR 0002](./docs/adr/0002-prefetch-dan-warm-template-di-halaman-sebelumnya.md)).

## 7. Istilah

- **Prefetch templat**: memanggil `ensureTemplatesLoaded(tenantId)` di **halaman
  sebelum** TemplatePage (yakni TakePhotoPage) supaya daftar templat sudah siap saat
  user tiba. _Hindari_: "preload data" (rancu dengan warm gambar).
- **Warm gambar**: menembakkan `new Image()` untuk setiap `displayUrl` agar file
  full-res masuk **HTTP cache** browser lebih dulu; decode tetap terjadi saat render.
  _Hindari_: "cache gambar" (browser yang meng-cache, kita hanya memicu unduhan).
