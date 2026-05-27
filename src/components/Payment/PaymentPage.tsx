import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { createTransaction, getTransactionStatus, type TransactionResponse } from '@/services/paymentService'

export function PaymentPage() {
  const { goTo, goBack } = useSessionStore()
  const setTxId = useSessionStore(s => s.setTransactionId)
  const cart = useCartStore()

  const [tx, setTx] = useState<TransactionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Guard against React StrictMode's double-invocation: if this cleanup runs
    // before createTransaction resolves, the stale call is discarded safely.
    let cancelled = false

    const items = cart.selectedPackage
      ? [{ productId: cart.selectedPackage.productId, qty: 1 }]
      : []
    const addOnItems = cart.addOns.map(a => ({ productId: a.productId, qty: a.qty }))

    createTransaction({
      items: [...items, ...addOnItems],
      extraPrintQty: cart.extraPrintQty,
      voucherCode: cart.voucher?.code,
      totalAmount: cart.total,
    })
      .then(res => {
        if (cancelled) return
        setTx(res)
        setTxId(res.transactionId)
        startPolling(res.transactionId)
      })
      .catch(() => { if (!cancelled) setError('Gagal membuat transaksi. Coba lagi.') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [])

  const startPolling = (id: string) => {
    // Capture the interval ID in a closure so each interval always clears itself,
    // regardless of what pollRef.current holds at the time.
    const intervalId = setInterval(async () => {
      try {
        const status = await getTransactionStatus(id)
        if (status.status === 'PAID') {
          clearInterval(intervalId)
          pollRef.current = null
          goTo(8)
        } else if (status.status === 'EXPIRED' || status.status === 'FAILED') {
          clearInterval(intervalId)
          pollRef.current = null
          setError('Pembayaran gagal atau kadaluarsa.')
        }
      } catch { /* keep polling */ }
    }, 3000)
    pollRef.current = intervalId
  }

  return (
    <motion.div
      className="relative z-10 flex items-center justify-between w-full h-full py-10 px-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col gap-6 flex-1">
        <h2 className="font-display text-retro-cream text-5xl">Scan QRIS</h2>
        <p className="font-body text-retro-cream/60">Scan QR code untuk membayar</p>
        {tx && (
          <div className="font-body text-retro-cream/50 text-sm">
            ID Transaksi: {tx.transactionId}
          </div>
        )}
        <div className="font-body text-retro-cream mt-4">
          <span className="text-retro-amber text-3xl font-display">Rp {cart.total.toLocaleString('id-ID')}</span>
        </div>
        <button
          className="touch-target w-40 border border-retro-amber/50 text-retro-cream font-body px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
          onClick={goBack}
        >
          ← Kembali
        </button>
      </div>

      <div className="flex items-center justify-center">
        {loading && <p className="font-body text-retro-cream/60 text-xl">Membuat QR...</p>}
        {error && <p className="font-body text-red-400">{error}</p>}
        {tx?.qrisImageUrl && !error && (
          <img src={tx.qrisImageUrl} alt="QRIS" className="w-64 h-64 rounded-2xl border-4 border-retro-amber/40" />
        )}
      </div>
    </motion.div>
  )
}
