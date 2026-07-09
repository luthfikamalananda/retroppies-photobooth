# ADR 0003 — Transcode Video Composite ke MP4/H.264 (kompatibel iOS) via ffmpeg Native di Electron Main

- Status: Accepted — implementasi menyusul (rencana disepakati 2026-07-09)
- Tanggal: 2026-07-09
- Konteks kode: `src/components/PhotoSession/DragDropPage.tsx` (blok `[VideoComposite]`,
  ~baris 712–1080), `src/services/finalizeService.ts`, `electron/main.js`,
  `electron/preload.js`, `package.json` (deps + `build`)

## Konteks

`DragDropPage` men-composite beberapa klip video slot menjadi satu video final memakai
`canvas.captureStream(0)` + `MediaRecorder`. Di Chromium (Electron), `MediaRecorder`
praktis hanya bisa menulis **VP8/WebM** — dan itulah yang kita hasilkan
(`DragDropPage.tsx:843`). Masalahnya: **iOS Safari tidak bisa memutar VP8/WebM.** Video
yang diupload ke backend lalu ditampilkan oleh codebase penampil jadi gagal diputar di
iPhone.

Batasan yang membentuk keputusan:

- **Perangkat lemah.** Target produksi adalah Dell OptiPlex dengan iGPU **Intel UHD 630**.
  Seluruh pipeline render WebM sudah susah payah distabilkan khusus untuk GPU ini
  (`captureStream(0)` + pump berbasis timer, wadah video di dalam viewport agar decode
  tak di-throttle, prioritas VP8 karena UHD 630 tak punya encoder HW VP9). Menyentuh
  ulang bagian ini berisiko regresi.
- **Backend tidak terkontrol.** Endpoint `/photobooth/sessions` hanya menerima &
  menyimpan file apa adanya — **tidak** bisa menambah transcoding server-side. Jadi
  konversi format **wajib terjadi di client sebelum upload**.
- **Ini aplikasi Electron.** `electron: ^30.0.6` → Chromium **124**, dan ada **main
  process Node.js** yang jalan lokal di Dell. Pola `ipcMain.handle` + `execFile` untuk
  memanggil binary native sudah ada (dipakai untuk printing di `electron/main.js`).
- **Syarat iOS bukan cuma "container MP4".** iOS Safari butuh **H.264 + pixel format
  `yuv420p` + `moov atom` di depan (`+faststart`)**. Sekadar menghasilkan MP4 tanpa dua
  syarat terakhir tetap gagal diputar di iPhone.
- **Klip pendek.** Durasi output = `countDownPhoto` = **6 detik**, ~900px, 24fps, tanpa
  audio (`videoEl.muted = true`). Transcode sekecil ini trivial di CPU apa pun.

## Keputusan

Konversi dilakukan **di client, sebagai langkah pasca-render**, memakai **ffmpeg native**
di Electron main process. Pipeline render WebM di renderer **tidak disentuh**.

1. **Renderer tetap menghasilkan WebM** seperti sekarang (termasuk `fixWebmDuration`).
   Setelah `finalVideoBlob` (WebM) siap (~`DragDropPage.tsx:1073`), sebelum
   `createSessions`, blob dikirim ke main process untuk di-transcode.

2. **Transcode di Electron main** (`ipcMain.handle("transcode-to-mp4", …)`): terima
   `Uint8Array` WebM + durasi, tulis ke `os.tmpdir()`, jalankan ffmpeg, baca hasil,
   hapus temp, kembalikan `Uint8Array` MP4. Perintah:

   ```
   -i in.webm -c:v libx264 -preset veryfast -pix_fmt yuv420p \
   -movflags +faststart -an -t 6 out.mp4
   ```

   `-pix_fmt yuv420p` dan `-movflags +faststart` adalah syarat wajib iOS; `-an` karena
   tak ada audio; `-t 6` mengunci durasi (metadata durasi WebM sumber tak reliable).

3. **Encoder = `libx264` (software), preset `veryfast`.** Bukan hardware encoder.
   Alasannya lihat bagian **"Portabilitas perangkat / ganti GPU"** — ini keputusan
   sengaja, bukan sekadar default.

4. **Binary via `ffmpeg-static`** (npm). Build dilakukan di Windows sehingga otomatis
   mendapat `ffmpeg.exe` Windows. Tambahkan `asarUnpack` untuk `ffmpeg-static` di
   `package.json > build` agar binary keluar dari arsip asar saat dikemas; di production
   resolve path dengan mengganti `app.asar` → `app.asar.unpacked`.

