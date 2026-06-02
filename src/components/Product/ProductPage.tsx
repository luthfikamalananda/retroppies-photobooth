import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { getProducts, type Product } from '@/services/productService'
import { useUIStore } from '@/store/uiStore'
import { logoBack, logoChooseProduct } from '@/assets'

export function ProductPage() {
  const { goNext, goBack } = useSessionStore()
  const { selectedPackage, setPackage } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const setBg = useUIStore((s) => s.setBackgroundVariant)

  useEffect(() => {
    setBg('image')
    return () => setBg('video') // restore saat halaman ini ditinggalkan
  }, [])

  useEffect(() => {
    getProducts('bundle')
      .then(setProducts)
      .catch(() => setError('Gagal memuat produk. Coba lagi.'))
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
          <div className="flex gap-6 flex-wrap justify-center w-full">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                selected={selectedPackage?.productId === p.id}
                onSelect={() => setPackage({ productId: p.id, name: p.name, price: p.price, qty: 1 })}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          className="touch-target px-10 py-4 bg-retro-amber text-retro-brown font-body font-semibold rounded-full disabled:opacity-40"
          onClick={goNext}
          disabled={!selectedPackage}
        >
          Lanjut →
        </button>
      </div>
    </motion.div>
  )
}

function ProductCard({ product, selected, onSelect }: { product: Product; selected: boolean; onSelect: () => void }) {
  return (
    <button
      className={`touch-target w-52 bg-black/50 border-2 rounded-2xl p-6 flex flex-col gap-3 text-center transition-all ${selected ? 'border-retro-amber scale-105' : 'border-retro-amber/20 hover:border-retro-amber/50'}`}
      onClick={onSelect}
    >
      <p className="font-body text-retro-cream text-lg">{product.name}</p>
      {product.description && <p className="font-body text-retro-cream/60 text-sm">{product.description}</p>}
      <p className="font-display text-retro-amber text-2xl">Rp {product.price.toLocaleString('id-ID')}</p>
    </button>
  )
}
