import { mockDelay } from '../mockFlag'
import type { Product } from '@/services/productService'

const MOCK_BUNDLES: Product[] = [
  {
    id: 'bundle-1',
    name: 'Classic 4',
    description: '4 foto, 1 strip print',
    price: 35000,
    type: 'bundle',
  },
  {
    id: 'bundle-2',
    name: 'Premium 4',
    description: '4 foto, 2 strip print + digital',
    price: 55000,
    type: 'bundle',
  },
  {
    id: 'bundle-3',
    name: 'Vintage Duo',
    description: '4 foto, 2 strip, efek VHS eksklusif',
    price: 75000,
    type: 'bundle',
  },
]

const MOCK_ADDONS: Product[] = [
  {
    id: 'addon-1',
    name: 'Keychain',
    description: 'Gantungan kunci foto',
    price: 15000,
    type: 'addon',
  },
  {
    id: 'addon-2',
    name: 'Sticker Set',
    description: '6 stiker foto mini',
    price: 10000,
    type: 'addon',
  },
  {
    id: 'addon-3',
    name: 'Digital Copy',
    description: 'File digital resolusi tinggi',
    price: 12000,
    type: 'addon',
  },
  {
    id: 'addon-4',
    name: 'Frame Akrilik',
    description: 'Pigura akrilik 10x15cm',
    price: 25000,
    type: 'addon',
  },
]

export async function mockGetProducts(type?: 'bundle' | 'addon'): Promise<Product[]> {
  await mockDelay(700)
  if (type === 'bundle') return MOCK_BUNDLES
  if (type === 'addon') return MOCK_ADDONS
  return [...MOCK_BUNDLES, ...MOCK_ADDONS]
}
