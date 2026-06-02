import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import vhsVideo from '@/assets/vhs-effect.mp4'
import secondaryBg from '@/assets/secondary-background.svg'

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
        {variant === 'video' ? (
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
        )}
      </AnimatePresence>
    </div>
  )
}
