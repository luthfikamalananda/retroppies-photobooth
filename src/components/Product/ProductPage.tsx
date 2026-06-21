import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { getProducts, type Product } from '@/services/productService'
import { useUIStore } from '@/store/uiStore'
import { btnChoose, logoBack, logoChooseProduct } from '@/assets'
import { useAuthStore } from '@/store/authStore'

export function ProductPage() {
  const { goNext, goBack, setTransaction } = useSessionStore()
  const { setProductBundle } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const setBg = useUIStore((s) => s.setBackgroundVariant)
  const { user } = useAuthStore()

  let isInitialized = false; // flag untuk memastikan init hanya sekali

  useEffect(() => {
    setTransaction(null) // reset transaksi saat masuk halaman ini
    setBg('image-white')
    return () => setBg('video-black') // restore saat halaman ini ditinggalkan
  }, [])

  useEffect(() => {
    if (isInitialized) return
    isInitialized = true
    if (!user) {
      setError('User tidak ditemukan. Silakan login ulang.')
      setLoading(false)
      return
    }
    getProducts({ tenantId: user.tenantId, keyword: '', page: 1, limit: 999 })
      .then((res) => {
        if (res.result.products?.length === 0) {
          setError('Produk tidak tersedia. Hubungi admin.')
        } else {
          setProducts(() => res.result.products.filter(p => p.productType === 'bundling'))
        }
      })
      .catch((e) => {
        console.error(e)
        setError('Gagal memuat produk. Coba lagi.')
      })
      .finally(() => { setLoading(false) })

  }, [])

  return (
    <motion.div
      className="relative z-10 flex flex-col w-full h-full py-12 px-14 gap-10"
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
          src={logoChooseProduct}
          alt="Choose Product"
          className="w-[650px] h-[200px] select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />

        <motion.img
          src={logoBack}
          alt="Back"
          onClick={goBack}
          className="w-48 h-max cursor-pointer flex gap-4 justify-end flex-shrink-0 invisible"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          draggable={false}
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex items-center justify-center w-full">
        {loading && <p className="font-body text-retro-cream/60 text-xl">Memuat...</p>}
        {error && (
          <div className="text-center">
            <p className="font-body text-red-400 text-lg">{error}</p>
            <button className="mt-4 touch-target px-8 py-3 bg-retro-amber text-retro-brown font-body rounded-full" onClick={() => window.location.reload()}>Coba Lagi</button>
          </div>
        )}
        {!loading && !error && (
          // make the height of the product card the same as, and make the image inside the card cover the whole card with object-cover
          <div className="grid grid-flow-col gap-12 flex-1 px-12 justify-evenly items-center">
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
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex-0 flex items-center justify-end w-full invisible">
        <motion.img
          src={logoBack}
          alt="Back"
          onClick={goNext}
          className="w-48 h-max cursor-pointer flex gap-4 justify-end flex-shrink-0"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          draggable={false}
        />
      </div>
    </motion.div>
  )
}

function ProductCard({
  product,
  onSelect
}: {
  product: Product;
  onSelect: () => void
}) {
  return (
    <motion.div className={`w-96 p-4 h-max flex flex-col items-center hover:border-retro-amber transition-all justify-between `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <img src={product.productPhoto} alt={product.productName} className="w-full h-full object-contain rounded-lg" />
      <div className="flex flex-col items-center gap-2 pt-4">
        <p className="font-bebas text-[#B23E3E] text-5xl line-clamp-2 text-center text-nowrap">{product.productName}</p>
        <p className="font-bebas text-[#B23E3E] text-4xl text-center">Rp {product.productPrice.toLocaleString('id-ID')}</p>
      </div>
      <motion.img
        src={btnChoose}
        alt="Choose"
        className={`w-full scale-125  mt-2 transition-all object-cover cursor-pointer hover:*:scale-13 hover:scale-[1.3]`}
        onClick={onSelect}
      />
    </motion.div>
  )
}
