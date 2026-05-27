import { mockDelay } from '../mockFlag'

export async function mockFinalizeTransaction(): Promise<void> {
  await mockDelay(1200)
  // no-op in mock mode — just simulate success
}

export async function mockSendInvoice(): Promise<void> {
  await mockDelay(500)
  // no-op in mock mode
}
