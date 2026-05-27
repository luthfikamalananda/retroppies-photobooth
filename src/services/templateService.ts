import { apiClient } from './apiClient'
import { USE_MOCK } from '@/mocks/mockFlag'
import { mockGetTemplates } from '@/mocks/data/templates.mock'
import type { TemplateInfo } from '@/store/layoutStore'

export async function getTemplates(): Promise<TemplateInfo[]> {
  if (USE_MOCK) return mockGetTemplates()
  const res = await apiClient.get<TemplateInfo[]>('/templates')
  return res.data
}
