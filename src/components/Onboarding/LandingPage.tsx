import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import logoFull from '@/assets/retroppies-logo.svg'
import logoPlay from '@/assets/logo-play.svg'
import logoBattery from '@/assets/logo-battery.svg'
import logoPressStart from '@/assets/logo-press-start.svg'
import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'


export function LandingPage() {
  const goNext = useSessionStore(s => s.goNext)
  const setTransaction = useSessionStore(s => s.setTransaction)

  useEffect(() => {
    setTransaction(null) // reset transaksi saat masuk halaman ini
  }, [])

  const setBg = useUIStore((s) => s.setBackgroundVariant)

  useEffect(() => {
    setTransaction(null)
    setBg('video-black')
    // cleanup tidak perlu — halaman lain set bg mereka sendiri
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="w-full flex justify-between items-center">
        {/* rotate dihapus — kombinasi rotate+opacity di gambar besar cukup berat
            di iGPU lemah. opacity-only saja sudah cukup terasa sebagai "muncul" */}
        <motion.img
          src={logoPlay}
          alt="Play"
          className="w-48 h-24 select-none pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          draggable={false}
        />
        <motion.img
          src={logoBattery}
          alt="Battery"
          className="w-48 h-24 select-none pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          draggable={false}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* y translate dipertahankan di logo utama saja (paling penting secara
            visual), tapi durasi dipersingkat dan delay dirapatkan agar tidak
            numpuk lama dengan animasi lain */}
        <motion.img
          src={logoFull}
          alt="Retroppies Photobooth"
          className="w-[750px] h-[200px] select-none pointer-events-none"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.35, ease: 'easeOut' }}
          draggable={false}
        />
      </div>

      {/* Button start — y translate dihapus, opacity-only.
          Ini elemen interaktif yang paling sering dilihat user menunggu,
          jadi paling penting untuk terasa instan/ringan. */}
      <motion.img
        src={logoPressStart}
        alt="Press Start"
        className="touch-target w-96 text-retro-brown font-body font-semibold text-2xl rounded-full py-5 shadow-lg cursor-pointer select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        whileTap={{ scale: 0.95 }}
        onClick={goNext}
      />
    </motion.div>
  )
}