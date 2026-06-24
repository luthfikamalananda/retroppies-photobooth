import { useEffect, useRef, useState, memo } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { getProducts, type Product } from '@/services/productService'
import { useUIStore } from '@/store/uiStore'
import { btnChoose, logoBack, logoChooseProduct } from '@/assets'
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

// Parent grid orchestrates stagger — lebih efisien dari delay manual
const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
}

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = memo(function ProductCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: () => void
}) {
  return (
    <motion.div
      variants={cardVariants}
      style={{ willChange: 'opacity' }}
      className="w-96 p-4 h-max flex flex-col items-center hover:border-retro-amber transition-all justify-between"
    >
      <img
        src={product.productPhoto}
        alt={product.productName}
        loading="eager"
        decoding="async"
        className="w-full h-full object-contain rounded-lg"
      />
      <div className="flex flex-col items-center gap-2 pt-4">
        <p className="font-bebas text-[#B23E3E] text-5xl line-clamp-2 text-center text-nowrap">
          {product.productName}
        </p>
        <p className="font-bebas text-[#B23E3E] text-4xl text-center">
          Rp {product.productPrice.toLocaleString('id-ID')}
        </p>
      </div>
      <motion.img
        src={btnChoose}
        alt="Choose"
        whileTap={{ scale: 0.95 }}
        onClick={onSelect}
        className="w-full scale-125 mt-2 transition-all object-cover cursor-pointer hover:scale-[1.3]"
      />
    </motion.div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductPage() {
  const { goNext, goBack, setTransaction } = useSessionStore()
  const { setProductBundle } = useCartStore()
  const { user } = useAuthStore()
  const setBg = useUIStore((s) => s.setBackgroundVariant)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // useRef agar flag tidak reset setiap render — fix bug isInitialized
  const initialized = useRef(false)

  useEffect(() => {
    setTransaction(null)
    setBg('image-white')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Guard: strict mode / double-invoke safe
    if (initialized.current) return
    initialized.current = true

    if (!user) {
      setError('User tidak ditemukan. Silakan login ulang.')
      setLoading(false)
      return
    }

    getProducts({ tenantId: user.tenantId, keyword: '', page: 1, limit: 999 })
      .then((res) => {
        const bundling = res.result.products?.filter(
          (p: Product) => p.productType === 'bundling'
        ) ?? []

        if (bundling.length === 0) {
          setError('Produk tidak tersedia. Hubungi admin.')
        } else {
          setProducts(bundling)
        }
      })
      .catch((e: unknown) => {
        console.error(e)
        setError('Gagal memuat produk. Coba lagi.')
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
          src={logoChooseProduct}
          alt="Choose Product"
          variants={fadeIn}
          className="w-[650px] h-[200px] select-none pointer-events-none"
          draggable={false}
        />

        {/* Spacer sama lebar logoBack agar title tetap center */}
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
              <ProductCard
                key={p.id}
                product={p}
                onSelect={() => {
                  setProductBundle(p)
                  goNext()
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Footer dihapus — invisible + animasi = buang resource tanpa manfaat */}
    </motion.div>
  )
}