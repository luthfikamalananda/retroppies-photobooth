import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useCartStore } from '@/store/cartStore'
import { getProducts, type Product } from '@/services/productService'

export function AddOnsPage() {
  const { goNext, goBack } = useSessionStore()
  const { addOns, addAddOn, removeAddOn } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts('addon').then(setProducts).finally(() => setLoading(false))
  }, [])

  const getQty = (id: string) => addOns.find(a => a.productId === id)?.qty ?? 0

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-between w-full h-full py-10 px-10"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
    >
      <h2 className="font-display text-retro-cream text-5xl">Add Ons</h2>

      <div className="flex-1 flex items-center w-full overflow-x-auto gap-6 py-4">
        {loading && <p className="font-body text-retro-cream/60 text-xl mx-auto">Memuat...</p>}
        {!loading && products.map(p => (
          <div
            key={p.id}
            className="flex-shrink-0 w-44 bg-black/50 border border-retro-amber/20 rounded-2xl p-5 flex flex-col gap-4 items-center text-center"
          >
            <p className="font-body text-retro-cream font-semibold">{p.name}</p>
            <p className="font-display text-retro-amber text-xl">Rp {p.price.toLocaleString('id-ID')}</p>
            <div className="flex items-center gap-3">
              <button className="touch-target w-10 h-10 rounded-full border border-retro-amber/40 text-retro-cream text-lg" onClick={() => removeAddOn(p.id)}>−</button>
              <span className="font-body text-retro-cream w-6 text-center">{getQty(p.id)}</span>
              <button className="touch-target w-10 h-10 rounded-full border border-retro-amber/40 text-retro-cream text-lg" onClick={() => addAddOn({ productId: p.id, name: p.name, price: p.price, qty: 1 })}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <button className="touch-target px-10 py-4 border border-retro-amber/50 text-retro-cream font-body rounded-full" onClick={goBack}>← Kembali</button>
        <button className="touch-target px-10 py-4 bg-retro-amber text-retro-brown font-body font-semibold rounded-full" onClick={goNext}>Lanjut →</button>
      </div>
    </motion.div>
  )
}
