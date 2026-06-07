/**
 * Asset barrel — import semua gambar/logo dari sini.
 *
 * Cara ganti logo dengan file asli kamu:
 *   1. Taruh file logo di folder  src/assets/
 *   2. Ganti import di bawah sesuai nama file
 *   3. Semua halaman yang menggunakan logoFull / logoMark otomatis terupdate
 *
 * Format yang didukung Vite: .svg .png .jpg .webp .gif
 */

// Logo utama — horizontal (ikon kamera + teks RETROPPIES)
import logoFull from './logo-full.svg'

// Logo mark / ikon saja — cocok untuk ukuran kecil atau favicon
import logoMark from './logo-mark.svg'
import logoRetroppies from './retroppies-logo.svg'

// Background alternatif (SVG) — dipakai saat backgroundVariant === 'image'
import iconVoucher from './icon-voucher.svg'

import logoChooseProduct from './logo-choose-product.svg'
import logoHowToUse from './logo-how-to-use.svg'
import logoRec from './logo-rec.svg'
import logoBattery from './logo-battery.svg'
import logoBack from './btn-back.svg'
import logoSkip from './btn-skip.svg'
import logoExtraPrint from './logo-extra-print.svg'
import logoAddOns from './logo-adds-on.svg'
import logoVoucher from './logo-voucher.svg'
import logoWindowControl from './logo-window-control.svg'

import btnIncrement from './btn-increment.svg'
import btnDecrement from './btn-decrement.svg'
import btnChoose from './btn-choose.svg'
import btnNextBlack from './btn-next-black.svg'
import btnSkipBlack from './btn-skip-black.svg'
import btnApply from './btn-apply.svg'
import btnBackGold from './btn-back-gold.svg'


export {
    iconVoucher,
    logoFull, logoMark, logoChooseProduct, logoHowToUse, logoRec, logoBattery, logoBack, logoSkip, logoExtraPrint, logoAddOns, logoVoucher, logoRetroppies, logoWindowControl,
    btnChoose, btnIncrement, btnDecrement, btnNextBlack, btnSkipBlack, btnApply, btnBackGold,
}
