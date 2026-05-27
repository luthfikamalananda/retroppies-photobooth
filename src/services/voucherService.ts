import { apiClient } from './apiClient'
import { USE_MOCK } from '@/mocks/mockFlag'
import { mockValidateVoucher } from '@/mocks/data/vouchers.mock'
import type { VoucherResult } from '@/store/cartStore'

interface ValidateRequest {
  code: string
  subtotal: number
}

export async function validateVoucher(req: ValidateRequest): Promise<VoucherResult> {
  if (USE_MOCK) return mockValidateVoucher(req)
  const res = await apiClient.post<VoucherResult & { valid: boolean }>('/vouchers/validate', req)
  return {
    code: req.code,
    discountType: res.data.discountType,
    discountValue: res.data.discountValue,
    discountAmount: res.data.discountAmount,
  }
}
