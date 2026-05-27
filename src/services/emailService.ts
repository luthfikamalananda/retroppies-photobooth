import { apiClient } from './apiClient'
import { USE_MOCK } from '@/mocks/mockFlag'
import { mockSendInvoice } from '@/mocks/data/finalize.mock'

interface SendInvoiceRequest {
  transactionId: string
  email: string
}

export async function sendInvoice(req: SendInvoiceRequest): Promise<void> {
  if (USE_MOCK) return mockSendInvoice()
  await apiClient.post('/email/send-invoice', req)
}
