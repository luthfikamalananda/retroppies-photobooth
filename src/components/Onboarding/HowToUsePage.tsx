import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'

const STEPS = [
  { icon: '💳', title: 'Pilih Paket', desc: 'Pilih paket foto & add-on yang kamu inginkan.' },
  { icon: '🔳', title: 'Bayar QRIS', desc: 'Scan QR code untuk pembayaran instan.' },
  { icon: '📸', title: 'Foto Bareng', desc: 'Ambil 4 foto dengan gaya favoritmu.' },
  { icon: '🖨️', title: 'Print & Simpan', desc: 'Print hasil foto dan scan QR untuk unduhan.' },
]

export function HowToUsePage() {
  const { goNext, goBack } = useSessionStore()

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-10 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      {/* Skip button */}
      <div className="w-full flex justify-end">
        <button
          className="touch-target font-body text-retro-cream/60 text-lg hover:text-retro-cream transition-colors px-4 py-2"
          onClick={goNext}
        >
          Lewati →
        </button>
      </div>

      <h2 className="font-display text-retro-cream text-5xl text-center">Cara Pakai</h2>

      <div className="grid grid-cols-4 gap-6 w-full">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            className="bg-black/50 border border-retro-amber/30 rounded-xl p-6 flex flex-col items-center gap-3 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <span className="text-5xl">{step.icon}</span>
            <p className="font-body text-retro-amber font-semibold">{step.title}</p>
            <p className="font-body text-retro-cream/70 text-sm leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-4 w-full justify-center">
        <button
          className="touch-target px-10 py-4 border border-retro-amber/50 text-retro-cream font-body rounded-full hover:bg-white/10 transition-colors"
          onClick={goBack}
        >
          ← Kembali
        </button>
        <button
          className="touch-target px-10 py-4 bg-retro-amber text-retro-brown font-body font-semibold rounded-full"
          onClick={goNext}
        >
          Lanjut →
        </button>
      </div>
    </motion.div>
  )
}
