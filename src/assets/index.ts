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
import secondaryBg from './secondary-background.svg'

import logoChooseProduct from './logo-choose-product.svg'
import logoHowToUse from './logo-how-to-use.svg'
import logoRec from './logo-rec.svg'
import logoBattery from './logo-battery.svg'
import logoBack from './logo-back.svg'

export { logoFull, logoMark, secondaryBg, logoChooseProduct, logoHowToUse, logoRec, logoBattery, logoBack, logoRetroppies }
