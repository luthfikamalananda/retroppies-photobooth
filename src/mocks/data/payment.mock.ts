import { mockDelay } from '../mockFlag'
import type {
  CreateTransactionRequest,
  TransactionResponse,
  TransactionStatusResponse,
} from '@/services/paymentService'

let autoPayAfterMs = 8000 // simulate payment after 8s by default
const pendingTx = new Map<string, { createdAt: number }>()

export async function mockCreateTransaction(
  req: CreateTransactionRequest
): Promise<TransactionResponse> {
  await mockDelay(900)

  const txId = `mock-trx-${Date.now()}`
  pendingTx.set(txId, { createdAt: Date.now() })

  return {
    transactionId: txId,
    amount: req.totalAmount,
    // Static QRIS demo image (public domain QR placeholder)
    qrisPayload: '000201010212...(mock)',
    qrisImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${txId}`,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  }
}

export async function mockGetTransactionStatus(
  id: string
): Promise<TransactionStatusResponse> {
  await mockDelay(300)

  const tx = pendingTx.get(id)
  if (!tx) return { transactionId: id, status: 'FAILED', paidAt: null }

  const elapsed = Date.now() - tx.createdAt
  if (elapsed >= autoPayAfterMs) {
    return {
      transactionId: id,
      status: 'PAID',
      paidAt: new Date().toISOString(),
    }
  }

  return { transactionId: id, status: 'PENDING', paidAt: null }
}

/** Call this in tests/dev tools to change when auto-pay triggers */
export function setMockAutoPayDelay(ms: number) {
  autoPayAfterMs = ms
}
