import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { iconTimerWhite, logoTimeLimit, logoWindowControl } from '@/assets'
import { getTimerTransaction } from '@/services/duringPhotoService'

// ─── Animation Variants ───────────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut', delay: 0.15 } },
}

// ─── CameraErrorModal ─────────────────────────────────────────────────────────

interface CameraErrorModalProps {
  isOpen: boolean
  errorText: string
  onRetry: () => void
}

function CameraErrorModal({ isOpen, errorText, onRetry }: CameraErrorModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-xl border-4 border-[#F7CC40] shadow-2xl overflow-hidden w-[600px]"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#F7CC40] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#2C2C2C] text-2xl">CAMERA ERROR</h2>
              <img src={logoWindowControl} alt="" className="select-none pointer-events-none h-auto" />
            </div>
            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-4">
              <p className="font-gaming text-[#2C2C2C] text-xl text-center">{errorText}</p>
              <div className="flex gap-4 justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onRetry}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-gaming text-lg py-4 px-6 rounded-lg border-2 border-[#2E7D32] transition-colors"
                >
                  RETRY
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function StartPhotoPage() {
  const { user } = useAuthStore()
  const { goToAndStartTimer, setTimer } = useSessionStore()
  const setBg = useUIStore((s) => s.setBackgroundVariant)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({ minutes: '00', seconds: '00' })
  const [camError, setCamError] = useState({ hasError: false, message: '' })

  // Fix bug isInitialized — useRef agar tidak reset tiap render
  const initialized = useRef(false)

  useEffect(() => {
    setBg('image-black')
    // Reset camera error saat mount — digabung jadi satu useEffect
    setCamError({ hasError: false, message: '' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (!user) {
      setError('User tidak ditemukan. Silakan login ulang.')
      setLoading(false)
      return
    }

    getTimerTransaction({
      keyword: '',
      limit: 999,
      page: 1,
      tenantId: user.tenantId ?? 0,
    })
      .then((res) => {
        const timer = res.result.rules.find(
          (r: { rulesType: string; value: number }) => r.rulesType === 'PHOTO'
        )
        if (timer?.value) {
          setTimer(timer.value * 60)
          setTimeLeft({
            minutes: String(Math.floor(timer.value)).padStart(2, '0'),
            seconds: '00',
          })
        } else {
          setError('Gagal memuat Timer. Coba lagi.')
        }
      })
      .catch((e: unknown) => {
        console.error(e)
        setError('Gagal memuat timer. Coba lagi.')
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Camera handler ────────────────────────────────────────────────────

  const handleStart = async () => {
    // Reset error kamera setiap kali coba lagi
    setCamError({ hasError: false, message: '' })
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      goToAndStartTimer(10)
    } catch (e) {
      console.error('Camera access error:', e)
      setCamError({
        hasError: true,
        message:
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? 'Akses kamera ditolak. Pastikan izin kamera diberikan.'
            : 'Kamera tidak tersedia. Pastikan perangkat memiliki kamera yang berfungsi.',
      })
    }
  }

  return (
    <>
      <motion.div
        className="relative z-10 flex flex-col items-center justify-between w-full h-full py-16 px-20"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* ── HEADER ── */}
        <div className="flex flex-row w-full justify-center items-center">
          <motion.img
            src={logoTimeLimit}
            alt="Time Limit"
            variants={fadeIn}
            className="w-[40%] select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* ── CONTENT ── */}
        <motion.div
          className="flex flex-row items-center justify-center gap-8 max-w-lg text-center"
          variants={slideUp}
        >
          {/* Timer display */}
          {loading ? (
            <p className="font-gaming text-retro-cream/60 text-xl">Memuat timer...</p>
          ) : error ? (
            <p className="font-gaming text-red-400 text-xl">{error}</p>
          ) : (
            <>
              <div className="flex flex-row justify-center items-center p-6 flex-shrink-0 gap-3">
                <img src={iconTimerWhite} alt="Icon Timer" className="w-14 h-14 mx-auto" />
                <div className="flex flex-row justify-center items-center gap-2">
                  <p className="font-gaming text-[#FCF8EF] text-7xl">{timeLeft.minutes}</p>
                  <p className="font-gaming text-[#FCF8EF] text-6xl">:</p>
                  <p className="font-gaming text-[#FCF8EF] text-7xl">{timeLeft.seconds}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 justify-center items-start">
                <p className="font-bebas text-[#FCF8EF] text-6xl text-nowrap tracking-wider font-thin">
                  TIME LIMIT FOR YOUR PHOTO SESSION IS
                </p>
                <p className="font-bebas text-[#FCF8EF] text-6xl text-nowrap tracking-wide">
                  {timeLeft.minutes}:{timeLeft.seconds} MINUTES
                </p>
                <p className="font-bebas text-[#FCF8EF] text-6xl text-nowrap tracking-wider">
                  PLEASE DON'T EXCEED YOUR TIME LIMIT
                </p>
              </div>
            </>
          )}
        </motion.div>

        {/* ── START BUTTON ── */}
        <motion.button
          variants={fadeIn}
          whileTap={{ scale: 0.95 }}
          // Disable saat loading atau ada error timer (bukan camera error)
          disabled={loading || !!error}
          onClick={handleStart}
          className="touch-target w-96 bg-[#E9C140] text-retro-brown font-gaming font-semibold text-3xl rounded-full py-8 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          START PHOTO
        </motion.button>
      </motion.div>

      {/* Modal di luar motion.div agar tidak kena animasi exit page */}
      <CameraErrorModal
        isOpen={camError.hasError}
        errorText={camError.message}
        onRetry={handleStart}
      />
    </>
  )
}