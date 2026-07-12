; Custom NSIS include untuk installer Retroppies Photobooth.
; electron-builder memanggil macro ini di tahap install/uninstall.
;
; Tujuan: selain shortcut aplikasi (dibuat otomatis oleh createDesktopShortcut),
; buat juga DUA shortcut desktop:
;   - "Updater - Retroppies"          → menjalankan updater.ps1 (selalu versi terbaru)
;   - "Version Selector - Retroppies" → menjalankan version-selector.ps1 (pilih versi apa pun / rollback)
; keduanya lewat PowerShell secara senyap. Lihat ADR 0004 & ADR 0005.
;
; Skrip dikemas sebagai extraResources → berada di $INSTDIR\resources\*.ps1

!macro customInstall
  ; Bersihkan nama shortcut updater LAMA ("Update Retroppies") dari rilis <1.0.2
  ; agar tidak tertinggal berdampingan dengan nama baru saat update. (ADR 0005)
  Delete "$DESKTOP\Update Retroppies.lnk"

  CreateShortcut "$DESKTOP\Updater - Retroppies.lnk" \
    "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" \
    "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File $\"$INSTDIR\resources\updater.ps1$\"" \
    "$INSTDIR\resources\updater-icon.ico" 0

  CreateShortcut "$DESKTOP\Version Selector - Retroppies.lnk" \
    "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" \
    "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File $\"$INSTDIR\resources\version-selector.ps1$\"" \
    "$INSTDIR\resources\version-selector-icon.ico" 0
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Update Retroppies.lnk"
  Delete "$DESKTOP\Updater - Retroppies.lnk"
  Delete "$DESKTOP\Version Selector - Retroppies.lnk"
!macroend
