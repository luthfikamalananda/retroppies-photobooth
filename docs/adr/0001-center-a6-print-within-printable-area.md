# ADR 0001 — Center Cetak dalam Printable Area, Bukan Borderless Penuh (Windows)

- Status: Accepted
- Tanggal: 2026-07-08
- Konteks kode: `electron/print-borderless.ps1` (jalur `process.platform === "win32"`)

## Konteks

Di jalur cetak **Windows** (PowerShell + .NET `PrintDocument`), handler `add_PrintPage`
semula menggambar gambar ke `Rectangle(0, 0, PageBounds.Width, PageBounds.Height)` —
yakni ukuran kertas **fisik penuh** — dari titik origin `Graphics`. Karena
`OriginAtMargins = false` (default .NET), origin `Graphics (0,0)` sebenarnya berada di
pojok **printable area** (di dalam hard-margin printer), bukan di tepi fisik kertas.
Akibatnya gambar diskalakan lebih besar dari area cetak dan **tergeser ke kanan-bawah**
sebesar hard-margin kiri/atas. Pada Epson L8050, pergeseran ~3mm ini menonjol di **A6**
(lebar 105mm) dan lebih samar di A4 (210mm). Menyetel `Margins(0,0,0,0)` tidak
memindahkan origin ini.

Nama kertas yang dikirim untuk Windows adalah varian **ber-margin**
(`A6 105 x 148 mm` / `A4 210 x 297 mm`), berbeda dari jalur macOS yang memakai varian
borderless driver (`A6.Nmgn` / `A4.NMgn` via CUPS `lp` + `fit-to-page`).

## Keputusan

Untuk Windows, **posisikan gambar terpusat (center) di dalam printable area**, dan
**tidak** mengejar borderless penuh (full-bleed edge-to-edge). Konkretnya di
`add_PrintPage`:

- Ukuran gambar = `PrintableArea` (stretch mengisi penuh; rasio template 1414×2000
  ≈ 0.707 nyaris identik dengan A6/A4 ≈ 0.707, jadi distorsi tak kasat mata).
- Posisi = center terhadap kertas fisik (`PageBounds`), dikonversi ke koordinat
  `Graphics` dengan mengurangi `HardMarginX/Y`.
- Tambah logging geometri (`HardMarginX/Y`, `PrintableArea`, `PageBounds`, rect final)
  ke stdout untuk diagnosa berbasis data.

Nama kertas driver, `printService.ts`, dan `electron/main.js` **tidak** diubah — tetap
kertas non-borderless.

## Alternatif yang dipertimbangkan

1. **Borderless penuh (full-bleed).** Ganti nama kertas Windows ke varian borderless
   driver (mirip jalur macOS) + benahi origin. Ditolak untuk iterasi ini: butuh
   enumerasi & kepastian nama kertas borderless L8050 di mesin booth (belum tentu
   tersedia untuk A6), perubahan lebih besar, dan toleransi pengguna adalah "border tipis
   boleh". Dibiarkan sebagai kemungkinan follow-up.
2. **Sekadar `TranslateTransform(-HardMarginX, -HardMarginY)` lalu isi `PageBounds`.**
   Menggambar hingga tepi fisik, tetapi pada kertas non-borderless driver tetap menolak
   mencetak di zona unprintable → tepi gambar terpotong sekaligus tetap ada border putih.
   Ditolak: lebih buruk dari sekadar fit ke printable area.
3. **Perbaikan khusus A6 saja (cabang kondisional).** Ditolak: bug ada di satu code path
   yang sama untuk semua ukuran; cabang per-ukuran menambah risiko drift dan membiarkan
   A4 tetap sedikit off.

## Konsekuensi

- Positif: A6 & A4 berhenti geser ke kanan dan center; satu perubahan terpusat tanpa
  cabang per-ukuran; log memberi data nyata untuk iterasi lanjut.
- Batasan: jika hard-margin Epson **asimetris** (kiri≠kanan), sisa selisih sub-milimeter
  bisa tersisa. Baru bisa dipastikan/diperbaiki dari angka log — di luar iterasi pertama.
- Trade-off diterima: hasil punya border tipis (hard-margin printer), bukan full-bleed.
- macOS tidak terpengaruh (jalur `lp`/CUPS terpisah, tidak dilaporkan bermasalah).

## Referensi

- Spec asal (sudah dihapus dari repo setelah implementasi): "Perbaikan Hasil Cetak A6
  Tergeser ke Kanan (Windows)".
- `SPECIFICATION.md` §8 (Print), §1 (booth Windows OptiPlex).
- `electron/list-paper-sizes.ps1` (pola enumerasi kapabilitas driver, bila kelak
  mengejar borderless penuh).
