import { apiClient, BaseResponse } from './apiClient'

interface ValidateRequest {
  code: string
  amount: number
  tenantId: number
}

export interface VoucherResult {
  discount: number
  finalPrice: number
}

export async function validateVoucher(req: ValidateRequest): Promise<BaseResponse<VoucherResult>> {
  // if (USE_MOCK) return mockValidateVoucher(req)
  const res = await apiClient.post<BaseResponse<VoucherResult>>('/voucher/apply-v2', req)
  try {
    return res.data
  } catch (error) {
    throw error
  }
}
