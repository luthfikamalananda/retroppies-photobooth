# ─────────────────────────────────────────────────────────────────────────────
# Retroppies Photobooth — Version Selector desktop (pilih & pasang versi apa pun).
#
# Dipanggil oleh shortcut desktop "Version Selector - Retroppies":
#   powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File version-selector.ps1
#
# Pelengkap updater.ps1 (yang selalu memasang versi TERBARU). Skrip ini menampilkan
# DAFTAR semua rilis stabil ber-installer dari GitHub Releases dan membiarkan operator
# memilih versi mana pun — termasuk TURUN (rollback) ke versi lama bila rilis baru
# bermasalah. Lihat ADR 0005.
#
# Alur:
#   1. Baca versi terpasang dari metadata exe aplikasi (ProductVersion).
#      Bila exe tak ada → dianggap 0.0.0 (mode bootstrap).
#   2. Ambil daftar rilis dari GitHub Releases (repo publik, tanpa token) dan saring:
#      buang draft, buang prerelease, buang rilis tanpa aset .exe.
#   3. Tampilkan ListBox semua versi (terbaru di atas), tandai (terbaru) & terpasang.
#   4. Setelah dipilih: konfirmasi bila downgrade / pasang-ulang → unduh installer →
#      jalankan senyap (/S) → selesai.
#
# Tidak butuh Node/Git/electron-updater. Hanya PowerShell + .NET bawaan Windows.
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# ---- Konfigurasi ----
$Owner  = 'luthfikamalananda'
$Repo   = 'retroppies-photobooth'
$AppExe = 'Retroppies Photobooth.exe'
$ApiUrl = "https://api.github.com/repos/$Owner/$Repo/releases?per_page=100"

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Show-Info([string]$msg, [string]$title) {
  [System.Windows.Forms.MessageBox]::Show($msg, $title, 'OK', 'Information') | Out-Null
}
function Show-Err([string]$msg) {
  [System.Windows.Forms.MessageBox]::Show($msg, 'Version Selector gagal', 'OK', 'Error') | Out-Null
}

