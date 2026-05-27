import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

export function GlobalModalHost() {
  const { modalOpen, modalContent, closeModal } = useUIStore()

  return (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div
            className="relative bg-retro-brown border-2 border-retro-amber rounded-xl p-6 max-w-lg w-full mx-4"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {modalContent}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
