import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useAuthStore } from '@/store/authStore'

export function StartPhotoPage() {
  const { goTo } = useSessionStore()
  const { startTimer, setConsent } = { ...useSessionStore(), ...useAuthStore() }
  // Hardcoded session settings for now, can be made dynamic later
  const sessionSettings = { sessionDurationSec: 300 }
  const startTimer_ = useSessionStore(s => s.startTimer)
  const setConsent_ = useSessionStore(s => s.setConsent)

  const [agreed, setAgreed] = useState(false)
  const [cameraError, setCameraError] = useState(false)

  const handleStart = async () => {
    if (!agreed) return
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      startTimer_(sessionSettings.sessionDurationSec)
      setConsent_(true)
      goTo(10)
    } catch {
      setCameraError(true)
    }
  }

  const minutes = Math.floor(sessionSettings.sessionDurationSec / 60)

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-16 px-20"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <h2 className="font-display text-retro-cream text-5xl">Siap Foto?</h2>

      <div className="flex flex-col items-center gap-8 max-w-lg text-center">
        <div className="bg-black/50 border border-retro-amber/30 rounded-2xl p-8">
          <p className="font-display text-retro-amber text-6xl">{minutes} Menit</p>
          <p className="font-body text-retro-cream/60 mt-2">Waktu sesi fotomu</p>
        </div>

        {cameraError && (
          <p className="font-body text-red-400">Kamera tidak tersedia. Pastikan izin kamera diberikan.</p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-6 h-6 mt-0.5 accent-retro-amber cursor-pointer"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          <span className="font-body text-retro-cream/80 text-sm text-left leading-relaxed">
            Saya setuju foto ini dapat digunakan untuk keperluan promosi Retroppies.
          </span>
        </label>
      </div>

      <button
        className="touch-target w-72 bg-retro-amber text-retro-brown font-body font-semibold text-2xl rounded-full py-5 disabled:opacity-40"
        disabled={!agreed}
        onClick={handleStart}
      >
        Mulai Foto 📸
      </button>
    </motion.div>
  )
}
