# ADR 0003 — Transcode Video Composite ke MP4/H.264 (kompatibel iOS) via ffmpeg Native di Electron Main

- Status: Accepted — diimplementasikan; **diamandemen 2026-07-10** (normalisasi frame-rate VFR→CFR)
- Tanggal: 2026-07-09 (amandemen 2026-07-10)
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

   > **Amandemen 2026-07-10 — perintah final.** Perintah di atas TERNYATA belum cukup
   > untuk iOS. Lihat bagian **"Normalisasi frame-rate (VFR → CFR) — amandemen 2026-07-10"**
   > di bawah. Perintah yang benar-benar dipakai sekarang:
   >
   > ```
   > -i in.webm \
   > -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1,fps=24" \
   > -c:v libx264 -profile:v high -level 4.0 -preset veryfast \
   > -pix_fmt yuv420p -r 24 -vsync cfr -g 48 \
   > -movflags +faststart -an -t 6 out.mp4
   > ```

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

   > **⚠️ DIBALIK — amandemen 2026-07-10.** Keputusan fail-loud ini **tidak** memikirkan UX
   > kiosk dan berubah jadi **softlock**: overlay error menutupi layar dengan satu tombol
   > "Coba lagi" yang mengulang input yang sama → untuk kegagalan deterministik (ffmpeg
   > hilang/crash) gagal lagi → loop tak berujung, kiosk mati sampai restart fisik, hasil
   > pelanggan hilang. Diganti dengan **fallback graceful**: transcode gagal → **upload WebM
   > apa adanya secara senyap** & lanjut. Lihat bagian **"Softlock & fallback graceful —
   > amandemen 2026-07-10"**.

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

## Normalisasi frame-rate (VFR → CFR) — amandemen 2026-07-10

**Gejala.** Setelah transcode H.264/yuv420p/faststart terpasang, video **masih** gagal di
iOS: di website "video tidak dapat di-play", dan saat dikirim via WhatsApp muncul
**"this media cannot be saved"**. Anehnya file yang sama **lancar di macOS**, **choppy di
Android**, dan **tidak bisa diputar di iPhone**.

**Jalur buntu yang perlu diingat (jangan diulang).** Sempat diduga penyebabnya **codec
sumber**, sehingga per-slot clip diubah VP9 → VP8 (dan sebaliknya) dua siklus. Ini
**salah arah total**: renderer selalu menghasilkan WebM (VP8/VP9), tetapi keduanya
**di-decode penuh oleh ffmpeg lalu di-encode ulang ke H.264 yang identik**. **Codec sumber
tidak pernah memengaruhi playability MP4 output.** "VP9 sempat bisa" adalah kebetulan, bukan
sebab. Bila video gagal di iOS lagi, **jangan sentuh pilihan VP8/VP9** — periksa metadata
output (lihat di bawah).

**Akar masalah sebenarnya — VFR ~1000fps.** `ffprobe` file yang gagal:

```
Video: h264 (High), yuv420p, 900x1272 [SAR 1272:1273 DAR 900:1273], 1k fps, 1k tbr
```

Renderer memancarkan frame lewat `canvas.captureStream(0)` + `captureTrack.requestFrame()`
yang dipompa oleh **`setInterval` (timer wall-clock)**. Timestamp WebM jadi ber-granularitas
**milidetik**, sehingga ffmpeg menyimpulkan stream **Variable Frame Rate dengan nominal
~1000fps**. Perintah lama tak punya `-r`/`-vsync`, jadi libx264 **mempertahankan** timing
gila itu. **iOS VideoToolbox menolak H.264 ber-fps tak wajar** → gagal play & gagal save;
Android mencoba menghormati pacing → choppy; hanya macOS yang toleran. Ini menjelaskan
**ketiga** gejala sekaligus.

**Masalah kedua — SAR non-square.** `scale=trunc(iw/2)*2:trunc(ih/2)*2` membulatkan
1273 → 1272, menggeser aspect ratio jadi **SAR 1272:1273** (anamorphic). iOS juga rewel
soal pixel non-persegi.

**Perbaikan (hanya di handler `transcode-to-mp4`, renderer tak disentuh):** tambah ke
filter chain `setsar=1,fps=24` dan flag output `-r 24 -vsync cfr`. Hasil ffprobe sesudah:
`24 fps, 24 tbr, SAR 1:1` → **terverifikasi bisa diputar & disimpan di iPhone** (uji nyata
via WhatsApp, 2026-07-10). Ditambahkan pula `-profile:v high -level 4.0` (eksplisit, aman
lintas iPhone lama/baru) dan `-g 48` (GOP 2 dtk).

