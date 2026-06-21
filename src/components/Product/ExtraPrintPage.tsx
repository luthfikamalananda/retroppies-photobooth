import { btnDecrement, btnIncrement, btnNextBlack, btnSkipBlack, logoBack, logoExtraPrint, logoSkip } from '@/assets'
import { getProducts, type Product } from '@/services/productService'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function ExtraPrintPage() {
  const { goNext, goBack, goTo, setTransaction, setTotalPrint } = useSessionStore()
  const { productBundle, productPrint, setProductPrint } = useCartStore()
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
    if (productBundle === null) {
      goTo(3) // langsung lompat ke ProductPage
      return
    }
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
          setProducts(() => res.result.products.filter(p => p.productType === 'print'))
        }
      })
      .catch((e) => {
        console.error(e)
        setError('Gagal memuat produk. Coba lagi.')
      })
      .finally(() => setLoading(false))
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
          src={logoExtraPrint}
          alt="Extra Print"
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
                onSelect={(type: 'decrement' | 'increment') => {
                  if (type === 'increment') {
                    const tempProductPrint = productPrint ? [...productPrint] : []
                    tempProductPrint.push(p)
                    setProductPrint(tempProductPrint)
                  } else if (type === 'decrement') {
                    if (!productPrint || productPrint.length === 0) return
                    const tempProductPrint = [...productPrint]
                    const index = tempProductPrint.findIndex(prod => prod.id === p.id)
                    if (index !== -1) {
                      tempProductPrint.splice(index, 1)
                      setProductPrint(tempProductPrint)
                    }
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-0 flex items-center justify-end w-full">
        <motion.img
          key={productPrint.length > 0 ? 'next' : 'skip'}  // ← ini trigger-nya
          src={productPrint.length > 0 ? btnNextBlack : btnSkipBlack}
          alt="How To Use"
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (productPrint.length > 0) {
              setTotalPrint(productPrint.length)
            }
            goNext()
          }}
          // className="touch-target w-36 h-max select-none cursor-pointer transition-all"
          className="w-48 h-max cursor-pointer flex gap-4 justify-end flex-shrink-0"
          initial={{ rotate: 0, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
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
  onSelect: (type: 'decrement' | 'increment') => void
}) {
  const { productPrint } = useCartStore()

  return (
    <motion.div className={`w-96 p-4 h-max flex flex-col items-center hover:border-retro-amber transition-all justify-between gap-2`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <img src={product.productPhoto} alt={product.productName} className="w-full h-full object-cover rounded-lg" />
      <div className="flex flex-col items-center gap-2 pt-4">
        <p className="font-bebas text-[#B23E3E] text-5xl line-clamp-2 text-center text-nowrap">{product.productName}</p>
        <p className="font-bebas text-[#B23E3E] text-4xl text-center">Rp {product.productPrice.toLocaleString('id-ID')}</p>
      </div>
      <div className="gap-6 grid grid-flow-col justify-evenly items-center pt-2">
        <motion.img
          src={btnDecrement}
          alt="Choose"
          className={`w-16 transition-all object-cover cursor-pointer ${productPrint?.length <= 0 ? 'grayscale' : ''}`}
          whileTap={{ scale: 2 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => onSelect('decrement')}
        />
        <p className="font-bebas text-[#B23E3E] text-3xl text-center">{productPrint?.length || 0}</p>
        <motion.img
          src={btnIncrement}
          alt="Choose"
          className={`w-16 transition-all object-cover cursor-pointer`}
          whileTap={{ scale: 2 }}
          whileHover={{ scale: 1.1 }}

          onClick={() => onSelect('increment')}
        />
      </div>
    </motion.div>
  )
}
