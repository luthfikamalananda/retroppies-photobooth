import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useLayoutStore } from '@/store/layoutStore'
import { usePhotoStore } from '@/store/photoStore'

export function DragDropPage() {
  const { goNext, goBack } = useSessionStore()
  const { selectedTemplate, slotMap, mapSlot } = useLayoutStore()
  const { captures } = usePhotoStore()

  const slotCount = selectedTemplate?.slotCount ?? 4
  const allSlotsFilled = Object.keys(slotMap).length >= slotCount

  // Simple tap-to-assign for now (Fabric.js drag-drop to be implemented in Week 2)
  const handleAssign = (slotIndex: number, dataUrl: string) => {
    mapSlot(slotIndex, dataUrl)
  }

  return (
    <motion.div
      className="relative z-10 flex items-center justify-between w-full h-full py-8 px-12 gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Template Slots */}
      <div className="flex-1 flex flex-col gap-4 items-center">
        <h2 className="font-display text-retro-cream text-3xl">Atur Foto</h2>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: slotCount }, (_, i) => (
            <div key={i} className="w-36 h-44 bg-black/40 border-2 border-dashed border-retro-amber/40 rounded-lg overflow-hidden flex items-center justify-center">
              {slotMap[i]
                ? <img src={slotMap[i]} alt={`Slot ${i + 1}`} className="w-full h-full object-cover" />
                : <span className="font-body text-retro-cream/30 text-sm">Slot {i + 1}</span>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Photo Tray */}
      <div className="flex flex-col gap-4 w-48">
        <p className="font-body text-retro-cream/60 text-sm text-center">Klik foto lalu pilih slot</p>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-96">
          {captures.map((photo) => (
            <div key={photo.slotIndex} className="relative">
              <img
                src={photo.dataUrl}
                alt={`Foto ${photo.slotIndex + 1}`}
                className="w-full aspect-video object-cover rounded-lg border border-retro-amber/20 cursor-pointer hover:border-retro-amber"
              />
              <div className="flex gap-1 mt-1 flex-wrap">
                {Array.from({ length: slotCount }, (_, i) => (
                  <button
                    key={i}
                    className="flex-1 text-xs font-body py-0.5 bg-retro-amber/20 hover:bg-retro-amber/40 text-retro-cream rounded"
                    onClick={() => handleAssign(i, photo.dataUrl)}
                  >
                    →{i + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <button className="touch-target flex-1 border border-retro-amber/40 text-retro-cream font-body text-sm rounded-full py-2" onClick={goBack}>←</button>
          <button
            className="touch-target flex-1 bg-retro-amber text-retro-brown font-body font-semibold text-sm rounded-full py-2 disabled:opacity-40"
            disabled={!allSlotsFilled}
            onClick={goNext}
          >
            Lanjut
          </button>
        </div>
      </div>
    </motion.div>
  )
}
