import { apiClient, BaseResponse } from './apiClient'
import { Product } from './productService';

export interface CreateTransactionRequest {
  items: Array<{ productId: string; qty: number }>
  extraPrintQty: number
  voucherCode?: string
  totalAmount: number
}

export interface CreateTransactionRequestv2 {
  items: Product[]
  voucherCode: string
  totalPrint: number
}

export interface TransactionResponse {
  transactionId: string
  amount: number
  qrisPayload: string
  qrisImageUrl: string
  expiresAt: string
}

export interface TransactionResult {
  invoiceNumber: string
  items: Product[]
  totalAmount: number
  voucherCode: string
  voucherDiscount: number
  finalAmount: number
  qrContent: string
  expiredAt: string
  totalPrint: number
  status: "PENDING" | "SUCCESS" | "EXPIRED" | "FAILED"
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'FAILED'

export interface CreateTransactionStatusRequest {
  invoiceNumber: string
}

export interface TransactionStatusResult {
  status: PaymentStatus
  cek: boolean
  expiredAt: string
  nextPollMs: number
}

export async function createTransactionv2(req: CreateTransactionRequestv2): Promise<BaseResponse<TransactionResult>> {
  try {
    const res = await apiClient.post<BaseResponse<TransactionResult>>('/payments/qris/order', req)
    return res.data
  } catch (error) {
    throw error
  }
}

export async function createTransactionTunai(req: CreateTransactionRequestv2): Promise<BaseResponse<TransactionResult>> {
  try {
    const res = await apiClient.post<BaseResponse<TransactionResult>>('/payments/qris/tunai', req)
    return res.data
  } catch (error) {
    throw error
  }
}
export async function createTransaction(req: CreateTransactionRequest): Promise<TransactionResponse> {
  try {
    const res = await apiClient.post<TransactionResponse>('/transactions/create', req)
    return res.data
  } catch (error) {
    throw error
  }
}

export async function getTransactionStatus(req: CreateTransactionStatusRequest): Promise<BaseResponse<TransactionStatusResult>> {
  try {
    const res = await apiClient.post<BaseResponse<TransactionStatusResult>>(`/transactions/payment-status`, req)
    return res.data
  } catch (error) {
    throw error
  }
}
