import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

const TYPE_STYLES = {
  success: 'bg-green-700 border-green-500',
  error: 'bg-red-800 border-red-500',
  info: 'bg-retro-brown border-retro-amber',
}

export function ToastHost() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({
  id,
  message,
  type,
  onRemove,
}: {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  onRemove: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onRemove, 3500)
    return () => clearTimeout(t)
  }, [id, onRemove])

  return (
    <motion.div
      className={`pointer-events-auto px-5 py-3 rounded-lg border font-body text-retro-cream text-sm shadow-lg ${TYPE_STYLES[type]}`}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
    >
      {message}
    </motion.div>
  )
}
