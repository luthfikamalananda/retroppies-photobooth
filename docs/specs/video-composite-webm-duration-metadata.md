# Known Issue (DITUNDA) — Metadata Durasi WebM Hilang pada Composite Video

- Status: **Deferred** (ditunda sampai fix konten diverifikasi di device)
- Tanggal dicatat: 2026-07-08
- Konteks kode: `src/components/PhotoSession/DragDropPage.tsx` → `handleNext` (blok "Composite video")
- Device terdampak: mini PC Dell OptiPlex 7060 (i7-8700t, Intel UHD 630, RAM 16GB)

## Ringkasan

Video hasil composite (`canvas.captureStream` + `MediaRecorder`, output WebM) **tidak
menyimpan elemen `Duration` (EBML `0x4489`) di header**, dan hanya berisi 1 cluster.
Dibuktikan dari sampel `result.mp4` (sebenarnya WebM, magic `1A45DFA3` + doctype `webm`):

- Elemen `Duration 0x4489`: **tidak ada**.
- Jumlah cluster: **1**, timestamp 0.
- `mdls` (Spotlight) membaca `kMDItemDurationSeconds = null`.

Akibatnya sebagian player/uploader/tool yang membaca durasi **dari header** (bukan dari
timestamp blok) bisa menampilkan durasi "unknown" atau salah, walaupun konten videonya
benar.

> Catatan pemisahan masalah: gejala "durasi 1–2 detik" yang dilaporkan user disebabkan
> terutama oleh **konten yang memang pendek** (bug utama, diperbaiki terpisah — lihat
> bagian bawah), BUKAN metadata ini. Metadata hilang ini adalah masalah **sekunder /
> asuransi**, sengaja ditunda agar iterasi fix konten tetap fokus & mudah diverifikasi.

## Kapan menindaklanjuti

Tangani ini **hanya jika** — setelah fix konten terbukti menghasilkan durasi = countdown
(6 dtk) di mini PC — masih ada downstream yang salah baca durasi, mis.:

- Preview (`VideoPreviewModal`) menampilkan durasi "unknown"/salah, atau scrubber tak
  bisa seek.
- Server (`createSessions` di `src/services/finalizeService.ts`) atau transcoder-nya
  menolak/salah menghitung durasi video yang di-upload.

## Rencana fix (bila ditindaklanjuti)

Inject elemen `Duration` ke blob WebM hasil, sesudah `MediaRecorder` selesai (di dalam
`resultVideoBlob` sebelum dipakai). Dua opsi:

1. **Dep kecil `fix-webm-duration`** (~2 KB). Post-process:
   `const fixed = await fixWebmDuration(blob, durationMs)`. Paling ringkas & teruji.
2. **Patch EBML inline** (mis. pola `ts-ebml`) tanpa dep — lebih banyak kode, lebih rawan.

Rekomendasi: opsi 1 bila memang diperlukan.

## Referensi lintas-issue

Fix konten (bug utama, sedang dikerjakan di iterasi ini) — mengubah pipeline composite
video agar durasi konsisten = countdown di UHD 630:

- Durasi target: hard-lock ke `countDownPhoto * 1000` (6000ms), buang `Math.max` dengan
  durasi video sumber.
- Mekanisme capture: `canvas.captureStream(FPS)` (browser-driven sampling) + stop via
  `setTimeout` — memutus kopling durasi↔throughput `requestAnimationFrame` yang jadi
  penyebab intermiten "kadang 6 dtk, kadang 1–2 dtk".
- Codec: prioritaskan **VP8** (`video/webm;codecs=vp8`) — UHD 630 tak punya HW VP9
  encoder; VP8 software encode jauh lebih ringan.
- FPS: **20** (sementara; naikkan ke 24/30 setelah terbukti stabil).
