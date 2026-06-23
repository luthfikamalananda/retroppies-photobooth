# print-borderless.ps1
# Dipanggil dari main.js via child_process.execFile (lihat handler "print-photo-borderless")
# Usage manual untuk testing:
#   powershell -ExecutionPolicy Bypass -File print-borderless.ps1 -ImagePath "C:\temp\photo.jpg" -PrinterName "EPSON L8050 Series" -PaperName "A4 210 x 297 mm" -Copies 1

param(
    [Parameter(Mandatory=$true)][string]$ImagePath,
    [Parameter(Mandatory=$true)][string]$PrinterName,
    [Parameter(Mandatory=$false)][string]$PaperName = "",
    [Parameter(Mandatory=$false)][int]$Copies = 1
)

Add-Type -AssemblyName System.Drawing

$printDoc = New-Object System.Drawing.Printing.PrintDocument
$printDoc.PrinterSettings.PrinterName = $PrinterName

if (-not $printDoc.PrinterSettings.IsValid) {
    Write-Error "Printer '$PrinterName' tidak ditemukan atau driver belum terinstall."
    exit 1
}

$allPapers = $printDoc.PrinterSettings.PaperSizes

# Cari paper size exact match dulu
$targetPaper = $allPapers | Where-Object { $_.PaperName -eq $PaperName }

# Fallback ke kandidat umum kalau exact match tidak ketemu
if (-not $targetPaper) {
    $candidates = @(
        "A4 210 x 297 mm",
        "A6 105 x 148 mm"
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

# Fallback terakhir: pattern match nama yang mengandung kata border/nmgn
if (-not $targetPaper) {
    $targetPaper = $allPapers | Where-Object {
        $_.PaperName -match "(?i)border" -or
        $_.PaperName -match "(?i)nmgn" -or
        $_.PaperName -match "(?i)no.?margin"
    } | Select-Object -First 1
}

if (-not $targetPaper) {
    Write-Error "Tidak ada paper size yang cocok ditemukan untuk printer '$PrinterName' dengan nama '$PaperName'"
    Write-Host "Paper sizes yang tersedia:"
    $allPapers | ForEach-Object { Write-Host " - $($_.PaperName)" }
    exit 1
}

Write-Host "Menggunakan paper size: '$($targetPaper.PaperName)' | Copies: $Copies"

$printDoc.DefaultPageSettings.PaperSize = $targetPaper
$printDoc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
$printDoc.PrinterSettings.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
$printDoc.PrinterSettings.Copies = $Copies

$image = [System.Drawing.Image]::FromFile($ImagePath)

$printDoc.add_PrintPage({
    param($sender, $e)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $e.PageBounds.Width, $e.PageBounds.Height)
    $e.Graphics.DrawImage($image, $rect)
})

try {
    $printDoc.Print()
    Write-Host "Print job berhasil dikirim ke $PrinterName dengan paper '$($targetPaper.PaperName)' x$Copies"
} catch {
    Write-Error "Print gagal: $_"
    exit 1
} finally {
    $image.Dispose()
}