import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useLayoutStore, type FilterId } from '@/store/layoutStore'

const FILTERS: Array<{ id: FilterId; label: string; cssFilter: string }> = [
  { id: 'original', label: 'Original', cssFilter: 'none' },
  { id: 'vivid', label: 'Vivid', cssFilter: 'saturate(1.4) contrast(1.15)' },
  { id: 'sepia', label: 'Sepia', cssFilter: 'sepia(0.85)' },
  { id: 'grayscale', label: 'Grayscale', cssFilter: 'grayscale(1)' },
  { id: 'warm', label: 'Warm', cssFilter: 'sepia(0.3) saturate(1.3) brightness(1.05)' },
  { id: 'cold', label: 'Cold', cssFilter: 'hue-rotate(180deg) saturate(0.8) brightness(1.05)' },
  { id: 'polaroid', label: 'Polaroid', cssFilter: 'contrast(0.85) brightness(1.1) saturate(0.9)' },
  { id: 'vignette', label: 'Vignette', cssFilter: 'brightness(0.85) contrast(1.1)' },
]

export function FilterPage() {
  const { goNext, goBack } = useSessionStore()
  const { selectedFilter, setFilter, slotMap } = useLayoutStore()

  const previewPhoto = Object.values(slotMap)[0]

  return (
    <motion.div
      className="relative z-10 flex items-center justify-between w-full h-full py-8 px-12 gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Preview */}
      <div className="flex-1 flex flex-col items-center gap-4">
        <h2 className="font-display text-retro-cream text-4xl">Pilih Filter</h2>
        {previewPhoto && (
          <div className="rounded-2xl overflow-hidden border-2 border-retro-amber/30 w-full max-w-sm aspect-square">
            <img
              src={previewPhoto}
              alt="Preview"
              className="w-full h-full object-cover"
              style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.cssFilter }}
            />
          </div>
        )}
      </div>

      {/* Filter Scroller */}
      <div className="flex flex-col gap-6 w-64">
        <div className="flex flex-col gap-3 overflow-y-auto max-h-96">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`touch-target flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selectedFilter === f.id ? 'border-retro-amber bg-retro-amber/10' : 'border-retro-amber/20 hover:border-retro-amber/40'}`}
              onClick={() => setFilter(f.id)}
            >
              {previewPhoto && (
                <img
                  src={previewPhoto}
                  alt={f.label}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  style={{ filter: f.cssFilter }}
                />
              )}
              <span className="font-body text-retro-cream text-sm">{f.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="touch-target flex-1 border border-retro-amber/40 text-retro-cream font-body text-sm rounded-full py-3" onClick={goBack}>←</button>
          <button className="touch-target flex-1 bg-retro-amber text-retro-brown font-body font-semibold text-sm rounded-full py-3" onClick={goNext}>Lanjut</button>
        </div>
      </div>
    </motion.div>
  )
}
