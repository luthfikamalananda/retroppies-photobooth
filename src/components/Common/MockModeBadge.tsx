import { USE_MOCK } from '@/mocks/mockFlag'

/**
 * Shows a bright badge in the corner when VITE_USE_MOCK=true.
 * Invisible in production (when USE_MOCK is false).
 */
export function MockModeBadge() {
  if (!USE_MOCK) return null

  return (
    <div className="fixed bottom-3 left-3 z-[9999] flex items-center gap-2 bg-yellow-400 text-yellow-900 font-body text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg pointer-events-none select-none">
      <span className="w-2 h-2 rounded-full bg-yellow-700 animate-pulse" />
      MOCK MODE
    </div>
  )
}
