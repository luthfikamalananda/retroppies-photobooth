import { useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { usePhotoStore } from '@/store/photoStore'

const TOTAL_SLOTS = 4

export function TakePhotoPage() {
  const { goNext, goBack } = useSessionStore()
  const { captures, addCapture, retakeSlot, isComplete } = usePhotoStore()
  const webcamRef = useRef<Webcam>(null)

  const nextSlot = Array.from({ length: TOTAL_SLOTS }, (_, i) => i)
    .find(i => !captures.find(c => c.slotIndex === i)) ?? -1

  const capture = useCallback(() => {
    if (nextSlot === -1) return
    const dataUrl = webcamRef.current?.getScreenshot()
    if (dataUrl) {
      addCapture({ slotIndex: nextSlot, dataUrl, capturedAt: Date.now() })
    }
  }, [nextSlot, addCapture])

  return (
    <motion.div
      className="relative z-10 flex items-center justify-between w-full h-full py-8 px-12 gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Webcam Preview */}
      <div className="flex-1 aspect-video relative rounded-2xl overflow-hidden border-2 border-retro-amber/30">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
          mirrored
        />
        {nextSlot !== -1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-body text-retro-cream/80 bg-black/60 px-4 py-2 rounded-full text-sm">
            Foto {nextSlot + 1} dari {TOTAL_SLOTS}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="flex flex-col gap-6 w-52 items-center">
        <h2 className="font-display text-retro-cream text-3xl text-center">Foto</h2>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
            const photo = captures.find(c => c.slotIndex === i)
            return (
              <div key={i} className="relative aspect-square bg-black/40 border border-retro-amber/20 rounded-lg overflow-hidden">
                {photo ? (
                  <>
                    <img src={photo.dataUrl} alt={`Slot ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full text-xs flex items-center justify-center"
                      onClick={() => retakeSlot(i)}
                      title="Retake"
                    >
                      ↺
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-body text-retro-cream/30 text-xs">
                    {i + 1}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Capture button */}
        <button
          className="touch-target w-20 h-20 rounded-full bg-white border-4 border-retro-amber shadow-lg active:scale-95 transition-transform disabled:opacity-30"
          onClick={capture}
          disabled={nextSlot === -1}
        />

        <div className="flex gap-2 w-full">
          <button className="touch-target flex-1 border border-retro-amber/40 text-retro-cream font-body text-sm rounded-full py-2" onClick={goBack}>←</button>
          <button
            className="touch-target flex-1 bg-retro-amber text-retro-brown font-body font-semibold text-sm rounded-full py-2 disabled:opacity-40"
            disabled={!isComplete()}
            onClick={goNext}
          >
            Lanjut
          </button>
        </div>
      </div>
    </motion.div>
  )
}