5. **Gagal = gagal keras.** Bila transcode ffmpeg gagal, **jangan** upload WebM diam-diam.
   Lempar error & tampilkan ke operator agar sesi bisa diulang. Ini menjamin apa pun yang
   tersimpan di backend **selalu** MP4 yang bisa diputar iPhone.

6. **Upload sebagai MP4.** `finalizeService.ts`: nama file `result.webm` → `result.mp4`,
   fallback type `video/webm` → `video/mp4`.

## Portabilitas perangkat / ganti GPU, CPU, atau OS (Intel UHD → AMD / NVIDIA RTX / dll.)

**Pertanyaan yang dijawab bagian ini: kalau nanti perangkat ganti GPU, apakah bagian
encoding ini harus di-refactor? Jawaban singkat: TIDAK.**

- **`libx264` berjalan 100% di CPU dan tidak peduli GPU sama sekali.** Ganti dari Intel
  UHD 630 ke AMD (AMF) atau NVIDIA RTX (NVENC) **tidak** memengaruhi langkah transcode
  ini. Tak ada kode yang menyebut vendor GPU. Untuk klip 6 detik/900px, `libx264 veryfast`
  selesai < 1–2 detik di CPU mana pun yang wajar, jadi tak ada tekanan performa yang
  memaksa pindah ke hardware encode.

- **Ini alasan utama kita SENGAJA menolak hardware encoder** (`h264_qsv`/`nvenc`/`amf`)
  di keputusan awal: hardware encoder itu **terkopel vendor**. Memilihnya berarti kode
  jadi bergantung GPU tertentu + driver + build ffmpeg yang tepat — persis kerapuhan yang
  Anda khawatirkan. `libx264` menukar sedikit siklus CPU (tak berarti untuk 6 detik)
  dengan **portabilitas penuh lintas perangkat**.

- **Pipeline render WebM di renderer juga tidak "GPU-breaking" saat upgrade.** Setelan
  yang ada (FPS/bitrate/lebar di-cap, prioritas VP8) bersifat **konservatif** demi UHD
  630, bukan spesifik-Intel yang akan pecah di GPU lain. Di GPU lebih kuat ia tetap jalan;
  paling banter batas itu bisa dilonggarkan demi kualitas (opsional, bukan keharusan).

- **Jika suatu hari BENAR-BENAR butuh hardware encode** (mis. resolusi/durasi naik drastis
  hingga `libx264` terasa lambat), inilah satu-satunya titik yang berubah — dan hanya di
  **satu tempat** (handler `transcode-to-mp4` di `electron/main.js`), bukan refactor besar:

  | GPU / vendor        | Flag encoder ffmpeg      | Catatan |
  |---------------------|--------------------------|---------|
  | Intel (UHD/Arc)     | `-c:v h264_qsv`          | Butuh driver Intel + ffmpeg build dgn QSV |
  | NVIDIA (GTX/RTX)    | `-c:v h264_nvenc`        | Butuh driver NVIDIA + ffmpeg build dgn NVENC |
  | AMD (Radeon)        | `-c:v h264_amf`          | Butuh driver AMD + ffmpeg build dgn AMF |
  | Apa pun (fallback)  | `-c:v libx264`           | **Default kita sekarang** — selalu jalan |

  Pola yang disarankan bila itu terjadi: **deteksi/coba HW encoder, fallback ke `libx264`
  bila gagal.** `yuv420p`, `+faststart`, `-an`, `-t` tetap sama apa pun encodernya. Artinya
  perubahan device **tidak pernah** memaksa refactor arsitektur — paling banter menambah
  satu cabang pemilihan encoder di dalam handler yang sama.

### Ganti CPU (Intel → AMD) atau pindah mesin/OS sepenuhnya

Pertanyaan lanjutan: kalau CPU-nya ganti ke AMD, atau tak lagi memakai mini PC ini —
apakah kode berubah? **Untuk ganti CPU Intel → AMD: tidak sama sekali.** Rincian per
tingkat perpindahan:

