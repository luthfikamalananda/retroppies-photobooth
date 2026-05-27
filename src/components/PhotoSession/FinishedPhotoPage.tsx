import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useLayoutStore } from '@/store/layoutStore'
import { useCartStore } from '@/store/cartStore'
import { finalizeTransaction } from '@/services/finalizeService'
import { sendInvoice } from '@/services/emailService'
import { usePhotoStore } from '@/store/photoStore'

export function FinishedPhotoPage() {
  const transactionId = useSessionStore(s => s.transactionId)
  const resetSession = useSessionStore(s => s.resetSession)
  const { selectedTemplate, selectedFilter, slotMap } = useLayoutStore()
  const { captures } = usePhotoStore()

  const [email, setEmail] = useState('')
  const [printing, setPrinting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewPhoto = Object.values(slotMap)[0]

  const handleFinish = async () => {
    if (!transactionId || !selectedTemplate) return
    setPrinting(true)
    setError(null)
    try {
      // In production, pass the real canvas blob here
      // For now, using a placeholder empty blob
      await finalizeTransaction(transactionId, {
        finalImage: new Blob(),
        rawPhotos: captures.map(c => new Blob([c.dataUrl])),
        templateId: selectedTemplate.id,
        filter: selectedFilter,
      })

      if (email.trim()) {
        await sendInvoice({ transactionId, email: email.trim() })
      }

      setDone(true)
      setTimeout(() => resetSession(), 4000)
    } catch {
      setError('Gagal memproses. Silakan coba lagi.')
    } finally {
      setPrinting(false)
    }
  }

  if (done) {
    return (
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="text-8xl">🎉</span>
        <h2 className="font-display text-retro-cream text-5xl">Terima Kasih!</h2>
        <p className="font-body text-retro-cream/60">Foto kamu sudah diproses. Sampai jumpa!</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="relative z-10 flex items-center justify-between w-full h-full py-8 px-16 gap-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Preview */}
      <div className="flex-1 flex items-center justify-center">
        {previewPhoto && (
          <img
            src={previewPhoto}
            alt="Final"
            className="max-h-[70vh] rounded-2xl border-4 border-retro-amber/40 shadow-2xl"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-6 w-72">
        <h2 className="font-display text-retro-cream text-4xl">Foto Selesai!</h2>

        <input
          className="touch-target w-full bg-black/40 border border-retro-amber/40 rounded-lg px-4 py-3 text-retro-cream font-body text-base outline-none focus:border-retro-amber"
          type="email"
          placeholder="Email (opsional)"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {error && <p className="font-body text-red-400 text-sm">{error}</p>}

        <button
          className="touch-target w-full bg-retro-amber text-retro-brown font-body font-semibold text-xl rounded-full py-5 disabled:opacity-50"
          disabled={printing}
          onClick={handleFinish}
        >
          {printing ? 'Memproses...' : '🖨️ Print & Selesai'}
        </button>
      </div>
    </motion.div>
  )
}
