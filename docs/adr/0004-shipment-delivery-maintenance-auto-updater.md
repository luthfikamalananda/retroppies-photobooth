# ADR 0004 — Shipment / Delivery Maintenance: Auto-Updater via CI Build + Desktop Updater

- Status: Accepted (diimplementasikan 2026-07-10)
- Tanggal: 2026-07-10
- Konteks kode: `.github/workflows/release.yml` (baru), `package.json`
  (blok `build`/`nsis`/`publish`), `build/updater.ps1` (baru),
  `build/installer.nsh` (baru, custom NSIS include), `electron-builder.json`
  (dihapus — konfig dikonsolidasi ke `package.json`). Tombol "Keluar" ternyata
  sudah ada sebelumnya (× di `AdminLoginPage` → `CloseAppModal` → IPC `close-app`),
  jadi tidak perlu dibuat ulang.

## Konteks

Aplikasi ini di-*ship* sebagai kiosk Electron (`fullscreen` + `kiosk`) ke beberapa
mini PC Windows di lokasi booth berbeda. Booth dijaga **operator non-teknis**.

Alur maintenance saat ini menuntut operator menjalankan CLI di tiap mini PC:

```
git pull  →  npm run electron:build  →  jalankan dist/win-unpacked/Retroppies Photobooth.exe
```

Ini tidak layak untuk operator awam dan rapuh di lapangan. Kendala & fakta yang
membentuk keputusan:

- **Mesin developer adalah MacBook** → tidak bisa membangun target Windows secara
  konvensional (butuh wine/mesin Windows).
- **Bagian paling rapuh adalah tahap compile** (`npm install` + `electron-builder`,
  termasuk native dep `ffmpeg-static`). Jika ini terjadi **di booth**, kegagalan
  (koneksi putus, disk penuh, native module gagal) meninggalkan app rusak yang tak
  bisa diperbaiki operator, dan tak terlihat oleh developer sampai ada laporan.
- Booth **punya internet** yang cukup stabil untuk mengunduh installer (~150 MB).
- Repo **public** di GitHub → GitHub Releases bisa dibaca updater **tanpa token**.
- App berjalan **fullscreen kiosk** → untuk mengklik icon di desktop, operator harus
  bisa mencapai desktop lebih dulu.
- Update dipilih **manual saja** (bukan otomatis di background) — operator memicu
  sendiri lewat satu aksi.

Tujuan pengalaman operator: **satu klik icon di desktop → app jadi versi terbaru**,
tanpa pernah membuka folder, CLI, atau memahami build.

## Keputusan

Pindahkan tahap build **menjauh dari booth**, ke tempat yang dikontrol developer,
dan sisakan hanya *unduh + pasang* di booth.

1. **Build sekali di GitHub Actions (Windows runner), booth hanya mengunduh.**
   Developer cukup `git push` dari MacBook — GitHub yang meng-compile. Bagian rapuh
   (compile) terjadi 1× terpusat di lingkungan bersih; kegagalan muncul di dashboard
   GitHub (sisi developer), **tak pernah** menyentuh booth. Ini juga menuntaskan
   kendala "MacBook tak bisa build Windows" karena runner-nya native Windows dan
   `ffmpeg-static` ikut terbundel benar tanpa cross-compile.

2. **Rilis dipicu kenaikan `version` di `package.json` (bukan git tag manual).**
   Workflow berjalan pada setiap push ke `main`, membaca `version` dari `package.json`,
   lalu **hanya** `npm ci` → `electron:build` (NSIS) → publish bila rilis `v{version}`
   belum ada (dicek via `gh release view`). Jadi developer cukup menaikkan `version`
   lalu push — tanpa perlu `git tag`. Tag `v{version}` tetap dibuat otomatis oleh
   electron-builder di sisi GitHub saat publish. Kontrol rilis tetap eksplisit (booth
   hanya naik versi bila developer sengaja menaikkan `version`), dan build tidak
   berulang untuk versi yang sama.

3. **Updater desktop mandiri berbasis PowerShell — bukan `electron-updater`.**
   Karena update dipilih **manual saja**, nilai utama `electron-updater` (cek & unduh
   otomatis di background, differential update) tidak terpakai. Maka update di-*decouple*
   total dari app: sebuah skrip PowerShell kecil (bawaan Windows, tanpa runtime tambahan),
   dipanggil shortcut desktop
   `powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File updater.ps1`.
   Skrip: (a) cek versi terpasang vs rilis terbaru GitHub; (b) bila **sama** →
   "Sudah versi terbaru", berhenti (hemat unduhan ~150 MB); (c) bila **beda** → unduh
   installer → jalankan senyap (`/S`) → app jadi versi terbaru. Jendela progress
   sederhana ditampilkan.

4. **Installer NSIS: per-user, one-click.** `oneClick: true`, `perMachine: false` →
   tanpa popup UAC, tanpa wizard; install ke `%LOCALAPPDATA%`. Update mulus benar-benar
   satu klik untuk booth ber-user tunggal.

5. **Installer membuat KEDUA icon desktop.** Lewat custom NSIS include: icon
   **"Retroppies Photobooth"** (jalankan booth) + **"Update Retroppies"** (jalankan
   `updater.ps1`), sekaligus menaruh `updater.ps1` di lokasi terpasang. Operator tak
   pernah menyentuh folder.

