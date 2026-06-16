// const PAPER_SIZES = {
//     A4: { width: 210, height: 297 },
//     A6: { width: 105, height: 148 },
// } as const

// type PaperSize = keyof typeof PAPER_SIZES

// const PAPER_SIZE = (import.meta.env.VITE_PRINT_PAPER_SIZE ?? 'A4') as PaperSize

// // Deteksi apakah running di Electron
// const isElectron = () => {
//     return typeof window !== 'undefined' &&
//         typeof (window as any).electronAPI !== 'undefined'
// }

// // ── Electron silent print ─────────────────────────────────────────────────────
// const printViaElectron = async (dataUrl: string): Promise<void> => {
//     const paper = PAPER_SIZES[PAPER_SIZE] ?? PAPER_SIZES.A4

//     // Pisahkan base64 dari header
//     const base64 = dataUrl.split(',')[1]
//     const filename = `retroppies-print-${Date.now()}.jpg`

//     // Main process yang tulis file — tidak ada IPC size issue untuk base64 string
//     const filePath = await (window as any).electronAPI.saveTempFile({
//         base64,
//         filename,
//     })

//     await (window as any).electronAPI.printPhoto({
//         filePath,
//         paperWidth: paper.width,
//         paperHeight: paper.height,
//     })
// }

// // ── Browser print (fallback) ──────────────────────────────────────────────────

// const printViaBrowser = (dataUrl: string): Promise<void> => {
//     return new Promise((resolve, reject) => {
//         const paper = PAPER_SIZES[PAPER_SIZE] ?? PAPER_SIZES.A4

//         const iframe = document.createElement('iframe')
//         iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;'
//         document.body.appendChild(iframe)

//         const iframeDoc = iframe.contentWindow?.document
//         if (!iframeDoc) {
//             document.body.removeChild(iframe)
//             reject(new Error('Tidak bisa membuat iframe untuk print'))
//             return
//         }

//         iframeDoc.open()
//         iframeDoc.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="UTF-8" />
//           <style>
//             * {
//               margin: 0 !important;
//               padding: 0 !important;
//               box-sizing: border-box !important;
//             }

//             @page {
//               size: ${paper.width}mm ${paper.height}mm;
//               margin: 0mm !important;
//               padding: 0mm !important;
//               /* Override browser default margin */
//               margin-top: 0mm !important;
//               margin-bottom: 0mm !important;
//               margin-left: 0mm !important;
//               margin-right: 0mm !important;
//             }

//             html, body {
//               width: ${paper.width}mm;
//               height: ${paper.height}mm;
//               margin: 0 !important;
//               padding: 0 !important;
//               overflow: hidden;
//             }

//             img {
//               display: block;
//               width: ${paper.width}mm;
//               height: ${paper.height}mm;
//               margin: 0 !important;
//               padding: 0 !important;
//               object-fit: fill;
//             }
//           </style>
//         </head>
//         <body>
//           <img src="${dataUrl}" />
//         </body>
//       </html>
//     `)
//         iframeDoc.close()

//         iframe.onload = () => {
//             try {
//                 iframe.contentWindow?.focus()
//                 iframe.contentWindow?.print()

//                 const cleanup = () => {
//                     if (document.body.contains(iframe)) document.body.removeChild(iframe)
//                     resolve()
//                 }

//                 if (iframe.contentWindow) iframe.contentWindow.onafterprint = cleanup
//                 setTimeout(cleanup, 60_000)
//             } catch (err) {
//                 document.body.removeChild(iframe)
//                 reject(err)
//             }
//         }
//     })
// }

// export const printPhoto = async (dataUrl: string): Promise<void> => {
//     console.log("isElectron", isElectron())
//     if (isElectron()) {
//         return printViaElectron(dataUrl)
//     }
//     return printViaBrowser(dataUrl)
// }