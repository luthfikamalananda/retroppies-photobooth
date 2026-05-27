import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { validateVoucher } from '@/services/voucherService'

export function VoucherPage() {
  const { goNext, goBack } = useSessionStore()
  const { subtotal, voucher, setVoucher, total } = useCartStore()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await validateVoucher({ code: code.trim(), subtotal })
      setVoucher(result)
    } catch {
      setError('Voucher tidak valid atau sudah kadaluarsa.')
      setVoucher(null)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCode('')
    setVoucher(null)
    setError(null)
  }

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-10 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <h2 className="font-display text-retro-cream text-5xl">Voucher</h2>

      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        <div className="flex gap-3 w-full">
          <input
            className="touch-target flex-1 bg-black/40 border border-retro-amber/40 rounded-lg px-4 py-3 text-retro-cream font-body text-base outline-none focus:border-retro-amber uppercase"
            type="text"
            placeholder="Masukkan kode voucher"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
          />
          <button
            className="touch-target px-6 py-3 bg-retro-amber text-retro-brown font-body font-semibold rounded-lg disabled:opacity-50"
            onClick={handleApply}
            disabled={loading || !code.trim()}
          >
            {loading ? '...' : 'Pakai'}
          </button>
        </div>

        {error && <p className="font-body text-red-400 text-sm">{error}</p>}

        {voucher && (
          <div className="w-full bg-green-900/40 border border-green-500/40 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-body text-green-400 font-semibold">{voucher.code}</p>
              <p className="font-body text-retro-cream/60 text-sm">Diskon Rp {voucher.discountAmount.toLocaleString('id-ID')}</p>
            </div>
            <button className="touch-target text-retro-cream/40 hover:text-red-400 text-lg" onClick={handleReset}>✕</button>
          </div>
        )}

        <div className="w-full border-t border-retro-amber/20 pt-4 flex justify-between font-body text-retro-cream">
          <span>Total</span>
          <span className="font-semibold text-retro-amber text-xl">Rp {total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button className="touch-target px-10 py-4 border border-retro-amber/50 text-retro-cream font-body rounded-full" onClick={goBack}>← Kembali</button>
        <button className="touch-target px-10 py-4 bg-retro-amber text-retro-brown font-body font-semibold rounded-full" onClick={goNext}>Lanjut ke Pembayaran →</button>
      </div>
    </motion.div>
  )
}