**Pelajaran / aturan diagnosa ke depan.** Kalau video gagal di iOS: **`ffprobe` dulu file
outputnya.** Cek tiga hal — (1) `codec` harus `h264` (bukan vp8/vp9 → berarti transcode
tak jalan), (2) `fps`/`tbr` harus wajar/konstan (bukan ~1k → VFR), (3) `SAR` harus `1:1`.
Ini 10 detik dan langsung menuding sebab; jangan menebak dari codec sumber.

## Softlock & fallback graceful — amandemen 2026-07-10

**Gejala.** Saat konversi MP4 gagal, muncul overlay error + tombol **"Coba lagi"**. Karena
overlay `absolute inset-0 z-[110]` menutupi seluruh layar dan **hanya** tombol itu yang bisa
ditekan, sedangkan tak ada idle-timeout di DragDropPage (halaman 12), pengguna **softlock**:
"Coba lagi" mengulang `handleNext` dengan **argumen identik** → untuk kegagalan
**deterministik** (binary ffmpeg tak ketemu di build packaged, exit non-zero, output kosong,
IPC gagal) hasilnya gagal lagi → loop. Di kiosk fullscreen tanpa operator = mesin mati sampai
restart fisik; pelanggan yang sudah bayar & sudah foto kehilangan hasil.

**Kenapa retry adalah jebakan.** Retry hanya menolong kegagalan *transient*. Kegagalan
transcode di sini justru *persisten/environment* → retry buta = loop. (Catatan: kegagalan
"video jelek tapi valid" — mis. VFR 1000fps sebelum fix — **tak pernah** men-throw ke sini;
yang men-throw hanyalah kegagalan ffmpeg sungguhan.)

**Keputusan (mengganti keputusan #5).**

1. **Fallback graceful, senyap, otomatis.** Transcode gagal → **jangan throw**; pertahankan
   `finalVideoBlob` WebM & lanjut upload. Zero interaksi, zero softlock. Kegagalan cukup
   `console.error` untuk debug. Implementasi: `try/catch` di sekitar `transcodeToMp4`
   (`DragDropPage.tsx`, blok "2c").

   - **Konsekuensi sadar & diterima:** WebM fallback **tak jalan di iPhone** (persis bug
     awal), tapi jalan di Android/desktop/kiosk. Trade-off: *"video sesi ini tak
     iPhone-compatible"* jauh lebih baik daripada *"kiosk mati + hasil hilang"*. Aman karena
     — setelah fix CFR — kegagalan transcode **langka**; ini jaring pengaman, bukan jalur normal.

2. **Penamaan jujur.** WebM fallback **wajib** di-upload sebagai `result.webm` /
   `video/webm`, **bukan** `.mp4`. `finalizeService.createSessions` menurunkan nama +
   Content-Type dari `blob.type` asli. Menamai WebM sebagai `.mp4` justru sumber kebingungan
   iOS sebelumnya. **Verifikasi terpisah:** backend/viewer harus melayani `videoUrl` `.webm`
   dengan `Content-Type: video/webm` yang benar (Android/desktop OK; iPhone memang tak main).

3. **Overlay tak boleh jadi dead-end.** Overlay error terluar (untuk kegagalan
   **katastrofik non-transcode**: compositing/MediaRecorder gagal total → tak ada video sama
   sekali) kini punya **dua** tombol: "Coba lagi" (transient) **dan "Ulangi Foto"**. "Ulangi
   Foto" memanggil `clearPhotos()` lalu `goTo(9)` (StartPhotoPage).

   - **Kenapa halaman 9, bukan landing/reset:** halaman 8–13 **tidak** masuk `RESET_SESSION`
     (`App.tsx`), jadi **transaksi/pembayaran tetap utuh** — pelanggan **tak bayar ulang**,
     cukup foto ulang. Reset ke landing akan memaksa bayar lagi. `clearPhotos()` membuang
     captures/video/template lama agar foto-ulang mulai bersih (transaksi ada di
     `sessionStore`, tak ikut terhapus).

**Prinsip yang dipertahankan.** "Jangan simpan video rusak" tetap dihormati untuk **jalur
normal** (selalu MP4 saat transcode sukses). Yang dibuang hanyalah **fail-loud yang mengurung
pelanggan**. Integritas data & UX kiosk dipisah: kiosk **tak boleh pernah** softlock.

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
