import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { logoWindowControl } from '@/assets'

// ─── Modal Konfirmasi Tutup Aplikasi ─────────────────────────────────────────
// Desain mengikuti AskPermissionModal (DragDropPage) & SelectPaperModal:
// kartu putih, border kuning #F7CC40, title bar kuning + logo window control,
// body #FCF8EF, dua tombol font-gaming (hijau = batal, merah = tutup).

interface CloseAppModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Jika di-set, modal otomatis batal (onCancel) setelah sekian milidetik. */
  autoDismissMs?: number
}

export function CloseAppModal({ isOpen, onConfirm, onCancel, autoDismissMs }: CloseAppModalProps) {
  // Auto-dismiss — dipakai di landing page agar prompt tidak menggantung di
  // depan customer bila admin memicu gesture lalu pergi.
  useEffect(() => {
    if (!isOpen || !autoDismissMs) return
    const t = setTimeout(onCancel, autoDismissMs)
    return () => clearTimeout(t)
  }, [isOpen, autoDismissMs, onCancel])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="bg-white rounded-xl border-4 border-[#F7CC40] shadow-2xl overflow-hidden w-[650px]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#F7CC40] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#2C2C2C] text-3xl">CLOSE APP</h2>
              <img src={logoWindowControl} alt="Window-Control" className="select-none pointer-events-none h-auto" />
            </div>

            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-6">
              <p className="font-gaming text-[#2C2C2C] text-2xl py-2 text-center">
                Are you sure you want to close the app?
              </p>

              <div className="flex gap-4 justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-gaming text-xl py-5 px-6 rounded-lg border-2 border-[#2E7D32] transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onConfirm}
                  className="flex-1 bg-[#BA371E] hover:bg-[#9A2C15] text-white font-gaming text-xl py-5 px-6 rounded-lg border-2 border-[#7A1E0A] transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Helper pemanggil IPC — aman dipanggil di web (tanpa electron) → no-op.
export function closeApp() {
  const api = (window as any).electronAPI
  if (api?.closeApp) api.closeApp()
}
