# ADR 0005 — Version Selector: Pilih & Pasang Versi Apa Pun (Rollback) via Skrip PowerShell + Shortcut Desktop

- Status: Accepted (diimplementasikan 2026-07-13). Dirilis sebagai versi 1.0.2.
- Tanggal: 2026-07-13
- Konteks kode: `build/version-selector.ps1` (baru), `build/version-selector-icon.ico`
  (baru), `build/installer.nsh` (tambah shortcut ke-3 + rename shortcut updater +
  hapus nama lama), `package.json` (`version` → 1.0.2, `extraResources` tambah
  `version-selector.ps1` & ikonnya). Mendaur ulang pola &
  sebagian kode `build/updater.ps1`.
- Terkait: [ADR 0004](0004-shipment-delivery-maintenance-auto-updater.md) — updater
  desktop mandiri; ADR ini bersifat **aditif** di atasnya.

## Konteks

ADR 0004 memberi booth satu ikon **"Update"** yang selalu memasang **rilis terbaru**
dari GitHub Releases. Yang belum tersedia: kemampuan **memilih versi tertentu**,
khususnya **rollback** — bila sebuah rilis baru ternyata bermasalah di lapangan,
operator non-teknis tidak punya cara satu-klik untuk kembali ke versi lama yang stabil.
ADR 0004 secara eksplisit menaruh "mekanisme rollback satu-klik" **di luar scope**.

Kendala & fakta yang membentuk keputusan (lanjutan dari ADR 0004, masih berlaku):

- Booth = kiosk Electron di beberapa mini PC Windows, dijaga **operator non-teknis**.
  Interaksi harus sesederhana klik ikon desktop; tanpa CLI, folder, atau memahami build.
- Mesin developer **MacBook** → tidak build target Windows secara lokal; build terpusat
  di GitHub Actions, booth hanya **unduh + pasang**.
- Repo **publik** → GitHub Releases dapat dibaca **tanpa token**. Endpoint `/releases`
  mengembalikan daftar penuh (bisa memuat draft/prerelease/rilis tanpa installer).
- Update dipilih **manual** oleh operator (bukan background otomatis).
- Installer NSIS saat ini **one-click, per-user** (`%LOCALAPPDATA%`), tanpa UAC.

Premis yang diluruskan saat desain: rilis saat ini **bukan** dua "output build". Yang
di-build & di-upload hanya **satu** artefak — installer NSIS
`Retroppies-Photobooth-Setup-${version}.exe`. "Updater" **bukan hasil compile**: ia
`build/updater.ps1` yang dibundel sebagai `extraResources` dan dipanggil lewat shortcut
desktop. Version Selector mengikuti pola **yang sama** — menumpang di installer, bukan
artefak build baru.

## Keputusan

1. **Version Selector = skrip PowerShell mandiri + shortcut desktop ke-3**, bukan exe
   terpisah. `build/version-selector.ps1` dibundel via `extraResources` dan mendaur
   ulang ~80% logika `updater.ps1` (panggil GitHub API → unduh installer → jalankan
   senyap `/S`, tutup app yang sedang berjalan, `Unblock-File` untuk hindari prompt
   SmartScreen). Tugas intinya identik dengan updater; yang beda hanya **pemilihan
   versi** menggantikan "ambil latest". Konsisten dengan ADR 0004 yang menolak exe
   updater terpisah (toolchain + artefak kedua yang harus dirawat & di-sign).

2. **Fungsi: pilih & pasang versi APA PUN dari GitHub Releases**, termasuk naik ke lebih
   baru maupun **turun (rollback)** ke versi lama. Pelengkap ikon "Update" (yang selalu
   ke terbaru), bukan pengganti.

3. **Daftar versi hanya rilis stabil ber-installer.** Selector memanggil `/releases`
   (daftar penuh) lalu **menyaring**: buang draft, buang prerelease, buang rilis yang
   tak memiliki aset `.exe`. Booth produksi tak bisa salah memasang build eksperimental
   atau rilis rusak.

