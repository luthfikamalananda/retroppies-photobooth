import { mockDelay } from '../mockFlag'
import type { TemplateInfo } from '@/store/layoutStore'

const MOCK_TEMPLATES: TemplateInfo[] = [
  {
    id: 'tpl-classic',
    name: 'Classic Strip',
    slotCount: 4,
    thumbnailUrl: '',
  },
  {
    id: 'tpl-lana',
    name: 'Lana Style',
    slotCount: 4,
    thumbnailUrl: '',
  },
  {
    id: 'tpl-grid',
    name: 'Grid 2×2',
    slotCount: 4,
    thumbnailUrl: '',
  },
  {
    id: 'tpl-wide',
    name: 'Wide 3+1',
    slotCount: 4,
    thumbnailUrl: '',
  },
]

export async function mockGetTemplates(): Promise<TemplateInfo[]> {
  await mockDelay(500)
  return MOCK_TEMPLATES
}
