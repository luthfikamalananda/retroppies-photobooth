import { useRef, useCallback, useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import { AnimatePresence, motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { usePhotoStore } from '@/store/photoStore'
import { useUIStore } from '@/store/uiStore'
import { btnNextBlack, btnNextWhite, iconNoImage, iconPhoto } from '@/assets'
import { VideoPreviewModal } from './VideoPreviewModal'

const TOTAL_SLOTS = 4
const COUNTDOWN_DURATION = 3

export function TakePhotoPage() {
  const { goNext, goBack } = useSessionStore()
  const { captures, capturesVideo, addCapture, addVideoCapture, retakeSlot, retakeVideoSlot } = usePhotoStore()
  const webcamRef = useRef<Webcam>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const capturedRef = useRef(false) // Flag to prevent multiple captures

  console.log('Current captures:', captures) // Debug log untuk melihat state captures
  console.log('Current videos:', capturesVideo) // Debug log untuk melihat state videos

  const setBg = useUIStore((s) => s.setBackgroundVariant)

  const nextSlot = Array.from({ length: TOTAL_SLOTS }, (_, i) => i)
    .find(i => !captures.find(c => c.slotIndex === i)) ?? -1

  useEffect(() => {
    setBg('image-white')
    return () => setBg('video-black') // restore saat halaman ini ditinggalkan
  }, [])

  // Countdown timer effect with video recording
  useEffect(() => {
    if (countdown === null) return

    // Start recording when countdown starts
    if (countdown === COUNTDOWN_DURATION) {
      // capturedRef.current = false // Reset flag when new countdown starts
      recordedChunksRef.current = []
      try {
        const stream = (webcamRef.current?.video as any)?.srcObject as MediaStream
        if (stream) {
          // Determine supported MIME type
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/webm')
              ? 'video/webm'
              : 'video/mp4'

          mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType,
          })

          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunksRef.current.push(event.data)
            }
          }

          mediaRecorderRef.current.start()
        }
      } catch (error) {
        console.error('Failed to start recording:', error)
      }
    }

    // Capture photo and stop recording when countdown reaches 0
    if (countdown === 0) {
      // Only capture once per countdown cycle
      // if (capturedRef.current) return
      // capturedRef.current = true

      // Stop recording and capture photo
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
          addVideoCapture({ slotIndex: nextSlot, videoBlob, recordedAt: Date.now() })
        }
        mediaRecorderRef.current.stop()
      }

      // Capture photo
      const dataUrl = webcamRef.current?.getScreenshot()
      if (dataUrl) {
        addCapture({ slotIndex: nextSlot, dataUrl, capturedAt: Date.now() })
      }
      setCountdown(null)
      return
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [countdown])

  const capture = useCallback(() => {
    if (nextSlot === -1 || countdown !== null) return
    setCountdown(COUNTDOWN_DURATION)
  }, [nextSlot, countdown])

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-6 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >

      <div className='flex flex-row w-full justify-between items-center'>

        {/* <motion.img
          src={logoBack}
          alt="How To Use"
          onClick={goBack}
          className="w-36 h-max select-none pointer-events-none cursor-pointer invisible"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        /> */}
      </div>

      <div className="flex w-full h-full justify-center items-center gap-12 py-16 px-40">
        {/* Webcam Preview */}
        <div className="flex w-[50%] h-full justify-center items-center">
          <div className="w-full h-full relative rounded-2xl overflow-hidden border-2 border-[#B23E3E]">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              mirrored
            />

            {
              nextSlot !== -1 && countdown === null && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm overflow-hidden">
                  <motion.button
                    className="touch-target w-20 h-20 rounded-full bg-white border-2 border-[#B23E3E] shadow-lg active:scale-95 transition-transform disabled:opacity-30 overflow-hidden flex items-center justify-center"
                    onClick={capture}
                  // disabled={nextSlot === -1}
                  >
                    <img src={iconPhoto} alt="Capture" className="w-12 h-12" />
                  </motion.button>
                </div>
              )
            }

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-full text-sm overflow-hidden">
              <motion.div
                key={`key-${countdown}`}
                // className="text-9xl font-gaming text-retro-amber drop-shadow-lg"
                className="text-9xl font-gaming text-[#FFFFFF] drop-shadow-lg"
                // className="text-9xl font-gaming text-[#B23E3E] drop-shadow-lg"
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {countdown}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-6 w-[50%] h-full justify-center items-center">
          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 gap-8 w-full h-full">
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
              const photo = captures.find(c => c.slotIndex === i)
              return (
                <div key={i} className="relative aspect-square bg-black/40 border-2 border-[#B23E3E] rounded-lg overflow-hidden h-full w-full">
                  {photo ? (
                    <>
                      <img src={photo.dataUrl} alt={`Slot ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        className="absolute left-1/2 -translate-x-1/2 bottom-3 w-9 h-9 bg-[#FFFFFF] text-[#000000] rounded-full text-lg flex items-center justify-center"
                        onClick={() => {
                          retakeSlot(i)
                          retakeVideoSlot(i)
                        }}
                        title="Retake"
                      >
                        ↺
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-body bg-[#F8E6E6]/90">
                      <img src={iconNoImage} alt={`Empty Slot ${i + 1}`} className="w-[70%] h-[70%] " />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </div>

      <div className="flex flex-row w-full justify-end items-center">
        <motion.img
          key={'NEXT'}  // ← ini trigger-nya
          src={captures.length === TOTAL_SLOTS ? btnNextBlack : btnNextWhite}
          alt="How To Use"
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (captures.length === TOTAL_SLOTS) {
              goNext()
            } else {
              // alert('Please take photos for all slots before proceeding.')
            }
          }}
          className="touch-target w-36 h-max select-none cursor-pointer transition-all"
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          draggable={false}
        />
      </div>

      {/* DEV: Video Preview Modal */}
      <VideoPreviewModal />
    </motion.div>
  )
}