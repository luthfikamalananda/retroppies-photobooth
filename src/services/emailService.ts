import { apiClient } from './apiClient'

interface SendInvoiceRequest {
  transactionId: string
  email: string
}

export async function sendInvoice(req: SendInvoiceRequest): Promise<void> {
  await apiClient.post('/email/send-invoice', req)
}
