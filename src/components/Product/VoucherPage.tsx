import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { validateVoucher, VoucherResult } from '@/services/voucherService'
import { useUIStore } from '@/store/uiStore'
import { btnApply, btnNextBlack, btnSkipBlack, iconVoucher, logoBack, logoVoucher } from '@/assets'
import { useAuthStore } from '@/store/authStore'
import { extractErrorMessage } from '@/utils/errorHandling'
import { formatCurrency } from '@/utils/formatCurrency'

export function VoucherPage() {
  const { goNext, goBack, setTransaction } = useSessionStore()
  const { user } = useAuthStore()
  const { productAddOns, productBundle, productPrint, setVoucher } = useCartStore()
  const [resultVoucher, setResultVoucher] = useState<VoucherResult | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializedRef = useRef(false) // ← Harus useRef, bukan variable biasa

  const setBg = useUIStore((s) => s.setBackgroundVariant)

  useEffect(() => {
    setTransaction(null) // reset transaksi saat masuk halaman ini
    setBg('image-white')
    return () => setBg('video-black') // restore saat halaman ini ditinggalkan
  }, [])


  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    setVoucher(null) // reset voucher saat masuk halaman ini
  })

  const handleApply = async () => {
    // Calculate Price
    let total = 0
    if (productBundle) total += productBundle.productPrice
    if (productPrint.length > 0) total += productPrint.reduce((a, b) => a + b.productPrice, 0)
    if (productAddOns.length > 0) total += productAddOns.reduce((a, b) => a + b.productPrice, 0)

    if (!code.trim() || !user) {
      setError('Masukkan kode voucher terlebih dahulu.')
      setVoucher(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const request = {
        code: code.trim(),
        amount: total, // dummy, backend akan hitung sendiri
        tenantId: user.tenantId, // dummy, backend akan ambil dari session
      }
      const result = await validateVoucher(request)
      if (result.success) {
        setVoucher(code.trim())
        setError(null)
        setResultVoucher(result.result)
      } else {
        setResultVoucher(result.result) // tetap set result untuk menampilkan pesan sukses walau voucher tidak valid
        setVoucher(null)
        setError(result.message || 'Voucher tidak valid atau sudah kadaluarsa.')
      }
      // setVoucher(result)
    } catch (e) {
      setError(extractErrorMessage(e));
      setVoucher(null)
      setResultVoucher(null)
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
      {/* HEADER */}
      <div className="w-full flex justify-between items-center flex-shrink-0">
        <motion.img
          src={logoBack}
          alt="Back"
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="w-48 h-max cursor-pointer flex gap-4 justify-end flex-shrink-0"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />

        <motion.img
          src={logoVoucher}
          alt="Voucher"
          className="w-[650px] h-[200px] select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />

        <motion.img
          src={logoBack}
          alt="How To Use"
          onClick={goBack}
          className="w-48 h-max select-none pointer-events-none cursor-pointer invisible"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex items-start justify-center w-1/2 flex-col gap-4">
        <p className="font-bebas text-[#B23E3E] text-5xl text-center">VOUCHER CODE</p>
        <div className="flex gap-3 w-full items-start">
          <div className="flex flex-col w-full gap-2">
            <input
              className="h-14 touch-target flex-1 bg-[#F8F8F8] border-2 border-[#575757] rounded-full px-6 py-4 text-[#2C2C2C] text-3xl font-bebas  outline-none focus:border-retro-amber uppercase"
              type="text"
              placeholder="Enter Exclusive Voucher Code Here ..."
              value={code}
              onChange={e => {
                setCode(e.target.value.toUpperCase())
                setError(null)
              }}
            />

            {(resultVoucher && !error) && (
              <div className="w-full bg-[#1F8A68]  border-2 border-l-[#8CECA7] px-6 py-4 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <img src={iconVoucher} alt="Voucher Icon" className="w-6 h-6" />
                  <div className="flex flex-col gap-1">
                    <p className="font-bebas text-green-400 font-semibold tracking-wide">Voucher Successfully Applied  🎉</p>
                    <p className="font-bebas text-[#FFF9F3] text-sm tracking-wide font-thin">Congratulations, You received a discount of <span className="font-extrabold text-sm text-[#FFF9F3]">{formatCurrency(resultVoucher.discount)}</span> for this transaction.</p>
                  </div>
                </div>
              </div>
            )}
            {(error && code) && (
              <div className="w-full bg-[#BA371E] border-2 border-l-[#E1BEB7] px-6 py-4 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <img src={iconVoucher} alt="Voucher Icon" className="w-6 h-6" />
                  <div className="flex flex-col gap-1">
                    <p className="font-bebas text-red-400 font-semibold tracking-wide">Voucher Unavailable!</p>
                    <p className="font-bebas text-[#FFF9F3] text-sm tracking-wide font-thin">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <motion.img
            src={btnApply}
            alt={'APPLY'}
            whileTap={{ scale: 0.95 }}
            onClick={handleApply}
            className="touch-target w-48 h-max select-none cursor-pointer transition-all"
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            draggable={false}
            aria-disabled={loading || !code.trim()}
          />
        </div>

        {(error && !code) && <p className="font-bebas text-[#BA371E] text-xl tracking-wider">{error}</p>}
      </div>

      {/* FOOTER */}
      <div className="flex-0 flex items-center justify-end w-full">
        <motion.img
          key={resultVoucher ? 'next' : 'skip'}  // ← ini trigger-nya
          src={resultVoucher ? btnNextBlack : btnSkipBlack}
          alt={resultVoucher ? 'NEXT' : 'SKIP'}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          className="touch-target w-48 h-max select-none cursor-pointer transition-all"
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          draggable={false}
        />
      </div>
    </motion.div >
  )
}
