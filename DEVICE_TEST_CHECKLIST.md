# DEVICE_TEST_CHECKLIST.md — Verifikasi Video Composite di Device

> Checklist untuk saat sudah bisa menguji di **kiosk asli** (Dell OptiPlex + Intel
> UHD 630), bukan mesin dev. Fokus: memastikan durasi video composite = durasi sesi
> pada semua monitor, dan mengumpulkan data untuk keputusan lanjutan (WebCodecs).
> Konteks & rasional: [`context.md`](./context.md) §4.

---

## 0. Prasyarat & build

- [ ] `git pull` versi terbaru (sudah memuat fix `captureStream(fps)` + timeslice).
- [ ] `npm run electron:build` menghasilkan installer tanpa error.
- [ ] Jalankan hasil build (bukan `electron:dev`) agar mendekati kondisi produksi.
- [ ] Kamera & printer (`EPSON L8050 Series`) terpasang; `VITE_API_BASE_URL` valid.

## 1. Data lingkungan yang WAJIB dicatat (per monitor)

Untuk tiap monitor yang diuji, catat:

- [ ] **Model/ukuran monitor** dan apakah **touchscreen**.
- [ ] **Resolusi native** (mis. 1920×1080, 1366×768, 1600×900).
- [ ] **Refresh rate** (Hz).
- [ ] **Device scale factor / DPI scaling** OS (mis. 100%, 125%).
- [ ] Apakah resolusi Windows di-set = native panel atau di-scale.
- [ ] Versi Electron/Chromium yang dipaketkan (`electron -v` / `process.versions`).

> Cara cepat ambil beberapa nilai dari DevTools console kiosk:
> `screen.width`, `screen.height`, `window.devicePixelRatio`,
> `navigator.userAgent`, dan `console.log(process.versions)` di main process.

## 2. Skenario uji durasi (inti)

Ulangi alur berikut penuh untuk **setiap** monitor:
Login → pilih paket → (extra print/addon/voucher opsional) → bayar (mode tunai via
admin agar cepat) → Start Photo → **ambil 4 foto** → pilih template → **drag 4 foto ke
slot** → NEXT → pilih filter → NEXT → izinkan/tolak permission.

Lalu ukur video hasil:

- [ ] **AC1 — Monitor 1080p (regression guard):** durasi video = durasi sesi **± 0,5 dtk**.
- [ ] **AC2 — Monitor touchscreen non-1080p yang sebelumnya bermasalah:** durasi = sesi ± 0,5 dtk.
- [ ] **AC3 — Minimal 2 monitor tambahan** beda resolusi/refresh (mis. 1366×768, 1600×900): durasi = sesi ± 0,5 dtk.
- [ ] **AC4 — Klip sumber lambat siap:** paksa kondisi berat (mis. langsung NEXT cepat) — video tetap **berdurasi penuh**, bukan terpotong.
- [ ] **AC5 — Tidak regresi:** foto display, **foto production (hasil print)**, dan GIF tetap benar.
- [ ] **AC6 — Resolusi video tetap** = template (1414×2000), tidak turun.

### Cara mengukur durasi video hasil
Di preview (`VideoPreviewModal` → tab **Template Video**) atau setelah upload:
- [ ] Putar video, pastikan berjalan sampai ~6 dtk (atau durasi klip terpanjang).
- [ ] (Opsional, akurat) di DevTools console cek `videoElement.duration` pada preview.
- [ ] Bandingkan dengan target: `max(countDownPhoto*1000, durasiKlipTerpanjang)`.

## 3. Data diagnostik bila MASIH terpotong

Jika ada monitor yang video-nya tetap 1–2 dtk setelah fix, catat:

- [ ] Durasi persis video hasil (detik).
- [ ] `mimeType` MediaRecorder yang terpilih (`video/webm` vs `video/mp4`).
- [ ] Ukuran file video (MB) — indikasi berapa frame yang sempat ter-encode.
- [ ] Apakah klip sumber per-slot (tab **Captures**) berdurasi benar ~6 dtk — untuk
      memisahkan masalah *sumber* vs *composite*.
- [ ] Log console dari `handleNext` (error apa pun, `MediaRecorder failed`, dll).
- [ ] Apakah durasi berkorelasi dengan refresh rate / scaling monitor (dari §1).

## 4. Uji perbaikan pelengkap (opsional, bila dicurigai)

- [ ] Selaraskan ukuran `BrowserWindow` Electron dengan resolusi monitor (hapus
      hardcode `width:1920,height:1080`) → uji ulang durasi. Catat apakah membantu.

## 5. Keputusan setelah uji

- [ ] **Semua AC lulus** → tutup isu; catat hasil + tabel data monitor di `context.md`.
- [ ] **Ada AC gagal** → naik ke solusi definitif **WebCodecs** (encoding offline,
      timestamp eksplisit). Lampirkan data §1 & §3 sebagai dasar. Kriteria & lingkup
      di `SPECIFICATION.md` bagian "Reliabilitas Video".

## 6. Log hasil (isi saat uji)

| Tgl | Monitor (model) | Native | Refresh | Scale | Touchscreen | Durasi video | Lulus? | Catatan |
|-----|-----------------|--------|---------|-------|-------------|--------------|--------|---------|
|     |                 |        |         |       |             |              |        |         |
|     |                 |        |         |       |             |              |        |         |
|     |                 |        |         |       |             |              |        |         |
