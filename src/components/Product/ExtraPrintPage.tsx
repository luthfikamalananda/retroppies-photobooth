import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'

export function ExtraPrintPage() {
  const { goNext, goBack } = useSessionStore()
  const { extraPrintQty, setExtraPrintQty, subtotal } = useCartStore()

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-10 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <h2 className="font-display text-retro-cream text-5xl">Extra Print</h2>
      <p className="font-body text-retro-cream/60">Tambah cetakan ekstra dari foto kamu</p>

      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-8">
          <button
            className="touch-target w-16 h-16 rounded-full border-2 border-retro-amber text-retro-cream text-3xl flex items-center justify-center hover:bg-retro-amber/20 disabled:opacity-30"
            onClick={() => setExtraPrintQty(Math.max(0, extraPrintQty - 1))}
            disabled={extraPrintQty === 0}
          >
            −
          </button>
          <span className="font-display text-retro-cream text-7xl w-24 text-center">{extraPrintQty}</span>
          <button
            className="touch-target w-16 h-16 rounded-full border-2 border-retro-amber text-retro-cream text-3xl flex items-center justify-center hover:bg-retro-amber/20"
            onClick={() => setExtraPrintQty(extraPrintQty + 1)}
          >
            +
          </button>
        </div>
        <p className="font-body text-retro-cream/50 text-sm">Subtotal: Rp {subtotal.toLocaleString('id-ID')}</p>
      </div>

      <div className="flex gap-4 justify-center">
        <button className="touch-target px-10 py-4 border border-retro-amber/50 text-retro-cream font-body rounded-full" onClick={goBack}>← Kembali</button>
        <button className="touch-target px-10 py-4 bg-retro-amber text-retro-brown font-body font-semibold rounded-full" onClick={goNext}>Lanjut →</button>
      </div>
    </motion.div>
  )
}