| Skenario | Kode logika berubah? | Yang perlu disesuaikan |
|----------|----------------------|------------------------|
| CPU Intel → AMD, tetap x86-64 Windows | **Tidak** | Nihil. Intel & AMD sama-sama x86-64; `libx264` deteksi fitur CPU (SSE/AVX) saat runtime & menyesuaikan sendiri |
| Ganti mini PC/desktop lain, tetap x86-64 Windows | **Tidak** | Nihil (cukup install/build ulang seperti biasa) |
| Pindah OS: Windows → Linux/macOS (x86-64) | **Tidak** | `ffmpeg-static` otomatis ambil binary OS yang benar asal `npm install`/build dijalankan di OS itu; tambah target electron-builder. Catatan: printing `.ps1` khusus-Windows adalah kopling terpisah, bukan bagian video |
| Pindah arsitektur: x86-64 → ARM (mini PC ARM / Apple Silicon / Win-on-ARM) | **Tidak** | Bundel binary ffmpeg **arm64** + build untuk arch itu. `ffmpeg-static` punya varian arm64 (mac/linux); kombinasi eksotik (mis. Windows-ARM) perlu diverifikasi coverage-nya atau ganti sumber binary |

Inti: perintah ffmpeg, IPC, dan logika fail-loud **identik di semua kasus**. Yang berbeda
hanyalah **binary ffmpeg mana yang ikut dibundel** — dan itu diotomasi `ffmpeg-static`
selama `npm install`/build dijalankan di OS + arsitektur target. Ganti CPU (Intel↔AMD) =
0 perubahan; ganti OS/arsitektur = bukan refactor logika, hanya **konfigurasi build**.

**Ringkasnya:** desain ini sengaja dibuat **agnostik-GPU dan agnostik-CPU**. Ganti
device/GPU/CPU = tidak ada refactor. Ganti OS/arsitektur hanya menyentuh konfigurasi
build (target + binary), bukan logika. Hardware encode hanyalah optimasi opsional di masa
depan, terisolasi di satu handler, dengan jalur migrasi yang sudah didokumentasikan di
tabel GPU di atas.

## Alternatif yang dipertimbangkan

- **Transcode di backend (ffmpeg server-side).** Paling ideal (offload total dari Dell),
  tapi **ditolak**: backend tidak terkontrol, hanya menyimpan file apa adanya.
- **WebCodecs `VideoEncoder` (H.264) di renderer.** Tanpa bundle binary & bisa HW-accel,
  tapi **menyentuh ulang pipeline encode renderer** yang susah payah distabilkan di UHD
  630 (risiko regresi), dan `yuv420p`/`+faststart` harus diatur manual di muxer. Ditolak
  demi menjaga renderer tetap utuh.
- **`MediaRecorder` container MP4 (flag `MediaRecorderEnableMp4Muxer`).** Perubahan paling
  kecil, tapi fitur ini baru **stable di Chromium ~130** — Electron 30 memakai **Chromium
  124**, jadi belum default; selain itu tak menjamin `+faststart`. Paling rapuh. Ditolak.
- **`ffmpeg.wasm` (WASM) di renderer.** Transcode di client tanpa binary native, tapi
  murni software di WASM → **berat untuk Dell yang lemah**. Kalah telak dari ffmpeg native.
- **`h264_qsv` (hardware Intel) sebagai encoder utama.** Lebih ringan CPU, tapi
  **terkopel vendor GPU + driver** — bertentangan dengan tujuan portabilitas (lihat bagian
  di atas). Ditolak sebagai default; disimpan sebagai jalur optimasi opsional.

## Konsekuensi

- **Ukuran installer bertambah.** `ffmpeg-static` (~50–80MB) ikut dibundel. Wajib
  `asarUnpack` agar binary bisa dieksekusi; path production perlu penyesuaian
  `app.asar` → `app.asar.unpacked`.
- **Ada langkah I/O temp file** di main process (tulis WebM → ffmpeg → baca MP4 → hapus).
  IPC blob kecil (~ratusan KB untuk 6 dtk) jadi transfer `Uint8Array`-nya murah.
- **Ekstensi/mime output berubah ke `.mp4` / `video/mp4`.** **Verifikasi terpisah:**
  codebase penampil & backend tidak boleh meng-hardcode `.webm` dan harus menyajikan
  `Content-Type: video/mp4` yang benar dari `videoUrl`.
- **`templateWithVideo` lokal ikut jadi MP4** — tetap diputar mulus di kiosk (Chromium).
- **Kegagalan transcode memblokir sesi** (by design). Operator melihat error alih-alih
  menghasilkan video rusak diam-diam; trade-off yang diterima demi jaminan kompatibilitas.