6. **Updater = bootstrap.** Untuk mini PC baru (belum ada app), copy satu berkas updater
   (skrip + shortcut) via USB, klik sekali → ia mengunduh & memasang versi terbaru →
   kedua icon otomatis tercipta. Satu alat untuk setup awal dan update seterusnya.

7. **Booth TIDAK auto-start + tombol "Keluar".** Mini PC nyala → langsung desktop;
   operator memilih icon "Photobooth" atau "Update". Ditambah tombol **"Keluar"** di
   panel admin agar operator mudah menutup app kiosk dan kembali ke desktop bila app
   sedang berjalan (tanpa perlu Alt+F4).

## Kompatibilitas dengan alur build konvensional

Fitur ini **aditif** — `git pull` + `npm run electron:build` di mesin lokal **tetap
berjalan benar**:

- Workflow CI hanya file baru; script `npm` tak diubah.
- Perubahan konfig hanya mengubah *gaya* installer (one-click per-user + shortcut
  "Update"). `electron-builder` tetap menghasilkan output, termasuk `win-unpacked/`
  (tahap antara), sehingga menjalankan exe portable langsung tetap mungkin.
- **Publish tidak aktif di build lokal**: auto-upload ke Releases hanya dilakukan CI
  (`--publish always` + `GH_TOKEN`); `electron:build` lokal tidak meng-upload apa pun.
- Target Windows tetap perlu mesin Windows/wine — sama seperti sekarang, bukan regresi.
- **Utang teknis yang harus dibereskan saat implementasi**: repo punya dua sumber
  konfig build (`package.json` `build` dan `electron-builder.json`) dengan
  `directories.output` berbeda (`dist` vs `dist-electron`). Dikonsolidasi jadi satu
  agar perilaku prediktabel dan konfig NSIS baru tidak ambigu.

## Alternatif yang dipertimbangkan

- **Build di mini PC (git pull + npm build lewat 1 tombol).** Ditolak: memindahkan
  tahap rapuh (compile) ke lapangan; tiap booth wajib punya Node/Git/`node_modules`/
  toolchain; kegagalan build tak terlihat & tak bisa diperbaiki operator; source code
  tersebar di tiap booth.
- **`electron-updater` di dalam app (auto/background atau updater-mode window).**
  Ditolak untuk kasus ini: update dipilih manual sehingga fitur auto/diff tak terpakai;
  dan yang terpenting, updater in-app **tak berfungsi bila binary app rusak** —
  kehilangan kemampuan recovery. Updater desktop mandiri tetap bisa memasang versi
  perbaikan walau app gagal dibuka.
- **Rilis otomatis tiap push ke `main` tanpa penjaga versi.** Ditolak: tiap commit kecil
  jadi "update" yang tersedia ke booth; sulit mengontrol kapan booth naik versi. Solusi
  yang dipakai memicu pada push ke `main` **tetapi** hanya publish bila `version` di
  `package.json` naik (rilis `v{version}` belum ada) — kontrol tetap eksplisit tanpa
  membebani developer dengan `git tag` manual.
- **Git tag manual (`git tag vX.Y.Z && git push --tags`).** Sempat dipilih, lalu diganti:
  atas permintaan, alur cukup menaikkan `version` di `package.json` tanpa langkah tag
  terpisah. Fungsional setara (tag tetap terbentuk otomatis oleh electron-builder).
- **Per-machine install (Program Files).** Ditolak: memunculkan popup UAC tiap update →
  friction untuk operator awam. Per-user menghindarinya.
- **Exe updater terpisah (Node/pkg).** Ditolak: artefak kedua yang harus di-build &
  dirawat, lebih berat dari skrip PowerShell bawaan Windows.
- **Auto-start kiosk saat boot.** Ditolak (untuk saat ini): membuat desktop tak terjangkau
  sehingga icon "Update" tak bisa diklik tanpa jalur keluar. Booth non-auto-start membuat
  konsep dua-icon-desktop natural.

## Konsekuensi

- **Operasional booth jauh lebih sederhana & andal**: satu klik, unduh file jadi, pasang
  senyap. Tak ada compile di lapangan, tak ada CLI, tak ada akses folder.
- **Recovery**: bila suatu rilis membuat app gagal dibuka, operator masih bisa klik
  "Update" untuk memasang rilis perbaikan — tanpa developer datang ke lokasi.
- **Ketergantungan baru**: alur rilis kini bergantung pada GitHub Actions & GitHub
  Releases. Perlu satu kali setup workflow + `GH_TOKEN` (otomatis tersedia di Actions).
- **Kontrol rilis manual**: booth tidak akan pernah naik versi tanpa (a) developer nge-tag
  dan (b) operator mengklik "Update". Ini disengaja; konsekuensinya operator bisa lupa
  update sehingga booth tertinggal versi — diterima demi kesederhanaan & kontrol.
- **Installer publik**: file installer dapat diunduh siapa pun dari Releases publik. Untuk
  app photobooth ini dapat diterima; hindari menaruh secret di bundel (variabel `VITE_`
  yang ada memang sudah bersifat publik di bundel client).
- **Peringatan SmartScreen**: installer belum ditandatangani (unsigned) → Windows dapat
  menampilkan peringatan SmartScreen pada instalasi pertama. Diterima untuk deployment
  internal terkendali; code signing dapat ditambahkan kemudian tanpa mengubah arsitektur.
- **Rollback**: karena tiap rilis ada di Releases sebagai versi terpisah, rollback dapat
  dilakukan dengan menjalankan installer versi lama (mekanisme rollback satu-klik di luar
  scope keputusan ini).
