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
import { useKeyboardInput } from '../Common/FloatingKeyboard'
import { timerBeforePayment } from '@/const/timers'
import { useKeyboardStore } from '@/store/keyboardStore'

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function VoucherSuccess({ voucher }: { voucher: VoucherResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="w-full bg-[#1F8A68] border-2 border-l-[#8CECA7] px-6 py-4 rounded-lg flex justify-between items-center"
    >
      <div className="flex items-center gap-5">
        <img src={iconVoucher} alt="" className="w-18 h-18" />
        <div className="flex flex-col gap-1">
          <p className="font-bebas text-green-400 font-semibold tracking-wide text-2xl">
            Voucher Successfully Applied 🎉
          </p>
          <p className="font-bebas text-[#FFF9F3] text-xl tracking-wide font-thin">
            Congratulations, You received a discount of{' '}
            <span className="font-extrabold text-xl text-[#FFF9F3]">
              {formatCurrency(voucher.discount)}
            </span>{' '}
            for this transaction.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function VoucherError({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="w-full bg-[#BA371E] border-2 border-l-[#E1BEB7] px-6 py-4 rounded-lg flex items-center gap-5"
    >
      <img src={iconVoucher} alt="" className="w-6 h-6 flex-shrink-0" />
      <div className="flex flex-col gap-1">
        <p className="font-bebas text-red-400 font-semibold tracking-wide text-2xl">
          Voucher Unavailable!
        </p>
        <p className="font-bebas text-[#FFF9F3] text-xl tracking-wide font-thin">{message}</p>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function VoucherPage() {
  const { goNext, goTo, setTransaction } = useSessionStore()
  const { user } = useAuthStore()
  const {
    productAddOns, productBundle, productPrint, setVoucher,
  } = useCartStore()
  const setBg = useUIStore((s) => s.setBackgroundVariant)

  const [resultVoucher, setResultVoucher] = useState<VoucherResult | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialized = useRef(false)
  const { close } = useKeyboardStore()
  const kbCode = useKeyboardInput(setCode)

  useEffect(() => {
    setTransaction(null)
    setBg('image-white')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Guard: hanya jalankan sekali — fix bug useEffect tanpa deps array
    if (initialized.current) return
    initialized.current = true
    setVoucher(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived: total harga ──────────────────────────────────────────────
  // Dihitung di render time, tidak perlu state tersendiri
  const total =
    (productBundle?.productPrice ?? 0) +
    productPrint.reduce((sum, p) => sum + p.productPrice, 0) +
    productAddOns.reduce((sum, p) => sum + p.productPrice, 0)

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleApply = async () => {
    if (!code.trim() || !user) {
      setError('Masukkan kode voucher terlebih dahulu.')
      setVoucher(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await validateVoucher({
        code: code.trim(),
        amount: total,
        tenantId: user.tenantId,
      })

      // Selalu simpan result agar komponen feedback bisa render
      setResultVoucher(result.result)

      if (result.success) {
        setVoucher(code.trim())
        setError(null)
      } else {
        setVoucher(null)
        setError(result.message || 'Voucher tidak valid atau sudah kadaluarsa.')
      }
    } catch (e) {
      setError(extractErrorMessage(e))
      setVoucher(null)
      setResultVoucher(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (val: string) => {
    setCode(val)
    // Reset state voucher setiap kali kode diubah
    if (error) setError(null)
    if (resultVoucher) { setResultVoucher(null); setVoucher(null) }
  }

  // Apakah voucher sudah berhasil divalidasi (tidak ada error)
  const isVoucherValid = !!resultVoucher && !error

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-12 px-14"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* ── HEADER ── */}
      <div className="w-full flex justify-between items-center flex-shrink-0">
        <motion.img
          src={logoBack}
          alt="Back"
          variants={fadeIn}
          whileTap={{ scale: 0.95 }}
          onClick={() => goTo(3)}
          className="w-48 h-max cursor-pointer flex-shrink-0"
          draggable={false}
        />
        <motion.img
          src={logoVoucher}
          alt="Voucher"
          variants={fadeIn}
          className="w-[650px] h-[200px] select-none pointer-events-none"
          draggable={false}
        />
        <div className="w-48 flex-shrink-0" aria-hidden />
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex items-start justify-center w-1/2 flex-col gap-4">
        <p className="font-bebas text-[#B23E3E] text-5xl text-center">VOUCHER CODE</p>

        <div className="flex gap-3 w-full items-start">
          <div className="flex flex-col w-full gap-6">
            <input
              {...kbCode}
              className="h-14 touch-target flex-1 bg-[#F8F8F8] border-2 border-[#575757] rounded-full px-6 py-4 text-[#2C2C2C] text-3xl font-bebas outline-none focus:border-retro-amber uppercase"
              type="text"
              placeholder="Enter Exclusive Voucher Code Here ..."
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
            />

            {/* Feedback area — mutual exclusive */}
            {isVoucherValid && resultVoucher && (
              <VoucherSuccess voucher={resultVoucher} />
            )}
            {error && code && (
              <VoucherError message={error} />
            )}
          </div>

          {/* Apply button — opacity dim saat loading atau code kosong */}
          <motion.img
            src={btnApply}
            alt="APPLY"
            variants={fadeIn}
            whileTap={loading || !code.trim() ? {} : { scale: 0.95 }}
            onClick={() => {
              close()
              if (loading || !code.trim()) {
                return undefined
              } else {
                handleApply()
              }
            }}
            className="touch-target w-48 h-max select-none cursor-pointer transition-opacity"
            style={{ opacity: loading || !code.trim() ? 0.45 : 1 }}
            draggable={false}
          />
        </div>

        {/* Error tanpa kode (mis. user belum isi apa-apa lalu klik Apply) */}
        {error && !code && (
          <p className="font-bebas text-[#BA371E] text-2xl tracking-wider">{error}</p>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="flex-0 flex items-center justify-end w-full">
        <motion.img
          key={isVoucherValid ? 'next' : 'skip'}
          src={isVoucherValid ? btnNextBlack : btnSkipBlack}
          alt={isVoucherValid ? 'NEXT' : 'SKIP'}
          variants={fadeIn}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          className="touch-target w-48 h-max select-none cursor-pointer"
          draggable={false}
        />
      </div>
    </motion.div>
  )
}