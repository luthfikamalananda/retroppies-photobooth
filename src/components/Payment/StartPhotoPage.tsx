import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { iconTimerWhite, logoTimeLimit, logoWindowControl } from '@/assets'
import { getTimerTransaction } from '@/services/duringPhotoService'

export function StartPhotoPage() {
  const { goTo } = useSessionStore()
  const { user } = useAuthStore()
  const { timerSeconds, goToAndStartTimer, startTimer, setTimer } = useSessionStore()

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [cameraError, setCameraError] = useState({
    hasError: false,
    message: '',
  })

  const setBg = useUIStore((s) => s.setBackgroundVariant)

  const [timeLeft, setTimeLeft] = useState<{ minutes: string; seconds: string }>({
    minutes: '00',
    seconds: '00',
  })

  let isInitialized = false; // flag untuk memastikan init hanya sekali


  useEffect(() => {
    if (isInitialized) return
    isInitialized = true

    if (!user) {
      setError('User tidak ditemukan. Silakan login ulang.')
      setLoading(false)
      return
    }

    getTimerTransaction({
      keyword: '',
      limit: 999,
      page: 1,
      tenantId: user.tenantId || 0,
    })
      .then((res) => {
        const timer = res.result.rules.find((r) => {
          return r.rulesType === "PHOTO"
        })
        if (timer?.value) {
          // FIX THIS HARDCODE
          setTimer(timer.value * 60)
          const minutes = Math.floor(timer.value)
          setTimeLeft({ minutes: String(minutes).padStart(2, '0'), seconds: '00' })
        } else {
          setError('Gagal memuat Timer. Coba lagi.')
        }
      })
      .catch((e) => {
        console.error(e)
        setError('Gagal memuat produk. Coba lagi.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setBg('image-black')
  }, [])

  useEffect(() => {
    // Reset state saat masuk halaman ini
    setCameraError({ hasError: false, message: '' })
  }, [])

  const handleStart = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      goToAndStartTimer(10)
    } catch (e) {
      console.log('Camera access error:', e)
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        setCameraError({ hasError: true, message: 'Akses kamera ditolak. Pastikan izin kamera diberikan.' })
      } else {
        setCameraError({ hasError: true, message: 'Kamera tidak tersedia. Pastikan perangkat memiliki kamera yang berfungsi.' })
      }
    }
  }

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-16 px-20"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >

      <div className='flex flex-row w-full justify-center items-center'>
        <motion.img
          src={logoTimeLimit}
          alt="Time Limit"
          className="w-[40%] select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
      </div>

      <motion.div
        className="flex flex-row items-center justify-center gap-8 max-w-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-row justify-center items-center p-6 flex-shrink-0 gap-3">
          <img src={iconTimerWhite} alt="Icon Timer" className="w-14 h-14 mx-auto" />
          <div className="flex flex-row justify-center items-center gap-2">
            <p className="font-gaming text-[#FCF8EF] text-7xl">{timeLeft.minutes}</p>
            <p className="font-gaming text-[#FCF8EF] text-6xl">:</p>
            <p className="font-gaming text-[#FCF8EF] text-7xl">{timeLeft.seconds}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 justify-center items-start">
          <p className="font-bebas text-[#FCF8EF] text-6xl text-nowrap tracking-wider font-thin">TIME LIMIT FOR YOUR PHOTO SESSION IS</p>
          <p className="font-bebas text-[#FCF8EF] text-6xl text-nowrap tracking-wide">{timeLeft.minutes}:{timeLeft.seconds} MINUTES</p>
          <p className="font-bebas text-[#FCF8EF] text-6xl text-nowrap tracking-wider">PLEASE DON’T EXCEED YOUR TIME LIMIT</p>
        </div>

        {/* <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-6 h-6 mt-0.5 accent-retro-amber cursor-pointer"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
          />
          <span className="font-body text-retro-cream/80 text-sm text-left leading-relaxed">
            Saya setuju foto ini dapat digunakan untuk keperluan promosi Retroppies.
          </span>
        </label> */}
      </motion.div>

      <motion.button
        className="touch-target w-96 bg-[#E9C140] text-retro-brown font-gaming font-semibold text-3xl rounded-full py-8 disabled:opacity-40"
        onClick={handleStart}
      >
        START PHOTO
      </motion.button>

      <CameraErrorModal isOpen={cameraError.hasError} errorText={cameraError.message} btnFunction={handleStart} />
    </motion.div>
  )
}

interface CameraErrorModalProps {
  isOpen: boolean
  errorText: string,
  btnFunction: () => void
}


function CameraErrorModal({ isOpen, errorText, btnFunction }: CameraErrorModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { }}
        >
          <motion.div
            className="bg-white rounded-xl border-4 border-[#F7CC40] shadow-2xl overflow-hidden w-[600px]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#F7CC40] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#2C2C2C] text-2xl">CAMERA ERROR</h2>
              <img src={logoWindowControl} alt="Window-Control" className="select-none pointer-events-none h-auto" />
            </div>

            {/* Content */}
            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-4">
              <p className="font-gaming text-[#2C2C2C] text-xl text-center">
                {errorText}
              </p>

              {/* Buttons */}
              <div className="flex gap-4 justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={btnFunction}
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