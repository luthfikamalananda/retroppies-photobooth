# ─────────────────────────────────────────────────────────────────────────────
# Retroppies Photobooth — Updater desktop (1 klik).
#
# Dipanggil oleh shortcut desktop "Update Retroppies":
#   powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File updater.ps1
#
# Alur:
#   1. Baca versi terpasang dari metadata exe aplikasi (ProductVersion).
#      Bila exe tak ada (mis. dijalankan dari USB di mesin baru) → dianggap 0.0.0,
#      sehingga skrip ini SEKALIGUS berfungsi sebagai bootstrap install pertama.
#   2. Ambil rilis terbaru dari GitHub Releases (repo publik, tanpa token).
#   3. Bila sudah versi terbaru → beri tahu & berhenti (hemat kuota).
#      Bila ada versi baru → unduh installer → jalankan senyap (/S) → selesai.
#
# Tidak butuh Node/Git/electron-updater. Hanya PowerShell + .NET bawaan Windows.
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# ---- Konfigurasi ----
$Owner  = 'luthfikamalananda'
$Repo   = 'retroppies-photobooth'
$AppExe = 'Retroppies Photobooth.exe'
$ApiUrl = "https://api.github.com/repos/$Owner/$Repo/releases/latest"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ---- Jendela progress sederhana ----
$form = New-Object System.Windows.Forms.Form
$form.Text = 'Update Retroppies Photobooth'
$form.Size = New-Object System.Drawing.Size(440, 160)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true

$label = New-Object System.Windows.Forms.Label
$label.AutoSize = $false
$label.Size = New-Object System.Drawing.Size(400, 45)
$label.Location = New-Object System.Drawing.Point(18, 20)
$label.Text = 'Mengecek pembaruan...'
$form.Controls.Add($label)

$bar = New-Object System.Windows.Forms.ProgressBar
$bar.Style = 'Marquee'
$bar.MarqueeAnimationSpeed = 30
$bar.Size = New-Object System.Drawing.Size(400, 24)
$bar.Location = New-Object System.Drawing.Point(18, 75)
$form.Controls.Add($bar)

$form.Show()
$form.Refresh()
[System.Windows.Forms.Application]::DoEvents()

function Set-Status([string]$msg) {
  $label.Text = $msg
  $form.Refresh()
  [System.Windows.Forms.Application]::DoEvents()
}
function Show-Info([string]$msg, [string]$title) {
  [System.Windows.Forms.MessageBox]::Show($msg, $title, 'OK', 'Information') | Out-Null
}
function Show-Err([string]$msg) {
  [System.Windows.Forms.MessageBox]::Show($msg, 'Update gagal', 'OK', 'Error') | Out-Null
}

try {
  # 1. Versi terpasang (dari metadata exe). Bila belum ada → 0.0.0 (mode bootstrap).
  $exePath = Join-Path (Split-Path $PSScriptRoot -Parent) $AppExe
  $installed = [version]'0.0.0'
  $isInstalled = Test-Path $exePath
  if ($isInstalled) {
    $pv = (Get-Item $exePath).VersionInfo.ProductVersion
    if ($pv) {
      $pv = ($pv.Trim() -split '[^0-9.]')[0]
      try { $installed = [version]$pv } catch { $installed = [version]'0.0.0' }
    }
  }

  # 2. Rilis terbaru dari GitHub.
  Set-Status 'Mengecek versi terbaru di server...'
  $release = Invoke-RestMethod -Uri $ApiUrl -Headers @{
    'User-Agent' = 'Retroppies-Updater'
    'Accept'     = 'application/vnd.github+json'
  }

  $tag = "$($release.tag_name)".TrimStart('v', 'V')
  $latest = [version]'0.0.0'
  try { $latest = [version]$tag } catch { }

  $asset = $release.assets | Where-Object { $_.name -match '\.exe$' } | Select-Object -First 1
  if (-not $asset) { throw 'Installer (.exe) tidak ditemukan pada rilis terbaru di GitHub.' }

  # 3. Bandingkan — kalau sudah terbaru, berhenti.
  if ($isInstalled -and $latest -le $installed) {
    $form.Hide()
    Show-Info "Aplikasi sudah versi terbaru (v$installed).`nTidak ada pembaruan yang perlu dipasang." 'Retroppies Photobooth'
    $form.Close()
    return
  }

  # 4. Unduh installer.
  Set-Status "Mengunduh versi v$latest ...`n(mohon tunggu, jangan tutup jendela ini)"
  $tmp = Join-Path $env:TEMP $asset.name
  Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $tmp -Headers @{ 'User-Agent' = 'Retroppies-Updater' }

  # Hapus "Mark-of-the-Web" dari file yang baru diunduh agar Windows SmartScreen
  # tidak memunculkan prompt "unknown publisher" saat installer dijalankan senyap.
  # (Installer belum ditandatangani — lihat ADR 0004.)
  Unblock-File -Path $tmp -ErrorAction SilentlyContinue

  # 5. Tutup aplikasi bila sedang berjalan, lalu pasang senyap.
  Set-Status 'Menutup aplikasi yang sedang berjalan...'
  Get-Process -Name 'Retroppies Photobooth' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 500

  Set-Status 'Memasang pembaruan...'
  Start-Process -FilePath $tmp -ArgumentList '/S' -Wait

  Remove-Item $tmp -Force -ErrorAction SilentlyContinue

  $form.Hide()
  Show-Info "Berhasil diperbarui ke versi v$latest.`n`nSilakan buka Retroppies Photobooth dari ikon di desktop." 'Update selesai'
  $form.Close()
}
catch {
  $form.Hide()
  Show-Err ("Terjadi kesalahan saat update:`n`n" + $_.Exception.Message + "`n`nPeriksa koneksi internet lalu coba lagi, atau hubungi admin.")
  $form.Close()
}
