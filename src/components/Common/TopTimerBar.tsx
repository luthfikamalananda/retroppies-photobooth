import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useAuthStore } from '@/store/authStore'

export function TopTimerBar() {
  const { timerSeconds, timerRunning, tickTimer, resetSession } = useSessionStore()
  const settings = useAuthStore(s => s.settings)

  useEffect(() => {
    if (!timerRunning) return
    const interval = setInterval(tickTimer, 1000)
    return () => clearInterval(interval)
  }, [timerRunning, tickTimer])

  // Auto-reset session when timer hits 0
  useEffect(() => {
    if (timerRunning && timerSeconds === 0) {
      resetSession()
    }
  }, [timerSeconds, timerRunning, resetSession])

  const totalSec = settings.sessionDurationSec
  const progress = totalSec > 0 ? timerSeconds / totalSec : 0
  const minutes = Math.floor(timerSeconds / 60)
  const seconds = timerSeconds % 60

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-6 py-2 bg-black/60 backdrop-blur-sm">
      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-retro-amber rounded-full"
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="font-display text-retro-cream text-2xl tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  )
}
