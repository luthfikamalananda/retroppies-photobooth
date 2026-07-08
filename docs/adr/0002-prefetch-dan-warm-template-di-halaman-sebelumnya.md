# ADR 0002 — Prefetch + Warm-All Templat di Halaman Sebelumnya (TakePhotoPage)

- Status: Accepted
- Tanggal: 2026-07-09
- Konteks kode: `src/store/templateStore.ts`, `src/components/PhotoSession/TakePhotoPage.tsx`,
  `src/components/PhotoSession/TemplatePage.tsx`

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
   Cache bertahan selama masa hidup sesi kiosk; dibersihkan lewat `clearUser`
   (dynamic import, hindari circular dependency ke `apiClient`).

2. **Prefetch di halaman sebelumnya.** `TakePhotoPage` memanggil `ensureTemplatesLoaded`
   saat mount — templat dimuat **selagi user mengambil foto**, sehingga `TemplatePage`
   tampil dari cache tanpa menunggu jaringan. `TemplatePage` tetap memanggilnya juga
   sebagai jaring pengaman (mis. reload di tengah sesi).

3. **Warm SEMUA gambar.** Setelah daftar kembali, `new Image()` ditembakkan untuk
   **setiap** `displayUrl` agar masuk HTTP cache. Referensi ditahan sampai `onload`
   supaya unduhan tidak ke-GC di tengah jalan.

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

- 10+ bitmap full-res bisa menetap di memori (~10MB per gambar setelah decode). Pada
  kiosk kelas OptiPlex kemungkinan aman; bila muncul tekanan memori, mitigasi lanjutan =
  **downscale di sisi klien** (canvas/`createImageBitmap`). Belum dilakukan.
- `decoding="async"` + `loading="lazy"` dipasang pada `<img>` templat agar decode
  serempak saat mount tidak menghambat main thread.
