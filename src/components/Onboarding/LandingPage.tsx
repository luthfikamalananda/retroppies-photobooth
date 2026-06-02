import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import logoFull from '@/assets/retroppies-logo.svg'
import logoPlay from '@/assets/logo-play.svg'
import logoBattery from '@/assets/logo-battery.svg'
import logoPressStart from '@/assets/logo-press-start.svg'


export function LandingPage() {
  const goNext = useSessionStore(s => s.goNext)

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full flex justify-between items-center">
        <motion.img
          src={logoPlay}
          alt="Play"
          className="w-32 h-16 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          draggable={false}
        />
        <motion.img
          src={logoBattery}
          alt="Battery"
          className="w-14 h-14 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          draggable={false}
        />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <motion.img
          src={logoFull}
          alt="Retroppies Photobooth"
          className="w-[600px] h-[350px]  max-w-full select-none pointer-events-none"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
      </div>

      <motion.img
        src={logoPressStart}
        alt="Press Start"
        className="touch-target w-64 text-retro-brown font-body font-semibold text-2xl rounded-full py-5 shadow-lg cursor-pointer select-none"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.95 }}
        onClick={goNext}
      />
    </motion.div>
  )
}
