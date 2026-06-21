# print-borderless.ps1
# Dipanggil dari main.js via child_process.execFile (lihat handler "print-photo-borderless")
# Usage manual untuk testing:
#   powershell -ExecutionPolicy Bypass -File print-borderless.ps1 -ImagePath "C:\temp\photo.jpg" -PrinterName "EPSON L8050 Series" -PaperName "A4 (Borderless)"

param(
    [Parameter(Mandatory=$true)][string]$ImagePath,
    [Parameter(Mandatory=$true)][string]$PrinterName,
    [Parameter(Mandatory=$false)][string]$PaperName = "",  # opsional, jika tahu pasti namanya
    [Parameter(Mandatory=$false)][double]$PaperWidthMM = 210,
    [Parameter(Mandatory=$false)][double]$PaperHeightMM = 297
)

Add-Type -AssemblyName System.Drawing

$printDoc = New-Object System.Drawing.Printing.PrintDocument
$printDoc.PrinterSettings.PrinterName = $PrinterName

$allPapers = $printDoc.PrinterSettings.PaperSizes

# Jika PaperName diberikan eksplisit, coba itu dulu (exact match)
$targetPaper = $null
if ($PaperName -ne "") {
    $targetPaper = $allPapers | Where-Object { $_.PaperName -eq $PaperName }
}

# Jika belum ketemu, coba kandidat nama umum yang dipakai berbagai driver Epson
if (-not $targetPaper) {
    $candidates = @(
        "$PaperName",
        "A4 (Borderless)",
        "A4 - Borderless",
        "Borderless A4",
        "A4.NMgn",
        "A4 Borderless"
    )

    foreach ($candidate in $candidates) {
        $match = $allPapers | Where-Object { $_.PaperName -eq $candidate }
        if ($match) {
            $targetPaper = $match
            Write-Host "Ditemukan paper size via kandidat: '$candidate'"
            break
        }
    }
}

# Jika masih belum ketemu, cari yang namanya MENGANDUNG kata kunci borderless-related
if (-not $targetPaper) {
    $targetPaper = $allPapers | Where-Object {
        $_.PaperName -match "(?i)border" -or
        $_.PaperName -match "(?i)nmgn" -or
        $_.PaperName -match "(?i)no.?margin"
    } | Select-Object -First 1

    if ($targetPaper) {
        Write-Host "Ditemukan paper size via pattern match: '$($targetPaper.PaperName)'"
    }
}

if (-not $targetPaper) {
    Write-Error "Tidak ada paper size borderless yang cocok ditemukan untuk printer '$PrinterName'"
    Write-Host "Paper sizes yang tersedia:"
    $allPapers | ForEach-Object { Write-Host " - $($_.PaperName)" }
    exit 1
}

Write-Host "Menggunakan paper size: '$($targetPaper.PaperName)' (Width: $($targetPaper.Width), Height: $($targetPaper.Height))"

$printDoc.DefaultPageSettings.PaperSize = $targetPaper
$printDoc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
$printDoc.PrinterSettings.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)

$image = [System.Drawing.Image]::FromFile($ImagePath)

$printDoc.add_PrintPage({
    param($sender, $e)

    # Gambar full ke PageBounds (sudah dalam mode borderless dari driver)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $e.PageBounds.Width, $e.PageBounds.Height)
    $e.Graphics.DrawImage($image, $rect)
})

try {
    $printDoc.Print()
    Write-Host "Print job berhasil dikirim ke $PrinterName dengan paper '$($targetPaper.PaperName)'"
} catch {
    Write-Error "Print gagal: $_"
    exit 1
} finally {
    $image.Dispose()
}

