import { apiClient } from './apiClient'
import { USE_MOCK } from '@/mocks/mockFlag'
import { mockFinalizeTransaction } from '@/mocks/data/finalize.mock'

interface FinalizeRequest {
  finalImage: Blob
  rawPhotos: Blob[]
  templateId: string
  filter: string
}

export async function finalizeTransaction(transactionId: string, req: FinalizeRequest): Promise<void> {
  if (USE_MOCK) return mockFinalizeTransaction()
  const form = new FormData()
  form.append('finalImage', req.finalImage, 'final.jpg')
  req.rawPhotos.forEach((p, i) => form.append('rawPhotos', p, `raw_${i}.jpg`))
  form.append('templateId', req.templateId)
  form.append('filter', req.filter)

  await apiClient.post(`/transactions/${transactionId}/finalize`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
