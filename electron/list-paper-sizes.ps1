# list-paper-sizes.ps1
# Jalankan di Windows untuk melihat nama EXACT paper size yang
# didaftarkan driver Epson L8050, termasuk varian Borderless.
#
# Usage: powershell -ExecutionPolicy Bypass -File list-paper-sizes.ps1

$printerName = "EPSON L8050 Series"  # Ganti sesuai output dari: Get-Printer | Select-Object Name

Add-Type -AssemblyName System.Drawing

try {
    $printDoc = New-Object System.Drawing.Printing.PrintDocument
    $printDoc.PrinterSettings.PrinterName = $printerName

    if (-not $printDoc.PrinterSettings.IsValid) {
        Write-Host "ERROR: Printer '$printerName' tidak ditemukan atau drivernya belum terinstall." -ForegroundColor Red
        Write-Host "Printer yang terdeteksi di sistem ini:" -ForegroundColor Yellow
        Get-Printer | Select-Object Name | ForEach-Object { Write-Host " - $($_.Name)" }
        exit 1
    }

    Write-Host "=== Semua Paper Size untuk printer: $printerName ===" -ForegroundColor Cyan
    Write-Host ""

    foreach ($size in $printDoc.PrinterSettings.PaperSizes) {
        Write-Host ("Name: '{0}'  |  Kind: {1}  |  {2} x {3} (1/100 inch)" -f `
            $size.PaperName, $size.Kind, $size.Width, $size.Height)
    }

    Write-Host ""
    Write-Host "=== Kandidat Borderless (mengandung kata Border/NoMargin/NMgn) ===" -ForegroundColor Yellow
    $candidates = $printDoc.PrinterSettings.PaperSizes | Where-Object {
        $_.PaperName -match "(?i)border" -or
        $_.PaperName -match "(?i)nmgn" -or
        $_.PaperName -match "(?i)no.?margin"
    }

    if ($candidates) {
        $candidates | ForEach-Object { Write-Host " OK -> '$($_.PaperName)'" -ForegroundColor Green }
    } else {
        Write-Host " (Tidak ada match otomatis, scroll ke atas dan cari manual di daftar lengkap)" -ForegroundColor DarkYellow
    }

} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}
