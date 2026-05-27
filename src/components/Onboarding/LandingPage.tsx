import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'

export function LandingPage() {
  const goNext = useSessionStore(s => s.goNext)

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <motion.h1
          className="font-display text-retro-cream text-7xl text-center tracking-wider"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          RETROPPIES
        </motion.h1>
        <motion.p
          className="font-body text-retro-cream/70 text-xl text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Vintage Photobooth Experience
        </motion.p>
      </div>

      <motion.button
        className="touch-target w-64 bg-retro-amber text-retro-brown font-body font-semibold text-2xl rounded-full py-5 shadow-lg"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.95 }}
        onClick={goNext}
      >
        MULAI
      </motion.button>
    </motion.div>
  )
}
