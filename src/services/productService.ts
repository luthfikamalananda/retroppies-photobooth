import { apiClient } from './apiClient'
import { USE_MOCK } from '@/mocks/mockFlag'
import { mockGetProducts } from '@/mocks/data/products.mock'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  type: 'bundle' | 'addon'
  imageUrl?: string
}

export async function getProducts(type?: 'bundle' | 'addon'): Promise<Product[]> {
  if (USE_MOCK) return mockGetProducts(type)
  const params = type ? { type } : {}
  const res = await apiClient.get<Product[]>('/products', { params })
  return res.data
}
