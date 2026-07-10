; Custom NSIS include untuk installer Retroppies Photobooth.
; electron-builder memanggil macro ini di tahap install/uninstall.
;
; Tujuan: selain shortcut aplikasi (dibuat otomatis oleh createDesktopShortcut),
; buat juga shortcut desktop "Update Retroppies" yang menjalankan updater.ps1
; lewat PowerShell secara senyap. Ikon shortcut mengikuti ikon exe aplikasi.
;
; updater.ps1 dikemas sebagai extraResources → berada di $INSTDIR\resources\updater.ps1

!macro customInstall
  CreateShortcut "$DESKTOP\Update Retroppies.lnk" \
    "$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" \
    "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File $\"$INSTDIR\resources\updater.ps1$\"" \
    "$INSTDIR\Retroppies Photobooth.exe" 0
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Update Retroppies.lnk"
!macroend
