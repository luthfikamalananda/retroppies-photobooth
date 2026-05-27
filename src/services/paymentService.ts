import { apiClient } from './apiClient'
import { USE_MOCK } from '@/mocks/mockFlag'
import { mockCreateTransaction, mockGetTransactionStatus } from '@/mocks/data/payment.mock'

export interface CreateTransactionRequest {
  items: Array<{ productId: string; qty: number }>
  extraPrintQty: number
  voucherCode?: string
  totalAmount: number
}

export interface TransactionResponse {
  transactionId: string
  amount: number
  qrisPayload: string
  qrisImageUrl: string
  expiresAt: string
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'

export interface TransactionStatusResponse {
  transactionId: string
  status: PaymentStatus
  paidAt: string | null
}

export async function createTransaction(req: CreateTransactionRequest): Promise<TransactionResponse> {
  if (USE_MOCK) return mockCreateTransaction(req)
  const res = await apiClient.post<TransactionResponse>('/transactions/create', req)
  return res.data
}

export async function getTransactionStatus(id: string): Promise<TransactionStatusResponse> {
  if (USE_MOCK) return mockGetTransactionStatus(id)
  const res = await apiClient.get<TransactionStatusResponse>(`/transactions/${id}/status`)
  return res.data
}
