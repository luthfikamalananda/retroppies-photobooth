import { btnBackGold, logoWindowControl } from '@/assets'
import {
  createTransactionTunai,
  createTransactionv2,
  getTransactionStatus,
} from '@/services/paymentService'
import { useCartStore } from '@/store/cartStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { extractErrorMessage } from '@/utils/errorHandling'
import { formatCurrency } from '@/utils/formatCurrency'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminLoginModal } from '../Auth/AdminLoginPage'
import { createTransactionTunai as _createTunai } from '@/services/paymentService'

// ─── Animation Variants ───────────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

// ─── VoucherLimitModal ────────────────────────────────────────────────────────

interface VoucherLimitModalProps {
  isOpen: boolean
  errorText: string
  onContinueWithoutVoucher: () => void
  onBackToVoucher: () => void
}

function VoucherLimitModal({
  isOpen,
  errorText,
  onContinueWithoutVoucher,
  onBackToVoucher,
}: VoucherLimitModalProps) {
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
            className="bg-white rounded-xl border-4 border-[#F7CC40] shadow-2xl overflow-hidden w-[650px]"
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#F7CC40] px-5 py-4 flex items-center justify-between">
              <h2 className="font-gaming text-[#2C2C2C] text-3xl">VOUCHER LIMIT</h2>
              <img src={logoWindowControl} alt="" className="select-none pointer-events-none h-auto" />
            </div>
            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-6">
              <p className="font-gaming text-[#2C2C2C] text-2xl py-2 text-center">{errorText}</p>
              <div className="flex gap-4 justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToVoucher}
                  className="flex-1 bg-[#BA371E] hover:bg-[#9A2C15] text-white font-gaming text-xl py-5 px-6 rounded-lg border-2 border-[#7A1E0A] transition-colors"
                >
                  BACK TO VOUCHER
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onContinueWithoutVoucher}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-gaming text-xl py-5 px-6 rounded-lg border-2 border-[#2E7D32] transition-colors"
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

// ─── PaymentTimer ─────────────────────────────────────────────────────────────

function PaymentTimer({ expiredAt }: { expiredAt: string }) {
  const { goTo } = useSessionStore()

  // Hitung sisa ms dari expiredAt — lazy init agar tidak hitung ulang tiap render
  const calcTimeLeft = useCallback(() => {
    const diff = new Date(expiredAt).getTime() - Date.now()
    if (diff <= 0) return null
    return {
      hours: String(Math.floor(diff / 3_600_000)).padStart(2, '0'),
      minutes: String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, '0'),
      seconds: String(Math.floor((diff % 60_000) / 1_000)).padStart(2, '0'),
    }
  }, [expiredAt])

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft)
  const isExpired = timeLeft === null

  useEffect(() => {
    if (isNaN(new Date(expiredAt).getTime())) {
      console.error('Invalid expiredAt format:', expiredAt)
      setTimeLeft(null)
      return
    }

    const id = setInterval(() => {
      const t = calcTimeLeft()
      setTimeLeft(t)
      if (!t) clearInterval(id)
    }, 1_000)

    return () => clearInterval(id)
  }, [expiredAt, calcTimeLeft])

  // Redirect 1 detik setelah expired — debounce dengan timeout
  useEffect(() => {
    if (!isExpired) return
    const id = setTimeout(() => location.reload(), 1_000)
    return () => clearTimeout(id)
  }, [isExpired, goTo])

  const digits = timeLeft ?? { hours: '00', minutes: '00', seconds: '00' }

  return (
    <motion.div
      className={`w-full flex flex-row items-center justify-between px-5 py-3 rounded-xl border-2 ${isExpired ? 'border-red-500 bg-red-500/10' : 'border-[#575757] bg-[#F8F8F8]'
        }`}
      // Blink hanya saat expired — tidak jalan terus setiap render
      animate={isExpired ? { opacity: [1, 0.65, 1] } : { opacity: 1 }}
      transition={isExpired ? { duration: 0.6, repeat: Infinity } : { duration: 0 }}
    >
      <h2 className="font-bebas text-[#090C0E] text-3xl tracking-[0.05em]">
        SELESAIKAN PEMBAYARAN SEBELUM
      </h2>

      <div className="flex items-center gap-2">
        {(['hours', 'minutes', 'seconds'] as const).map((unit, i) => (
          <div key={unit} className="flex items-center gap-2">
            {i > 0 && (
              <span className="font-bebas text-[#090C0E] text-lg">:</span>
            )}
            <div className="bg-[#090C0E] px-2 py-2 rounded-lg border-2">
              <span className="font-gaming text-white text-lg tracking-wider">
                {digits[unit]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── QR Content area ──────────────────────────────────────────────────────────

function QRContent({
  loading,
  error,
  qrContent,
  finalAmount,
}: {
  loading: boolean
  error: string | null
  qrContent?: string
  finalAmount?: number
}) {
  if (loading) {
    return (
      <p className="font-gaming text-retro-cream/60 text-xl pb-8">Membuat QR...</p>
    )
  }
  if (error) {
    return (
      <p className="font-gaming text-[#BA371E] text-xl uppercase pb-8 px-4">{error}</p>
    )
  }
  if (qrContent) {
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <p className="font-gaming text-[#2C2C2C] text-5xl">RETROPPIES</p>
        <div className="p-4 rounded-2xl w-[50%] h-[50%]">
          {/* QRCodeSVG tidak trigger layout paint — aman */}
          <QRCodeSVG value={qrContent} width="100%" height="100%" level="H" />
        </div>
        <div className="bg-[#F7CC40] flex flex-row justify-center items-center mt-1 py-3 w-max px-6 rounded-lg border-2 border-black">
          <p className="font-gaming text-[#2C2C2C] text-2xl">
            {formatCurrency(finalAmount ?? 0)}
          </p>
        </div>
      </div>
    )
  }
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PaymentPage() {
  const { goTo, goBack, transaction, setTransaction, setTransactionStatus } = useSessionStore()
  const { productBundle, productPrint, productAddOns, voucher, setVoucher } = useCartStore()
  const setBg = useUIStore((s) => s.setBackgroundVariant)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVoucherLimit, setShowVoucherLimit] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)

  const initialized = useRef(false)
  const abortCtrlRef = useRef<AbortController | null>(null)
  // Ref untuk voucher agar initTransaction tidak jadi stale closure
  const voucherRef = useRef(voucher)

  useEffect(() => {
    voucherRef.current = voucher
  }, [voucher])

  useEffect(() => {
    setBg('image-black')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling ──────────────────────────────────────────────────────────

  const startPolling = useCallback((invoiceNumber: string, signal: AbortSignal) => {
    const poll = async () => {
      if (signal.aborted) return
      try {
        const status = await getTransactionStatus({ invoiceNumber })
        if (signal.aborted) return

        if (status.result.status === 'SUCCESS') {
          setTransactionStatus('SUCCESS')
          goTo(8)
        } else if (status.result.status === 'EXPIRED' || status.result.status === 'FAILED') {
          setTransactionStatus('FAILED')
          goTo(8)
        } else {
          // PENDING — poll lagi
          setTimeout(poll, 2_000)
        }
      } catch {
        if (!signal.aborted) setTimeout(poll, 2_000)
      }
    }
    poll()
  }, [goTo, setTransactionStatus])

  // ── Init / retry transaksi ────────────────────────────────────────────

  const initTransaction = useCallback(() => {
    // Batalkan polling sebelumnya
    abortCtrlRef.current?.abort()
    abortCtrlRef.current = new AbortController()
    const { signal } = abortCtrlRef.current

    if (!productBundle && !transaction) {
      goTo(3)
      return
    }

    // Transaksi sudah ada (mis. setelah refresh state) — lanjut polling
    if (transaction) {
      startPolling(transaction.invoiceNumber, signal)
      return
    }

    if (!productBundle) return

    setLoading(true)
    setError(null)

    createTransactionv2({
      items: [productBundle, ...productPrint, ...productAddOns],
      voucherCode: voucherRef.current ?? '',
      totalPrint: productPrint.length + 1,
    })
      .then((res) => {
        if (signal.aborted) return
        if (res.success) {
          setTransaction(res.result)
          startPolling(res.result.invoiceNumber, signal)
        } else {
          setError('Gagal membuat transaksi. Coba lagi.')
        }
      })
      .catch((e) => {
        if (signal.aborted) return
        if (axios.isAxiosError(e) && e.response?.data?.statusCode === '203') {
          setShowVoucherLimit(true)
          setError(extractErrorMessage(e))
          return
        }
        setError(extractErrorMessage(e) || 'Gagal membuat transaksi. Coba lagi.')
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false)
      })
  }, [productBundle, productPrint, productAddOns, transaction, goTo, setTransaction, startPolling])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initTransaction()
    return () => { abortCtrlRef.current?.abort() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      <motion.div
        className="relative z-10 flex flex-col w-full h-full py-12 px-14 gap-10"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* ── HEADER ── */}
        <div className="w-full flex justify-between items-center flex-shrink-0">
          <motion.img
            src={btnBackGold}
            alt="Back"
            variants={fadeIn}
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-48 h-max cursor-pointer flex-shrink-0"
            draggable={false}
          />
        </div>

        {/* ── CONTENT ── */}
        <div className="relative z-10 flex flex-1 flex-row items-center justify-center w-full h-full pb-10 px-16">
          <div className="flex flex-col items-center justify-center w-[53%] h-max">
            {/* Card header */}
            <div className="flex flex-row justify-between items-center bg-[#F7CC40] px-6 py-5 w-full rounded-t-xl">
              <h1 className="font-gaming text-[#2C2C2C] text-2xl">PAY WITH QRIS</h1>
              <img src={logoWindowControl} alt="" className="select-none pointer-events-none" />
            </div>
            {/* Card body */}
            <div className="flex flex-col items-center justify-start w-full bg-[#FCF8EF] pt-8 border-8 border-t-0 border-[#F7CC40] rounded-b-xl h-full">
              {transaction?.expiredAt && (
                <div className="w-full flex flex-col px-6">
                  <PaymentTimer expiredAt={transaction.expiredAt} />
                </div>
              )}
              <div className="flex flex-col items-center justify-center py-8 gap-6 w-full h-full">
                <QRContent
                  loading={loading}
                  error={error}
                  qrContent={transaction?.qrContent}
                  finalAmount={transaction?.finalAmount}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="flex-0 flex items-center justify-end w-full">
          <motion.button
            variants={fadeIn}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdminModal(true)}
            className="font-gaming w-64 h-max cursor-pointer flex gap-4 justify-center flex-shrink-0 bg-[#E9C140] items-center rounded-full px-2 py-5 font-bold text-xl tracking-widest"
            draggable={false}
          >
            ASK TO HELP ?
          </motion.button>
        </div>
      </motion.div>

      {/* ── Modals — di luar motion.div agar tidak kena animasi exit ── */}

      <VoucherLimitModal
        isOpen={showVoucherLimit}
        errorText={error || 'Voucher sudah mencapai limit penggunaan!'}
        onContinueWithoutVoucher={() => {
          setVoucher(null)
          voucherRef.current = null  // sync ref langsung
          setShowVoucherLimit(false)
          // Reset initialized agar initTransaction bisa jalan ulang
          initialized.current = false
          initTransaction()
        }}
        onBackToVoucher={() => {
          setShowVoucherLimit(false)
          goTo(6)
        }}
      />

      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={async () => {
          if (!productBundle) {
            alert('Error: No product bundle')
            return
          }
          try {
            const response = await createTransactionTunai({
              items: [productBundle, ...productPrint, ...productAddOns],
              voucherCode: voucherRef.current ?? '',
              totalPrint: productPrint.length + 1,
            })
            if (response.success) {
              setTransaction(response.result)
              goTo(8)
            }
          } catch (e) {
            console.error('Cash transaction error:', e)
          }
        }}
      />
    </>
  )
}