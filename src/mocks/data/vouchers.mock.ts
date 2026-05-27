import { mockDelay } from '../mockFlag'
import type { VoucherResult } from '@/store/cartStore'

interface ValidateRequest {
  code: string
  subtotal: number
}

const MOCK_VOUCHERS: Record<string, Omit<VoucherResult, 'code'> & { minSubtotal?: number }> = {
  RETRO10: {
    discountType: 'percent',
    discountValue: 10,
    discountAmount: 0, // calculated below
  },
  HEMAT20K: {
    discountType: 'flat',
    discountValue: 20000,
    discountAmount: 20000,
    minSubtotal: 50000,
  },
  GRATIS: {
    discountType: 'percent',
    discountValue: 100,
    discountAmount: 0,
  },
}

export async function mockValidateVoucher(req: ValidateRequest): Promise<VoucherResult> {
  await mockDelay(600)

  const entry = MOCK_VOUCHERS[req.code.toUpperCase()]
  if (!entry) throw new Error('MOCK: Voucher tidak ditemukan')

  if (entry.minSubtotal && req.subtotal < entry.minSubtotal) {
    throw new Error(`MOCK: Minimum belanja Rp ${entry.minSubtotal.toLocaleString('id-ID')}`)
  }

  const discountAmount =
    entry.discountType === 'percent'
      ? Math.round((req.subtotal * entry.discountValue) / 100)
      : entry.discountAmount

  return {
    code: req.code.toUpperCase(),
    discountType: entry.discountType,
    discountValue: entry.discountValue,
    discountAmount,
  }
}
