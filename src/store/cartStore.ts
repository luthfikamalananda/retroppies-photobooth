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
  selectedPackage: CartProduct | null
  extraPrintQty: number
  addOns: CartProduct[]
  voucher: VoucherResult | null
  subtotal: number
  total: number

  setPackage: (product: CartProduct) => void
  setExtraPrintQty: (qty: number) => void
  addAddOn: (product: CartProduct) => void
  removeAddOn: (productId: string) => void
  setVoucher: (voucher: VoucherResult | null) => void
  clearCart: () => void
}

function calcSubtotal(pkg: CartProduct | null, addOns: CartProduct[], extraPrintQty: number): number {
  const pkgTotal = pkg ? pkg.price : 0
  const addOnTotal = addOns.reduce((acc, a) => acc + a.price * a.qty, 0)
  // Extra print price would be factored in by the backend; keep 0 for now
  return pkgTotal + addOnTotal
}

export const useCartStore = create<CartState>((set, get) => ({
  selectedPackage: null,
  extraPrintQty: 0,
  addOns: [],
  voucher: null,
  subtotal: 0,
  total: 0,

  setPackage: (product) => {
    const { addOns, extraPrintQty, voucher } = get()
    const subtotal = calcSubtotal(product, addOns, extraPrintQty)
    const discount = voucher?.discountAmount ?? 0
    set({ selectedPackage: product, subtotal, total: Math.max(0, subtotal - discount) })
  },

  setExtraPrintQty: (qty) => {
    const { selectedPackage, addOns, voucher } = get()
    const subtotal = calcSubtotal(selectedPackage, addOns, qty)
    const discount = voucher?.discountAmount ?? 0
    set({ extraPrintQty: qty, subtotal, total: Math.max(0, subtotal - discount) })
  },

  addAddOn: (product) => {
    const { addOns, selectedPackage, extraPrintQty, voucher } = get()
    const existing = addOns.find(a => a.productId === product.productId)
    const updated = existing
      ? addOns.map(a => a.productId === product.productId ? { ...a, qty: a.qty + 1 } : a)
      : [...addOns, { ...product, qty: 1 }]
    const subtotal = calcSubtotal(selectedPackage, updated, extraPrintQty)
    const discount = voucher?.discountAmount ?? 0
    set({ addOns: updated, subtotal, total: Math.max(0, subtotal - discount) })
  },

  removeAddOn: (productId) => {
    const { addOns, selectedPackage, extraPrintQty, voucher } = get()
    const updated = addOns
      .map(a => a.productId === productId ? { ...a, qty: Math.max(0, a.qty - 1) } : a)
      .filter(a => a.qty > 0)
    const subtotal = calcSubtotal(selectedPackage, updated, extraPrintQty)
    const discount = voucher?.discountAmount ?? 0
    set({ addOns: updated, subtotal, total: Math.max(0, subtotal - discount) })
  },

  setVoucher: (voucher) => {
    const { subtotal } = get()
    const discount = voucher?.discountAmount ?? 0
    set({ voucher, total: Math.max(0, subtotal - discount) })
  },

  clearCart: () =>
    set({ selectedPackage: null, extraPrintQty: 0, addOns: [], voucher: null, subtotal: 0, total: 0 }),
}))
