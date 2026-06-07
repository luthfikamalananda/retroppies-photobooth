import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import bgVideoBlack from '@/assets/bg-black.mp4'
import bgImageWhite from '@/assets/bg-white.svg'
import bgImageBlack from '@/assets/bg-black.svg'

/**
 * Renders either the VHS video loop or the secondary SVG background,
 * with a smooth crossfade when backgroundVariant changes.
 *
 * Toggle dari mana saja:
 *   const toggle = useUIStore(s => s.toggleBackground)
 *   const set    = useUIStore(s => s.setBackgroundVariant)
 */
export function BackgroundVideo() {
  const variant = useUIStore(s => s.backgroundVariant)

  return (
    // Both layers rendered on top of each other; AnimatePresence fades between them.
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
      <AnimatePresence mode="sync">
        {/* Buatkan switch case agar lebih mudah dibaca */}
        {(() => {
          switch (variant) {
            case 'video-black':
              return (
                <motion.video
                  key="video"
                  className="absolute inset-0 w-full h-full object-cover"
                  src={bgVideoBlack}
                  autoPlay
                  loop
                  muted
                  playsInline
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
              )
            case 'image-white':
              return (
                <motion.img
                  key="image"
                  src={bgImageWhite}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  draggable={false}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
              )
            case 'image-black':
              return (
                <motion.img
                  key="image"
                  src={bgImageBlack}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  draggable={false}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
              )
            default:
              return null
          }
        })()}

        {/* {variant === 'video' ? (
          <motion.video
            key="video"
            className="absolute inset-0 w-full h-full object-cover"
            src={vhsVideo}
            autoPlay
            loop
            muted
            playsInline
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        ) : (
          <motion.img
            key="image"
            src={secondaryBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover select-none"
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        )} */}
      </AnimatePresence>
    </div>
  )
}
