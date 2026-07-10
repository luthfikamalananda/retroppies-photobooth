# Retroppies Photobooth

Aplikasi kiosk photobooth touchscreen untuk cafe vintage. Pelanggan memilih paket, membayar via QRIS atau tunai, mengambil 4 foto + klip video, menyusunnya ke template, memberi filter, lalu hasil dicetak (A4/A6 borderless) dan dikirim via QR & email.

Dibangun dengan Electron + React, berjalan fullscreen kiosk di Windows.

---

## Daftar Isi

- [Untuk Owner Cafe — Syarat Perangkat](#untuk-owner-cafe--syarat-perangkat)
- [Untuk Operator Lapangan](#untuk-operator-lapangan)
- [Alur Penggunaan Pelanggan](#alur-penggunaan-pelanggan)
- [Untuk Developer](#untuk-developer)

---

## Untuk Owner Cafe — Syarat Perangkat

### Spesifikasi Komputer

| Komponen | Minimum | Rekomendasi |
|---|---|---|
| **Prosesor** | Intel Core i7-8700T (2,4 GHz, 6 core) | Intel Core i7 Generasi 10 ke atas |
| **RAM** | 16 GB | 16 GB |
| **GPU** | Intel UHD 630 (integrated, 128 MB shared) | GPU dedicated (mis. NVIDIA GTX 1050 atau setara) |
| **Storage** | 256 GB SSD | 256 GB SSD |
| **Sistem Operasi** | Windows 10 64-bit | Windows 10/11 64-bit |

> **Catatan spek minimum:** Hardware minimum (UHD 630) bisa berjalan, tetapi hasil video composite rentan masalah durasi di kondisi tertentu. GPU dedicated sangat dianjurkan untuk performa stabil dan tanpa masalah.

### Perangkat Wajib

| Perangkat | Keterangan |
|---|---|
| **Monitor** | Resolusi **1920×1200** atau lebih tinggi. Resolusi 1920×1080 (Full HD) akan memotong bagian bawah tampilan. Touchscreen opsional tetapi sangat disarankan. |
| **Webcam** | USB, resolusi minimum 1080p |
| **Printer** | **EPSON L8050 Series** — satu-satunya printer yang didukung saat ini |
| **Koneksi Internet** | Wajib. Minimum 10 Mbps untuk upload hasil sesi dan pembayaran QRIS yang stabil |

### Perangkat yang Disarankan

| Perangkat | Alasan |
|---|---|
| **UPS (Uninterruptible Power Supply)** | Melindungi dari mati listrik mendadak saat sesi pelanggan berlangsung atau proses cetak berjalan |

---

## Untuk Operator Lapangan

### 1. Setup Unit Baru (Pertama Kali)

Untuk mini PC yang belum pernah terpasang aplikasi:

1. Salin file `updater.ps1` ke mini PC (via USB atau email).
2. Klik kanan `updater.ps1` → **Run with PowerShell**.
3. Jendela progress akan muncul — tunggu hingga selesai mengunduh dan memasang aplikasi.
4. Setelah selesai, dua icon akan muncul di desktop:
   - **Retroppies Photobooth** — untuk menjalankan aplikasi
   - **Update Retroppies** — untuk memperbarui aplikasi di kemudian hari

> File `updater.ps1` juga berfungsi sebagai updater untuk unit yang sudah terpasang. Cukup satu file untuk setup awal maupun pembaruan.

---

### 2. Menjalankan Aplikasi

Klik dua kali icon **Retroppies Photobooth** di desktop.

Aplikasi akan terbuka fullscreen dan langsung menampilkan layar login admin.

---

### 3. Memperbarui Aplikasi

1. Pastikan internet tersambung.
2. Jika aplikasi sedang berjalan, keluar terlebih dahulu (lihat bagian [Keluar dari Kiosk](#6-keluar-dari-kiosk)).
3. Klik dua kali icon **Update Retroppies** di desktop.
4. Jendela progress muncul — tunggu prosesnya:
   - Jika sudah versi terbaru: muncul pesan konfirmasi, tidak ada yang diunduh.
   - Jika ada versi baru: aplikasi diunduh dan dipasang secara otomatis.
5. Setelah selesai, buka kembali aplikasi seperti biasa.

> Update membutuhkan koneksi internet. Ukuran unduhan sekitar 150 MB.

---

### 4. Login Admin

Setiap kali aplikasi dibuka, layar pertama adalah halaman **Login Admin**:

1. Masukkan username dan password admin.
2. Pilih ukuran kertas cetak: **A4** atau **A6**.
3. Klik Login — aplikasi akan masuk ke layar utama (Landing Page) yang siap digunakan pelanggan.

> Layar login admin juga menampilkan status koneksi hardware (kamera, printer). Pastikan semua status hijau sebelum membuka booth untuk pelanggan.

---

### 5. Menerima Pembayaran Tunai

Jika pelanggan membayar tunai (bukan QRIS):

1. Pelanggan akan tiba di layar **Payment**.
2. Operator membuka modal "Bayar Tunai" yang tersedia di layar tersebut.
3. Konfirmasi penerimaan uang tunai melalui modal.
4. Aplikasi otomatis melanjutkan sesi pelanggan.

---

### 6. Keluar dari Kiosk

Untuk menutup aplikasi dan kembali ke desktop Windows:

1. Di layar **Login Admin**, klik tombol **×** (silang) di sudut layar.
2. Konfirmasi pada dialog yang muncul.
3. Aplikasi tertutup dan desktop Windows dapat diakses.

---

## Alur Penggunaan Pelanggan

```
1. PILIH PAKET
   Pelanggan menekan "Press Start" → pilih paket foto yang diinginkan
   → tambah extra print atau add-on jika mau → masukkan voucher (opsional)

2. PEMBAYARAN
   Bayar via QRIS (scan QR di layar) atau tunai melalui operator
   → sistem mengonfirmasi pembayaran otomatis

3. SESI FOTO
   Pelanggan punya waktu sesi untuk mengambil 4 foto
   → tiap foto diambil dengan hitungan mundur 6 detik per slot
   → foto bisa diulang sebelum lanjut ke slot berikutnya

4. PILIH TEMPLATE & SUSUN FOTO
   Pilih template bingkai → seret 4 foto ke slot yang tersedia
   → pilih filter warna (6 pilihan + original)

5. CETAK & SIMPAN
   Hasil otomatis dicetak (jumlah sesuai paket)
   → pelanggan mendapat QR code untuk mengunduh foto/GIF/video
   → bisa dikirim juga via email

6. SELESAI
   Layar kembali ke halaman awal, siap untuk pelanggan berikutnya
```

> **Timeout otomatis:** Jika pelanggan diam lebih dari 30 detik di halaman sebelum pembayaran, sesi direset ke awal. Setelah pembayaran, timer sesi berjalan — jika waktu habis, foto yang sudah diambil otomatis diproses dan dicetak.

---

## Untuk Developer

### Prasyarat

- Node.js 20+
- npm

### Menjalankan Lokal

```bash
# Install dependency
npm install

# Salin dan isi environment variable
cp .env.example .env

# Jalankan hanya web (Vite, tanpa Electron)
npm run dev

# Jalankan dengan Electron + hot reload
npm run electron:dev
```

### Environment Variable

| Variabel | Keterangan |
|---|---|
| `VITE_API_BASE_URL` | Base URL backend API (wajib diisi) |
| `VITE_APP_ENV` | `development` atau `production` |
| `VITE_USE_MOCK` | `true` untuk pakai data dummy lokal (tanpa backend) |

### Build & Distribusi

```bash
# Build web saja
npm run build

# Build installer Windows (.exe) — perlu dijalankan di mesin Windows
npm run electron:build
```

Installer dikemas dengan NSIS, output di `dist-electron/`. Untuk distribusi resmi, rilis dipicu otomatis oleh GitHub Actions saat `version` di `package.json` dinaikkan dan di-push ke `main`.

### Struktur Utama

| Path | Fungsi |
|---|---|
| `src/App.tsx` | Router berbasis nomor halaman (0–13) + guard |
| `src/components/PhotoSession/DragDropPage.tsx` | Composite foto, video, GIF |
| `src/components/PhotoSession/TakePhotoPage.tsx` | Capture 4 foto + rekam klip per slot |
| `src/services/colorGrading.ts` | Engine filter Canvas 2D, 6 preset |
| `src/config/layouts.config.ts` | Koordinat slot template (relatif 0..1) |
| `src/store/` | State Zustand: session, photo, cart, auth, ui |
| `electron/main.js` | Window kiosk Electron + IPC handler print |

### Dokumentasi Teknis

- [`SPECIFICATION.md`](./SPECIFICATION.md) — spesifikasi lengkap alur, domain, API, pipeline composite
- [`context.md`](./context.md) — konteks arsitektur dan isu aktif
- [`DEVICE_TEST_CHECKLIST.md`](./DEVICE_TEST_CHECKLIST.md) — checklist uji video di device asli
- [`docs/adr/`](./docs/adr/) — Architecture Decision Records

### Catatan Teknis Penting

- **Printer hardcode:** nama printer `"EPSON L8050 Series"` ada di `src/services/printService.ts` — ubah di sana jika perlu printer berbeda.
- **Resolusi window:** Electron dikonfigurasi `1920×1200`; tampilan dirancang untuk resolusi ini.
- **Isu video composite:** Ada isu durasi video terpotong di monitor non-1920×1200 pada hardware UHD 630. Detail dan langkah diagnosis ada di `DEVICE_TEST_CHECKLIST.md` dan `context.md §4`.