# Ubah tag rilis (mis. "v1.0.2") menjadi [version]. Kembalikan $null bila tak valid.
function Convert-Tag([string]$tag) {
  $t = "$tag".TrimStart('v', 'V')
  $t = ($t.Trim() -split '[^0-9.]')[0]
  try { return [version]$t } catch { return $null }
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

  # 2. Ambil daftar rilis & saring: bukan draft, bukan prerelease, punya aset .exe.
  $releases = Invoke-RestMethod -Uri $ApiUrl -Headers @{
    'User-Agent' = 'Retroppies-VersionSelector'
    'Accept'     = 'application/vnd.github+json'
  }

  $items = @()
  foreach ($r in $releases) {
    if ($r.draft) { continue }
    if ($r.prerelease) { continue }
    $ver = Convert-Tag $r.tag_name
    if (-not $ver) { continue }
    $asset = $r.assets | Where-Object { $_.name -match '\.exe$' } | Select-Object -First 1
    if (-not $asset) { continue }
    $items += [PSCustomObject]@{
      Version = $ver
      Tag     = "$($r.tag_name)"
      Asset   = $asset
    }
  }

  # Urutkan terbaru di atas.
  $items = @($items | Sort-Object Version -Descending)
  if ($items.Count -eq 0) {
    Show-Info "Belum ada versi ber-installer yang tersedia di server.`nCoba lagi nanti atau hubungi admin." 'Version Selector'
    return
  }
  $newest = $items[0].Version

  # 3. Jendela pemilihan versi (ListBox semua versi sekaligus).
  $sel = New-Object System.Windows.Forms.Form
  $sel.Text = 'Version Selector - Retroppies Photobooth'
  $sel.Size = New-Object System.Drawing.Size(460, 380)
  $sel.StartPosition = 'CenterScreen'
  $sel.FormBorderStyle = 'FixedDialog'
  $sel.MaximizeBox = $false
  $sel.MinimizeBox = $false
  $sel.TopMost = $true

  $lblInstalled = New-Object System.Windows.Forms.Label
  $lblInstalled.AutoSize = $false
  $lblInstalled.Size = New-Object System.Drawing.Size(420, 22)
  $lblInstalled.Location = New-Object System.Drawing.Point(18, 15)
  if ($isInstalled) {
    $lblInstalled.Text = "Versi terpasang: v$installed"
  } else {
    $lblInstalled.Text = 'Versi terpasang: (belum terpasang)'
  }
  $sel.Controls.Add($lblInstalled)

  $lblPick = New-Object System.Windows.Forms.Label
  $lblPick.AutoSize = $false
  $lblPick.Size = New-Object System.Drawing.Size(420, 22)
  $lblPick.Location = New-Object System.Drawing.Point(18, 40)
  $lblPick.Text = 'Pilih versi yang ingin dipasang:'
  $sel.Controls.Add($lblPick)

  $list = New-Object System.Windows.Forms.ListBox
  $list.Size = New-Object System.Drawing.Size(420, 205)
  $list.Location = New-Object System.Drawing.Point(18, 65)
  foreach ($it in $items) {
    $line = "v$($it.Version)"
    if ($it.Version -eq $newest)   { $line += '  (terbaru)' }
    if ($isInstalled -and $it.Version -eq $installed) { $line += '  — terpasang' }
    [void]$list.Items.Add($line)
  }
  $list.SelectedIndex = 0
  $sel.Controls.Add($list)

  $btnInstall = New-Object System.Windows.Forms.Button
  $btnInstall.Text = 'Pasang versi ini'
  $btnInstall.Size = New-Object System.Drawing.Size(150, 30)
  $btnInstall.Location = New-Object System.Drawing.Point(18, 285)
  $btnInstall.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $sel.Controls.Add($btnInstall)
  $sel.AcceptButton = $btnInstall

  $btnCancel = New-Object System.Windows.Forms.Button
  $btnCancel.Text = 'Batal'
  $btnCancel.Size = New-Object System.Drawing.Size(100, 30)
  $btnCancel.Location = New-Object System.Drawing.Point(338, 285)
  $btnCancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $sel.Controls.Add($btnCancel)
  $sel.CancelButton = $btnCancel

  $result = $sel.ShowDialog()
  $chosenIndex = $list.SelectedIndex
  $sel.Dispose()
  if ($result -ne [System.Windows.Forms.DialogResult]::OK) { return }
  if ($chosenIndex -lt 0) { return }

  $chosen = $items[$chosenIndex]

  # Konfirmasi bergantung arah: downgrade / pasang-ulang / naik.
  if ($isInstalled -and $chosen.Version -lt $installed) {
    $ans = [System.Windows.Forms.MessageBox]::Show(
      "Anda akan TURUN ke versi lama v$($chosen.Version) (saat ini v$installed).`n`nFoto & hasil tetap aman. Lanjutkan?",
      'Konfirmasi turun versi', 'YesNo', 'Warning')
    if ($ans -ne [System.Windows.Forms.DialogResult]::Yes) { return }
  }
  elseif ($isInstalled -and $chosen.Version -eq $installed) {
    $ans = [System.Windows.Forms.MessageBox]::Show(
      "Versi v$($chosen.Version) sudah terpasang.`n`nPasang ulang versi yang sama?",
      'Konfirmasi pasang ulang', 'YesNo', 'Question')
    if ($ans -ne [System.Windows.Forms.DialogResult]::Yes) { return }
  }

  # 4. Jendela progress + unduh + pasang senyap.
  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'Version Selector - Retroppies Photobooth'
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
  $label.Text = 'Menyiapkan...'
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

  Set-Status "Mengunduh versi v$($chosen.Version) ...`n(mohon tunggu, jangan tutup jendela ini)"
  $tmp = Join-Path $env:TEMP $chosen.Asset.name
  Invoke-WebRequest -Uri $chosen.Asset.browser_download_url -OutFile $tmp -Headers @{ 'User-Agent' = 'Retroppies-VersionSelector' }

  # Hapus "Mark-of-the-Web" agar SmartScreen tidak memunculkan prompt saat pasang senyap.
  # (Installer belum ditandatangani — lihat ADR 0004.)
  Unblock-File -Path $tmp -ErrorAction SilentlyContinue

  Set-Status 'Menutup aplikasi yang sedang berjalan...'
  Get-Process -Name 'Retroppies Photobooth' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 500

  Set-Status "Memasang versi v$($chosen.Version) ..."
  Start-Process -FilePath $tmp -ArgumentList '/S' -Wait

  Remove-Item $tmp -Force -ErrorAction SilentlyContinue

  $form.Hide()
  Show-Info "Berhasil dipasang versi v$($chosen.Version).`n`nSilakan buka Retroppies Photobooth dari ikon di desktop." 'Selesai'
  $form.Close()
}
catch {
  Show-Err ("Terjadi kesalahan:`n`n" + $_.Exception.Message + "`n`nPeriksa koneksi internet lalu coba lagi, atau hubungi admin.")
}
