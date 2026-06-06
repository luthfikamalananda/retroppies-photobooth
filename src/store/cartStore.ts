import { Product } from '@/services/productService'
import { create } from 'zustand'

export interface CartProduct {
  productId: string
  name: string
  price: number
  qty: number
}

export interface VoucherResult {
  code: string
  discountType: 'percent' | 'flat'
  discountValue: number
  discountAmount: number
}

interface CartState {
  productBundle: Product | null
  setProductBundle: (product: Product | null) => void

  productPrint: Product[]
  setProductPrint: (product: Product[]) => void

  productAddOns: Product[]
  setProductAddOns: (products: Product[]) => void

  voucher: VoucherResult | null
  setVoucher: (voucher: VoucherResult | null) => void

  clearCart: () => void
}

// function calcSubtotal(pkg: CartProduct | null, addOns: CartProduct[], extraPrintQty: number): number {
//   const pkgTotal = pkg ? pkg.price : 0
//   const addOnTotal = addOns.reduce((acc, a) => acc + a.price * a.qty, 0)
//   // Extra print price would be factored in by the backend; keep 0 for now
//   return pkgTotal + addOnTotal
// }

export const useCartStore = create<CartState>((set) => ({

  productBundle: null,
  setProductBundle: (product) => set({ productBundle: product }),

  productPrint: [],
  setProductPrint: (product) => set({ productPrint: product }),

  productAddOns: [],
  setProductAddOns: (products) => set({ productAddOns: products }),

  voucher: null,
  setVoucher: (voucher) => set({ voucher }),

  clearCart: () => set({ productBundle: null, productPrint: [], productAddOns: [], voucher: null }),
}))
