import { useEffect, useRef, useState, memo } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { getProducts, type Product } from '@/services/productService'
import { useUIStore } from '@/store/uiStore'
import { btnDecrement, btnIncrement, btnNextBlack, btnSkipBlack, logoAddOns, logoBack } from '@/assets'
import { useAuthStore } from '@/store/authStore'

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

// ─── Card ─────────────────────────────────────────────────────────────────────

const AddOnCard = memo(function AddOnCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: (type: 'decrement' | 'increment') => void
}) {
  const { productAddOns } = useCartStore()
  // Hitung hanya qty produk ini — bukan total semua addon
  const count = productAddOns?.filter(p => p.id === product.id).length ?? 0

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
      <div className="gap-4 grid grid-flow-col justify-evenly items-center pt-2">
        <motion.img
          src={btnDecrement}
          alt="Kurangi"
          className={`w-16 object-cover cursor-pointer transition-all ${count <= 0 ? 'grayscale' : ''}`}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => onSelect('decrement')}
        />
        {/* Lebar fixed agar tidak geser saat angka berubah */}
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

export function AddOnsPage() {
  const { goNext, goBack, setTransaction } = useSessionStore()
  const { productAddOns, setProductAddOns } = useCartStore()
  const { user } = useAuthStore()
  const setBg = useUIStore((s) => s.setBackgroundVariant)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // useRef — tidak reset tiap render, fix bug isInitialized lama
  const initialized = useRef(false)

  useEffect(() => {
    setTransaction(null)
    setBg('image-white')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (!user) {
      setError('User tidak ditemukan. Silakan login ulang.')
      setLoading(false)
      return
    }

    getProducts({ tenantId: user.tenantId, keyword: '', page: 1, limit: 999 })
      .then((res) => {
        const addons: Product[] = res.result.products?.filter(
          (p: Product) => p.productType === 'addon'
        ) ?? []

        if (addons.length === 0) {
          // Tidak ada addon → langsung lanjut, tidak perlu tampil halaman ini
          goNext()
        } else {
          setProducts(addons)
        }
      })
      .catch((e: unknown) => {
        console.error(e)
        setError('Gagal memuat produk. Coba lagi.')
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (product: Product, type: 'increment' | 'decrement') => {
    const current = productAddOns ? [...productAddOns] : []
    if (type === 'increment') {
      setProductAddOns([...current, product])
    } else {
      const idx = current.findIndex(p => p.id === product.id)
      if (idx !== -1) {
        current.splice(idx, 1)
        setProductAddOns(current)
      }
    }
  }

  return (
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
          src={logoAddOns}
          alt="Add-Ons"
          variants={fadeIn}
          className="w-[650px] h-[200px] select-none pointer-events-none"
          draggable={false}
        />
        {/* Spacer agar title tetap center tanpa invisible element beranimas */}
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
              <AddOnCard
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
          key={productAddOns.length > 0 ? 'next' : 'skip'}
          src={productAddOns.length > 0 ? btnNextBlack : btnSkipBlack}
          alt="Next"
          variants={fadeIn}
          whileTap={{ scale: 0.95 }}
          onClick={goNext}
          className="w-48 h-max cursor-pointer flex-shrink-0"
          draggable={false}
        />
      </div>
    </motion.div>
  )
}