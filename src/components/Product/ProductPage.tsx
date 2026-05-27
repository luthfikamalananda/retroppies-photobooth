import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { getProducts, type Product } from '@/services/productService'

export function ProductPage() {
  const { goNext, goBack } = useSessionStore()
  const { selectedPackage, setPackage } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProducts('bundle')
      .then(setProducts)
      .catch(() => setError('Gagal memuat produk. Coba lagi.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-10 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <h2 className="font-display text-retro-cream text-5xl">Pilih Paket</h2>

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
        <button className="touch-target px-10 py-4 border border-retro-amber/50 text-retro-cream font-body rounded-full" onClick={goBack}>← Kembali</button>
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
      <p className="font-body text-retro-cream font-semibold text-lg">{product.name}</p>
      {product.description && <p className="font-body text-retro-cream/60 text-sm">{product.description}</p>}
      <p className="font-display text-retro-amber text-2xl">Rp {product.price.toLocaleString('id-ID')}</p>
    </button>
  )
}
