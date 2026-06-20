const PAPER_SIZES = {
    A4: { width: 210, height: 297 }, // ori
    // A4: { width: 212, height: 299 },
    A6: { width: 105, height: 148 }, // ori
    // A6: { width: 107, height: 150 },
} as const

type PaperSize = keyof typeof PAPER_SIZES
const PAPER_SIZE = (import.meta.env.VITE_PRINT_PAPER_SIZE ?? 'A4') as PaperSize

const isElectron = () =>
    typeof window !== 'undefined' &&
    typeof (window as any).electronAPI !== 'undefined'

export const printPhoto = async (dataUrl: string): Promise<void> => {
    const paper = PAPER_SIZES[PAPER_SIZE] ?? PAPER_SIZES.A4

    if (isElectron()) {
        const api = (window as any).electronAPI
        // Tulis file di preload (Node context) — tidak lewat IPC sama sekali
        const base64 = dataUrl.split(',')[1]  // ekstrak base64 saja

        // IPC kirim base64 — main yang urus semua
        await api.printPhotoSilent(
            base64,
            paper.width,
            paper.height
        )
        return
    }

    // Browser fallback
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;'
        document.body.appendChild(iframe)

        const doc = iframe.contentWindow?.document
        if (!doc) { document.body.removeChild(iframe); reject(new Error('no iframe')); return }

        doc.open()
        doc.write(`<!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }
          html, body { width: ${paper.width}mm; height: ${paper.height}mm; overflow: hidden; }
          img { display: block; width: 100%; height: 100%; object-fit: fill; }
        </style>
      </head>
      <body><img src="${dataUrl}" /></body>
    </html>`)
        doc.close()

        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
                const cleanup = () => {
                    if (document.body.contains(iframe)) document.body.removeChild(iframe)
                    resolve()
                }
                if (iframe.contentWindow) iframe.contentWindow.onafterprint = cleanup
                setTimeout(cleanup, 60_000)
            } catch (err) {
                document.body.removeChild(iframe)
                reject(err)
            }
        }
    })
}

export const printPhotoBorderless = async (dataUrl: string): Promise<void> => {
    const base64 = dataUrl.split(',')[1]

    console.log('tesss')

    const isMac = navigator.platform.toLowerCase().includes('mac')

    console.log('base64', dataUrl)

    await (window as any).electronAPI.printPhotoBorderless({
        base64,
        printerName: isMac ? 'EPSON_L8050_Series' : 'EPSON L8050 Series', // sesuaikan exact name tiap OS
        paperName: isMac ? 'A4.NMgn' : '', // Windows kosongkan dulu → auto-detect via fallback list di PowerShell
    })
}