4. **UI WinForms sederhana, UX diprioritaskan.** Walau UI alakadar (konsisten dengan
   jendela updater), pengalaman harus jelas untuk operator awam:
   - Label "Versi terpasang: vX.Y.Z" (dibaca dari `ProductVersion` exe, sama seperti
     updater; bila exe tak ada → mode bootstrap 0.0.0).
   - **ListBox menampilkan semua versi sekaligus**, urut terbaru-di-atas, tiap baris
     ditandai `(terbaru)` dan `— terpasang`. Semua opsi terlihat tanpa membuka dropdown.
   - Tombol "Pasang versi ini".
   - Reuse jendela progress marquee dari updater saat unduh/pasang.

5. **Downgrade diizinkan, dengan konfirmasi.** Memilih versi **lebih lama** dari yang
   terpasang memunculkan dialog konfirmasi ("Anda akan turun ke versi lama vX.Y.Z. Foto
   & hasil tetap aman. Lanjutkan?") sebelum memasang — mencegah salah-klik tanpa
   memblokir rollback. Memilih versi **lebih baru** → pasang langsung seperti update
   biasa. Memilih versi **sama** dengan terpasang → info "sudah terpasang", boleh
   pasang-ulang lewat konfirmasi.

6. **Rollback berfungsi tanpa flag build — installer NSIS oneClick tidak memblokir
   downgrade.** Rencana awal menyetel `allowDowngrade`, tetapi itu keliru: `allowDowngrade`
   adalah setting runtime **electron-updater** (yang proyek ini sengaja tidak pakai —
   ADR 0004), bukan opsi build electron-builder; skema v24 menolaknya baik di `nsis`
   maupun di root `build`. Verifikasi langsung pada template NSIS bawaan
   (`app-builder-lib/templates/nsis/installSection.nsh`) menunjukkan **tidak ada
   perbandingan versi yang membatalkan instalasi**: installer meng-uninstall versi
   sebelumnya (versi apa pun) lalu memasang target, tanpa peduli arah versi. Maka
   memasang installer versi lama di atas yang lebih baru cukup menimpa — rollback jalan
   tanpa konfigurasi tambahan.

7. **Shortcut desktop ke-3 + penyeragaman nama.** Lewat custom NSIS include
   (`installer.nsh`):
   - Ikon baru **"Version Selector - Retroppies"** → menjalankan `version-selector.ps1`
     senyap.
   - Ikon updater di-*rename* dari **"Update Retroppies"** menjadi **"Updater -
     Retroppies"** (pola seragam `X - Retroppies`). `customInstall` juga menghapus
     eksplisit nama lama `Update Retroppies.lnk` sebagai pengaman terhadap sisa shortcut
     dangling saat update dari 1.0.1. `customUnInstall` menghapus ketiga/kedua nama baru.
   - Ikon `.ico` Version Selector (`build/version-selector-icon.ico`, disediakan oleh
     developer) dengan pembeda visual (konteks "pilih/sync versi") agar tak tertukar
     dengan updater.

8. **Dikirim sebagai rilis 1.0.2 — aditif.** Seluruh perubahan ini menjadi isi rilis
   **1.0.2** (naikkan `version` di `package.json` → push ke `main` → CI build & publish,
   sesuai ADR 0004). Booth mendapat ikon Version Selector setelah operator klik "Update"
   ke 1.0.2.

## Kompatibilitas dengan yang ada

- **Aditif terhadap ADR 0004.** `updater.ps1` dan alur "Update selalu ke terbaru" tak
  berubah fungsinya; hanya nama shortcut updater yang diseragamkan.
- `git pull` + `npm run electron:build` lokal tetap berjalan; publish tetap hanya di CI.
- `allowDowngrade: true` hanya melonggarkan penjaga versi installer; tidak mengubah
  gaya one-click/per-user.

## Alternatif yang dipertimbangkan

- **Exe Version Selector terpisah (output build ke-3).** Ditolak: menambah toolchain
  (Node/pkg atau target electron-builder kedua) + binary unsigned kedua (SmartScreen
  lagi) + artefak yang harus di-build/di-upload/di-versi — untuk tugas sepele
  "list rilis → unduh → jalankan `/S`". Persis alasan ADR 0004 menolak exe updater.
- **Gabung ke `updater.ps1` (satu ikon "Update" dengan mode pilih-versi di dalamnya).**
  Ditolak: operator menginginkan aksi yang berbeda dan terpisah secara visual —
  "selalu terbaru" vs "pilih versi" — dua ikon membuat niatnya eksplisit.
- **ComboBox dropdown / dua tombol (Terbaru & Sebelumnya).** Ditolak demi kejelasan:
  ListBox penuh menampilkan semua versi tanpa klik tersembunyi dan memungkinkan lompat
  ke versi spesifik yang lebih jauh (bukan hanya "sebelumnya").
- **Menampilkan prerelease/semua rilis apa adanya.** Ditolak untuk booth produksi:
  menaikkan risiko operator memasang build eksperimental atau rilis tanpa installer.
- **Blokir downgrade.** Ditolak: bertentangan langsung dengan tujuan "pilih versi apa
  pun / rollback".
- **Skrip Version Selector tahan-rollback (disimpan di lokasi persisten di luar folder
  app).** Ditolak demi kesederhanaan: menambah kerja & titik-gagal; jalur pulih via
  "Update" sudah selalu tersedia (lihat Konsekuensi).

## Konsekuensi

- **Rollback satu-klik untuk operator awam.** Bila rilis baru bermasalah, operator dapat
  kembali ke versi stabil tanpa developer datang ke lokasi — menutup gap yang ditandai
  "di luar scope" pada ADR 0004.
- **Ketersediaan bertahap.** Booth di 1.0.1 belum memiliki ikon Version Selector hingga
  klik "Update" ke 1.0.2. Ini jawaban atas pertanyaan pemicu: ya, ikon ke-3 muncul
  setelah update ke 1.0.2.
- **Ikon Version Selector mati setelah rollback ke <1.0.2.** Versi lama (1.0.0/1.0.1)
  tak membundel `version-selector.ps1`, sehingga shortcut-nya menjadi dangling bila
  operator me-rollback ke sana. **Diterima**: ikon **"Updater - Retroppies"** ada di
  semua versi → jalur pulih untuk naik lagi ke terbaru selalu tersedia. Alternatif
  "tahan-rollback" ditolak (lihat di atas).
- **Rollback bergantung pada perilaku default installer (menimpa apa adanya),** bukan
  flag khusus. Perlu diverifikasi di mesin Windows nyata bahwa memasang versi lama di
  atas yang lebih baru benar-benar mulus (mis. tak ada sisa berkas versi baru); analisis
  template NSIS mengindikasikan aman, tetapi belum diuji end-to-end di Windows.
- **Ikon disediakan developer.** `build/version-selector-icon.ico` adalah aset desain
  tangan (multi-resolusi hingga 256×256), bukan modifikasi terprogram — kualitas final.
- **Risiko shortcut ganda saat rename updater.** Update dari 1.0.1 mengandalkan
  uninstaller lama menghapus `Update Retroppies.lnk`; sebagai pengaman, `customInstall`
  1.0.2 menghapus nama lama secara eksplisit. Perlu diverifikasi di mesin nyata bahwa
  tak ada dua ikon updater tertinggal.
- **Batas praktis daftar rilis.** `/releases` mengembalikan ~30 rilis terbaru per
  halaman tanpa paginasi; memadai untuk proyek ini dalam waktu lama. Bila kelak melebihi,
  perlu paginasi.
