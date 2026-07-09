# ADR 0002 — Prefetch + Warm-All Templat di Halaman Sebelumnya (TakePhotoPage)

- Status: Accepted (diamandemen 2026-07-09 — lihat "Amandemen: reset per-halaman")
- Tanggal: 2026-07-09
- Konteks kode: `src/store/templateStore.ts`, `src/components/PhotoSession/TakePhotoPage.tsx`,
  `src/components/PhotoSession/TemplatePage.tsx`, `src/App.tsx`

## Konteks

`TemplatePage` (halaman 11) terasa lambat saat dibuka. Penyebabnya, seluruh proses
dimulai **saat mount**: fetch daftar templat (`limit: 999`) baru dijalankan setelah
halaman muncul, lalu **10+ gambar `displayUrl` beresolusi penuh** diunduh sekaligus di
belakang teks "Memuat template…" yang memblokir carousel. Data disimpan di `useState`
lokal sehingga setiap kunjungan ulang mengunduh ulang semuanya. Ditambah, background
di-flip ke `image-black` lewat `useEffect` (setelah mount) sehingga sempat berkedip
`image-white` → `image-black` saat kedatangan.

Gambar `displayUrl` adalah **file statis full-res** — tidak ada CDN/proxy yang bisa
me-resize di sisi server, jadi ukuran byte per gambar tidak bisa dikecilkan. Satu-satunya
pengungkit ada di sisi klien: **muat lebih awal**, **jangan muat ulang**, dan **jangan
tabrakan decode saat mount**.

## Keputusan

1. **Cache di store, sekali per-tenant.** Templat dipindah dari `useState` lokal ke
   `templateStore` (Zustand) dengan aksi idempoten `ensureTemplatesLoaded(tenantId)`:
   dedupe fetch bersamaan, no-op bila sudah termuat, refetch bila tenant berganti.
   Cache di-reset di setiap halaman **kecuali** TakePhotoPage (10) dan TemplatePage (11)
   — lihat "Amandemen: reset per-halaman" di bawah. `clearUser` juga tetap memanggil
   `clear` (dynamic import, hindari circular dependency ke `apiClient`).

2. **Prefetch di halaman sebelumnya.** `TakePhotoPage` memanggil `ensureTemplatesLoaded`
   saat mount — templat dimuat **selagi user mengambil foto**, sehingga `TemplatePage`
   tampil dari cache tanpa menunggu jaringan. `TemplatePage` tetap memanggilnya juga
   sebagai jaring pengaman (mis. reload di tengah sesi).

3. **Warm SEMUA gambar + thumbnail carousel.** Setelah daftar kembali, setiap
   `displayUrl` di-fetch (menghangatkan HTTP cache full-res untuk composite di
   DragDropPage) lalu **di-downscale ke thumbnail WebP** (tinggi 700px, konkurensi 3)
   yang disimpan di `thumbs[id]`. Carousel TemplatePage merender thumbnail ini
   (`thumbs[id] ?? displayUrl`), bukan PNG full-res 2000px — decode per file jadi jauh
   lebih ringan. `displayUrl` full-res **tidak diganti** karena masih dipakai composite.

4. **`useLayoutEffect` untuk background.** Flip ke `image-black` dipindah ke
   `useLayoutEffect` (sebelum paint pertama) untuk menghapus kedip putih saat kedatangan.
   `AnimatePresence mode="wait"` global sengaja TIDAK diutak-atik.

## Alternatif yang dipertimbangkan

- **Resize/thumbnail di server (CDN param atau `thumbUrl`).** Pengungkit terbesar,
  tapi ditolak: `displayUrl` adalah file statis full-res dan tidak ada perubahan
  backend dalam scope ini.
- **Warm hanya beberapa gambar yang terlihat + lazy sisanya.** Lebih hemat memori,
  tapi dipilih **warm semua** karena carousel harus terasa instan sepenuhnya begitu
  user tiba; unduhan latar tidak bersaing dengan kamera (kerja kamera lokal).
- **Prefetch lebih awal lagi (setelah login).** Data bisa basi selama sesi panjang;
  prefetch di TakePhotoPage sudah cukup dekat dengan titik pakai.

## Konsekuensi

- Tekanan memori dari full-res kini rendah: thumbnail WebP kecil (~puluhan KB) yang
  ditahan, bukan 10+ bitmap full-res. Full-res hanya di-decode sekejap saat membuat
  thumbnail lalu dilepas.
- Object URL thumbnail wajib di-`revokeObjectURL` saat refetch/`clear` (kini terjadi
  di tiap perpindahan halaman ke luar flow, ganti tenant, atau logout) agar tidak bocor.
  `clear` sudah menangani ini.
- Butuh `OffscreenCanvas` + `createImageBitmap({resizeQuality})` + `convertToBlob`
  (WebP). Aman di Chromium/Electron target. Ada fallback: bila gagal, UI memakai
  `displayUrl` full-res (`decoding="async"` tetap terpasang).

## Amandemen: reset per-halaman (2026-07-09)

**Perubahan.** Semula cache bertahan selama seluruh masa hidup sesi kiosk dan hanya
dibersihkan saat logout (`clearUser`). Akibatnya, lintas beberapa pelanggan dalam satu
sesi kiosk, daftar/pilihan templat basi bisa ikut terbawa. Kini `templateStore.clear()`
dipanggil di `App.tsx` pada **setiap** perpindahan halaman **kecuali** TakePhotoPage
(halaman 10) dan TemplatePage (halaman 11):

```ts
const TEMPLATE_KEEP_HALAMAN = [10, 11]

useEffect(() => {
  if (!TEMPLATE_KEEP_HALAMAN.includes(currentHalaman)) {
    useTemplateStore.getState().clear()
  }
}, [currentHalaman])
```

**Mengapa aman dengan prefetch/warm.** Prefetch tetap dijalankan di TakePhotoPage (10)
dan pilihan bertahan sampai TemplatePage (11) — dua halaman itu di-*keep*, jadi carousel
tetap terasa instan. Saat NEXT di TemplatePage, templat terpilih **disalin ke
`photoStore`** (`setTemplate`), sehingga DragDropPage (12) & FinishedPhotoPage (13) —
yang tidak membaca `templateStore` sama sekali — tetap bisa composite meski store
di-reset di halaman-halaman itu. `clear` hanya me-revoke object URL thumbnail lokal,
bukan `displayUrl` full-res (URL statis remote yang masih hangat di HTTP cache).

**Konsekuensi.** Kembali ke belakang keluar dari flow (mis. 10 → 9) mereset cache;
maju lagi ke 10 akan prefetch ulang (fetch daftar + bangun thumbnail lagi). Ini
disengaja demi kebaruan data per pelanggan. Perpindahan di dalam flow (10 ⇄ 11) tidak
mereset. Panggilan `clear` di `clearUser` sengaja **dipertahankan** sebagai jaring
pengaman defensif meski kini sebagian redundan.
