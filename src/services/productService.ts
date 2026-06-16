import { apiClient, BaseResponse } from './apiClient'

export interface Product {
  id: number
  productCode: string
  productName: string
  productPrice: number
  productPhoto: string
  tenantId: number
  tenantName: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  productType: 'bundling' | 'addon' | 'print'
}

export interface ResultProduct {
  total: number
  products: Product[]
}

export interface ProductListParams {
  tenantId: number;
  keyword: string;
  page: number;
  limit: number;
}



export async function getProducts(params: ProductListParams): Promise<BaseResponse<ResultProduct>> {
  try {
    const res = await apiClient.post<BaseResponse<ResultProduct>>('/products/get', params)
    return res.data
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}
