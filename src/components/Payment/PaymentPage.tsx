import { btnBackGold, logoWindowControl } from '@/assets'
import { createTransactionv2, getTransactionStatus, TransactionResult } from '@/services/paymentService'
import { useCartStore } from '@/store/cartStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { extractErrorMessage } from '@/utils/errorHandling'
import { formatCurrency } from '@/utils/formatCurrency'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'

interface VoucherLimitModalProps {
  isOpen: boolean
  errorText: string
  onContinueWithoutVoucher: () => void
  onBackToVoucher: () => void
}

function VoucherLimitModal({ isOpen, errorText, onContinueWithoutVoucher, onBackToVoucher }: VoucherLimitModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onBackToVoucher}
        >
          <motion.div
            className="bg-white rounded-xl border-4 border-[#F7CC40] shadow-2xl overflow-hidden w-[600px]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#F7CC40] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#2C2C2C] text-2xl">VOUCHER LIMIT</h2>
              <img src={logoWindowControl} alt="Window-Control" className="select-none pointer-events-none h-auto" />
            </div>

            {/* Content */}
            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-6">
              <p className="font-gaming text-[#2C2C2C] text-xl text-center">
                {errorText}
              </p>

              {/* Buttons */}
              <div className="flex gap-4 justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToVoucher}
                  className="flex-1 bg-[#BA371E] hover:bg-[#9A2C15] text-white font-gaming text-lg py-4 px-6 rounded-lg border-2 border-[#7A1E0A] transition-colors"
                >
                  BACK TO VOUCHER
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onContinueWithoutVoucher}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-gaming text-lg py-4 px-6 rounded-lg border-2 border-[#2E7D32] transition-colors"
                >
                  CONTINUE
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PaymentTimer({ expiredAt }: { expiredAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '00',
    minutes: '00',
    seconds: '00',
  })
  const [isExpired, setIsExpired] = useState(false)
  const { goTo } = useSessionStore()

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const expiry = new Date(expiredAt)

      if (isNaN(expiry.getTime())) {
        console.error('Invalid expiredAt format:', expiredAt)
        setIsExpired(true)
        clearInterval(interval)
        return
      }

      const diff = expiry.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' })
        setIsExpired(true)
        clearInterval(interval)
      } else {
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setTimeLeft({
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiredAt])

  useEffect(() => {
    if (isExpired) {
      const timeout = setTimeout(() => {
        // goTo(8) // atau ke halaman failed payment
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [isExpired, goTo])

  return (
    <motion.div
      className={`w-full flex flex-row items-center justify-between px-5 py-3 rounded-xl border-2 ${isExpired
        ? 'border-red-500 bg-red-500/10'
        : 'border-[#575757] bg-[#F8F8F8]'
        }`}
      animate={{ opacity: isExpired ? [1, 0.7, 1] : 1 }}
      transition={{ duration: isExpired ? 0.6 : 0, repeat: isExpired ? Infinity : 0 }}
    >
      {/* Label Text */}
      <h2 className="font-bebas text-[#090C0E] text-3xl tracking-[0.05em]">
        SELESAIKAN PEMBAYARAN SEBELUM
      </h2>

      {/* Time Display */}
      <div className="flex items-center gap-2">
        {/* Hours */}
        <div className="bg-[#090C0E] px-2 py-2 rounded-lg border-2">
          <span className="font-gaming text-[#FFFFFF] text-lg tracking-wider">
            {timeLeft.hours}
          </span>
        </div>

        {/* Separator */}
        <span className="font-bebas text-[#090C0E] text-lg tracking-wider">:</span>

        {/* Minutes */}
        <div className="bg-[#090C0E] px-2 py-2 rounded-lg border-2">
          <span className="font-gaming text-[#FFFFFF] text-lg tracking-wider">
            {timeLeft.minutes}
          </span>
        </div>

        {/* Separator */}
        <span className="font-bebas text-[#090C0E] text-lg tracking-wider">:</span>

        {/* Seconds */}
        <div className="bg-[#090C0E] px-2 py-2 rounded-lg border-2">
          <span className="font-gaming text-[#FFFFFF] text-lg tracking-wider">
            {timeLeft.seconds}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function PaymentPage() {
  const { goTo, goBack, transaction, setTransaction, setTransactionStatus } = useSessionStore()

  const { productBundle, productPrint, productAddOns, voucher, setVoucher } = useCartStore() // nanti akan dipakai untuk kirim detail transaksi ke backend

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVoucherLimitModal, setShowVoucherLimitModal] = useState(false)

  const setBg = useUIStore((s) => s.setBackgroundVariant)

  useEffect(() => {
    setBg('image-black')
    return () => setBg('video-black') // restore saat halaman ini ditinggalkan
  }, [])

  const initializedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Karena react membaca kode initTransaction bersifat stale closure, jadi ketika function dibuat langsung membaca vakeu voucher pada saat itu juga.
  // Sehingga jika voucher di set menjadi null, valuenya tidak berubah (menggunakan value saat function dibuat)
  const voucherRef = useRef(voucher)

  // Sync ref setiap kali voucher berubah
  useEffect(() => {
    voucherRef.current = voucher
  }, [voucher])

  const initTransaction = () => {
    // Abort polling sebelumnya jika ada
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    const startPolling = async (id: string) => {
      if (signal.aborted) return
      try {
        const status = await getTransactionStatus({ invoiceNumber: id })
        if (signal.aborted) return

        if (status.result.status === 'SUCCESS') {
          setTransactionStatus('SUCCESS')
          goTo(8)
        } else if (status.result.status === 'PENDING') {
          setTimeout(() => startPolling(id), 2000)
        } else if (status.result.status === 'EXPIRED' || status.result.status === 'FAILED') {
          setTransactionStatus('FAILED')
          goTo(8)
        }
      } catch {
        if (!signal.aborted) {
          setTimeout(() => startPolling(id), 2000)
        }
      }
    }

    if (!productBundle && !transaction) {
      goTo(3)
      return
    }

    if (transaction !== null) {
      startPolling(transaction.invoiceNumber)
      return
    }

    if (productBundle) {
      setLoading(true)
      setError(null) // Reset error sebelum coba lagi
      createTransactionv2({
        items: [...[productBundle], ...productPrint, ...productAddOns],
        voucherCode: voucherRef.current ?? '',
        totalPrint: productPrint.length + 1,
      })
        .then(res => {
          if (signal.aborted) return
          if (res.success) {
            setTransaction(res.result)
            startPolling(res.result.invoiceNumber)
          } else {
            setError('Gagal membuat transaksi. Coba lagi.')
          }
        })
        .catch((e) => {
          if (signal.aborted) return
          if (axios.isAxiosError(e) && e.response?.data?.statusCode === '203') {
            setShowVoucherLimitModal(true)
            setError(extractErrorMessage(e))
            return
          }
          setError(extractErrorMessage(e) || 'Gagal membuat transaksi. Coba lagi.')
        })
        .finally(() => {
          if (!signal.aborted) setLoading(false)
        })
    }
  }

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    initTransaction()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <motion.div
        className="relative z-10 flex flex-col w-full h-full py-12 px-14 gap-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* HEADER */}
        <div className="w-full flex justify-between items-center flex-shrink-0">
          <motion.img
            src={btnBackGold}
            alt="Back"
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-48 h-max cursor-pointer flex gap-4 justify-end flex-shrink-0"
            initial={{ rotate: -20, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            draggable={false}
          />
        </div>

        {/* CONTENT */}
        <motion.div
          className="relative z-10 flex flex-1 flex-row items-center justify-center w-full h-full pb-10 px-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center justify-center w-[53%] h-max">
            {/* Header */}
            <div className="flex flex-row justify-between items-center bg-[#F7CC40] px-6 py-5 w-full rounded-t-xl" >
              <h1 className="font-gaming text-[#2C2C2C] text-2xl">PAY WITH QRIS</h1>
              <img src={logoWindowControl} alt="Window-Control" className="select-none pointer-events-none" />
            </div>
            {/* Content */}
            <div className="flex flex-col items-center justify-start w-full bg-[#FCF8EF] pt-8 border-8 border-t-0 border-[#F7CC40] rounded-b-xl h-full">
              {/* Timer */}
              <div className="w-full flex flex-col px-6">
                {transaction?.expiredAt && (
                  <PaymentTimer expiredAt={transaction.expiredAt} />
                )}
              </div>
              <div className="flex flex-col items-center justify-center py-8 gap-6 w-full h-full">
                {loading && <p className="font-gaming text-retro-cream/60 text-xl pb-8">Membuat QR...</p>}
                {error && <p className="font-gaming text-[#BA371E] text-xl uppercase pb-8 px-4">{error}</p>}
                {(transaction?.qrContent && !error) && (
                  <div className="flex flex-col items-center gap-1 w-full">
                    <p className="font-gaming text-[#2C2C2C] text-5xl">RETROPPIES</p>
                    <div className="p-4 rounded-2xl w-[50%] h-[50%]">
                      <QRCodeSVG
                        value={transaction.qrContent}
                        width={"100%"}
                        height={"100%"}
                        level="H"
                      />
                    </div>
                    <div className="bg-[#F7CC40] flex flex-row justify-center items-center mt-1 py-3 w-max px-6 rounded-lg border-2 border-[#000000]">
                      <p className="font-gaming text-[#2C2C2C] text-2xl">{formatCurrency(transaction.finalAmount)}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </motion.div>

        {/* button skip to succes page */}
        <div className="flex flex-row items-center gap-8 justify-center w-full">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setTransactionStatus('SUCCESS')
              goTo(8)
            }}
            className="bg-green-500 hover:bg-green-600 text-white font-gaming text-lg py-3 px-5 rounded-lg z-50"
          >
            Skip to Success
          </motion.button>
          {/* button skip to failed page */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setTransactionStatus('FAILED')
              goTo(8)
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-gaming text-lg py-3 px-5 rounded-lg z-50"
          >
            Skip to Failed
          </motion.button>
        </div>
      </motion.div >



      {/* Voucher Limit Modal */}
      <VoucherLimitModal
        errorText={error || 'Voucher sudah mencapai limit penggunaan!'}
        isOpen={showVoucherLimitModal}
        onContinueWithoutVoucher={() => {
          setVoucher(null)          // Update state (async)
          voucherRef.current = null // Update ref langsung (sync) ← Tambah ini
          setShowVoucherLimitModal(false)
          initTransaction()
        }}
        onBackToVoucher={() => {
          setShowVoucherLimitModal(false)
          goTo(6) // Kembali ke halaman voucher input
        }}
      />
    </>
  )
}
