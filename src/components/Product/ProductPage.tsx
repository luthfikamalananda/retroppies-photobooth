import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { getProducts, type Product } from '@/services/productService'
import { useUIStore } from '@/store/uiStore'
import { btnChoose, logoBack, logoChooseProduct } from '@/assets'
import { useAuthStore } from '@/store/authStore'

export function ProductPage() {
  const { goNext, goBack } = useSessionStore()
  const { productBundle, setProductBundle } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const setBg = useUIStore((s) => s.setBackgroundVariant)
  const { user } = useAuthStore()

  useEffect(() => {
    setBg('image')
    return () => setBg('video') // restore saat halaman ini ditinggalkan
  }, [])

  useEffect(() => {
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
      .finally(() => setLoading(false))
  }, [])

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-6 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >

      <div className='flex flex-row w-full justify-between items-center'>
        <motion.img
          src={logoBack}
          alt="How To Use"
          whileTap={{ scale: 0.95 }}
          onClick={goBack}
          className="touch-target w-36 h-max select-none cursor-pointer"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          draggable={false}
        />

        <motion.img
          src={logoChooseProduct}
          alt="How To Use"
          className="w-96 h-28 select-none pointer-events-none"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          draggable={false}
        />

        <motion.img
          src={logoBack}
          alt="How To Use"
          onClick={goBack}
          className="w-36 h-max select-none pointer-events-none cursor-pointer invisible"
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          draggable={false}
        />
      </div>


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
    <motion.div className={`w-48 p-4 h-full flex flex-col items-center hover:border-retro-amber transition-all justify-between gap-2`}
    // whileHover={{ scale: 1.05 }}
    >
      <img src={product.productPhoto} alt={product.productName} className="w-full h-32 object-cover rounded-lg" />
      <div className="flex flex-col items-center gap-1">
        <p className="font-bebas text-[#B23E3E] text-2xl line-clamp-2 text-center text-nowrap">{product.productName}</p>
        <p className="font-bebas text-[#B23E3E] text-3xl text-center">Rp {product.productPrice.toLocaleString('id-ID')}</p>
      </div>
      <motion.img
        src={btnChoose}
        alt="Choose"
        className={`w-full scale-150  mt-2 transition-all object-cover cursor-pointer hover:*:scale-160 hover:scale-[1.6]`}
        onClick={onSelect}
      />
    </motion.div>
  )
}
