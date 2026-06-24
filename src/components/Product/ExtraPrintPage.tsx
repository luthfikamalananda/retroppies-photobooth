import { useEffect, useRef, useState, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { getProducts, type Product } from '@/services/productService'
import { useUIStore } from '@/store/uiStore'
import { btnDecrement, btnIncrement, btnNextBlack, btnSkipBlack, logoBack, logoExtraPrint, logoWindowControl } from '@/assets'
import { useAuthStore } from '@/store/authStore'
import { timerBeforePayment } from '@/const/timers'

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

const gridVariants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.3, staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface TotalPrintModalProps {
  isOpen: boolean
  totalPrint: number
  onClose: () => void
  onContinue: () => void
}

function TotalPrintModal({ isOpen, totalPrint, onClose, onContinue }: TotalPrintModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
              <h2 className="font-gaming text-[#2C2C2C] text-3xl">TOTAL PRINT OUT</h2>
              <img src={logoWindowControl} alt="" className="select-none pointer-events-none h-auto" />
            </div>
            <div className="bg-[#FCF8EF] px-8 py-8 flex flex-col gap-6">
              <p className="font-gaming text-[#2C2C2C] text-2xl py-2 text-center">
                You will get {totalPrint} print out{totalPrint > 1 ? 's' : ''}.
              </p>
              <div className="flex gap-4 justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="flex-1 bg-[#BA371E] hover:bg-[#9A2C15] text-white font-gaming text-xl py-5 px-6 rounded-lg border-2 border-[#7A1E0A] transition-colors"
                >
                  No, Thanks!
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onContinue}
                  className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white font-gaming text-xl py-5 px-6 rounded-lg border-2 border-[#2E7D32] transition-colors"
                >
                  Yes, Sure!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

const PrintCard = memo(function PrintCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: (type: 'decrement' | 'increment') => void
}) {
  const { productPrint } = useCartStore()
  // Hitung hanya item yang cocok dengan produk ini
  const count = productPrint?.filter(p => p.id === product.id).length ?? 0

  return (
    <motion.div
      variants={cardVariants}
      style={{ willChange: 'opacity' }}
      className="w-96 p-4 h-max flex flex-col items-center hover:border-retro-amber transition-all justify-between gap-2"
    >
      <img
        src={product.productPhoto}
        alt={product.productName}
        loading="eager"
        decoding="async"
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="flex flex-col items-center gap-2 pt-4">
        <p className="font-bebas text-[#B23E3E] text-5xl line-clamp-2 text-center text-nowrap">
          {product.productName}
        </p>
        <p className="font-bebas text-[#B23E3E] text-4xl text-center">
          Rp {product.productPrice.toLocaleString('id-ID')}
        </p>
      </div>
      <div className="gap-6 grid grid-flow-col justify-evenly items-center pt-2">
        <motion.img
          src={btnDecrement}
          alt="Kurangi"
          className={`w-16 object-cover cursor-pointer transition-all ${count <= 0 ? 'grayscale' : ''}`}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => onSelect('decrement')}
        />
        <p className="font-bebas text-[#B23E3E] text-3xl text-center w-8">{count}</p>
        <motion.img
          src={btnIncrement}
          alt="Tambah"
          className="w-16 object-cover cursor-pointer"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => onSelect('increment')}
        />
      </div>
    </motion.div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ExtraPrintPage() {
  const { goNext, goBack, goTo, setTransaction } = useSessionStore()
  const { productBundle, productPrint, setProductPrint } = useCartStore()
  const { user } = useAuthStore()
  const setBg = useUIStore((s) => s.setBackgroundVariant)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState({ isOpen: false, totalPrint: 1 })

  const initialized = useRef(false)

  useEffect(() => {
    setTransaction(null)
    setBg('image-white')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (productBundle === null) {
      goTo(3)
      return
    }
    if (!user) {
      setError('User tidak ditemukan. Silakan login ulang.')
      setLoading(false)
      return
    }

    getProducts({ tenantId: user.tenantId, keyword: '', page: 1, limit: 999 })
      .then((res) => {
        const prints: Product[] = res.result.products?.filter(
          (p: Product) => p.productType === 'print'
        ) ?? []

        if (prints.length === 0) {
          setError('Produk print tidak tersedia. Hubungi admin.')
        } else {
          setProducts(prints)
        }
      })
      .catch((e: unknown) => {
        console.error(e)
        setError('Gagal memuat produk. Coba lagi.')
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (product: Product, type: 'increment' | 'decrement') => {
    const current = productPrint ? [...productPrint] : []
    if (type === 'increment') {
      setProductPrint([...current, product])
    } else {
      const idx = current.findIndex(p => p.id === product.id)
      if (idx !== -1) {
        current.splice(idx, 1)
        setProductPrint(current)
      }
    }
  }

  const handleFooterClick = () => {
    setModal({ isOpen: true, totalPrint: productPrint.length + 1 })
  }


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
            src={logoBack}
            alt="Back"
            variants={fadeIn}
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-48 h-max cursor-pointer flex-shrink-0"
            draggable={false}
          />
          <motion.img
            src={logoExtraPrint}
            alt="Extra Print"
            variants={fadeIn}
            className="w-[650px] h-[200px] select-none pointer-events-none"
            draggable={false}
          />
          <div className="w-48 flex-shrink-0" aria-hidden />
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 flex items-center justify-center w-full">
          {loading && (
            <p className="font-body text-retro-cream/60 text-xl">Memuat...</p>
          )}
          {error && (
            <div className="text-center">
              <p className="font-body text-red-400 text-lg">{error}</p>
              <button
                className="mt-4 touch-target px-8 py-3 bg-retro-amber text-retro-brown font-body rounded-full"
                onClick={() => window.location.reload()}
              >
                Coba Lagi
              </button>
            </div>
          )}
          {!loading && !error && (
            <motion.div
              className="grid grid-flow-col gap-12 flex-1 px-12 justify-evenly items-center"
              variants={gridVariants}
              initial="hidden"
              animate="visible"
            >
              {products.map((p) => (
                <PrintCard
                  key={p.id}
                  product={p}
                  onSelect={(type) => handleSelect(p, type)}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="flex-0 flex items-center justify-end w-full">
          <motion.img
            key={productPrint.length > 0 ? 'next' : 'skip'}
            src={productPrint.length > 0 ? btnNextBlack : btnSkipBlack}
            alt="Next"
            variants={fadeIn}
            whileTap={{ scale: 0.95 }}
            onClick={handleFooterClick}
            className="w-48 h-max cursor-pointer flex-shrink-0"
            draggable={false}
          />
        </div>
      </motion.div>

      {/* Modal di luar motion.div page agar tidak kena animasi exit */}
      <TotalPrintModal
        isOpen={modal.isOpen}
        totalPrint={modal.totalPrint}
        onClose={() => setModal({ isOpen: false, totalPrint: 1 })}
        onContinue={goNext}
      />
    </>
  )
}