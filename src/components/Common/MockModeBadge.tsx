import { USE_MOCK } from '@/mocks/mockFlag'
import { useUIStore } from '@/store/uiStore'

/**
 * Dev panel (visible when VITE_USE_MOCK=true).
 * - Badge MOCK MODE
 * - Tombol toggle background: VIDEO ↔ IMAGE
 */
export function MockModeBadge() {
  const toggleBackground = useUIStore(s => s.toggleBackground)
  const backgroundVariant = useUIStore(s => s.backgroundVariant)

  if (!USE_MOCK) return null

  return (
    <div className="fixed bottom-3 left-3 z-[9999] flex items-center gap-2 select-none">
      {/* MOCK badge */}
      <div className="flex items-center gap-2 bg-yellow-400 text-yellow-900 font-body text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-yellow-700 animate-pulse" />
        MOCK MODE
      </div>

      {/* Background toggle */}
      <button
        onClick={toggleBackground}
        className="flex items-center gap-1.5 bg-black/70 border border-white/20 text-white font-body text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-black/90 transition-colors"
        title="Toggle background: video / image"
      >
        {backgroundVariant === 'video' ? '🎬' : '🖼️'}
        <span className="uppercase tracking-wide">{backgroundVariant}</span>
      </button>
    </div>
  )
}
