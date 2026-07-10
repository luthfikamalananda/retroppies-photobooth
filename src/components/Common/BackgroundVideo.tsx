import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import bgVideoBlack from '@/assets/bg-black.mp4'
// Background diubah dari SVG (yang isinya PNG 4K ~15-20MB di-base64) ke WebP 1920x1080
// ~50-100KB. SVG lama memaksa decode 4096x2304 lalu downscale tiap transisi → berat &
// crossfade hitam↔putih patah-patah di mini PC. WebP kecil = decode instan.
import bgImageWhite from '@/assets/bg-white.webp'
import bgImageBlack from '@/assets/bg-black.webp'

/**
 * Renders either the VHS video loop or one of the SVG backgrounds,
 * with a smooth crossfade when backgroundVariant changes.
 *
 * Toggle dari mana saja:
 *   const toggle = useUIStore(s => s.toggleBackground)
 *   const set    = useUIStore(s => s.setBackgroundVariant)
 */
export function BackgroundVideo() {
  const variant = useUIStore(s => s.backgroundVariant)

  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
      <AnimatePresence mode="sync">
        {(() => {
          switch (variant) {
            case 'video-black':
              return (
                <motion.video
                  // FIX: key sebelumnya "video" — sudah unik dari case lain,
                  // tidak diubah, hanya durasi transition diperpendek.
                  key="bg-video-black"
                  className="absolute inset-0 w-full h-full object-cover"
                  src={bgVideoBlack}
                  autoPlay
                  loop
                  muted
                  playsInline
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }} // 0.8s → 0.4s
                />
              )
            case 'image-white':
              return (
                <motion.img
                  // FIX UTAMA: sebelumnya key="image" — SAMA dengan case
                  // 'image-black' di bawah. Akibatnya React/Framer Motion
                  // menganggap kedua case ini sebagai ELEMEN YANG SAMA saat
                  // berpindah dari satu ke yang lain (hanya src yang
                  // berubah), bukan unmount+mount baru. Ini membuat exit/
                  // enter animation AnimatePresence tidak berjalan benar,
                  // dan browser harus reload+decode gambar baru di tempat
                  // tanpa proper transition — inilah salah satu sumber lag.
                  key="bg-image-white"
                  src={bgImageWhite}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  draggable={false}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }} // SVG ringan, durasi dipersingkat
                />
              )
            case 'image-black':
              return (
                <motion.img
                  key="bg-image-black" // ← key unik, tidak lagi collide dengan image-white
                  src={bgImageBlack}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  draggable={false}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                />
              )
            default:
              return null
          }
        })()}
      </AnimatePresence>
    </div>
  )
}